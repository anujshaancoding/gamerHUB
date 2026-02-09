-- =============================================
-- SEED: Indian Gamer Profiles (25 Complete Profiles)
-- =============================================
-- Creates demo_profiles table for sample Indian gamer profiles
-- These are for display/demo purposes and don't require auth users
-- =============================================

-- Create demo_profiles table (no FK to auth.users)
CREATE TABLE IF NOT EXISTS demo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  gaming_style VARCHAR(20) CHECK (gaming_style IN ('casual', 'competitive', 'pro')),
  preferred_language VARCHAR(10) DEFAULT 'en',
  region VARCHAR(100),
  timezone VARCHAR(50),
  online_hours JSONB,
  social_links JSONB,
  is_online BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demo_user_games table
CREATE TABLE IF NOT EXISTS demo_user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  game_name VARCHAR(100) NOT NULL,
  game_slug VARCHAR(50),
  in_game_name VARCHAR(100),
  rank VARCHAR(50),
  role VARCHAR(50),
  secondary_role VARCHAR(50),
  hours_played INTEGER DEFAULT 0,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demo_user_badges table
CREATE TABLE IF NOT EXISTS demo_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  badge_name VARCHAR(100) NOT NULL,
  badge_slug VARCHAR(50),
  badge_icon VARCHAR(10),
  badge_description TEXT,
  badge_rarity VARCHAR(20) CHECK (badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_demo_profiles_username ON demo_profiles(username);
CREATE INDEX IF NOT EXISTS idx_demo_profiles_region ON demo_profiles(region);
CREATE INDEX IF NOT EXISTS idx_demo_profiles_gaming_style ON demo_profiles(gaming_style);
CREATE INDEX IF NOT EXISTS idx_demo_profiles_is_online ON demo_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_demo_user_games_user_id ON demo_user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_user_games_game_slug ON demo_user_games(game_slug);
CREATE INDEX IF NOT EXISTS idx_demo_user_badges_user_id ON demo_user_badges(user_id);

-- Enable RLS
ALTER TABLE demo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_user_badges ENABLE ROW LEVEL SECURITY;

-- Allow public read access to demo profiles
CREATE POLICY "Demo profiles are viewable by everyone" ON demo_profiles
  FOR SELECT USING (true);

CREATE POLICY "Demo user games are viewable by everyone" ON demo_user_games
  FOR SELECT USING (true);

CREATE POLICY "Demo user badges are viewable by everyone" ON demo_user_badges
  FOR SELECT USING (true);

-- =============================================
-- INSERT DEMO PROFILES
-- =============================================

-- Clear existing demo data
TRUNCATE demo_profiles CASCADE;

-- Profile 1: SkRoshanOP - Pro Valorant Player from Mumbai
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'SkRoshanOP',
  'Roshan Sharma',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Roshan&backgroundColor=b6e3f4',
  '/images/banners/gaming-1.svg',
  '🎮 Valorant Pro | Ex-Velocity Gaming | 2x VCT Qualifier | DMs open for scrims 🇮🇳',
  'pro',
  'hi',
  'Mumbai, Maharashtra',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "02:00"}, "weekend": {"start": "14:00", "end": "04:00"}}',
  '{"discord": "SkRoshanOP#1337", "twitch": "skroshanop", "youtube": "@SkRoshanGaming", "twitter": "@SkRoshanOP", "instagram": "@roshan.gaming"}',
  true,
  true,
  NOW() - INTERVAL '8 months'
);

-- Profile 2: AadityaAWP - CS2 AWPer from Delhi
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'AadityaAWP',
  'Aaditya Verma',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aaditya&backgroundColor=c0aede',
  '/images/banners/gaming-2.svg',
  '🔫 AWP is life | CS2 Grinder | Premier 25K+ | Looking for serious team 🎯',
  'competitive',
  'en',
  'Delhi, NCR',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "01:00"}, "weekend": {"start": "16:00", "end": "03:00"}}',
  '{"discord": "AadityaAWP#2048", "steam": "aadityaawp", "youtube": "@AadityaCS2"}',
  false,
  true,
  NOW() - INTERVAL '10 months'
);

