import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Batch } from '@/types';
import { useAuth } from './useAuth';

export function useBatches(productId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Obter o utilizador atualmente autenticado

  // Query do React Query para procurar e colocar em cache a lista de lotes
  const query = useQuery({
    queryKey: ['batches', productId],
    queryFn: async () => {
      let q = supabase
        .from('batches')
        .select('*, warehouse:warehouses(name)')
        .gt('quantity', 0) // Só queremos lotes com stock
        .order('expiry_date', { ascending: true }); // Ordenar por data de expiração, os mais próximos a expirar primeiro

      // Se foi fornecido um productId, aplicar o filtro na query
      if (productId) {
        q = q.eq('product_id', productId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  // Mutação do React Query para criar um novo lote no Supabase
  const createBatch = useMutation({
    mutationFn: async ({
      product_id,
      warehouse_id,
      batch_code,
      expiry_date,
      quantity,
      notes,
    }: {
      product_id: string;
      warehouse_id: string;
      batch_code: string;
      expiry_date: string;
      quantity: number;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Criar o lote com quantidade 0 (a quantidade será gerada pelo movimento)
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .insert({
          product_id,
          warehouse_id,
          batch_code,
          expiry_date,
          quantity: 0, 
          notes,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // 2. Registar o movimento de entrada que vai preencher o lote e o inventário
      const { error: moveError } = await supabase.rpc('create_movement', {
        p_product_id: product_id,
        p_warehouse_id: warehouse_id,
        p_type: 'in',
        p_quantity: quantity,
        p_user_id: user.id,
        p_batch_id: batch.id,
        p_notes: notes || `Entrada do lote ${batch_code}`,
      });

      if (moveError) throw moveError;

      return batch;
    },
    // Executado quando a mutação tem sucesso (lote e movimento criados sem erros)
    onSuccess: (_, variables) => {
      // Invalidar as queries para forçar um "refetch" e atualizar a interface de utilizador
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.product_id] });
    },
  });

  return {
    batches: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createBatch: createBatch.mutateAsync,
  };
}
