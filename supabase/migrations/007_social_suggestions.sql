-- GamerHub Social Suggestions Schema
-- Migration: 007_social_suggestions.sql
--
-- Features:
-- - Mutual friends suggestions (friends of friends)
-- - Similar rank player suggestions
-- - Pro players in user's games
-- - Public social lists (followers, following, friends)

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_games_game_rank ON public.user_games(game_id, rank) WHERE rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_pro ON public.profiles(gaming_style) WHERE gaming_style = 'pro';
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get mutual friends (friends of friends)
-- Returns users who are friends with current user's friends but not the current user
CREATE OR REPLACE FUNCTION public.get_mutual_friends(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  mutual_friend_count INT,
  mutual_friend_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH user_friends AS (
    -- Get current user's friends (mutual follows)
    SELECT f1.following_id AS friend_id
    FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = p_user_id
  ),
  friends_of_friends AS (
    -- Get friends of those friends (also mutual follows)
    SELECT
      f1.following_id AS potential_friend_id,
      uf.friend_id AS through_friend_id
    FROM user_friends uf
    INNER JOIN public.follows f1 ON f1.follower_id = uf.friend_id
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.following_id != p_user_id
  )
  SELECT
    fof.potential_friend_id AS user_id,
    COUNT(DISTINCT fof.through_friend_id)::INT AS mutual_friend_count,
    ARRAY_AGG(DISTINCT fof.through_friend_id) AS mutual_friend_ids
  FROM friends_of_friends fof
  WHERE
    -- Not already friends with user
    fof.potential_friend_id NOT IN (SELECT friend_id FROM user_friends)
    -- Not blocked
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = p_user_id AND blocked_id = fof.potential_friend_id)
         OR (blocker_id = fof.potential_friend_id AND blocked_id = p_user_id)
    )
  GROUP BY fof.potential_friend_id
  ORDER BY mutual_friend_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get similar rank players
-- Returns users who play the same games with similar ranks (within tolerance)
CREATE OR REPLACE FUNCTION public.get_similar_rank_players(
  p_user_id UUID,
  p_rank_tolerance INT DEFAULT 2,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  common_games_count INT,
  matching_games JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_games_with_ranks AS (
    -- Get user's games with rank info
    SELECT
      ug.game_id,
      ug.rank,
      g.name AS game_name,
      g.ranks AS game_ranks
    FROM public.user_games ug
    JOIN public.games g ON g.id = ug.game_id
    WHERE ug.user_id = p_user_id AND ug.rank IS NOT NULL
  ),
  user_rank_positions AS (
    -- Calculate rank positions for user's games
    SELECT
      ugr.game_id,
      ugr.rank,
      ugr.game_name,
      ugr.game_ranks,
      (
        SELECT idx - 1
        FROM jsonb_array_elements_text(ugr.game_ranks) WITH ORDINALITY AS t(rank_name, idx)
        WHERE t.rank_name = ugr.rank
        LIMIT 1
      ) AS rank_position
    FROM user_games_with_ranks ugr
  ),
  other_users_with_positions AS (
    -- Get other users' games with rank positions
    SELECT
      ug.user_id,
      ug.game_id,
      ug.rank,
      g.name AS game_name,
      (
        SELECT idx - 1
        FROM jsonb_array_elements_text(g.ranks) WITH ORDINALITY AS t(rank_name, idx)
        WHERE t.rank_name = ug.rank
        LIMIT 1
      ) AS rank_position
    FROM public.user_games ug
    JOIN public.games g ON g.id = ug.game_id
    WHERE ug.user_id != p_user_id AND ug.rank IS NOT NULL
  )
  SELECT
    oup.user_id,
    COUNT(DISTINCT oup.game_id)::INT AS common_games_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', oup.game_id,
        'game_name', oup.game_name,
        'user_rank', urp.rank,
        'their_rank', oup.rank
      )
    ) AS matching_games
  FROM other_users_with_positions oup
  JOIN user_rank_positions urp ON urp.game_id = oup.game_id
  WHERE
    -- Rank within tolerance
    ABS(COALESCE(oup.rank_position, 0) - COALESCE(urp.rank_position, 0)) <= p_rank_tolerance
    -- Not already friends
    AND NOT public.are_friends(p_user_id, oup.user_id)
    -- Not blocked
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = p_user_id AND blocked_id = oup.user_id)
         OR (blocker_id = oup.user_id AND blocked_id = p_user_id)
    )
  GROUP BY oup.user_id
  ORDER BY common_games_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pro players who play user's games
