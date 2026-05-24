import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Warehouse as WarehouseIcon, CornerDownRight, Grid3X3, QrCode, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/formatters';
import type { WarehouseWithMetrics } from '@/hooks/useWarehouses';

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
  warehouse: WarehouseWithMetrics;
  depth?: number;
  searchQuery?: string;
  forceExpand?: boolean;
}

function WarehouseNode({ warehouse, depth = 0, searchQuery = '', forceExpand = false }: WarehouseNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const navigate = useNavigate();
  const hasChildren = warehouse.children && warehouse.children.length > 0;
  const Icon = typeIcons[warehouse.type as keyof typeof typeIcons] || WarehouseIcon;

  // React to forceExpand prop changes
  useEffect(() => {
    if (forceExpand !== undefined) {
      setExpanded(forceExpand);
    }
  }, [forceExpand]);

  // If there's a search query, always expand
  useEffect(() => {
    if (searchQuery) setExpanded(true);
  }, [searchQuery]);

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
          <span className="text-[10px] uppercase tracking-wider text-text-muted">{typeLabels[warehouse.type as keyof typeof typeLabels]}</span>
          
          {/* Alerts */}
          {warehouse.metrics.lowStockAlerts > 0 && (
            <div className="flex items-center gap-1 text-danger ml-2" title={`${warehouse.metrics.lowStockAlerts} alertas de stock`}>
              <AlertCircle size={14} />
            </div>
          )}
        </div>

        {/* Metrics (Hidden on very small screens) */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-text-muted mr-4">
          <span title="Total de itens">
            <span className="font-mono text-text-primary">{warehouse.metrics.totalItems}</span> un
          </span>
          <span className="w-px h-3 bg-border"></span>
          <span title="SKUs Únicos">
            <span className="font-mono text-text-primary">{warehouse.metrics.uniqueSkus}</span> skus
          </span>
        </div>

        {/* Actions */}
        <div className="hidden group-hover:flex items-center gap-1">
          {!['corridor', 'shelf'].includes(warehouse.type) && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/armazens/${warehouse.id}/qr`); }}
              className="p-1 rounded text-text-muted hover:text-accent transition-colors cursor-pointer"
              title="Gerar QR Code"
            >
              <QrCode size={14} />
            </button>
          )}
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
            <WarehouseNode 
              key={child.id} 
              warehouse={child} 
              depth={depth + 1} 
              searchQuery={searchQuery}
              forceExpand={forceExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to filter tree
function filterTree(nodes: WarehouseWithMetrics[], query: string): WarehouseWithMetrics[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();

  return nodes.reduce((acc: WarehouseWithMetrics[], node) => {
    // Check if node matches
    const matches = node.name.toLowerCase().includes(lowerQuery);
    
    // Check if children match
    const filteredChildren = node.children ? filterTree(node.children, query) : [];
    
    if (matches || filteredChildren.length > 0) {
      acc.push({ ...node, children: filteredChildren });
    }
    
    return acc;
  }, []);
}

export function WarehouseTree({ warehouses, searchQuery = '', forceExpand = false }: { warehouses: WarehouseWithMetrics[], searchQuery?: string, forceExpand?: boolean }) {
  const filteredWarehouses = filterTree(warehouses, searchQuery);

  if (filteredWarehouses.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        Nenhum resultado encontrado para "{searchQuery}"
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredWarehouses.map(w => (
        <WarehouseNode 
          key={w.id} 
          warehouse={w} 
          searchQuery={searchQuery}
          forceExpand={forceExpand}
        />
      ))}
    </div>
  );
}
