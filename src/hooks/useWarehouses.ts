import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/dexie';
import type { Warehouse, InventoryItem, Product } from '@/types';

// Estende o modelo base de 'Warehouse' para incluir métricas que vamos calcular no ecrã principal (dashboard/listagem)
export interface WarehouseWithMetrics extends Warehouse {
  children?: WarehouseWithMetrics[];
  metrics: {
    totalItems: number;
    uniqueSkus: number;
    lowStockAlerts: number;
  };
}

// ── Funções auxiliares (ligação ao Supabase e base de dados offline) ──

// Tenta procurar um armazém pelo seu QR Code (útil quando usamos a câmara)
export async function findWarehouseByQrCode(qrCode: string): Promise<Warehouse | null> {
  if (!navigator.onLine) {
    const cached = await db.cachedWarehouses.where('qr_code').equals(qrCode).first();
    return cached ? (cached as unknown as Warehouse) : null;
  }

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
  if (!navigator.onLine) {
    const cachedInv = await db.cachedInventory.where('warehouse_id').equals(warehouseId).toArray();
    const result = [];
    for (const inv of cachedInv) {
      const product = await db.cachedProducts.get(inv.product_id);
      if (product) {
        result.push({
          id: `${inv.product_id}_${inv.warehouse_id}`,
          product_id: inv.product_id,
          warehouse_id: inv.warehouse_id,
          quantity: inv.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: product as unknown as Product
        });
      }
    }
    return result;
  }

  const { data, error } = await supabase
    .from('inventory')
    .select('*, product:products(*)')
    .eq('warehouse_id', warehouseId);

  if (error || !data) return [];
  const mapped = data.map((d: any) => ({
    ...d,
    product: d.products || d.product
  }));
  return mapped as unknown as (InventoryItem & { product: Product })[];
}

// Helper to build tree and compute metrics
function buildTreeWithMetrics(flatWarehouses: Warehouse[], inventoryData: any[]): WarehouseWithMetrics[] {
  const map = new Map<string, WarehouseWithMetrics>();
  const roots: WarehouseWithMetrics[] = [];

  // Initialize nodes
  flatWarehouses.forEach(w => {
    map.set(w.id, { 
      ...w, 
      children: [], 
      metrics: { totalItems: 0, uniqueSkus: 0, lowStockAlerts: 0 } 
    });
  });

  // Calculate direct inventory metrics
  const invByWarehouse = new Map<string, any[]>();
  inventoryData.forEach(inv => {
    if (!invByWarehouse.has(inv.warehouse_id)) {
      invByWarehouse.set(inv.warehouse_id, []);
    }
    invByWarehouse.get(inv.warehouse_id)!.push(inv);
  });

  map.forEach(w => {
    const invs = invByWarehouse.get(w.id) || [];
    w.metrics.uniqueSkus = invs.length;
    w.metrics.totalItems = invs.reduce((sum, item) => sum + item.quantity, 0);
    w.metrics.lowStockAlerts = invs.filter(item => {
      // product could be an object if from supabase, or we just have min_stock directly if from a joined query
      const minStock = item.products?.min_stock ?? item.product?.min_stock ?? 0;
      return item.quantity < minStock;
    }).length;
  });

  // Build tree
  map.forEach(w => {
    if (w.parent_id) {
      const parent = map.get(w.parent_id);
      if (parent) {
        parent.children!.push(w);
      }
    } else {
      roots.push(w);
    }
  });

  // Aggregate metrics recursively (bottom-up approach)
  // We need to traverse the tree and sum up metrics for parents
  function aggregateMetrics(node: WarehouseWithMetrics) {
    if (!node.children || node.children.length === 0) return;
    
    node.children.forEach(child => {
      aggregateMetrics(child);
      node.metrics.totalItems += child.metrics.totalItems;
      node.metrics.uniqueSkus += child.metrics.uniqueSkus;
      node.metrics.lowStockAlerts += child.metrics.lowStockAlerts;
    });
  }

  roots.forEach(aggregateMetrics);

  return roots;
}

// ── Hook ──
export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<WarehouseWithMetrics[]>([]);
  const [warehousesFlat, setWarehousesFlat] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    let whData: any[] = [];
    let invData: any[] = [];

    if (!navigator.onLine) {
      whData = await db.cachedWarehouses.toArray();
      const rawInv = await db.cachedInventory.toArray();
      // For offline, we also need product min_stock for alerts
      const products = await db.cachedProducts.toArray();
      const productMap = new Map(products.map(p => [p.id, p]));
      
      invData = rawInv.map(inv => ({
        ...inv,
        products: { min_stock: productMap.get(inv.product_id)?.min_stock || 0 }
      }));
    } else {
      const [whRes, invRes] = await Promise.all([
        supabase.from('warehouses').select('*').order('created_at', { ascending: true }),
        supabase.from('inventory').select('warehouse_id, quantity, product_id, products(min_stock)')
      ]);
      
      if (whRes.data) whData = whRes.data;
      if (invRes.data) invData = invRes.data;
    }

    if (whData) {
      const flat = whData as Warehouse[];
      setWarehousesFlat(flat);
      setWarehouses(buildTreeWithMetrics(flat, invData));
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
      if (!navigator.onLine) {
        const wh = await db.cachedWarehouses.get(id);
        if (wh) setWarehouse(wh as unknown as Warehouse);
        
        const cachedInv = await db.cachedInventory.where('warehouse_id').equals(id).toArray();
        const fullInv = [];
        for (const inv of cachedInv) {
          const product = await db.cachedProducts.get(inv.product_id);
          fullInv.push({
            ...inv,
            products: product // join simulation
          });
        }
        setInventory(fullInv);
      } else {
        const [whRes, invRes] = await Promise.all([
          supabase.from('warehouses').select('*').eq('id', id).single(),
          supabase.from('inventory').select('*, products(*)').eq('warehouse_id', id)
        ]);

        if (whRes.data) setWarehouse(whRes.data as Warehouse);
        if (invRes.data) setInventory(invRes.data);
      }
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
