import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { useWarehouseDetail } from '@/hooks/useWarehouses';
import { formatCurrency } from '@/utils/formatters';
import type { InventoryItem } from '@/types';

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { warehouse, inventory, isLoading } = useWarehouseDetail(id);

  if (isLoading) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar detalhes...</div>;
  }

  if (!warehouse) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <p>Armazém não encontrado</p>
        <button onClick={() => navigate('/armazens')} className="mt-3 text-accent hover:underline cursor-pointer">Voltar</button>
      </div>
    );
  }

  const totalItems = inventory.reduce((s, i) => s + i.quantity, 0);

  const columns: Column<InventoryItem>[] = [
    {
      key: 'product',
      header: 'Produto',
      render: (inv: any) => {
        const p = inv.products;
        return (
          <div>
            <p className="font-medium">{p?.name || '—'}</p>
            <p className="text-xs text-text-muted font-mono">{p?.sku}</p>
          </div>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      render: (inv: any) => {
        const p = inv.products;
        const isLow = p ? inv.quantity < p.min_stock : false;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono">{inv.quantity}</span>
            {isLow && <Badge variant="danger" dot>Baixo</Badge>}
          </div>
        );
      },
      sortable: true,
      sortFn: (a, b) => a.quantity - b.quantity,
    },
    {
      key: 'value',
      header: 'Valor',
      render: (inv: any) => {
        const p = inv.products;
        return <span className="font-mono text-text-secondary">{p ? formatCurrency(p.cost_price * inv.quantity) : '—'}</span>;
      },
      className: 'hidden sm:table-cell',
    },
  ];

  const typeLabels = { warehouse: 'Armazém', corridor: 'Corredor', shelf: 'Prateleira' };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/armazens')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Header */}
      <div className="bg-surface-raised border border-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="accent">{typeLabels[warehouse.type as keyof typeof typeLabels]}</Badge>
          <h2 className="text-xl font-bold mt-2">{warehouse.name}</h2>
          <p className="text-sm text-text-muted mt-1">{totalItems} unidades · {inventory.length} produtos</p>
        </div>
        <Button variant="secondary" icon={<QrCode size={16} />}>
          Gerar QR Code
        </Button>
      </div>

      {/* Inventory */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Inventário</h3>
        <Table
          columns={columns}
          data={inventory}
          keyExtractor={(inv) => inv.id}
          onRowClick={(inv) => navigate(`/produtos/${inv.product_id}`)}
          emptyMessage="Sem produtos nesta localização"
        />
      </div>
    </div>
  );
}
