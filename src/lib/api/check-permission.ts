import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import type { UserPermissionContext } from "@/lib/permissions";
import { isPromoPeriodActive } from "@/lib/promo";

/**
 * Server-side helper for API routes.
 * Fetches the current user's profile and returns their permission context.
 *
 * @returns UserPermissionContext or null if not authenticated
 */
export async function getUserPermissionContext(): Promise<UserPermissionContext | null> {
  const user = await getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, admin_role, is_premium, premium_until")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Premium is currently unlocked for every logged-in user (see lib/promo.ts).
  // Once paid premium returns, drop the promo override and the DB flags take over.
  const isPremium =
    isPromoPeriodActive() ||
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
