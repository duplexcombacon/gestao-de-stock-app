import { cn } from '@/utils/formatters';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}

const iconBg: Record<string, string> = {
  default: 'bg-surface-overlay text-text-secondary',
  accent: 'bg-accent-muted text-accent',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-danger-muted text-danger',
};

export function KpiCard({ title, value, icon, trend, variant = 'default' }: KpiCardProps) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary font-medium">{title}</span>
        <div className={cn('size-9 rounded-lg flex items-center justify-center', iconBg[variant])}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && (
          <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-success' : 'text-danger')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
