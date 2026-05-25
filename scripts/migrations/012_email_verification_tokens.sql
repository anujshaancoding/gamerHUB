-- ============================================================================
-- Email verification tokens
-- ============================================================================
-- Stores HASHED single-use verification tokens. The plaintext token is sent
-- in the URL we email to the user; we never store it. Hash = sha256 over
-- the random token, hex-encoded.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  email        text NOT NULL,          -- email at the time of token issue
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  used_at      timestamptz,
  CONSTRAINT email_verif_not_expired_check CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_email_verif_user      ON public.email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_expires   ON public.email_verification_tokens (expires_at);

-- Existing users that registered before this migration: assume they are
-- already verified (so we don't lock them out). New registrations write
-- email_confirmed_at = NULL and a row into this table.
-- Backfill is a no-op since registrations were previously auto-confirming.

COMMIT;
