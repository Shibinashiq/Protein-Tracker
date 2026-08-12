import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, Profile } from './supabase';

const toEmail = (username: string) => `${username}@protein.app`;

// Ensure password meets Supabase's minimum 6 character requirement
const formatPassword = (pw: string) => (pw.length >= 6 ? pw : `${pw}_protein123`);

const DISPLAY_NAMES: Record<string, string> = {
  shibin: 'Shibin',
  niveditha: 'Niveditha',
  nithin: 'Nithin',
};

interface AuthContextType {
  session: Session | null;
  user: Profile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setUser(data as Profile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else { setUser(null); setIsLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const email = toEmail(username);
    const securePassword = formatPassword(password);
    const displayName = DISPLAY_NAMES[username] || username;

    // 1. Try normal sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: securePassword,
    });

    if (signInError) {
      // 2. If sign in fails, auto sign up via Supabase Auth API
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: securePassword,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        throw new Error(signInError.message || signUpError.message);
      }

      if (!signUpData.session) {
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: securePassword,
        });
        if (retryError) throw new Error(retryError.message);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
