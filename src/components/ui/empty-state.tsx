import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Database,
  Search,
  AlertCircle,
  ClipboardCheck,
  Users,
  Target,
  Inbox,
} from 'lucide-react';

type EmptyStateType = 'data' | 'search' | 'error' | 'assessment' | 'employee' | 'goal' | 'notification';

const defaultIcons: Record<EmptyStateType, React.ReactNode> = {
  data: <Database className="h-10 w-10 text-zinc-400" />,
  search: <Search className="h-10 w-10 text-zinc-400" />,
  error: <AlertCircle className="h-10 w-10 text-red-400" />,
  assessment: <ClipboardCheck className="h-10 w-10 text-zinc-400" />,
  employee: <Users className="h-10 w-10 text-zinc-400" />,
  goal: <Target className="h-10 w-10 text-zinc-400" />,
  notification: <Inbox className="h-10 w-10 text-zinc-400" />,
};

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ type = 'data', icon, title, description, action, className }: EmptyStateProps) {
  const displayIcon = icon ?? defaultIcons[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-100 mb-4">
        {displayIcon}
      </div>
      <h3 className="text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-xs mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export { EmptyState };
