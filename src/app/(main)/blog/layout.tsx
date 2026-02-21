"use client";

import { PremiumFeatureGate } from "@/components/premium/PremiumFeatureGate";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PremiumFeatureGate featureName="Blog">
      {children}
    </PremiumFeatureGate>
  );
}
