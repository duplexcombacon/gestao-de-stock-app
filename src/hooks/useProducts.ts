import { mockProducts, mockInventory } from '@/data/mock';
import type { Product } from '@/types';

export function useProducts() {
  const products = mockProducts;
  const isLoading = false;
  const getStockTotal = (productId: string) =>
    mockInventory.filter(i => i.product_id === productId).reduce((s, i) => s + i.quantity, 0);
  const createProduct = async (_data: Partial<Product>) => { /* TODO: supabase.from('products').insert */ };
  return { products, isLoading, getStockTotal, createProduct };
}
