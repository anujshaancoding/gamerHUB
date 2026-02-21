import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CommunityListing,
  CreateListingRequest,
  AddWinnerRequest,
  ListingFilters,
  ListingComment,
  CreateListingCommentInput,
} from "@/types/listings";

// Query keys
const LISTING_KEYS = {
  listings: (filters?: object) => ["community", "listings", filters] as const,
  listing: (id: string) => ["community", "listing", id] as const,
  comments: (listingId: string) => ["community", "listing-comments", listingId] as const,
};

// ===== Fetch functions =====

async function fetchListings(
  params: ListingFilters
): Promise<{ listings: CommunityListing[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set("type", params.type);
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/listings?${searchParams}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch listings");
  return response.json();
}

async function fetchListing(id: string): Promise<CommunityListing> {
  const response = await fetch(`/api/listings/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch listing");
  const result = await response.json();
  return result.listing;
}

async function createListing(
  data: CreateListingRequest
): Promise<CommunityListing> {
  const response = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create listing");
  }
  const result = await response.json();
  return result.listing;
}

async function addWinner(
  data: AddWinnerRequest
): Promise<{ winner: { id: string } }> {
  const response = await fetch(`/api/listings/${data.listing_id}/winners`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      display_name: data.display_name,
      user_id: data.user_id,
      placement: data.placement,
      prize_awarded: data.prize_awarded,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add winner");
  }
  return response.json();
}

async function removeWinner(
  listingId: string,
  winnerId: string
): Promise<void> {
  const response = await fetch(`/api/listings/${listingId}/winners`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ winner_id: winnerId }),
  });
  if (!response.ok) throw new Error("Failed to remove winner");
}

async function toggleBookmark(
  listingId: string
): Promise<{ bookmarked: boolean }> {
  const response = await fetch(`/api/listings/${listingId}/bookmark`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to toggle bookmark");
  return response.json();
}

// ===== Hooks =====

export function useListings(params: ListingFilters = {}) {
  const queryClient = useQueryClient();

  const listingsQuery = useQuery({
    queryKey: LISTING_KEYS.listings(params),
    queryFn: () => fetchListings(params),
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "listings"] });
    },
  });

  const addWinnerMutation = useMutation({
    mutationFn: addWinner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "listings"] });
    },
  });

  const removeWinnerMutation = useMutation({
    mutationFn: ({
      listingId,
      winnerId,
    }: {
      listingId: string;
      winnerId: string;
    }) => removeWinner(listingId, winnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "listings"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "listings"] });
    },
  });

  return {
    listings: listingsQuery.data?.listings,
    total: listingsQuery.data?.total,
    hasMore: listingsQuery.data?.hasMore,
    isLoading: listingsQuery.isLoading,
    error: listingsQuery.error,
    createListing: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    addWinner: addWinnerMutation.mutateAsync,
    isAddingWinner: addWinnerMutation.isPending,
    removeWinner: (listingId: string, winnerId: string) =>
      removeWinnerMutation.mutateAsync({ listingId, winnerId }),
    isRemovingWinner: removeWinnerMutation.isPending,
    toggleBookmark: bookmarkMutation.mutateAsync,
    isBookmarking: bookmarkMutation.isPending,
  };
}

export function useListing(id: string) {
  return useQuery({
    queryKey: LISTING_KEYS.listing(id),
    queryFn: () => fetchListing(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

// Hook: Like/Unlike listing
export function useLikeListing() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await fetch(`/api/listings/${listingId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to toggle like");
      return data.liked as boolean;
    },
    onSuccess: (_, listingId) => {
      queryClient.invalidateQueries({ queryKey: LISTING_KEYS.listing(listingId) });
      queryClient.invalidateQueries({ queryKey: ["community", "listings"] });
    },
  });

  return {
    toggleLike: mutation.mutateAsync,
    isLiking: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Like/Unlike a listing comment
export function useLikeListingComment(listingId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/listings/${listingId}/comments/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to toggle comment like");
      return data.liked as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTING_KEYS.comments(listingId) });
    },
  });

  return {
    toggleCommentLike: mutation.mutateAsync,
    isLikingComment: mutation.isPending,
  };
}

// Hook: Get listing comments
export function useListingComments(listingId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: LISTING_KEYS.comments(listingId),
    queryFn: async () => {
      const response = await fetch(`/api/listings/${listingId}/comments`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch comments");
      return {
        comments: data.comments as ListingComment[],
        allowComments: data.allow_comments as boolean,
      };
    },
    enabled: !!listingId,
    staleTime: 1000 * 30,
  });

  return {
    comments: data?.comments || [],
    allowComments: data?.allowComments ?? true,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// Hook: Add comment to listing
export function useAddListingComment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateListingCommentInput) => {
      const response = await fetch(`/api/listings/${input.listing_id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create comment");
      return data.comment as ListingComment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: LISTING_KEYS.comments(variables.listing_id),
      });
      queryClient.invalidateQueries({
        queryKey: LISTING_KEYS.listing(variables.listing_id),
      });
    },
  });

  return {
    addComment: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
