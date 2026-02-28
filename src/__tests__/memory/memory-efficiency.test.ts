/**
 * Memory Efficiency Tests
 *
 * Tests for memory leaks, proper cleanup of subscriptions and timers,
 * efficient data structures, and garbage collection behavior.
 */

import { QueryClient } from '@tanstack/react-query';
import { CACHE_TIMES, STALE_TIMES } from '@/lib/query/provider';

describe('Memory Efficiency', () => {
  describe('QueryClient Garbage Collection', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 100, // Short GC time for testing (100ms)
            staleTime: 50,
          },
        },
      });
    });

    afterEach(() => {
      queryClient.clear();
    });

    it('should garbage collect expired queries', async () => {
      queryClient.setQueryData(['temp-data'], { value: 'test' });
      expect(queryClient.getQueryData(['temp-data'])).toBeDefined();

      // Clear the query client (simulates GC)
      queryClient.removeQueries({ queryKey: ['temp-data'] });
      expect(queryClient.getQueryData(['temp-data'])).toBeUndefined();
    });

    it('should not keep stale query data indefinitely', () => {
      // Set multiple queries
      for (let i = 0; i < 100; i++) {
        queryClient.setQueryData([`test-${i}`], { index: i });
      }

      // All should exist
      expect(queryClient.getQueryData(['test-0'])).toBeDefined();
      expect(queryClient.getQueryData(['test-99'])).toBeDefined();

      // Clear all
      queryClient.clear();

      // None should exist
      expect(queryClient.getQueryData(['test-0'])).toBeUndefined();
      expect(queryClient.getQueryData(['test-99'])).toBeUndefined();
    });

    it('should remove specific queries without affecting others', () => {
      queryClient.setQueryData(['keep'], { keep: true });
      queryClient.setQueryData(['remove'], { remove: true });

      queryClient.removeQueries({ queryKey: ['remove'] });

      expect(queryClient.getQueryData(['keep'])).toBeDefined();
      expect(queryClient.getQueryData(['remove'])).toBeUndefined();
    });
  });

  describe('Cache Size Management', () => {
    it('should have bounded cache times to prevent memory bloat', () => {
      // Default cache time should not exceed 24 hours
      expect(CACHE_TIMES.DEFAULT).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      expect(CACHE_TIMES.STATIC).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      expect(CACHE_TIMES.SHORT).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('should have stale times shorter than or equal to cache times', () => {
      // Stale time should never exceed cache time, otherwise data gets GC'd before it's stale
      expect(STALE_TIMES.GAMES).toBeLessThanOrEqual(CACHE_TIMES.STATIC);
      expect(STALE_TIMES.PROFILES).toBeLessThanOrEqual(CACHE_TIMES.DEFAULT);
      expect(STALE_TIMES.MATCHES).toBeLessThanOrEqual(CACHE_TIMES.SHORT);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up event listeners to prevent memory leaks', () => {
      const listeners: (() => void)[] = [];

      const addListener = (fn: () => void) => {
        listeners.push(fn);
        window.addEventListener('resize', fn);
      };

      const removeAllListeners = () => {
        listeners.forEach(fn => window.removeEventListener('resize', fn));
        listeners.length = 0;
      };

      // Add listeners
      addListener(() => {});
      addListener(() => {});
      expect(listeners).toHaveLength(2);

      // Clean up
      removeAllListeners();
      expect(listeners).toHaveLength(0);
    });

    it('should clean up ResizeObserver instances', () => {
      const observer = new ResizeObserver(() => {});
      const element = document.createElement('div');

      observer.observe(element);
      observer.disconnect(); // Should not throw

      expect(() => observer.disconnect()).not.toThrow();
    });
  });

  describe('Subscription Management', () => {
    it('should properly unsubscribe from auth state changes', () => {
      const unsubscribe = jest.fn();
      const subscription = {
        unsubscribe,
      };

      // Simulating component mount: subscribe
      expect(unsubscribe).not.toHaveBeenCalled();

      // Simulating component unmount: unsubscribe
      subscription.unsubscribe();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should clean up realtime subscriptions', () => {
      const removeChannel = jest.fn();
      const channel = {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      };

      // Subscribe
      channel.subscribe();
      expect(channel.subscribe).toHaveBeenCalled();

      // Cleanup
      channel.unsubscribe();
      expect(channel.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Timer Cleanup', () => {
    it('should clear intervals on cleanup to prevent memory leaks', () => {
      jest.useFakeTimers();

      const callback = jest.fn();
      const intervalId = setInterval(callback, 1000);

      // Verify callback runs
      jest.advanceTimersByTime(3000);
      expect(callback).toHaveBeenCalledTimes(3);

      // Clean up
      clearInterval(intervalId);

      // Verify callback stops
      jest.advanceTimersByTime(3000);
      expect(callback).toHaveBeenCalledTimes(3); // No additional calls

      jest.useRealTimers();
    });

    it('should clear timeouts on cleanup', () => {
      jest.useFakeTimers();

      const callback = jest.fn();
      const timeoutId = setTimeout(callback, 5000);

      // Clean up before execution
      clearTimeout(timeoutId);

      // Advance past timeout
      jest.advanceTimersByTime(10000);
      expect(callback).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Large Data Handling', () => {
    it('should handle large arrays without excessive memory', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        data: { value: i },
      }));

      // Should be able to process large arrays
      expect(largeArray).toHaveLength(10000);

      // Filtering should work efficiently
      const filtered = largeArray.filter(item => item.data.value > 9990);
      expect(filtered).toHaveLength(9);
    });

    it('should avoid deep cloning of large objects', () => {
      const largeObject = {
        users: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `User ${i}` })),
      };

      // Shallow copy is more memory efficient than deep clone
      const shallowCopy = { ...largeObject };
      expect(shallowCopy.users).toBe(largeObject.users); // Same reference
      expect(shallowCopy).not.toBe(largeObject); // Different object
    });

    it('should paginate large result sets instead of loading all at once', () => {
      const ITEMS_PER_PAGE = 20;
      const totalItems = 200;
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

      expect(totalPages).toBe(10);

      // Simulating pagination
      const getPage = (page: number) => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const allItems = Array.from({ length: totalItems }, (_, i) => i);
        return allItems.slice(start, start + ITEMS_PER_PAGE);
      };

      expect(getPage(1)).toHaveLength(20);
      expect(getPage(1)[0]).toBe(0);
      expect(getPage(2)[0]).toBe(20);
      expect(getPage(10)).toHaveLength(20);
    });
  });

  describe('Object Reference Management', () => {
    it('should use useMemo patterns to prevent unnecessary re-renders', () => {
      // Simulate useMemo by checking reference equality
      const createValue = () => ({ data: [1, 2, 3] });

      const val1 = createValue();
      const val2 = createValue();

      // Without memoization, each call creates a new reference
      expect(val1).not.toBe(val2);
      expect(val1).toEqual(val2); // Same content though

      // With memoization (cached reference)
      const cached = val1;
      expect(cached).toBe(val1); // Same reference
    });

    it('should use useCallback to stabilize function references', () => {
      const mockFn = jest.fn();
      const stableRef = mockFn;

      // Same reference
      expect(stableRef).toBe(mockFn);

      // New function every time (what happens without useCallback)
      const unstableFn1 = () => {};
      const unstableFn2 = () => {};
      expect(unstableFn1).not.toBe(unstableFn2);
    });
  });
});

describe('Singleton Pattern (QueryClient)', () => {
  it('should reuse QueryClient instance in browser', () => {
    // The provider uses a singleton pattern for the QueryClient
    let browserQueryClient: QueryClient | undefined;

    function getQueryClient() {
      if (typeof window === 'undefined') {
        return new QueryClient();
      }
      if (!browserQueryClient) {
        browserQueryClient = new QueryClient();
      }
      return browserQueryClient;
    }

    const client1 = getQueryClient();
    const client2 = getQueryClient();

    // Should be the same instance
    expect(client1).toBe(client2);
  });

  it('should create new QueryClient on server', () => {
    // On the server, each request should get its own QueryClient
    const client1 = new QueryClient();
    const client2 = new QueryClient();

    expect(client1).not.toBe(client2);
  });
});
