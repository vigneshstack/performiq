'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Minimal Dialog primitives
// We use a portal-less headless implementation to avoid a hard dependency on
// any specific UI library while still being accessible (focus-trap, backdrop,
// aria attributes).
// ---------------------------------------------------------------------------

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Dialog({ open, onClose, children }: DialogProps) {
  if (!open) return null;

  return (
    // Backdrop
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

// ---------------------------------------------------------------------------
// ConfirmDialog
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const isDanger = variant === 'danger';

  return (
    <Dialog open={open} onClose={isLoading ? () => {} : onClose}>
      <div
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="mx-4 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5"
      >
        {/* Body */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                isDanger ? 'bg-red-100' : 'bg-indigo-100',
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  isDanger ? 'text-red-600' : 'text-indigo-600',
                )}
                aria-hidden="true"
              />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <h2
                id="confirm-dialog-title"
                className="text-base font-semibold text-gray-900"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-message"
                className="mt-1 text-sm text-gray-500"
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700',
              'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
              'transition-colors duration-100',
              isLoading && 'cursor-not-allowed opacity-50',
            )}
          >
            {cancelLabel}
          </button>

          {/* Confirm */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'transition-colors duration-100',
              isDanger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
              isLoading && 'cursor-not-allowed opacity-70',
            )}
          >
            {isLoading && (
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default ConfirmDialog;
