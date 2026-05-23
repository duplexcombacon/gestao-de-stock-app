import { useState } from 'react';
import { Download } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { mockMovements, getProductById, getWarehouseById, getUserById, mockProducts, mockUsers } from '@/data/mock';
import { formatDateTime } from '@/utils/formatters';
import type { Movement } from '@/types';

export default function MovementLog() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  const filtered = mockMovements.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (userFilter !== 'all' && m.user_id !== userFilter) return false;
    if (productFilter !== 'all' && m.product_id !== productFilter) return false;
    return true;
  });

  const exportCSV = () => {
    const header = 'Data,Utilizador,Tipo,Produto,Quantidade,Local,Notas\n';
    const rows = filtered.map(m => {
      const user = getUserById(m.user_id);
      const product = getProductById(m.product_id);
      const wh = getWarehouseById(m.warehouse_id);
      return `${m.created_at},${user?.name},${m.type},${product?.name},${m.quantity},${wh?.name},${m.notes || ''}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'movimentos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<Movement>[] = [
    {
      key: 'date', header: 'Data/Hora',
      render: (m) => <span className="text-xs whitespace-nowrap">{formatDateTime(m.created_at)}</span>,
      sortable: true,
      sortFn: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      key: 'user', header: 'Utilizador',
      render: (m) => <span className="text-text-secondary">{getUserById(m.user_id)?.name || '—'}</span>,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'type', header: 'Tipo',
      render: (m) => (
        <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'danger' : 'accent'}>
          {m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Saída' : 'Transfer.'}
        </Badge>
      ),
    },
    {
      key: 'product', header: 'Produto',
      render: (m) => {
        const p = getProductById(m.product_id);
        return (
          <div>
            <p className="font-medium text-sm">{p?.name || '—'}</p>
            <p className="text-xs text-text-muted font-mono">{p?.sku}</p>
          </div>
        );
      },
    },
    {
      key: 'qty', header: 'Qtd',
      render: (m) => (
        <span className={`font-mono font-semibold ${m.type === 'in' ? 'text-success' : 'text-danger'}`}>
          {m.type === 'in' ? '+' : '-'}{m.quantity}
        </span>
      ),
    },
    {
      key: 'location', header: 'Local',
      render: (m) => <span className="text-text-muted text-sm">{getWarehouseById(m.warehouse_id)?.name || '—'}</span>,
      className: 'hidden md:table-cell',
    },
    {
      key: 'notes', header: 'Notas',
      render: (m) => <span className="text-text-muted text-xs">{m.notes || '—'}</span>,
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Tipo"
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'in', label: 'Entradas' },
            { value: 'out', label: 'Saídas' },
            { value: 'transfer', label: 'Transferências' },
          ]}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        />
        <Select
          label="Utilizador"
          options={[
            { value: 'all', label: 'Todos' },
            ...mockUsers.map(u => ({ value: u.id, label: u.name })),
          ]}
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
        />
        <Select
          label="Produto"
          options={[
            { value: 'all', label: 'Todos' },
            ...mockProducts.map(p => ({ value: p.id, label: p.name })),
          ]}
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
        />
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={exportCSV}>
          CSV
        </Button>
      </div>

      <Table columns={columns} data={filtered} keyExtractor={(m) => m.id} />
    </div>
  );
}
