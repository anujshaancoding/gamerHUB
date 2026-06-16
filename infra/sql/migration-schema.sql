-- ============================================================================
-- GamerHub: Supabase → Self-Hosted PostgreSQL Migration Schema
-- ============================================================================
-- This creates the additional tables needed for self-hosted auth.
-- Run AFTER importing the Supabase pg_dump (which brings all existing tables).
-- ============================================================================

-- Users table — replaces Supabase auth.users
-- Existing Supabase user UUIDs will be inserted here during data migration.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                    -- NULL for OAuth-only users
  email_confirmed_at TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT 'email', -- 'email', 'google'
  provider_id TEXT,                       -- Google sub ID, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users (provider, provider_id);

-- Add FK from profiles.id → users.id (profiles already exist from Supabase dump)
-- Only run this if the constraint doesn't exist yet:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_users_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_id_users_fkey
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Data migration: Copy existing Supabase auth.users into the users table
-- ============================================================================
-- This is done as part of the pg_dump import process.
-- After importing the Supabase dump, run:
--
--   INSERT INTO users (id, email, password_hash, email_confirmed_at, provider, created_at)
--   SELECT
--     id,
--     email,
--     encrypted_password,  -- Supabase uses bcrypt, compatible with bcryptjs
--     email_confirmed_at,
--     COALESCE(
--       (raw_app_meta_data->>'provider'),
--       'email'
--     ),
--     created_at
--   FROM auth.users
--   ON CONFLICT (id) DO NOTHING;
--
-- Then drop the auth schema if desired:
--   DROP SCHEMA IF EXISTS auth CASCADE;
-- ============================================================================
