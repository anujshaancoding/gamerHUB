"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gem, Sparkles } from "lucide-react";
import { formatAmount } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface CurrencyPack {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  bonus_amount: number;
  price_cents: number;
  is_featured: boolean;
}

interface CurrencyPackCardProps {
  pack: CurrencyPack;
  onPurchase: (packId: string) => void;
  isPurchasing?: boolean;
}

export function CurrencyPackCard({
  pack,
  onPurchase,
  isPurchasing,
}: CurrencyPackCardProps) {
  const totalAmount = pack.amount + pack.bonus_amount;
  const hasBonus = pack.bonus_amount > 0;
  const bonusPercent = hasBonus
    ? Math.round((pack.bonus_amount / pack.amount) * 100)
    : 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all hover:scale-[1.02]",
        pack.is_featured
          ? "border-purple-500 bg-purple-500/10"
          : "border-zinc-700 bg-zinc-800/50"
      )}
    >
      {pack.is_featured && (
        <div className="absolute top-0 left-0 right-0 bg-purple-500 text-white text-center text-xs font-bold py-1">
          BEST VALUE
        </div>
      )}

      {hasBonus && (
        <Badge
          className={cn(
            "absolute top-2 right-2",
            pack.is_featured ? "mt-6" : "",
            "bg-green-500/20 text-green-300 border-green-500/50"
          )}
        >
          +{bonusPercent}% Bonus
        </Badge>
      )}

      <div className={cn("p-6", pack.is_featured && "pt-10")}>
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
          <Gem className="w-10 h-10 text-purple-400" />
        </div>

        {/* Amount */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-white">
              {totalAmount.toLocaleString()}
            </span>
            <Gem className="h-6 w-6 text-purple-400" />
          </div>

          {hasBonus && (
            <div className="flex items-center justify-center gap-1 mt-1 text-sm">
              <span className="text-zinc-500">
                {pack.amount.toLocaleString()}
              </span>
              <span className="text-green-400">
                +{pack.bonus_amount.toLocaleString()} bonus
              </span>
            </div>
          )}

          <h3 className="font-medium text-zinc-300 mt-2">{pack.name}</h3>
        </div>

        {/* Price */}
        <div className="text-center mb-4">
          <span className="text-2xl font-bold text-white">
            {formatAmount(pack.price_cents)}
          </span>
        </div>

        {/* Purchase button */}
        <Button
          onClick={() => onPurchase(pack.id)}
          disabled={isPurchasing}
          className={cn(
            "w-full",
            pack.is_featured
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-zinc-700 hover:bg-zinc-600"
          )}
        >
          {isPurchasing ? (
            "Processing..."
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Buy Now
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
