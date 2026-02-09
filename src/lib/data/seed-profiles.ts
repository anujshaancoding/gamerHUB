// Enhanced Indian Gamer Profiles Seed Data
// 25+ Complete profiles with realistic data

export interface SeedProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  gaming_style: 'casual' | 'competitive' | 'pro';
  preferred_language: string;
  region: string;
  timezone: string;
  online_hours: {
    weekday: { start: string; end: string };
    weekend: { start: string; end: string };
  };
  social_links: {
    discord?: string;
    twitch?: string;
    youtube?: string;
    twitter?: string;
    steam?: string;
    instagram?: string;
  };
  is_online: boolean;
  games: SeedGameProfile[];
  badges: SeedBadge[];
  stats: {
    matches_played: number;
    wins: number;
    hours_played: number;
    teammates_met: number;
  };
  ratings: {
    skill: number;
    communication: number;
    teamwork: number;
    positivity: number;
  };
}

export interface SeedGameProfile {
  game: string;
  game_id: string;
  in_game_name: string;
  rank: string;
  rank_image?: string;
  role: string;
  secondary_role?: string;
  agents?: string[];
  maps?: string[];
  hours: number;
  kd_ratio?: number;
  win_rate?: number;
  headshot_percentage?: number;
}

export interface SeedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at: string;
}

// Indian cities and regions mapping
const indianRegions = {
  'Mumbai, Maharashtra': 'Asia/Kolkata',
  'Delhi, NCR': 'Asia/Kolkata',
  'Bangalore, Karnataka': 'Asia/Kolkata',
  'Hyderabad, Telangana': 'Asia/Kolkata',
  'Chennai, Tamil Nadu': 'Asia/Kolkata',
  'Kolkata, West Bengal': 'Asia/Kolkata',
  'Pune, Maharashtra': 'Asia/Kolkata',
  'Ahmedabad, Gujarat': 'Asia/Kolkata',
  'Jaipur, Rajasthan': 'Asia/Kolkata',
  'Lucknow, Uttar Pradesh': 'Asia/Kolkata',
  'Kochi, Kerala': 'Asia/Kolkata',
  'Chandigarh, Punjab': 'Asia/Kolkata',
  'Indore, Madhya Pradesh': 'Asia/Kolkata',
  'Bhopal, Madhya Pradesh': 'Asia/Kolkata',
  'Guwahati, Assam': 'Asia/Kolkata',
  'Vizag, Andhra Pradesh': 'Asia/Kolkata',
  'Coimbatore, Tamil Nadu': 'Asia/Kolkata',
  'Nagpur, Maharashtra': 'Asia/Kolkata',
  'Surat, Gujarat': 'Asia/Kolkata',
  'Thiruvananthapuram, Kerala': 'Asia/Kolkata',
  'Bhubaneswar, Odisha': 'Asia/Kolkata',
  'Patna, Bihar': 'Asia/Kolkata',
  'Ranchi, Jharkhand': 'Asia/Kolkata',
  'Dehradun, Uttarakhand': 'Asia/Kolkata',
  'Goa': 'Asia/Kolkata',
};

// Valorant Ranks and Agents
const valorantRanks = ['Iron 1', 'Iron 2', 'Iron 3', 'Bronze 1', 'Bronze 2', 'Bronze 3', 'Silver 1', 'Silver 2', 'Silver 3', 'Gold 1', 'Gold 2', 'Gold 3', 'Platinum 1', 'Platinum 2', 'Platinum 3', 'Diamond 1', 'Diamond 2', 'Diamond 3', 'Ascendant 1', 'Ascendant 2', 'Ascendant 3', 'Immortal 1', 'Immortal 2', 'Immortal 3', 'Radiant'];

const valorantAgents = {
  duelist: ['Jett', 'Phoenix', 'Reyna', 'Raze', 'Yoru', 'Neon', 'Iso'],
  initiator: ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko'],
  controller: ['Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove'],
  sentinel: ['Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Vyse'],
};

// CS2 Ranks and Roles
const cs2Ranks = ['Silver 1', 'Silver 2', 'Silver 3', 'Silver 4', 'Silver Elite', 'Silver Elite Master', 'Gold Nova 1', 'Gold Nova 2', 'Gold Nova 3', 'Gold Nova Master', 'Master Guardian 1', 'Master Guardian 2', 'Master Guardian Elite', 'Distinguished Master Guardian', 'Legendary Eagle', 'Legendary Eagle Master', 'Supreme Master First Class', 'Global Elite'];

const cs2Roles = ['Entry Fragger', 'AWPer', 'Support', 'Lurker', 'IGL (In-Game Leader)', 'Rifler', 'Flex'];

// CS2 Premier Ratings
const cs2PremierRatings = [5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500, 25000, 27500, 30000];

