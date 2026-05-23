import { mockWarehouses, mockWarehousesFlat, mockInventory } from '@/data/mock';

export function useWarehouses() {
  const warehouses = mockWarehouses;
  const warehousesFlat = mockWarehousesFlat;
  const isLoading = false;
  const getInventory = (warehouseId: string) => mockInventory.filter(i => i.warehouse_id === warehouseId);
  return { warehouses, warehousesFlat, isLoading, getInventory };
}
