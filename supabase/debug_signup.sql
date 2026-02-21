-- =============================================
-- DIAGNOSTIC: Debug "Database error saving new user"
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================

-- 1. Does the profiles table exist?
SELECT 'profiles table exists' AS check,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AS result;

-- 2. What columns does profiles have?
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Does the handle_new_user function exist?
SELECT 'handle_new_user function exists' AS check,
  EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  ) AS result;

-- 4. Does the trigger exist on auth.users?
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- 5. Are there any existing profiles?
SELECT id, username FROM public.profiles LIMIT 5;

-- 6. Show the current function definition
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
