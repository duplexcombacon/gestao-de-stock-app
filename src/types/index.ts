// ── Roles (Funções dos Utilizadores) ──
export type UserRole = 'admin' | 'gestor' | 'caixa' | 'auditor';

// ── Entities (Entidades principais da Base de Dados) ──
// Representa um utilizador do sistema
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active?: boolean;
  created_at: string;
}

// Representa a definição de um produto (catálogo)
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  sell_price: number;
  min_stock: number;
  barcode: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'warehouse' | 'storage' | 'corridor' | 'shelf' | 'zone' | 'store';
  qr_code: string | null;
  created_at: string;
  children?: Warehouse[];
}

// Representa a quantidade de um produto num determinado armazém
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

// Registo de entrada/saída ou transferência de stock
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

// ── Scanner ──
export type ScanMode = 'location' | 'product';

export interface NewProductFormData {
  barcode: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost_price: number | string;
  sell_price: number | string;
  min_stock: number | string;
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

// ── Operador Check-ins ──
// Registo de presença de um operador numa localização (leitura de QR)
export interface OperatorCheckin {
  id: string;
  user_id: string;
  warehouse_id: string;
  checked_in_at: string;
  checked_out_at?: string | null;
  user?: User;
  warehouse?: Warehouse;
}
