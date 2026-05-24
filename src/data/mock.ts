import type {
  User, Product, Warehouse, InventoryItem, Batch,
  Movement, Return, DashboardKPIs, Alert,
} from '@/types';

// ── Users ──
export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@stock.pt', name: 'Carlos Admin', role: 'admin', created_at: '2025-01-10T09:00:00Z' },
  { id: 'u2', email: 'gestor@stock.pt', name: 'Ana Gestora', role: 'gestor', created_at: '2025-01-12T09:00:00Z' },
  { id: 'u3', email: 'caixa@stock.pt', name: 'João Caixa', role: 'caixa', created_at: '2025-02-01T09:00:00Z' },
  { id: 'u4', email: 'auditor@stock.pt', name: 'Rita Auditora', role: 'auditor', created_at: '2025-02-05T09:00:00Z' },
];

// ── Products ──
export const mockProducts: Product[] = [
  { id: 'p1', sku: 'BEB-001', name: 'Água Mineral 1.5L', category: 'Bebidas', unit: 'un', cost_price: 0.35, sell_price: 0.50, min_stock: 50, barcode: '5601234567890', created_at: '2025-01-15T10:00:00Z' },
  { id: 'p2', sku: 'BEB-002', name: 'Sumo de Laranja 1L', category: 'Bebidas', unit: 'un', cost_price: 1.20, sell_price: 2.00, min_stock: 30, barcode: '5601234567891', created_at: '2025-01-15T10:05:00Z' },
  { id: 'p3', sku: 'ALI-001', name: 'Arroz Agulha 1kg', category: 'Alimentação', unit: 'kg', cost_price: 1.50, sell_price: 2.50, min_stock: 40, barcode: '5601234567892', created_at: '2025-01-16T08:00:00Z' },
  { id: 'p4', sku: 'ALI-002', name: 'Massa Esparguete 500g', category: 'Alimentação', unit: 'un', cost_price: 0.85, sell_price: 1.20, min_stock: 35, barcode: '5601234567893', created_at: '2025-01-16T08:10:00Z' },
  { id: 'p5', sku: 'LIM-001', name: 'Detergente Roupa 3L', category: 'Limpeza', unit: 'un', cost_price: 4.50, sell_price: 6.00, min_stock: 15, barcode: '5601234567894', created_at: '2025-01-17T09:00:00Z' },
  { id: 'p6', sku: 'LIM-002', name: 'Lixívia 2L', category: 'Limpeza', unit: 'un', cost_price: 1.80, sell_price: 2.50, min_stock: 20, barcode: '5601234567895', created_at: '2025-01-17T09:15:00Z' },
  { id: 'p7', sku: 'LAC-001', name: 'Leite Meio-Gordo 1L', category: 'Lacticínios', unit: 'un', cost_price: 0.65, sell_price: 0.90, min_stock: 60, barcode: '5601234567896', created_at: '2025-01-18T07:00:00Z' },
  { id: 'p8', sku: 'LAC-002', name: 'Iogurte Natural 4x125g', category: 'Lacticínios', unit: 'un', cost_price: 1.10, sell_price: 1.80, min_stock: 25, barcode: '5601234567897', created_at: '2025-01-18T07:30:00Z' },
  { id: 'p9', sku: 'HIG-001', name: 'Papel Higiénico 12 rolos', category: 'Higiene', unit: 'un', cost_price: 3.20, sell_price: 4.50, min_stock: 10, barcode: '5601234567898', created_at: '2025-01-19T11:00:00Z' },
  { id: 'p10', sku: 'HIG-002', name: 'Sabonete Líquido 500ml', category: 'Higiene', unit: 'un', cost_price: 2.10, sell_price: 3.00, min_stock: 12, barcode: '5601234567899', created_at: '2025-01-19T11:20:00Z' },
];

// ── Warehouses (hierarchy) ──
export const mockWarehouses: Warehouse[] = [
  {
    id: 'w1', name: 'Armazém Central', parent_id: null, type: 'warehouse', qr_code: 'QR-W1', created_at: '2025-01-10T08:00:00Z',
    children: [
      {
        id: 'w2', name: 'Corredor A — Bebidas', parent_id: 'w1', type: 'corridor', qr_code: 'QR-W2', created_at: '2025-01-10T08:05:00Z',
        children: [
          { id: 'w4', name: 'Prateleira A1', parent_id: 'w2', type: 'shelf', qr_code: 'QR-W4', created_at: '2025-01-10T08:10:00Z' },
          { id: 'w5', name: 'Prateleira A2', parent_id: 'w2', type: 'shelf', qr_code: 'QR-W5', created_at: '2025-01-10T08:11:00Z' },
        ],
      },
      {
        id: 'w3', name: 'Corredor B — Alimentação', parent_id: 'w1', type: 'corridor', qr_code: 'QR-W3', created_at: '2025-01-10T08:06:00Z',
        children: [
          { id: 'w6', name: 'Prateleira B1', parent_id: 'w3', type: 'shelf', qr_code: 'QR-W6', created_at: '2025-01-10T08:12:00Z' },
        ],
      },
    ],
  },
  {
    id: 'w7', name: 'Armazém Secundário', parent_id: null, type: 'warehouse', qr_code: 'QR-W7', created_at: '2025-01-11T09:00:00Z',
    children: [],
  },
];

