"use client";

import { useEffect, useState, useCallback } from "react";
import type { ClanMember, Profile, UserGame, Game, ClanMemberRole } from "@/types/database";

interface ClanMemberWithProfile extends ClanMember {
  profile: Profile;
  user_games?: (UserGame & { game: Game })[];
}

interface UseClanMembersOptions {
  role?: ClanMemberRole;
  limit?: number;
}

export function useClanMembers(
  clanId: string | null,
  options: UseClanMembersOptions = {}
) {
  const [members, setMembers] = useState<ClanMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const { role, limit = 50 } = options;

  const fetchMembers = useCallback(async (newOffset = 0) => {
    if (!clanId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      params.set("limit", String(limit));
      params.set("offset", String(newOffset));

      const response = await fetch(
        `/api/clans/${clanId}/members?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch members");
      }

      if (newOffset === 0) {
        setMembers(data.members);
      } else {
        setMembers((prev) => [...prev, ...data.members]);
      }
      setTotal(data.total);
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [clanId, role, limit]);

  useEffect(() => {
    fetchMembers(0);
  }, [fetchMembers]);

  const loadMore = () => {
    if (!loading && members.length < total) {
      fetchMembers(offset + limit);
    }
  };

  const updateMemberRole = async (userId: string, newRole: ClanMemberRole) => {
    if (!clanId) return { error: new Error("No clan specified") };

    const response = await fetch(`/api/clans/${clanId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to update role") };
    }

    await fetchMembers(0);
    return { data: data.member };
  };

  const removeMember = async (userId: string) => {
    if (!clanId) return { error: new Error("No clan specified") };

    const response = await fetch(`/api/clans/${clanId}/members/${userId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to remove member") };
    }

    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    setTotal((prev) => prev - 1);
    return { success: true };
  };

  // Get members by role
  const leaders = members.filter((m) => m.role === "leader");
  const coLeaders = members.filter((m) => m.role === "co_leader");
  const officers = members.filter((m) => m.role === "officer");
  const regularMembers = members.filter((m) => m.role === "member");

  return {
    members,
    leaders,
    coLeaders,
    officers,
    regularMembers,
    loading,
    error,
    total,
    hasMore: members.length < total,
    refetch: () => fetchMembers(0),
    loadMore,
    updateMemberRole,
    removeMember,
  };
}
