'use client';

import React from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, ClipboardList, CheckCircle, Star, Plus } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useAssessments';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/ui/card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SkeletonCard, SkeletonTable, Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatDate,
  formatScore,
  scoreToGrade,
  scoreToColor,
  ASSESSMENT_TYPE_LABELS,
  isOverdue,
  isDueSoon,
  cn,
} from '@/lib/utils';

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStats();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {greeting()}, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </p>
        </div>
        <Link href="/assessments/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Employees"
            value={stats?.total_employees ?? 0}
            description="Active employees"
            icon={<Users className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-100"
          />
          <MetricCard
            title="Active Assessments"
            value={stats?.active_assessments ?? 0}
            description="Pending or in progress"
            icon={<ClipboardList className="h-6 w-6 text-indigo-600" />}
            bgColor="bg-indigo-100"
          />
          <MetricCard
            title="Completed This Month"
            value={stats?.completed_this_month ?? 0}
            description="Assessments submitted"
            icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
            bgColor="bg-emerald-100"
          />
          <MetricCard
            title="Avg Score"
            value={`${formatScore(stats?.avg_score)} (${scoreToGrade(stats?.avg_score)})`}
            description="Across all assessments"
            icon={<Star className="h-6 w-6 text-amber-600" />}
            bgColor="bg-amber-100"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <p className="text-sm text-zinc-500">Average score over 6 months</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats?.score_trend ?? []}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8 }}
                    formatter={(value: number) => [value.toFixed(1), 'Avg Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <p className="text-sm text-zinc-500">Average score by department</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stats?.department_performance ?? []}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8 }}
                    formatter={(value: number) => [value.toFixed(1), 'Avg Score']}
                  />
                  <Bar dataKey="avg_score" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
          <Link href="/assessments">
            <Button variant="outline" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : !stats?.recent_assessments?.length ? (
            <EmptyState
              type="assessment"
              title="No assessments yet"
              description="Create your first assessment to get started."
              action={
                <Link href="/assessments/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    New Assessment
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent_assessments.map((a) => (
                  <TableRow
                    key={a.id}
                    clickable
                    onClick={() => (window.location.href = `/assessments/${a.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={a.employee?.profile?.avatar_url}
                          name={a.employee?.profile?.full_name}
                          size="sm"
                        />
                        <span className="font-medium text-zinc-900">
                          {a.employee?.profile?.full_name ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                        {ASSESSMENT_TYPE_LABELS[a.type] ?? a.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      {a.due_date ? (
                        <span
                          className={cn(
                            'text-sm',
                            isOverdue(a.due_date) && a.status !== 'completed' && a.status !== 'submitted'
                              ? 'text-red-600 font-medium'
                              : isDueSoon(a.due_date)
                              ? 'text-amber-600 font-medium'
                              : 'text-zinc-600'
                          )}
                        >
                          {formatDate(a.due_date)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {a.overall_score != null ? (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(a.overall_score / 5) * 100}
                            color="indigo"
                            size="sm"
                            className="w-16"
                          />
                          <span className={cn('text-sm font-semibold', scoreToColor(a.overall_score))}>
                            {formatScore(a.overall_score)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
