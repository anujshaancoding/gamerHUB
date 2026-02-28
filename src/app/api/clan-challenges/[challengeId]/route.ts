import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { ClanChallenge, ClanMember } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ challengeId: string }>;
}

// GET - Get challenge details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { challengeId } = await params;
    const db = createClient();

    const { data, error } = await db
      .from("clan_challenges")
      .select(
        `
        *,
        challenger_clan:clans!clan_challenges_challenger_clan_id_fkey(
          *,
          clan_members(count)
        ),
        challenged_clan:clans!clan_challenges_challenged_clan_id_fkey(
          *,
          clan_members(count)
        ),
        winner_clan:clans!clan_challenges_winner_clan_id_fkey(*),
        game:games(*),
        conversation:conversations(*)
      `
      )
      .eq("id", challengeId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ challenge: data });
  } catch (error) {
    console.error("Challenge fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update challenge (accept, update status, record result)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { challengeId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, status, winner_clan_id, result, scheduled_at } = body;

    // Get current challenge
    const { data: challengeData } = await db
      .from("clan_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    const challenge = challengeData as unknown as ClanChallenge | null;

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Check user's clan membership
    const { data: memberships } = await db
      .from("clan_members")
      .select("clan_id, role")
      .eq("user_id", user.id)
      .in("clan_id", [
        challenge.challenger_clan_id,
        challenge.challenged_clan_id,
      ].filter(Boolean) as string[]);

    const userMembership = memberships?.[0] as unknown as Pick<ClanMember, "clan_id" | "role"> | undefined;

    if (
      !userMembership ||
      !["leader", "co_leader", "officer"].includes(userMembership.role)
    ) {
      return NextResponse.json(
        { error: "Only clan officers can update challenges" },
        { status: 403 }
      );
    }

    const isChallenger = userMembership.clan_id === challenge.challenger_clan_id;
    const isChallenged = userMembership.clan_id === challenge.challenged_clan_id;

    // Handle different actions
    if (action === "accept") {
      if (!isChallenged) {
        return NextResponse.json(
          { error: "Only the challenged clan can accept" },
          { status: 403 }
        );
      }

      if (challenge.status !== "pending" && challenge.status !== "open") {
        return NextResponse.json(
          { error: "Challenge cannot be accepted in current state" },
          { status: 400 }
        );
      }

      // If it's an open challenge, set the challenged clan
      const updates: Record<string, unknown> = {
        status: "accepted",
      };

      if (challenge.status === "open") {
        updates.challenged_clan_id = userMembership.clan_id;
      }

      const { data, error } = await db
        .from("clan_challenges")
        .update(updates as never)
        .eq("id", challengeId)
        .select()
        .single();

      if (error) {
        console.error("Failed to accept challenge:", error);
        return NextResponse.json(
          { error: "Failed to accept challenge" },
          { status: 500 }
        );
      }

      // Log activity for both clans
      await db.from("clan_activity_log").insert([
        {
          clan_id: challenge.challenger_clan_id,
          user_id: user.id,
          activity_type: "challenge_created",
          description: "Challenge was accepted",
          metadata: { challenge_id: challengeId },
        },
        {
          clan_id: userMembership.clan_id,
          user_id: user.id,
          activity_type: "challenge_created",
          description: "Accepted a challenge",
          metadata: { challenge_id: challengeId },
        },
      ] as never);

      return NextResponse.json({ challenge: data });
    }

    if (action === "decline") {
      if (!isChallenged) {
        return NextResponse.json(
          { error: "Only the challenged clan can decline" },
          { status: 403 }
        );
      }

      if (challenge.status !== "pending") {
        return NextResponse.json(
          { error: "Challenge cannot be declined in current state" },
          { status: 400 }
        );
      }

      const { data, error } = await db
        .from("clan_challenges")
        .update({ status: "cancelled" } as never)
        .eq("id", challengeId)
        .select()
        .single();

      if (error) {
        console.error("Failed to decline challenge:", error);
        return NextResponse.json(
          { error: "Failed to decline challenge" },
          { status: 500 }
        );
      }

      return NextResponse.json({ challenge: data });
    }

    // Generic status update
    const updates: Record<string, unknown> = {};

    if (status) {
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        open: ["pending", "cancelled"],
        pending: ["accepted", "cancelled"],
        accepted: ["in_progress", "cancelled"],
        in_progress: ["completed", "cancelled"],
      };

      if (
        !validTransitions[challenge.status]?.includes(status) &&
        status !== challenge.status
      ) {
        return NextResponse.json(
          { error: `Cannot transition from ${challenge.status} to ${status}` },
          { status: 400 }
        );
      }

      updates.status = status;
    }

    if (winner_clan_id !== undefined) {
      if (challenge.status !== "in_progress" && status !== "completed") {
        return NextResponse.json(
          { error: "Can only set winner when completing challenge" },
          { status: 400 }
        );
      }

      // Validate winner is one of the clans
      if (
        winner_clan_id &&
        winner_clan_id !== challenge.challenger_clan_id &&
        winner_clan_id !== challenge.challenged_clan_id
      ) {
        return NextResponse.json(
          { error: "Winner must be one of the participating clans" },
          { status: 400 }
        );
      }

      updates.winner_clan_id = winner_clan_id;
      updates.status = "completed";

      // Log win/loss for both clans
      if (winner_clan_id) {
        const loserClanId =
          winner_clan_id === challenge.challenger_clan_id
            ? challenge.challenged_clan_id
            : challenge.challenger_clan_id;

        await db.from("clan_activity_log").insert([
          {
            clan_id: winner_clan_id,
            user_id: user.id,
            activity_type: "challenge_won",
            description: "Won a clan challenge",
            metadata: { challenge_id: challengeId },
          },
          {
            clan_id: loserClanId,
            user_id: user.id,
            activity_type: "challenge_lost",
            description: "Lost a clan challenge",
            metadata: { challenge_id: challengeId },
          },
        ] as never);
      }
    }

    if (result !== undefined) {
      updates.result = result;
    }

    if (scheduled_at !== undefined) {
      updates.scheduled_at = scheduled_at;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("clan_challenges")
      .update(updates as never)
      .eq("id", challengeId)
      .select(
        `
        *,
        challenger_clan:clans!clan_challenges_challenger_clan_id_fkey(*),
        challenged_clan:clans!clan_challenges_challenged_clan_id_fkey(*),
        winner_clan:clans!clan_challenges_winner_clan_id_fkey(*),
        game:games(*)
      `
      )
      .single();

    if (error) {
      console.error("Failed to update challenge:", error);
      return NextResponse.json(
        { error: "Failed to update challenge" },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge: data });
  } catch (error) {
    console.error("Update challenge error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel challenge
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { challengeId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get challenge
    const { data: challengeData } = await db
      .from("clan_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    const challenge = challengeData as unknown as ClanChallenge | null;

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Only challenger clan officers can delete
    const { data: membership } = await db
      .from("clan_members")
      .select("role")
      .eq("clan_id", challenge.challenger_clan_id)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
      return NextResponse.json(
        { error: "Only challenger clan officers can delete challenges" },
        { status: 403 }
      );
    }

    // Can only delete if not in progress or completed
    if (["in_progress", "completed"].includes(challenge.status)) {
      return NextResponse.json(
        { error: "Cannot delete challenge in progress or completed" },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("clan_challenges")
      .delete()
      .eq("id", challengeId);

    if (error) {
      console.error("Failed to delete challenge:", error);
      return NextResponse.json(
        { error: "Failed to delete challenge" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete challenge error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
