import type { AdminRole } from "@/types/admin";

// ============================================
// GamerHub Role-Based Permission System
// Single source of truth for all role checks
// See docs/ROLE_SYSTEM.md for full documentation
// ============================================

export type UserTier = "free" | "premium" | "editor" | "admin";

export interface UserPermissionContext {
  userId: string;
  isPremium: boolean;
  isAdmin: boolean;
  adminRole: AdminRole | null;
}

/**
 * Resolves a user's tier from their profile fields.
 *
 * Hierarchy: admin > editor > premium > free
 * - Admin: is_admin + admin_role = 'super_admin'
 * - Editor: is_admin + admin_role = 'editor'
 * - Premium: is_premium = true
 * - Free: default (no flags)
 */
export function getUserTier(ctx: UserPermissionContext): UserTier {
  if (ctx.isAdmin && ctx.adminRole === "super_admin") return "admin";
  if (ctx.isAdmin && ctx.adminRole === "editor") return "editor";
  if (ctx.isPremium) return "premium";
  return "free";
}

/** Permission check functions — each takes a tier and returns boolean */
export const can = {
  // Free users and above
  createFriendPost: (_tier: UserTier) => true,
  deleteOwnComment: (_tier: UserTier) => true,
  deleteCommentOnOwnPost: (_tier: UserTier) => true,

  // Premium users and above
  createBlogPost: (tier: UserTier) => tier !== "free",
  reportUser: (tier: UserTier) => tier !== "free",
  giveNegativeEndorsement: (tier: UserTier) => tier !== "free",

  // Editors and above
  useNewsCategory: (tier: UserTier) => tier === "editor" || tier === "admin",
  deleteFreeUserPost: (tier: UserTier) => tier === "editor" || tier === "admin",
  holdBlogPost: (tier: UserTier) => tier === "editor" || tier === "admin",
  approveBlogPost: (tier: UserTier) => tier === "editor" || tier === "admin",
  suggestEdits: (tier: UserTier) => tier === "editor" || tier === "admin",
  deleteAnyComment: (tier: UserTier) => tier === "editor" || tier === "admin",

  // Admin only
  fullCrud: (tier: UserTier) => tier === "admin",
  manageUsers: (tier: UserTier) => tier === "admin",
  manageEditors: (tier: UserTier) => tier === "admin",
};
