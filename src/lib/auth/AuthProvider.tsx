"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

// Session context — user, session, loading, auth actions
interface AuthSessionContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ data: unknown; error: Error | null }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ data: unknown; error: Error | null }>;
  signInWithOAuth: (provider: "google") => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

// Profile context — profile data and profile actions
interface AuthProfileContextType {
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: Error | null }>;
  refreshProfile: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextType | null>(null);
const AuthProfileContext = createContext<AuthProfileContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  // Track in-flight fetchProfile to prevent concurrent calls from clobbering state
  const fetchProfileVersion = useRef(0);

  const fetchProfile = useCallback(async (userId: string) => {
    const version = ++fetchProfileVersion.current;

    // Fast retry loop: try up to 3 times with 500ms gaps (total max 1s wait)
    // instead of a single 1.5s blocking delay.
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Abort if a newer fetchProfile call has started
      if (version !== fetchProfileVersion.current) return;

      if (error) {
        console.error("Failed to fetch profile:", error.message);
        setProfile(null);
        return;
      }

      if (data) {
        // If display_name is missing but Google metadata has a name, patch it
        const profileData = data as Profile;
        if (!profileData.display_name) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (version !== fetchProfileVersion.current) return;
          const googleName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;
          if (googleName) {
            await supabase
              .from("profiles")
              .update({ display_name: googleName } as never)
              .eq("id", userId);
            profileData.display_name = googleName;
          }
        }
        setProfile(profileData);
        return;
      }

      // Profile not found yet — the signup trigger may still be running.
      // Only wait if we have retries remaining.
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (version !== fetchProfileVersion.current) return;

    // Profile still doesn't exist after retries — the signup trigger likely failed.
    // Create the profile client-side so the user isn't stuck.
    console.warn("Profile not found after retries, creating client-side fallback for user:", userId);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (version !== fetchProfileVersion.current) return;

    const meta = authUser?.user_metadata || {};
    const username = meta.username || "user_" + userId.substring(0, 8);

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        username,
        display_name: meta.full_name || meta.name || null,
        avatar_url: meta.avatar_url || meta.picture || null,
      } as never)
      .select()
      .single();

    if (version !== fetchProfileVersion.current) return;

    if (createError) {
      console.error("Failed to create fallback profile:", createError.message);
      // If upsert failed (e.g. username collision), try one more time with a unique suffix
      const retryUsername = username + "_" + Math.random().toString(36).substring(2, 6);
      const { data: retryProfile, error: retryError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          username: retryUsername,
          display_name: meta.full_name || meta.name || null,
          avatar_url: meta.avatar_url || meta.picture || null,
        } as never)
        .select()
        .single();

      if (version !== fetchProfileVersion.current) return;

      if (retryError) {
        console.error("Failed to create fallback profile (retry):", retryError.message);
        setProfile(null);
        return;
      }
      setProfile(retryProfile as Profile);
      return;
    }

    setProfile(newProfile as Profile);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    // Validate session with the server (more secure than cookie-only check).
    // This ensures API routes get a properly validated session.
    const initializeAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error || !user) {
          setUser(null);
          setSession(null);
          setProfile(null);
        } else {
          setUser(user);
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          await fetchProfile(user.id);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // React to auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Skip INITIAL_SESSION - initializeAuth handles it with server validation
        if (event === "INITIAL_SESSION") return;

        // On TOKEN_REFRESHED, only update session — skip user/profile updates
        // to avoid unnecessary re-renders across the app when the user hasn't changed.
        if (event === "TOKEN_REFRESHED") {
          setSession(session);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, [supabase]);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    username: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    if (error) {
      console.error("[SignUp] Error:", {
        message: error.message,
        status: error.status,
        name: error.name,
        cause: error.cause,
        stack: error.stack,
        full: JSON.stringify(error, null, 2),
      });
    }
    return { data, error };
  }, [supabase]);

  const signInWithOAuth = useCallback(async (provider: "google") => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  }, [supabase]);

  const signOut = useCallback(async () => {
    // Mark offline while session is still valid (before auth sign-out clears it)
    if (user) {
      await supabase
        .from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() } as never)
        .eq("id", user.id);
    }

    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setSession(null);
    }
    return { error };
  }, [supabase, user]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates as never)
      .eq("id", user.id)
      .select()
      .single();

    // If profile row doesn't exist yet (signup trigger may have failed),
    // fall back to upsert to create it.
    // PGRST116 = "not found" from .single(), also handle generic update failures
    if (error && (error.code === "PGRST116" || !data)) {
      const username =
        user.user_metadata?.username ||
        "user_" + user.id.substring(0, 8);
      const { data: upsertData, error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, username, ...updates } as never)
        .select()
        .single();

      if (upsertData) {
        setProfile(upsertData as Profile);
      }

      return { data: upsertData as Profile | null, error: upsertError };
    }

    if (data) {
      setProfile(data as Profile);
    }

    return { data: data as Profile | null, error };
  }, [supabase, user]);

  const refreshProfile = useCallback(() => {
    if (user) {
      fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const sessionValue = useMemo(() => ({
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
  }), [
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
  ]);

  const profileValue = useMemo(() => ({
    profile,
    updateProfile,
    refreshProfile,
  }), [
    profile,
    updateProfile,
    refreshProfile,
  ]);

  return (
    <AuthSessionContext.Provider value={sessionValue}>
      <AuthProfileContext.Provider value={profileValue}>
        {children}
      </AuthProfileContext.Provider>
    </AuthSessionContext.Provider>
  );
}

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
