"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  VerificationStatusResponse,
  PhoneVerificationResponse,
  ReportResponse,
  CreateReportRequest,
  UserReport,
  BlockedUser,
} from "@/types/verification";

// Query keys
export const verificationKeys = {
  all: ["verification"] as const,
  status: () => [...verificationKeys.all, "status"] as const,
  reports: () => [...verificationKeys.all, "reports"] as const,
  blocked: () => [...verificationKeys.all, "blocked"] as const,
};

// ============================================
// Verification Status
// ============================================
async function fetchVerificationStatus(): Promise<VerificationStatusResponse> {
  const response = await fetch("/api/verification/status");
  if (!response.ok) {
    throw new Error("Failed to fetch verification status");
  }
  return response.json();
}

export function useVerificationStatus() {
  return useQuery({
    queryKey: verificationKeys.status(),
    queryFn: fetchVerificationStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================
// Phone Verification
// ============================================
interface SendCodeRequest {
  phone_number: string;
  country_code: string;
}

interface VerifyCodeRequest {
  code: string;
}

async function sendVerificationCode(
  data: SendCodeRequest
): Promise<PhoneVerificationResponse> {
  const response = await fetch("/api/verification/phone/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to send verification code");
  }

  return result;
}

async function verifyPhoneCode(
  data: VerifyCodeRequest
): Promise<PhoneVerificationResponse> {
  const response = await fetch("/api/verification/phone/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to verify code");
  }

  return result;
}

export function usePhoneVerification() {
  const queryClient = useQueryClient();

  const sendCode = useMutation({
    mutationFn: sendVerificationCode,
  });

  const verifyCode = useMutation({
    mutationFn: verifyPhoneCode,
    onSuccess: () => {
      // Invalidate verification status to refresh badges and trust score
      queryClient.invalidateQueries({ queryKey: verificationKeys.status() });
    },
  });

  return {
    sendCode,
    verifyCode,
  };
}

// ============================================
// User Reports
// ============================================
interface FetchReportsParams {
  status?: string;
  limit?: number;
  offset?: number;
}

interface ReportsResponse {
  reports: UserReport[];
  total: number;
  limit: number;
  offset: number;
}

async function fetchReports(
  params: FetchReportsParams = {}
): Promise<ReportsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await fetch(`/api/reports?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }
  return response.json();
}

async function createReport(data: CreateReportRequest): Promise<ReportResponse> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create report");
  }

  return result;
}

export function useReports(params: FetchReportsParams = {}) {
  return useQuery({
    queryKey: [...verificationKeys.reports(), params],
    queryFn: () => fetchReports(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.reports() });
    },
  });
}

// ============================================
// Blocked Users
// ============================================
interface BlockedUsersResponse {
  blocked_users: BlockedUser[];
  total: number;
  limit: number;
  offset: number;
}

async function fetchBlockedUsers(
  limit = 50,
  offset = 0
): Promise<BlockedUsersResponse> {
  const response = await fetch(
    `/api/blocked?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch blocked users");
  }
  return response.json();
}

async function blockUser(
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/users/${userId}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to block user");
  }

  return result;
}

async function unblockUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/users/${userId}/block`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to unblock user");
  }

  return result;
}

interface BlockStatusResponse {
  is_blocked: boolean;
  blocked_by_me: boolean;
  blocked_by_them: boolean;
}

async function checkBlockStatus(userId: string): Promise<BlockStatusResponse> {
  const response = await fetch(`/api/users/${userId}/block`);
  if (!response.ok) {
    throw new Error("Failed to check block status");
  }
  return response.json();
}

export function useBlockedUsers(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...verificationKeys.blocked(), { limit, offset }],
    queryFn: () => fetchBlockedUsers(limit, offset),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBlockStatus(userId: string) {
  return useQuery({
    queryKey: [...verificationKeys.blocked(), "status", userId],
    queryFn: () => checkBlockStatus(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      blockUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.blocked() });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.blocked() });
    },
  });
}

// ============================================
// Trust Score Utilities
// ============================================
export function useRecalculateTrustScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/verification/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recalculate_trust" }),
      });

      if (!response.ok) {
        throw new Error("Failed to recalculate trust score");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.status() });
    },
  });
}
