import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
  getRiotAccountByPuuid,
  getValorantRank,
  getValorantMatchHistory,
  getValorantMatch,
  calculateValorantStats,
  getLolSummonerByPuuid,
  getLolRankedStats,
  getLolMatchHistory,
  getLolMatch,
  calculateLolStats,
  VALORANT_RANKS,
} from "@/lib/integrations/riot";
import {
  getCS2Stats,
  getDota2Profile,
  getDota2Matches,
  calculateCS2DisplayStats,
  calculateDota2Stats,
  DOTA2_RANKS,
} from "@/lib/integrations/steam";
import { getUser } from "@/lib/auth/get-user";
import {
  getPlayer as getCocPlayer,
  calculateCocStats,
  getCocLeagueName,
  getClanWarLog,
  mapWarLogToMatches,
} from "@/lib/integrations/coc";

// POST - Sync stats for a specific game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate game ID
    const validGames = ["valorant"];
    if (!validGames.includes(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    // Determine provider
    const provider = "riot";

    // Get connection for this provider
    const { data: connection, error: connError } = await db
      .from("game_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("is_active", true)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: `No active ${provider} connection found` },
        { status: 400 }
      );
    }

    // Create sync job
    const { data: syncJob, error: jobError } = await db.rpc(
      "start_game_sync",
      {
        p_user_id: user.id,
        p_connection_id: connection.id,
        p_sync_type: "full",
      }
    );

    if (jobError) {
      console.error("Error creating sync job:", jobError);
    }

    let stats: Record<string, unknown> = {};
    let rankInfo: Record<string, unknown> = {};
    let matchesSynced = 0;

    try {
      // Sync based on game
      if (gameId === "valorant") {
        const result = await syncValorantStats(
          connection.provider_user_id,
          user.id,
          connection.id,
          db
        );
        stats = result.stats;
        rankInfo = result.rankInfo;
        matchesSynced = result.matchesSynced;
      }

      // Update connection last_synced_at
      await db
        .from("game_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", connection.id);

      // Complete sync job
      if (syncJob) {
        await db
          .from("game_sync_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            stats_synced: 1,
            matches_synced: matchesSynced,
          })
          .eq("id", syncJob);
      }

      return NextResponse.json({
        success: true,
        gameId,
        stats,
        rankInfo,
        matchesSynced,
      });
    } catch (syncError) {
      // Mark sync job as failed
      if (syncJob) {
        await db
          .from("game_sync_jobs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message:
              syncError instanceof Error ? syncError.message : "Unknown error",
          })
          .eq("id", syncJob);
      }

      throw syncError;
    }
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync stats" },
      { status: 500 }
    );
  }
}

// Valorant sync helper
async function syncValorantStats(
  puuid: string,
  userId: string,
  connectionId: string,
  db: Awaited<ReturnType<typeof createClient>>
) {
  // Get account info
  const account = await getRiotAccountByPuuid(puuid);

  // Get current rank
  const rank = await getValorantRank(puuid, "na");
  const rankInfo = rank
    ? {
        tier: rank.currenttier,
        tier_name: VALORANT_RANKS[rank.currenttier] || "Unranked",
        ranking_in_tier: rank.ranking_in_tier,
        elo: rank.elo,
      }
    : {};

  // Get match history
  const matchHistory = await getValorantMatchHistory(puuid, "na", 10);
  const matches = [];

  for (const matchRef of matchHistory.history.slice(0, 5)) {
    try {
      const match = await getValorantMatch(matchRef.matchId, "na");
      matches.push(match);

      // Store match in history
      const player = match.players.find((p) => p.puuid === puuid);
      const team = match.teams.find((t) => t.teamId === player?.teamId);

      if (player) {
        await db.from("game_match_history").upsert(
          {
            user_id: userId,
            connection_id: connectionId,
            game_id: "valorant",
            external_match_id: match.matchId,
            game_mode: match.gameMode,
            map_name: match.map,
            agent_or_champion: player.characterId,
            result: team?.won ? "win" : "loss",
            score: {
              team_score: team?.roundsWon || 0,
              enemy_score:
                match.teams.find((t) => t.teamId !== player.teamId)?.roundsWon ||
                0,
            },
            stats: {
              kills: player.stats.kills,
              deaths: player.stats.deaths,
              assists: player.stats.assists,
              score: player.stats.score,
            },
            duration_seconds: Math.floor(match.gameLengthMillis / 1000),
            played_at: new Date(match.gameStartMillis).toISOString(),
          },
          { onConflict: "connection_id,external_match_id" }
        );
      }
    } catch (e) {
      console.error("Error fetching match:", e);
    }
  }

  // Calculate aggregated stats
  const stats = calculateValorantStats(matches, puuid);

  // Upsert stats
  await db.rpc("upsert_game_stats", {
    p_user_id: userId,
    p_connection_id: connectionId,
    p_game_id: "valorant",
    p_game_mode: "competitive",
    p_season: "current",
    p_stats: stats,
    p_rank_info: rankInfo,
  });

  return { stats, rankInfo, matchesSynced: matches.length };
}

