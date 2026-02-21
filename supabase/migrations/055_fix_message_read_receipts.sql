-- ==========================================================================
-- Migration 055: Fix message read receipts & enable realtime for participants
-- ==========================================================================
--
-- FIXES:
--   1. conversation_participants was never added to the realtime publication,
--      so last_read_at updates were invisible to other clients.
--   2. Adds conversation_participants to realtime so read-status changes
--      trigger refetches in the conversation list.
-- ==========================================================================

-- Add conversation_participants to realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
