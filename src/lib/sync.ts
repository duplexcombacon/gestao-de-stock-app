// TODO: Sync engine — process offline queue when back online
// import { db } from './dexie';
// import { supabase } from './supabase';
//
// export async function syncPendingOperations() {
//   const pending = await db.pendingOps.where('status').equals('pending').toArray();
//   for (const op of pending) {
//     try {
//       await supabase.rpc('create_movement', op.payload);
//       await db.pendingOps.update(op.id!, { status: 'synced' });
//     } catch {
//       // Exponential backoff retry
//     }
//   }
// }
//
// window.addEventListener('online', syncPendingOperations);
