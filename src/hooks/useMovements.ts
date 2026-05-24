import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/dexie';
import { syncPendingOperations } from '@/lib/sync';
import { useAuth } from './useAuth';
import type { Movement, MovementType } from '@/types';

interface CreateMovementPayload {
  product_id: string;
  warehouse_id: string;
  type: MovementType;
  quantity: number;
  destination_warehouse_id?: string;
  batch_id?: string;
  notes?: string;
}

export function useMovements() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ── Fetch Movements ──
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      // Offline fallback can be added here if needed, but for now we fetch directly
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          product:products (id, name, sku, category),
          warehouse:warehouses (id, name),
          user:profiles (id, name),
          batch:batches (id, batch_code)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Movement[];
    },
  });

  // ── Create Movement (Offline/Online aware) ──
  const createMovement = useMutation({
    mutationFn: async (payload: CreateMovementPayload) => {
      if (!user) throw new Error('User not authenticated');

      const rpcPayload = {
        p_product_id: payload.product_id,
        p_warehouse_id: payload.warehouse_id,
        p_type: payload.type,
        p_quantity: payload.quantity,
        p_user_id: user.id,
        p_destination_warehouse_id: payload.destination_warehouse_id || null,
        p_batch_id: payload.batch_id || null,
        p_notes: payload.notes || null,
      };

      // Se estivermos offline, guardar localmente no IndexedDB
      if (!navigator.onLine) {
        console.log('[useMovements] Guardado offline na fila do Dexie.');
        await db.pendingOps.add({
          type: 'movement',
          payload: rpcPayload,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        
        // Simular o ID do movimento criado localmente
        return 'offline-pending'; 
      }

      // Se estiver online, tenta chamar o RPC diretamente
      const { data, error } = await supabase.rpc('create_movement', rpcPayload);
      if (error) throw new Error(error.message);
      
      return data;
    },
    onSuccess: (data) => {
      if (data === 'offline-pending') {
        // Se foi guardado offline, acionamos o Sync assim que a rede voltar (o listener de 'online' trata disso)
        // No entretanto, poderíamos atualizar o inventário otimisticamente na cache do react-query
      } else {
        // Sucesso real na BD, forçar sync de outras ops se as houver e re-validar as queries
        syncPendingOperations();
        queryClient.invalidateQueries({ queryKey: ['movements'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }
    },
  });

  return { 
    movements, 
    isLoading, 
    createMovement 
  };
}
