import Dexie, { type Table } from 'dexie';

// Define a estrutura para as operações que são feitas offline e que precisam de ser sincronizadas mais tarde
export interface PendingOperation {
  id?: number;
  type: 'movement';
  payload: Record<string, unknown>; // Os dados originais do movimento
  status: 'pending' | 'synced' | 'error'; // O estado da sincronização
  error_message?: string;
  created_at: string;
}

export interface CachedProduct {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  category: string;
  unit: string;
  min_stock: number;
  cost_price: number;
}

export interface CachedWarehouse {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  qr_code: string | null;
}

// Cache do inventário local por produto e armazém
export interface CachedInventory {
  product_id: string;
  warehouse_id: string;
  quantity: number;
}

// Configuração da base de dados local offline usando o Dexie (IndexedDB)
class StockDB extends Dexie {
  pendingOps!: Table<PendingOperation, number>;
  cachedProducts!: Table<CachedProduct, string>;
  cachedWarehouses!: Table<CachedWarehouse, string>;
  cachedInventory!: Table<CachedInventory, string>;

  constructor() {
    super('stockflow');
    this.version(2).stores({
      pendingOps: '++id, status, type, created_at',
      cachedProducts: 'id, sku, barcode',
      cachedWarehouses: 'id, qr_code, type',
      cachedInventory: '[product_id+warehouse_id], product_id, warehouse_id'
    });
  }
}

export const db = new StockDB();
