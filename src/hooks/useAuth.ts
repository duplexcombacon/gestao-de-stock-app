import { useState } from 'react';
import type { User, UserRole } from '@/types';

const mockUser: User = {
  id: 'u3', email: 'caixa@stock.pt', name: 'João Caixa',
  role: 'caixa', created_at: '2025-02-01T09:00:00Z',
};

export function useAuth() {
  const [user] = useState<User | null>(mockUser);
  const [loading] = useState(false);
  const signIn = async (_email: string, _password: string) => { /* TODO: supabase.auth.signInWithPassword */ };
  const signOut = async () => { /* TODO: supabase.auth.signOut */ };
  const hasRole = (...roles: UserRole[]) => user ? roles.includes(user.role) : false;
  return { user, loading, signIn, signOut, hasRole };
}
