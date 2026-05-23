import { mockProducts, mockInventory } from '@/data/mock';
import type { Product, NewProductFormData } from '@/types';

// ── Supabase-ready functions (mock fallback active) ──

/**
 * Find a product by its barcode value.
 * TODO: supabase.from('products').select('*').eq('barcode', barcode).maybeSingle()
 */
export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  return mockProducts.find(p => p.barcode === barcode) ?? null;
}

/**
 * Create a new product from a scanned barcode form submission.
 * TODO: supabase.from('products').insert(data).select().single()
 */
export async function createProductFromBarcode(data: NewProductFormData): Promise<Product> {
  const newProduct: Product = {
    id: `p${Date.now()}`,
    sku: data.sku,
    name: data.name,
    category: data.category,
    unit: data.unit,
    cost_price: data.cost_price,
    min_stock: data.min_stock,
    barcode: data.barcode,
    created_at: new Date().toISOString(),
  };
  mockProducts.push(newProduct);
  return newProduct;
}

/**
 * Register a stock movement (entry or exit) for a product at a warehouse.
 * TODO: supabase.from('movements').insert({ type, product_id, warehouse_id, quantity, notes, user_id })
 *       and update inventory via trigger or supabase.rpc('apply_movement')
 */
export async function createMovement(
  type: 'in' | 'out',
  productId: string,
  warehouseId: string,
  quantity: number,
  notes?: string,
): Promise<void> {
  // Optimistically update mock inventory
  const inv = mockInventory.find(
    i => i.product_id === productId && i.warehouse_id === warehouseId,
  );
  if (inv) {
    inv.quantity = type === 'in'
      ? inv.quantity + quantity
      : Math.max(0, inv.quantity - quantity);
    inv.updated_at = new Date().toISOString();
  } else if (type === 'in') {
    mockInventory.push({
      id: `inv${Date.now()}`,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity,
      updated_at: new Date().toISOString(),
    });
  }
  console.log('[Mock] createMovement', { type, productId, warehouseId, quantity, notes });
}

// ── Hook ──
export function useProducts() {
  const products = mockProducts;
  const isLoading = false;
  const getStockTotal = (productId: string) =>
    mockInventory.filter(i => i.product_id === productId).reduce((s, i) => s + i.quantity, 0);
  const createProduct = async (_data: Partial<Product>) => { /* TODO: supabase.from('products').insert */ };
  return { products, isLoading, getStockTotal, createProduct };
}
