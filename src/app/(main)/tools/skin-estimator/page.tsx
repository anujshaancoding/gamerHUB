import type { Metadata } from "next";
import { SkinEstimator } from "@/components/gaming/tools/skin-estimator";

export const metadata: Metadata = {
  title: "Valorant Skin Spend Estimator — How much have you spent?",
  description:
    "Count your Valorant skins by tier and see the rough VP / INR / USD total. Quick estimator using current Indian pack pricing.",
  alternates: { canonical: "/tools/skin-estimator" },
};

export default function SkinEstimatorPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-text">Valorant skin spend estimator</h1>
        <p className="text-text-muted mt-2 leading-relaxed">
          Count your skins by tier — Select / Deluxe / Premium / Exclusive / Ultra — and
          this will spit out the rough VP, ₹ and $ total. Knives use the knife column.
        </p>
      </header>

      <SkinEstimator />

      <p className="text-xs text-text-muted">
        Estimates use the base-level VP cost. Variants (chromas / finishers / VFX) add
        ~10–40 % per skin but aren&apos;t included — these are usually bought via Radianite,
        not direct VP. Pack rates are based on the 2,800 VP pack (best $/VP).
      </p>
    </div>
  );
}
