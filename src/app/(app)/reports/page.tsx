'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { ChevronDown, ChevronUp, ChevronsUpDown, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardStats, useDepartmentPerformance, useAssessments } from '@/hooks/useAssessments';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimePeriod = '30d' | '90d' | '1y';

interface Assessment {
  id: string;
  employee?: { id: string; name: string; department?: string };
  score?: number;
  completed_at?: string;
  type?: string;
  status: string;
}

interface DashboardStats {
  total_assessments: number;
  average_score: number;
  completion_rate: number;
  overdue_count: number;
}

interface DepartmentPerf {
  department: string;
  avg_score: number;
  count: number;
}

type SortKey = 'employee' | 'score' | 'date' | 'type';
type SortDir = 'asc' | 'desc';

const TIME_PERIOD_OPTIONS: Array<{ value: TimePeriod; label: string }> = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
];

const PIE_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
];

const COMPETENCY_COLORS = {
  fill: '#6366f1',
  stroke: '#4f46e5',
};

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function scoreToGrade(score: number): string {
  if (score >= 4.5) return 'A+';
  if (score >= 4.0) return 'A';
  if (score >= 3.5) return 'B+';
  if (score >= 3.0) return 'B';
  if (score >= 2.5) return 'C+';
  if (score >= 2.0) return 'C';
  return 'D';
}

function scoreToGradeColor(score: number): string {
  if (score >= 4.0) return 'text-green-600';
  if (score >= 3.0) return 'text-indigo-600';
  if (score >= 2.0) return 'text-amber-600';
  return 'text-red-600';
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}

