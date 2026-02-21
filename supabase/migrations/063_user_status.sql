-- Add user-selected presence status to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'auto'
    CHECK (status IN ('auto', 'online', 'away', 'dnd', 'offline')),
  ADD COLUMN IF NOT EXISTS status_until TIMESTAMPTZ DEFAULT NULL;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

COMMENT ON COLUMN public.profiles.status IS
  'User-selected presence status: auto (system-managed), online, away, dnd, offline (appear offline)';
COMMENT ON COLUMN public.profiles.status_until IS
  'If set, the status reverts to auto when this timestamp is reached';
