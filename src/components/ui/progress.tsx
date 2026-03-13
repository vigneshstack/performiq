import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'orange';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const colorVariants = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
};

const sizeVariants = {
  sm: 'h-1.5',
  default: 'h-2',
  lg: 'h-3',
};

function Progress({ value, color = 'indigo', size = 'default', showLabel, label, className }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-zinc-500">{label}</span>
          {showLabel && <span className="text-xs font-medium text-zinc-700">{clampedValue}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-zinc-100 rounded-full overflow-hidden', sizeVariants[size])}>
        <div
          className={cn('rounded-full transition-all duration-500 ease-out', colorVariants[color], sizeVariants[size])}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export { Progress };