// Flat version for lookups
export const mockWarehousesFlat: Warehouse[] = [
  { id: 'w1', name: 'Armazém Central', parent_id: null, type: 'warehouse', qr_code: 'QR-W1', created_at: '2025-01-10T08:00:00Z' },
  { id: 'w2', name: 'Corredor A — Bebidas', parent_id: 'w1', type: 'corridor', qr_code: 'QR-W2', created_at: '2025-01-10T08:05:00Z' },
  { id: 'w3', name: 'Corredor B — Alimentação', parent_id: 'w1', type: 'corridor', qr_code: 'QR-W3', created_at: '2025-01-10T08:06:00Z' },
  { id: 'w4', name: 'Prateleira A1', parent_id: 'w2', type: 'shelf', qr_code: 'QR-W4', created_at: '2025-01-10T08:10:00Z' },
  { id: 'w5', name: 'Prateleira A2', parent_id: 'w2', type: 'shelf', qr_code: 'QR-W5', created_at: '2025-01-10T08:11:00Z' },
  { id: 'w6', name: 'Prateleira B1', parent_id: 'w3', type: 'shelf', qr_code: 'QR-W6', created_at: '2025-01-10T08:12:00Z' },
  { id: 'w7', name: 'Armazém Secundário', parent_id: null, type: 'warehouse', qr_code: 'QR-W7', created_at: '2025-01-11T09:00:00Z' },
];

// ── Inventory ──
export const mockInventory: InventoryItem[] = [
  { id: 'inv1', product_id: 'p1', warehouse_id: 'w4', quantity: 120, updated_at: '2025-06-01T14:00:00Z' },
  { id: 'inv2', product_id: 'p2', warehouse_id: 'w4', quantity: 45, updated_at: '2025-06-01T14:05:00Z' },
  { id: 'inv3', product_id: 'p3', warehouse_id: 'w6', quantity: 80, updated_at: '2025-06-01T14:10:00Z' },
  { id: 'inv4', product_id: 'p4', warehouse_id: 'w6', quantity: 15, updated_at: '2025-06-01T14:15:00Z' }, // below min_stock
  { id: 'inv5', product_id: 'p5', warehouse_id: 'w5', quantity: 8, updated_at: '2025-06-01T14:20:00Z' },  // below min_stock
  { id: 'inv6', product_id: 'p7', warehouse_id: 'w4', quantity: 200, updated_at: '2025-06-01T14:25:00Z' },
  { id: 'inv7', product_id: 'p8', warehouse_id: 'w4', quantity: 30, updated_at: '2025-06-01T14:30:00Z' },
  { id: 'inv8', product_id: 'p9', warehouse_id: 'w5', quantity: 22, updated_at: '2025-06-01T14:35:00Z' },
  { id: 'inv9', product_id: 'p10', warehouse_id: 'w5', quantity: 5, updated_at: '2025-06-01T14:40:00Z' }, // below min_stock
  { id: 'inv10', product_id: 'p1', warehouse_id: 'w7', quantity: 60, updated_at: '2025-06-01T15:00:00Z' },
];

// ── Batches ──
export const mockBatches: Batch[] = [
  { id: 'b1', product_id: 'p7', warehouse_id: 'w4', batch_code: 'LT-2025-0601', expiry_date: '2025-07-15T00:00:00Z', quantity: 100, created_at: '2025-06-01T07:00:00Z' },
  { id: 'b2', product_id: 'p7', warehouse_id: 'w4', batch_code: 'LT-2025-0615', expiry_date: '2025-06-20T00:00:00Z', quantity: 100, created_at: '2025-06-15T07:00:00Z' }, // expiring soon
  { id: 'b3', product_id: 'p8', warehouse_id: 'w4', batch_code: 'LT-2025-0520', expiry_date: '2025-06-25T00:00:00Z', quantity: 30, created_at: '2025-05-20T07:00:00Z' },  // expiring soon
  { id: 'b4', product_id: 'p2', warehouse_id: 'w4', batch_code: 'LT-2025-0510', expiry_date: '2025-09-01T00:00:00Z', quantity: 45, created_at: '2025-05-10T07:00:00Z' },
];

