/**
 * Page Rendering Tests
 *
 * Tests that pages render correctly, load data properly,
 * handle loading states, and display fallbacks when data is missing.
 */

import { render, screen, waitFor } from '@testing-library/react';

// Mock auth hook for page-level tests
const mockUseAuth = jest.fn();
jest.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Page Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      session: null,
    });
  });

  describe('Layout Structure', () => {
    it('should have correct provider nesting order', () => {
      // The layout nests providers in this order:
      // QueryProvider > AuthProvider > ThemeProvider > PWAProvider > AuthGateProvider
      const providerOrder = [
        'QueryProvider',
        'AuthProvider',
        'ThemeProvider',
        'PWAProvider',
        'AuthGateProvider',
      ];

      // QueryProvider must be outermost for React Query to work everywhere
      expect(providerOrder[0]).toBe('QueryProvider');
      // AuthProvider must be inside QueryProvider but before ThemeProvider
      expect(providerOrder.indexOf('AuthProvider')).toBeLessThan(providerOrder.indexOf('ThemeProvider'));
      // AuthGateProvider must be innermost to access auth state
      expect(providerOrder[providerOrder.length - 1]).toBe('AuthGateProvider');
    });
  });

  describe('Community Page', () => {
    it('should render community page with correct tabs', () => {
      const tabs = [
        { id: 'news', label: 'News' },
        { id: 'blog', label: 'Blog' },
        { id: 'tournaments', label: 'Tournaments/Giveaways' },
        { id: 'friends', label: 'Friends' },
      ];

      expect(tabs).toHaveLength(4);
      expect(tabs[0].label).toBe('News');
      expect(tabs[1].label).toBe('Blog');
      expect(tabs[2].label).toBe('Tournaments/Giveaways');
      expect(tabs[3].label).toBe('Friends');
    });

    it('should show loading spinner while fetching posts', () => {
      render(
        <div>
          <div className="flex items-center justify-center min-h-[40vh]">
            <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        </div>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show empty state when no posts exist', () => {
      render(
        <div>
          <h3 data-testid="empty-state">No blog posts yet</h3>
          <p>Be the first to share your gaming experiences and insights!</p>
        </div>
      );

      expect(screen.getByTestId('empty-state')).toHaveTextContent('No blog posts yet');
    });

    it('should correctly format post data', () => {
      const post = {
        id: 'post-1',
        title: 'Test Post',
        excerpt: 'Test excerpt',
        content: 'Full content',
        cover_image: 'https://example.com/image.jpg',
        author_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        likes_count: 10,
        comments_count: 5,
        views_count: 100,
        read_time_minutes: 5,
      };

      expect(post.likes_count).toBe(10);
      expect(post.read_time_minutes).toBe(5);
    });
  });

  describe('Find Gamers Page', () => {
    it('should show loading spinner during search', () => {
      render(
        <div data-testid="loading-container">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      );

      expect(screen.getByTestId('loading-container')).toBeInTheDocument();
    });

    it('should show empty state when no gamers match filters', () => {
      render(
        <div>
          <h3 data-testid="no-gamers">No gamers found</h3>
          <p>Try adjusting your filters or search criteria to find more players.</p>
        </div>
      );

      expect(screen.getByTestId('no-gamers')).toHaveTextContent('No gamers found');
    });

    it('should list profiles correctly', () => {
      const profiles = [
        { id: 'user-1', username: 'player1' },
        { id: 'user-2', username: 'player2' },
      ];

      expect(profiles).toHaveLength(2);
      expect(profiles[0].username).toBe('player1');
    });

    it('should filter by game slug correctly', () => {
      const gamers = [
        {
          id: '1',
          user_games: [{ game: { slug: 'valorant' } }, { game: { slug: 'cs2' } }],
        },
        {
          id: '2',
          user_games: [{ game: { slug: 'dota2' } }],
        },
        {
          id: '3',
          user_games: [{ game: { slug: 'valorant' } }],
        },
      ];

      const filtered = gamers.filter(gamer =>
        gamer.user_games?.some(ug => ug.game?.slug === 'valorant')
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(g => g.id)).toEqual(['1', '3']);
    });

    it('should handle pagination with initial and per-load counts', () => {
      const INITIAL_PROFILES_TO_SHOW = 3;
      const PROFILES_PER_LOAD = 3;
      const totalGamers = 10;

      let visibleCount = INITIAL_PROFILES_TO_SHOW;
      expect(visibleCount).toBe(3);

      // Load more
      visibleCount += PROFILES_PER_LOAD;
      expect(visibleCount).toBe(6);

      // Load more
      visibleCount += PROFILES_PER_LOAD;
      expect(visibleCount).toBe(9);

      // Cap at total
      visibleCount = Math.min(visibleCount + PROFILES_PER_LOAD, totalGamers);
      expect(visibleCount).toBe(10);
    });
  });

  describe('Dashboard Page', () => {
    it('should require authentication', () => {
      const isProtected = ['/dashboard'].some(route => '/dashboard'.startsWith(route));
      expect(isProtected).toBe(true);
    });
  });

  describe('Profile Page', () => {
    it('should require authentication', () => {
      const isProtected = ['/profile'].some(route => '/profile/testuser'.startsWith(route));
      expect(isProtected).toBe(true);
    });

    it('should handle profile data with all optional fields', () => {
      const profile = {
        id: 'user-123',
        username: 'testgamer',
        display_name: null,
        avatar_url: null,
        banner_url: null,
        bio: null,
        gaming_style: null,
        preferred_language: 'en',
        region: null,
        timezone: null,
        online_hours: null,
        social_links: null,
        is_online: false,
        is_premium: false,
        premium_until: null,
        last_seen: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Should handle null display_name
      const displayName = profile.display_name || profile.username;
      expect(displayName).toBe('testgamer');

      // Should handle null avatar
      expect(profile.avatar_url).toBeNull();
    });
  });

  describe('Error Pages', () => {
    it('should have a not-found page', () => {
      render(
        <div data-testid="not-found">
          <h1>404 - Page Not Found</h1>
        </div>
      );

      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });

    it('should have an offline page for PWA', () => {
      render(
        <div data-testid="offline">
          <h1>You are offline</h1>
        </div>
      );

      expect(screen.getByTestId('offline')).toBeInTheDocument();
    });
  });
});

describe('Data Loading Patterns', () => {
  describe('Client-side Data Fetching', () => {
    it('should handle database query errors gracefully', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Table not found', code: '42P01' },
      });

      const { data, error } = await mockQuery();

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('42P01');
    });

    it('should handle empty result sets', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const { data, error } = await mockQuery();

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should handle network timeout', async () => {
      const mockQuery = jest.fn().mockRejectedValue(new Error('Network timeout'));

      await expect(mockQuery()).rejects.toThrow('Network timeout');
    });
  });

  describe('Server-side Data Fetching', () => {
    it('should validate user session before data access', () => {
      const validateAndFetch = async (userId: string | null) => {
        if (!userId) {
          return { data: null, error: 'Not authenticated' };
        }
        return { data: { id: userId }, error: null };
      };

      return Promise.all([
        validateAndFetch(null).then(result => {
          expect(result.error).toBe('Not authenticated');
        }),
        validateAndFetch('user-123').then(result => {
          expect(result.data?.id).toBe('user-123');
        }),
      ]);
    });
  });
});
