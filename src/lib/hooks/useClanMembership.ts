"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClanMember, Clan, ClanMemberRole } from "@/types/database";

interface ClanMembershipData extends ClanMember {
  clan: Clan;
}

export function useClanMembership(userId: string | null) {
  const [membership, setMembership] = useState<ClanMembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMembership = useCallback(async () => {
    if (!userId) {
      setMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("clan_members")
        .select(
          `
          *,
          clan:clans(*)
        `
        )
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        // User is not in a clan
        if (fetchError.code === "PGRST116") {
          setMembership(null);
        } else {
          setError("Failed to fetch membership");
        }
      } else {
        setMembership(data as unknown as ClanMembershipData);
      }
    } catch (err) {
      setError("Failed to fetch membership");
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const leaveClan = async () => {
    if (!membership) return { error: new Error("Not in a clan") };

    const response = await fetch(
      `/api/clans/${membership.clan_id}/members/${userId}`,
      { method: "DELETE" }
    );

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to leave clan") };
    }

    setMembership(null);
    return { success: true, clan_deleted: data.clan_deleted };
  };

  const isLeader = membership?.role === "leader";
  const isCoLeader = membership?.role === "co_leader";
  const isOfficer = membership?.role === "officer";
  const isMember = membership?.role === "member";

  const canManageMembers = isLeader || isCoLeader;
  const canInvite = isLeader || isCoLeader || isOfficer;
  const canManageSettings = isLeader || isCoLeader;
  const canCreateChallenges = isLeader || isCoLeader || isOfficer;

  return {
    membership,
    clan: membership?.clan || null,
    role: membership?.role as ClanMemberRole | null,
    loading,
    error,
    refetch: fetchMembership,
    leaveClan,
    isInClan: !!membership,
    isLeader,
    isCoLeader,
    isOfficer,
    isMember,
    canManageMembers,
    canInvite,
    canManageSettings,
    canCreateChallenges,
  };
}
