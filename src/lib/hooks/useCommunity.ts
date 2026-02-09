import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Guide,
  Clip,
  Poll,
  CommunityEvent,
  Meme,
  CreateGuideRequest,
  CreateClipRequest,
  CreatePollRequest,
  CreateEventRequest,
  CreateMemeRequest,
  ClipReactionType,
  EventRSVPStatus,
} from "@/types/community";

// Query keys
const COMMUNITY_KEYS = {
  guides: (filters?: object) => ["community", "guides", filters] as const,
  guide: (slug: string) => ["community", "guide", slug] as const,
  clips: (filters?: object) => ["community", "clips", filters] as const,
  clip: (id: string) => ["community", "clip", id] as const,
  polls: (filters?: object) => ["community", "polls", filters] as const,
  poll: (id: string) => ["community", "poll", id] as const,
  events: (filters?: object) => ["community", "events", filters] as const,
  event: (slug: string) => ["community", "event", slug] as const,
  memes: (filters?: object) => ["community", "memes", filters] as const,
  meme: (id: string) => ["community", "meme", id] as const,
};

// ===== GUIDES =====

interface FetchGuidesParams {
  gameId?: string;
  gameSlug?: string;
  type?: string;
  authorId?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

async function fetchGuides(
  params: FetchGuidesParams
): Promise<{ guides: Guide[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.gameSlug) searchParams.set("game", params.gameSlug);
  if (params.type) searchParams.set("type", params.type);
  if (params.authorId) searchParams.set("author_id", params.authorId);
  if (params.featured) searchParams.set("featured", "true");
  if (params.search) searchParams.set("search", params.search);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/guides?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch guides");
  return response.json();
}

async function createGuide(data: CreateGuideRequest): Promise<Guide> {
  const response = await fetch("/api/guides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create guide");
  }
  const result = await response.json();
  return result.guide;
}

export function useGuides(params: FetchGuidesParams = {}) {
  const queryClient = useQueryClient();

  const guidesQuery = useQuery({
    queryKey: COMMUNITY_KEYS.guides(params),
    queryFn: () => fetchGuides(params),
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createGuide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "guides"] });
    },
  });

  return {
    guides: guidesQuery.data?.guides,
    total: guidesQuery.data?.total,
    hasMore: guidesQuery.data?.hasMore,
    isLoading: guidesQuery.isLoading,
    error: guidesQuery.error,
    createGuide: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

// ===== CLIPS =====

interface FetchClipsParams {
  gameId?: string;
  creatorId?: string;
  type?: string;
  featured?: boolean;
  sort?: "recent" | "popular" | "views";
  limit?: number;
  offset?: number;
}

async function fetchClips(
  params: FetchClipsParams
): Promise<{ clips: Clip[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.creatorId) searchParams.set("creator_id", params.creatorId);
  if (params.type) searchParams.set("type", params.type);
  if (params.featured) searchParams.set("featured", "true");
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/clips?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch clips");
  return response.json();
}

async function createClip(data: CreateClipRequest): Promise<Clip> {
  const response = await fetch("/api/clips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create clip");
  }
  const result = await response.json();
  return result.clip;
}

async function reactToClip(
  clipId: string,
  reactionType: ClipReactionType
): Promise<{ action: string; reaction_type: ClipReactionType | null }> {
  const response = await fetch(`/api/clips/${clipId}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reaction_type: reactionType }),
  });
  if (!response.ok) throw new Error("Failed to react");
  return response.json();
}

export function useClips(params: FetchClipsParams = {}) {
  const queryClient = useQueryClient();

  const clipsQuery = useQuery({
    queryKey: COMMUNITY_KEYS.clips(params),
    queryFn: () => fetchClips(params),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: createClip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "clips"] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ clipId, reactionType }: { clipId: string; reactionType: ClipReactionType }) =>
      reactToClip(clipId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "clips"] });
    },
  });

  return {
    clips: clipsQuery.data?.clips,
    total: clipsQuery.data?.total,
    hasMore: clipsQuery.data?.hasMore,
    isLoading: clipsQuery.isLoading,
    error: clipsQuery.error,
    createClip: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    reactToClip: (clipId: string, reactionType: ClipReactionType) =>
      reactMutation.mutateAsync({ clipId, reactionType }),
    isReacting: reactMutation.isPending,
  };
}

// ===== POLLS =====

interface FetchPollsParams {
  gameId?: string;
  type?: string;
  creatorId?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

async function fetchPolls(
  params: FetchPollsParams
): Promise<{ polls: Poll[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.type) searchParams.set("type", params.type);
  if (params.creatorId) searchParams.set("creator_id", params.creatorId);
  if (params.active !== undefined) searchParams.set("active", params.active.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/polls?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch polls");
  return response.json();
}

async function createPoll(data: CreatePollRequest): Promise<Poll> {
  const response = await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create poll");
  }
  const result = await response.json();
  return result.poll;
}

async function votePoll(
  pollId: string,
  optionIds: string[]
): Promise<Poll> {
  const response = await fetch(`/api/polls/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ option_ids: optionIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to vote");
  }
  const result = await response.json();
  return result.poll;
}

