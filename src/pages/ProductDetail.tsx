import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Warehouse, AlertTriangle, Pencil, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { useProductDetail } from '@/hooks/useProducts';
import { formatCurrency, formatDate, formatDateTime, daysUntil } from '@/utils/formatters';
import type { Batch, Movement } from '@/types';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, inventory, batches, movements, isLoading } = useProductDetail(id);

  if (isLoading) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar detalhes...</div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <p>Produto não encontrado</p>
        <button onClick={() => navigate('/produtos')} className="mt-3 text-accent hover:underline cursor-pointer">
          Voltar ao catálogo
        </button>
      </div>
    );
  }


  const totalStock = inventory.reduce((s, i) => s + i.quantity, 0);
  const isLow = totalStock < product.min_stock;

  const batchColumns: Column<Batch>[] = [
    { key: 'code', header: 'Lote', render: (b) => <span className="font-mono text-xs">{b.batch_code}</span> },
    { key: 'qty', header: 'Qtd', render: (b) => <span className="font-mono">{b.quantity}</span> },
    {
      key: 'expiry', header: 'Validade', render: (b) => {
        const d = daysUntil(b.expiry_date);
        return (
          <div className="flex items-center gap-2">
            <span>{formatDate(b.expiry_date)}</span>
            {d <= 30 && <Badge variant={d <= 7 ? 'danger' : 'warning'} dot>{d}d</Badge>}
          </div>
        );
      }
    },
    { key: 'warehouse', header: 'Local', render: (b: any) => <span className="text-text-muted">{b.warehouses?.name || '—'}</span> },
  ];

  const movementColumns: Column<Movement>[] = [
    { key: 'date', header: 'Data', render: (m) => <span className="text-xs text-text-muted">{formatDateTime(m.created_at)}</span> },
    {
      key: 'type', header: 'Tipo', render: (m) => (
        <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'danger' : 'accent'}>
          {m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Saída' : 'Transferência'}
        </Badge>
      )
    },
    { key: 'qty', header: 'Qtd', render: (m) => <span className="font-mono">{m.type === 'out' ? '-' : '+'}{m.quantity}</span> },
    { key: 'user', header: 'Utilizador', render: (m: any) => <span className="text-text-muted">{m.profiles?.name || '—'}</span>, className: 'hidden sm:table-cell' },
    { key: 'notes', header: 'Notas', render: (m) => <span className="text-text-muted text-xs truncate max-w-[150px] inline-block">{m.notes || '—'}</span>, className: 'hidden md:table-cell' },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Header */}
      <div className="bg-surface-raised border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">{product.sku}</p>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary">
              <span>{product.category}</span>
              <span className="text-text-muted">·</span>
              <span>{formatCurrency(product.cost_price)} / {product.unit}</span>
            </div>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-3xl font-bold font-mono">{totalStock}</p>
              <p className="text-sm text-text-muted">unidades em stock</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => navigate(`/produtos/${product.id}/editar`)}>Editar</Button>
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => navigate(`/produtos/${product.id}/lotes/novo`)}>Lote</Button>
            </div>
            {isLow && (
              <Badge variant="danger" dot className="mt-2">
                <AlertTriangle size={12} /> Abaixo do mínimo ({product.min_stock})
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stock by warehouse */}
      <div className="bg-surface-raised border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4">Distribuição por Armazém</h3>
        <div className="space-y-2">
          {inventory.map(inv => {
            const pct = totalStock > 0 ? (inv.quantity / totalStock) * 100 : 0;
            return (
              <div key={inv.id} className="flex items-center gap-3">
                <Warehouse size={14} className="text-text-muted shrink-0" />
                <span className="text-sm min-w-[140px]">{inv.warehouses?.name || '—'}</span>
                <div className="flex-1 bg-surface-overlay rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-mono w-12 text-right">{inv.quantity}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batches */}
      {batches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Lotes e Validades</h3>
          <Table columns={batchColumns} data={batches} keyExtractor={(b) => b.id} />
        </div>
      )}

      {/* Movements */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Histórico de Movimentos</h3>
        <Table columns={movementColumns} data={movements} keyExtractor={(m) => m.id} pageSize={5} />
      </div>
    </div>
  );
}
