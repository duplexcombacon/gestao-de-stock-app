import { Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, cn } from '@/utils/formatters';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  stock?: number;
  onClick?: () => void;
}

export function ProductCard({ product, stock = 0, onClick }: ProductCardProps) {
  const isLow = stock < product.min_stock;
  const isOut = stock === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left bg-surface-raised border border-border rounded-xl p-4 transition-colors',
        onClick && 'hover:bg-surface-overlay cursor-pointer',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
          <Package size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate">{product.name}</p>
              <p className="text-xs text-text-muted font-mono mt-0.5">{product.sku}</p>
            </div>
            <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'} dot>
              {isOut ? 'Esgotado' : isLow ? 'Baixo' : 'Normal'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
            <div>
              <p className="text-xs text-text-muted">Stock</p>
              <p className="font-mono font-semibold flex items-center gap-1">
                {stock}
                {isLow && <AlertTriangle size={12} className="text-warning" />}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Mínimo</p>
              <p className="font-mono font-semibold">{product.min_stock}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Custo</p>
              <p className="font-mono font-semibold">{formatCurrency(product.cost_price)}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
