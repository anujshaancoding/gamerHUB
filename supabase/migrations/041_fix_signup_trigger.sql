-- Fix: "Database error saving new user" on signup
-- This ensures the profiles table and signup trigger work correctly

-- 1. Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  gaming_style VARCHAR(20) CHECK (gaming_style IN ('casual', 'competitive', 'pro')),
  preferred_language VARCHAR(10) DEFAULT 'en',
  region VARCHAR(50),
  timezone VARCHAR(50),
  online_hours JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns that later migrations expect (safe with IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
    ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_until') THEN
    ALTER TABLE public.profiles ADD COLUMN premium_until TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_matches_played') THEN
    ALTER TABLE public.profiles ADD COLUMN total_matches_played INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_views') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_views INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reputation_score') THEN
    ALTER TABLE public.profiles ADD COLUMN reputation_score DECIMAL(3,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trust_score') THEN
    ALTER TABLE public.profiles ADD COLUMN trust_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Ensure RLS policies exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Recreate the signup trigger function with full error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username VARCHAR(30);
BEGIN
  -- Build username, fallback to user_ prefix if not provided
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- If username already taken, append random suffix
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := substr(v_username, 1, 22) || '_' || substr(md5(random()::text), 1, 6);
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error to Postgres logs so we can see it in Supabase Dashboard > Logs > Postgres
    RAISE LOG 'handle_new_user() failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    -- Still return NEW so the auth.users row is created (user can set up profile later)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
