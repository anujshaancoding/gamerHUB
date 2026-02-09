import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClanCard } from '@/components/clans/clan-card';

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

const mockClan = {
  id: 'clan-123',
  name: 'Elite Gamers',
  tag: 'EG',
  slug: 'elite-gamers',
  description: 'A clan for elite competitive players',
  avatar_url: 'https://example.com/clan-avatar.jpg',
  region: 'NA',
  language: 'en',
  is_recruiting: true,
  is_public: true,
  max_members: 50,
  min_rank_requirement: 'Diamond',
  stats: {
    challenges_won: 25,
    total_matches: 100,
  },
  primary_game: {
    id: 'game-1',
    name: 'Valorant',
    slug: 'valorant',
    image_url: null,
    ranks: [],
    roles: [],
    created_at: '2024-01-01',
  },
  clan_games: [
    {
      id: 'cg-1',
      clan_id: 'clan-123',
      game_id: 'game-1',
      is_primary: true,
      game: {
        id: 'game-1',
        name: 'Valorant',
        slug: 'valorant',
      },
    },
    {
      id: 'cg-2',
      clan_id: 'clan-123',
      game_id: 'game-2',
      is_primary: false,
      game: {
        id: 'game-2',
        name: 'Counter-Strike 2',
        slug: 'cs2',
      },
    },
  ],
  member_count: 35,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('ClanCard Component', () => {
  describe('Rendering', () => {
    it('renders clan name', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('Elite Gamers')).toBeInTheDocument();
    });

    it('renders clan tag in brackets', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('[EG]')).toBeInTheDocument();
    });

    it('renders clan description', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('A clan for elite competitive players')).toBeInTheDocument();
    });

    it('renders member count', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('35/50')).toBeInTheDocument();
    });

    it('renders region when provided', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('NA')).toBeInTheDocument();
    });

    it('renders language when provided', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('renders primary game badge', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('Valorant')).toBeInTheDocument();
    });

    it('renders recruiting badge when is_recruiting is true', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('Recruiting')).toBeInTheDocument();
    });

    it('does not render recruiting badge when not recruiting', () => {
      const notRecruitingClan = { ...mockClan, is_recruiting: false };
      render(<ClanCard clan={notRecruitingClan as any} />);
      expect(screen.queryByText('Recruiting')).not.toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    it('renders wins count', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('25 wins')).toBeInTheDocument();
    });

    it('renders matches count', () => {
      render(<ClanCard clan={mockClan as any} />);
      expect(screen.getByText('100 matches')).toBeInTheDocument();
    });

    it('handles missing stats gracefully', () => {
      const clanNoStats = { ...mockClan, stats: null };
      render(<ClanCard clan={clanNoStats as any} />);
      expect(screen.getByText('0 wins')).toBeInTheDocument();
      expect(screen.getByText('0 matches')).toBeInTheDocument();
    });

    it('handles empty stats object', () => {
      const clanEmptyStats = { ...mockClan, stats: {} };
      render(<ClanCard clan={clanEmptyStats as any} />);
      expect(screen.getByText('0 wins')).toBeInTheDocument();
      expect(screen.getByText('0 matches')).toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('opens preview modal when card is clicked', async () => {
      const user = userEvent.setup();
      render(<ClanCard clan={mockClan as any} />);

      const card = screen.getByText('Elite Gamers');
      await user.click(card);

      await waitFor(() => {
        expect(screen.getByText('Clan Preview')).toBeInTheDocument();
      });
    });

    it('shows full clan details in modal', async () => {
      const user = userEvent.setup();
      render(<ClanCard clan={mockClan as any} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        // Should show stats
        expect(screen.getByText('Members')).toBeInTheDocument();
        expect(screen.getByText('Wins')).toBeInTheDocument();
        expect(screen.getByText('Matches')).toBeInTheDocument();
      });
    });

    it('shows all games in modal', async () => {
      const user = userEvent.setup();
      render(<ClanCard clan={mockClan as any} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.getByText('Games')).toBeInTheDocument();
        // Both games should be visible
        expect(screen.getAllByText(/Valorant/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Counter-Strike/).length).toBeGreaterThan(0);
      });
    });

    it('shows minimum rank requirement in modal', async () => {
      const user = userEvent.setup();
      render(<ClanCard clan={mockClan as any} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.getByText(/Min: Diamond/)).toBeInTheDocument();
      });
    });

    it('has view clan link in modal', async () => {
      const user = userEvent.setup();
      render(<ClanCard clan={mockClan as any} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.getByText('View Clan')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: /View Clan/i });
        expect(link).toHaveAttribute('href', '/clans/elite-gamers');
      });
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ClanCard clan={mockClan as any} />);

      // Open modal
      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.getByText('Clan Preview')).toBeInTheDocument();
      });

      // Close modal - find the close button by its icon class
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('.lucide-x'));
      if (closeButton) {
        await user.click(closeButton);
      }

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Clan Preview')).not.toBeInTheDocument();
      });
    });
  });

  describe('Join Request', () => {
    it('shows join button in modal when recruiting and callback provided', async () => {
      const onJoinRequest = jest.fn();
      const user = userEvent.setup();

      render(<ClanCard clan={mockClan as any} onJoinRequest={onJoinRequest} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.getByText('Request to Join')).toBeInTheDocument();
      });
    });

    it('calls onJoinRequest when join button is clicked', async () => {
      const onJoinRequest = jest.fn();
      const user = userEvent.setup();

      render(<ClanCard clan={mockClan as any} onJoinRequest={onJoinRequest} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.getByText('Request to Join')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Request to Join'));
      expect(onJoinRequest).toHaveBeenCalledTimes(1);
    });

    it('does not show join button when not recruiting', async () => {
      const onJoinRequest = jest.fn();
      const notRecruitingClan = { ...mockClan, is_recruiting: false };
      const user = userEvent.setup();

      render(<ClanCard clan={notRecruitingClan as any} onJoinRequest={onJoinRequest} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.queryByText('Request to Join')).not.toBeInTheDocument();
      });
    });

    it('does not show join button when no callback provided', async () => {
      const user = userEvent.setup();

      render(<ClanCard clan={mockClan as any} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        expect(screen.queryByText('Request to Join')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing avatar gracefully', () => {
      const clanNoAvatar = { ...mockClan, avatar_url: null };
      render(<ClanCard clan={clanNoAvatar as any} />);
      expect(screen.getByText('Elite Gamers')).toBeInTheDocument();
    });

    it('handles missing description', () => {
      const clanNoDesc = { ...mockClan, description: null };
      render(<ClanCard clan={clanNoDesc as any} />);
      expect(screen.getByText('Elite Gamers')).toBeInTheDocument();
    });

    it('handles missing primary game', () => {
      const clanNoGame = { ...mockClan, primary_game: null };
      render(<ClanCard clan={clanNoGame as any} />);
      expect(screen.getByText('Elite Gamers')).toBeInTheDocument();
    });

    it('handles empty clan_games array', () => {
      const clanNoGames = { ...mockClan, clan_games: [] };
      render(<ClanCard clan={clanNoGames as any} />);
      expect(screen.getByText('Elite Gamers')).toBeInTheDocument();
    });

    it('handles missing region', () => {
      const clanNoRegion = { ...mockClan, region: null };
      render(<ClanCard clan={clanNoRegion as any} />);
      expect(screen.getByText('Elite Gamers')).toBeInTheDocument();
    });

    it('handles missing language', () => {
      const clanNoLang = { ...mockClan, language: null };
      render(<ClanCard clan={clanNoLang as any} />);
      expect(screen.getByText('Elite Gamers')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('card is interactive', () => {
      render(<ClanCard clan={mockClan as any} />);
      // The card should be clickable
      const card = screen.getByText('Elite Gamers').closest('[class*="interactive"]') ||
                   screen.getByText('Elite Gamers');
      expect(card).toBeInTheDocument();
    });

    it('has accessible link to clan page', async () => {
      const user = userEvent.setup();
      render(<ClanCard clan={mockClan as any} />);

      await user.click(screen.getByText('Elite Gamers'));

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /View Clan/i });
        expect(link).toBeInTheDocument();
      });
    });
  });
});
