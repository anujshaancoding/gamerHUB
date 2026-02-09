-- Voice/Video Calls Schema
-- Track call sessions and participants for LiveKit integration

-- Calls table - tracks call sessions
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  initiator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('voice', 'video')),
  status VARCHAR(20) DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined', 'failed')),
  room_name VARCHAR(100) UNIQUE NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for calls
CREATE INDEX idx_calls_conversation ON calls(conversation_id);
CREATE INDEX idx_calls_initiator ON calls(initiator_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_room ON calls(room_name);
CREATE INDEX idx_calls_created ON calls(created_at DESC);

-- Call participants table - tracks individual participant states
CREATE TABLE public.call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'ringing', 'joined', 'left', 'declined')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_video_enabled BOOLEAN DEFAULT true,
  is_screen_sharing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(call_id, user_id)
);

-- Indexes for call participants
CREATE INDEX idx_call_participants_call ON call_participants(call_id);
CREATE INDEX idx_call_participants_user ON call_participants(user_id);
CREATE INDEX idx_call_participants_status ON call_participants(status);

-- Enable RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view calls in their conversations"
  ON calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = calls.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can initiate calls in their conversations"
  ON calls FOR INSERT
  WITH CHECK (
    auth.uid() = initiator_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = calls.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update call status"
  ON calls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = calls.conversation_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for call_participants
CREATE POLICY "Users can view call participants"
  ON call_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls c
      JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
      WHERE c.id = call_participants.call_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Call initiator can add participants"
  ON call_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT initiator_id FROM calls WHERE id = call_participants.call_id
    )
  );

CREATE POLICY "Users can update their own participation"
  ON call_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Trigger for updated_at on calls
CREATE OR REPLACE FUNCTION update_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_calls_updated_at();

-- Enable realtime for calls and call_participants
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_participants;
