import Dexie, { type Table } from 'dexie';

export interface PendingOperation {
  id?: number;
  type: 'movement';
  payload: Record<string, unknown>;
  status: 'pending' | 'synced' | 'error';
  error_message?: string;
  created_at: string;
}

export interface CachedProduct {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  min_stock: number;
}

class StockDB extends Dexie {
  pendingOps!: Table<PendingOperation, number>;
  cachedProducts!: Table<CachedProduct, string>;

  constructor() {
    super('stockflow');
    this.version(1).stores({
      pendingOps: '++id, status, type, created_at',
      cachedProducts: 'id, sku, barcode'
    });
  }
}

export const db = new StockDB();
