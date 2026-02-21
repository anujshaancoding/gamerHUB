-- ==========================================================================
-- Migration 046: Restore the complete friends system
-- ==========================================================================
--
-- ROOT CAUSE:  999_cleanup_and_focus.sql dropped friend_requests and
--              blocked_users with CASCADE.  Migration 045 recreated
--              blocked_users, but friend_requests was NEVER recreated.
--
-- Every API route that calls get_relationship_status(), send_friend_request(),
-- or queries the friend_requests table directly returns a 500 because the
-- table doesn't exist.
--
-- This migration restores EVERYTHING the friends system needs:
--   1. friend_requests table
--   2. blocked_users table  (idempotent – IF NOT EXISTS)
--   3. All views
--   4. All RPC functions     (CREATE OR REPLACE)
--   5. RLS policies          (DROP IF EXISTS + CREATE)
--   6. Grants
-- ==========================================================================


-- ============================================
-- 1. TABLES
-- ============================================

-- friend_requests — the table that was never recreated
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, recipient_id),
  CHECK (sender_id != recipient_id)
);

-- blocked_users — safety net (045 should have created it already)
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);


-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender
  ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient
  ON public.friend_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status
  ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_pending
  ON public.friend_requests(recipient_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker
  ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked
  ON public.blocked_users(blocked_id);


-- ============================================
-- 3. VIEWS
-- ============================================

-- Friends = mutual follows
CREATE OR REPLACE VIEW public.friends_view AS
SELECT
  f1.follower_id AS user_id,
  f1.following_id AS friend_id,
  GREATEST(f1.created_at, f2.created_at) AS friends_since
FROM public.follows f1
INNER JOIN public.follows f2
  ON f1.follower_id = f2.following_id
  AND f1.following_id = f2.follower_id
WHERE f1.follower_id < f1.following_id;

-- Following only (one-way, excludes mutual)
CREATE OR REPLACE VIEW public.following_only_view AS
SELECT
  f.follower_id AS user_id,
  f.following_id,
  f.created_at
FROM public.follows f
WHERE NOT EXISTS (
  SELECT 1 FROM public.follows f2
  WHERE f2.follower_id = f.following_id
  AND f2.following_id = f.follower_id
);

-- Followers only (one-way, excludes mutual)
CREATE OR REPLACE VIEW public.followers_only_view AS
SELECT
  f.following_id AS user_id,
  f.follower_id,
  f.created_at
FROM public.follows f
WHERE NOT EXISTS (
  SELECT 1 FROM public.follows f2
  WHERE f2.follower_id = f.following_id
  AND f2.following_id = f.follower_id
);


-- ============================================
-- 4. FUNCTIONS  (CREATE OR REPLACE = safe)
-- ============================================

-- are_friends
CREATE OR REPLACE FUNCTION public.are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = user1_id AND f1.following_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_relationship_status
CREATE OR REPLACE FUNCTION public.get_relationship_status(
  current_user_id UUID,
  target_user_id UUID
)
RETURNS TABLE (
  is_friend BOOLEAN,
  is_following BOOLEAN,
  is_follower BOOLEAN,
  has_pending_request_sent BOOLEAN,
  has_pending_request_received BOOLEAN,
  is_blocked BOOLEAN,
  is_blocked_by BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.follows f1
      INNER JOIN public.follows f2
        ON f1.follower_id = f2.following_id
        AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = current_user_id AND f1.following_id = target_user_id
    ) AS is_friend,
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = current_user_id AND following_id = target_user_id
    ) AS is_following,
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = target_user_id AND following_id = current_user_id
    ) AS is_follower,
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = current_user_id
        AND recipient_id = target_user_id
        AND status = 'pending'
    ) AS has_pending_request_sent,
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = target_user_id
        AND recipient_id = current_user_id
        AND status = 'pending'
    ) AS has_pending_request_received,
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = current_user_id AND blocked_id = target_user_id
    ) AS is_blocked,
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = target_user_id AND blocked_id = current_user_id
    ) AS is_blocked_by;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- send_friend_request
