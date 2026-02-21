"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ data: unknown; error: Error | null }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ data: unknown; error: Error | null }>;
  signInWithOAuth: (provider: "google") => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: Error | null }>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string) => {
    // Use maybeSingle() instead of single() to avoid 406 error when profile
    // doesn't exist yet (race condition with the signup DB trigger)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch profile:", error.message);
      setProfile(null);
      return;
    }

    if (data) {
      setProfile(data);
      return;
    }

    // Profile not found yet - the signup trigger may still be running.
    // Wait briefly and retry once.
    await new Promise(resolve => setTimeout(resolve, 1500));
    const { data: retryData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (retryData) {
      setProfile(retryData);
      return;
    }

    // Profile still doesn't exist — the signup trigger likely failed.
    // Create the profile client-side so the user isn't stuck.
    console.warn("Profile not found after retry, creating client-side fallback for user:", userId);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const username =
      authUser?.user_metadata?.username ||
      "user_" + userId.substring(0, 8);

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        username,
        display_name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || null,
        avatar_url: authUser?.user_metadata?.avatar_url || null,
      } as never)
      .select()
      .single();

    if (createError) {
      console.error("Failed to create fallback profile:", createError.message);
      setProfile(null);
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

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    updateProfile,
    refreshProfile,
  }), [
    user,
    profile,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    updateProfile,
    refreshProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
