"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { useSession, signIn, signOut as nextAuthSignOut, SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { Profile } from "@/types/database";

// ─── Context Types ──────────────────────────────────────────────────────────

// User type for Auth.js session
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

// Session context — user, session, loading, auth actions
interface AuthSessionContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: unknown; error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ data: unknown; error: Error | null }>;
  signInWithOAuth: (
    provider: "google"
  ) => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

// Profile context — profile data and profile actions
interface AuthProfileContextType {
  profile: Profile | null;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ data: Profile | null; error: Error | null }>;
  refreshProfile: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextType | null>(null);
const AuthProfileContext = createContext<AuthProfileContextType | null>(null);

// ─── Inner Provider (needs to be inside SessionProvider) ────────────────────

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const loading = status === "loading";

  const fetchProfileVersion = useRef(0);

  // Map Auth.js session to our AuthUser shape
  const user: AuthUser | null = useMemo(() => {
    if (!session?.user?.id) return null;
    return {
      id: session.user.id,
      email: session.user.email ?? undefined,
      user_metadata: {
        full_name: session.user.name,
        avatar_url: session.user.image,
      },
    };
  }, [session]);

  // ── Fetch profile from DB via API ────────────────────────────────────

  const fetchProfile = useCallback(async (userId: string) => {
    const version = ++fetchProfileVersion.current;

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (version !== fetchProfileVersion.current) return;

        if (res.ok) {
          const data = await res.json();
          if (version !== fetchProfileVersion.current) return;
          if (data.profile) {
            setProfile(data.profile as Profile);
            return;
          }
        }
      } catch {
        if (version !== fetchProfileVersion.current) return;
      }

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }
    }

    if (version !== fetchProfileVersion.current) return;
    setProfile(null);
  }, []);

  // ── Fetch profile when user changes ──────────────────────────────────

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user?.id, fetchProfile]);

  // ── Auth Actions ─────────────────────────────────────────────────────

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          return {
            data: null,
            error: new Error(result.error === "CredentialsSignin"
              ? "Invalid email or password"
              : result.error),
          };
        }

        return { data: result, error: null };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        // Create account via our registration API
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        });

        const data = await res.json();

        if (!res.ok) {
          return { data: null, error: new Error(data.error || "Registration failed") };
        }

        // Auto sign-in after registration
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          return {
            data,
            error: new Error("Account created but auto-login failed. Please sign in manually."),
          };
        }

        return { data, error: null };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    },
    []
  );

  const signInWithOAuth = useCallback(async (provider: "google") => {
    try {
      // OAuth requires browser redirect to the provider's auth page
      await signIn(provider, { callbackUrl: "/community" });
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      // Mark offline before signing out
      if (user?.id) {
        await fetch("/api/profile/offline", { method: "POST" }).catch(() => {});
      }

      await nextAuthSignOut({ redirect: false });
      setProfile(null);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user?.id]);

  // ── Update profile ──────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user?.id) return { data: null, error: new Error("Not authenticated") };

      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        const data = await res.json();

        if (!res.ok) {
          return { data: null, error: new Error(data.error || "Failed to update profile") };
        }

        if (data.profile) {
          setProfile(data.profile as Profile);
        }

        return { data: data.profile as Profile | null, error: null };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    },
    [user?.id]
  );

  const refreshProfile = useCallback(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // ── Memoized context values ──────────────────────────────────────────

  const sessionValue = useMemo(
    () => ({
      user,
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut: handleSignOut,
    }),
    [user, session, loading, signInWithEmail, signUpWithEmail, signInWithOAuth, handleSignOut]
  );

  const profileValue = useMemo(
    () => ({
      profile,
      updateProfile,
      refreshProfile,
    }),
    [profile, updateProfile, refreshProfile]
  );

  return (
    <AuthSessionContext.Provider value={sessionValue}>
      <AuthProfileContext.Provider value={profileValue}>
        {children}
      </AuthProfileContext.Provider>
    </AuthSessionContext.Provider>
  );
}

// ─── Outer Provider (wraps SessionProvider) ─────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within an AuthProvider");
  }
  return context;
}

export function useAuthProfile() {
  const context = useContext(AuthProfileContext);
  if (!context) {
    throw new Error("useAuthProfile must be used within an AuthProvider");
  }
  return context;
}

// Backward-compatible hook that merges both contexts
export function useAuth() {
  const sessionCtx = useAuthSession();
  const profileCtx = useAuthProfile();
  return { ...sessionCtx, ...profileCtx };
}
