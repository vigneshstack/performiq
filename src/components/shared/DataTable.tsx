'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

type SortDirection = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonTable({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Default empty state
// ---------------------------------------------------------------------------

function DefaultEmptyState() {
  return (
    <tr>
      <td colSpan={999}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="mb-3 h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-1.875M6 18.375V5.625m0 12.75h6M6 5.625A1.125 1.125 0 017.125 4.5h9.75A1.125 1.125 0 0118 5.625m0 0v12.75m0 0h1.5a1.125 1.125 0 001.125-1.125V5.625M18 18.375A1.125 1.125 0 0016.875 19.5H12"
            />
          </svg>
          <p className="text-sm font-medium text-gray-500">No data to display</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your filters or search terms.</p>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Helper to read a nested key value from a row object
// ---------------------------------------------------------------------------

function getNestedValue<T>(obj: T, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
}

// ---------------------------------------------------------------------------
// Sort icon
// ---------------------------------------------------------------------------

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: string;
  sortColumn: string | null;
  sortDirection: SortDirection;
}) {
  if (sortColumn !== column) {
    return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 text-gray-400" />;
  }
  return sortDirection === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-indigo-600" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-indigo-600" />
  );
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export function DataTable<T extends object>({
  columns,
  data,
  isLoading = false,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sortColumn);
      const bVal = getNestedValue(b, sortColumn);

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  return (
    <div className={cn('w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm', className)}>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        {/* ---------------------------------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------------------------------- */}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => {
              const colKey = String(col.key);
              const isSortable = col.sortable !== false && col.sortable !== undefined ? col.sortable : !!col.sortable;

              return (
                <th
                  key={colKey}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500',
                    isSortable && 'cursor-pointer select-none hover:text-gray-700',
                  )}
                  onClick={isSortable ? () => handleSort(colKey) : undefined}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {isSortable && (
                      <SortIcon
                        column={colKey}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* ---------------------------------------------------------------- */}
        {/* Body */}
        {/* ---------------------------------------------------------------- */}
        <tbody className="divide-y divide-gray-100 bg-white">
          {isLoading ? (
            <SkeletonTable columns={columns.length} />
          ) : sortedData.length === 0 ? (
            emptyState ? (
              <tr>
                <td colSpan={columns.length}>{emptyState}</td>
              </tr>
            ) : (
              <DefaultEmptyState />
            )
          ) : (
            sortedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={cn(
                  'transition-colors duration-100',
                  onRowClick
                    ? 'cursor-pointer hover:bg-indigo-50'
                    : 'hover:bg-gray-50',
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => {
                  const colKey = String(col.key);
                  const rawValue = getNestedValue(row, colKey);

                  return (
                    <td
                      key={colKey}
                      className="whitespace-nowrap px-4 py-3 text-gray-700"
                    >
                      {col.render
                        ? col.render(rawValue, row)
                        : rawValue !== null && rawValue !== undefined
                        ? String(rawValue)
                        : <span className="text-gray-400">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
