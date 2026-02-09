-- GamerHub Friends System Schema
-- Migration: 006_friends.sql
--
-- Friend system logic:
-- - When you send a friend request, you automatically follow the person
-- - If they accept (follow back), you become friends
-- - Friends = mutual follows (both follow each other)
-- - Following/Followers lists exclude mutual follows (those are friends)

-- ============================================
-- TABLES
-- ============================================

-- 1. Friend Requests (pending friend requests)
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, recipient_id),
  CHECK (sender_id != recipient_id)
);

-- 2. Blocked Users (for blocking functionality)
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_recipient ON friend_requests(recipient_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_pending ON friend_requests(recipient_id, status) WHERE status = 'pending';

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

-- ============================================
-- VIEWS
-- ============================================

-- View to get friends (mutual follows)
CREATE OR REPLACE VIEW public.friends_view AS
SELECT
  f1.follower_id AS user_id,
  f1.following_id AS friend_id,
  GREATEST(f1.created_at, f2.created_at) AS friends_since
FROM public.follows f1
INNER JOIN public.follows f2
  ON f1.follower_id = f2.following_id
  AND f1.following_id = f2.follower_id
WHERE f1.follower_id < f1.following_id; -- Avoid duplicates

-- View to get following (one-way, excludes friends)
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

-- View to get followers (one-way, excludes friends)
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
-- FUNCTIONS
-- ============================================

-- Function to check if two users are friends (mutual follow)
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

-- Function to get relationship status between two users
CREATE OR REPLACE FUNCTION public.get_relationship_status(current_user_id UUID, target_user_id UUID)
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
    -- Is friend (mutual follow)
    EXISTS (
      SELECT 1 FROM public.follows f1
      INNER JOIN public.follows f2
        ON f1.follower_id = f2.following_id
        AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = current_user_id AND f1.following_id = target_user_id
    ) AS is_friend,
    -- Is following
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = current_user_id AND following_id = target_user_id
    ) AS is_following,
    -- Is follower
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = target_user_id AND following_id = current_user_id
    ) AS is_follower,
    -- Has pending request sent
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = current_user_id AND recipient_id = target_user_id AND status = 'pending'
    ) AS has_pending_request_sent,
    -- Has pending request received
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = target_user_id AND recipient_id = current_user_id AND status = 'pending'
    ) AS has_pending_request_received,
    -- Is blocked
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = current_user_id AND blocked_id = target_user_id
    ) AS is_blocked,
    -- Is blocked by
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = target_user_id AND blocked_id = current_user_id
    ) AS is_blocked_by;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send friend request (also auto-follows)
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

-- Function to accept friend request (creates mutual follow)
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
BEGIN
  -- Get sender and verify recipient
  SELECT sender_id INTO v_sender_id
  FROM public.friend_requests
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  -- Update request status
  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;

  -- Create follow back (making them friends)
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_recipient_id, v_sender_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline friend request
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

-- Function to cancel friend request
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

-- Function to remove friend (removes mutual follow)
CREATE OR REPLACE FUNCTION public.remove_friend(
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove both follow relationships
  DELETE FROM public.follows
  WHERE (follower_id = p_user_id AND following_id = p_friend_id)
     OR (follower_id = p_friend_id AND following_id = p_user_id);

  -- Clean up any friend requests between them
  DELETE FROM public.friend_requests
  WHERE (sender_id = p_user_id AND recipient_id = p_friend_id)
     OR (sender_id = p_friend_id AND recipient_id = p_user_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friends list with profiles
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

-- Function to get friend count
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

-- Function to get followers count (excluding friends)
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

-- Function to get following count (excluding friends)
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

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
CREATE POLICY "Anyone can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own sent requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id);

-- Blocked Users Policies
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

-- ============================================
-- GRANTS
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