// Badge definitions
const availableBadges: SeedBadge[] = [
  { id: 'verified', name: 'Verified Player', description: 'Account verified', icon: '✓', rarity: 'common', earned_at: '' },
  { id: 'early_adopter', name: 'Early Adopter', description: 'Joined during beta', icon: '🌟', rarity: 'rare', earned_at: '' },
  { id: 'tournament_winner', name: 'Tournament Champion', description: 'Won a tournament', icon: '🏆', rarity: 'legendary', earned_at: '' },
  { id: 'streamer', name: 'Content Creator', description: 'Active streamer', icon: '📺', rarity: 'epic', earned_at: '' },
  { id: 'team_captain', name: 'Team Captain', description: 'Leads a clan/team', icon: '👑', rarity: 'epic', earned_at: '' },
  { id: 'mvp', name: 'MVP', description: 'Match MVP 100+ times', icon: '⭐', rarity: 'rare', earned_at: '' },
  { id: 'clutch_master', name: 'Clutch Master', description: '500+ clutch wins', icon: '🎯', rarity: 'epic', earned_at: '' },
  { id: 'friendly', name: 'Friendly Player', description: 'High teammate ratings', icon: '😊', rarity: 'common', earned_at: '' },
  { id: 'mentor', name: 'Mentor', description: 'Helped 50+ new players', icon: '📚', rarity: 'rare', earned_at: '' },
  { id: 'grinder', name: 'Dedicated Grinder', description: '1000+ hours played', icon: '⚡', rarity: 'rare', earned_at: '' },
  { id: 'ace_hunter', name: 'Ace Hunter', description: '100+ aces', icon: '💀', rarity: 'epic', earned_at: '' },
  { id: 'headshot_machine', name: 'Headshot Machine', description: '60%+ headshot rate', icon: '🎯', rarity: 'legendary', earned_at: '' },
  { id: 'lan_warrior', name: 'LAN Warrior', description: 'Attended LAN events', icon: '🖥️', rarity: 'epic', earned_at: '' },
  { id: 'rising_star', name: 'Rising Star', description: 'Fast rank improvement', icon: '🚀', rarity: 'rare', earned_at: '' },
  { id: 'veteran', name: 'Veteran', description: '5+ years gaming', icon: '🎖️', rarity: 'epic', earned_at: '' },
];

