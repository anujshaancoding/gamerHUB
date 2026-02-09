-- Migration: 036_fix_pro_players_ambiguous.sql
-- Fix ambiguous user_id column reference in get_pro_players_by_games function

-- Drop and recreate the function with proper table aliasing
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
    -- Use table alias to avoid ambiguity with RETURNS TABLE user_id column
    SELECT ug_user.game_id
    FROM public.user_games ug_user
    WHERE ug_user.user_id = p_user_id
  ),
  pro_player_followers AS (
    SELECT
      p.id AS pro_user_id,
      (SELECT COUNT(*)::INT FROM public.follows f WHERE f.following_id = p.id) AS pro_follower_count
    FROM public.profiles p
    WHERE p.gaming_style = 'pro'
      AND p.id != p_user_id
      -- Not blocked
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE (bu.blocker_id = p_user_id AND bu.blocked_id = p.id)
           OR (bu.blocker_id = p.id AND bu.blocked_id = p_user_id)
      )
  )
  SELECT
    ppf.pro_user_id AS user_id,
    ppf.pro_follower_count AS follower_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', ug.game_id,
        'game_name', g.name,
        'rank', ug.rank
      )
    ) AS common_games
  FROM pro_player_followers ppf
  JOIN public.user_games ug ON ug.user_id = ppf.pro_user_id
  JOIN public.games g ON g.id = ug.game_id
  WHERE ug.game_id IN (SELECT ugi.game_id FROM user_game_ids ugi)
  GROUP BY ppf.pro_user_id, ppf.pro_follower_count
  ORDER BY ppf.pro_follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pro_players_by_games TO authenticated;
