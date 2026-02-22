"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export interface AdminUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  admin_role: string | null;
  gaming_style: string | null;
  region: string | null;
  created_at: string;
  account_verifications: {
    verification_level: number;
    trust_score: number;
    is_flagged: boolean;
    flag_reason: string | null;
    is_restricted: boolean;
    restriction_reason: string | null;
    restriction_expires_at: string | null;
  } | null;
}

export interface AdminUserFilters {
  search?: string;
  page?: number;
  limit?: number;
}

const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (filters: AdminUserFilters) =>
    ["admin", "users", "list", filters] as const,
};

export function useAdminUsers(filters: AdminUserFilters = {}) {
  const { page = 1, limit = 20, ...rest } = filters;
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rest.search) params.set("search", rest.search);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const response = await fetch(
        `/api/admin/users?${params.toString()}`
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Failed to fetch users");
      return json as { users: AdminUser[]; total: number };
    },
    staleTime: 1000 * 30,
  });

  return {
    users: data?.users || [],
    total: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / limit),
    page,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useAdminUserAction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: {
      user_id: string;
      action: string;
      reason?: string;
      expires_at?: string;
      admin_role?: string;
    }) => {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to perform action");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });

  return {
    performAction: mutation.mutateAsync,
    isPerforming: mutation.isPending,
  };
}
