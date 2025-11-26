import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import { getUserCredits } from '../services/creditService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  credits: number | null;
  loading: boolean;
  creditsLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Function to fetch and update credits
  const refreshCredits = async () => {
    try {
      setCreditsLoading(true);
      const currentCredits = await getUserCredits();
      setCredits(currentCredits);
    } catch (error) {
      console.error('Failed to refresh credits:', error);
      setCredits(null);
    } finally {
      setCreditsLoading(false);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await refreshCredits();
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await refreshCredits();
      } else {
        setCredits(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription to credit changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          setCredits(payload.new.credits);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Set session persistence based on "remember me"
          persistSession: rememberMe,
        },
      });

      if (error) {
        return { error };
      }

      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setCredits(null);
  };

  const value = {
    user,
    session,
    credits,
    loading,
    creditsLoading,
    login,
    logout,
    refreshCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
