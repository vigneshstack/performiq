'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
}

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

// ============================================================
// CONTEXT
// ============================================================
const ToastContext = React.createContext<{
  toasts: Toast[];
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = {
      id,
      title: options.title,
      description: options.description,
      type: options.type ?? 'info',
      duration: options.duration ?? 4000,
    };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Fallback for when used outside provider
    return {
      toast: (_options: ToastOptions) => {},
    };
  }
  return { toast: context.addToast };
}

// ============================================================
// TOASTER COMPONENT
// ============================================================
const toastStyles: Record<ToastType, string> = {
  success: 'bg-white border-l-4 border-emerald-500',
  error: 'bg-white border-l-4 border-red-500',
  warning: 'bg-white border-l-4 border-amber-500',
  info: 'bg-white border-l-4 border-blue-500',
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
  error: <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />,
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl shadow-lg min-w-[320px] max-w-sm transition-all duration-300',
        toastStyles[toast.type],
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      )}
    >
      {toastIcons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900">{toast.title}</p>
        {toast.description && <p className="text-xs text-zinc-500 mt-0.5">{toast.description}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-0.5 rounded text-zinc-400 hover:text-zinc-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const context = React.useContext(ToastContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!context || !mounted) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {context.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={context.removeToast} />
      ))}
    </div>,
    document.body
  );
}
