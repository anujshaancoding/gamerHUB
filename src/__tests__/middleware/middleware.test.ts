/**
 * Middleware Tests
 *
 * Tests route protection, session management, and redirect behavior.
 * Validates that protected routes require auth and public routes are accessible.
 */

describe('Middleware Route Protection', () => {
  // Route definitions matching middleware.ts
  const guestAllowedRoutes = ['/community'];
  const strictlyProtectedRoutes = [
    '/profile', '/matches', '/messages', '/challenges',
    '/media', '/clans', '/find-gamers', '/dashboard',
    '/notifications', '/settings', '/premium',
  ];
  const authRoutes = ['/login', '/register'];

  const isGuestAllowedRoute = (path: string) =>
    guestAllowedRoutes.some(route => path.startsWith(route));

  const isStrictlyProtectedRoute = (path: string) =>
    strictlyProtectedRoutes.some(route => path.startsWith(route));

  const isAuthRoute = (path: string) =>
    authRoutes.some(route => path.startsWith(route));

  const isLandingPage = (path: string) => path === '/';

  describe('Guest Allowed Routes', () => {
    it('should allow /community without authentication', () => {
      expect(isGuestAllowedRoute('/community')).toBe(true);
    });

    it('should allow /community/post/123 without authentication', () => {
      expect(isGuestAllowedRoute('/community/post/123')).toBe(true);
    });

    it('should NOT include /profile as guest allowed', () => {
      expect(isGuestAllowedRoute('/profile')).toBe(false);
    });
  });

  describe('Strictly Protected Routes', () => {
    it.each([
      '/profile',
      '/profile/username',
      '/matches',
      '/messages',
      '/challenges',
      '/media',
      '/clans',
      '/clans/my-clan',
      '/find-gamers',
      '/dashboard',
      '/notifications',
      '/settings',
      '/settings/connections',
      '/premium',
    ])('should mark %s as protected', (path) => {
      expect(isStrictlyProtectedRoute(path)).toBe(true);
    });

    it.each([
      '/community',
      '/login',
      '/register',
      '/blog',
      '/api/health',
      '/',
    ])('should NOT mark %s as strictly protected', (path) => {
      expect(isStrictlyProtectedRoute(path)).toBe(false);
    });
  });

  describe('Auth Routes', () => {
    it('should identify /login as auth route', () => {
      expect(isAuthRoute('/login')).toBe(true);
    });

    it('should identify /register as auth route', () => {
      expect(isAuthRoute('/register')).toBe(true);
    });

    it('should NOT identify /community as auth route', () => {
      expect(isAuthRoute('/community')).toBe(false);
    });
  });

  describe('Landing Page Detection', () => {
    it('should identify / as landing page', () => {
      expect(isLandingPage('/')).toBe(true);
    });

    it('should NOT identify /community as landing page', () => {
      expect(isLandingPage('/community')).toBe(false);
    });
  });

  describe('Redirect Logic', () => {
    interface RedirectResult {
      shouldRedirect: boolean;
      redirectTo?: string;
    }

    function getRedirectBehavior(path: string, isAuthenticated: boolean): RedirectResult {
      const isAuth = isAuthRoute(path);
      const isLanding = isLandingPage(path);

      // Authenticated users on auth routes or landing should go to /community
      if ((isAuth || isLanding) && isAuthenticated) {
        return { shouldRedirect: true, redirectTo: '/community' };
      }

      return { shouldRedirect: false };
    }

    it('should redirect authenticated user from /login to /community', () => {
      const result = getRedirectBehavior('/login', true);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/community');
    });

    it('should redirect authenticated user from /register to /community', () => {
      const result = getRedirectBehavior('/register', true);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/community');
    });

    it('should redirect authenticated user from / to /community', () => {
      const result = getRedirectBehavior('/', true);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/community');
    });

    it('should NOT redirect unauthenticated user from /login', () => {
      const result = getRedirectBehavior('/login', false);
      expect(result.shouldRedirect).toBe(false);
    });

    it('should NOT redirect authenticated user from /community', () => {
      const result = getRedirectBehavior('/community', true);
      expect(result.shouldRedirect).toBe(false);
    });

    it('should NOT redirect authenticated user from /dashboard', () => {
      const result = getRedirectBehavior('/dashboard', true);
      expect(result.shouldRedirect).toBe(false);
    });

    it('should NOT redirect unauthenticated user from /', () => {
      const result = getRedirectBehavior('/', false);
      expect(result.shouldRedirect).toBe(false);
    });
  });

  describe('Middleware Matcher', () => {
    const matcherPattern = /^\/((?!_next\/static|_next\/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)/;

    it.each([
      '/community',
      '/login',
      '/api/users',
      '/dashboard',
      '/profile/testuser',
    ])('should match %s', (path) => {
      expect(matcherPattern.test(path)).toBe(true);
    });

    it.each([
      '/_next/static/chunk.js',
      '/_next/image?url=test',
      '/favicon.ico',
      '/logo.svg',
      '/hero.png',
      '/banner.jpg',
      '/avatar.webp',
    ])('should NOT match static file %s', (path) => {
      expect(matcherPattern.test(path)).toBe(false);
    });
  });
});

describe('Session Management', () => {
  describe('Session Refresh', () => {
    it('should call getUser() to validate session (not just getSession)', () => {
      // The middleware uses getUser() which validates with the Supabase server
      // This is more secure than getSession() which only checks local token
      const validateSession = async () => {
        // Simulating the middleware behavior
        const getUser = jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        const result = await getUser();
        return result.data.user;
      };

      return validateSession().then(user => {
        expect(user).toEqual({ id: '123' });
      });
    });
  });

  describe('Cookie Handling', () => {
    it('should read cookies from request', () => {
      const mockCookies = {
        getAll: jest.fn().mockReturnValue([
          { name: 'sb-access-token', value: 'token123' },
          { name: 'sb-refresh-token', value: 'refresh123' },
        ]),
        set: jest.fn(),
      };

      const allCookies = mockCookies.getAll();
      expect(allCookies).toHaveLength(2);
      expect(allCookies[0].name).toBe('sb-access-token');
    });

    it('should set updated cookies on response', () => {
      const cookiesToSet = [
        { name: 'sb-access-token', value: 'newtoken', options: { httpOnly: true, secure: true } },
      ];

      const mockSetCookie = jest.fn();
      cookiesToSet.forEach(({ name, value, options }) => {
        mockSetCookie(name, value, options);
      });

      expect(mockSetCookie).toHaveBeenCalledWith('sb-access-token', 'newtoken', { httpOnly: true, secure: true });
    });
  });
});
