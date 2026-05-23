import { mockMovements } from '@/data/mock';
import type { MovementType } from '@/types';

export function useMovements() {
  const movements = mockMovements;
  const isLoading = false;
  const createMovement = async (_data: { product_id: string; warehouse_id: string; type: MovementType; quantity: number }) => {
    /* TODO: supabase.rpc('create_movement') */
  };
  return { movements, isLoading, createMovement };
}