CREATE OR REPLACE FUNCTION public.send_friend_request(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_already_friends BOOLEAN;
  v_is_blocked BOOLEAN;
BEGIN
  -- Check if blocked
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = p_sender_id AND blocked_id = p_recipient_id)
       OR (blocker_id = p_recipient_id AND blocked_id = p_sender_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'Cannot send friend request to this user';
  END IF;

  -- Check if already friends
  SELECT public.are_friends(p_sender_id, p_recipient_id) INTO v_already_friends;

  IF v_already_friends THEN
    RAISE EXCEPTION 'Already friends with this user';
  END IF;

  -- Auto-follow the recipient
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_sender_id, p_recipient_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  -- Create or update friend request
  INSERT INTO public.friend_requests (sender_id, recipient_id, message, status)
  VALUES (p_sender_id, p_recipient_id, p_message, 'pending')
  ON CONFLICT (sender_id, recipient_id)
  DO UPDATE SET
    status = 'pending',
    message = EXCLUDED.message,
    created_at = NOW(),
    responded_at = NULL
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- accept_friend_request
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
BEGIN
  SELECT sender_id INTO v_sender_id
  FROM public.friend_requests
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;

  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_recipient_id, v_sender_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- decline_friend_request
CREATE OR REPLACE FUNCTION public.decline_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.friend_requests
  SET status = 'declined', responded_at = NOW()
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_friend_request
CREATE OR REPLACE FUNCTION public.cancel_friend_request(
  p_request_id UUID,
  p_sender_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.friend_requests
  SET status = 'cancelled', responded_at = NOW()
  WHERE id = p_request_id
    AND sender_id = p_sender_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- remove_friend
CREATE OR REPLACE FUNCTION public.remove_friend(
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.follows
  WHERE (follower_id = p_user_id AND following_id = p_friend_id)
     OR (follower_id = p_friend_id AND following_id = p_user_id);

  DELETE FROM public.friend_requests
  WHERE (sender_id = p_user_id AND recipient_id = p_friend_id)
     OR (sender_id = p_friend_id AND recipient_id = p_user_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_friends
CREATE OR REPLACE FUNCTION public.get_friends(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  friends_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f1.follower_id = p_user_id THEN f1.following_id
      ELSE f1.follower_id
    END AS friend_id,
    GREATEST(f1.created_at, f2.created_at) AS friends_since
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.follower_id = f2.following_id
    AND f1.following_id = f2.follower_id
  WHERE f1.follower_id = p_user_id OR f1.following_id = p_user_id
  GROUP BY f1.follower_id, f1.following_id, f1.created_at, f2.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_friend_count
CREATE OR REPLACE FUNCTION public.get_friend_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_followers_only_count
CREATE OR REPLACE FUNCTION public.get_followers_only_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f
    WHERE f.following_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = p_user_id
      AND f2.following_id = f.follower_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_following_only_count
CREATE OR REPLACE FUNCTION public.get_following_only_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f
    WHERE f.follower_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = f.following_id
      AND f2.following_id = p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_social_counts
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

-- get_user_friends_list
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
    CASE
      WHEN f1.follower_id = p_user_id THEN f1.following_id
      ELSE f1.follower_id
    END AS friend_id,
    GREATEST(f1.created_at, f2.created_at) AS friends_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id,
        CASE WHEN f1.follower_id = p_user_id THEN f1.following_id ELSE f1.follower_id END
      )
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id
          AND following_id = (CASE WHEN f1.follower_id = p_user_id THEN f1.following_id ELSE f1.follower_id END)
      )
    END AS is_viewer_following
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.follower_id = f2.following_id
    AND f1.following_id = f2.follower_id
  WHERE (f1.follower_id = p_user_id OR f1.following_id = p_user_id)
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = (CASE WHEN f1.follower_id = p_user_id THEN f1.following_id ELSE f1.follower_id END)
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  GROUP BY f1.follower_id, f1.following_id, f1.created_at, f2.created_at
  ORDER BY friends_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_followers_list
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

-- get_user_following_list
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


-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- friend_requests policies
DROP POLICY IF EXISTS "Anyone can view their own friend requests" ON public.friend_requests;
CREATE POLICY "Anyone can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own requests" ON public.friend_requests;
CREATE POLICY "Users can update their own requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can delete their own sent requests" ON public.friend_requests;
CREATE POLICY "Users can delete their own sent requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id);

-- blocked_users policies
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocked_users;
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);


-- ============================================
-- 6. REALTIME
-- ============================================

-- Safe: ADD TABLE is idempotent in recent Supabase versions
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
EXCEPTION WHEN duplicate_object THEN
  NULL;  -- already added
END $$;


-- ============================================
-- 7. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_requests TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;

GRANT EXECUTE ON FUNCTION public.are_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relationship_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_friend TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_followers_only_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_only_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_social_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_friends_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_followers_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_following_list TO authenticated;
