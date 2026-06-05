/**
 * Auth Provider Tests
 *
 * The auth layer migrated from Supabase to next-auth (Auth.js). The provider
 * now derives user/session from `useSession()` and loads the profile from the
 * `/api/profile` endpoint. These tests mock `next-auth/react` and assert the
 * CURRENT provider behavior.
 */

import { render, screen, waitFor } from '@testing-library/react';
import {
  AuthProvider,
  useAuthSession,
  useAuthProfile,
} from '@/lib/auth/AuthProvider';

// ─── Mock next-auth/react ─────────────────────────────────────────────────

const mockUseSession = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  // SessionProvider is just a passthrough wrapper in tests
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// The provider lazily imports the CSRF interceptor on mount — stub it out.
jest.mock('@/lib/security/csrf-fetch', () => ({
  installCsrfFetchInterceptor: jest.fn(),
}));

// ─── Test consumers ───────────────────────────────────────────────────────

function SessionConsumer() {
  const { user, loading } = useAuthSession();
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (user) return <div data-testid="authenticated">User: {user.email}</div>;
  return <div data-testid="unauthenticated">Not logged in</div>;
}

function ProfileConsumer() {
  const { user, loading } = useAuthSession();
  const { profile } = useAuthProfile();
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (user) {
    return (
      <div data-testid="authenticated">
        User: {profile?.username || 'unknown'}
      </div>
    );
  }
  return <div data-testid="unauthenticated">Not logged in</div>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const authedSession = {
  user: { id: 'user-123', email: 'test@test.com', name: 'Test', image: null },
};

function mockProfileFetch(profile: unknown, ok = true) {
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok,
    json: async () => ({ profile }),
  });
}

describe('AuthProvider (next-auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: unauthenticated, settled
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    mockProfileFetch(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('shows loading state while the session is resolving', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'loading' });

      render(
        <AuthProvider>
          <SessionConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('shows unauthenticated state when there is no session', async () => {
      render(
        <AuthProvider>
          <SessionConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });
    });

    it('shows authenticated state when a session exists', async () => {
      mockUseSession.mockReturnValue({
        data: authedSession,
        status: 'authenticated',
      });

      render(
        <AuthProvider>
          <SessionConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
        expect(screen.getByText('User: test@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Loading', () => {
    it('fetches the profile from /api/profile once the user is present', async () => {
      mockUseSession.mockReturnValue({
        data: authedSession,
        status: 'authenticated',
      });
      mockProfileFetch({ id: 'user-123', username: 'gamer' });

      render(
        <AuthProvider>
          <ProfileConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('User: gamer')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/profile?userId=user-123');
    });

    it('does not fetch a profile when unauthenticated', async () => {
      render(
        <AuthProvider>
          <ProfileConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('stays authenticated even if the profile fetch returns no profile', async () => {
      mockUseSession.mockReturnValue({
        data: authedSession,
        status: 'authenticated',
      });
      mockProfileFetch(null, true);

      render(
        <AuthProvider>
          <ProfileConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        // No username, but the user is still authenticated.
        expect(screen.getByText('User: unknown')).toBeInTheDocument();
      });
    });

    it('handles a failed profile fetch gracefully (user stays authenticated)', async () => {
      mockUseSession.mockReturnValue({
        data: authedSession,
        status: 'authenticated',
      });
      (global.fetch as jest.Mock) = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <ProfileConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Session Transitions', () => {
    it('reflects a sign-in when the session status changes to authenticated', async () => {
      const { rerender } = render(
        <AuthProvider>
          <SessionConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });

      // Simulate next-auth reporting a signed-in session
      mockUseSession.mockReturnValue({
        data: authedSession,
        status: 'authenticated',
      });
      rerender(
        <AuthProvider>
          <SessionConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      });
    });

    it('reflects a sign-out when the session status changes to unauthenticated', async () => {
      mockUseSession.mockReturnValue({
        data: authedSession,
        status: 'authenticated',
      });

      const { rerender } = render(
        <AuthProvider>
          <SessionConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      });

      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
      rerender(
        <AuthProvider>
          <SessionConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Context Requirement', () => {
    it('throws when useAuthSession is used outside an AuthProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<SessionConsumer />);
      }).toThrow('useAuthSession must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('throws when useAuthProfile is used outside an AuthProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      function BareProfile() {
        useAuthProfile();
        return null;
      }

      expect(() => {
        render(<BareProfile />);
      }).toThrow('useAuthProfile must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
