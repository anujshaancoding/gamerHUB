import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Get user's Discord webhooks
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: webhooks, error } = await db
      .from("discord_webhooks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get webhooks error:", error);
      return NextResponse.json(
        { error: "Failed to get webhooks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Get webhooks error:", error);
    return NextResponse.json(
      { error: "Failed to get webhooks" },
      { status: 500 }
    );
  }
}

// POST - Add a new webhook
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { webhook_url, guild_id, guild_name, channel_id, channel_name } = body;

    // Validate webhook URL format
    const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/(\d+)\/([A-Za-z0-9_-]+)$/;
    const match = webhook_url?.match(webhookRegex);

    if (!match) {
      return NextResponse.json(
        { error: "Invalid webhook URL format" },
        { status: 400 }
      );
    }

    const [, webhook_id, webhook_token] = match;

    // Verify the webhook is valid by making a test request
    try {
      const verifyResponse = await fetch(`${webhook_url}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "✅ GamerHub webhook connected successfully! You can delete this message.",
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Webhook verification failed");
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to verify webhook. Please check the URL." },
        { status: 400 }
      );
    }

    // Check for existing webhook for this channel
    const { data: existing } = await db
      .from("discord_webhooks")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_id", channel_id)
      .single();

    if (existing) {
      // Update existing webhook
      const { data: updated, error: updateError } = await db
        .from("discord_webhooks")
        .update({
          webhook_url,
          webhook_id,
          webhook_token,
          guild_name,
          channel_name,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update webhook error:", updateError);
        return NextResponse.json(
          { error: "Failed to update webhook" },
          { status: 500 }
        );
      }

      return NextResponse.json({ webhook: updated, updated: true });
    }

    // Insert new webhook
    const { data: webhook, error: insertError } = await db
      .from("discord_webhooks")
      .insert({
        user_id: user.id,
        webhook_url,
        webhook_id,
        webhook_token,
        guild_id,
        guild_name,
        channel_id,
        channel_name,
        is_active: true,
        post_lfg: true,
        post_tournaments: true,
        post_clan_recruitment: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert webhook error:", insertError);
      return NextResponse.json(
        { error: "Failed to add webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhook, created: true });
  } catch (error) {
    console.error("Add webhook error:", error);
    return NextResponse.json(
      { error: "Failed to add webhook" },
      { status: 500 }
    );
  }
}

// PATCH - Update webhook settings
export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { webhook_id, ...updates } = body;

    if (!webhook_id) {
      return NextResponse.json(
        { error: "Webhook ID required" },
        { status: 400 }
      );
    }

    // Only allow certain fields to be updated
    const allowedFields = ["is_active", "post_lfg", "post_tournaments", "post_clan_recruitment"];
    const filteredUpdates: Record<string, boolean> = {};

    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field];
      }
    }

    const { data: webhook, error } = await db
      .from("discord_webhooks")
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhook_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Update webhook error:", error);
      return NextResponse.json(
        { error: "Failed to update webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error("Update webhook error:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a webhook
export async function DELETE(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("id");

    if (!webhookId) {
      return NextResponse.json(
        { error: "Webhook ID required" },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("discord_webhooks")
      .delete()
      .eq("id", webhookId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete webhook error:", error);
      return NextResponse.json(
        { error: "Failed to delete webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete webhook error:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