-- Returns pro/verified players ordered by follower count
CREATE OR REPLACE FUNCTION public.get_pro_players_by_games(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  follower_count INT,
  common_games JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_game_ids AS (
    SELECT game_id FROM public.user_games WHERE user_id = p_user_id
  ),
  pro_player_followers AS (
    SELECT
      p.id AS user_id,
      (SELECT COUNT(*)::INT FROM public.follows WHERE following_id = p.id) AS follower_count
    FROM public.profiles p
    WHERE p.gaming_style = 'pro'
      AND p.id != p_user_id
      -- Not blocked
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE (blocker_id = p_user_id AND blocked_id = p.id)
           OR (blocker_id = p.id AND blocked_id = p_user_id)
      )
  )
  SELECT
    ppf.user_id,
    ppf.follower_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', ug.game_id,
        'game_name', g.name,
        'rank', ug.rank
      )
    ) AS common_games
  FROM pro_player_followers ppf
  JOIN public.user_games ug ON ug.user_id = ppf.user_id
  JOIN public.games g ON g.id = ug.game_id
  WHERE ug.game_id IN (SELECT game_id FROM user_game_ids)
  GROUP BY ppf.user_id, ppf.follower_count
  ORDER BY ppf.follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular pro players (no user context required)
-- Useful for anonymous users or users without games
CREATE OR REPLACE FUNCTION public.get_popular_pro_players(
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  follower_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    (SELECT COUNT(*)::INT FROM public.follows WHERE following_id = p.id) AS follower_count
  FROM public.profiles p
  WHERE p.gaming_style = 'pro'
  ORDER BY follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's friends list (public)
CREATE OR REPLACE FUNCTION public.get_user_friends_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  friend_id UUID,
  friends_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f1.following_id AS friend_id,
    GREATEST(f1.created_at, f2.created_at) AS friends_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f1.following_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f1.following_id
      )
    END AS is_viewer_following
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.follower_id = f2.following_id
    AND f1.following_id = f2.follower_id
  WHERE f1.follower_id = p_user_id
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f1.following_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY friends_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's followers list (public, excludes friends)
CREATE OR REPLACE FUNCTION public.get_user_followers_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  follower_id UUID,
  followed_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.follower_id,
    f.created_at AS followed_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.follower_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.follower_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.following_id = p_user_id
    -- Exclude mutual follows (friends)
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = p_user_id AND f2.following_id = f.follower_id
    )
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.follower_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY followed_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's following list (public, excludes friends)
CREATE OR REPLACE FUNCTION public.get_user_following_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  following_id UUID,
  following_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.following_id,
    f.created_at AS following_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.following_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.following_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.follower_id = p_user_id
    -- Exclude mutual follows (friends)
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = f.following_id AND f2.following_id = p_user_id
    )
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.following_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY following_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total counts for a user's social lists
CREATE OR REPLACE FUNCTION public.get_user_social_counts(p_user_id UUID)
RETURNS TABLE (
  friends_count INT,
  followers_count INT,
  following_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    public.get_friend_count(p_user_id) AS friends_count,
    public.get_followers_only_count(p_user_id) AS followers_count,
    public.get_following_only_count(p_user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_mutual_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_similar_rank_players TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pro_players_by_games TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_pro_players TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_friends_list TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_followers_list TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_following_list TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_social_counts TO authenticated, anon;
