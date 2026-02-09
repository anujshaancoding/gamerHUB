"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CommitmentContract,
  CreateContractRequest,
  CheckInRequest,
  CommitmentStatus,
} from "@/types/commitment";

// Query keys
const COMMITMENT_KEYS = {
  contracts: (status?: CommitmentStatus) => ["commitments", status] as const,
  contract: (id: string) => ["commitment", id] as const,
};

// List user's commitments
export function useCommitments(status?: CommitmentStatus, includeCompleted?: boolean) {
  return useQuery({
    queryKey: COMMITMENT_KEYS.contracts(status),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (includeCompleted) params.set("include_completed", "true");

      const response = await fetch(`/api/commitments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch commitments");
      return response.json() as Promise<{ contracts: CommitmentContract[] }>;
    },
  });
}

// Get single commitment
export function useCommitment(id: string) {
  return useQuery({
    queryKey: COMMITMENT_KEYS.contract(id),
    queryFn: async () => {
      const response = await fetch(`/api/commitments/${id}`);
      if (!response.ok) throw new Error("Failed to fetch commitment");
      return response.json() as Promise<{
        contract: CommitmentContract;
        isCreator: boolean;
        isParticipant: boolean;
      }>;
    },
    enabled: !!id,
  });
}

// Create commitment
export function useCreateCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContractRequest) => {
      const response = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create commitment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });
}

// Respond to commitment (accept/decline)
export function useRespondToCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      accepted,
    }: {
      contractId: string;
      accepted: boolean;
    }) => {
      const response = await fetch(`/api/commitments/${contractId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to respond");
      }
      return response.json();
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({
        queryKey: COMMITMENT_KEYS.contract(contractId),
      });
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });
}

// Check in to commitment
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      data,
    }: {
      contractId: string;
      data: CheckInRequest;
    }) => {
      const response = await fetch(`/api/commitments/${contractId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check in");
      }
      return response.json();
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({
        queryKey: COMMITMENT_KEYS.contract(contractId),
      });
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });
}

// Cancel commitment
export function useCancelCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const response = await fetch(`/api/commitments/${contractId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });
}

// Get active commitments count
export function useActiveCommitmentsCount() {
  const { data } = useCommitments("active");
  return data?.contracts?.length || 0;
}

// Get pending invitations
export function usePendingInvitations() {
  const { data, isLoading } = useCommitments("pending");

  // Filter to only show contracts where user hasn't accepted yet
  const pending =
    data?.contracts?.filter((c) =>
      c.participants.some((p) => !p.accepted)
    ) || [];

  return {
    invitations: pending,
    count: pending.length,
    isLoading,
  };
}
