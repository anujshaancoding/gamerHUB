import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    initialize,
    signIn,
    signUp,
    signOut,
    setSession,
    fetchProfile,
  } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized]);

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    fetchProfile,
  };
}
