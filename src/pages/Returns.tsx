import { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, type Column } from '@/components/ui/Table';
import { mockReturns, getProductById, getUserById } from '@/data/mock';
import { formatDateTime } from '@/utils/formatters';
import type { Return, ReturnStatus } from '@/types';

const statusConfig: Record<ReturnStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  restocked: { label: 'Reintegrado', variant: 'success' },
  scrapped: { label: 'Abatido', variant: 'danger' },
};

export default function Returns() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Return | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = mockReturns.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  );

  const handleResolve = (action: 'restock' | 'scrap') => {
    if (!selected) return;
    // TODO: call supabase.rpc('resolve_return', { id: selected.id, action })
    console.log(`Resolve return ${selected.id} → ${action}`);
    setShowModal(false);
    setSelected(null);
  };

  const columns: Column<Return>[] = [
    {
      key: 'date', header: 'Data',
      render: (r) => <span className="text-xs">{formatDateTime(r.created_at)}</span>,
    },
    {
      key: 'product', header: 'Produto',
      render: (r) => {
        const p = getProductById(r.product_id);
        return <span className="font-medium">{p?.name || '—'}</span>;
      },
    },
    {
      key: 'qty', header: 'Qtd',
      render: (r) => <span className="font-mono">{r.quantity}</span>,
    },
    {
      key: 'reason', header: 'Razão',
      render: (r) => <span className="text-text-secondary text-sm">{r.reason}</span>,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'user', header: 'Registado por',
      render: (r) => <span className="text-text-muted">{getUserById(r.user_id)?.name || '—'}</span>,
      className: 'hidden md:table-cell',
    },
    {
      key: 'status', header: 'Estado',
      render: (r) => {
        const cfg = statusConfig[r.status];
        return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        <Select
          label="Estado"
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'restocked', label: 'Reintegrados' },
            { value: 'scrapped', label: 'Abatidos' },
          ]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
        <Button icon={<Plus size={16} />} size="sm" onClick={() => navigate('/devolucoes/nova')}>Nova Devolução</Button>
      </div>

      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => {
          if (r.status === 'pending') {
            setSelected(r);
            setShowModal(true);
          }
        }}
      />

      {/* Resolve modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Resolver Devolução" size="sm">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary">Produto</p>
              <p className="font-medium">{getProductById(selected.product_id)?.name}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Razão</p>
              <p>{selected.reason}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Quantidade</p>
              <p className="font-mono">{selected.quantity} un</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="success"
                icon={<Check size={16} />}
                onClick={() => handleResolve('restock')}
                className="flex-1"
              >
                Reintegrar
              </Button>
              <Button
                variant="danger"
                icon={<X size={16} />}
                onClick={() => handleResolve('scrap')}
                className="flex-1"
              >
                Abater
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
