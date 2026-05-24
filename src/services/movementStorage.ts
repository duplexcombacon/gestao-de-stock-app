import type { Movement } from '@/types';

const STORAGE_KEY = 'stockflow_movements';
const MAX_ENTRIES = 500;

export function getLocalMovements(): Movement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Movement[]) : [];
  } catch {
    return [];
  }
}

export function addLocalMovement(movement: Movement): void {
  try {
    const list = getLocalMovements();
    list.unshift(movement); // mais recente primeiro
    if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Sinalização para o hook useMovements invalidar a query
    window.dispatchEvent(new CustomEvent('stockflow:movements-updated'));
  } catch {
    console.warn('[movementStorage] Não foi possível guardar o movimento localmente.');
  }
}

export function clearLocalMovements(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportMovementsCSV(movements: Movement[]): void {
  const header = 'Data,Utilizador,Tipo,Produto,SKU,Quantidade,Local,Notas\n';
  const rows = movements.map((m: any) =>
    [
      m.created_at,
      m.user?.name || m.user_id || '',
      m.type,
      m.product?.name || m.product_id || '',
      m.product?.sku || '',
      m.quantity,
      m.warehouse?.name || m.warehouse_id || '',
      m.notes || '',
    ].join(','),
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `movimentos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
