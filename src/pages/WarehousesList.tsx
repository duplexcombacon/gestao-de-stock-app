import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WarehouseTree } from '@/components/domain/WarehouseTree';
import { mockWarehouses } from '@/data/mock';

export default function WarehousesList() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {mockWarehouses.length} armazén{mockWarehouses.length !== 1 ? 's' : ''} registado{mockWarehouses.length !== 1 ? 's' : ''}
        </p>
        <Button icon={<Plus size={16} />} size="sm" onClick={() => window.location.assign('/armazens/novo')}>Nova Localização</Button>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-4">
        <WarehouseTree warehouses={mockWarehouses} />
      </div>
    </div>
  );
}