// League of Legends sync helper
async function syncLoLStats(
  puuid: string,
  userId: string,
  connectionId: string,
  db: Awaited<ReturnType<typeof createClient>>
) {
  // Get summoner info
  const summoner = await getLolSummonerByPuuid(puuid, "na1");

  // Get ranked stats
  const rankedStats = await getLolRankedStats(summoner.id, "na1");
  const soloQ = rankedStats.find((r) => r.queueType === "RANKED_SOLO_5x5");

  const rankInfo = soloQ
    ? {
        tier: soloQ.tier,
        rank: soloQ.rank,
        lp: soloQ.leaguePoints,
        wins: soloQ.wins,
        losses: soloQ.losses,
        win_rate: `${Math.round((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100)}%`,
      }
    : {};

  // Get match history
  const matchIds = await getLolMatchHistory(puuid, "americas", 10);
  const matches = [];

  for (const matchId of matchIds.slice(0, 5)) {
    try {
      const match = await getLolMatch(matchId, "americas");
      matches.push(match);

      // Store match in history
      const participant = match.info.participants.find((p) => p.puuid === puuid);

      if (participant) {
        const team = match.info.teams.find(
          (t) => t.teamId === participant.teamId
        );

        await db.from("game_match_history").upsert(
          {
            user_id: userId,
            connection_id: connectionId,
            game_id: "lol",
            external_match_id: matchId,
            game_mode: match.info.gameMode,
            agent_or_champion: participant.championName,
            result: participant.win ? "win" : "loss",
            score: {
              team_kills: match.info.participants
                .filter((p) => p.teamId === participant.teamId)
                .reduce((sum, p) => sum + p.kills, 0),
            },
            stats: {
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
              vision_score: participant.visionScore,
              damage: participant.totalDamageDealtToChampions,
            },
            duration_seconds: match.info.gameDuration,
            played_at: new Date(match.info.gameCreation).toISOString(),
          },
          { onConflict: "connection_id,external_match_id" }
        );
      }
    } catch (e) {
      console.error("Error fetching LoL match:", e);
    }
  }

  // Calculate aggregated stats
  const stats = calculateLolStats(matches, puuid);

  // Upsert stats
  await db.rpc("upsert_game_stats", {
    p_user_id: userId,
    p_connection_id: connectionId,
    p_game_id: "lol",
    p_game_mode: "ranked",
    p_season: "current",
    p_stats: stats,
    p_rank_info: rankInfo,
  });

  return { stats, rankInfo, matchesSynced: matches.length };
}

// CS2 sync helper
async function syncCS2Stats(
  steamId: string,
  userId: string,
  connectionId: string,
  db: Awaited<ReturnType<typeof createClient>>
) {
  // Get CS2 stats from Steam
  const rawStats = await getCS2Stats(steamId);

  if (!rawStats) {
    return {
      stats: {},
      rankInfo: { note: "Profile may be private" },
      matchesSynced: 0,
    };
  }

  // Calculate display stats
  const stats = calculateCS2DisplayStats(rawStats);

  // CS2 doesn't expose rank via API (Premier uses ELO shown in-game)
  const rankInfo = {
    note: "CS2 ranks are not available via Steam API",
    total_wins: rawStats.total_wins,
    total_matches: rawStats.total_matches_played,
  };

  // Upsert stats
  await db.rpc("upsert_game_stats", {
    p_user_id: userId,
    p_connection_id: connectionId,
    p_game_id: "cs2",
    p_game_mode: "all",
    p_season: "lifetime",
    p_stats: stats,
    p_rank_info: rankInfo,
  });

  return { stats, rankInfo, matchesSynced: 0 };
}

