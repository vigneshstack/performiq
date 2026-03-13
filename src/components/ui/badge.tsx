import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'default';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-indigo-100 text-indigo-700',
      outline: 'border border-zinc-200 text-zinc-700 bg-transparent',
      secondary: 'bg-zinc-100 text-zinc-700',
      success: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-amber-100 text-amber-700',
      error: 'bg-red-100 text-red-700',
      info: 'bg-blue-100 text-blue-700',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      default: 'px-2.5 py-1 text-xs',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

// StatusBadge maps any string status to an appropriate color
interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  colorMap?: Record<string, string>;
  size?: 'sm' | 'default';
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, colorMap, size = 'default', className, ...props }, ref) => {
    const defaultColors: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-zinc-100 text-zinc-600',
      on_leave: 'bg-amber-100 text-amber-700',
      terminated: 'bg-red-100 text-red-600',
      pending: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      submitted: 'bg-indigo-100 text-indigo-700',
      cancelled: 'bg-red-100 text-red-600',
      draft: 'bg-zinc-100 text-zinc-600',
      not_started: 'bg-zinc-100 text-zinc-600',
      on_hold: 'bg-amber-100 text-amber-700',
    };

    const colors = colorMap ?? defaultColors;
    const colorClass = colors[status] ?? 'bg-zinc-100 text-zinc-600';
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const sizes = { sm: 'px-2 py-0.5 text-xs', default: 'px-2.5 py-1 text-xs' };

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center rounded-full font-medium', colorClass, sizes[size], className)}
        {...props}
      >
        {label}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

export { Badge, StatusBadge };