export function usePolls(params: FetchPollsParams = {}) {
  const queryClient = useQueryClient();

  const pollsQuery = useQuery({
    queryKey: COMMUNITY_KEYS.polls(params),
    queryFn: () => fetchPolls(params),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: createPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "polls"] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIds }: { pollId: string; optionIds: string[] }) =>
      votePoll(pollId, optionIds),
    onSuccess: (poll) => {
      queryClient.setQueryData(COMMUNITY_KEYS.poll(poll.id), poll);
      queryClient.invalidateQueries({ queryKey: ["community", "polls"] });
    },
  });

  return {
    polls: pollsQuery.data?.polls,
    total: pollsQuery.data?.total,
    hasMore: pollsQuery.data?.hasMore,
    isLoading: pollsQuery.isLoading,
    error: pollsQuery.error,
    createPoll: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    vote: (pollId: string, optionIds: string[]) =>
      voteMutation.mutateAsync({ pollId, optionIds }),
    isVoting: voteMutation.isPending,
  };
}

// ===== EVENTS =====

interface FetchEventsParams {
  gameId?: string;
  type?: string;
  organizerId?: string;
  upcoming?: boolean;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

async function fetchEvents(
  params: FetchEventsParams
): Promise<{ events: CommunityEvent[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.type) searchParams.set("type", params.type);
  if (params.organizerId) searchParams.set("organizer_id", params.organizerId);
  if (params.upcoming !== undefined) searchParams.set("upcoming", params.upcoming.toString());
  if (params.featured) searchParams.set("featured", "true");
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/events?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}

async function createEvent(data: CreateEventRequest): Promise<CommunityEvent> {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create event");
  }
  const result = await response.json();
  return result.event;
}

async function rsvpEvent(
  eventId: string,
  status: EventRSVPStatus,
  message?: string
): Promise<CommunityEvent> {
  const response = await fetch(`/api/events/${eventId}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, message }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to RSVP");
  }
  const result = await response.json();
  return result.event;
}

export function useCommunityEvents(params: FetchEventsParams = {}) {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: COMMUNITY_KEYS.events(params),
    queryFn: () => fetchEvents(params),
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "events"] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: ({
      eventId,
      status,
      message,
    }: {
      eventId: string;
      status: EventRSVPStatus;
      message?: string;
    }) => rsvpEvent(eventId, status, message),
    onSuccess: (event) => {
      queryClient.setQueryData(COMMUNITY_KEYS.event(event.slug), event);
      queryClient.invalidateQueries({ queryKey: ["community", "events"] });
    },
  });

  return {
    events: eventsQuery.data?.events,
    total: eventsQuery.data?.total,
    hasMore: eventsQuery.data?.hasMore,
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    rsvp: (eventId: string, status: EventRSVPStatus, message?: string) =>
      rsvpMutation.mutateAsync({ eventId, status, message }),
    isRsvping: rsvpMutation.isPending,
  };
}

// ===== MEMES =====

interface FetchMemesParams {
  gameId?: string;
  creatorId?: string;
  sort?: "recent" | "popular" | "top";
  limit?: number;
  offset?: number;
}

async function fetchMemes(
  params: FetchMemesParams
): Promise<{ memes: Meme[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.creatorId) searchParams.set("creator_id", params.creatorId);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/memes?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch memes");
  return response.json();
}

async function createMeme(data: CreateMemeRequest): Promise<Meme> {
  const response = await fetch("/api/memes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create meme");
  }
  const result = await response.json();
  return result.meme;
}

async function likeMeme(
  memeId: string
): Promise<{ liked: boolean; like_count: number }> {
  const response = await fetch(`/api/memes/${memeId}/like`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to like meme");
  return response.json();
}

export function useMemes(params: FetchMemesParams = {}) {
  const queryClient = useQueryClient();

  const memesQuery = useQuery({
    queryKey: COMMUNITY_KEYS.memes(params),
    queryFn: () => fetchMemes(params),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: createMeme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "memes"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: likeMeme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "memes"] });
    },
  });

  return {
    memes: memesQuery.data?.memes,
    total: memesQuery.data?.total,
    hasMore: memesQuery.data?.hasMore,
    isLoading: memesQuery.isLoading,
    error: memesQuery.error,
    createMeme: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    likeMeme: likeMutation.mutateAsync,
    isLiking: likeMutation.isPending,
  };
}
