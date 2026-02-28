import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { verifyTwitchWebhook } from "@/lib/integrations/twitch";

// POST - Handle Twitch EventSub webhooks
export async function POST(request: NextRequest) {
  try {
    const messageId = request.headers.get("Twitch-Eventsub-Message-Id");
    const timestamp = request.headers.get("Twitch-Eventsub-Message-Timestamp");
    const signature = request.headers.get("Twitch-Eventsub-Message-Signature");
    const messageType = request.headers.get("Twitch-Eventsub-Message-Type");

    if (!messageId || !timestamp || !signature) {
      return NextResponse.json(
        { error: "Missing headers" },
        { status: 400 }
      );
    }

    const body = await request.text();

    // Verify signature
    const isValid = verifyTwitchWebhook(messageId, timestamp, body, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const payload = JSON.parse(body);

    // Handle webhook verification challenge
    if (messageType === "webhook_callback_verification") {
      return new NextResponse(payload.challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Handle notification
    if (messageType === "notification") {
      const subscriptionType = payload.subscription.type;
      const event = payload.event;

      const db = createClient();

      switch (subscriptionType) {
        case "stream.online": {
          // Stream started
          await db.rpc("update_stream_status", {
            p_twitch_id: event.broadcaster_user_id,
            p_status: "live",
            p_title: null, // Will be updated by periodic sync
            p_game_name: null,
            p_viewer_count: 0,
          });

          console.log(`Stream online: ${event.broadcaster_user_login}`);
          break;
        }

        case "stream.offline": {
          // Stream ended
          await db.rpc("update_stream_status", {
            p_twitch_id: event.broadcaster_user_id,
            p_status: "offline",
            p_title: null,
            p_game_name: null,
            p_viewer_count: 0,
          });

          console.log(`Stream offline: ${event.broadcaster_user_login}`);
          break;
        }

        case "channel.update": {
          // Channel info updated (title, game, etc.)
          await db
            .from("streamer_profiles")
            .update({
              stream_title: event.title,
              stream_game_name: event.category_name,
              stream_game_id: event.category_id,
              stream_language: event.language,
              updated_at: new Date().toISOString(),
            })
            .eq("twitch_id", event.broadcaster_user_id);

          console.log(`Channel updated: ${event.broadcaster_user_login}`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${subscriptionType}`);
      }
    }

    // Handle revocation
    if (messageType === "revocation") {
      const subscriptionId = payload.subscription.id;

      const db = createClient();
      await db
        .from("twitch_eventsub_subscriptions")
        .update({ status: "revoked" })
        .eq("twitch_subscription_id", subscriptionId);

      console.log(`Subscription revoked: ${subscriptionId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twitch webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
