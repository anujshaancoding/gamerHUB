"use client";

import { useCallback } from "react";
import { useMyBlogPosts, useApplyAsAuthor } from "./useBlog";

/**
 * Hook to check if the current user is a blog author and auto-register if needed.
 */
export function useBlogAuthor() {
  const { author, loading, refetch } = useMyBlogPosts();
  const { apply, isApplying } = useApplyAsAuthor();

  const isAuthor = !!author;

  const ensureAuthor = useCallback(async () => {
    if (isAuthor) return author;
    try {
      const newAuthor = await apply();
      await refetch();
      return newAuthor;
    } catch (err) {
      // If user is already an author (race condition), just refetch
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("already")
      ) {
        await refetch();
        return author;
      }
      throw err;
    }
  }, [isAuthor, author, apply, refetch]);

  return {
    author,
    isAuthor,
    loading,
    ensureAuthor,
    isRegistering: isApplying,
  };
}
