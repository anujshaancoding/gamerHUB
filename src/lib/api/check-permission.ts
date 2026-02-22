import { createAdminClient } from "@/lib/supabase/admin";
import type { UserPermissionContext } from "@/lib/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side helper for API routes.
 * Fetches the current user's profile and returns their permission context.
 *
 * @param supabase - The authenticated Supabase client (from createClient())
 * @returns UserPermissionContext or null if not authenticated
 */
export async function getUserPermissionContext(
  supabase: SupabaseClient
): Promise<UserPermissionContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, admin_role, is_premium, premium_until")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Check premium status: either has active premium flag or premium_until hasn't expired
  const isPremium =
    profile.is_premium === true ||
    (profile.premium_until
      ? new Date(profile.premium_until) > new Date()
      : false);

  return {
    userId: user.id,
    isPremium,
    isAdmin: profile.is_admin ?? false,
    adminRole: (profile.admin_role as UserPermissionContext["adminRole"]) ?? null,
  };
}