// ── Movements ──
export const mockMovements: Movement[] = [
  { id: 'm1', product_id: 'p1', warehouse_id: 'w4', type: 'in', quantity: 50, user_id: 'u2', notes: 'Recepção de encomenda', created_at: '2025-06-14T09:30:00Z' },
  { id: 'm2', product_id: 'p3', warehouse_id: 'w6', type: 'in', quantity: 40, user_id: 'u2', notes: null, created_at: '2025-06-14T10:00:00Z' },
  { id: 'm3', product_id: 'p1', warehouse_id: 'w4', type: 'out', quantity: 12, user_id: 'u3', notes: 'Venda', created_at: '2025-06-14T11:15:00Z' },
  { id: 'm4', product_id: 'p7', warehouse_id: 'w4', type: 'out', quantity: 24, user_id: 'u3', notes: 'Venda', created_at: '2025-06-14T14:00:00Z' },
  { id: 'm5', product_id: 'p5', warehouse_id: 'w5', type: 'out', quantity: 3, user_id: 'u3', notes: null, created_at: '2025-06-14T15:30:00Z' },
  { id: 'm6', product_id: 'p4', warehouse_id: 'w6', type: 'out', quantity: 10, user_id: 'u3', notes: 'Venda a granel', created_at: '2025-06-14T16:00:00Z' },
  { id: 'm7', product_id: 'p9', warehouse_id: 'w5', type: 'in', quantity: 12, user_id: 'u2', notes: 'Restock', created_at: '2025-06-15T08:00:00Z' },
  { id: 'm8', product_id: 'p2', warehouse_id: 'w4', type: 'out', quantity: 8, user_id: 'u3', notes: null, created_at: '2025-06-15T10:30:00Z' },
  { id: 'm9', product_id: 'p10', warehouse_id: 'w5', type: 'out', quantity: 4, user_id: 'u3', notes: 'Venda', created_at: '2025-06-15T11:00:00Z' },
  { id: 'm10', product_id: 'p1', warehouse_id: 'w7', type: 'in', quantity: 60, user_id: 'u2', notes: 'Transferência para armazém secundário', created_at: '2025-06-15T14:00:00Z' },
];
mockMovements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// ── Returns ──
export const mockReturns: Return[] = [
  { id: 'r1', product_id: 'p2', warehouse_id: 'w4', quantity: 3, reason: 'Embalagem danificada', status: 'pending', resolution: null, user_id: 'u3', created_at: '2025-06-14T16:30:00Z' },
  { id: 'r2', product_id: 'p8', warehouse_id: 'w4', quantity: 1, reason: 'Produto expirado', status: 'scrapped', resolution: 'Abatido - validade ultrapassada', user_id: 'u3', created_at: '2025-06-13T10:00:00Z' },
  { id: 'r3', product_id: 'p5', warehouse_id: 'w5', quantity: 2, reason: 'Engano na saída', status: 'restocked', resolution: 'Reintegrado em stock', user_id: 'u3', created_at: '2025-06-12T09:00:00Z' },
];

// ── Dashboard KPIs ──
export const mockKPIs: DashboardKPIs = {
  total_products: mockProducts.length,
  total_capital: mockInventory.reduce((sum, inv) => {
    const product = mockProducts.find(p => p.id === inv.product_id);
    return sum + (product ? product.cost_price * inv.quantity : 0);
  }, 0),
  movements_today: 4,
  active_alerts: 5,
};

// ── Alerts ──
export const mockAlerts: Alert[] = [
  { id: 'a1', type: 'low_stock', message: 'Stock abaixo do mínimo', product_id: 'p4', product_name: 'Massa Esparguete 500g', warehouse_name: 'Prateleira B1', value: 15, threshold: 35, created_at: '2025-06-15T14:15:00Z' },
  { id: 'a2', type: 'low_stock', message: 'Stock abaixo do mínimo', product_id: 'p5', product_name: 'Detergente Roupa 3L', warehouse_name: 'Prateleira A2', value: 8, threshold: 15, created_at: '2025-06-15T14:20:00Z' },
  { id: 'a3', type: 'low_stock', message: 'Stock abaixo do mínimo', product_id: 'p10', product_name: 'Sabonete Líquido 500ml', warehouse_name: 'Prateleira A2', value: 5, threshold: 12, created_at: '2025-06-15T14:40:00Z' },
  { id: 'a4', type: 'expiring_batch', message: 'Lote a expirar em breve', product_id: 'p7', product_name: 'Leite Meio-Gordo 1L', warehouse_name: 'Prateleira A1', value: 5, threshold: 30, created_at: '2025-06-15T07:00:00Z' },
  { id: 'a5', type: 'expiring_batch', message: 'Lote a expirar em breve', product_id: 'p8', product_name: 'Iogurte Natural 4x125g', warehouse_name: 'Prateleira A1', value: 10, threshold: 30, created_at: '2025-06-15T07:05:00Z' },
];

// ── Helpers ──
export function getProductById(id: string) { return mockProducts.find(p => p.id === id); }
export function getWarehouseById(id: string) { return mockWarehousesFlat.find(w => w.id === id); }
export function getUserById(id: string) { return mockUsers.find(u => u.id === id); }
export function getInventoryForProduct(productId: string) { return mockInventory.filter(i => i.product_id === productId); }
export function getInventoryForWarehouse(warehouseId: string) { return mockInventory.filter(i => i.warehouse_id === warehouseId); }
export function getBatchesForProduct(productId: string) { return mockBatches.filter(b => b.product_id === productId); }
export function getMovementsForProduct(productId: string) { return mockMovements.filter(m => m.product_id === productId); }

export const categories = [...new Set(mockProducts.map(p => p.category))];
