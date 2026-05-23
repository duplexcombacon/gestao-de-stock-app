import { mockWarehouses, mockWarehousesFlat, mockInventory, mockProducts } from '@/data/mock';
import type { Warehouse, InventoryItem, Product } from '@/types';

// ── Supabase-ready functions (mock fallback active) ──

/**
 * Find a warehouse/corridor/shelf by its QR code value.
 * TODO: supabase.from('warehouses').select('*').eq('qr_code', qrCode).maybeSingle()
 */
export async function findWarehouseByQrCode(qrCode: string): Promise<Warehouse | null> {
  return mockWarehousesFlat.find(w => w.qr_code === qrCode) ?? null;
}

/**
 * Get all inventory items for a given warehouse, with product data joined.
 * TODO: supabase.from('inventory').select('*, product:products(*)').eq('warehouse_id', warehouseId)
 */
export async function getInventoryByWarehouse(
  warehouseId: string,
): Promise<(InventoryItem & { product: Product })[]> {
  return mockInventory
    .filter(i => i.warehouse_id === warehouseId)
    .flatMap(i => {
      const product = mockProducts.find(p => p.id === i.product_id);
      return product ? [{ ...i, product }] : [];
    });
}

// ── Hook ──
export function useWarehouses() {
  const warehouses = mockWarehouses;
  const warehousesFlat = mockWarehousesFlat;
  const isLoading = false;
  const getInventory = (warehouseId: string) => mockInventory.filter(i => i.warehouse_id === warehouseId);
  return { warehouses, warehousesFlat, isLoading, getInventory };
}