-- Profile 3: PriyaSmokeQueen - Valorant Controller from Bangalore
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'PriyaSmokeQueen',
  'Priya Nair',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffd5dc',
  '/images/banners/gaming-3.svg',
  '💨 Smoke diff every game | Omen/Astra main | Girls in Gaming advocate | Stream Mon-Fri',
  'competitive',
  'en',
  'Bangalore, Karnataka',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "23:00"}, "weekend": {"start": "15:00", "end": "01:00"}}',
  '{"discord": "PriyaSmokeQueen#7777", "twitch": "priyasmokequeen", "twitter": "@PriyaGamingBLR", "instagram": "@priya.gaming"}',
  true,
  true,
  NOW() - INTERVAL '7 months'
);

-- Profile 4: VenkatIGL - CS2 IGL from Hyderabad
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'VenkatIGL',
  'Venkat Reddy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Venkat&backgroundColor=d1d4f9',
  '/images/banners/gaming-4.svg',
  '🧠 IGL & Strategist | Ex-Entity Gaming | Open to coaching | Building HydCS Academy',
  'pro',
  'te',
  'Hyderabad, Telangana',
  'Asia/Kolkata',
  '{"weekday": {"start": "17:00", "end": "00:00"}, "weekend": {"start": "12:00", "end": "02:00"}}',
  '{"discord": "VenkatIGL#1001", "steam": "venkatigl", "twitter": "@VenkatIGL", "youtube": "@VenkatCSAcademy"}',
  false,
  true,
  NOW() - INTERVAL '14 months'
);

-- Profile 5: KarthikWalls - Valorant Sentinel from Chennai
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'KarthikWalls',
  'Karthik Subramanian',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik&backgroundColor=ffdfbf',
  '/images/banners/gaming-5.svg',
  '🛡️ Killjoy diff | Site anchor specialist | Setup enjoyer | DMs open for tips',
  'competitive',
  'ta',
  'Chennai, Tamil Nadu',
  'Asia/Kolkata',
  '{"weekday": {"start": "21:00", "end": "01:00"}, "weekend": {"start": "18:00", "end": "03:00"}}',
  '{"discord": "KarthikWalls#4444", "instagram": "@karthik_gaming_tn"}',
  true,
  NOW() - INTERVAL '5 months'
);

-- Profile 6: SouravRUSH - CS2 Entry from Kolkata
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SouravRUSH',
  'Sourav Das',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sourav&backgroundColor=c0f0f0',
  '/images/banners/gaming-1.svg',
  '⚡ Entry frag or die trying | KOL CS Scene | Looking for team | Aim trainer addict',
  'competitive',
  'bn',
  'Kolkata, West Bengal',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "00:00"}, "weekend": {"start": "14:00", "end": "02:00"}}',
  '{"discord": "SouravRUSH#5555", "steam": "souravrush", "twitter": "@SouravRushCS"}',
  false,
  NOW() - INTERVAL '6 months'
);

-- Profile 7: NehaDuelist - Valorant Duelist from Pune
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'NehaDuelist',
  'Neha Patil',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha&backgroundColor=ffb6c1',
  '/images/banners/gaming-2.svg',
  '⚔️ Jett/Reyna 2-trick | VCT Game Changers aspirant | Content creator | Aim labs grinder',
  'competitive',
  'mr',
  'Pune, Maharashtra',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "23:00"}, "weekend": {"start": "13:00", "end": "01:00"}}',
  '{"discord": "NehaDuelist#8888", "twitch": "nehaduelist", "instagram": "@neha.valorant", "youtube": "@NehaDuelistValo"}',
  true,
  true,
  NOW() - INTERVAL '6 months'
);

-- Profile 8: HarshLurk - CS2 Lurker from Ahmedabad
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'HarshLurk',
  'Harsh Patel',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Harsh&backgroundColor=e0e0e0',
  '/images/banners/gaming-3.svg',
  '🐍 Silent but deadly | Lurk timings god | FaceIT Lvl 10 | Clutch or kick',
  'competitive',
  'gu',
  'Ahmedabad, Gujarat',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "02:00"}, "weekend": {"start": "16:00", "end": "04:00"}}',
  '{"discord": "HarshLurk#9999", "steam": "harshlurk"}',
  false,
  NOW() - INTERVAL '9 months'
);

-- Profile 9: ArjunSova - Valorant Initiator from Jaipur
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'ArjunSova',
  'Arjun Singh Rathore',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=ffecd2',
  '/images/banners/gaming-4.svg',
  '🦅 Sova lineups = free wins | Dart diff specialist | YT tutorials coming soon | Rajasthan represent 🏜️',
  'competitive',
  'hi',
  'Jaipur, Rajasthan',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "15:00", "end": "03:00"}}',
  '{"discord": "ArjunSova#1234", "youtube": "@ArjunSovaLineups", "instagram": "@arjun_valorant"}',
  true,
  NOW() - INTERVAL '4 months'
);