// Generate seed profiles
export const seedProfiles: SeedProfile[] = [
  // Profile 1 - Pro Valorant Player from Mumbai
  {
    id: 'seed-001',
    username: 'SkRoshanOP',
    display_name: 'Roshan Sharma',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roshan&backgroundColor=b6e3f4',
    banner_url: '/images/banners/gaming-1.svg',
    bio: '🎮 Valorant Pro | Ex-Velocity Gaming | 2x VCT Qualifier | DMs open for scrims 🇮🇳',
    gaming_style: 'pro',
    preferred_language: 'hi',
    region: 'Mumbai, Maharashtra',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '18:00', end: '02:00' },
      weekend: { start: '14:00', end: '04:00' },
    },
    social_links: {
      discord: 'SkRoshanOP#1337',
      twitch: 'skroshanop',
      youtube: '@SkRoshanGaming',
      twitter: '@SkRoshanOP',
      instagram: '@roshan.gaming',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'SkRoshan#GOAT',
        rank: 'Radiant',
        role: 'Duelist',
        secondary_role: 'Initiator',
        agents: ['Jett', 'Raze', 'Neon'],
        maps: ['Ascent', 'Haven', 'Split'],
        hours: 4200,
        kd_ratio: 1.45,
        win_rate: 58,
        headshot_percentage: 32,
      },
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'SkRoshan',
        rank: 'Global Elite',
        role: 'Entry Fragger',
        hours: 1800,
        kd_ratio: 1.32,
        win_rate: 54,
        headshot_percentage: 48,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-06-15' },
      { ...availableBadges[2], earned_at: '2024-02-20' },
      { ...availableBadges[3], earned_at: '2023-08-10' },
      { ...availableBadges[12], earned_at: '2024-01-15' },
      { ...availableBadges[11], earned_at: '2024-03-01' },
    ],
    stats: {
      matches_played: 8500,
      wins: 4930,
      hours_played: 6000,
      teammates_met: 2340,
    },
    ratings: {
      skill: 4.9,
      communication: 4.7,
      teamwork: 4.6,
      positivity: 4.5,
    },
  },

  // Profile 2 - CS2 AWPer from Delhi
  {
    id: 'seed-002',
    username: 'AadityaAWP',
    display_name: 'Aaditya Verma',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aaditya&backgroundColor=c0aede',
    banner_url: '/images/banners/gaming-2.svg',
    bio: '🔫 AWP is life | CS2 Grinder | Premier 25K+ | Looking for serious team 🎯',
    gaming_style: 'competitive',
    preferred_language: 'en',
    region: 'Delhi, NCR',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '20:00', end: '01:00' },
      weekend: { start: '16:00', end: '03:00' },
    },
    social_links: {
      discord: 'AadityaAWP#2048',
      steam: 'aadityaawp',
      youtube: '@AadityaCS2',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'AadityaAWP',
        rank: 'Global Elite',
        role: 'AWPer',
        secondary_role: 'Lurker',
        hours: 5600,
        kd_ratio: 1.38,
        win_rate: 56,
        headshot_percentage: 35,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-04-20' },
      { ...availableBadges[9], earned_at: '2024-01-10' },
      { ...availableBadges[10], earned_at: '2024-02-28' },
      { ...availableBadges[14], earned_at: '2023-12-01' },
    ],
    stats: {
      matches_played: 6200,
      wins: 3472,
      hours_played: 5600,
      teammates_met: 1890,
    },
    ratings: {
      skill: 4.8,
      communication: 4.4,
      teamwork: 4.3,
      positivity: 4.2,
    },
  },

  // Profile 3 - Valorant Controller from Bangalore
  {
    id: 'seed-003',
    username: 'PriyaSmokeQueen',
    display_name: 'Priya Nair',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffd5dc&hair=long&hairColor=4a312c',
    banner_url: '/images/banners/gaming-3.svg',
    bio: '💨 Smoke diff every game | Omen/Astra main | Girls in Gaming advocate | Stream Mon-Fri',
    gaming_style: 'competitive',
    preferred_language: 'en',
    region: 'Bangalore, Karnataka',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '23:00' },
      weekend: { start: '15:00', end: '01:00' },
    },
    social_links: {
      discord: 'PriyaSmokeQueen#7777',
      twitch: 'priyasmokequeen',
      twitter: '@PriyaGamingBLR',
      instagram: '@priya.gaming',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'SmokeQueen#GIRL',
        rank: 'Immortal 2',
        role: 'Controller',
        agents: ['Omen', 'Astra', 'Viper'],
        maps: ['Bind', 'Icebox', 'Lotus'],
        hours: 2800,
        kd_ratio: 1.12,
        win_rate: 54,
        headshot_percentage: 24,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-05-10' },
      { ...availableBadges[3], earned_at: '2023-09-15' },
      { ...availableBadges[7], earned_at: '2024-01-20' },
      { ...availableBadges[8], earned_at: '2024-03-05' },
    ],
    stats: {
      matches_played: 3200,
      wins: 1728,
      hours_played: 2800,
      teammates_met: 980,
    },
    ratings: {
      skill: 4.5,
      communication: 4.9,
      teamwork: 4.8,
      positivity: 4.9,
    },
  },

  // Profile 4 - CS2 IGL from Hyderabad
  {
    id: 'seed-004',
    username: 'VenkatIGL',
    display_name: 'Venkat Reddy',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Venkat&backgroundColor=d1d4f9',
    banner_url: '/images/banners/gaming-4.svg',
    bio: '🧠 IGL & Strategist | Ex-Entity Gaming | Open to coaching | Building HydCS Academy',
    gaming_style: 'pro',
    preferred_language: 'te',
    region: 'Hyderabad, Telangana',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '17:00', end: '00:00' },
      weekend: { start: '12:00', end: '02:00' },
    },
    social_links: {
      discord: 'VenkatIGL#1001',
      steam: 'venkatigl',
      twitter: '@VenkatIGL',
      youtube: '@VenkatCSAcademy',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'VenkatIGL',
        rank: 'Global Elite',
        role: 'IGL (In-Game Leader)',
        secondary_role: 'Support',
        hours: 7200,
        kd_ratio: 1.08,
        win_rate: 62,
        headshot_percentage: 42,
      },
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'VenkatIGL#HYD',
        rank: 'Ascendant 3',
        role: 'Initiator',
        agents: ['Sova', 'Fade', 'Breach'],
        hours: 800,
        kd_ratio: 1.05,
        win_rate: 52,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2022-10-15' },
      { ...availableBadges[4], earned_at: '2023-03-20' },
      { ...availableBadges[8], earned_at: '2023-11-10' },
      { ...availableBadges[14], earned_at: '2024-01-01' },
      { ...availableBadges[12], earned_at: '2023-08-15' },
    ],
    stats: {
      matches_played: 9500,
      wins: 5890,
      hours_played: 8000,
      teammates_met: 3200,
    },
    ratings: {
      skill: 4.6,
      communication: 4.9,
      teamwork: 4.9,
      positivity: 4.7,
    },
  },

  // Profile 5 - Valorant Sentinel from Chennai
  {
    id: 'seed-005',
    username: 'KarthikWalls',
    display_name: 'Karthik Subramanian',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik&backgroundColor=ffdfbf',
    banner_url: '/images/banners/gaming-5.svg',
    bio: '🛡️ Killjoy diff | Site anchor specialist | Setup enjoyer | DMs open for tips',
    gaming_style: 'competitive',
    preferred_language: 'ta',
    region: 'Chennai, Tamil Nadu',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '21:00', end: '01:00' },
      weekend: { start: '18:00', end: '03:00' },
    },
    social_links: {
      discord: 'KarthikWalls#4444',
      instagram: '@karthik_gaming_tn',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'KarthikWalls#WALL',
        rank: 'Diamond 3',
        role: 'Sentinel',
        agents: ['Killjoy', 'Cypher', 'Chamber'],
        maps: ['Ascent', 'Breeze', 'Pearl'],
        hours: 1900,
        kd_ratio: 1.18,
        win_rate: 53,
        headshot_percentage: 26,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-07-20' },
      { ...availableBadges[7], earned_at: '2024-02-10' },
      { ...availableBadges[6], earned_at: '2024-01-25' },
    ],
    stats: {
      matches_played: 2100,
      wins: 1113,
      hours_played: 1900,
      teammates_met: 650,
    },
    ratings: {
      skill: 4.3,
      communication: 4.5,
      teamwork: 4.7,
      positivity: 4.6,
    },
  },

  // Profile 6 - CS2 Entry from Kolkata
  {
    id: 'seed-006',
    username: 'SouravRUSH',
    display_name: 'Sourav Das',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sourav&backgroundColor=c0f0f0',
    banner_url: '/images/banners/gaming-1.svg',
    bio: '⚡ Entry frag or die trying | KOL CS Scene | Looking for team | Aim trainer addict',
    gaming_style: 'competitive',
    preferred_language: 'bn',
    region: 'Kolkata, West Bengal',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '00:00' },
      weekend: { start: '14:00', end: '02:00' },
    },
    social_links: {
      discord: 'SouravRUSH#5555',
      steam: 'souravrush',
      twitter: '@SouravRushCS',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'SouravRUSH',
        rank: 'Legendary Eagle Master',
        role: 'Entry Fragger',
        hours: 3400,
        kd_ratio: 1.25,
        win_rate: 51,
        headshot_percentage: 52,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-08-10' },
      { ...availableBadges[11], earned_at: '2024-02-15' },
      { ...availableBadges[9], earned_at: '2024-01-01' },
    ],
    stats: {
      matches_played: 4200,
      wins: 2142,
      hours_played: 3400,
      teammates_met: 1450,
    },
    ratings: {
      skill: 4.4,
      communication: 4.2,
      teamwork: 4.0,
      positivity: 4.1,
    },
  },

  // Profile 7 - Valorant Duelist from Pune
  {
    id: 'seed-007',
    username: 'NehaDuelist',
    display_name: 'Neha Patil',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha&backgroundColor=ffb6c1&hair=long&hairColor=2c1810',
    banner_url: '/images/banners/gaming-2.svg',
    bio: '⚔️ Jett/Reyna 2-trick | VCT Game Changers aspirant | Content creator | Aim labs grinder',
    gaming_style: 'competitive',
    preferred_language: 'mr',
    region: 'Pune, Maharashtra',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '18:00', end: '23:00' },
      weekend: { start: '13:00', end: '01:00' },
    },
    social_links: {
      discord: 'NehaDuelist#8888',
      twitch: 'nehaduelist',
      instagram: '@neha.valorant',
      youtube: '@NehaDuelistValo',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'NehaDuelist#DASH',
        rank: 'Immortal 1',
        role: 'Duelist',
        agents: ['Jett', 'Reyna', 'Neon'],
        maps: ['Haven', 'Split', 'Fracture'],
        hours: 2400,
        kd_ratio: 1.35,
        win_rate: 55,
        headshot_percentage: 28,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-06-25' },
      { ...availableBadges[3], earned_at: '2023-10-10' },
      { ...availableBadges[13], earned_at: '2024-02-01' },
      { ...availableBadges[10], earned_at: '2024-03-10' },
    ],
    stats: {
      matches_played: 2800,
      wins: 1540,
      hours_played: 2400,
      teammates_met: 870,
    },
    ratings: {
      skill: 4.6,
      communication: 4.7,
      teamwork: 4.4,
      positivity: 4.8,
    },
  },

  // Profile 8 - CS2 Lurker from Ahmedabad
  {
    id: 'seed-008',
    username: 'HarshLurk',
    display_name: 'Harsh Patel',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harsh&backgroundColor=e0e0e0',
    banner_url: '/images/banners/gaming-3.svg',
    bio: '🐍 Silent but deadly | Lurk timings god | FaceIT Lvl 10 | Clutch or kick',
    gaming_style: 'competitive',
    preferred_language: 'gu',
    region: 'Ahmedabad, Gujarat',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '20:00', end: '02:00' },
      weekend: { start: '16:00', end: '04:00' },
    },
    social_links: {
      discord: 'HarshLurk#9999',
      steam: 'harshlurk',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'HarshLurk',
        rank: 'Supreme Master First Class',
        role: 'Lurker',
        secondary_role: 'Rifler',
        hours: 4100,
        kd_ratio: 1.22,
        win_rate: 54,
        headshot_percentage: 45,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-05-05' },
      { ...availableBadges[6], earned_at: '2023-12-20' },
      { ...availableBadges[9], earned_at: '2024-01-15' },
    ],
    stats: {
      matches_played: 5100,
      wins: 2754,
      hours_played: 4100,
      teammates_met: 1680,
    },
    ratings: {
      skill: 4.5,
      communication: 3.9,
      teamwork: 4.2,
      positivity: 4.0,
    },
  },

  // Profile 9 - Valorant Initiator from Jaipur
  {
    id: 'seed-009',
    username: 'ArjunSova',
    display_name: 'Arjun Singh Rathore',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=ffecd2',
    banner_url: '/images/banners/gaming-4.svg',
    bio: '🦅 Sova lineups = free wins | Dart diff specialist | YT tutorials coming soon | Rajasthan represent 🏜️',
    gaming_style: 'competitive',
    preferred_language: 'hi',
    region: 'Jaipur, Rajasthan',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '01:00' },
      weekend: { start: '15:00', end: '03:00' },
    },
    social_links: {
      discord: 'ArjunSova#1234',
      youtube: '@ArjunSovaLineups',
      instagram: '@arjun_valorant',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'ArjunSova#DART',
        rank: 'Ascendant 2',
        role: 'Initiator',
        agents: ['Sova', 'Fade', 'Skye'],
        maps: ['Icebox', 'Breeze', 'Ascent'],
        hours: 2100,
        kd_ratio: 1.15,
        win_rate: 56,
        headshot_percentage: 25,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-09-01' },
      { ...availableBadges[8], earned_at: '2024-01-30' },
      { ...availableBadges[7], earned_at: '2024-02-20' },
    ],
    stats: {
      matches_played: 2400,
      wins: 1344,
      hours_played: 2100,
      teammates_met: 780,
    },
    ratings: {
      skill: 4.4,
      communication: 4.8,
      teamwork: 4.7,
      positivity: 4.6,
    },
  },

  // Profile 10 - CS2 Support from Lucknow
  {
    id: 'seed-010',
    username: 'AmitSupport',
    display_name: 'Amit Mishra',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit&backgroundColor=bde0fe',
    banner_url: '/images/banners/gaming-5.svg',
    bio: '💪 Support player who actually supports | Flash god | Utility diff | Team player always',
    gaming_style: 'competitive',
    preferred_language: 'hi',
    region: 'Lucknow, Uttar Pradesh',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '18:00', end: '00:00' },
      weekend: { start: '14:00', end: '02:00' },
    },
    social_links: {
      discord: 'AmitSupport#6666',
      steam: 'amitsupport',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'AmitSupport',
        rank: 'Master Guardian Elite',
        role: 'Support',
        secondary_role: 'IGL (In-Game Leader)',
        hours: 2800,
        kd_ratio: 0.95,
        win_rate: 55,
        headshot_percentage: 38,
      },
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'AmitSupport#UTIL',
        rank: 'Platinum 3',
        role: 'Controller',
        agents: ['Brimstone', 'Omen'],
        hours: 600,
        kd_ratio: 0.98,
        win_rate: 51,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-07-10' },
      { ...availableBadges[7], earned_at: '2023-11-25' },
      { ...availableBadges[8], earned_at: '2024-02-05' },
    ],
    stats: {
      matches_played: 3800,
      wins: 2090,
      hours_played: 3400,
      teammates_met: 1250,
    },
    ratings: {
      skill: 4.0,
      communication: 4.9,
      teamwork: 4.9,
      positivity: 4.8,
    },
  },

  // Profile 11 - Valorant Duelist from Kochi
  {
    id: 'seed-011',
    username: 'AnuRaze',
    display_name: 'Anu Menon',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anu&backgroundColor=ffc8dd&hair=long&hairColor=1a1a1a',
    banner_url: '/images/banners/gaming-1.svg',
    bio: '💥 Raze main | Satchel plays only | Kerala gaming community admin | Girls squad recruiter',
    gaming_style: 'competitive',
    preferred_language: 'ml',
    region: 'Kochi, Kerala',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '20:00', end: '00:00' },
      weekend: { start: '17:00', end: '02:00' },
    },
    social_links: {
      discord: 'AnuRaze#2323',
      instagram: '@anu.raze.gaming',
      twitch: 'anuraze',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'AnuRaze#BOOM',
        rank: 'Diamond 2',
        role: 'Duelist',
        agents: ['Raze', 'Phoenix', 'Neon'],
        maps: ['Bind', 'Split', 'Haven'],
        hours: 1600,
        kd_ratio: 1.28,
        win_rate: 52,
        headshot_percentage: 27,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-10-15' },
      { ...availableBadges[4], earned_at: '2024-01-10' },
      { ...availableBadges[7], earned_at: '2024-02-25' },
    ],
    stats: {
      matches_played: 1800,
      wins: 936,
      hours_played: 1600,
      teammates_met: 540,
    },
    ratings: {
      skill: 4.3,
      communication: 4.6,
      teamwork: 4.5,
      positivity: 4.7,
    },
  },

  // Profile 12 - CS2 Rifler from Chandigarh
  {
    id: 'seed-012',
    username: 'GurpreetAK',
    display_name: 'Gurpreet Singh',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gurpreet&backgroundColor=a0c4ff',
    banner_url: '/images/banners/gaming-2.svg',
    bio: '🔫 AK spray transfer montages | Punjab CS community | Lan events host | DM for scrims',
    gaming_style: 'competitive',
    preferred_language: 'pa',
    region: 'Chandigarh, Punjab',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '01:00' },
      weekend: { start: '15:00', end: '03:00' },
    },
    social_links: {
      discord: 'GurpreetAK#4747',
      steam: 'gurpreetsprayak',
      youtube: '@GurpreetAKCS2',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'GurpreetAK',
        rank: 'Legendary Eagle',
        role: 'Rifler',
        secondary_role: 'Entry Fragger',
        hours: 3200,
        kd_ratio: 1.18,
        win_rate: 52,
        headshot_percentage: 41,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-06-30' },
      { ...availableBadges[5], earned_at: '2024-01-20' },
      { ...availableBadges[12], earned_at: '2023-12-15' },
    ],
    stats: {
      matches_played: 4000,
      wins: 2080,
      hours_played: 3200,
      teammates_met: 1380,
    },
    ratings: {
      skill: 4.2,
      communication: 4.4,
      teamwork: 4.3,
      positivity: 4.5,
    },
  },

  // Profile 13 - Valorant Controller from Indore
  {
    id: 'seed-013',
    username: 'RahulAstra',
    display_name: 'Rahul Joshi',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=cdb4db',
    banner_url: '/images/banners/gaming-3.svg',
    bio: '🌌 Astra galaxy brain | 5000 IQ smokes | MP Gaming Discord admin | Coaching available',
    gaming_style: 'competitive',
    preferred_language: 'hi',
    region: 'Indore, Madhya Pradesh',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '18:00', end: '00:00' },
      weekend: { start: '13:00', end: '01:00' },
    },
    social_links: {
      discord: 'RahulAstra#7890',
      twitch: 'rahulastramain',
      twitter: '@RahulAstraValo',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'RahulAstra#STAR',
        rank: 'Ascendant 1',
        role: 'Controller',
        agents: ['Astra', 'Omen', 'Harbor'],
        maps: ['Lotus', 'Pearl', 'Sunset'],
        hours: 2000,
        kd_ratio: 1.05,
        win_rate: 54,
        headshot_percentage: 22,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-08-20' },
      { ...availableBadges[8], earned_at: '2024-02-10' },
      { ...availableBadges[1], earned_at: '2023-04-01' },
    ],
    stats: {
      matches_played: 2300,
      wins: 1242,
      hours_played: 2000,
      teammates_met: 720,
    },
    ratings: {
      skill: 4.2,
      communication: 4.7,
      teamwork: 4.8,
      positivity: 4.6,
    },
  },

  // Profile 14 - CS2 Flex from Guwahati
  {
    id: 'seed-014',
    username: 'BiswajitFlex',
    display_name: 'Biswajit Bora',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Biswajit&backgroundColor=98f5e1',
    banner_url: '/images/banners/gaming-4.svg',
    bio: '🎭 Can play any role | Northeast India represent | Assam esports advocate | Grind never stops',
    gaming_style: 'competitive',
    preferred_language: 'as',
    region: 'Guwahati, Assam',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '17:00', end: '23:00' },
      weekend: { start: '12:00', end: '02:00' },
    },
    social_links: {
      discord: 'BiswajitFlex#3333',
      steam: 'biswajitflex',
      instagram: '@biswajit_cs2',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'BiswajitFlex',
        rank: 'Distinguished Master Guardian',
        role: 'Flex',
        hours: 2600,
        kd_ratio: 1.12,
        win_rate: 50,
        headshot_percentage: 44,
      },
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'BiswajitFlex#NE',
        rank: 'Gold 3',
        role: 'Sentinel',
        agents: ['Cypher', 'Killjoy'],
        hours: 400,
        kd_ratio: 1.08,
        win_rate: 49,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-11-05' },
      { ...availableBadges[7], earned_at: '2024-01-25' },
    ],
    stats: {
      matches_played: 3200,
      wins: 1600,
      hours_played: 3000,
      teammates_met: 1050,
    },
    ratings: {
      skill: 4.1,
      communication: 4.3,
      teamwork: 4.5,
      positivity: 4.4,
    },
  },

  // Profile 15 - Valorant Initiator from Vizag
  {
    id: 'seed-015',
    username: 'SrinivasFade',
    display_name: 'Srinivas Rao',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Srinivas&backgroundColor=ffddd2',
    banner_url: '/images/banners/gaming-5.svg',
    bio: '👁️ Fade haunt diff | Info gathering specialist | AP Gaming community | Vizag LAN regular',
    gaming_style: 'competitive',
    preferred_language: 'te',
    region: 'Vizag, Andhra Pradesh',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '20:00', end: '01:00' },
      weekend: { start: '16:00', end: '03:00' },
    },
    social_links: {
      discord: 'SrinivasFade#5050',
      youtube: '@SrinivasFadeValo',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'SrinivasFade#INFO',
        rank: 'Diamond 1',
        role: 'Initiator',
        agents: ['Fade', 'Gekko', 'KAY/O'],
        maps: ['Ascent', 'Haven', 'Icebox'],
        hours: 1700,
        kd_ratio: 1.10,
        win_rate: 53,
        headshot_percentage: 24,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-09-15' },
      { ...availableBadges[12], earned_at: '2024-02-05' },
    ],
    stats: {
      matches_played: 1900,
      wins: 1007,
      hours_played: 1700,
      teammates_met: 580,
    },
    ratings: {
      skill: 4.2,
      communication: 4.5,
      teamwork: 4.6,
      positivity: 4.4,
    },
  },

  // Profile 16 - CS2 AWPer from Coimbatore
  {
    id: 'seed-016',
    username: 'VigneshScope',
    display_name: 'Vignesh Kumar',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vignesh&backgroundColor=caffbf',
    banner_url: '/images/banners/gaming-1.svg',
    bio: '🎯 AWP flicks compilation maker | Coimbatore CS crew | Practicing 4 hours daily | Rising star',
    gaming_style: 'competitive',
    preferred_language: 'ta',
    region: 'Coimbatore, Tamil Nadu',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '18:00', end: '00:00' },
      weekend: { start: '14:00', end: '02:00' },
    },
    social_links: {
      discord: 'VigneshScope#6060',
      steam: 'vigneshscope',
      youtube: '@VigneshAWPClips',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'VigneshScope',
        rank: 'Master Guardian 2',
        role: 'AWPer',
        hours: 1800,
        kd_ratio: 1.20,
        win_rate: 50,
        headshot_percentage: 28,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-12-10' },
      { ...availableBadges[13], earned_at: '2024-03-01' },
    ],
    stats: {
      matches_played: 2200,
      wins: 1100,
      hours_played: 1800,
      teammates_met: 680,
    },
    ratings: {
      skill: 4.0,
      communication: 4.1,
      teamwork: 4.2,
      positivity: 4.3,
    },
  },

  // Profile 17 - Valorant Sentinel from Nagpur
  {
    id: 'seed-017',
    username: 'PratikCypher',
    display_name: 'Pratik Deshmukh',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pratik&backgroundColor=9bf6ff',
    banner_url: '/images/banners/gaming-2.svg',
    bio: '📷 Cypher cam angles nobody knows | Central India gaming | Setup enjoyer | 1v1 me bro',
    gaming_style: 'competitive',
    preferred_language: 'mr',
    region: 'Nagpur, Maharashtra',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '00:00' },
      weekend: { start: '15:00', end: '02:00' },
    },
    social_links: {
      discord: 'PratikCypher#7171',
      instagram: '@pratik.cypher',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'PratikCypher#CAM',
        rank: 'Platinum 2',
        role: 'Sentinel',
        agents: ['Cypher', 'Chamber', 'Killjoy'],
        maps: ['Split', 'Bind', 'Ascent'],
        hours: 1400,
        kd_ratio: 1.08,
        win_rate: 51,
        headshot_percentage: 23,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-10-20' },
      { ...availableBadges[6], earned_at: '2024-02-15' },
    ],
    stats: {
      matches_played: 1600,
      wins: 816,
      hours_played: 1400,
      teammates_met: 490,
    },
    ratings: {
      skill: 4.0,
      communication: 4.3,
      teamwork: 4.5,
      positivity: 4.4,
    },
  },

  // Profile 18 - CS2 Entry from Surat
  {
    id: 'seed-018',
    username: 'DeepakEntry',
    display_name: 'Deepak Shah',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak&backgroundColor=fdffb6',
    banner_url: '/images/banners/gaming-3.svg',
    bio: '🚀 First in last out | Gujarat esports scene | Entry diff machine | Team recruiter',
    gaming_style: 'competitive',
    preferred_language: 'gu',
    region: 'Surat, Gujarat',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '20:00', end: '02:00' },
      weekend: { start: '17:00', end: '04:00' },
    },
    social_links: {
      discord: 'DeepakEntry#8282',
      steam: 'deepakentryking',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'DeepakEntry',
        rank: 'Gold Nova Master',
        role: 'Entry Fragger',
        hours: 1500,
        kd_ratio: 1.15,
        win_rate: 48,
        headshot_percentage: 46,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2024-01-05' },
      { ...availableBadges[5], earned_at: '2024-03-10' },
    ],
    stats: {
      matches_played: 1800,
      wins: 864,
      hours_played: 1500,
      teammates_met: 520,
    },
    ratings: {
      skill: 3.9,
      communication: 4.2,
      teamwork: 4.0,
      positivity: 4.1,
    },
  },

  // Profile 19 - Valorant Duelist from Thiruvananthapuram
  {
    id: 'seed-019',
    username: 'ArunPhoenix',
    display_name: 'Arun Pillai',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArunP&backgroundColor=ffc6ff',
    banner_url: '/images/banners/gaming-4.svg',
    bio: '🔥 Phoenix ult timing god | Kerala valorant scene builder | Run it back mentality | Never tilt',
    gaming_style: 'competitive',
    preferred_language: 'ml',
    region: 'Thiruvananthapuram, Kerala',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '01:00' },
      weekend: { start: '16:00', end: '03:00' },
    },
    social_links: {
      discord: 'ArunPhoenix#9393',
      twitch: 'arunphoenixval',
      instagram: '@arun.phoenix.gaming',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'ArunPhoenix#FIRE',
        rank: 'Platinum 3',
        role: 'Duelist',
        agents: ['Phoenix', 'Yoru', 'Iso'],
        maps: ['Haven', 'Bind', 'Fracture'],
        hours: 1300,
        kd_ratio: 1.22,
        win_rate: 50,
        headshot_percentage: 26,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-11-20' },
      { ...availableBadges[7], earned_at: '2024-02-28' },
    ],
    stats: {
      matches_played: 1500,
      wins: 750,
      hours_played: 1300,
      teammates_met: 440,
    },
    ratings: {
      skill: 4.1,
      communication: 4.4,
      teamwork: 4.3,
      positivity: 4.8,
    },
  },

  // Profile 20 - CS2 Support from Bhubaneswar
  {
    id: 'seed-020',
    username: 'SumanFlash',
    display_name: 'Suman Mohapatra',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suman&backgroundColor=bdb2ff',
    banner_url: '/images/banners/gaming-5.svg',
    bio: '💡 Flash master | Odisha CS community founder | Utility for days | Team-first always',
    gaming_style: 'competitive',
    preferred_language: 'or',
    region: 'Bhubaneswar, Odisha',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '18:00', end: '23:00' },
      weekend: { start: '13:00', end: '01:00' },
    },
    social_links: {
      discord: 'SumanFlash#1010',
      steam: 'sumanflashking',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'SumanFlash',
        rank: 'Master Guardian 1',
        role: 'Support',
        hours: 2100,
        kd_ratio: 0.92,
        win_rate: 53,
        headshot_percentage: 36,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-08-25' },
      { ...availableBadges[4], earned_at: '2024-01-15' },
      { ...availableBadges[7], earned_at: '2024-03-05' },
    ],
    stats: {
      matches_played: 2600,
      wins: 1378,
      hours_played: 2100,
      teammates_met: 890,
    },
    ratings: {
      skill: 3.8,
      communication: 4.8,
      teamwork: 4.9,
      positivity: 4.7,
    },
  },

  // Profile 21 - Valorant Controller from Patna
  {
    id: 'seed-021',
    username: 'RajViper',
    display_name: 'Raj Kumar Singh',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajK&backgroundColor=a0d2db',
    banner_url: '/images/banners/gaming-1.svg',
    bio: '🐍 Viper lineups for every map | Bihar gaming ambassador | Post-plant specialist | Toxic only in-game',
    gaming_style: 'competitive',
    preferred_language: 'hi',
    region: 'Patna, Bihar',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '17:00', end: '00:00' },
      weekend: { start: '12:00', end: '02:00' },
    },
    social_links: {
      discord: 'RajViper#2121',
      youtube: '@RajViperLineups',
      instagram: '@raj.viper.val',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'RajViper#ACID',
        rank: 'Gold 2',
        role: 'Controller',
        agents: ['Viper', 'Brimstone', 'Clove'],
        maps: ['Breeze', 'Icebox', 'Pearl'],
        hours: 1100,
        kd_ratio: 1.02,
        win_rate: 50,
        headshot_percentage: 21,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2024-01-10' },
      { ...availableBadges[8], earned_at: '2024-03-15' },
    ],
    stats: {
      matches_played: 1300,
      wins: 650,
      hours_played: 1100,
      teammates_met: 380,
    },
    ratings: {
      skill: 3.8,
      communication: 4.5,
      teamwork: 4.6,
      positivity: 4.3,
    },
  },

  // Profile 22 - CS2 Lurker from Ranchi
  {
    id: 'seed-022',
    username: 'SantoshSilent',
    display_name: 'Santosh Oraon',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Santosh&backgroundColor=d4a373',
    banner_url: '/images/banners/gaming-2.svg',
    bio: '🤫 Silent killer | Jharkhand CS pioneer | Timing is everything | Clutch or nothing',
    gaming_style: 'competitive',
    preferred_language: 'hi',
    region: 'Ranchi, Jharkhand',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '01:00' },
      weekend: { start: '14:00', end: '03:00' },
    },
    social_links: {
      discord: 'SantoshSilent#3232',
      steam: 'santoshsilent',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'SantoshSilent',
        rank: 'Gold Nova 3',
        role: 'Lurker',
        hours: 1400,
        kd_ratio: 1.10,
        win_rate: 49,
        headshot_percentage: 40,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-12-05' },
      { ...availableBadges[6], earned_at: '2024-02-20' },
    ],
    stats: {
      matches_played: 1700,
      wins: 833,
      hours_played: 1400,
      teammates_met: 510,
    },
    ratings: {
      skill: 3.9,
      communication: 3.8,
      teamwork: 4.1,
      positivity: 4.0,
    },
  },

  // Profile 23 - Valorant Initiator from Dehradun
  {
    id: 'seed-023',
    username: 'YashSkye',
    display_name: 'Yash Rawat',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yash&backgroundColor=e9c46a',
    banner_url: '/images/banners/gaming-3.svg',
    bio: '🐕 Skye dog diff | Uttarakhand gaming community | Flash + dog combo master | Free coaching',
    gaming_style: 'competitive',
    preferred_language: 'hi',
    region: 'Dehradun, Uttarakhand',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '18:00', end: '00:00' },
      weekend: { start: '15:00', end: '02:00' },
    },
    social_links: {
      discord: 'YashSkye#4343',
      instagram: '@yash.skye.val',
      twitch: 'yashskyemain',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'YashSkye#WOOF',
        rank: 'Silver 3',
        role: 'Initiator',
        agents: ['Skye', 'Breach', 'KAY/O'],
        maps: ['Ascent', 'Haven', 'Split'],
        hours: 800,
        kd_ratio: 1.05,
        win_rate: 48,
        headshot_percentage: 22,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2024-02-01' },
      { ...availableBadges[8], earned_at: '2024-03-20' },
    ],
    stats: {
      matches_played: 950,
      wins: 456,
      hours_played: 800,
      teammates_met: 280,
    },
    ratings: {
      skill: 3.6,
      communication: 4.6,
      teamwork: 4.7,
      positivity: 4.8,
    },
  },

  // Profile 24 - CS2 Rifler from Goa
  {
    id: 'seed-024',
    username: 'NikhilGOA',
    display_name: 'Nikhil Naik',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil&backgroundColor=40916c',
    banner_url: '/images/banners/gaming-4.svg',
    bio: '🏖️ Chill vibes but tryhard gameplay | Goa gaming scene | Beach + CS2 life | LAN party host',
    gaming_style: 'competitive',
    preferred_language: 'en',
    region: 'Goa',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '21:00', end: '03:00' },
      weekend: { start: '18:00', end: '05:00' },
    },
    social_links: {
      discord: 'NikhilGOA#5454',
      steam: 'nikhilgoacs',
      instagram: '@nikhil.goa.gaming',
    },
    is_online: false,
    games: [
      {
        game: 'Counter-Strike 2',
        game_id: 'cs2',
        in_game_name: 'NikhilGOA',
        rank: 'Silver Elite Master',
        role: 'Rifler',
        secondary_role: 'Flex',
        hours: 1200,
        kd_ratio: 1.08,
        win_rate: 47,
        headshot_percentage: 38,
      },
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'NikhilGOA#BEACH',
        rank: 'Bronze 3',
        role: 'Duelist',
        agents: ['Reyna', 'Phoenix'],
        hours: 300,
        kd_ratio: 1.12,
        win_rate: 46,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-09-10' },
      { ...availableBadges[12], earned_at: '2024-01-20' },
    ],
    stats: {
      matches_played: 1600,
      wins: 752,
      hours_played: 1500,
      teammates_met: 480,
    },
    ratings: {
      skill: 3.7,
      communication: 4.5,
      teamwork: 4.4,
      positivity: 4.9,
    },
  },

  // Profile 25 - Valorant Duelist from Bhopal
  {
    id: 'seed-025',
    username: 'AnkitNeon',
    display_name: 'Ankit Sharma',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnkitS&backgroundColor=00b4d8',
    banner_url: '/images/banners/gaming-5.svg',
    bio: '⚡ Neon slide diff | MP Valorant founder | Speed is key | Aggressive plays only',
    gaming_style: 'competitive',
    preferred_language: 'hi',
    region: 'Bhopal, Madhya Pradesh',
    timezone: 'Asia/Kolkata',
    online_hours: {
      weekday: { start: '19:00', end: '01:00' },
      weekend: { start: '14:00', end: '03:00' },
    },
    social_links: {
      discord: 'AnkitNeon#6565',
      twitch: 'ankitneonval',
      youtube: '@AnkitNeonClips',
    },
    is_online: true,
    games: [
      {
        game: 'Valorant',
        game_id: 'valorant',
        in_game_name: 'AnkitNeon#ZOOM',
        rank: 'Gold 1',
        role: 'Duelist',
        agents: ['Neon', 'Jett', 'Raze'],
        maps: ['Split', 'Fracture', 'Sunset'],
        hours: 950,
        kd_ratio: 1.18,
        win_rate: 49,
        headshot_percentage: 25,
      },
    ],
    badges: [
      { ...availableBadges[0], earned_at: '2023-11-15' },
      { ...availableBadges[4], earned_at: '2024-02-10' },
      { ...availableBadges[13], earned_at: '2024-03-25' },
    ],
    stats: {
      matches_played: 1100,
      wins: 539,
      hours_played: 950,
      teammates_met: 340,
    },
    ratings: {
      skill: 3.9,
      communication: 4.3,
      teamwork: 4.1,
      positivity: 4.4,
    },
  },
];

// Helper function to get profiles by game
export const getProfilesByGame = (game: string): SeedProfile[] => {
  return seedProfiles.filter(profile =>
    profile.games.some(g => g.game.toLowerCase().includes(game.toLowerCase()))
  );
};

// Helper function to get profiles by region
export const getProfilesByRegion = (region: string): SeedProfile[] => {
  return seedProfiles.filter(profile =>
    profile.region.toLowerCase().includes(region.toLowerCase())
  );
};

// Helper function to get profiles by gaming style
export const getProfilesByStyle = (style: 'casual' | 'competitive' | 'pro'): SeedProfile[] => {
  return seedProfiles.filter(profile => profile.gaming_style === style);
};

// Helper function to get online profiles
export const getOnlineProfiles = (): SeedProfile[] => {
  return seedProfiles.filter(profile => profile.is_online);
};

// Export count for reference
export const TOTAL_SEED_PROFILES = seedProfiles.length;
