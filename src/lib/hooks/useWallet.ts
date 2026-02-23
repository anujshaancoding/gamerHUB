"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";

interface Wallet {
  coins: number;
  gems: number;
  lifetime_coins_earned: number;
  lifetime_gems_purchased: number;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  currency_type: "coins" | "gems";
  amount: number;
  balance_after: number;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

interface CurrencyPack {
  id: string;
  name: string;
  description: string | null;
  currency_type: string;
  amount: number;
  bonus_amount: number;
  price_cents: number;
  icon_url: string | null;
  is_featured: boolean;
}

// Fetch wallet
async function fetchWallet(): Promise<Wallet> {
  const res = await fetch("/api/wallet");
  if (!res.ok) throw new Error("Failed to fetch wallet");
  const data = await res.json();
  return data.wallet;
}

// Fetch transactions
async function fetchTransactions(params: {
  limit?: number;
  offset?: number;
  currency?: string;
}): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());
  if (params.currency) searchParams.set("currency", params.currency);

  const res = await fetch(`/api/wallet/transactions?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

// Fetch currency packs
async function fetchCurrencyPacks(): Promise<CurrencyPack[]> {
  const res = await fetch("/api/shop/currency-packs");
  if (!res.ok) throw new Error("Failed to fetch currency packs");
  const data = await res.json();
  return data.packs;
}

// Buy currency
async function buyCurrency(packId: string): Promise<{ url: string }> {
  const res = await fetch("/api/shop/buy-currency", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packId }),
  });
  if (!res.ok) throw new Error("Failed to purchase currency");
  return res.json();
}

export function useWallet() {
  const queryClient = useQueryClient();

  // Query for wallet
  const walletQuery = useQuery({
    queryKey: queryKeys.wallet,
    queryFn: fetchWallet,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Query for currency packs
  const packsQuery = useQuery({
    queryKey: queryKeys.currencyPacks,
    queryFn: fetchCurrencyPacks,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Mutation for buying currency
  const buyCurrencyMutation = useMutation({
    mutationFn: buyCurrency,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  return {
    // Wallet data
    wallet: walletQuery.data || { coins: 0, gems: 0, lifetime_coins_earned: 0, lifetime_gems_purchased: 0 },
    coins: walletQuery.data?.coins || 0,
    gems: walletQuery.data?.gems || 0,

    // Currency packs
    currencyPacks: packsQuery.data || [],

    // Loading states
    isLoadingWallet: walletQuery.isLoading,
    isLoadingPacks: packsQuery.isLoading,

    // Actions
    buyCurrency: buyCurrencyMutation.mutate,

    // Mutation states
    isBuyingCurrency: buyCurrencyMutation.isPending,

    // Refetch
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
    },
  };
}

export function useWalletTransactions(params: {
  limit?: number;
  currency?: string;
} = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.walletTransactions(params),
    queryFn: () => fetchTransactions(params),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
}
