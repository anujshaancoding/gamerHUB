-- ==========================================================================
-- 049_fix_friend_request_logic.sql
--
-- FIX: Friend request contradictions
--
-- Problem: When User A sends a request to User B, and User B sends one
-- back (instead of accepting), TWO pending rows exist:
--   (A → B, 'pending')  AND  (B → A, 'pending')
-- Both users get mutual follows (so they appear as "friends"), but the
-- friend_request rows never get cleaned up — causing the same person to
-- show in both the Friends tab AND the Sent Requests tab.
--
-- Fixes:
--   1. send_friend_request  — if a reverse pending request already exists,
--      auto-accept it instead of creating a duplicate.
--   2. accept_friend_request — also mark any reverse pending request as
--      accepted so there are no orphaned 'pending' rows.
-- ==========================================================================

-- ── 1. Fix send_friend_request ─────────────────────────────────────────────
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
  v_reverse_request_id UUID;
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

  -- *** NEW: Check if there is a pending request FROM the recipient TO us ***
  SELECT id INTO v_reverse_request_id
  FROM public.friend_requests
  WHERE sender_id = p_recipient_id
    AND recipient_id = p_sender_id
    AND status = 'pending';

  IF v_reverse_request_id IS NOT NULL THEN
    -- The other person already wants to be our friend — auto-accept their
    -- request instead of creating a conflicting second pending row.
    PERFORM public.accept_friend_request(v_reverse_request_id, p_sender_id);
    RETURN v_reverse_request_id;
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


-- ── 2. Fix accept_friend_request ───────────────────────────────────────────
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

  -- Mark this request as accepted
  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;

  -- *** NEW: Also mark any reverse pending request as accepted ***
  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE sender_id = p_recipient_id
    AND recipient_id = v_sender_id
    AND status = 'pending';

  -- Create follow back (making them friends)
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_recipient_id, v_sender_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. Clean up existing bad data ──────────────────────────────────────────
-- Mark any 'pending' friend_requests as 'accepted' where the two users
-- are already mutual follows (i.e. already friends).
UPDATE public.friend_requests fr
SET status = 'accepted', responded_at = NOW()
WHERE fr.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.follows f1
    JOIN public.follows f2
      ON f1.follower_id = f2.following_id
     AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = fr.sender_id
      AND f1.following_id = fr.recipient_id
  );
