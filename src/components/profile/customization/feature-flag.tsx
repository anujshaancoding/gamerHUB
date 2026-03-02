"use client";

import { isFeatureEnabled, type ProfileFeature } from "@/lib/config/profile-features";

interface FeatureFlagProps {
  name: ProfileFeature;
  children: React.ReactNode;
  /** Optional fallback when feature is disabled */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on feature flag.
 * If the feature is disabled, renders nothing (or optional fallback).
 */
export function FeatureFlag({ name, children, fallback = null }: FeatureFlagProps) {
  if (!isFeatureEnabled(name)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
