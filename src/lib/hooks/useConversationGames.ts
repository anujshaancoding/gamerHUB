"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_GAMES } from "@/lib/constants/games";

export function useConversationGames(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const [gameSlugs, setGameSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || !otherUserId) {
      setGameSlugs(
        SUPPORTED_GAMES.filter((g) => g.slug !== "other").map((g) => g.slug)
      );
      setLoading(false);
      return;
    }

    const fetchGames = async () => {
      const supabase = createClient();

      const [myGames, theirGames] = await Promise.all([
        supabase
          .from("user_games")
          .select("game_id, games:game_id(slug)")
          .eq("user_id", currentUserId),
        supabase
          .from("user_games")
          .select("game_id, games:game_id(slug)")
          .eq("user_id", otherUserId),
      ]);

      const mySlugs = new Set(
        (myGames.data || [])
          .map((g: Record<string, unknown>) => {
            const game = g.games as { slug: string } | null;
            return game?.slug;
          })
          .filter((s): s is string => !!s && s !== "other")
      );

      const theirSlugList = (theirGames.data || [])
        .map((g: Record<string, unknown>) => {
          const game = g.games as { slug: string } | null;
          return game?.slug;
        })
        .filter((s): s is string => !!s && s !== "other");

      // Common games first
      const common = theirSlugList.filter((s) => mySlugs.has(s));

      if (common.length > 0) {
        setGameSlugs(common);
      } else if (theirSlugList.length > 0) {
        setGameSlugs(theirSlugList);
      } else {
        setGameSlugs(
          SUPPORTED_GAMES.filter((g) => g.slug !== "other").map((g) => g.slug)
        );
      }

      setLoading(false);
    };

    fetchGames();
  }, [currentUserId, otherUserId]);

  return { gameSlugs, loading };
}
