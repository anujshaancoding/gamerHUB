-- ==========================================================================
-- 047_friend_request_notifications.sql
--
-- Automatically create in-app notifications when friend request events occur:
--   1. New/re-sent friend request  -> notify the recipient
--   2. Friend request accepted     -> notify the original sender
--
-- Uses the existing create_notification() function which respects user
-- preferences and quiet hours.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.notify_friend_request_events()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name  TEXT;
  v_sender_user  TEXT;
  v_recipient_name TEXT;
  v_recipient_user TEXT;
BEGIN
  -- ── New or re-sent friend request (status = 'pending') ──
  IF (
    (TG_OP = 'INSERT' AND NEW.status = 'pending')
    OR
    (TG_OP = 'UPDATE' AND NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending')
  ) THEN
    -- Look up sender display info
    SELECT COALESCE(display_name, username), username
      INTO v_sender_name, v_sender_user
      FROM public.profiles
     WHERE id = NEW.sender_id;

    PERFORM create_notification(
      NEW.recipient_id,                                       -- p_user_id
      'friend_request'::notification_type,                    -- p_type
      'New Squad Request!',                                   -- p_title
      v_sender_name || ' wants to team up with you! Accept and start gaming together.',  -- p_body
      '🎮',                                                  -- p_icon
      '/friends?tab=requests',                                -- p_action_url
      'View Request',                                         -- p_action_label
      jsonb_build_object(                                     -- p_metadata
        'sender_id',       NEW.sender_id,
        'request_id',      NEW.id,
        'sender_username', v_sender_user
      )
    );
  END IF;

  -- ── Friend request accepted ──
  IF (
    TG_OP = 'UPDATE'
    AND NEW.status = 'accepted'
    AND OLD.status IS DISTINCT FROM 'accepted'
  ) THEN
    -- Look up acceptor (recipient) display info
    SELECT COALESCE(display_name, username), username
      INTO v_recipient_name, v_recipient_user
      FROM public.profiles
     WHERE id = NEW.recipient_id;

    PERFORM create_notification(
      NEW.sender_id,                                          -- p_user_id
      'friend_request'::notification_type,                    -- p_type
      'Squad Up!',                                            -- p_title
      v_recipient_name || ' accepted your friend request! You''re now teammates.',  -- p_body
      '⚔️',                                                  -- p_icon
      '/profile/' || v_recipient_user,                        -- p_action_url
      'View Profile',                                         -- p_action_label
      jsonb_build_object(                                     -- p_metadata
        'friend_id',          NEW.recipient_id,
        'request_id',         NEW.id,
        'acceptor_username',  v_recipient_user
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger (drop first to make migration re-runnable)
DROP TRIGGER IF EXISTS trg_friend_request_notifications ON public.friend_requests;

CREATE TRIGGER trg_friend_request_notifications
  AFTER INSERT OR UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request_events();
