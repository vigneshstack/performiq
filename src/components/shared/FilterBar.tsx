'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface SearchConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FilterBarProps {
  search?: SearchConfig;
  filters?: FilterConfig[];
  onClear: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

export function FilterBar({ search, filters = [], onClear, className }: FilterBarProps) {
  // Determine whether any filter is currently active so we can show/hide the
  // "Clear" button.
  const hasActiveSearch = Boolean(search && search.value.trim() !== '');
  const hasActiveFilter = filters.some((f) => f.value !== '' && f.value !== 'all');
  const isAnyActive = hasActiveSearch || hasActiveFilter;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        className,
      )}
    >
      {/* Search input */}
      {search && (
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? 'Search…'}
            className={cn(
              'block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm',
              'placeholder:text-gray-400',
              'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
              'transition-colors duration-150',
            )}
          />
        </div>
      )}

      {/* Filter dropdowns */}
      {filters.map((filter) => (
        <div key={filter.label} className="flex flex-col gap-0.5">
          <label className="sr-only">{filter.label}</label>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            aria-label={filter.label}
            className={cn(
              'rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700',
              'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
              'transition-colors duration-150 cursor-pointer',
              filter.value && filter.value !== 'all' && 'border-indigo-400 bg-indigo-50 text-indigo-700',
            )}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Clear button — only visible when at least one filter is active */}
      {isAnyActive && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
            'text-gray-600 hover:text-gray-900',
            'border border-gray-200 bg-white hover:bg-gray-50',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}

export default FilterBar;
