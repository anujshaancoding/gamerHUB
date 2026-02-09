"use client";

import { useState } from "react";
import { useBattlePass } from "@/lib/hooks/useBattlePass";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sword, Sparkles, X } from "lucide-react";
import { formatAmount } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseModal({ isOpen, onClose }: PurchaseModalProps) {
  const { battlePass, purchase, isPurchasing } = useBattlePass();
  const [selectedTier, setSelectedTier] = useState<"standard" | "premium">(
    "standard"
  );

  if (!isOpen || !battlePass) return null;

  const handlePurchase = () => {
    purchase(selectedTier);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-2xl bg-zinc-900 border-zinc-800 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-orange-500/20 rounded-full mb-4">
            <Sword className="h-8 w-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{battlePass.name}</h2>
          <p className="text-zinc-400 mt-1">Choose your Battle Pass tier</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Standard */}
          <div
            onClick={() => setSelectedTier("standard")}
            className={cn(
              "p-4 rounded-xl border-2 cursor-pointer transition-all",
              selectedTier === "standard"
                ? "border-orange-500 bg-orange-500/10"
                : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-white">Standard</h3>
              <span className="text-xl font-bold text-white">
                {formatAmount(battlePass.price_standard)}
              </span>
            </div>

            <ul className="space-y-2">
              {[
                "Unlock all premium rewards",
                "Exclusive cosmetics",
                "Premium badge",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Bundle */}
          {battlePass.price_premium && (
            <div
              onClick={() => setSelectedTier("premium")}
              className={cn(
                "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                selectedTier === "premium"
                  ? "border-yellow-500 bg-yellow-500/10"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
              )}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold">
                BEST VALUE
              </div>

              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-white flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  Premium Bundle
                </h3>
                <span className="text-xl font-bold text-white">
                  {formatAmount(battlePass.price_premium)}
                </span>
              </div>

              <ul className="space-y-2">
                {[
                  "Everything in Standard",
                  "+25 Level Skips",
                  "Exclusive animated frame",
                  "Bonus 500 coins",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-yellow-400" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg"
        >
          {isPurchasing ? "Processing..." : "Purchase Battle Pass"}
        </Button>

        <p className="text-center text-xs text-zinc-500 mt-4">
          Secure checkout powered by Stripe. You can cancel anytime.
        </p>
      </Card>
    </div>
  );
}
