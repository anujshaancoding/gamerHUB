-- Fix: Drop ALL stale AFTER INSERT triggers on profiles that can break signup.
--
-- When handle_new_user() inserts into profiles, any AFTER INSERT trigger that
-- fails (e.g., references a missing table) causes the profile INSERT to be
-- rolled back inside the EXCEPTION savepoint. The auth.users row is still
-- created, but the profile row is not — leaving the user stuck.
--
-- These triggers are non-essential for signup and can be recreated later if
-- the underlying tables are restored.

-- 1. Gamification trigger (references dropped user_progression table)
DROP TRIGGER IF EXISTS on_profile_created_gamification ON public.profiles;
DROP FUNCTION IF EXISTS handle_new_profile_gamification();

-- 2. Account verification trigger (references account_verifications table)
DROP TRIGGER IF EXISTS on_profile_created_create_verification ON public.profiles;
DROP FUNCTION IF EXISTS create_account_verification();

-- 3. Accessibility settings trigger (references accessibility_settings table)
DROP TRIGGER IF EXISTS on_profile_created_accessibility ON public.profiles;
DROP FUNCTION IF EXISTS create_accessibility_settings();

-- 4. Notification preferences trigger (references notification_preferences table)
DROP TRIGGER IF EXISTS on_profile_created_notification_prefs ON public.profiles;
DROP FUNCTION IF EXISTS create_default_notification_preferences();

-- Verify: List remaining triggers on profiles (should only be update_profiles_updated_at)
DO $$
DECLARE
  t RECORD;
BEGIN
  RAISE LOG '--- Remaining triggers on public.profiles ---';
  FOR t IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'public.profiles'::regclass
      AND NOT tgisinternal
  LOOP
    RAISE LOG 'Trigger: %', t.tgname;
  END LOOP;
END $$;
