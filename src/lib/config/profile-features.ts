/**
 * Profile Customization Feature Flags
 *
 * Toggle any feature off to completely disable it across the app.
 * Each feature is modular — disabling one doesn't affect others.
 */
export const PROFILE_FEATURES = {
  colorThemes: true,
  profileEffects: true,
  animatedBackgrounds: true,
  musicWidget: true,
  widgetLayout: true,
  profileSkins: true,
  easterEggs: true,
  gamerWall: true,
  hoverCard: true,
  customCSS: false, // disabled by default — power user feature
} as const;

export type ProfileFeature = keyof typeof PROFILE_FEATURES;

export function isFeatureEnabled(feature: ProfileFeature): boolean {
  return PROFILE_FEATURES[feature] ?? false;
}