-- Profile 10: AmitSupport - CS2 Support from Lucknow
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'AmitSupport',
  'Amit Mishra',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit&backgroundColor=bde0fe',
  '/images/banners/gaming-5.svg',
  '💪 Support player who actually supports | Flash god | Utility diff | Team player always',
  'competitive',
  'hi',
  'Lucknow, Uttar Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "14:00", "end": "02:00"}}',
  '{"discord": "AmitSupport#6666", "steam": "amitsupport"}',
  false,
  NOW() - INTERVAL '5 months'
);

-- Profile 11: AnuRaze - Valorant Duelist from Kochi
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'AnuRaze',
  'Anu Menon',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Anu&backgroundColor=ffc8dd',
  '/images/banners/gaming-1.svg',
  '💥 Raze main | Satchel plays only | Kerala gaming community admin | Girls squad recruiter',
  'competitive',
  'ml',
  'Kochi, Kerala',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "00:00"}, "weekend": {"start": "17:00", "end": "02:00"}}',
  '{"discord": "AnuRaze#2323", "instagram": "@anu.raze.gaming", "twitch": "anuraze"}',
  true,
  NOW() - INTERVAL '3 months'
);

-- Profile 12: GurpreetAK - CS2 Rifler from Chandigarh
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'GurpreetAK',
  'Gurpreet Singh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Gurpreet&backgroundColor=a0c4ff',
  '/images/banners/gaming-2.svg',
  '🔫 AK spray transfer montages | Punjab CS community | Lan events host | DM for scrims',
  'competitive',
  'pa',
  'Chandigarh, Punjab',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "15:00", "end": "03:00"}}',
  '{"discord": "GurpreetAK#4747", "steam": "gurpreetsprayak", "youtube": "@GurpreetAKCS2"}',
  false,
  NOW() - INTERVAL '7 months'
);

-- Profile 13: RahulAstra - Valorant Controller from Indore
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'RahulAstra',
  'Rahul Joshi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=cdb4db',
  '/images/banners/gaming-3.svg',
  '🌌 Astra galaxy brain | 5000 IQ smokes | MP Gaming Discord admin | Coaching available',
  'competitive',
  'hi',
  'Indore, Madhya Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "13:00", "end": "01:00"}}',
  '{"discord": "RahulAstra#7890", "twitch": "rahulastramain", "twitter": "@RahulAstraValo"}',
  true,
  NOW() - INTERVAL '5 months'
);

-- Profile 14: BiswajitFlex - CS2 Flex from Guwahati
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'BiswajitFlex',
  'Biswajit Bora',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Biswajit&backgroundColor=98f5e1',
  '/images/banners/gaming-4.svg',
  '🎭 Can play any role | Northeast India represent | Assam esports advocate | Grind never stops',
  'competitive',
  'as',
  'Guwahati, Assam',
  'Asia/Kolkata',
  '{"weekday": {"start": "17:00", "end": "23:00"}, "weekend": {"start": "12:00", "end": "02:00"}}',
  '{"discord": "BiswajitFlex#3333", "steam": "biswajitflex", "instagram": "@biswajit_cs2"}',
  false,
  NOW() - INTERVAL '2 months'
);

-- Profile 15: SrinivasFade - Valorant Initiator from Vizag
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SrinivasFade',
  'Srinivas Rao',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Srinivas&backgroundColor=ffddd2',
  '/images/banners/gaming-5.svg',
  '👁️ Fade haunt diff | Info gathering specialist | AP Gaming community | Vizag LAN regular',
  'competitive',
  'te',
  'Vizag, Andhra Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "01:00"}, "weekend": {"start": "16:00", "end": "03:00"}}',
  '{"discord": "SrinivasFade#5050", "youtube": "@SrinivasFadeValo"}',
  true,
  NOW() - INTERVAL '4 months'
);

-- Profile 16: VigneshScope - CS2 AWPer from Coimbatore
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'VigneshScope',
  'Vignesh Kumar',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Vignesh&backgroundColor=caffbf',
  '/images/banners/gaming-1.svg',
  '🎯 AWP flicks compilation maker | Coimbatore CS crew | Practicing 4 hours daily | Rising star',
  'competitive',
  'ta',
  'Coimbatore, Tamil Nadu',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "14:00", "end": "02:00"}}',
  '{"discord": "VigneshScope#6060", "steam": "vigneshscope", "youtube": "@VigneshAWPClips"}',
  false,
  NOW() - INTERVAL '1 month'
);

