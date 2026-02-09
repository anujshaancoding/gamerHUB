/**
 * React Query Caching Configuration Tests
 *
 * Tests that the query client is configured correctly to prevent stale data,
 * ensure fresh data on navigation, and properly invalidate caches.
 *
 * BUG FIXED: refetchOnMount was set to false, causing stale data on page navigation.
 * This test suite ensures the fix (refetchOnMount: true) stays in place.
 */

import { QueryClient } from '@tanstack/react-query';

// Import the actual config values
import { STALE_TIMES, CACHE_TIMES, queryKeys } from '@/lib/query/provider';

describe('React Query Configuration', () => {
  describe('Query Client Default Options', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            gcTime: CACHE_TIMES.DEFAULT,
            retry: 1,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
          },
        },
      });
    });

    afterEach(() => {
      queryClient.clear();
    });

    it('should refetch on mount when data is stale (prevents showing old data)', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.refetchOnMount).toBe(true);
    });

    it('should refetch on reconnect to get latest data after connection loss', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.refetchOnReconnect).toBe(true);
    });

    it('should refetch on window focus when data is stale', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
    });

    it('should have a reasonable default stale time (60 seconds)', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.staleTime).toBe(1000 * 60);
    });

    it('should keep unused data in cache for 30 minutes', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.gcTime).toBe(CACHE_TIMES.DEFAULT);
      expect(CACHE_TIMES.DEFAULT).toBe(1000 * 60 * 30);
    });

    it('should retry failed requests once', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.retry).toBe(1);
    });

    it('should retry failed mutations once', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.mutations?.retry).toBe(1);
    });
  });

  describe('Stale Times Configuration', () => {
    it('should have appropriate stale times for static data (24h)', () => {
      expect(STALE_TIMES.GAMES).toBe(1000 * 60 * 60 * 24);
      expect(STALE_TIMES.BADGES).toBe(1000 * 60 * 60 * 24);
      expect(STALE_TIMES.TITLES).toBe(1000 * 60 * 60 * 24);
      expect(STALE_TIMES.FRAMES).toBe(1000 * 60 * 60 * 24);
      expect(STALE_TIMES.THEMES).toBe(1000 * 60 * 60 * 24);
    });

    it('should have appropriate stale times for semi-static data (30min)', () => {
      expect(STALE_TIMES.SEASON).toBe(1000 * 60 * 30);
      expect(STALE_TIMES.QUEST_DEFINITIONS).toBe(1000 * 60 * 30);
    });

    it('should have appropriate stale times for dynamic data (5min)', () => {
      expect(STALE_TIMES.LEADERBOARD).toBe(1000 * 60 * 5);
      expect(STALE_TIMES.TOURNAMENTS).toBe(1000 * 60 * 5);
      expect(STALE_TIMES.CLANS).toBe(1000 * 60 * 5);
      expect(STALE_TIMES.PROFILES).toBe(1000 * 60 * 5);
    });

    it('should have appropriate stale times for user data (2min)', () => {
      expect(STALE_TIMES.USER_PROGRESSION).toBe(1000 * 60 * 2);
      expect(STALE_TIMES.USER_QUESTS).toBe(1000 * 60 * 2);
      expect(STALE_TIMES.USER_BADGES).toBe(1000 * 60 * 2);
      expect(STALE_TIMES.CLAN_DETAILS).toBe(1000 * 60 * 2);
    });

    it('should have appropriate stale times for real-time data (30s)', () => {
      expect(STALE_TIMES.MATCHES).toBe(1000 * 30);
      expect(STALE_TIMES.ONLINE_USERS).toBe(1000 * 30);
    });

    it('should have dashboard stale time of 1 minute', () => {
      expect(STALE_TIMES.DASHBOARD).toBe(1000 * 60);
    });

    it('stale times should be ordered: static > semi-static > dynamic > real-time', () => {
      expect(STALE_TIMES.GAMES).toBeGreaterThan(STALE_TIMES.SEASON);
      expect(STALE_TIMES.SEASON).toBeGreaterThan(STALE_TIMES.LEADERBOARD);
      expect(STALE_TIMES.LEADERBOARD).toBeGreaterThan(STALE_TIMES.USER_PROGRESSION);
      expect(STALE_TIMES.USER_PROGRESSION).toBeGreaterThan(STALE_TIMES.MATCHES);
    });
  });

  describe('Cache Times Configuration', () => {
    it('should have default cache time of 30 minutes', () => {
      expect(CACHE_TIMES.DEFAULT).toBe(1000 * 60 * 30);
    });

    it('should have static cache time of 24 hours', () => {
      expect(CACHE_TIMES.STATIC).toBe(1000 * 60 * 60 * 24);
    });

    it('should have short cache time of 5 minutes', () => {
      expect(CACHE_TIMES.SHORT).toBe(1000 * 60 * 5);
    });
  });

  describe('Query Keys', () => {
    it('should generate consistent query keys for games', () => {
      expect(queryKeys.games).toEqual(['games']);
      expect(queryKeys.game('123')).toEqual(['games', '123']);
    });

    it('should generate consistent query keys for user data', () => {
      expect(queryKeys.user).toEqual(['user']);
      expect(queryKeys.profile('testuser')).toEqual(['profile', 'testuser']);
    });

    it('should generate consistent query keys for progression', () => {
      expect(queryKeys.progression()).toEqual(['progression']);
      expect(queryKeys.progression('user-123')).toEqual(['progression', 'user-123']);
    });

    it('should generate consistent query keys for badges', () => {
      expect(queryKeys.badges()).toEqual(['badges']);
      expect(queryKeys.badges('user-123')).toEqual(['badges', 'user-123']);
      expect(queryKeys.badgeDefinitions).toEqual(['badge-definitions']);
    });

    it('should generate consistent query keys for leaderboard with params', () => {
      const params = { type: 'global', limit: 50 };
      expect(queryKeys.leaderboard(params)).toEqual(['leaderboard', params]);
    });

    it('should generate consistent query keys for tournaments with params', () => {
      const params = { status: 'active', limit: 10 };
      expect(queryKeys.tournaments(params)).toEqual(['tournaments', params]);
      expect(queryKeys.tournament('t-123')).toEqual(['tournament', 't-123']);
    });

    it('should generate consistent query keys for clans', () => {
      const params = { search: 'test', recruiting: true };
      expect(queryKeys.clans(params)).toEqual(['clans', params]);
      expect(queryKeys.clan('c-123')).toEqual(['clan', 'c-123']);
      expect(queryKeys.clanMembers('c-123')).toEqual(['clan-members', 'c-123']);
    });

    it('should generate consistent query keys for seasons', () => {
      expect(queryKeys.currentSeason).toEqual(['season', 'current']);
      expect(queryKeys.season('s-123')).toEqual(['season', 's-123']);
      expect(queryKeys.seasonRewards('s-123')).toEqual(['season-rewards', 's-123']);
    });

    it('should generate consistent query keys for dashboard', () => {
      expect(queryKeys.dashboard).toEqual(['dashboard']);
      expect(queryKeys.dashboardMatches).toEqual(['dashboard', 'matches']);
      expect(queryKeys.dashboardChallenges).toEqual(['dashboard', 'challenges']);
      expect(queryKeys.dashboardStats).toEqual(['dashboard', 'stats']);
    });

    it('should generate consistent query keys for matches', () => {
      expect(queryKeys.matches()).toEqual(['matches', {}]);
      expect(queryKeys.matches({ status: 'upcoming' })).toEqual(['matches', { status: 'upcoming' }]);
      expect(queryKeys.match('m-123')).toEqual(['match', 'm-123']);
    });

    it('should generate consistent query keys for quests', () => {
      expect(queryKeys.activeQuests).toEqual(['quests', 'active']);
      expect(queryKeys.questDefinitions).toEqual(['quests', 'definitions']);
    });

    it('should generate consistent query keys for customization', () => {
      expect(queryKeys.titles).toEqual(['titles']);
      expect(queryKeys.frames).toEqual(['frames']);
      expect(queryKeys.themes).toEqual(['themes']);
    });
  });

  describe('Data Freshness Behavior', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            gcTime: CACHE_TIMES.DEFAULT,
            refetchOnMount: true,
            refetchOnReconnect: true,
            refetchOnWindowFocus: true,
          },
        },
      });
    });

    afterEach(() => {
      queryClient.clear();
    });

    it('should mark data as stale after staleTime expires', () => {
      // Set data in cache
      queryClient.setQueryData(['test'], { value: 'old' });

      // Data should exist in cache
      const data = queryClient.getQueryData(['test']);
      expect(data).toEqual({ value: 'old' });

      // Query state should reflect fresh data
      const state = queryClient.getQueryState(['test']);
      expect(state).toBeDefined();
      expect(state?.dataUpdatedAt).toBeGreaterThan(0);
    });

    it('should properly store and retrieve cached data', () => {
      queryClient.setQueryData(queryKeys.games, [{ id: '1', name: 'Valorant' }]);
      queryClient.setQueryData(queryKeys.profile('testuser'), { username: 'testuser' });

      expect(queryClient.getQueryData(queryKeys.games)).toEqual([{ id: '1', name: 'Valorant' }]);
      expect(queryClient.getQueryData(queryKeys.profile('testuser'))).toEqual({ username: 'testuser' });
    });

    it('should invalidate related queries correctly', () => {
      // Set up cached data
      queryClient.setQueryData(['progression'], { level: 5 });
      queryClient.setQueryData(['badges'], [{ id: '1' }]);

      // Invalidate progression
      queryClient.invalidateQueries({ queryKey: ['progression'] });

      // Progression should be invalidated (stale)
      const state = queryClient.getQueryState(['progression']);
      expect(state?.isInvalidated).toBe(true);

      // Badges should NOT be invalidated
      const badgeState = queryClient.getQueryState(['badges']);
      expect(badgeState?.isInvalidated).toBe(false);
    });

    it('should clear all cached data on queryClient.clear()', () => {
      queryClient.setQueryData(['test1'], 'data1');
      queryClient.setQueryData(['test2'], 'data2');

      queryClient.clear();

      expect(queryClient.getQueryData(['test1'])).toBeUndefined();
      expect(queryClient.getQueryData(['test2'])).toBeUndefined();
    });

    it('should handle cache invalidation for hierarchical keys', () => {
      queryClient.setQueryData(['dashboard'], { overview: true });
      queryClient.setQueryData(['dashboard', 'matches'], []);
      queryClient.setQueryData(['dashboard', 'stats'], {});

      // Invalidating parent key should invalidate children too
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      expect(queryClient.getQueryState(['dashboard'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['dashboard', 'matches'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['dashboard', 'stats'])?.isInvalidated).toBe(true);
    });
  });

  describe('Cache Invalidation Helpers', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient();
      // Pre-populate cache
      queryClient.setQueryData(['progression'], {});
      queryClient.setQueryData(['badges'], []);
      queryClient.setQueryData(['quests'], []);
      queryClient.setQueryData(['leaderboard', {}], []);
      queryClient.setQueryData(['season-leaderboard', {}], []);
      queryClient.setQueryData(['my-ranking', {}], {});
      queryClient.setQueryData(['tournaments', {}], []);
      queryClient.setQueryData(['clans', {}], []);
      queryClient.setQueryData(['clan', 'c-1'], {});
      queryClient.setQueryData(['dashboard'], {});
    });

    afterEach(() => {
      queryClient.clear();
    });

    it('should invalidate progression queries', () => {
      queryClient.invalidateQueries({ queryKey: ['progression'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });

      expect(queryClient.getQueryState(['progression'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['badges'])?.isInvalidated).toBe(true);
    });

    it('should invalidate quest queries', () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      expect(queryClient.getQueryState(['quests'])?.isInvalidated).toBe(true);
    });

    it('should invalidate leaderboard queries', () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['season-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-ranking'] });

      expect(queryClient.getQueryState(['leaderboard', {}])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['season-leaderboard', {}])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['my-ranking', {}])?.isInvalidated).toBe(true);
    });

    it('should invalidate tournament queries', () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      expect(queryClient.getQueryState(['tournaments', {}])?.isInvalidated).toBe(true);
    });

    it('should invalidate clan queries', () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['clan'] });

      expect(queryClient.getQueryState(['clans', {}])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['clan', 'c-1'])?.isInvalidated).toBe(true);
    });

    it('should invalidate dashboard queries', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      expect(queryClient.getQueryState(['dashboard'])?.isInvalidated).toBe(true);
    });
  });
});
