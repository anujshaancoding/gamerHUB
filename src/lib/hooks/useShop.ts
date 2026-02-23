"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  item_reference_id: string | null;
  price_coins: number | null;
  price_gems: number | null;
  original_price_coins: number | null;
  original_price_gems: number | null;
  icon_url: string | null;
  preview_url: string | null;
  rarity: string;
  is_limited: boolean;
  available_until: string | null;
  max_purchases: number | null;
  current_purchases: number;
  category: string | null;
  tags: string[];
}

interface ShopItemsResponse {
  items: ShopItem[];
  total: number;
  categories: string[];
}

// Fetch shop items
async function fetchShopItems(params: {
  category?: string;
  type?: string;
  rarity?: string;
  limit?: number;
  offset?: number;
}): Promise<ShopItemsResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.type) searchParams.set("type", params.type);
  if (params.rarity) searchParams.set("rarity", params.rarity);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const res = await fetch(`/api/shop/items?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch shop items");
  return res.json();
}

// Purchase item
async function purchaseItem(params: {
  itemId: string;
  currencyType: "coins" | "gems";
}): Promise<{
  success: boolean;
  purchase: {
    itemName: string;
    itemType: string;
    amountPaid: number;
    currencyType: string;
  };
}> {
  const res = await fetch("/api/shop/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to purchase item");
  }

  return res.json();
}

export function useShop(params: {
  category?: string;
  type?: string;
  rarity?: string;
} = {}) {
  const queryClient = useQueryClient();

  // Query for shop items
  const itemsQuery = useQuery({
    queryKey: queryKeys.shopItems(params),
    queryFn: () => fetchShopItems(params),
    staleTime: 1000 * 60, // 1 minute
  });

  // Mutation for purchasing
  const purchaseMutation = useMutation({
    mutationFn: purchaseItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      queryClient.invalidateQueries({ queryKey: queryKeys.shopItems() });
    },
  });

  return {
    // Data
    items: itemsQuery.data?.items || [],
    total: itemsQuery.data?.total || 0,
    categories: itemsQuery.data?.categories || [],

    // Loading states
    isLoading: itemsQuery.isLoading,

    // Actions
    purchase: purchaseMutation.mutate,

    // Mutation states
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error?.message,

    // Refetch
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shopItems() });
    },
  };
}
