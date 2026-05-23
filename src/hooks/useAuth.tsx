import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';

// ── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Auth Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch the profile (with role) from the `profiles` table */
  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Fallback: use only auth data, role unknown
      return { id: userId, email, name: email, role: 'caixa', created_at: new Date().toISOString() };
    }

    return {
      id: data.id,
      email: data.email ?? email,
      name: data.name,
      role: data.role as UserRole,
      created_at: data.created_at,
    };
  }, []);

  // Listen to auth state changes on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email ?? '');
        setUser(profile);
      }
      setLoading(false);
    });

    // Subscribe to auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email ?? '');
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth Hook ──────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