// Dota 2 sync helper
async function syncDota2Stats(
  steamId: string,
  userId: string,
  connectionId: string,
  db: Awaited<ReturnType<typeof createClient>>
) {
  // Get Dota 2 profile from OpenDota
  const profile = await getDota2Profile(steamId);

  const rankInfo = profile?.rank_tier
    ? {
        tier: profile.rank_tier,
        tier_name: DOTA2_RANKS[profile.rank_tier] || "Unknown",
        leaderboard_rank: profile.leaderboard_rank,
        mmr_estimate: profile.mmr_estimate?.estimate,
      }
    : {};

  // Get recent matches
  const matches = await getDota2Matches(steamId, 20);

  // Store matches in history
  for (const match of matches.slice(0, 10)) {
    const isRadiant = match.player_slot < 128;
    const won =
      (isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win);

    await db.from("game_match_history").upsert(
      {
        user_id: userId,
        connection_id: connectionId,
        game_id: "dota2",
        external_match_id: match.match_id.toString(),
        game_mode: match.game_mode.toString(),
        agent_or_champion: match.hero_id.toString(),
        result: won ? "win" : "loss",
        stats: {
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          party_size: match.party_size,
        },
        duration_seconds: match.duration,
        played_at: new Date(match.start_time * 1000).toISOString(),
      },
      { onConflict: "connection_id,external_match_id" }
    );
  }

  // Calculate aggregated stats
  const stats = calculateDota2Stats(matches);

  // Upsert stats
  await db.rpc("upsert_game_stats", {
    p_user_id: userId,
    p_connection_id: connectionId,
    p_game_id: "dota2",
    p_game_mode: "all",
    p_season: "current",
    p_stats: stats,
    p_rank_info: rankInfo,
  });

  return { stats, rankInfo, matchesSynced: matches.length };
}

// Clash of Clans sync helper
async function syncCocStats(
  playerTag: string,
  userId: string,
  connectionId: string,
  db: Awaited<ReturnType<typeof createClient>>
) {
  // Get full player profile from CoC API
  const player = await getCocPlayer(playerTag);

  // Calculate stats
  const stats = calculateCocStats(player);

  // Build rank info
  const rankInfo = {
    tier_name: getCocLeagueName(player),
    trophies: player.trophies,
    best_trophies: player.bestTrophies,
    town_hall_level: player.townHallLevel,
    legend_trophies: player.legendStatistics?.currentSeason?.trophies || null,
    legend_rank: player.legendStatistics?.currentSeason?.rank || null,
  };

  // Upsert main village stats
  await db.rpc("upsert_game_stats", {
    p_user_id: userId,
    p_connection_id: connectionId,
    p_game_id: "coc",
    p_game_mode: "main_village",
    p_season: "current",
    p_stats: stats,
    p_rank_info: rankInfo,
  });

  // If player is in a clan, try to fetch war log for match history
  let matchesSynced = 0;
  if (player.clan) {
    try {
      const warLog = await getClanWarLog(player.clan.tag);
      const warMatches = mapWarLogToMatches(warLog, player.clan.tag);

      for (const war of warMatches.slice(0, 10)) {
        await db.from("game_match_history").upsert(
          {
            user_id: userId,
            connection_id: connectionId,
            game_id: "coc",
            external_match_id: war.external_match_id,
            game_mode: war.game_mode,
            result: war.result,
            score: war.score,
            stats: war.stats,
            played_at: war.played_at,
          },
          { onConflict: "connection_id,external_match_id" }
        );
      }
      matchesSynced = Math.min(warMatches.length, 10);
    } catch (e) {
      // War log may be private -- not fatal, we still have player stats
      console.warn("Could not fetch clan war log:", e);
    }
  }

  // Store hero levels as additional stats
  const heroStats: Record<string, unknown> = {};
  for (const hero of player.heroes || []) {
    heroStats[hero.name.toLowerCase().replace(/\s/g, "_")] = {
      level: hero.level,
      max_level: hero.maxLevel,
      village: hero.village,
    };
  }

  if (Object.keys(heroStats).length > 0) {
    await db.rpc("upsert_game_stats", {
      p_user_id: userId,
      p_connection_id: connectionId,
      p_game_id: "coc",
      p_game_mode: "heroes",
      p_season: "current",
      p_stats: heroStats,
      p_rank_info: {},
    });
  }

  return { stats, rankInfo, matchesSynced };
}
