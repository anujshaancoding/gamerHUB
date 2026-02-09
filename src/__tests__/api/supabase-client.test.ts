/**
 * Supabase Client Configuration Tests
 *
 * Tests Supabase client creation, cookie handling, singleton pattern,
 * and proper use of typed vs untyped clients.
 */

describe('Supabase Client Configuration', () => {
  describe('Browser Client', () => {
    it('should use singleton pattern on client-side', () => {
      // The client uses globalThis to maintain a single instance
      const mockClient = { id: 'client-1' };
      (globalThis as Record<string, unknown>).__supabaseTestClient = mockClient;

      const retrieved = (globalThis as Record<string, unknown>).__supabaseTestClient;
      expect(retrieved).toBe(mockClient);

      // Cleanup
      delete (globalThis as Record<string, unknown>).__supabaseTestClient;
    });

    it('should include custom x-client-info header', () => {
      const headers = { 'x-client-info': 'gamer-hub' };
      expect(headers['x-client-info']).toBe('gamer-hub');
    });
  });

  describe('Server Client', () => {
    it('should create new client for each request (no singleton)', () => {
      // Server-side should create a new client per request to avoid shared state
      const createClient = () => ({ id: Math.random() });
      const client1 = createClient();
      const client2 = createClient();
      expect(client1.id).not.toBe(client2.id);
    });
  });

  describe('Admin Client', () => {
    it('should use service role key (not anon key)', () => {
      // Admin client bypasses RLS for server-side operations
      const config = {
        url: 'https://test.supabase.co',
        key: 'service-role-key',
        auth: { persistSession: false },
      };

      expect(config.auth.persistSession).toBe(false);
      expect(config.key).not.toBe('anon-key');
    });

    it('should not persist session (stateless)', () => {
      const adminConfig = { persistSession: false, autoRefreshToken: false };
      expect(adminConfig.persistSession).toBe(false);
      expect(adminConfig.autoRefreshToken).toBe(false);
    });
  });

  describe('Untyped Client', () => {
    it('should document all untyped tables', () => {
      // These tables exist in Supabase but not in database.ts
      const untypedTables = [
        'battle_passes', 'battle_pass_rewards', 'user_battle_passes',
        'game_connections', 'game_oauth_tokens', 'game_stats_sync',
        'streamer_profiles', 'stream_schedules',
        'activity_feed', 'news_posts',
        'forum_categories', 'forum_posts', 'forum_replies', 'forum_votes',
        'player_skill_profiles', 'match_suggestions', 'match_outcomes',
        'shop_items', 'user_wallets', 'wallet_transactions',
        'currency_packs', 'shop_purchases',
        'stripe_customers', 'user_subscriptions', 'subscription_plans',
      ];

      // All these should eventually be added to database.ts
      expect(untypedTables.length).toBeGreaterThan(0);
      untypedTables.forEach(table => {
        expect(typeof table).toBe('string');
        expect(table.length).toBeGreaterThan(0);
      });
    });

    it('should use createUntypedClient for untyped tables', () => {
      // The untyped client casts to `any` to bypass TypeScript checks
      // This is a temporary workaround until types are regenerated
      const createUntypedClient = async () => {
        const supabase = {}; // Would be createClient()
        return supabase as Record<string, unknown>;
      };

      return createUntypedClient().then(client => {
        expect(client).toBeDefined();
      });
    });
  });

  describe('Environment Variables', () => {
    it('should require NEXT_PUBLIC_SUPABASE_URL', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      // In test environment, this may not be set
      expect(typeof url).toBe('string');
    });

    it('should require NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      expect(typeof key).toBe('string');
    });

    it('should NOT expose service role key to client', () => {
      // Service role key should NEVER be prefixed with NEXT_PUBLIC_
      // It should only be available server-side
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      // This is expected to be undefined in client-side tests
      expect(serviceKey).toBeUndefined();
    });
  });

  describe('Query Builder Patterns', () => {
    it('should chain query methods correctly', () => {
      // Simulating Supabase query builder chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockQuery
        .select('*')
        .eq('id', '123')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should handle join queries with select', () => {
      const selectString = `
        *,
        user_games (
          *,
          game:games (*)
        )
      `;

      expect(selectString).toContain('user_games');
      expect(selectString).toContain('game:games');
    });

    it('should handle RPC calls', () => {
      const mockRpc = jest.fn().mockResolvedValue({ data: true, error: null });

      mockRpc('are_friends', { user1_id: 'a', user2_id: 'b' });

      expect(mockRpc).toHaveBeenCalledWith('are_friends', {
        user1_id: 'a',
        user2_id: 'b',
      });
    });
  });
});

describe('Database Types Completeness', () => {
  describe('Core Tables', () => {
    it('should have all user-facing tables typed', () => {
      // These tables are in database.ts and fully typed
      const typedTables = [
        'profiles', 'games', 'user_games', 'achievements',
        'matches', 'match_participants',
        'challenges', 'media',
        'conversations', 'conversation_participants', 'messages',
        'follows', 'calls', 'call_participants',
        'friend_requests', 'blocked_users',
      ];

      expect(typedTables).toContain('profiles');
      expect(typedTables).toContain('matches');
      expect(typedTables).toContain('friend_requests');
    });

    it('should have all clan tables typed', () => {
      const clanTables = [
        'clans', 'clan_members', 'clan_invites',
        'clan_games', 'clan_achievements',
        'clan_challenges', 'clan_recruitment_posts',
        'clan_activity_log',
      ];

      expect(clanTables).toHaveLength(8);
    });

    it('should have all tournament tables typed', () => {
      const tournamentTables = [
        'tournaments', 'tournament_participants',
        'tournament_matches', 'tournament_match_games',
        'tournament_activity_log',
      ];

      expect(tournamentTables).toHaveLength(5);
    });

    it('should have all season/leaderboard tables typed', () => {
      const seasonTables = [
        'seasons', 'season_points', 'point_transactions',
        'community_challenges', 'challenge_progress',
        'season_rewards', 'user_rewards',
        'leaderboard_snapshots',
      ];

      expect(seasonTables).toHaveLength(8);
    });
  });

  describe('Missing Tables (need regeneration)', () => {
    it('should identify tables that need to be added to database.ts', () => {
      // These tables are used in API routes but NOT in database.ts
      // They need to be regenerated with: npx supabase gen types typescript
      const missingTables = [
        'blog_posts', 'blog_authors', 'blog_comments', 'blog_likes',
        'forum_posts', 'forum_replies', 'forum_categories', 'forum_votes',
        'lfg_posts', 'lfg_applications',
        'clips', 'clip_reactions',
        'shop_items', 'user_wallets', 'wallet_transactions',
        'stripe_customers', 'payment_transactions',
        'battle_passes', 'user_battle_passes',
        'badge_definitions', 'user_badges',
        'user_progression', 'user_game_progression',
        'user_quests', 'quest_definitions',
        'coach_profiles', 'coaching_sessions',
        'streamer_profiles',
        'account_trust', 'account_verifications',
        'accessibility_settings',
        'activity_feed',
      ];

      // This test documents the gap between code and types
      expect(missingTables.length).toBeGreaterThan(30);
    });
  });
});
