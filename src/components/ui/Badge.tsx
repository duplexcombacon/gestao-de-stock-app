import { cn } from '@/utils/formatters';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-overlay text-text-secondary',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-danger-muted text-danger',
  accent: 'bg-accent-muted text-accent',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', dot, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {dot && <span className={cn('size-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  );
}
