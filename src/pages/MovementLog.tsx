import { useState } from 'react';
import { Download } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { useMovements } from '@/hooks/useMovements';
import { formatDateTime } from '@/utils/formatters';
import type { Movement } from '@/types';

export default function MovementLog() {
  const { movements, isLoading } = useMovements();
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  const filtered = movements.filter((m: any) => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (userFilter !== 'all' && m.user_id !== userFilter) return false;
    if (productFilter !== 'all' && m.product_id !== productFilter) return false;
    return true;
  });

  const uniqueUsers = Array.from(new Map(movements.filter((m: any) => m.user).map((m: any) => [m.user_id, m.user.name])).entries());
  const uniqueProducts = Array.from(new Map(movements.filter((m: any) => m.product).map((m: any) => [m.product_id, m.product.name])).entries());

  const exportCSV = () => {
    const header = 'Data,Utilizador,Tipo,Produto,Quantidade,Local,Notas\n';
    const rows = filtered.map((m: any) => {
      return `${m.created_at},${m.user?.name || ''},${m.type},${m.product?.name || ''},${m.quantity},${m.warehouse?.name || ''},${m.notes || ''}`;
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
      render: (m: any) => <span className="text-text-secondary">{m.user?.name || '—'}</span>,
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
      render: (m: any) => {
        const p = m.product;
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
      render: (m: any) => <span className="text-text-muted text-sm">{m.warehouse?.name || '—'}</span>,
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
            ...uniqueUsers.map(([id, name]) => ({ value: id as string, label: name as string })),
          ]}
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
        />
        <Select
          label="Produto"
          options={[
            { value: 'all', label: 'Todos' },
            ...uniqueProducts.map(([id, name]) => ({ value: id as string, label: name as string })),
          ]}
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
        />
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={exportCSV}>
          CSV
        </Button>
      </div>

      <Table columns={columns} data={filtered} keyExtractor={(m) => m.id} emptyMessage={isLoading ? "A carregar movimentos..." : "Sem movimentos"} />
    </div>
  );
}
