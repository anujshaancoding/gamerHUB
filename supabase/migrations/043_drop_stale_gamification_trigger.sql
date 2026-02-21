-- Fix: Drop stale gamification trigger that references dropped user_progression table
-- The 999_cleanup_and_focus migration dropped user_progression but left the
-- on_profile_created_gamification trigger on profiles, causing 42P01 errors
-- ("relation user_progression does not exist") whenever a new profile is inserted.

DROP TRIGGER IF EXISTS on_profile_created_gamification ON public.profiles;
DROP FUNCTION IF EXISTS handle_new_profile_gamification();
