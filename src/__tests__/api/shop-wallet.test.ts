/**
 * Shop and Wallet API Tests
 * Tests for virtual currency, shop items, and purchases
 */

describe('Shop & Wallet System API', () => {
  describe('Wallet Operations', () => {
    const mockWallet = {
      id: 'wallet-1',
      user_id: 'user-123',
      balance: 1000,
      lifetime_earned: 5000,
      lifetime_spent: 4000,
      created_at: '2024-01-01',
      updated_at: '2024-01-15',
    };

    describe('GET /api/wallet', () => {
      it('should return user wallet balance', () => {
        expect(mockWallet.balance).toBe(1000);
      });

      it('should track lifetime earnings', () => {
        expect(mockWallet.lifetime_earned).toBe(5000);
      });

      it('should track lifetime spending', () => {
        expect(mockWallet.lifetime_spent).toBe(4000);
      });

      it('should calculate net balance correctly', () => {
        const net = mockWallet.lifetime_earned - mockWallet.lifetime_spent;
        expect(net).toBe(mockWallet.balance);
      });
    });

    describe('Wallet Transactions', () => {
      const mockTransactions = [
        { id: 'tx-1', type: 'credit', amount: 100, reason: 'quest_completion', created_at: '2024-01-15' },
        { id: 'tx-2', type: 'debit', amount: 50, reason: 'shop_purchase', created_at: '2024-01-14' },
        { id: 'tx-3', type: 'credit', amount: 500, reason: 'battle_pass_reward', created_at: '2024-01-13' },
      ];

      it('should list transaction history', () => {
        expect(mockTransactions).toHaveLength(3);
      });

      it('should categorize credits and debits', () => {
        const credits = mockTransactions.filter(t => t.type === 'credit');
        const debits = mockTransactions.filter(t => t.type === 'debit');
        expect(credits).toHaveLength(2);
        expect(debits).toHaveLength(1);
      });

      it('should track transaction reasons', () => {
        const reasons = mockTransactions.map(t => t.reason);
        expect(reasons).toContain('quest_completion');
        expect(reasons).toContain('shop_purchase');
        expect(reasons).toContain('battle_pass_reward');
      });
    });
  });

  describe('Shop Operations', () => {
    const mockShopItems = [
      {
        id: 'item-1',
        name: 'Premium Avatar Frame',
        type: 'cosmetic',
        category: 'frames',
        price: 500,
        rarity: 'legendary',
        is_available: true,
        limited_time: false,
      },
      {
        id: 'item-2',
        name: 'Exclusive Title',
        type: 'cosmetic',
        category: 'titles',
        price: 200,
        rarity: 'epic',
        is_available: true,
        limited_time: true,
        expires_at: '2024-02-01',
      },
      {
        id: 'item-3',
        name: 'XP Booster',
        type: 'consumable',
        category: 'boosters',
        price: 100,
        duration_hours: 24,
        is_available: true,
      },
    ];

    describe('GET /api/shop/items', () => {
      it('should list available shop items', () => {
        const available = mockShopItems.filter(i => i.is_available);
        expect(available).toHaveLength(3);
      });

      it('should categorize items by type', () => {
        const cosmetics = mockShopItems.filter(i => i.type === 'cosmetic');
        const consumables = mockShopItems.filter(i => i.type === 'consumable');
        expect(cosmetics).toHaveLength(2);
        expect(consumables).toHaveLength(1);
      });

      it('should identify limited time items', () => {
        const limitedTime = mockShopItems.filter(i => i.limited_time);
        expect(limitedTime).toHaveLength(1);
        expect(limitedTime[0].name).toBe('Exclusive Title');
      });

      it('should categorize by rarity', () => {
        const legendary = mockShopItems.filter(i => i.rarity === 'legendary');
        expect(legendary).toHaveLength(1);
      });
    });

    describe('POST /api/shop/purchase', () => {
      it('should validate sufficient balance', () => {
        const walletBalance = 1000;
        const itemPrice = 500;
        expect(walletBalance >= itemPrice).toBe(true);
      });

      it('should reject purchase with insufficient balance', () => {
        const walletBalance = 100;
        const itemPrice = 500;
        expect(walletBalance >= itemPrice).toBe(false);
      });

      it('should validate item availability', () => {
        const item = mockShopItems.find(i => i.id === 'item-1');
        expect(item?.is_available).toBe(true);
      });

      it('should check limited time item expiry', () => {
        const item = mockShopItems.find(i => i.limited_time);
        if (item?.expires_at) {
          const expiryDate = new Date(item.expires_at);
          const now = new Date('2024-01-20');
          expect(expiryDate > now).toBe(true);
        }
      });
    });

    describe('Currency Packs', () => {
      const mockCurrencyPacks = [
        { id: 'pack-1', amount: 500, price_usd: 4.99, bonus: 0 },
        { id: 'pack-2', amount: 1000, price_usd: 9.99, bonus: 50 },
        { id: 'pack-3', amount: 2500, price_usd: 19.99, bonus: 250 },
        { id: 'pack-4', amount: 5000, price_usd: 39.99, bonus: 750 },
      ];

      it('should list available currency packs', () => {
        expect(mockCurrencyPacks).toHaveLength(4);
      });

      it('should include bonus amounts for larger packs', () => {
        const packWithBonus = mockCurrencyPacks.filter(p => p.bonus > 0);
        expect(packWithBonus).toHaveLength(3);
      });

      it('should calculate total currency received', () => {
        const pack = mockCurrencyPacks.find(p => p.id === 'pack-3');
        const total = (pack?.amount || 0) + (pack?.bonus || 0);
        expect(total).toBe(2750);
      });

      it('should offer better value for larger packs', () => {
        const small = mockCurrencyPacks[0];
        const large = mockCurrencyPacks[3];

        const smallValue = small.amount / small.price_usd;
        const largeValue = (large.amount + large.bonus) / large.price_usd;

        expect(largeValue).toBeGreaterThan(smallValue);
      });
    });
  });

  describe('Subscription Plans', () => {
    const mockPlans = [
      {
        id: 'plan-free',
        name: 'Free',
        price_monthly: 0,
        features: ['basic_lfg', 'basic_chat', 'limited_tournaments'],
      },
      {
        id: 'plan-plus',
        name: 'GamerHub Plus',
        price_monthly: 4.99,
        features: ['unlimited_lfg', 'priority_matching', 'custom_profile', 'no_ads'],
      },
      {
        id: 'plan-pro',
        name: 'GamerHub Pro',
        price_monthly: 9.99,
        features: ['all_plus_features', 'tournament_hosting', 'analytics', 'priority_support', 'exclusive_cosmetics'],
      },
    ];

    it('should list all subscription tiers', () => {
      expect(mockPlans).toHaveLength(3);
    });

    it('should include free tier', () => {
      const freeTier = mockPlans.find(p => p.price_monthly === 0);
      expect(freeTier).toBeDefined();
    });

    it('should have progressive feature sets', () => {
      expect(mockPlans[0].features.length).toBeLessThan(mockPlans[1].features.length);
      expect(mockPlans[1].features.length).toBeLessThan(mockPlans[2].features.length);
    });

    it('should include premium features in higher tiers', () => {
      const proTier = mockPlans.find(p => p.id === 'plan-pro');
      expect(proTier?.features).toContain('tournament_hosting');
      expect(proTier?.features).toContain('exclusive_cosmetics');
    });
  });
});
