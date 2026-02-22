"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { getUserTier, can } from "@/lib/permissions";

/**
 * Client-side hook that resolves the current user's tier and permissions.
 * Combines useAdmin() + useSubscription() into a single permission-aware hook.
 */
export function usePermissions() {
  const { isAdmin, adminRole, isLoading: isAdminLoading } = useAdmin();
  const { isPremium, isLoadingSubscription } = useSubscription();

  const tier = getUserTier({
    userId: "",
    isPremium,
    isAdmin,
    adminRole,
  });

  return {
    tier,
    isPremium,
    isAdmin,
    adminRole,
    isEditor: tier === "editor" || tier === "admin",
    isLoading: isAdminLoading || isLoadingSubscription,
    can: {
      createFriendPost: can.createFriendPost(tier),
      createBlogPost: can.createBlogPost(tier),
      reportUser: can.reportUser(tier),
      giveNegativeEndorsement: can.giveNegativeEndorsement(tier),
      useNewsCategory: can.useNewsCategory(tier),
      deleteFreeUserPost: can.deleteFreeUserPost(tier),
      holdBlogPost: can.holdBlogPost(tier),
      approveBlogPost: can.approveBlogPost(tier),
      suggestEdits: can.suggestEdits(tier),
      deleteAnyComment: can.deleteAnyComment(tier),
      fullCrud: can.fullCrud(tier),
      manageUsers: can.manageUsers(tier),
      manageEditors: can.manageEditors(tier),
    },
  };
}
