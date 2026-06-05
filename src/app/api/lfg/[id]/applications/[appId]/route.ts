import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { trackEvent } from "@/lib/analytics/track-event";
import { FUNNEL_EVENTS, ACTIVATION_SOURCES } from "@/lib/analytics/sources";
import { emitToUser } from "@/lib/realtime/socket-server";

interface RouteParams {
  params: Promise<{ id: string; appId: string }>;
}

/**
 * Find or create the direct conversation between two users.
 * Mirrors the find-or-create logic in `messages/conversations/route.ts:198-234`.
 */
async function getOrCreateDirectConversation(
  admin: ReturnType<typeof createAdminClient>,
  userA: string,
  userB: string
): Promise<string> {
  const existing = await admin.sql.unsafe(
    `SELECT c.id
       FROM conversations c
       WHERE c.type = 'direct'
         AND EXISTS (
           SELECT 1 FROM conversation_participants cp1
           WHERE cp1.conversation_id = c.id AND cp1.user_id = $1
         )
         AND EXISTS (
           SELECT 1 FROM conversation_participants cp2
           WHERE cp2.conversation_id = c.id AND cp2.user_id = $2
         )
         AND (
           SELECT COUNT(*) FROM conversation_participants cp3
           WHERE cp3.conversation_id = c.id
         ) = 2
       LIMIT 1`,
    [userA, userB]
  );

  if (existing.length > 0) {
    return existing[0].id as string;
  }

  const convResult = await admin.sql.unsafe(
    `INSERT INTO conversations (type) VALUES ('direct') RETURNING id`,
    []
  );
  const newConvId = convResult[0].id as string;

  await admin.sql.unsafe(
    `INSERT INTO conversation_participants (conversation_id, user_id)
       VALUES ($1, $2), ($1, $3)`,
    [newConvId, userA, userB]
  );

  return newConvId;
}

// PATCH - Accept or decline application
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId, appId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the post
    const { data: post, error: postError } = await db
      .from("lfg_posts")
      .select(
        `
        id, creator_id, status, current_players, max_players, game_id, game_mode, region,
        creator:profiles!lfg_posts_creator_id_fkey(id, username, display_name),
        game:games!lfg_posts_game_id_fkey(id, name)
      `
      )
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "LFG post not found" },
        { status: 404 }
      );
    }

    if (post.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to manage applications for this post" },
        { status: 403 }
      );
    }

    // Get the application
    const { data: application } = await db
      .from("lfg_applications")
      .select("id, status, applicant_id")
      .eq("id", appId)
      .eq("post_id", postId)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!["accepted", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'accepted' or 'declined'" },
        { status: 400 }
      );
    }

    // If accepting, check if there's room
    if (status === "accepted" && post.current_players >= post.max_players) {
      return NextResponse.json(
        { error: "Post is already full" },
        { status: 400 }
      );
    }

    // Update application
    const { data: updatedApp, error: updateError } = await db
      .from("lfg_applications")
      .update({
        status,
        responded_at: new Date().toISOString(),
      } as never)
      .eq("id", appId)
      .select(
        `
        *,
        applicant:profiles!lfg_applications_applicant_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    // Note: The trigger in the database will handle updating current_players count

    let conversationId: string | null = null;

    if (status === "accepted") {
      const applicantId =
        (updatedApp as { applicant?: { id?: string } } | null)?.applicant?.id ??
        application.applicant_id;
      const gameId = (post as { game_id?: string | null }).game_id ?? null;
      const creatorProfile = (
        post as {
          creator?: { display_name?: string | null; username?: string | null };
        }
      ).creator;
      const gameName =
        (post as { game?: { name?: string | null } }).game?.name ?? "your game";
      const gameMode = (post as { game_mode?: string | null }).game_mode;
      const region = (post as { region?: string | null }).region;

      if (applicantId) {
        // ── Fix 2: bridge the new match into the real inbox (no Void) ──
        // Option A (Atlas-approved): auto-create a mutual follow so the pair are
        // "squadmates". The Void test (conversations/route.ts:140-149) then
        // classifies the DM as inbox automatically. No schema migration.
        try {
          const admin = createAdminClient();

          // Idempotent mutual follow — both directions.
          await admin.sql.unsafe(
            `INSERT INTO follows (follower_id, following_id)
               VALUES ($1, $2), ($2, $1)
             ON CONFLICT DO NOTHING`,
            [post.creator_id, applicantId]
          );

          // Find or create the DM and seed a system greeting.
          conversationId = await getOrCreateDirectConversation(
            admin,
            post.creator_id,
            applicantId
          );

          const greetingParts = [gameName, gameMode, region].filter(Boolean);
          const greeting = `You matched for ${greetingParts.join(" • ")} — say hi 👋`;

          await admin.sql.unsafe(
            `INSERT INTO messages (conversation_id, sender_id, content, type)
               VALUES ($1, $2, $3, 'system')`,
            [conversationId, post.creator_id, greeting]
          );

          await admin.sql.unsafe(
            `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
            [conversationId]
          );
        } catch (convError) {
          // Never fail the accept on messaging-bridge error.
          console.error("Failed to create LFG match conversation:", convError);
        }

        // ── Fix 3: notify the applicant they were accepted ──
        try {
          const admin = createAdminClient();
          const creatorName =
            creatorProfile?.display_name ||
            creatorProfile?.username ||
            "The host";
          const actionUrl = conversationId
            ? `/messages/${conversationId}`
            : `/messages`;
          await admin.from("notifications").insert({
            user_id: applicantId,
            type: "lfg_accepted",
            title: `You're in! ${creatorName} accepted you`,
            icon: "✅",
            action_url: actionUrl,
            action_label: "Say hi",
            metadata: {
              post_id: postId,
              conversation_id: conversationId,
              with_user_id: post.creator_id,
            },
            is_read: false,
            is_archived: false,
          });
          emitToUser(applicantId, "notification:new", {
            type: "lfg_accepted",
            title: `You're in! ${creatorName} accepted you`,
            action_url: actionUrl,
          });
        } catch (notifError) {
          console.error("Failed to create accept notification:", notifError);
        }

        // Activation event ("found a teammate") — fire for BOTH users.
        // Fire-and-forget; analytics must never break the request.
        void trackEvent(
          applicantId,
          FUNNEL_EVENTS.activation,
          ACTIVATION_SOURCES.lfg_accept,
          { post_id: postId, with_user_id: post.creator_id, game_id: gameId }
        );
        void trackEvent(
          post.creator_id,
          FUNNEL_EVENTS.activation,
          ACTIVATION_SOURCES.lfg_accept,
          { post_id: postId, with_user_id: applicantId, game_id: gameId }
        );
      }
    }

    return NextResponse.json({ application: updatedApp, conversationId });
  } catch (error) {
    console.error("LFG application update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
