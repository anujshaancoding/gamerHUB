-- 015_user_consent.sql
-- DPDP consent audit trail: records that a user accepted the Terms of Service
-- and Privacy Policy at signup, which policy version, when, and via which path.
--
-- Additive + idempotent. Safe to apply while an older app build is still running
-- (all columns are nullable with no backfill). Pre-existing accounts keep NULLs;
-- the signup form's required checkbox is the operative consent for new accounts,
-- and these columns are the durable record. The app records consent defensively
-- (src/lib/legal/record-consent.ts) so account creation never breaks if this
-- migration has not been applied yet.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consent_terms_version   text,
  ADD COLUMN IF NOT EXISTS consent_privacy_version text,
  ADD COLUMN IF NOT EXISTS consent_at              timestamptz,
  ADD COLUMN IF NOT EXISTS consent_method          text;
