-- Migration: 061_profile_verification.sql
-- Adds is_verified flag to profiles for public figure / blue-check verification

-- Add verified column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Index for quick lookups (e.g. guest friend-posts query)
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified
  ON public.profiles(is_verified)
  WHERE is_verified = true;
