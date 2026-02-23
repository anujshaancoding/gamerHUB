-- ==========================================================================
-- Migration 049: Restore the complete messaging system
-- ==========================================================================
--
-- ROOT CAUSE:  999_cleanup_and_focus.sql dropped conversations,
--              conversation_participants, and messages with CASCADE.
--              These tables were NEVER recreated.
--
-- This migration restores everything the messaging system needs:
--   1. conversations table
--   2. conversation_participants table
--   3. messages table
--   4. RLS policies
--   5. Helper functions (is_conversation_member, create_direct_conversation)
--   6. Indexes, triggers, grants, realtime
-- ==========================================================================


-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'match')),
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
  ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);


-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Check if a user is a member of a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or find a direct conversation between two users
CREATE OR REPLACE FUNCTION public.create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  existing_conv_id UUID;
  new_conv_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Check if direct conversation already exists between these users
  SELECT c.id INTO existing_conv_id
  FROM conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = current_user_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp3
    WHERE cp3.conversation_id = c.id
  ) = 2
  LIMIT 1;

  IF existing_conv_id IS NOT NULL THEN
    RETURN existing_conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (type)
  VALUES ('direct')
  RETURNING id INTO new_conv_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (new_conv_id, current_user_id),
    (new_conv_id, other_user_id);

  RETURN new_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can view if they are a participant
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    public.is_conversation_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations"
  ON public.conversations FOR UPDATE
  USING (public.is_conversation_member(id, auth.uid()));

-- Conversation participants: users can view if they are a member
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    public.is_conversation_member(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their participation" ON public.conversation_participants;
CREATE POLICY "Users can update their participation"
  ON public.conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: users can view if they are in the conversation
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- Messages: users can send if they are in the conversation
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- Messages: users can delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Messages: users can update their own messages
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);


-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Auto-update updated_at on conversations
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- 6. REALTIME
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================
-- 7. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_conversation_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_direct_conversation TO authenticated;
