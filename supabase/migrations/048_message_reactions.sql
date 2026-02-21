-- ==========================================================================
-- Migration 048: Message reactions + message delete policy
-- ==========================================================================

-- Message Reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id
  ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user
  ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);

-- RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view message reactions" ON public.message_reactions;
CREATE POLICY "Users can view message reactions"
  ON public.message_reactions FOR SELECT
  USING (
    public.is_conversation_member(
      (SELECT conversation_id FROM public.messages WHERE id = message_id),
      auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_conversation_member(
      (SELECT conversation_id FROM public.messages WHERE id = message_id),
      auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove own reactions" ON public.message_reactions;
CREATE POLICY "Users can remove own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Grants
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