-- Profile 17: PratikCypher - Valorant Sentinel from Nagpur
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'PratikCypher',
  'Pratik Deshmukh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pratik&backgroundColor=9bf6ff',
  '/images/banners/gaming-2.svg',
  '📷 Cypher cam angles nobody knows | Central India gaming | Setup enjoyer | 1v1 me bro',
  'competitive',
  'mr',
  'Nagpur, Maharashtra',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "00:00"}, "weekend": {"start": "15:00", "end": "02:00"}}',
  '{"discord": "PratikCypher#7171", "instagram": "@pratik.cypher"}',
  true,
  NOW() - INTERVAL '3 months'
);

-- Profile 18: DeepakEntry - CS2 Entry from Surat
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'DeepakEntry',
  'Deepak Shah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak&backgroundColor=fdffb6',
  '/images/banners/gaming-3.svg',
  '🚀 First in last out | Gujarat esports scene | Entry diff machine | Team recruiter',
  'competitive',
  'gu',
  'Surat, Gujarat',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "02:00"}, "weekend": {"start": "17:00", "end": "04:00"}}',
  '{"discord": "DeepakEntry#8282", "steam": "deepakentryking"}',
  false,
  NOW() - INTERVAL '1 month'
);

-- Profile 19: ArunPhoenix - Valorant Duelist from Thiruvananthapuram
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'ArunPhoenix',
  'Arun Pillai',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ArunP&backgroundColor=ffc6ff',
  '/images/banners/gaming-4.svg',
  '🔥 Phoenix ult timing god | Kerala valorant scene builder | Run it back mentality | Never tilt',
  'competitive',
  'ml',
  'Thiruvananthapuram, Kerala',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "16:00", "end": "03:00"}}',
  '{"discord": "ArunPhoenix#9393", "twitch": "arunphoenixval", "instagram": "@arun.phoenix.gaming"}',
  true,
  NOW() - INTERVAL '2 months'
);

-- Profile 20: SumanFlash - CS2 Support from Bhubaneswar
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SumanFlash',
  'Suman Mohapatra',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Suman&backgroundColor=bdb2ff',
  '/images/banners/gaming-5.svg',
  '💡 Flash master | Odisha CS community founder | Utility for days | Team-first always',
  'competitive',
  'or',
  'Bhubaneswar, Odisha',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "23:00"}, "weekend": {"start": "13:00", "end": "01:00"}}',
  '{"discord": "SumanFlash#1010", "steam": "sumanflashking"}',
  false,
  NOW() - INTERVAL '6 months'
);

-- Profile 21: RajViper - Valorant Controller from Patna
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'RajViper',
  'Raj Kumar Singh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=RajK&backgroundColor=a0d2db',
  '/images/banners/gaming-1.svg',
  '🐍 Viper lineups for every map | Bihar gaming ambassador | Post-plant specialist | Toxic only in-game',
  'competitive',
  'hi',
  'Patna, Bihar',
  'Asia/Kolkata',
  '{"weekday": {"start": "17:00", "end": "00:00"}, "weekend": {"start": "12:00", "end": "02:00"}}',
  '{"discord": "RajViper#2121", "youtube": "@RajViperLineups", "instagram": "@raj.viper.val"}',
  true,
  NOW() - INTERVAL '1 month'
);

-- Profile 22: SantoshSilent - CS2 Lurker from Ranchi
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SantoshSilent',
  'Santosh Oraon',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Santosh&backgroundColor=d4a373',
  '/images/banners/gaming-2.svg',
  '🤫 Silent killer | Jharkhand CS pioneer | Timing is everything | Clutch or nothing',
  'competitive',
  'hi',
  'Ranchi, Jharkhand',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "14:00", "end": "03:00"}}',
  '{"discord": "SantoshSilent#3232", "steam": "santoshsilent"}',
  false,
  NOW() - INTERVAL '2 months'
);

