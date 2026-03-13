import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, differenceInDays, parseISO } from 'date-fns';
import type { AssessmentStatus, AssessmentType, GoalStatus, GoalPriority, EmploymentStatus } from '@/types';

// ============================================================
// CLASS NAME UTILITY
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// DATE FORMATTERS
// ============================================================
function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  try {
    return parseISO(date);
  } catch {
    return null;
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

// ============================================================
// DATE PREDICATES
// ============================================================
export function isOverdue(date: string | Date | null | undefined): boolean {
  const d = toDate(date);
  if (!d) return false;
  return isPast(d);
}

export function isDueSoon(date: string | Date | null | undefined, daysThreshold = 7): boolean {
  const d = toDate(date);
  if (!d) return false;
  const daysUntilDue = differenceInDays(d, new Date());
  return daysUntilDue >= 0 && daysUntilDue <= daysThreshold;
}

// ============================================================
// SCORE FORMATTERS
// ============================================================
export function formatScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return score.toFixed(1);
}

export function scoreToGrade(score: number | null | undefined): string {
  if (score == null) return 'N/A';
  if (score >= 4.8) return 'A+';
  if (score >= 4.5) return 'A';
  if (score >= 4.0) return 'A-';
  if (score >= 3.7) return 'B+';
  if (score >= 3.5) return 'B';
  if (score >= 3.0) return 'B-';
  if (score >= 2.7) return 'C+';
  if (score >= 2.5) return 'C';
  if (score >= 2.0) return 'C-';
  if (score >= 1.5) return 'D';
  return 'F';
}

export function scoreToColor(score: number | null | undefined): string {
  if (score == null) return 'text-zinc-400';
  if (score >= 4.5) return 'text-emerald-600';
  if (score >= 3.5) return 'text-blue-600';
  if (score >= 2.5) return 'text-amber-600';
  if (score >= 1.5) return 'text-orange-600';
  return 'text-red-600';
}

export function scoreToBgColor(score: number | null | undefined): string {
  if (score == null) return 'bg-zinc-100';
  if (score >= 4.5) return 'bg-emerald-100';
  if (score >= 3.5) return 'bg-blue-100';
  if (score >= 2.5) return 'bg-amber-100';
  if (score >= 1.5) return 'bg-orange-100';
  return 'bg-red-100';
}

export function scoreToRingColor(score: number | null | undefined): string {
  if (score == null) return 'stroke-zinc-300';
  if (score >= 4.5) return 'stroke-emerald-500';
  if (score >= 3.5) return 'stroke-blue-500';
  if (score >= 2.5) return 'stroke-amber-500';
  if (score >= 1.5) return 'stroke-orange-500';
  return 'stroke-red-500';
}

// ============================================================
// LABEL MAPS
// ============================================================
export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  annual_review: 'Annual Review',
  quarterly_self: 'Quarterly Self',
  '360_feedback': '360° Feedback',
  probation_review: 'Probation Review',
  manager_effectiveness: 'Manager Effectiveness',
  peer_review: 'Peer Review',
  custom: 'Custom',
};

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ASSESSMENT_STATUS_COLORS: Record<AssessmentStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: 'bg-zinc-100 text-zinc-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
  on_hold: 'bg-amber-100 text-amber-700',
};

export const GOAL_PRIORITY_COLORS: Record<GoalPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  low: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' },
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  terminated: 'Terminated',
};

export const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-zinc-100 text-zinc-600',
  on_leave: 'bg-amber-100 text-amber-700',
  terminated: 'bg-red-100 text-red-600',
};

// ============================================================
// STRING HELPERS
// ============================================================
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
