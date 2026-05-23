// TODO: Install dexie and configure offline DB
// import Dexie, { type Table } from 'dexie';
//
// interface PendingOperation {
//   id?: number;
//   type: 'movement';
//   payload: Record<string, unknown>;
//   status: 'pending' | 'synced' | 'error';
//   created_at: string;
// }
//
// class StockDB extends Dexie {
//   pendingOps!: Table<PendingOperation>;
//   constructor() {
//     super('stockflow');
//     this.version(1).stores({ pendingOps: '++id, status, created_at' });
//   }
// }
// export const db = new StockDB();
