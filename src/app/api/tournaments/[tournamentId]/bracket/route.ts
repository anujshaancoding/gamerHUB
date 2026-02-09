// @ts-nocheck
// TypeScript checking disabled due to incomplete Supabase type definitions
// TODO: Regenerate types with `supabase gen types typescript`
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

// Generate standard tournament seeding order (1v16, 8v9, etc.)
function generateSeedOrder(teamCount: number): number[] {
  const order: number[] = [1];
  let size = 1;

  while (size < teamCount) {
    const newOrder: number[] = [];
    for (const seed of order) {
      newOrder.push(seed);
      newOrder.push(size * 2 + 1 - seed);
    }
    order.length = 0;
    order.push(...newOrder);
    size *= 2;
  }

  return order;
}

// Shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const supabase = await createClient();

    // Get matches with team info
    const { data: matches, error } = await supabase
      .from("tournament_matches")
      .select(
        `
        *,
        team1:tournament_participants!tournament_matches_team1_id_fkey(
          id, seed, status, total_wins, total_losses,
          clan:clans(id, name, tag, avatar_url)
        ),
        team2:tournament_participants!tournament_matches_team2_id_fkey(
          id, seed, status, total_wins, total_losses,
          clan:clans(id, name, tag, avatar_url)
        ),
        winner:tournament_participants!tournament_matches_winner_id_fkey(
          id, seed,
          clan:clans(id, name, tag, avatar_url)
        )
      `
      )
      .eq("tournament_id", tournamentId)
      .order("bracket_type")
      .order("round")
      .order("match_number");

    if (error) {
      console.error("Error fetching bracket:", error);
      return NextResponse.json(
        { error: "Failed to fetch bracket" },
        { status: 500 }
      );
    }

    // Get tournament bracket_data for additional info
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("bracket_data, format, settings")
      .eq("id", tournamentId)
      .single();

    return NextResponse.json({
      matches: matches || [],
      bracket_data: tournament?.bracket_data || {},
      format: tournament?.format,
      settings: tournament?.settings,
    });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/bracket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tournament
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, organizer_user_id, organizer_clan_id, status, format, settings")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check permission
    let hasPermission = tournament.organizer_user_id === user.id;
    if (!hasPermission && tournament.organizer_clan_id) {
      const { data: membership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", tournament.organizer_clan_id)
        .eq("user_id", user.id)
        .single();

      hasPermission =
        membership && ["leader", "co_leader", "officer"].includes(membership.role);
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Not authorized to generate bracket" },
        { status: 403 }
      );
    }

    // Check tournament status
    if (!["registration", "seeding"].includes(tournament.status)) {
      return NextResponse.json(
        { error: "Bracket can only be generated during registration or seeding phase" },
        { status: 400 }
      );
    }

    // Get participants
    const { data: participants } = await supabase
      .from("tournament_participants")
      .select("id, clan_id, seed")
      .eq("tournament_id", tournamentId)
      .in("status", ["registered", "checked_in"]);

    if (!participants || participants.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 participants to generate bracket" },
        { status: 400 }
      );
    }

    // Delete existing matches
    await supabase
      .from("tournament_matches")
      .delete()
      .eq("tournament_id", tournamentId);

    // Seed participants
    const settings = tournament.settings as { seeding_method?: string } | null;
    const seedingMethod = settings?.seeding_method || "random";
    let seededParticipants = [...participants];

    if (seedingMethod === "random") {
      seededParticipants = shuffleArray(seededParticipants);
    } else if (seedingMethod === "manual") {
      seededParticipants.sort((a, b) => (a.seed || 999) - (b.seed || 999));
    }

    // Assign seeds
    for (let i = 0; i < seededParticipants.length; i++) {
      await supabase
        .from("tournament_participants")
        .update({ seed: i + 1 })
        .eq("id", seededParticipants[i].id);
      seededParticipants[i].seed = i + 1;
    }

    // Generate bracket based on format
    const matches: {
      tournament_id: string;
      round: number;
      match_number: number;
      bracket_type: string;
      team1_id: string | null;
      team2_id: string | null;
      status: string;
    }[] = [];

    if (tournament.format === "single_elimination") {
      const teamCount = seededParticipants.length;
      const rounds = Math.ceil(Math.log2(teamCount));
      const bracketSize = Math.pow(2, rounds);
      const seedOrder = generateSeedOrder(bracketSize);

      // Create participant map by seed
      const participantBySeed = new Map(
        seededParticipants.map((p) => [p.seed, p.id])
      );

      // First round matches
      const firstRoundMatchCount = bracketSize / 2;
      for (let i = 0; i < firstRoundMatchCount; i++) {
        const seed1 = seedOrder[i * 2];
        const seed2 = seedOrder[i * 2 + 1];
        const team1Id = participantBySeed.get(seed1) || null;
        const team2Id = participantBySeed.get(seed2) || null;

        // Handle byes
        let status = "pending";
        if (!team1Id && !team2Id) {
          status = "bye";
        } else if (!team1Id || !team2Id) {
          status = "bye";
        }

        matches.push({
          tournament_id: tournamentId,
          round: 1,
          match_number: i + 1,
          bracket_type: rounds === 1 ? "finals" : "winners",
          team1_id: team1Id,
          team2_id: team2Id,
          status,
        });
      }

      // Subsequent rounds (empty, to be filled by advancement)
      for (let round = 2; round <= rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round);
        const bracketType =
          round === rounds ? "finals" : "winners";

        for (let i = 0; i < matchesInRound; i++) {
          matches.push({
            tournament_id: tournamentId,
            round,
            match_number: i + 1,
            bracket_type: bracketType,
            team1_id: null,
            team2_id: null,
            status: "pending",
          });
        }
      }
    }

    // Insert matches
    const { data: insertedMatches, error: insertError } = await supabase
      .from("tournament_matches")
      .insert(matches)
      .select("id, round, match_number, bracket_type");

    if (insertError) {
      console.error("Error inserting matches:", insertError);
      return NextResponse.json(
        { error: "Failed to generate bracket" },
        { status: 500 }
      );
    }

    // Set up advancement links
    if (insertedMatches && tournament.format === "single_elimination") {
      const matchMap = new Map(
        insertedMatches.map((m) => [`${m.bracket_type}-${m.round}-${m.match_number}`, m.id])
      );

      for (const match of insertedMatches) {
        if (match.round < Math.ceil(Math.log2(seededParticipants.length))) {
          const nextRound = match.round + 1;
          const nextMatchNumber = Math.ceil(match.match_number / 2);
          const nextBracketType =
            nextRound === Math.ceil(Math.log2(seededParticipants.length))
              ? "finals"
              : "winners";
          const nextMatchId = matchMap.get(
            `${nextBracketType}-${nextRound}-${nextMatchNumber}`
          );

          if (nextMatchId) {
            const slot = match.match_number % 2 === 1 ? "team1" : "team2";
            await supabase
              .from("tournament_matches")
              .update({
                winner_advances_to: nextMatchId,
                [`${slot}_from_match`]: match.id,
              })
              .eq("id", match.id);

            // Also update the next match to know where teams come from
            await supabase
              .from("tournament_matches")
              .update({
                [`${slot}_from_match`]: match.id,
              })
              .eq("id", nextMatchId);
          }
        }
      }

      // Handle byes - advance teams with byes
      const { data: byeMatches } = await supabase
        .from("tournament_matches")
        .select("id, team1_id, team2_id, winner_advances_to")
        .eq("tournament_id", tournamentId)
        .eq("status", "bye");

      for (const byeMatch of byeMatches || []) {
        const winnerId = byeMatch.team1_id || byeMatch.team2_id;
        if (winnerId) {
          await supabase
            .from("tournament_matches")
            .update({
              winner_id: winnerId,
              status: "completed",
              team1_score: byeMatch.team1_id ? 1 : 0,
              team2_score: byeMatch.team2_id ? 1 : 0,
            })
            .eq("id", byeMatch.id);
        }
      }
    }

    // Update tournament status and bracket_data
    await supabase
      .from("tournaments")
      .update({
        status: "seeding",
        bracket_data: {
          generated_at: new Date().toISOString(),
          total_rounds: Math.ceil(Math.log2(seededParticipants.length)),
          total_matches: matches.length,
          participant_count: seededParticipants.length,
        },
      })
      .eq("id", tournamentId);

    // Log activity
    await supabase.from("tournament_activity_log").insert({
      tournament_id: tournamentId,
      user_id: user.id,
      activity_type: "bracket_generated",
      description: `Bracket generated with ${seededParticipants.length} teams`,
      metadata: {
        format: tournament.format,
        team_count: seededParticipants.length,
        match_count: matches.length,
      },
    });

    // Fetch complete bracket to return
    const { data: fullBracket } = await supabase
      .from("tournament_matches")
      .select(
        `
        *,
        team1:tournament_participants!tournament_matches_team1_id_fkey(
          id, seed, clan:clans(id, name, tag, avatar_url)
        ),
        team2:tournament_participants!tournament_matches_team2_id_fkey(
          id, seed, clan:clans(id, name, tag, avatar_url)
        )
      `
      )
      .eq("tournament_id", tournamentId)
      .order("round")
      .order("match_number");

    return NextResponse.json(
      {
        matches: fullBracket || [],
        message: "Bracket generated successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/bracket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
