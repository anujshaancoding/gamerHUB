import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ConsoleConnection,
  ConsolePlatform,
  CrossplayParty,
  GamePlatform,
  JoinCrossplayPartyRequest,
  CreateCrossplayPartyRequest,
} from "@/types/console";

// Query keys
const CONSOLE_KEYS = {
  connections: ["console", "connections"] as const,
  parties: (filters?: object) => ["crossplay", "parties", filters] as const,
  party: (id: string) => ["crossplay", "party", id] as const,
};

// ===== Console Connections =====

async function fetchConsoleConnections(): Promise<ConsoleConnection[]> {
  const platforms: ConsolePlatform[] = ["playstation", "xbox", "nintendo"];
  const connections: ConsoleConnection[] = [];

  for (const platform of platforms) {
    const response = await fetch(`/api/integrations/${platform}/connect`);
    if (response.ok) {
      const data = await response.json();
      if (data.connection) {
        connections.push(data.connection);
      }
    }
  }

  return connections;
}

async function connectConsole(
  data: { platform: ConsolePlatform } & Record<string, string>
): Promise<ConsoleConnection> {
  const { platform, ...body } = data;
  const response = await fetch(`/api/integrations/${platform}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to connect");
  }

  const result = await response.json();
  return result.connection;
}

async function disconnectConsole(platform: ConsolePlatform): Promise<void> {
  const response = await fetch(`/api/integrations/${platform}/connect`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to disconnect");
  }
}

export function useConsolePlatforms() {
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: CONSOLE_KEYS.connections,
    queryFn: fetchConsoleConnections,
    staleTime: 1000 * 60 * 5,
  });

  const connectMutation = useMutation({
    mutationFn: connectConsole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLE_KEYS.connections });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectConsole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLE_KEYS.connections });
    },
  });

  return {
    connections: connectionsQuery.data,
    isLoading: connectionsQuery.isLoading,
    error: connectionsQuery.error,

    connect: connectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,

    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,

    getConnection: (platform: ConsolePlatform) =>
      connectionsQuery.data?.find((c) => c.platform === platform),
  };
}

// ===== Crossplay Parties =====

interface FetchPartiesParams {
  gameId?: string;
  platform?: GamePlatform;
  status?: string;
  myParties?: boolean;
  limit?: number;
  offset?: number;
}

async function fetchParties(
  params: FetchPartiesParams
): Promise<{ parties: CrossplayParty[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams();

  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.platform) searchParams.set("platform", params.platform);
  if (params.status) searchParams.set("status", params.status);
  if (params.myParties) searchParams.set("my_parties", "true");
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/crossplay/parties?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch parties");
  }

  return response.json();
}

async function fetchParty(id: string): Promise<CrossplayParty> {
  const response = await fetch(`/api/crossplay/parties/${id}`);

  if (!response.ok) {
    throw new Error("Party not found");
  }

  const data = await response.json();
  return data.party;
}

async function createParty(
  data: CreateCrossplayPartyRequest
): Promise<CrossplayParty> {
  const response = await fetch("/api/crossplay/parties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create party");
  }

  const result = await response.json();
  return result.party;
}

async function joinPartyRequest(
  partyId: string,
  data: JoinCrossplayPartyRequest
): Promise<CrossplayParty> {
  const response = await fetch(`/api/crossplay/parties/${partyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to join party");
  }

  const result = await response.json();
  return result.party;
}

async function updateParty(
  partyId: string,
  data: Record<string, unknown>
): Promise<CrossplayParty> {
  const response = await fetch(`/api/crossplay/parties/${partyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update party");
  }

  const result = await response.json();
  return result.party;
}

async function leaveParty(partyId: string): Promise<void> {
  const response = await fetch(`/api/crossplay/parties/${partyId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to leave party");
  }
}

export function useCrossplayParties(params: FetchPartiesParams = {}) {
  const queryClient = useQueryClient();

  const partiesQuery = useQuery({
    queryKey: CONSOLE_KEYS.parties(params),
    queryFn: () => fetchParties(params),
    staleTime: 1000 * 30, // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: createParty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossplay", "parties"] });
    },
  });

  const joinMutation = useMutation({
    mutationFn: ({
      partyId,
      data,
    }: {
      partyId: string;
      data: JoinCrossplayPartyRequest;
    }) => joinPartyRequest(partyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossplay", "parties"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      partyId,
      data,
    }: {
      partyId: string;
      data: Record<string, unknown>;
    }) => updateParty(partyId, data),
    onSuccess: (party) => {
      queryClient.setQueryData(CONSOLE_KEYS.party(party.id), party);
      queryClient.invalidateQueries({ queryKey: ["crossplay", "parties"] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveParty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossplay", "parties"] });
    },
  });

  return {
    parties: partiesQuery.data?.parties,
    total: partiesQuery.data?.total,
    hasMore: partiesQuery.data?.hasMore,
    isLoading: partiesQuery.isLoading,
    error: partiesQuery.error,

    createParty: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    joinParty: (partyId: string, data: JoinCrossplayPartyRequest) =>
      joinMutation.mutateAsync({ partyId, data }),
    isJoining: joinMutation.isPending,

    updateParty: (partyId: string, data: Record<string, unknown>) =>
      updateMutation.mutateAsync({ partyId, data }),
    isUpdating: updateMutation.isPending,

    leaveParty: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,
  };
}

// Hook for a single party
export function useCrossplayParty(partyId: string) {
  const queryClient = useQueryClient();

  const partyQuery = useQuery({
    queryKey: CONSOLE_KEYS.party(partyId),
    queryFn: () => fetchParty(partyId),
    enabled: !!partyId,
    staleTime: 1000 * 10, // 10 seconds
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateParty(partyId, data),
    onSuccess: (party) => {
      queryClient.setQueryData(CONSOLE_KEYS.party(partyId), party);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveParty(partyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLE_KEYS.party(partyId) });
      queryClient.invalidateQueries({ queryKey: ["crossplay", "parties"] });
    },
  });

  return {
    party: partyQuery.data,
    isLoading: partyQuery.isLoading,
    error: partyQuery.error,

    updateParty: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    leaveParty: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,

    refetch: partyQuery.refetch,
  };
}
