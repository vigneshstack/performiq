'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronUp, ChevronDown, UserPlus } from 'lucide-react';
import { useEmployees, useDepartments } from '@/hooks/useAssessments';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate, EMPLOYMENT_STATUS_LABELS, cn } from '@/lib/utils';
import type { EmployeeWithProfile, EmploymentStatus } from '@/types';

type SortKey = 'name' | 'department' | 'job_title' | 'hire_date' | 'status';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const debouncedSearch = useDebounce(search, 300);
  const { data: employees, isLoading } = useEmployees({
    search: debouncedSearch,
    department_id: departmentId || undefined,
    employment_status: employmentStatus as EmploymentStatus | '',
  });
  const { data: departments } = useDepartments();

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function getValue(e: EmployeeWithProfile, key: SortKey): string {
    switch (key) {
      case 'name': return e.profile?.full_name ?? '';
      case 'department': return e.department?.name ?? '';
      case 'job_title': return e.job_title ?? '';
      case 'hire_date': return e.hire_date ?? '';
      case 'status': return e.employment_status ?? '';
    }
  }

  const sorted = [...(employees ?? [])].sort((a, b) => {
    const av = getValue(a, sortKey);
    const bv = getValue(b, sortKey);
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalPages = Math.ceil((sorted.length) / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 inline-flex flex-col">
      <ChevronUp className={cn('h-3 w-3', sortKey === col && sortDir === 'asc' ? 'text-indigo-600' : 'text-zinc-300')} />
      <ChevronDown className={cn('h-3 w-3 -mt-1', sortKey === col && sortDir === 'desc' ? 'text-indigo-600' : 'text-zinc-300')} />
    </span>
  );

  const clearFilters = () => {
    setSearch('');
    setDepartmentId('');
    setEmploymentStatus('');
  };

  const hasFilters = search || departmentId || employmentStatus;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900">Employees</h1>
          {employees && (
            <span className="bg-zinc-100 text-zinc-600 text-sm font-medium px-2.5 py-1 rounded-full">
              {employees.length}
            </span>
          )}
        </div>
        <Button variant="outline" disabled>
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employees…"
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-48">
          <Select
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
            placeholder="All departments"
            options={[
              { value: '', label: 'All departments' },
              ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            value={employmentStatus}
            onChange={(e) => { setEmploymentStatus(e.target.value); setPage(1); }}
            placeholder="All statuses"
            options={[
              { value: '', label: 'All statuses' },
              ...Object.entries(EMPLOYMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={10} cols={6} />
        ) : !paginated.length ? (
          <EmptyState
            type="employee"
            title="No employees found"
            description={hasFilters ? 'Try adjusting your filters.' : 'No employees have been added yet.'}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead sortable onClick={() => handleSort('name')}>
                    <span className="flex items-center">Employee <SortIcon col="name" /></span>
                  </TableHead>
                  <TableHead sortable onClick={() => handleSort('department')}>
                    <span className="flex items-center">Department <SortIcon col="department" /></span>
                  </TableHead>
                  <TableHead sortable onClick={() => handleSort('job_title')}>
                    <span className="flex items-center">Job Title <SortIcon col="job_title" /></span>
                  </TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead sortable onClick={() => handleSort('hire_date')}>
                    <span className="flex items-center">Hire Date <SortIcon col="hire_date" /></span>
                  </TableHead>
                  <TableHead sortable onClick={() => handleSort('status')}>
                    <span className="flex items-center">Status <SortIcon col="status" /></span>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <Link href={`/employees/${emp.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                        <Avatar src={emp.profile?.avatar_url} name={emp.profile?.full_name} size="sm" />
                        <div>
                          <p className="font-medium text-zinc-900">{emp.profile?.full_name ?? '—'}</p>
                          <p className="text-xs text-zinc-500">{emp.profile?.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{emp.department?.name ?? <span className="text-zinc-400">—</span>}</TableCell>
                    <TableCell>
                      <div>
                        <p>{emp.job_title}</p>
                        {emp.job_level && <p className="text-xs text-zinc-500">{emp.job_level}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {emp.manager ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar src={emp.manager.profile?.avatar_url} name={emp.manager.profile?.full_name} size="xs" />
                          <span className="text-sm">{emp.manager.profile?.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(emp.hire_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={emp.employment_status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Link href={`/employees/${emp.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
                <p className="text-sm text-zinc-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
