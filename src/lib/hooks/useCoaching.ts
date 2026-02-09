"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CoachProfile,
  CoachingSession,
  CoachReview,
  CreateCoachProfileRequest,
  UpdateCoachProfileRequest,
  BookSessionRequest,
  SubmitReviewRequest,
  SessionType,
  SessionStatus,
  CoachingStatus,
} from "@/types/coaching";

// Query keys
const COACHING_KEYS = {
  coaches: (filters?: Record<string, unknown>) => ["coaches", filters] as const,
  coach: (id: string) => ["coach", id] as const,
  coachReviews: (id: string) => ["coach", id, "reviews"] as const,
  myCoachProfile: ["my-coach-profile"] as const,
  sessions: (filters?: Record<string, unknown>) => ["coaching-sessions", filters] as const,
  session: (id: string) => ["coaching-session", id] as const,
};

// List coaches
export function useCoaches(filters?: {
  game_id?: string;
  specialty?: string;
  language?: string;
  min_rating?: number;
  max_price?: number;
  free_only?: boolean;
  status?: CoachingStatus;
  featured?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: COACHING_KEYS.coaches(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      const response = await fetch(`/api/coaches?${params}`);
      if (!response.ok) throw new Error("Failed to fetch coaches");
      return response.json() as Promise<{
        coaches: CoachProfile[];
        total: number;
      }>;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get single coach
export function useCoach(coachId: string) {
  return useQuery({
    queryKey: COACHING_KEYS.coach(coachId),
    queryFn: async () => {
      const response = await fetch(`/api/coaches/${coachId}`);
      if (!response.ok) throw new Error("Failed to fetch coach");
      return response.json() as Promise<{ coach: CoachProfile }>;
    },
    enabled: !!coachId,
  });
}

// Get coach reviews
export function useCoachReviews(coachId: string, sortBy?: string) {
  return useQuery({
    queryKey: [...COACHING_KEYS.coachReviews(coachId), sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) params.set("sort", sortBy);
      const response = await fetch(`/api/coaches/${coachId}/reviews?${params}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json() as Promise<{
        reviews: CoachReview[];
        total: number;
        distribution: Record<number, number>;
      }>;
    },
    enabled: !!coachId,
  });
}

// Get current user's coach profile
export function useMyCoachProfile() {
  return useQuery({
    queryKey: COACHING_KEYS.myCoachProfile,
    queryFn: async () => {
      const response = await fetch("/api/coaches?own=true");
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch coach profile");
      }
      const data = await response.json();
      return data.coaches?.[0] || null;
    },
    retry: false,
  });
}

// Create coach profile (become a coach)
export function useBecomeCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCoachProfileRequest) => {
      const response = await fetch("/api/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create coach profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COACHING_KEYS.myCoachProfile });
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
    },
  });
}

// Update coach profile
export function useUpdateCoachProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      coachId,
      data,
    }: {
      coachId: string;
      data: UpdateCoachProfileRequest;
    }) => {
      const response = await fetch(`/api/coaches/${coachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (_, { coachId }) => {
      queryClient.invalidateQueries({ queryKey: COACHING_KEYS.coach(coachId) });
      queryClient.invalidateQueries({ queryKey: COACHING_KEYS.myCoachProfile });
    },
  });
}

// List sessions
export function useSessions(filters?: {
  role?: "coach" | "student" | "both";
  status?: SessionStatus;
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: COACHING_KEYS.sessions(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      const response = await fetch(`/api/coaching/sessions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json() as Promise<{
        sessions: CoachingSession[];
        isCoach: boolean;
      }>;
    },
  });
}

// Get session details
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: COACHING_KEYS.session(sessionId),
    queryFn: async () => {
      const response = await fetch(`/api/coaching/sessions/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json() as Promise<{
        session: CoachingSession;
        isCoach: boolean;
        isStudent: boolean;
      }>;
    },
    enabled: !!sessionId,
  });
}

// Book a session
export function useBookSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BookSessionRequest) => {
      const response = await fetch("/api/coaching/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
    },
  });
}

// Update session (confirm, cancel, complete, etc.)
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: Partial<{
        status: SessionStatus;
        notes: string;
        meeting_link: string;
        recording_url: string;
        topic: string;
        goals: string[];
        scheduled_at: string;
      }>;
    }) => {
      const response = await fetch(`/api/coaching/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update session");
      }
      return response.json();
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: COACHING_KEYS.session(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
    },
  });
}

// Cancel session
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/coaching/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
    },
  });
}

// Submit review
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      coachId,
      data,
    }: {
      coachId: string;
      data: SubmitReviewRequest;
    }) => {
      const response = await fetch(`/api/coaches/${coachId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }
      return response.json();
    },
    onSuccess: (_, { coachId }) => {
      queryClient.invalidateQueries({
        queryKey: COACHING_KEYS.coachReviews(coachId),
      });
      queryClient.invalidateQueries({ queryKey: COACHING_KEYS.coach(coachId) });
    },
  });
}

// Combined hook for coach dashboard
export function useCoachDashboard() {
  const profile = useMyCoachProfile();
  const upcomingSessions = useSessions({ role: "coach", upcoming: true });
  const recentSessions = useSessions({ role: "coach", past: true, limit: 5 });

  return {
    profile: profile.data,
    isLoading: profile.isLoading,
    isCoach: !!profile.data,
    upcomingSessions: upcomingSessions.data?.sessions || [],
    recentSessions: recentSessions.data?.sessions || [],
    isLoadingSessions:
      upcomingSessions.isLoading || recentSessions.isLoading,
    refetch: () => {
      profile.refetch();
      upcomingSessions.refetch();
      recentSessions.refetch();
    },
  };
}

// Combined hook for student's coaching view
export function useStudentCoaching() {
  const upcomingSessions = useSessions({ role: "student", upcoming: true });
  const pastSessions = useSessions({ role: "student", past: true, limit: 10 });

  return {
    upcomingSessions: upcomingSessions.data?.sessions || [],
    pastSessions: pastSessions.data?.sessions || [],
    isLoading: upcomingSessions.isLoading || pastSessions.isLoading,
    refetch: () => {
      upcomingSessions.refetch();
      pastSessions.refetch();
    },
  };
}
