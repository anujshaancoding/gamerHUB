-- Fix FK references: change auth.users(id) -> profiles(id) so PostgREST can join profiles

-- 1. clan_wall_posts.user_id
ALTER TABLE clan_wall_posts DROP CONSTRAINT IF EXISTS clan_wall_posts_user_id_fkey;
ALTER TABLE clan_wall_posts ADD CONSTRAINT clan_wall_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. clan_mission_contributions.user_id
ALTER TABLE clan_mission_contributions DROP CONSTRAINT IF EXISTS clan_mission_contributions_user_id_fkey;
ALTER TABLE clan_mission_contributions ADD CONSTRAINT clan_mission_contributions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. clan_scrims.created_by
ALTER TABLE clan_scrims DROP CONSTRAINT IF EXISTS clan_scrims_created_by_fkey;
ALTER TABLE clan_scrims ADD CONSTRAINT clan_scrims_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. clan_scrim_participants.user_id
ALTER TABLE clan_scrim_participants DROP CONSTRAINT IF EXISTS clan_scrim_participants_user_id_fkey;
ALTER TABLE clan_scrim_participants ADD CONSTRAINT clan_scrim_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
