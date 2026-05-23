import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Warehouse as WarehouseIcon, CornerDownRight, Grid3X3, QrCode, Plus } from 'lucide-react';
import { cn } from '@/utils/formatters';
import type { Warehouse } from '@/types';

const typeIcons = {
  warehouse: WarehouseIcon,
  corridor: CornerDownRight,
  shelf: Grid3X3,
};

const typeLabels = {
  warehouse: 'Armazém',
  corridor: 'Corredor',
  shelf: 'Prateleira',
};

interface WarehouseNodeProps {
  warehouse: Warehouse;
  depth?: number;
}

function WarehouseNode({ warehouse, depth = 0 }: WarehouseNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const navigate = useNavigate();
  const hasChildren = warehouse.children && warehouse.children.length > 0;
  const Icon = typeIcons[warehouse.type];

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors group',
          'hover:bg-surface-overlay cursor-pointer',
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={cn('size-5 flex items-center justify-center transition-transform', !hasChildren && 'invisible')}
        >
          <ChevronRight size={14} className={cn('text-text-muted transition-transform', expanded && 'rotate-90')} />
        </button>

        {/* Icon + Name */}
        <div
          className="flex items-center gap-2.5 flex-1 min-w-0"
          onClick={() => navigate(`/armazens/${warehouse.id}`)}
        >
          <Icon size={16} className="text-text-muted shrink-0" />
          <span className="text-sm font-medium truncate">{warehouse.name}</span>
          <span className="text-xs text-text-muted">{typeLabels[warehouse.type]}</span>
        </div>

        {/* Actions */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/armazens/${warehouse.id}/qr`); }}
            className="p-1 rounded text-text-muted hover:text-accent transition-colors cursor-pointer"
            title="Gerar QR Code"
          >
            <QrCode size={14} />
          </button>
          {warehouse.type !== 'shelf' && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/armazens/novo?parent=${warehouse.id}`); }}
              className="p-1 rounded text-text-muted hover:text-accent transition-colors cursor-pointer"
              title="Adicionar sub-armazém"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {warehouse.children!.map(child => (
            <WarehouseNode key={child.id} warehouse={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function WarehouseTree({ warehouses }: { warehouses: Warehouse[] }) {
  return (
    <div className="space-y-1">
      {warehouses.map(w => (
        <WarehouseNode key={w.id} warehouse={w} />
      ))}
    </div>
  );
}
