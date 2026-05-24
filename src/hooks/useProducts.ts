import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/dexie';
import type { Product, NewProductFormData } from '@/types';

// ── Supabase-ready functions ──

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  if (!navigator.onLine) {
    const cached = await db.cachedProducts.where('barcode').equals(barcode).first();
    return cached ? (cached as unknown as Product) : null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();
  if (error || !data) return null;
  return data as Product;
}

export async function createProductFromBarcode(data: NewProductFormData): Promise<Product> {
  const { data: newProduct, error } = await supabase
    .from('products')
    .insert({
      sku: data.sku,
      name: data.name,
      category: data.category,
      unit: data.unit,
      cost_price: data.cost_price,
      sell_price: data.sell_price,
      min_stock: data.min_stock,
      barcode: data.barcode,
    })
    .select()
    .single();
  
  if (error) throw error;
  return newProduct as Product;
}

export async function createMovement(
  type: 'in' | 'out',
  productId: string,
  warehouseId: string,
  quantity: number,
  notes?: string,
): Promise<void> {
  // If offline, queue the operation
  if (!navigator.onLine) {
    console.log('[Offline] A guardar movimento pendente...');
    // Try to get user from local profile if available, or just use a placeholder
    // In a real app we'd cache the user ID in localStorage during login
    const userId = localStorage.getItem('stockflow_user_id') || 'offline-user';
    
    await db.pendingOps.add({
      type: 'movement',
      status: 'pending',
      payload: {
        p_product_id: productId,
        p_warehouse_id: warehouseId,
        p_type: type,
        p_quantity: quantity,
        p_user_id: userId,
        p_notes: notes || null
      },
      created_at: new Date().toISOString()
    });
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Utilizador não autenticado");

  // Save ID for offline use
  localStorage.setItem('stockflow_user_id', userData.user.id);

  const { error } = await supabase.rpc('create_movement', {
    p_product_id: productId,
    p_warehouse_id: warehouseId,
    p_type: type,
    p_quantity: quantity,
    p_user_id: userData.user.id,
    p_notes: notes || null
  });

  if (error) throw error;
}

// ── Hook ──
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsRes, inventoryRes] = await Promise.all([
        supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }),
        supabase.from('inventory').select('*')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (inventoryRes.error) throw inventoryRes.error;

      setProducts((productsRes.data as Product[]) || []);
      setInventory(inventoryRes.data || []);
    } catch (e: any) {
      console.error('Error fetching products:', e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getStockTotal = useCallback((productId: string) => {
    return inventory.filter(i => i.product_id === productId).reduce((s, i) => s + i.quantity, 0);
  }, [inventory]);

  const createProduct = async (data: Partial<Product>) => {
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    if (newProduct) setProducts(prev => [newProduct as Product, ...prev]);
    return newProduct;
  };

  return { products, isLoading, error, getStockTotal, createProduct, refreshProducts: fetchProducts };
}

// ── Hook for Product Details ──
export function useProductDetail(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [prodRes, invRes, batchRes, movRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('inventory').select('*, warehouses(name)').eq('product_id', id),
        supabase.from('batches').select('*, warehouses(name)').eq('product_id', id).order('expiry_date', { ascending: true }),
        supabase.from('movements').select('*, profiles(name), warehouses(name)').eq('product_id', id).order('created_at', { ascending: false })
      ]);

      if (prodRes.data) setProduct(prodRes.data as Product);
      if (invRes.data) setInventory(invRes.data);
      if (batchRes.data) setBatches(batchRes.data);
      if (movRes.data) setMovements(movRes.data);
    } catch (e) {
      console.error('Error fetching product detail:', e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { product, inventory, batches, movements, isLoading, refresh: fetchDetail };
}
