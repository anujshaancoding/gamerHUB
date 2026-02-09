"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Gem, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  price_coins: number | null;
  price_gems: number | null;
  original_price_coins: number | null;
  original_price_gems: number | null;
  icon_url: string | null;
  rarity: string;
  is_limited: boolean;
  available_until: string | null;
}

interface ItemCardProps {
  item: ShopItem;
  userCoins: number;
  userGems: number;
  onPurchase: (itemId: string, currencyType: "coins" | "gems") => void;
  isPurchasing?: boolean;
  owned?: boolean;
}

const rarityColors: Record<string, string> = {
  common: "border-zinc-500 bg-zinc-500/10",
  uncommon: "border-green-500 bg-green-500/10",
  rare: "border-blue-500 bg-blue-500/10",
  epic: "border-purple-500 bg-purple-500/10",
  legendary: "border-yellow-500 bg-yellow-500/10",
};

const rarityBadgeColors: Record<string, string> = {
  common: "bg-zinc-500/20 text-zinc-300",
  uncommon: "bg-green-500/20 text-green-300",
  rare: "bg-blue-500/20 text-blue-300",
  epic: "bg-purple-500/20 text-purple-300",
  legendary: "bg-yellow-500/20 text-yellow-300",
};

export function ItemCard({
  item,
  userCoins,
  userGems,
  onPurchase,
  isPurchasing,
  owned,
}: ItemCardProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<"coins" | "gems">(
    item.price_gems ? "gems" : "coins"
  );

  const price = selectedCurrency === "coins" ? item.price_coins : item.price_gems;
  const originalPrice =
    selectedCurrency === "coins"
      ? item.original_price_coins
      : item.original_price_gems;
  const isOnSale = originalPrice && originalPrice > (price || 0);
  const discount = isOnSale
    ? Math.round(((originalPrice - (price || 0)) / originalPrice) * 100)
    : 0;

  const canAfford =
    selectedCurrency === "coins"
      ? userCoins >= (price || 0)
      : userGems >= (price || 0);

  const isExpiringSoon =
    item.is_limited &&
    item.available_until &&
    new Date(item.available_until).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all hover:scale-[1.02]",
        rarityColors[item.rarity] || rarityColors.common,
        owned && "opacity-60"
      )}
    >
      {/* Sale badge */}
      {isOnSale && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
          -{discount}%
        </div>
      )}

      {/* Limited time indicator */}
      {item.is_limited && item.available_until && (
        <div
          className={cn(
            "absolute top-2 left-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded",
            isExpiringSoon
              ? "bg-red-500/20 text-red-300"
              : "bg-orange-500/20 text-orange-300"
          )}
        >
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(item.available_until), { addSuffix: true })}
        </div>
      )}

      <div className="p-4">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-3 bg-zinc-800/50 rounded-lg flex items-center justify-center">
          {item.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.icon_url}
              alt={item.name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <Sparkles className="w-8 h-8 text-zinc-500" />
          )}
        </div>

        {/* Info */}
        <div className="text-center mb-3">
          <Badge className={rarityBadgeColors[item.rarity]} variant="outline">
            {item.rarity}
          </Badge>
          <h3 className="font-semibold text-white mt-2 line-clamp-1">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Price toggle */}
        {item.price_coins && item.price_gems && (
          <div className="flex justify-center gap-2 mb-3">
            <button
              onClick={() => setSelectedCurrency("coins")}
              className={cn(
                "px-2 py-1 rounded text-xs transition-colors",
                selectedCurrency === "coins"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Coins className="h-3 w-3 inline mr-1" />
              Coins
            </button>
            <button
              onClick={() => setSelectedCurrency("gems")}
              className={cn(
                "px-2 py-1 rounded text-xs transition-colors",
                selectedCurrency === "gems"
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Gem className="h-3 w-3 inline mr-1" />
              Gems
            </button>
          </div>
        )}

        {/* Price display */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {isOnSale && (
            <span className="text-zinc-500 line-through text-sm">
              {originalPrice?.toLocaleString()}
            </span>
          )}
          <div
            className={cn(
              "flex items-center gap-1 font-bold",
              selectedCurrency === "coins" ? "text-yellow-400" : "text-purple-400"
            )}
          >
            {selectedCurrency === "coins" ? (
              <Coins className="h-4 w-4" />
            ) : (
              <Gem className="h-4 w-4" />
            )}
            {price?.toLocaleString()}
          </div>
        </div>

        {/* Purchase button */}
        {owned ? (
          <Button disabled className="w-full" variant="outline">
            Owned
          </Button>
        ) : (
          <Button
            onClick={() => onPurchase(item.id, selectedCurrency)}
            disabled={!canAfford || isPurchasing}
            className={cn(
              "w-full",
              canAfford
                ? selectedCurrency === "coins"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-purple-600 hover:bg-purple-700"
                : ""
            )}
            variant={canAfford ? "default" : "outline"}
          >
            {isPurchasing ? "Purchasing..." : canAfford ? "Purchase" : "Not enough"}
          </Button>
        )}
      </div>
    </Card>
  );
}
