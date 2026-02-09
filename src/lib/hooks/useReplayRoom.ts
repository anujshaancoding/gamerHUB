"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ReplayRoom,
  RoomParticipant,
  ReplayMessage,
  ReplayMarker,
  CreateRoomRequest,
  UpdateRoomRequest,
  SendMessageRequest,
  AddMarkerRequest,
} from "@/types/replay";

// Query keys
const REPLAY_KEYS = {
  rooms: (filters?: Record<string, unknown>) => ["replay-rooms", filters] as const,
  room: (id: string) => ["replay-room", id] as const,
  messages: (roomId: string) => ["replay-messages", roomId] as const,
};

// List public rooms
export function usePublicRooms(gameId?: string) {
  return useQuery({
    queryKey: REPLAY_KEYS.rooms({ public: true, game_id: gameId }),
    queryFn: async () => {
      const params = new URLSearchParams({ public: "true" });
      if (gameId) params.set("game_id", gameId);
      const response = await fetch(`/api/replay-rooms?${params}`);
      if (!response.ok) throw new Error("Failed to fetch rooms");
      return response.json() as Promise<{ rooms: ReplayRoom[] }>;
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}

// List user's rooms
export function useMyReplayRooms() {
  return useQuery({
    queryKey: REPLAY_KEYS.rooms({ my_rooms: true }),
    queryFn: async () => {
      const response = await fetch("/api/replay-rooms?my_rooms=true");
      if (!response.ok) throw new Error("Failed to fetch rooms");
      return response.json() as Promise<{ rooms: ReplayRoom[] }>;
    },
  });
}

// Get room by ID or code
export function useReplayRoom(idOrCode: string) {
  return useQuery({
    queryKey: REPLAY_KEYS.room(idOrCode),
    queryFn: async () => {
      const response = await fetch(`/api/replay-rooms/${idOrCode}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Room not found");
        if (response.status === 403) throw new Error("Room is private");
        throw new Error("Failed to fetch room");
      }
      return response.json() as Promise<{
        room: ReplayRoom & {
          participants: RoomParticipant[];
          markers: ReplayMarker[];
        };
        isHost: boolean;
        isParticipant: boolean;
      }>;
    },
    enabled: !!idOrCode,
    refetchInterval: 5 * 1000, // Refresh every 5 seconds for sync
  });
}

// Create room
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomRequest) => {
      const response = await fetch("/api/replay-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room");
      }
      return response.json() as Promise<{ room: ReplayRoom }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replay-rooms"] });
    },
  });
}

// Update room
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      data,
    }: {
      roomId: string;
      data: UpdateRoomRequest;
    }) => {
      const response = await fetch(`/api/replay-rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update room");
      }
      return response.json();
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: REPLAY_KEYS.room(roomId) });
    },
  });
}

// Join room
export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`/api/replay-rooms/${code}/join`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join room");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: REPLAY_KEYS.room(data.room?.id),
      });
    },
  });
}

// Leave room
export function useLeaveRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`/api/replay-rooms/${roomId}/leave`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to leave room");
      }
      return response.json();
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: REPLAY_KEYS.room(roomId) });
      queryClient.invalidateQueries({ queryKey: ["replay-rooms"] });
    },
  });
}

// Add marker
export function useAddMarker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      data,
    }: {
      roomId: string;
      data: AddMarkerRequest;
    }) => {
      const response = await fetch(`/api/replay-rooms/${roomId}/markers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add marker");
      }
      return response.json();
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: REPLAY_KEYS.room(roomId) });
    },
  });
}

// Playback sync hook
export function usePlaybackSync(
  roomId: string,
  isHost: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  const { data } = useReplayRoom(roomId);
  const updateRoom = useUpdateRoom();
  const [localTime, setLocalTime] = useState(0);

  // Sync from server (for viewers)
  useEffect(() => {
    if (!data?.room || isHost || !videoRef.current) return;

    const serverTime = data.room.current_time;
    const diff = Math.abs(serverTime - localTime);

    // If difference is more than 2 seconds, seek to server time
    if (diff > 2) {
      videoRef.current.currentTime = serverTime;
      setLocalTime(serverTime);
    }

    // Sync playback state
    if (data.room.status === "playing" && videoRef.current.paused) {
      videoRef.current.play();
    } else if (data.room.status === "paused" && !videoRef.current.paused) {
      videoRef.current.pause();
    }

    // Sync playback speed
    if (videoRef.current.playbackRate !== data.room.playback_speed) {
      videoRef.current.playbackRate = data.room.playback_speed;
    }
  }, [data?.room, isHost, localTime, videoRef]);

  // Update server time (for host)
  const updateServerTime = useCallback(
    (time: number) => {
      if (!isHost) return;
      setLocalTime(time);

      // Throttle updates to every 5 seconds
      const now = Date.now();
      if (now - (updateServerTime as any).lastUpdate < 5000) return;
      (updateServerTime as any).lastUpdate = now;

      updateRoom.mutate({
        roomId,
        data: { current_time: Math.floor(time) },
      });
    },
    [isHost, roomId, updateRoom]
  );
  (updateServerTime as any).lastUpdate = 0;

  // Control functions for host
  const play = useCallback(() => {
    if (!isHost) return;
    updateRoom.mutate({ roomId, data: { status: "playing" } });
  }, [isHost, roomId, updateRoom]);

  const pause = useCallback(() => {
    if (!isHost) return;
    updateRoom.mutate({ roomId, data: { status: "paused" } });
  }, [isHost, roomId, updateRoom]);

  const seek = useCallback(
    (time: number) => {
      if (!isHost) return;
      updateRoom.mutate({ roomId, data: { current_time: time } });
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    [isHost, roomId, updateRoom, videoRef]
  );

  const setSpeed = useCallback(
    (speed: number) => {
      if (!isHost) return;
      updateRoom.mutate({ roomId, data: { playback_speed: speed } });
    },
    [isHost, roomId, updateRoom]
  );

  return {
    play,
    pause,
    seek,
    setSpeed,
    updateServerTime,
    currentTime: data?.room?.current_time || 0,
    status: data?.room?.status || "waiting",
    playbackSpeed: data?.room?.playback_speed || 1,
  };
}

// Combined hook for room page
export function useReplayRoomPage(idOrCode: string) {
  const room = useReplayRoom(idOrCode);
  const updateRoom = useUpdateRoom();
  const joinRoom = useJoinRoom();
  const leaveRoom = useLeaveRoom();
  const addMarker = useAddMarker();

  return {
    room: room.data?.room,
    isHost: room.data?.isHost || false,
    isParticipant: room.data?.isParticipant || false,
    isLoading: room.isLoading,
    error: room.error,
    updateRoom,
    joinRoom,
    leaveRoom,
    addMarker,
    refetch: room.refetch,
  };
}
