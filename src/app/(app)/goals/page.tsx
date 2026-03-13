'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2, Target, ChevronDown, X } from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { useGoals, useCreateGoal, useDeleteGoal } from '@/hooks/useAssessments';
import { useEmployees } from '@/hooks/useAssessments';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold';
type GoalPriority = 'critical' | 'high' | 'medium' | 'low';

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
};

const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
};

const GOAL_PRIORITY_COLORS: Record<GoalPriority, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const STATUS_TABS: Array<{ value: GoalStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

const PRIORITY_OPTIONS: Array<{ value: GoalPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const keyResultSchema = z.object({
  title: z.string().min(1, 'Key result title is required'),
  current_value: z.coerce.number().min(0, 'Must be 0 or greater'),
  target_value: z.coerce.number().min(1, 'Target must be at least 1'),
  unit: z.string().optional(),
});

const goalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  employee_id: z.string().min(1, 'Please select an employee'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  target_date: z.string().min(1, 'Target date is required'),
  key_results: z.array(keyResultSchema),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BadgeProps {
  className: string;
  children: React.ReactNode;
}

function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-1.5 w-full rounded-full bg-zinc-200 ${className}`}>
      <div
        className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

interface TargetDateProps {
  dateStr: string;
}

function TargetDateBadge({ dateStr }: TargetDateProps) {
  const date = new Date(dateStr);
  const now = new Date();
  const soonThreshold = addDays(now, 7);

  let colorClass = 'text-zinc-500';
  if (isPast(date)) {
    colorClass = 'text-red-600 font-medium';
  } else if (isWithinInterval(date, { start: now, end: soonThreshold })) {
    colorClass = 'text-amber-600 font-medium';
  }

  return (
    <span className={`text-xs ${colorClass}`}>
      Due {format(date, 'MMM d, yyyy')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Goal Card
// ---------------------------------------------------------------------------

interface KeyResult {
  id?: string;
  title: string;
  current_value: number;
  target_value: number;
  unit?: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: GoalPriority;
  progress: number;
  target_date: string;
  key_results: KeyResult[];
  employee?: {
    id: string;
    name: string;
  };
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge className={GOAL_PRIORITY_COLORS[goal.priority]}>
            {goal.priority}
          </Badge>
          <Badge className={GOAL_STATUS_COLORS[goal.status]}>
            {GOAL_STATUS_LABELS[goal.status]}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            aria-label="Edit goal"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Delete goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div className="px-4 pb-3">
        <h3 className="mb-1 truncate font-semibold text-zinc-900">{goal.title}</h3>
        {goal.description && (
          <p className="line-clamp-2 text-sm text-zinc-500">{goal.description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="px-4 pb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Progress</span>
          <span className="text-xs font-medium text-zinc-700">{goal.progress}%</span>
        </div>
        <ProgressBar value={goal.progress} />
      </div>

      {/* Target Date */}
      <div className="px-4 pb-3">
        <TargetDateBadge dateStr={goal.target_date} />
      </div>

      {/* Key Results */}
      {goal.key_results && goal.key_results.length > 0 && (
        <div className="mx-4 mb-3 rounded-lg bg-zinc-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            <Target className="h-3 w-3" />
            Key Results
          </div>
          <div className="space-y-2.5">
            {goal.key_results.map((kr, idx) => {
              const krProgress =
                kr.target_value > 0
                  ? Math.min(100, Math.round((kr.current_value / kr.target_value) * 100))
                  : 0;
              return (
                <div key={kr.id ?? idx}>
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-zinc-700">{kr.title}</span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {kr.current_value}/{kr.target_value}
                      {kr.unit ? ` ${kr.unit}` : ''}
                    </span>
                  </div>
                  <ProgressBar value={krProgress} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto border-t border-zinc-100 px-4 py-2.5">
        <span className="text-xs text-zinc-500">
          {goal.employee?.name ?? 'Unassigned'}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Goal Dialog
// ---------------------------------------------------------------------------

interface Employee {
  id: string;
  name: string;
}

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateGoalDialog({ open, onClose }: CreateGoalDialogProps) {
  const { data: employees = [] } = useEmployees();
  const createGoal = useCreateGoal();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      employee_id: '',
      status: 'not_started',
      priority: 'medium',
      target_date: '',
      key_results: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'key_results',
  });

  const onSubmit = async (values: GoalFormValues) => {
    await createGoal.mutateAsync(values);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Dialog Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Create New Goal</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Increase Q3 Revenue by 20%"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe the goal in detail..."
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Employee + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                {...register('employee_id')}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="">Select employee...</option>
                {(employees as Employee[]).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Priority + Target Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Target Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register('target_date')}
                type="date"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {errors.target_date && (
                <p className="mt-1 text-xs text-red-500">{errors.target_date.message}</p>
              )}
            </div>
          </div>

          {/* Key Results */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">Key Results</label>
              <button
                type="button"
                onClick={() =>
                  append({ title: '', current_value: 0, target_value: 100, unit: '' })
                }
                className="flex items-center gap-1 rounded-lg border border-dashed border-indigo-300 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Key Result
              </button>
            </div>

            {fields.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-200 p-3 text-center text-xs text-zinc-400">
                No key results added. Click "Add Key Result" to track measurable outcomes.
              </p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600">
                      KR {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      {...register(`key_results.${index}.title`)}
                      type="text"
                      placeholder="Key result title..."
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    {errors.key_results?.[index]?.title && (
                      <p className="text-xs text-red-500">
                        {errors.key_results[index]?.title?.message}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Current</label>
                        <input
                          {...register(`key_results.${index}.current_value`)}
                          type="number"
                          min="0"
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Target</label>
                        <input
                          {...register(`key_results.${index}.target_value`)}
                          type="number"
                          min="1"
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Unit</label>
                        <input
                          {...register(`key_results.${index}.unit`)}
                          type="text"
                          placeholder="%, pts..."
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createGoal.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting || createGoal.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Goal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function GoalsPage() {
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<GoalPriority | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: goals = [], isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();

  // Client-side filtering
  const filtered = (goals as Goal[]).filter((g) => {
    const matchStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || g.priority === priorityFilter;
    const matchSearch =
      search === '' ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      (g.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Delete this goal? This action cannot be undone.')) {
      await deleteGoal.mutateAsync(id);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (_goal: Goal) => {
    // Edit functionality can be extended with an edit dialog
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Goals & OKRs</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {(goals as Goal[]).length} goal{(goals as Goal[]).length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          {/* Status Tabs */}
          <div className="mb-4 flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Priority + Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Priority Dropdown */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as GoalPriority | 'all')}
                className="appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search goals..."
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Goal Cards Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-white"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-20">
            <Target className="mb-3 h-10 w-10 text-zinc-300" />
            <p className="font-medium text-zinc-500">No goals found</p>
            <p className="mt-1 text-sm text-zinc-400">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first goal to get started'}
            </p>
            {!search && statusFilter === 'all' && priorityFilter === 'all' && (
              <button
                onClick={() => setDialogOpen(true)}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Goal
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Goal Dialog */}
      <CreateGoalDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
