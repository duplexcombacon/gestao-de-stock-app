import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/dexie';
import { addLocalMovement } from '@/services/movementStorage';
import type { Product, NewProductFormData, Movement } from '@/types';

// ── Funções auxiliares baseadas no Supabase e cache local ──

// Procura um produto por código de barras (pesquisa primeiro no cache se estiver offline)
export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  if (!navigator.onLine) {
    // Se estiver sem internet, procura no IndexedDB (Dexie)
    const cached = await db.cachedProducts.where('barcode').equals(barcode).first();
    return cached ? (cached as unknown as Product) : null;
  }

  // Se tiver internet, faz o pedido diretamente ao Supabase
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

function makeLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createMovement(
  type: 'in' | 'out',
  productId: string,
  warehouseId: string,
  quantity: number,
  notes?: string,
): Promise<void> {
  const userId = localStorage.getItem('stockflow_user_id') || 'offline-user';

  // ── Modo Offline ────────────────────────────────────────────
  if (!navigator.onLine) {
    console.log('[Offline] A guardar movimento pendente...');
    await db.pendingOps.add({
      type: 'movement',
      status: 'pending',
      payload: {
        p_product_id: productId,
        p_warehouse_id: warehouseId,
        p_type: type,
        p_quantity: quantity,
        p_user_id: userId,
        p_notes: notes || null,
      },
      created_at: new Date().toISOString(),
    });

    // Enriquecer com dados do cache Dexie para exibição imediata
    const [cachedProduct, cachedWarehouse] = await Promise.all([
      db.cachedProducts.get(productId),
      db.cachedWarehouses.get(warehouseId),
    ]);

    const localMovement: Movement = {
      id: makeLocalId(),
      type,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity,
      user_id: userId,
      notes: notes || null,
      created_at: new Date().toISOString(),
      product: cachedProduct
        ? { id: cachedProduct.id, sku: cachedProduct.sku, name: cachedProduct.name, category: cachedProduct.category, unit: cachedProduct.unit, cost_price: cachedProduct.cost_price, sell_price: 0, min_stock: cachedProduct.min_stock, barcode: cachedProduct.barcode, created_at: '' }
        : undefined,
      warehouse: cachedWarehouse
        ? { id: cachedWarehouse.id, name: cachedWarehouse.name, type: cachedWarehouse.type as any, parent_id: cachedWarehouse.parent_id, qr_code: cachedWarehouse.qr_code, created_at: '' }
        : undefined,
      user: { id: userId, name: localStorage.getItem('stockflow_user_name') || 'Utilizador', email: localStorage.getItem('stockflow_user_email') || '', role: 'caixa', created_at: '' },
    };
    addLocalMovement(localMovement);
    return;
  }

  // ── Modo Online ──────────────────────────────────────────────
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error('Utilizador não autenticado');

  const uid = userData.user.id;
  localStorage.setItem('stockflow_user_id', uid);

  // Buscar produto, armazém e perfil em paralelo para enriquecer o registo local
  const [productRes, warehouseRes, profileRes] = await Promise.all([
    supabase.from('products').select('id, name, sku, category, unit, cost_price, sell_price, min_stock, barcode, created_at').eq('id', productId).single(),
    supabase.from('warehouses').select('id, name, type, parent_id, qr_code, created_at').eq('id', warehouseId).single(),
    supabase.from('profiles').select('id, name, email, role, created_at').eq('id', uid).single(),
  ]);

  // Guardar nome do utilizador para uso offline futuro
  if (profileRes.data) {
    localStorage.setItem('stockflow_user_name', profileRes.data.name || '');
    localStorage.setItem('stockflow_user_email', profileRes.data.email || userData.user.email || '');
  }

  // Guardar no localStorage imediatamente — fonte de verdade local
  addLocalMovement({
    id: makeLocalId(),
    type,
    product_id: productId,
    warehouse_id: warehouseId,
    quantity,
    user_id: uid,
    notes: notes || null,
    created_at: new Date().toISOString(),
    product: productRes.data ? (productRes.data as any) : undefined,
    warehouse: warehouseRes.data ? (warehouseRes.data as any) : undefined,
    user: profileRes.data
      ? { id: profileRes.data.id, name: profileRes.data.name, email: profileRes.data.email || userData.user.email || '', role: profileRes.data.role || 'caixa', created_at: profileRes.data.created_at }
      : undefined,
  });

  // Tentar sincronizar com Supabase (best-effort; movimento já está no localStorage)
  const { error } = await supabase.rpc('create_movement', {
    p_product_id: productId,
    p_warehouse_id: warehouseId,
    p_type: type,
    p_quantity: quantity,
    p_user_id: uid,
    p_notes: notes || null,
  });

  if (error) {
    console.warn('[createMovement] Supabase RPC falhou, movimento guardado localmente:', error.message);
    // Não lançar erro — o movimento já foi guardado localmente
  }
}

// ── Hook Principal ──
// O hook 'useProducts' serve para carregar e gerir a lista de todos os produtos
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Função envolta em useCallback para não ser recriada a cada render
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
