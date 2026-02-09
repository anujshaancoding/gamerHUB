"use client";

import { useEffect, useState, useCallback } from "react";
import type { ClanInvite, Profile } from "@/types/database";

interface ClanInviteWithProfile extends ClanInvite {
  user: Profile;
  invited_by_profile: Profile | null;
}

interface UseClanInvitesOptions {
  type?: "invite" | "request";
  status?: string;
}

export function useClanInvites(
  clanId: string | null,
  options: UseClanInvitesOptions = {}
) {
  const [invites, setInvites] = useState<ClanInviteWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { type, status = "pending" } = options;

  const fetchInvites = useCallback(async () => {
    if (!clanId) {
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/clans/${clanId}/invites?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invites");
      }

      setInvites(data.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch invites");
    } finally {
      setLoading(false);
    }
  }, [clanId, type, status]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const sendInvite = async (userId: string, message?: string) => {
    if (!clanId) return { error: new Error("No clan specified") };

    const response = await fetch(`/api/clans/${clanId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invite", user_id: userId, message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to send invite") };
    }

    await fetchInvites();
    return { data: data.invite };
  };

  const requestToJoin = async (message?: string) => {
    if (!clanId) return { error: new Error("No clan specified") };

    const response = await fetch(`/api/clans/${clanId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "request", message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to send request") };
    }

    return { data: data.invite };
  };

  const respondToInvite = async (
    inviteId: string,
    action: "accept" | "decline"
  ) => {
    if (!clanId) return { error: new Error("No clan specified") };

    const response = await fetch(`/api/clans/${clanId}/invites/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to respond to invite") };
    }

    await fetchInvites();
    return { success: true, member_added: data.member_added };
  };

  const cancelInvite = async (inviteId: string) => {
    if (!clanId) return { error: new Error("No clan specified") };

    const response = await fetch(`/api/clans/${clanId}/invites/${inviteId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to cancel invite") };
    }

    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    return { success: true };
  };

  const pendingInvites = invites.filter(
    (i) => i.type === "invite" && i.status === "pending"
  );
  const pendingRequests = invites.filter(
    (i) => i.type === "request" && i.status === "pending"
  );

  return {
    invites,
    pendingInvites,
    pendingRequests,
    loading,
    error,
    refetch: fetchInvites,
    sendInvite,
    requestToJoin,
    respondToInvite,
    cancelInvite,
  };
}