function KpiCard({ title, value, subtitle, icon, iconBg, trend }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
          {trend && <p className="mt-1 text-xs font-medium text-green-600">{trend}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Tooltip for PieChart
// ---------------------------------------------------------------------------

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}

function CustomPieTooltip({ active, payload }: CustomPieTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-zinc-800">{item.name}</p>
      <p className="text-zinc-500">
        {item.value} assessment{item.value !== 1 ? 's' : ''}
      </p>
      <p className="text-zinc-400">{(item.payload.percent * 100).toFixed(1)}%</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable table header cell
// ---------------------------------------------------------------------------

interface ThProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  direction: SortDir;
  onSort: (key: SortKey) => void;
}

function Th({ label, sortKey, currentSort, direction, onSort }: ThProps) {
  const active = currentSort === sortKey;
  return (
    <th
      scope="col"
      className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          direction === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </span>
    </th>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

export default function ReportsPage() {
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const { data: stats } = useDashboardStats(period) as { data: DashboardStats | undefined };
  const { data: deptPerf = [] } = useDepartmentPerformance(period) as {
    data: DepartmentPerf[];
  };
  const { data: assessments = [] } = useAssessments() as { data: Assessment[] };

  // Completed assessments only
  const completed = useMemo(
    () => (assessments as Assessment[]).filter((a) => a.status === 'completed' && a.score != null),
    [assessments]
  );

  // Assessment type distribution
  const typeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach((a) => {
      const t = a.type ?? 'Unknown';
      map[t] = (map[t] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [completed]);

  // Score distribution buckets
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '1–2', min: 1, max: 2, count: 0 },
      { range: '2–3', min: 2, max: 3, count: 0 },
      { range: '3–4', min: 3, max: 4, count: 0 },
      { range: '4–5', min: 4, max: 5, count: 0 },
    ];
    completed.forEach((a) => {
      const s = a.score ?? 0;
      for (const b of buckets) {
        if (s >= b.min && s <= b.max) {
          b.count++;
          break;
        }
      }
    });
    return buckets.map(({ range, count }) => ({ range, count }));
  }, [completed]);

  // Competency radar (mock aggregated from assessment type labels)
  const competencyData = useMemo(() => {
    const labels = [
      'Communication',
      'Leadership',
      'Technical',
      'Collaboration',
      'Innovation',
      'Delivery',
    ];
    return labels.map((subject) => ({
      subject,
      score: +(2.5 + Math.random() * 2).toFixed(1),
      fullMark: 5,
    }));
  }, []);

  // Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    return [...completed].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'employee') {
        cmp = (a.employee?.name ?? '').localeCompare(b.employee?.name ?? '');
      } else if (sortKey === 'score') {
        cmp = (a.score ?? 0) - (b.score ?? 0);
      } else if (sortKey === 'date') {
        cmp =
          new Date(a.completed_at ?? 0).getTime() -
          new Date(b.completed_at ?? 0).getTime();
      } else if (sortKey === 'type') {
        cmp = (a.type ?? '').localeCompare(b.type ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [completed, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Performance insights across your organisation
            </p>
          </div>

          {/* Time Period Selector */}
          <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            {TIME_PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === opt.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Assessments Completed"
            value={stats?.total_assessments ?? completed.length}
            subtitle="in selected period"
            icon={<CheckCircle className="h-5 w-5 text-indigo-600" />}
            iconBg="bg-indigo-50"
          />
          <KpiCard
            title="Average Score"
            value={
              stats?.average_score != null
                ? stats.average_score.toFixed(2)
                : completed.length
                ? (
                    completed.reduce((s, a) => s + (a.score ?? 0), 0) / completed.length
                  ).toFixed(2)
                : '—'
            }
            subtitle={
              stats?.average_score != null
                ? `Grade: ${scoreToGrade(stats.average_score)}`
                : completed.length
                ? `Grade: ${scoreToGrade(
                    completed.reduce((s, a) => s + (a.score ?? 0), 0) / completed.length
                  )}`
                : undefined
            }
            icon={
              <TrendingUp
                className={`h-5 w-5 ${scoreToGradeColor(stats?.average_score ?? 0)}`}
              />
            }
            iconBg="bg-green-50"
          />
          <KpiCard
            title="Completion Rate"
            value={
              stats?.completion_rate != null
                ? `${stats.completion_rate.toFixed(1)}%`
                : '—'
            }
            subtitle="of scheduled assessments"
            icon={<Users className="h-5 w-5 text-cyan-600" />}
            iconBg="bg-cyan-50"
          />
          <KpiCard
            title="Overdue Assessments"
            value={stats?.overdue_count ?? '—'}
            subtitle="require attention"
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            iconBg="bg-red-50"
          />
        </div>

        {/* Charts 2×2 Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* A: Department Performance */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-zinc-900">Department Performance</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={(deptPerf as DepartmentPerf[]).map((d) => ({
                  name: d.department,
                  score: +d.avg_score.toFixed(2),
                }))}
                layout="vertical"
                margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                <XAxis
                  type="number"
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e4e4e7',
                    fontSize: 12,
                  }}
                  formatter={(val: number) => [val.toFixed(2), 'Avg Score']}
                />
                <Bar
                  dataKey="score"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    fontSize: 11,
                    fill: '#6366f1',
                    formatter: (v: number) => v.toFixed(2),
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* B: Assessment Type Distribution (Pie) */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-zinc-900">
              Assessment Type Distribution
            </h2>
            {typeDistribution.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="45%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {typeDistribution.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* C: Score Distribution */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-zinc-900">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={scoreDistribution}
                margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e4e4e7',
                    fontSize: 12,
                  }}
                  formatter={(val: number) => [val, 'Assessments']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* D: Competency Radar */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-zinc-900">Competency Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={competencyData} cx="50%" cy="50%" outerRadius={100}>
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fontSize: 9, fill: '#a1a1aa' }}
                  tickCount={6}
                />
                <Radar
                  name="Avg Score"
                  dataKey="score"
                  stroke={COMPETENCY_COLORS.stroke}
                  fill={COMPETENCY_COLORS.fill}
                  fillOpacity={0.25}
                  dot={{ r: 3, fill: COMPETENCY_COLORS.stroke }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e4e4e7',
                    fontSize: 12,
                  }}
                  formatter={(val: number) => [val.toFixed(2), 'Avg Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Recent Completed Assessments</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {completed.length} completed assessment{completed.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                  <Th
                    label="Employee"
                    sortKey="employee"
                    currentSort={sortKey}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <Th
                    label="Type"
                    sortKey="type"
                    currentSort={sortKey}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <Th
                    label="Score"
                    sortKey="score"
                    currentSort={sortKey}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                  <Th
                    label="Date"
                    sortKey="date"
                    currentSort={sortKey}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-zinc-400">
                      No completed assessments yet
                    </td>
                  </tr>
                ) : (
                  paginated.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-zinc-800">
                          {a.employee?.name ?? '—'}
                        </span>
                        {a.employee?.department && (
                          <span className="ml-2 text-xs text-zinc-400">
                            {a.employee.department}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 capitalize">
                        {a.type ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-semibold ${scoreToGradeColor(a.score ?? 0)}`}
                        >
                          {a.score?.toFixed(2) ?? '—'}
                        </span>
                        <span className="ml-1 text-xs text-zinc-400">
                          / 5.00
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {a.completed_at
                          ? format(new Date(a.completed_at), 'MMM d, yyyy')
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-3">
              <p className="text-xs text-zinc-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
