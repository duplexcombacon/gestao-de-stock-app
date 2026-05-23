import { cn } from '@/utils/formatters';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">{label}</label>}
      <select
        id={selectId}
        className={cn(
          'rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors',
          'cursor-pointer',
          className,
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