-- Profile 23: YashSkye - Valorant Initiator from Dehradun
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'YashSkye',
  'Yash Rawat',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Yash&backgroundColor=e9c46a',
  '/images/banners/gaming-3.svg',
  '🐕 Skye dog diff | Uttarakhand gaming community | Flash + dog combo master | Free coaching',
  'competitive',
  'hi',
  'Dehradun, Uttarakhand',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "15:00", "end": "02:00"}}',
  '{"discord": "YashSkye#4343", "instagram": "@yash.skye.val", "twitch": "yashskyemain"}',
  true,
  NOW() - INTERVAL '1 month'
);

-- Profile 24: NikhilGOA - CS2 Rifler from Goa
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'NikhilGOA',
  'Nikhil Naik',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil&backgroundColor=40916c',
  '/images/banners/gaming-4.svg',
  '🏖️ Chill vibes but tryhard gameplay | Goa gaming scene | Beach + CS2 life | LAN party host',
  'competitive',
  'en',
  'Goa',
  'Asia/Kolkata',
  '{"weekday": {"start": "21:00", "end": "03:00"}, "weekend": {"start": "18:00", "end": "05:00"}}',
  '{"discord": "NikhilGOA#5454", "steam": "nikhilgoacs", "instagram": "@nikhil.goa.gaming"}',
  false,
  NOW() - INTERVAL '4 months'
);

-- Profile 25: AnkitNeon - Valorant Duelist from Bhopal
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'AnkitNeon',
  'Ankit Sharma',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=AnkitS&backgroundColor=00b4d8',
  '/images/banners/gaming-5.svg',
  '⚡ Neon slide diff | MP Valorant founder | Speed is key | Aggressive plays only',
  'competitive',
  'hi',
  'Bhopal, Madhya Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "14:00", "end": "03:00"}}',
  '{"discord": "AnkitNeon#6565", "twitch": "ankitneonval", "youtube": "@AnkitNeonClips"}',
  true,
  true,
  NOW() - INTERVAL '2 months'
);

-- =============================================
-- INSERT DEMO USER GAMES
-- =============================================

-- Profile 1: SkRoshanOP - Valorant + CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'SkRoshan#GOAT', 'Radiant', 'Duelist', 'Initiator', 4200,
  '{"kd_ratio": 1.45, "win_rate": 58, "headshot_percentage": 32, "agents": ["Jett", "Raze", "Neon"], "maps": ["Ascent", "Haven", "Split"]}'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SkRoshan', 'Global Elite', 'Entry Fragger', 1800,
  '{"kd_ratio": 1.32, "win_rate": 54, "headshot_percentage": 48}'
FROM demo_profiles WHERE username = 'SkRoshanOP';

-- Profile 2: AadityaAWP - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'AadityaAWP', 'Global Elite', 'AWPer', 'Lurker', 5600,
  '{"kd_ratio": 1.38, "win_rate": 56, "headshot_percentage": 35}'
FROM demo_profiles WHERE username = 'AadityaAWP';

-- Profile 3: PriyaSmokeQueen - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'SmokeQueen#GIRL', 'Immortal 2', 'Controller', 2800,
  '{"kd_ratio": 1.12, "win_rate": 54, "headshot_percentage": 24, "agents": ["Omen", "Astra", "Viper"], "maps": ["Bind", "Icebox", "Lotus"]}'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

-- Profile 4: VenkatIGL - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'VenkatIGL', 'Global Elite', 'IGL', 'Support', 7200,
  '{"kd_ratio": 1.08, "win_rate": 62, "headshot_percentage": 42}'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'VenkatIGL#HYD', 'Ascendant 3', 'Initiator', 800,
  '{"kd_ratio": 1.05, "win_rate": 52, "agents": ["Sova", "Fade", "Breach"]}'
FROM demo_profiles WHERE username = 'VenkatIGL';

-- Profile 5: KarthikWalls - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'KarthikWalls#WALL', 'Diamond 3', 'Sentinel', 1900,
  '{"kd_ratio": 1.18, "win_rate": 53, "headshot_percentage": 26, "agents": ["Killjoy", "Cypher", "Chamber"], "maps": ["Ascent", "Breeze", "Pearl"]}'
FROM demo_profiles WHERE username = 'KarthikWalls';

-- Profile 6: SouravRUSH - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SouravRUSH', 'Legendary Eagle Master', 'Entry Fragger', 3400,
  '{"kd_ratio": 1.25, "win_rate": 51, "headshot_percentage": 52}'
FROM demo_profiles WHERE username = 'SouravRUSH';

-- Profile 7: NehaDuelist - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'NehaDuelist#DASH', 'Immortal 1', 'Duelist', 2400,
  '{"kd_ratio": 1.35, "win_rate": 55, "headshot_percentage": 28, "agents": ["Jett", "Reyna", "Neon"], "maps": ["Haven", "Split", "Fracture"]}'
