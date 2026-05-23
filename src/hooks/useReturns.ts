import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface ReturnItem {
  id: string;
  product_id: string;
  warehouse_id: string | null;
  quantity: number;
  reason: string | null;
  status: 'pending' | 'restocked' | 'scrapped';
  user_id: string;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  // Extra fields that could be joined:
  product_name?: string;
  warehouse_name?: string;
  user_name?: string;
}

export function useReturns() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('returns')
        .select(`
          *,
          products(name),
          warehouses(name),
          profiles!returns_user_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Map joined data to flat structure for easier UI consumption
      const formattedReturns = data?.map(item => ({
        ...item,
        product_name: item.products?.name,
        warehouse_name: item.warehouses?.name,
        user_name: item.profiles?.name,
      })) as ReturnItem[];

      setReturns(formattedReturns || []);
    } catch (err: any) {
      console.error('Error fetching returns:', err);
      setError(err.message || 'Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();

    const subscription = supabase
      .channel('returns_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, fetchReturns)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchReturns]);

  const createReturn = async (
    productId: string,
    quantity: number,
    warehouseId?: string,
    reason?: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Não autenticado' };

    try {
      const { error: insertError } = await supabase
        .from('returns')
        .insert({
          product_id: productId,
          warehouse_id: warehouseId || null,
          quantity,
          reason,
          user_id: user.id
        });

      if (insertError) throw insertError;
      return { error: null };
    } catch (err: any) {
      console.error('Error creating return:', err);
      return { error: err.message || 'Erro ao criar devolução' };
    }
  };

  const resolveReturn = async (
    returnId: string,
    action: 'restock' | 'scrap'
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Não autenticado' };

    try {
      // Usar a RPC de resolução atómica definida na base de dados
      const { error: rpcError } = await supabase
        .rpc('resolve_return', {
          p_return_id: returnId,
          p_action: action,
          p_user_id: user.id
        });

      if (rpcError) throw rpcError;
      return { error: null };
    } catch (err: any) {
      console.error('Error resolving return:', err);
      return { error: err.message || 'Erro ao resolver devolução' };
    }
  };

  return { 
    returns, 
    loading, 
    error, 
    fetchReturns,
    createReturn,
    resolveReturn
  };
}
