import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/utils/formatters';
import type { Movement } from '@/types';

interface MovementRowProps {
  movement: Movement;
  productName?: string;
  warehouseName?: string;
  userName?: string;
}

const typeConfig = {
  in: { label: 'Entrada', variant: 'success' as const, icon: ArrowDownToLine, sign: '+' },
  out: { label: 'Saída', variant: 'danger' as const, icon: ArrowUpFromLine, sign: '-' },
  transfer: { label: 'Transferência', variant: 'accent' as const, icon: ArrowLeftRight, sign: '' },
};

export function MovementRow({ movement, productName, warehouseName, userName }: MovementRowProps) {
  const cfg = typeConfig[movement.type];
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised p-4">
      <div className="size-10 rounded-xl bg-surface-overlay flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{productName || movement.product?.name || 'Produto'}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {warehouseName || movement.warehouse?.name || 'Localização'} · {userName || movement.user?.name || 'Utilizador'}
            </p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-text-muted">{formatDateTime(movement.created_at)}</span>
          <span className="font-mono font-bold">{cfg.sign}{movement.quantity}</span>
        </div>
        {movement.notes && <p className="text-xs text-text-muted mt-2 line-clamp-2">{movement.notes}</p>}
      </div>
    </div>
  );
}
