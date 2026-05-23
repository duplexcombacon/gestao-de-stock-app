// ── Roles ──
export type UserRole = 'admin' | 'gestor' | 'caixa' | 'auditor';

// ── Entities ──
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  min_stock: number;
  barcode: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'warehouse' | 'corridor' | 'shelf';
  qr_code: string | null;
  created_at: string;
  children?: Warehouse[];
}

export interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  updated_at: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface Batch {
  id: string;
  product_id: string;
  warehouse_id: string;
  batch_code: string;
  expiry_date: string;
  quantity: number;
  created_at: string;
}

export type MovementType = 'in' | 'out' | 'transfer';

export interface Movement {
  id: string;
  product_id: string;
  warehouse_id: string;
  type: MovementType;
  quantity: number;
  user_id: string;
  notes: string | null;
  created_at: string;
  product?: Product;
  warehouse?: Warehouse;
  user?: User;
}

export type ReturnStatus = 'pending' | 'restocked' | 'scrapped';

export interface Return {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reason: string;
  status: ReturnStatus;
  resolution: string | null;
  user_id: string;
  created_at: string;
  product?: Product;
  user?: User;
}

export interface AuditLog {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  user_id: string;
  diff: Record<string, unknown> | null;
  created_at: string;
}

// ── Dashboard ──
export interface DashboardKPIs {
  total_products: number;
  total_capital: number;
  movements_today: number;
  active_alerts: number;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'expiring_batch';
  message: string;
  product_id: string;
  product_name: string;
  warehouse_name: string;
  value: number;
  threshold: number;
  created_at: string;
}
