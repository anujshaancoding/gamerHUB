-- 016: Seed first public Valorant Passport gallery cards
--
-- Purpose:
--   Gives /passport/gallery enough visible proof for launch while real users
--   start saving Passports. All accounts are locked local personas and can be
--   replaced by real featured users over time.
--
-- Run on VPS:
--   sudo -u postgres psql -d gamerhub -f /var/www/gglobby/infra/migrations/016_seed_passport_gallery.sql
-- ============================================================================

DO $$
DECLARE
  pw_hash TEXT := '$2a$12$INVALID.passport.gallery.seed.locked.accounts';
  valorant_game_id UUID;

  seed RECORD;
  existing_game_id UUID;
BEGIN
  SELECT id INTO valorant_game_id FROM games WHERE slug = 'valorant' LIMIT 1;

  IF valorant_game_id IS NULL THEN
    RAISE EXCEPTION 'games table has no row with slug=valorant. Seed games before passport gallery.';
  END IF;

  FOR seed IN
    SELECT *
    FROM (
      VALUES
        (
          '79000000-0000-4000-8000-000000000001'::uuid,
          'passport.priya.clutches@gglobby.local',
          'passport_priya',
          'Priya',
          'Bengaluru sentinel main | clean comms | looking for serious 5-stack energy',
          'competitive',
          'karnataka',
          'en',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_priya&backgroundColor=ffd5dc',
          'Priya#GG',
          'Immortal 1',
          'Immortal 3',
          'killjoy',
          'Killjoy',
          'Sentinel',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000002'::uuid,
          'passport.aarav.aim@gglobby.local',
          'passport_aarav',
          'Aarav',
          'Pune duelist | entry first, apology later',
          'competitive',
          'maharashtra',
          'hi',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_aarav&backgroundColor=b6e3f4',
          'AaravAim#PUN',
          'Ascendant 2',
          'Immortal 1',
          'jett',
          'Jett',
          'Duelist',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000003'::uuid,
          'passport.vignesh.smokes@gglobby.local',
          'passport_vignesh',
          'Vignesh',
          'Chennai controller | lineups, late lurks and no ego comms',
          'competitive',
          'tamil-nadu',
          'ta',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_vignesh&backgroundColor=d1d4f9',
          'Vignesh#TN',
          'Diamond 3',
          'Ascendant 2',
          'omen',
          'Omen',
          'Controller',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000004'::uuid,
          'passport.neha.flash@gglobby.local',
          'passport_neha',
          'Neha',
          'Hyderabad initiator | flash timing > scoreboard',
          'competitive',
          'telangana',
          'te',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_neha&backgroundColor=ffb6c1',
          'NehaFlash#HYD',
          'Diamond 1',
          'Ascendant 1',
          'skye',
          'Skye',
          'Initiator',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000005'::uuid,
          'passport.rohan.vandal@gglobby.local',
          'passport_rohan',
          'Rohan',
          'Delhi ranked grinder | Vandal one-taps on good Wi-Fi days',
          'competitive',
          'delhi',
          'hi',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_rohan&backgroundColor=c0aede',
          'RohanVandal#DL',
          'Platinum 3',
          'Diamond 2',
          'reyna',
          'Reyna',
          'Duelist',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000006'::uuid,
          'passport.sourav.dart@gglobby.local',
          'passport_sourav',
          'Sourav',
          'Kolkata Sova main | recon first, ego later',
          'competitive',
          'west-bengal',
          'bn',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_sourav&backgroundColor=c0f0f0',
          'SouravDart#WB',
          'Platinum 2',
          'Diamond 1',
          'sova',
          'Sova',
          'Initiator',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000007'::uuid,
          'passport.karthik.clutch@gglobby.local',
          'passport_karthik',
          'Karthik',
          'Coimbatore flex | fills role, still asks for drops',
          'casual',
          'tamil-nadu',
          'ta',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_karthik&backgroundColor=ffdfbf',
          'Karthik#CBE',
          'Gold 3',
          'Platinum 2',
          'phoenix',
          'Phoenix',
          'Duelist',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000008'::uuid,
          'passport.gurpreet.wall@gglobby.local',
          'passport_gurpreet',
          'Gurpreet',
          'Punjab Sage main | heals teammates, not bad decisions',
          'casual',
          'punjab',
          'pa',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_gurpreet&backgroundColor=a0c4ff',
          'Gurpreet#PB',
          'Gold 2',
          'Platinum 1',
          'sage',
          'Sage',
          'Sentinel',
          true
        ),
        (
          '79000000-0000-4000-8000-000000000009'::uuid,
          'passport.meera.viper@gglobby.local',
          'passport_meera',
          'Meera',
          'Ahmedabad Viper | post-plant lineups and calm rounds',
          'competitive',
          'gujarat',
          'gu',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_meera&backgroundColor=ffc8dd',
          'MeeraViper#GJ',
          'Diamond 2',
          'Ascendant 1',
          'viper',
          'Viper',
          'Controller',
          false
        ),
        (
          '79000000-0000-4000-8000-000000000010'::uuid,
          'passport.aniket.neon@gglobby.local',
          'passport_aniket',
          'Aniket',
          'Nagpur Neon | fast entry, faster rotate calls',
          'competitive',
          'maharashtra',
          'mr',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_aniket&backgroundColor=9bf6ff',
          'AniketFast#NGP',
          'Platinum 1',
          'Diamond 1',
          'neon',
          'Neon',
          'Duelist',
          false
        ),
        (
          '79000000-0000-4000-8000-000000000011'::uuid,
          'passport.arjun.anchor@gglobby.local',
          'passport_arjun',
          'Arjun',
          'Jaipur anchor | Cypher setups and patient retakes',
          'competitive',
          'rajasthan',
          'hi',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_arjun&backgroundColor=e9c46a',
          'ArjunTrap#RJ',
          'Gold 1',
          'Platinum 1',
          'cypher',
          'Cypher',
          'Sentinel',
          false
        ),
        (
          '79000000-0000-4000-8000-000000000012'::uuid,
          'passport.rizwan.clove@gglobby.local',
          'passport_rizwan',
          'Rizwan',
          'Kerala Clove player | aggressive smokes and late-night ranked',
          'casual',
          'kerala',
          'ml',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=passport_rizwan&backgroundColor=bdb2ff',
          'Rizwan#KL',
          'Silver 3',
          'Gold 3',
          'clove',
          'Clove',
          'Controller',
          false
        )
    ) AS s(
      id,
      email,
      username,
      display_name,
      bio,
      gaming_style,
      region,
      preferred_language,
      avatar_url,
      game_username,
      rank,
      peak_rank,
      agent_slug,
      agent_name,
      role,
      feature_submitted
    )
  LOOP
    INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
    VALUES (seed.id, seed.email, pw_hash, NOW(), 'email')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      email_confirmed_at = COALESCE(users.email_confirmed_at, NOW()),
      provider = 'email',
      updated_at = NOW();

    INSERT INTO profiles (
      id,
      username,
      display_name,
      bio,
      gaming_style,
      region,
      preferred_language,
      avatar_url,
      is_verified
    )
    VALUES (
      seed.id,
      seed.username,
      seed.display_name,
      seed.bio,
      seed.gaming_style,
      seed.region,
      seed.preferred_language,
      seed.avatar_url,
      false
    )
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      bio = EXCLUDED.bio,
      gaming_style = EXCLUDED.gaming_style,
      region = EXCLUDED.region,
      preferred_language = EXCLUDED.preferred_language,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();

    SELECT id INTO existing_game_id
    FROM user_games
    WHERE user_id = seed.id AND game_id = valorant_game_id
    LIMIT 1;

    IF existing_game_id IS NULL THEN
      INSERT INTO user_games (
        user_id,
        game_id,
        game_username,
        rank,
        role,
        stats,
        is_verified,
        is_public,
        created_at,
        updated_at
      )
      VALUES (
        seed.id,
        valorant_game_id,
        seed.game_username,
        seed.rank,
        seed.role,
        jsonb_build_object(
          'passport',
          jsonb_build_object(
            'peak_rank', seed.peak_rank,
            'main_agent_slug', seed.agent_slug,
            'main_agent_name', seed.agent_name,
            'role', seed.role,
            'region', seed.region,
            'language', seed.preferred_language,
            'playstyle', seed.gaming_style,
            'feature_submitted', seed.feature_submitted,
            'saved_at', NOW()
          )
        ),
        false,
        true,
        NOW(),
        NOW()
      );
    ELSE
      UPDATE user_games
      SET
        game_username = seed.game_username,
        rank = seed.rank,
        role = seed.role,
        stats = jsonb_build_object(
          'passport',
          jsonb_build_object(
            'peak_rank', seed.peak_rank,
            'main_agent_slug', seed.agent_slug,
            'main_agent_name', seed.agent_name,
            'role', seed.role,
            'region', seed.region,
            'language', seed.preferred_language,
            'playstyle', seed.gaming_style,
            'feature_submitted', seed.feature_submitted,
            'saved_at', NOW()
          )
        ),
        is_verified = false,
        is_public = true,
        updated_at = NOW()
      WHERE id = existing_game_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Seeded 12 public Valorant Passport gallery cards.';
END $$;

-- Verification
SELECT
  COUNT(*)::int AS public_passport_cards,
  COUNT(*) FILTER (WHERE ug.stats->'passport'->>'feature_submitted' = 'true')::int AS submitted_for_feature
FROM user_games ug
JOIN games g ON g.id = ug.game_id
WHERE g.slug = 'valorant'
  AND ug.is_public = true
  AND ug.stats ? 'passport';
