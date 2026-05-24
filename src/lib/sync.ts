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

export async function syncMasterData() {
  if (!navigator.onLine) return;

  try {
    console.log('[Sync Master] A descarregar dados para modo offline...');
    
    const [productsRes, warehousesRes, inventoryRes] = await Promise.all([
      supabase.from('products').select('id, sku, name, barcode, min_stock, cost_price, category, unit').eq('active', true),
      supabase.from('warehouses').select('id, name, type, parent_id, qr_code'),
      supabase.from('inventory').select('product_id, warehouse_id, quantity')
    ]);

    if (productsRes.data) {
      await db.cachedProducts.clear();
      await db.cachedProducts.bulkAdd(productsRes.data);
    }
    
    if (warehousesRes.data) {
      await db.cachedWarehouses.clear();
      await db.cachedWarehouses.bulkAdd(warehousesRes.data);
    }
    
    if (inventoryRes.data) {
      await db.cachedInventory.clear();
      await db.cachedInventory.bulkAdd(inventoryRes.data);
    }

    console.log('[Sync Master] Dados guardados localmente com sucesso.');
  } catch (err) {
    console.error('[Sync Master] Erro ao sincronizar dados offline:', err);
  }
}

// Iniciar sync automaticamente ao voltar a ter internet
window.addEventListener('online', () => {
  console.log('[Sync] Conexão restaurada. A iniciar sync...');
  syncPendingOperations();
  syncMasterData();
});

// Expor função para forçar sincronização manual caso seja necessário
export const forceSync = async () => {
  await syncPendingOperations();
  await syncMasterData();
};
