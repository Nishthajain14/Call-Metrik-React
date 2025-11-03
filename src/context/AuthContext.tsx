import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserProfile = {
  User_Id: number;
  User_Email: string | null;
  User_Name: string | null;
};

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  profile: UserProfile | null;
  userId: number | null;
  signIn: (email: string, password: string) => Promise<{ error?: any } | void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }){
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile(){
      if (!session?.user?.email){ setProfile(null); return; }
      const email = session.user.email;
      const { data, error } = await supabase
        .from('Users')
        .select('User_Id, User_Email, User_Name')
        .eq('User_Email', email)
        .maybeSingle();
      if (!active) return;
      if (!error && data) setProfile(data as any);
      else setProfile(null);
    }
    loadProfile();
  }, [session]);

  const value = useMemo<AuthContextValue>(()=>({
    session,
    isLoading,
    profile,
    userId: profile?.User_Id ?? null,
    async signIn(email: string, password: string){
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
    },
    async signOut(){
      await supabase.auth.signOut();
    },
  }), [session, isLoading, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
