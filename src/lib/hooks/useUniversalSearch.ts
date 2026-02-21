"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  SearchUser,
  SearchBlogPost,
  SearchListing,
  SearchClan,
} from "@/types/search";

// Fetch functions for each category
async function searchUsers(
  query: string,
  limit: number = 3
): Promise<{ users: SearchUser[]; total: number }> {
  const res = await fetch(
    `/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) return { users: [], total: 0 };
  return res.json();
}

async function searchBlogs(
  query: string,
  limit: number = 3
): Promise<{ posts: SearchBlogPost[]; total: number }> {
  const res = await fetch(
    `/api/blog?search=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) return { posts: [], total: 0 };
  return res.json();
}

async function searchListings(
  query: string,
  limit: number = 3
): Promise<{ listings: SearchListing[]; total: number }> {
  const res = await fetch(
    `/api/listings?search=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) return { listings: [], total: 0 };
  return res.json();
}

async function searchClans(
  query: string,
  limit: number = 3
): Promise<{
  clans: Array<SearchClan & { clan_members: { count: number }[] }>;
  total: number;
}> {
  const res = await fetch(
    `/api/clans?search=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) return { clans: [], total: 0 };
  return res.json();
}

interface UseUniversalSearchOptions {
  enabled?: boolean;
  limit?: number;
}

export function useUniversalSearch(
  rawQuery: string,
  options: UseUniversalSearchOptions = {}
) {
  const { enabled = true, limit = 3 } = options;
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (rawQuery.length < 3) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(rawQuery), 300);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const isEnabled = debouncedQuery.length >= 3 && enabled;

  const usersQuery = useQuery({
    queryKey: ["search", "users", debouncedQuery, limit],
    queryFn: () => searchUsers(debouncedQuery, limit),
    enabled: isEnabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const blogsQuery = useQuery({
    queryKey: ["search", "blogs", debouncedQuery, limit],
    queryFn: () => searchBlogs(debouncedQuery, limit),
    enabled: isEnabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const listingsQuery = useQuery({
    queryKey: ["search", "listings", debouncedQuery, limit],
    queryFn: () => searchListings(debouncedQuery, limit),
    enabled: isEnabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const clansQuery = useQuery({
    queryKey: ["search", "clans", debouncedQuery, limit],
    queryFn: () => searchClans(debouncedQuery, limit),
    enabled: isEnabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  // Normalize clan member count
  const clans: SearchClan[] = (clansQuery.data?.clans || []).map((clan) => ({
    ...clan,
    member_count:
      clan.clan_members?.[0]?.count ?? clan.member_count ?? 0,
  }));

  const users = usersQuery.data?.users || [];
  const blogs = blogsQuery.data?.posts || [];
  const listings = listingsQuery.data?.listings || [];

  const isAnyLoading =
    usersQuery.isLoading ||
    blogsQuery.isLoading ||
    listingsQuery.isLoading ||
    clansQuery.isLoading;

  const isEmpty =
    isEnabled &&
    !isAnyLoading &&
    users.length === 0 &&
    blogs.length === 0 &&
    listings.length === 0 &&
    clans.length === 0;

  return {
    users: {
      data: users,
      total: usersQuery.data?.total || 0,
      isLoading: usersQuery.isLoading,
    },
    blogs: {
      data: blogs,
      total: blogsQuery.data?.total || 0,
      isLoading: blogsQuery.isLoading,
    },
    listings: {
      data: listings,
      total: listingsQuery.data?.total || 0,
      isLoading: listingsQuery.isLoading,
    },
    clans: {
      data: clans,
      total: clansQuery.data?.total || 0,
      isLoading: clansQuery.isLoading,
    },
    isAnyLoading,
    isEmpty,
    debouncedQuery,
  };
}