FROM demo_profiles WHERE username = 'NehaDuelist';

-- Profile 8: HarshLurk - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'HarshLurk', 'Supreme Master First Class', 'Lurker', 'Rifler', 4100,
  '{"kd_ratio": 1.22, "win_rate": 54, "headshot_percentage": 45}'
FROM demo_profiles WHERE username = 'HarshLurk';

-- Profile 9: ArjunSova - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'ArjunSova#DART', 'Ascendant 2', 'Initiator', 2100,
  '{"kd_ratio": 1.15, "win_rate": 56, "headshot_percentage": 25, "agents": ["Sova", "Fade", "Skye"], "maps": ["Icebox", "Breeze", "Ascent"]}'
FROM demo_profiles WHERE username = 'ArjunSova';

-- Profile 10: AmitSupport - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'AmitSupport', 'Master Guardian Elite', 'Support', 'IGL', 2800,
  '{"kd_ratio": 0.95, "win_rate": 55, "headshot_percentage": 38}'
FROM demo_profiles WHERE username = 'AmitSupport';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'AmitSupport#UTIL', 'Platinum 3', 'Controller', 600,
  '{"kd_ratio": 0.98, "win_rate": 51, "agents": ["Brimstone", "Omen"]}'
FROM demo_profiles WHERE username = 'AmitSupport';

-- Profile 11: AnuRaze - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'AnuRaze#BOOM', 'Diamond 2', 'Duelist', 1600,
  '{"kd_ratio": 1.28, "win_rate": 52, "agents": ["Raze", "Phoenix", "Neon"], "maps": ["Bind", "Split", "Haven"]}'
FROM demo_profiles WHERE username = 'AnuRaze';

-- Profile 12: GurpreetAK - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'GurpreetAK', 'Legendary Eagle', 'Rifler', 'Entry Fragger', 3200,
  '{"kd_ratio": 1.18, "win_rate": 52, "headshot_percentage": 41}'
FROM demo_profiles WHERE username = 'GurpreetAK';

-- Profile 13: RahulAstra - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'RahulAstra#STAR', 'Ascendant 1', 'Controller', 2000,
  '{"kd_ratio": 1.05, "win_rate": 54, "agents": ["Astra", "Omen", "Harbor"], "maps": ["Lotus", "Pearl", "Sunset"]}'
FROM demo_profiles WHERE username = 'RahulAstra';

-- Profile 14: BiswajitFlex - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'BiswajitFlex', 'Distinguished Master Guardian', 'Flex', 2600,
  '{"kd_ratio": 1.12, "win_rate": 50, "headshot_percentage": 44}'
FROM demo_profiles WHERE username = 'BiswajitFlex';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'BiswajitFlex#NE', 'Gold 3', 'Sentinel', 400,
  '{"kd_ratio": 1.08, "win_rate": 49, "agents": ["Cypher", "Killjoy"]}'
FROM demo_profiles WHERE username = 'BiswajitFlex';

-- Profile 15: SrinivasFade - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'SrinivasFade#INFO', 'Diamond 1', 'Initiator', 1700,
  '{"kd_ratio": 1.10, "win_rate": 53, "agents": ["Fade", "Gekko", "KAY/O"], "maps": ["Ascent", "Haven", "Icebox"]}'
FROM demo_profiles WHERE username = 'SrinivasFade';

-- Profile 16: VigneshScope - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'VigneshScope', 'Master Guardian 2', 'AWPer', 1800,
  '{"kd_ratio": 1.20, "win_rate": 50, "headshot_percentage": 28}'
FROM demo_profiles WHERE username = 'VigneshScope';

-- Profile 17: PratikCypher - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'PratikCypher#CAM', 'Platinum 2', 'Sentinel', 1400,
  '{"kd_ratio": 1.08, "win_rate": 51, "agents": ["Cypher", "Chamber", "Killjoy"], "maps": ["Split", "Bind", "Ascent"]}'
FROM demo_profiles WHERE username = 'PratikCypher';

-- Profile 18: DeepakEntry - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'DeepakEntry', 'Gold Nova Master', 'Entry Fragger', 1500,
  '{"kd_ratio": 1.15, "win_rate": 48, "headshot_percentage": 46}'
FROM demo_profiles WHERE username = 'DeepakEntry';

