import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WarehouseTree } from '@/components/domain/WarehouseTree';
import { useWarehouses } from '@/hooks/useWarehouses';

export default function WarehousesList() {
  const { warehouses, isLoading } = useWarehouses();

  if (isLoading) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar armazéns...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {warehouses.length} armazén{warehouses.length !== 1 ? 's' : ''} principal{warehouses.length !== 1 ? 'is' : ''}
        </p>
        <Button icon={<Plus size={16} />} size="sm" onClick={() => window.location.assign('/armazens/novo')}>Nova Localização</Button>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-4">
        {warehouses.length > 0 ? (
          <WarehouseTree warehouses={warehouses} />
        ) : (
          <p className="text-sm text-text-muted text-center py-4">Nenhum armazém encontrado.</p>
        )}
      </div>
    </div>
  );
}
