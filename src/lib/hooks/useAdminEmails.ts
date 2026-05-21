"use client";

import { useQuery } from "@tanstack/react-query";

export interface AdminEmail {
  email: string;
  username: string | null;
  display_name: string | null;
  provider: string | null;
  email_confirmed_at: string | null;
  created_at: string;
}

export interface AdminEmailFilters {
  search?: string;
  page?: number;
  limit?: number;
}

const adminEmailKeys = {
  all: ["admin", "emails"] as const,
  list: (filters: AdminEmailFilters) =>
    ["admin", "emails", "list", filters] as const,
};

export function useAdminEmails(filters: AdminEmailFilters = {}) {
  const { page = 1, limit = 50, ...rest } = filters;
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminEmailKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rest.search) params.set("search", rest.search);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const response = await fetch(`/api/admin/emails?${params.toString()}`);
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Failed to fetch emails");
      return json as { users: AdminEmail[]; total: number };
    },
    staleTime: 1000 * 30,
  });

  return {
    emails: data?.users || [],
    total: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / limit),
    page,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
