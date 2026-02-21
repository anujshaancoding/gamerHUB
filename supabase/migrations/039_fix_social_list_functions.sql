-- Fix: Social list functions were excluding mutual follows (friends),
-- causing empty lists when the profile header counted ALL follows.
-- The "Following" list should show everyone a user follows,
-- and "Followers" should show everyone who follows them,
-- regardless of whether the follow is mutual.

-- Fix get_user_following_list: remove the mutual-follow exclusion
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

-- Fix get_user_followers_list: remove the mutual-follow exclusion
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

-- Fix get_user_social_counts: count ALL follows, not just one-way
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
    (SELECT COUNT(*)::INT FROM public.follows f WHERE f.following_id = p_user_id) AS followers_count,
    (SELECT COUNT(*)::INT FROM public.follows f WHERE f.follower_id = p_user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
