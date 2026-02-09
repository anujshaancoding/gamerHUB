"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level?: number;
  title?: string | null;
  bio?: string | null;
}

interface StreamerProfile {
  id: string;
  user_id: string;
  twitch_id?: string;
  twitch_login: string;
  twitch_display_name: string | null;
  twitch_profile_image_url: string | null;
  twitch_broadcaster_type: string;
  stream_title: string | null;
  stream_game_name: string | null;
  stream_language: string;
  status: "offline" | "live" | "hosting";
  current_viewer_count: number;
  last_stream_started_at: string | null;
  last_stream_ended_at: string | null;
  is_featured: boolean;
  embed_enabled: boolean;
  total_stream_hours: number;
  peak_viewer_count: number;
  follower_count: number;
  connected_at: string;
  profile: Profile;
  is_following?: boolean;
}

interface StreamSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  timezone: string;
  title: string | null;
  game_name: string | null;
  is_recurring: boolean;
}

interface StreamHistory {
  id: string;
  title: string | null;
  game_name: string | null;
  viewer_count: number;
  peak_viewers: number;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  vod_url: string | null;
  thumbnail_url: string | null;
}

interface StreamersResponse {
  streamers: StreamerProfile[];
  liveCount: number;
  total: number;
}

interface StreamerDetailResponse {
  streamer: StreamerProfile;
  schedule: StreamSchedule[];
  recentStreams: StreamHistory[];
}

// Fetch streamers list
async function fetchStreamers(
  filter: "all" | "live" | "featured" = "all",
  limit: number = 20
): Promise<StreamersResponse> {
  const res = await fetch(`/api/streamers?filter=${filter}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch streamers");
  return res.json();
}

// Fetch single streamer
async function fetchStreamer(userId: string): Promise<StreamerDetailResponse> {
  const res = await fetch(`/api/streamers/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch streamer");
  return res.json();
}

// Toggle follow
async function toggleFollow(userId: string): Promise<{ following: boolean }> {
  const res = await fetch(`/api/streamers/${userId}/follow`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to toggle follow");
  return res.json();
}

export function useStreamers(filter: "all" | "live" | "featured" = "all") {
  return useQuery({
    queryKey: ["streamers", filter],
    queryFn: () => fetchStreamers(filter),
    refetchInterval: 60000, // Refresh every minute for live status
  });
}

export function useLiveStreamers() {
  return useQuery({
    queryKey: ["streamers", "live"],
    queryFn: () => fetchStreamers("live", 10),
    refetchInterval: 30000, // Refresh every 30 seconds for live streams
  });
}

export function useStreamer(userId: string) {
  return useQuery({
    queryKey: ["streamer", userId],
    queryFn: () => fetchStreamer(userId),
    enabled: !!userId,
  });
}

export function useToggleStreamerFollow(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleFollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streamer", userId] });
      queryClient.invalidateQueries({ queryKey: ["streamers"] });
    },
  });
}

// Hook to get current user's streamer profile
export function useMyStreamerProfile() {
  return useQuery({
    queryKey: ["my-streamer-profile"],
    queryFn: async () => {
      const res = await fetch("/api/streamers/me");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });
}

// Generate Twitch embed URL
export function useTwitchEmbed(channel: string) {
  const parent =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

  return {
    playerUrl: `https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=false`,
    chatUrl: `https://www.twitch.tv/embed/${channel}/chat?parent=${parent}&darkpopout`,
  };
}

// Helper to format stream duration
export function formatStreamDuration(minutes: number | null): string {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Helper to get day name from day_of_week
export function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "";
}

// Helper to format viewer count
export function formatViewerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
