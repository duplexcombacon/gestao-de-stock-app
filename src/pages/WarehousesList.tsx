import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderOpen, FolderClosed } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { WarehouseTree } from '@/components/domain/WarehouseTree';
import { useWarehouses } from '@/hooks/useWarehouses';

export default function WarehousesList() {
  const navigate = useNavigate();
  const { warehouses, isLoading } = useWarehouses();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [forceExpand, setForceExpand] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar armazéns...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Armazéns</h2>
          <p className="text-sm text-text-secondary mt-1">
            {warehouses.length} armazén{warehouses.length !== 1 ? 's' : ''} principal{warehouses.length !== 1 ? 'is' : ''}
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => navigate('/armazens/novo')}>
          Nova Localização
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Input 
            placeholder="Pesquisar por nome de localização..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            icon={<FolderOpen size={16} />}
            onClick={() => setForceExpand(true)}
            title="Expandir Tudo"
          >
            <span className="hidden sm:inline">Expandir</span>
          </Button>
          <Button 
            variant="outline" 
            icon={<FolderClosed size={16} />}
            onClick={() => setForceExpand(false)}
            title="Recolher Tudo"
          >
            <span className="hidden sm:inline">Recolher</span>
          </Button>
        </div>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-4">
        {warehouses.length > 0 ? (
          <WarehouseTree 
            warehouses={warehouses} 
            searchQuery={searchQuery}
            forceExpand={forceExpand}
          />
        ) : (
          <p className="text-sm text-text-muted text-center py-4">Nenhuma localização registada.</p>
        )}
      </div>
    </div>
  );
}
