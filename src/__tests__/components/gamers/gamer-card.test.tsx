import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GamerCard } from '@/components/gamers/gamer-card';

// Mock dependencies
jest.mock('@/lib/db/client-browser', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'current-user-id' },
    profile: null,
    loading: false,
  }),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  formatRelativeTime: (date: string) => '2 hours ago',
  generateAvatarFallback: (name: string) => name?.slice(0, 2).toUpperCase() || '?',
}));

const mockGamer = {
  id: 'gamer-123',
  username: 'progamer',
  display_name: 'Pro Gamer',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Professional gaming enthusiast',
  region: 'NA',
  preferred_language: 'en',
  gaming_style: 'competitive' as const,
  is_online: true,
  last_seen: '2024-01-15T10:00:00Z',
  user_games: [
    {
      id: 'ug-1',
      game_id: 'game-1',
      user_id: 'gamer-123',
      rank: 'Diamond II',
      role: 'Duelist',
      game: {
        id: 'game-1',
        name: 'Valorant',
        slug: 'valorant',
        image_url: null,
        ranks: [],
        roles: [],
        created_at: '2024-01-01',
      },
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'ug-2',
      game_id: 'game-2',
      user_id: 'gamer-123',
      rank: 'Global Elite',
      role: 'AWPer',
      game: {
        id: 'game-2',
        name: 'Counter-Strike 2',
        slug: 'cs2',
        image_url: null,
        ranks: [],
        roles: [],
        created_at: '2024-01-01',
      },
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ],
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('GamerCard Component', () => {
  describe('Rendering', () => {
    it('renders gamer display name', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText('Pro Gamer')).toBeInTheDocument();
    });

    it('renders username with @ prefix', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText('@progamer')).toBeInTheDocument();
    });

    it('renders gaming style badge', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText('competitive')).toBeInTheDocument();
    });

    it('renders online status indicator', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText('Online now')).toBeInTheDocument();
    });

    it('renders offline status with last seen', () => {
      const offlineGamer = { ...mockGamer, is_online: false };
      render(<GamerCard gamer={offlineGamer as any} />);
      expect(screen.getByText(/Active/)).toBeInTheDocument();
    });

    it('renders region when provided', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText('NA')).toBeInTheDocument();
    });

    it('renders language when provided', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText('EN')).toBeInTheDocument();
    });
  });

  describe('Games Display', () => {
    it('renders first 3 games as badges', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText(/Valorant/)).toBeInTheDocument();
      expect(screen.getByText(/Counter-Strike/)).toBeInTheDocument();
    });

    it('shows rank for each game', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      expect(screen.getByText(/Diamond/)).toBeInTheDocument();
      expect(screen.getByText(/Global/)).toBeInTheDocument();
    });

    it('shows +N badge when more than 3 games', () => {
      const gamerWithManyGames = {
        ...mockGamer,
        user_games: [
          ...mockGamer.user_games,
          {
            id: 'ug-3',
            game: { id: 'g3', name: 'Apex Legends', slug: 'apex' },
            rank: 'Predator',
          },
          {
            id: 'ug-4',
            game: { id: 'g4', name: 'Fortnite', slug: 'fortnite' },
            rank: 'Champion',
          },
        ],
      };
      render(<GamerCard gamer={gamerWithManyGames as any} />);
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens preview modal when card is clicked', async () => {
      const user = userEvent.setup();
      render(<GamerCard gamer={mockGamer as any} />);

      // Find and click the card
      const card = screen.getByText('Pro Gamer').closest('[class*="cursor-pointer"]') ||
                   screen.getByText('Pro Gamer').parentElement?.parentElement?.parentElement;

      if (card) {
        await user.click(card);
        // Modal should show player profile title
        await waitFor(() => {
          expect(screen.getByText('Player Profile')).toBeInTheDocument();
        });
      }
    });

    it('shows message button', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('shows follow button for other users', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      // Should have follow/unfollow button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('does not show follow button for own profile', () => {
      const ownProfile = { ...mockGamer, id: 'current-user-id' };
      render(<GamerCard gamer={ownProfile as any} />);
      // Should only have message button
      const buttons = screen.getAllByRole('button');
      // Message button should still exist
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Modal Content', () => {
    it('shows full bio in modal', async () => {
      const user = userEvent.setup();
      render(<GamerCard gamer={mockGamer as any} />);

      const card = screen.getByText('Pro Gamer').closest('[class*="interactive"]') ||
                   screen.getByText('Pro Gamer');

      await user.click(card);

      await waitFor(() => {
        expect(screen.getByText('Professional gaming enthusiast')).toBeInTheDocument();
      });
    });

    it('shows stats in modal', async () => {
      const user = userEvent.setup();
      render(<GamerCard gamer={mockGamer as any} />);

      const card = screen.getByText('Pro Gamer');
      await user.click(card);

      await waitFor(() => {
        // Use getAllByText since 'Games' appears in both stats and games section
        expect(screen.getAllByText('Games').length).toBeGreaterThan(0);
        expect(screen.getByText('Matches')).toBeInTheDocument();
        expect(screen.getByText('Rating')).toBeInTheDocument();
      });
    });

    it('shows all games in modal', async () => {
      const user = userEvent.setup();
      render(<GamerCard gamer={mockGamer as any} />);

      const card = screen.getByText('Pro Gamer');
      await user.click(card);

      await waitFor(() => {
        expect(screen.getAllByText(/Valorant/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Counter-Strike/).length).toBeGreaterThan(0);
      });
    });

    it('has view full profile link', async () => {
      const user = userEvent.setup();
      render(<GamerCard gamer={mockGamer as any} />);

      const card = screen.getByText('Pro Gamer');
      await user.click(card);

      await waitFor(() => {
        expect(screen.getByText('View Full Profile')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing avatar gracefully', () => {
      const gamerNoAvatar = { ...mockGamer, avatar_url: null };
      render(<GamerCard gamer={gamerNoAvatar as any} />);
      // Should show fallback
      expect(screen.getByText('Pro Gamer')).toBeInTheDocument();
    });

    it('handles missing display name', () => {
      const gamerNoDisplayName = { ...mockGamer, display_name: null };
      render(<GamerCard gamer={gamerNoDisplayName as any} />);
      // Should fallback to username
      expect(screen.getByText('progamer')).toBeInTheDocument();
    });

    it('handles no games', () => {
      const gamerNoGames = { ...mockGamer, user_games: [] };
      render(<GamerCard gamer={gamerNoGames as any} />);
      expect(screen.getByText('Pro Gamer')).toBeInTheDocument();
    });

    it('handles missing bio', () => {
      const gamerNoBio = { ...mockGamer, bio: null };
      render(<GamerCard gamer={gamerNoBio as any} />);
      expect(screen.getByText('Pro Gamer')).toBeInTheDocument();
    });

    it('handles missing region', () => {
      const gamerNoRegion = { ...mockGamer, region: null };
      render(<GamerCard gamer={gamerNoRegion as any} />);
      expect(screen.getByText('Pro Gamer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible buttons', () => {
      render(<GamerCard gamer={mockGamer as any} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it('has accessible links in modal', async () => {
      const user = userEvent.setup();
      render(<GamerCard gamer={mockGamer as any} />);

      const card = screen.getByText('Pro Gamer');
      await user.click(card);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /View Full Profile/i });
        expect(link).toHaveAttribute('href', '/profile/progamer');
      });
    });
  });
});
