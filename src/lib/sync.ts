import { db } from './dexie';
import { supabase } from './supabase';

let isSyncing = false;

export async function syncPendingOperations() {
  // Prevent parallel syncs
  if (isSyncing) return;
  
  if (!navigator.onLine) {
    console.log('[Sync] Offline. Sincronização adiada.');
    return;
  }

  isSyncing = true;
  console.log('[Sync] A iniciar sincronização...');

  try {
    // Buscar operações pendentes (ou que deram erro mas queremos tentar de novo)
    const pendingOps = await db.pendingOps
      .where('status')
      .anyOf('pending', 'error')
      .sortBy('created_at');

    if (pendingOps.length === 0) {
      console.log('[Sync] Sem operações pendentes.');
      return;
    }

    console.log(`[Sync] A processar ${pendingOps.length} operações pendentes...`);

    for (const op of pendingOps) {
      try {
        if (op.type === 'movement') {
          const { error } = await supabase.rpc('create_movement', op.payload);
          
          if (error) {
            console.error(`[Sync] Erro na operação ${op.id}:`, error.message);
            await db.pendingOps.update(op.id!, { 
              status: 'error', 
              error_message: error.message 
            });
            continue; // Move to the next op
          }

          // Se sucesso, marcamos como sincronizado
          await db.pendingOps.update(op.id!, { status: 'synced' });
          console.log(`[Sync] Operação ${op.id} sincronizada com sucesso.`);
        }
      } catch (err: any) {
        console.error(`[Sync] Falha na rede durante a operação ${op.id}:`, err);
        // Em caso de falha de rede fatal, interrompemos a sync para não perder a ordem
        break; 
      }
    }
    
    // Limpar as operações já sincronizadas (opcional, pode ser feito depois de N dias)
    await db.pendingOps.where('status').equals('synced').delete();

  } finally {
    isSyncing = false;
    console.log('[Sync] Sincronização terminada.');
  }
}

// Iniciar sync automaticamente ao voltar a ter internet
window.addEventListener('online', () => {
  console.log('[Sync] Conexão restaurada. A iniciar sync...');
  syncPendingOperations();
});

// Expor função para forçar sincronização manual caso seja necessário
export const forceSync = syncPendingOperations;
