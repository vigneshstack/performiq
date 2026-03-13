'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns an array of page numbers (and "..." strings) to render.
 * Always shows at most 5 page buttons; uses ellipsis for gaps.
 */
function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 3) {
    // Near the start: 1 2 3 4 5 ... last
    pages.push(1, 2, 3, 4, 5);
    if (total > 5) {
      pages.push('...', total);
    }
  } else if (current >= total - 2) {
    // Near the end: 1 ... last-4 last-3 last-2 last-1 last
    pages.push(1, '...');
    for (let i = total - 4; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Middle: 1 ... prev current next ... last
    pages.push(1, '...');
    pages.push(current - 1, current, current + 1);
    pages.push('...', total);
  }

  return pages;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp currentPage to valid range
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);

  const pageRange = useMemo(() => buildPageRange(safePage, totalPages), [safePage, totalPages]);

  const isPrevDisabled = safePage <= 1;
  const isNextDisabled = safePage >= totalPages;

  const buttonBase = cn(
    'inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-medium',
    'border transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
  );

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
      aria-label="Pagination"
    >
      {/* Results summary */}
      <p className="text-sm text-gray-500">
        {totalItems === 0 ? (
          'No results'
        ) : (
          <>
            Showing{' '}
            <span className="font-medium text-gray-700">{firstItem}</span>
            {' – '}
            <span className="font-medium text-gray-700">{lastItem}</span>
            {' of '}
            <span className="font-medium text-gray-700">{totalItems}</span>
            {' results'}
          </>
        )}
      </p>

      {/* Controls */}
      <nav className="flex items-center gap-1" aria-label="Page navigation">
        {/* Previous */}
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={() => !isPrevDisabled && onPageChange(safePage - 1)}
          aria-label="Previous page"
          className={cn(
            buttonBase,
            'gap-1 pl-1.5 pr-2.5',
            isPrevDisabled
              ? 'cursor-not-allowed border-gray-200 text-gray-300'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Previous</span>
        </button>

        {/* Page numbers */}
        {pageRange.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex h-8 items-center px-1 text-sm text-gray-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === safePage ? 'page' : undefined}
              className={cn(
                buttonBase,
                page === safePage
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => !isNextDisabled && onPageChange(safePage + 1)}
          aria-label="Next page"
          className={cn(
            buttonBase,
            'gap-1 pl-2.5 pr-1.5',
            isNextDisabled
              ? 'cursor-not-allowed border-gray-200 text-gray-300'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          )}
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
