"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/db/client-browser";
import type {
  TournamentWithDetails,
  TournamentParticipantWithClan,
  TournamentStatus,
} from "@/types/database";

export function useTournament(tournamentIdOrSlug: string | null) {
  const [tournament, setTournament] = useState<TournamentWithDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const db = createClient();

  const fetchTournament = useCallback(async () => {
    if (!tournamentIdOrSlug) {
      setTournament(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tournaments/${tournamentIdOrSlug}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tournament");
      }

      setTournament(data.tournament);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, [tournamentIdOrSlug]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!tournament?.id) return;

    const channel = db
      .channel(`tournament-${tournament.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournament.id}`,
        },
        () => {
          fetchTournament();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_participants",
          filter: `tournament_id=eq.${tournament.id}`,
        },
        () => {
          fetchTournament();
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [tournament?.id, db, fetchTournament]);

  const updateTournament = async (
    updates: Partial<TournamentWithDetails>
  ): Promise<{ error?: string }> => {
    if (!tournament?.id) return { error: "No tournament loaded" };

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to update tournament" };
      }

      setTournament(data.tournament);
      return {};
    } catch {
      return { error: "Failed to update tournament" };
    }
  };

  const deleteTournament = async (): Promise<{ error?: string }> => {
    if (!tournament?.id) return { error: "No tournament loaded" };

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: data.error || "Failed to delete tournament" };
      }

      setTournament(null);
      return {};
    } catch {
      return { error: "Failed to delete tournament" };
    }
  };

  const updateStatus = async (
    newStatus: TournamentStatus
  ): Promise<{ error?: string }> => {
    return updateTournament({ status: newStatus });
  };

  const registerClan = async (
    clanId: string,
    roster?: { user_id: string; role: string; is_substitute: boolean }[]
  ): Promise<{ data?: TournamentParticipantWithClan; error?: string }> => {
    if (!tournament?.id) return { error: "No tournament loaded" };

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clan_id: clanId, roster }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to register" };
      }

      // Refresh tournament to get updated participant list
      fetchTournament();
      return { data: data.participant };
    } catch {
      return { error: "Failed to register for tournament" };
    }
  };

  const generateBracket = async (): Promise<{ error?: string }> => {
    if (!tournament?.id) return { error: "No tournament loaded" };

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/bracket`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to generate bracket" };
      }

      // Refresh tournament
      fetchTournament();
      return {};
    } catch {
      return { error: "Failed to generate bracket" };
    }
  };

  const startTournament = async (): Promise<{ error?: string }> => {
    return updateStatus("in_progress");
  };

  return {
    tournament,
    loading,
    error,
    refetch: fetchTournament,
    updateTournament,
    deleteTournament,
    updateStatus,
    registerClan,
    generateBracket,
    startTournament,
  };
}
