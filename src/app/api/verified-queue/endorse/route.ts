import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { EndorsePlayerRequest } from "@/types/verified-queue";
import {
import { getUser } from "@/lib/auth/get-user";
  ENDORSEMENT_TYPES,
  getBehaviorRating,
  calculateNewScore,
} from "@/types/verified-queue";

// POST - Endorse a player
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EndorsePlayerRequest = await request.json();

    // Validate endorsement type
    if (!ENDORSEMENT_TYPES[body.type]) {
      return NextResponse.json(
        { error: "Invalid endorsement type" },
        { status: 400 }
      );
    }

    // Can't endorse yourself
    if (body.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot endorse yourself" },
        { status: 400 }
      );
    }

    // Check if already endorsed recently (within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: recentEndorsement } = await db
      .from("player_endorsements")
      .select("id")
      .eq("from_user_id", user.id)
      .eq("to_user_id", body.user_id)
      .gte("created_at", oneDayAgo.toISOString())
      .single();

    if (recentEndorsement) {
      return NextResponse.json(
        { error: "You already endorsed this player recently" },
        { status: 400 }
      );
    }

    // Create endorsement
    const { data: endorsement, error: endorseError } = await db
      .from("player_endorsements")
      .insert({
        from_user_id: user.id,
        to_user_id: body.user_id,
        game_id: body.game_id,
        session_id: body.session_id || null,
        type: body.type,
        note: body.note?.substring(0, 200) || null,
      })
      .select()
      .single();

    if (endorseError) {
      throw endorseError;
    }

    // Update recipient's behavior score
    const { data: recipientProfile } = await db
      .from("verified_profiles")
      .select("behavior_score, positive_endorsements, games_played")
      .eq("user_id", body.user_id)
      .single();

    if (recipientProfile) {
      const points = ENDORSEMENT_TYPES[body.type].points;
      const totalInteractions =
        recipientProfile.positive_endorsements + recipientProfile.games_played;
      const newScore = calculateNewScore(
        recipientProfile.behavior_score,
        points,
        totalInteractions
      );

      await db
        .from("verified_profiles")
        .update({
          behavior_score: newScore,
          behavior_rating: getBehaviorRating(newScore),
          positive_endorsements: recipientProfile.positive_endorsements + 1,
          last_behavior_update: new Date().toISOString(),
        })
        .eq("user_id", body.user_id);
    }

    return NextResponse.json({
      endorsement,
      message: "Endorsement sent successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Endorse player error:", error);
    return NextResponse.json(
      { error: "Failed to endorse player" },
      { status: 500 }
    );
  }
}