-- Profile 19: ArunPhoenix - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'ArunPhoenix#FIRE', 'Platinum 3', 'Duelist', 1300,
  '{"kd_ratio": 1.22, "win_rate": 50, "agents": ["Phoenix", "Yoru", "Iso"], "maps": ["Haven", "Bind", "Fracture"]}'
FROM demo_profiles WHERE username = 'ArunPhoenix';

-- Profile 20: SumanFlash - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SumanFlash', 'Master Guardian 1', 'Support', 2100,
  '{"kd_ratio": 0.92, "win_rate": 53, "headshot_percentage": 36}'
FROM demo_profiles WHERE username = 'SumanFlash';

-- Profile 21: RajViper - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'RajViper#ACID', 'Gold 2', 'Controller', 1100,
  '{"kd_ratio": 1.02, "win_rate": 50, "agents": ["Viper", "Brimstone", "Clove"], "maps": ["Breeze", "Icebox", "Pearl"]}'
FROM demo_profiles WHERE username = 'RajViper';

-- Profile 22: SantoshSilent - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SantoshSilent', 'Gold Nova 3', 'Lurker', 1400,
  '{"kd_ratio": 1.10, "win_rate": 49, "headshot_percentage": 40}'
FROM demo_profiles WHERE username = 'SantoshSilent';

-- Profile 23: YashSkye - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'YashSkye#WOOF', 'Silver 3', 'Initiator', 800,
  '{"kd_ratio": 1.05, "win_rate": 48, "agents": ["Skye", "Breach", "KAY/O"], "maps": ["Ascent", "Haven", "Split"]}'
FROM demo_profiles WHERE username = 'YashSkye';

-- Profile 24: NikhilGOA - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'NikhilGOA', 'Silver Elite Master', 'Rifler', 'Flex', 1200,
  '{"kd_ratio": 1.08, "win_rate": 47, "headshot_percentage": 38}'
FROM demo_profiles WHERE username = 'NikhilGOA';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'NikhilGOA#BEACH', 'Bronze 3', 'Duelist', 300,
  '{"kd_ratio": 1.12, "win_rate": 46, "agents": ["Reyna", "Phoenix"]}'
FROM demo_profiles WHERE username = 'NikhilGOA';

-- Profile 25: AnkitNeon - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'AnkitNeon#ZOOM', 'Gold 1', 'Duelist', 950,
  '{"kd_ratio": 1.18, "win_rate": 49, "agents": ["Neon", "Jett", "Raze"], "maps": ["Split", "Fracture", "Sunset"]}'
FROM demo_profiles WHERE username = 'AnkitNeon';

-- =============================================
-- INSERT DEMO USER BADGES
-- =============================================

-- SkRoshanOP badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '6 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Tournament Champion', 'tournament_winner', '🏆', 'Won a tournament', 'legendary', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Content Creator', 'streamer', '📺', 'Active streamer', 'epic', NOW() - INTERVAL '4 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'LAN Warrior', 'lan_warrior', '🖥️', 'Attended LAN events', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Headshot Machine', 'headshot_machine', '🎯', '60%+ headshot rate', 'legendary', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

-- AadityaAWP badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '8 months'
FROM demo_profiles WHERE username = 'AadityaAWP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Dedicated Grinder', 'grinder', '⚡', '1000+ hours played', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'AadityaAWP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Ace Hunter', 'ace_hunter', '💀', '100+ aces', 'epic', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'AadityaAWP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Veteran', 'veteran', '🎖️', '5+ years gaming', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'AadityaAWP';

-- PriyaSmokeQueen badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '7 months'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Content Creator', 'streamer', '📺', 'Active streamer', 'epic', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Friendly Player', 'friendly', '😊', 'High teammate ratings', 'common', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Mentor', 'mentor', '📚', 'Helped 50+ new players', 'rare', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

-- VenkatIGL badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '14 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Team Captain', 'team_captain', '👑', 'Leads a clan/team', 'epic', NOW() - INTERVAL '9 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Mentor', 'mentor', '📚', 'Helped 50+ new players', 'rare', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'LAN Warrior', 'lan_warrior', '🖥️', 'Attended LAN events', 'epic', NOW() - INTERVAL '4 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Veteran', 'veteran', '🎖️', '5+ years gaming', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'VenkatIGL';

