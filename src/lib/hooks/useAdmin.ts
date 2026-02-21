"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { AdminRole } from "@/types/admin";

export function useAdmin() {
  const { user } = useAuth();
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "access", user?.id],
    queryFn: async () => {
      if (!user) return { is_admin: false, admin_role: null };

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, admin_role")
        .eq("id", user.id)
        .single();

      return {
        is_admin: profile?.is_admin ?? false,
        admin_role: (profile?.admin_role as AdminRole) ?? null,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  return {
    isAdmin: data?.is_admin ?? false,
    adminRole: data?.admin_role ?? null,
    isLoading: isLoading || !user,
  };
}
