import { cn } from '@/utils/formatters';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
            'transition-colors',
            icon ? 'pl-10' : undefined,
            error && 'border-danger focus:border-danger focus:ring-danger/30',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
