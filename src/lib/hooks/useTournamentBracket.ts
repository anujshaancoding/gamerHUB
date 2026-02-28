"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/db/client-browser";
import type {
  TournamentMatchWithTeams,
  TournamentFormat,
  TournamentSettings,
} from "@/types/database";

interface BracketData {
  generated_at?: string;
  total_rounds?: number;
  total_matches?: number;
  participant_count?: number;
}

export function useTournamentBracket(tournamentId: string | null) {
  const [matches, setMatches] = useState<TournamentMatchWithTeams[]>([]);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [format, setFormat] = useState<TournamentFormat | null>(null);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const db = createClient();

  const fetchBracket = useCallback(async () => {
    if (!tournamentId) {
      setMatches([]);
      setBracketData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tournaments/${tournamentId}/bracket`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bracket");
      }

      setMatches(data.matches || []);
      setBracketData(data.bracket_data || null);
      setFormat(data.format || null);
      setSettings(data.settings || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchBracket();
  }, [fetchBracket]);

  // Subscribe to real-time match updates
  useEffect(() => {
    if (!tournamentId) return;

    const channel = db
      .channel(`bracket-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchBracket();
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [tournamentId, db, fetchBracket]);

  const updateMatch = async (
    matchId: string,
    updates: {
      status?: string;
      scheduled_at?: string;
      team1_score?: number;
      team2_score?: number;
      winner_id?: string;
      result?: Record<string, unknown>;
    }
  ): Promise<{ error?: string }> => {
    if (!tournamentId) return { error: "No tournament loaded" };

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${matchId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to update match" };
      }

      // Update local state
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? data.match : m))
      );
      return {};
    } catch {
      return { error: "Failed to update match" };
    }
  };

  const reportResult = async (
    matchId: string,
    team1Score: number,
    team2Score: number,
    winnerId: string
  ): Promise<{ error?: string }> => {
    return updateMatch(matchId, {
      team1_score: team1Score,
      team2_score: team2Score,
      winner_id: winnerId,
      status: "completed",
    });
  };

  const startMatch = async (matchId: string): Promise<{ error?: string }> => {
    return updateMatch(matchId, { status: "in_progress" });
  };

  const scheduleMatch = async (
    matchId: string,
    scheduledAt: string
  ): Promise<{ error?: string }> => {
    return updateMatch(matchId, { scheduled_at: scheduledAt, status: "scheduled" });
  };

  // Group matches by round for easier rendering
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const key = `${match.bracket_type}-${match.round}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(match);
      return acc;
    },
    {} as Record<string, TournamentMatchWithTeams[]>
  );

  // Get rounds in order
  const rounds = Object.keys(matchesByRound)
    .sort((a, b) => {
      const [typeA, roundA] = a.split("-");
      const [typeB, roundB] = b.split("-");
      // Winners first, then losers, then finals
      const typeOrder: Record<string, number> = { winners: 0, losers: 1, finals: 2, grand_finals: 3 };
      if (typeOrder[typeA] !== typeOrder[typeB]) {
        return typeOrder[typeA] - typeOrder[typeB];
      }
      return parseInt(roundA) - parseInt(roundB);
    })
    .map((key) => ({
      key,
      bracketType: key.split("-")[0],
      roundNumber: parseInt(key.split("-")[1]),
      matches: matchesByRound[key].sort(
        (a, b) => a.match_number - b.match_number
      ),
    }));

  return {
    matches,
    matchesByRound,
    rounds,
    bracketData,
    format,
    settings,
    loading,
    error,
    refetch: fetchBracket,
    updateMatch,
    reportResult,
    startMatch,
    scheduleMatch,
  };
}
