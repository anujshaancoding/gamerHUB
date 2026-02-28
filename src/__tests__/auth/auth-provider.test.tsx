/**
 * Auth Provider Tests
 *
 * Tests authentication flow, session management, profile loading,
 * and auth state transitions.
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';

// Mock DB client
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockSignInWithOAuth = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockFromSelect = jest.fn();
const mockFromUpdate = jest.fn();

jest.mock('@/lib/db/client-browser', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      signInWithOAuth: mockSignInWithOAuth,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: mockFromSelect,
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: mockFromUpdate,
          })),
        })),
      })),
    })),
  }),
}));

// Test component that uses useAuth
function AuthConsumer() {
  const { user, profile, loading, session } = useAuth();
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (user) return <div data-testid="authenticated">User: {profile?.username || 'unknown'}</div>;
  return <div data-testid="unauthenticated">Not logged in</div>;
}

describe('AuthProvider', () => {
  let subscriptionCallback: (event: string, session: unknown) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: user not authenticated
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockFromSelect.mockResolvedValue({ data: null, error: null });

    // Capture auth state change callback
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      subscriptionCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  });

  describe('Initial State', () => {
    it('should show loading state initially', async () => {
      // Delay resolution to observe loading state
      mockGetUser.mockReturnValue(new Promise(() => {}));

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show unauthenticated state when no user', async () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });
    });

    it('should show authenticated state when user exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@test.com' };
      const mockProfile = { id: 'user-123', username: 'testplayer' };

      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
      mockFromSelect.mockResolvedValue({ data: mockProfile, error: null });

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
        expect(screen.getByText('User: testplayer')).toBeInTheDocument();
      });
    });
  });

  describe('Auth State Validation', () => {
    it('should validate session with getUser() not just getSession()', async () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        // getUser() should be called first (validates with server)
        expect(mockGetUser).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle getUser error gracefully', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Invalid session') });

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });
    });

    it('should fetch profile after successful user validation', async () => {
      const mockUser = { id: 'user-123' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
      mockFromSelect.mockResolvedValue({ data: { id: 'user-123', username: 'gamer' }, error: null });

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('User: gamer')).toBeInTheDocument();
      });
    });
  });

  describe('Auth State Change Handling', () => {
    it('should subscribe to auth state changes', async () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
      });
    });

    it('should update state when user signs in', async () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });

      // Simulate sign-in event
      const mockSession = { user: { id: 'user-456' } };
      mockFromSelect.mockResolvedValue({ data: { id: 'user-456', username: 'newplayer' }, error: null });

      await act(async () => {
        subscriptionCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      });
    });

    it('should clear state when user signs out', async () => {
      const mockUser = { id: 'user-123' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
      mockFromSelect.mockResolvedValue({ data: { id: 'user-123', username: 'gamer' }, error: null });

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      });

      // Simulate sign-out event
      await act(async () => {
        subscriptionCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle profile fetch failure gracefully', async () => {
      const mockUser = { id: 'user-123' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
      mockFromSelect.mockResolvedValue({ data: null, error: new Error('Profile not found') });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        // Should still show as authenticated even with profile fetch failure
        expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle unexpected errors in initialization', async () => {
      mockGetUser.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        // Should fall back to unauthenticated on error
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Context Requirement', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<AuthConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', async () => {
      const unsubscribe = jest.fn();
      mockOnAuthStateChange.mockImplementation(() => ({
        data: { subscription: { unsubscribe } },
      }));

      const { unmount } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
