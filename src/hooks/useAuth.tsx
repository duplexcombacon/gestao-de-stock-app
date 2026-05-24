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
      .select('id, name, email, role, active, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('🔴 Erro ao ir buscar o perfil à DB:', error);
      // Fallback: use only auth data, role unknown
      return { id: userId, email, name: email, role: 'caixa', active: true, created_at: new Date().toISOString() };
    }

    if (data.active === false) {
      console.warn('⚠️ Conta desativada pelo administrador. A terminar sessão...');
      await supabase.auth.signOut();
      return null;
    }

    return {
      id: data.id,
      email: data.email ?? email,
      name: data.name,
      role: data.role as UserRole,
      active: data.active,
      created_at: data.created_at,
    };
  }, []);

  // Listen to auth state changes on mount
  useEffect(() => {
    let isMounted = true;

    // ESCAPE HATCH: Se o Supabase encravar, libertamos a UI ao fim de 3 segundos
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ TIMEOUT: O Supabase demorou demasiado tempo a responder. A forçar saída do loading...');
        setLoading(false);
      }
    }, 3000);

    // O onAuthStateChange dispara automaticamente um evento 'INITIAL_SESSION' 
    // mal o componente monta. Portanto, NÃO devemos chamar getSession() ao mesmo tempo
    // para evitar deadlocks no navigator.locks do Supabase!
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔔 Evento AuthStateChange:', _event);
      
      // Usamos setTimeout para libertar a thread e evitar o deadlock no navigator.locks
      // do Supabase, dado que o fetchProfile vai internamente chamar getSession().
      setTimeout(async () => {
        try {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id, session.user.email ?? '');
            if (isMounted) setUser(profile);
          } else {
            if (isMounted) setUser(null);
          }
        } catch (err) {
          console.error('🔴 Erro no Auth State Change:', err);
        } finally {
          if (isMounted) {
            clearTimeout(timeout);
            setLoading(false);
          }
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
