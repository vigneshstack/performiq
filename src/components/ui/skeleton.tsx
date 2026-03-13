import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-zinc-200', className)}
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-4/5' : 'w-full')}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-zinc-200 p-6 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200 rounded-t-lg">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-4 border-b border-zinc-100 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1 flex items-center gap-2">
              {c === 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
              <Skeleton className={cn('h-4', c === 0 ? 'flex-1' : 'w-full')} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonAvatar({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8', default: 'h-10 w-10', lg: 'h-12 w-12' };
  return <Skeleton className={cn('rounded-full flex-shrink-0', sizes[size])} />;
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonAvatar };
