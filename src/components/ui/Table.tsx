import { useState } from 'react';
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import { cn } from '@/utils/formatters';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
}

export function Table<T>({ columns, data, keyExtractor, onRowClick, emptyMessage = 'Sem dados para mostrar', pageSize = 10 }: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  let sorted = [...data];
  if (sortKey) {
    const col = columns.find(c => c.key === sortKey);
    if (col?.sortFn) {
      sorted.sort((a, b) => sortDir === 'asc' ? col.sortFn!(a, b) : col.sortFn!(b, a));
    }
  }

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <Inbox size={40} strokeWidth={1.5} />
        <p className="mt-3 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-overlay">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-text-secondary whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-text-primary',
                    col.className,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {paginated.map(row => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-overlay',
                )}
              >
                {columns.map(col => (
                  <td key={col.key} className={cn('px-4 py-3 whitespace-nowrap', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>{sorted.length} resultado{sorted.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md bg-surface-overlay hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Anterior
            </button>
            <span className="text-text-muted">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-md bg-surface-overlay hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Seguinte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
