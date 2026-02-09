import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { ShopItem, UserWallet, WalletTransaction, CurrencyPack } from '../types/shop';

async function fetchShopItems(): Promise<ShopItem[]> {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .or('available_until.is.null,available_until.gt.now()')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ShopItem[];
}

async function fetchFeaturedItems(): Promise<ShopItem[]> {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_featured', true)
    .or('available_until.is.null,available_until.gt.now()')
    .limit(6);

  if (error) throw error;
  return (data || []) as ShopItem[];
}

async function fetchWallet(userId: string): Promise<UserWallet | null> {
  const { data, error } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as UserWallet;
}

async function fetchTransactions(userId: string, limit = 20): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as WalletTransaction[];
}

async function fetchCurrencyPacks(): Promise<CurrencyPack[]> {
  const { data, error } = await supabase
    .from('currency_packs')
    .select('*')
    .order('price_usd', { ascending: true });

  if (error) throw error;
  return (data || []) as CurrencyPack[];
}

export function useShop() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['shop-items'],
    queryFn: fetchShopItems,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const featuredQuery = useQuery({
    queryKey: ['featured-items'],
    queryFn: fetchFeaturedItems,
    staleTime: 1000 * 60 * 5,
  });

  const currencyPacksQuery = useQuery({
    queryKey: ['currency-packs'],
    queryFn: fetchCurrencyPacks,
    staleTime: 1000 * 60 * 30,
  });

  const purchaseItemMutation = useMutation({
    mutationFn: async ({ itemId, currency }: { itemId: string; currency: 'coins' | 'gems' }) => {
      if (!user) throw new Error('Not authenticated');

      // Get item details
      const { data: item, error: itemError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      const price = currency === 'coins' ? item.price_coins : item.price_gems;
      if (!price) throw new Error('Item cannot be purchased with this currency');

      // Check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      const balance = currency === 'coins' ? wallet.coins : wallet.gems;
      if (balance < price) throw new Error('Insufficient balance');

      // Deduct from wallet
      const newBalance = balance - price;
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ [currency]: newBalance })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'spend',
        currency,
        amount: -price,
        balance_after: newBalance,
        description: `Purchased ${item.name}`,
        reference_type: 'shop_item',
        reference_id: itemId,
      });

      // Record purchase
      await supabase.from('user_purchases').insert({
        user_id: user.id,
        item_id: itemId,
        quantity: 1,
        price_paid: price,
        currency_used: currency,
      });

      // Update sold count
      await supabase
        .from('shop_items')
        .update({ sold_count: item.sold_count + 1 })
        .eq('id', itemId);

      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['shop-items'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    items: itemsQuery.data ?? [],
    featuredItems: featuredQuery.data ?? [],
    currencyPacks: currencyPacksQuery.data ?? [],
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error?.message || null,
    refetch: itemsQuery.refetch,
    purchaseItem: purchaseItemMutation.mutateAsync,
    isPurchasing: purchaseItemMutation.isPending,
  };
}

export function useWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: () => fetchWallet(user!.id),
    enabled: !!user,
    staleTime: 1000 * 30,
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => fetchTransactions(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const addFundsMutation = useMutation({
    mutationFn: async ({ currency, amount }: { currency: 'coins' | 'gems'; amount: number }) => {
      if (!user) throw new Error('Not authenticated');

      const wallet = walletQuery.data;
      if (!wallet) throw new Error('Wallet not found');

      const newBalance = (currency === 'coins' ? wallet.coins : wallet.gems) + amount;

      const { error } = await supabase
        .from('user_wallets')
        .update({ [currency]: newBalance })
        .eq('user_id', user.id);

      if (error) throw error;

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'purchase',
        currency,
        amount,
        balance_after: newBalance,
        description: `Purchased ${amount} ${currency}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    wallet: walletQuery.data,
    transactions: transactionsQuery.data ?? [],
    coins: walletQuery.data?.coins || 0,
    gems: walletQuery.data?.gems || 0,
    isLoading: walletQuery.isLoading,
    error: walletQuery.error?.message || null,
    refetch: walletQuery.refetch,
    addFunds: addFundsMutation.mutateAsync,
  };
}
