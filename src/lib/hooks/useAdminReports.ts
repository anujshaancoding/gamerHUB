"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type {
  UserReport,
  ReportStatus,
  ReportPriority,
  ReportType,
} from "@/types/verification";

export interface AdminReportFilters {
  status?: ReportStatus | "";
  priority?: ReportPriority | "";
  report_type?: ReportType | "";
  page?: number;
  limit?: number;
}

const adminReportKeys = {
  all: ["admin", "reports"] as const,
  list: (filters: AdminReportFilters) =>
    ["admin", "reports", "list", filters] as const,
};

export function useAdminReports(filters: AdminReportFilters = {}) {
  const { page = 1, limit = 20, ...rest } = filters;
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminReportKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rest.status) params.set("status", rest.status);
      if (rest.priority) params.set("priority", rest.priority);
      if (rest.report_type) params.set("report_type", rest.report_type);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const response = await fetch(
        `/api/admin/reports?${params.toString()}`
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Failed to fetch reports");
      return json as { reports: UserReport[]; total: number };
    },
    staleTime: 1000 * 30,
  });

  return {
    reports: data?.reports || [],
    total: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / limit),
    page,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      report_id,
      status,
      resolution_note,
      resolution_action,
    }: {
      report_id: string;
      status: ReportStatus;
      resolution_note?: string;
      resolution_action?: string;
    }) => {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id,
          status,
          resolution_note,
          resolution_action,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update report");
      return data.report as UserReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReportKeys.all });
    },
  });

  return {
    resolveReport: mutation.mutateAsync,
    isResolving: mutation.isPending,
  };
}
