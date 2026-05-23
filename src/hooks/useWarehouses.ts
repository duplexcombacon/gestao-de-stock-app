import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Warehouse, InventoryItem, Product } from '@/types';

// ── Supabase-ready functions ──

export async function findWarehouseByQrCode(qrCode: string): Promise<Warehouse | null> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('qr_code', qrCode)
    .single();
  if (error || !data) return null;
  return data as Warehouse;
}

export async function getInventoryByWarehouse(
  warehouseId: string,
): Promise<(InventoryItem & { product: Product })[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*, product:products(*)')
    .eq('warehouse_id', warehouseId);

  if (error || !data) return [];
  // PostgREST typically returns joined data wrapped in the key name (or an array).
  // Assuming a 1-to-1 or single mapping where product is an object.
  const mapped = data.map((d: any) => ({
    ...d,
    product: d.products // handle naming differences
  }));
  return mapped as unknown as (InventoryItem & { product: Product })[];
}

// Helper to build tree
function buildTree(flatWarehouses: Warehouse[]): Warehouse[] {
  const map = new Map<string, Warehouse>();
  const roots: Warehouse[] = [];

  const flat = JSON.parse(JSON.stringify(flatWarehouses));

  flat.forEach((w: Warehouse) => {
    w.children = [];
    map.set(w.id, w);
  });

  flat.forEach((w: Warehouse) => {
    if (w.parent_id) {
      const parent = map.get(w.parent_id);
      if (parent) {
        parent.children!.push(w);
      }
    } else {
      roots.push(w);
    }
  });

  return roots;
}

// ── Hook ──
export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesFlat, setWarehousesFlat] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (data) {
      const flat = data as Warehouse[];
      setWarehousesFlat(flat);
      setWarehouses(buildTree(flat));
    } else {
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return { warehouses, warehousesFlat, isLoading, refreshWarehouses: fetchWarehouses };
}

// ── Hook for Warehouse Details ──
export function useWarehouseDetail(id: string | undefined) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [whRes, invRes] = await Promise.all([
        supabase.from('warehouses').select('*').eq('id', id).single(),
        supabase.from('inventory').select('*, products(*)').eq('warehouse_id', id)
      ]);

      if (whRes.data) setWarehouse(whRes.data as Warehouse);
      if (invRes.data) setInventory(invRes.data);
    } catch (e) {
      console.error('Error fetching warehouse detail:', e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { warehouse, inventory, isLoading, refresh: fetchDetail };
}
