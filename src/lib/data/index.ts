// Data exports for seed data and mock profiles
export * from './seed-profiles';

// Re-export commonly used items
export {
  seedProfiles,
  getProfilesByGame,
  getProfilesByRegion,
  getProfilesByStyle,
  getOnlineProfiles,
  TOTAL_SEED_PROFILES,
} from './seed-profiles';

// Type re-exports
export type {
  SeedProfile,
  SeedGameProfile,
  SeedBadge,
} from './seed-profiles';