-- NehaDuelist badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '6 months'
FROM demo_profiles WHERE username = 'NehaDuelist';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Content Creator', 'streamer', '📺', 'Active streamer', 'epic', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'NehaDuelist';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Rising Star', 'rising_star', '🚀', 'Fast rank improvement', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'NehaDuelist';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Ace Hunter', 'ace_hunter', '💀', '100+ aces', 'epic', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'NehaDuelist';

-- Add verified badges for other profiles
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', created_at + INTERVAL '7 days'
FROM demo_profiles WHERE username IN ('KarthikWalls', 'SouravRUSH', 'HarshLurk', 'ArjunSova', 'AmitSupport',
  'AnuRaze', 'GurpreetAK', 'RahulAstra', 'BiswajitFlex', 'SrinivasFade', 'VigneshScope', 'PratikCypher',
  'DeepakEntry', 'ArunPhoenix', 'SumanFlash', 'RajViper', 'SantoshSilent', 'YashSkye', 'NikhilGOA', 'AnkitNeon');

-- Additional badges for various profiles
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Clutch Master', 'clutch_master', '🎯', '500+ clutch wins', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username IN ('HarshLurk', 'SantoshSilent', 'KarthikWalls');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Friendly Player', 'friendly', '😊', 'High teammate ratings', 'common', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('AmitSupport', 'ArjunSova', 'YashSkye', 'SumanFlash', 'ArunPhoenix', 'AnuRaze');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'MVP', 'mvp', '⭐', 'Match MVP 100+ times', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username IN ('SouravRUSH', 'GurpreetAK', 'DeepakEntry');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Mentor', 'mentor', '📚', 'Helped 50+ new players', 'rare', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('RahulAstra', 'YashSkye', 'RajViper');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Early Adopter', 'early_adopter', '🌟', 'Joined during beta', 'rare', NOW() - INTERVAL '6 months'
FROM demo_profiles WHERE username IN ('RahulAstra', 'SumanFlash');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Team Captain', 'team_captain', '👑', 'Leads a clan/team', 'epic', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('AnuRaze', 'SumanFlash', 'AnkitNeon');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Rising Star', 'rising_star', '🚀', 'Fast rank improvement', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username IN ('VigneshScope', 'AnkitNeon');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'LAN Warrior', 'lan_warrior', '🖥️', 'Attended LAN events', 'epic', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username IN ('GurpreetAK', 'SrinivasFade', 'NikhilGOA');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Dedicated Grinder', 'grinder', '⚡', '1000+ hours played', 'rare', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('HarshLurk', 'SouravRUSH', 'GurpreetAK');

-- =============================================
-- Create view for complete demo profiles
-- =============================================
CREATE OR REPLACE VIEW demo_profiles_complete AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.banner_url,
  p.bio,
  p.gaming_style,
  p.preferred_language,
  p.region,
  p.timezone,
  p.online_hours,
  p.social_links,
  p.is_online,
  p.is_verified,
  p.created_at,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'game', g.game_name,
      'game_slug', g.game_slug,
      'in_game_name', g.in_game_name,
      'rank', g.rank,
      'role', g.role,
      'secondary_role', g.secondary_role,
      'hours', g.hours_played,
      'stats', g.stats
    ) ORDER BY g.hours_played DESC)
    FROM demo_user_games g WHERE g.user_id = p.id),
    '[]'::json
  ) as games,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'name', b.badge_name,
      'slug', b.badge_slug,
      'icon', b.badge_icon,
      'description', b.badge_description,
      'rarity', b.badge_rarity,
      'earned_at', b.earned_at
    ) ORDER BY
      CASE b.badge_rarity
        WHEN 'legendary' THEN 1
        WHEN 'epic' THEN 2
        WHEN 'rare' THEN 3
        ELSE 4
      END)
    FROM demo_user_badges b WHERE b.user_id = p.id),
    '[]'::json
  ) as badges,
  (SELECT COUNT(*) FROM demo_user_badges b WHERE b.user_id = p.id) as badge_count,
  (SELECT COALESCE(SUM(g.hours_played), 0) FROM demo_user_games g WHERE g.user_id = p.id) as total_hours
FROM demo_profiles p
ORDER BY p.is_online DESC, p.created_at DESC;

-- Grant access
GRANT SELECT ON demo_profiles_complete TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created 25 Indian demo profiles with games and badges!';
  RAISE NOTICE '📊 Tables created: demo_profiles, demo_user_games, demo_user_badges';
  RAISE NOTICE '👁️ View created: demo_profiles_complete';
END $$;
