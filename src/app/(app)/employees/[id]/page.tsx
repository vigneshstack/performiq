'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Mail, Phone, MapPin, Calendar, Briefcase, Plus } from 'lucide-react';
import { useEmployee, useAssessments, useGoals } from '@/hooks/useAssessments';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  formatDate,
  formatScore,
  scoreToColor,
  scoreToGrade,
  ASSESSMENT_TYPE_LABELS,
  GOAL_STATUS_LABELS,
  GOAL_PRIORITY_COLORS,
  isOverdue,
  cn,
} from '@/lib/utils';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: employee, isLoading } = useEmployee(id);
  const { data: assessments } = useAssessments();
  const { data: goals } = useGoals(id);

  const empAssessments = assessments?.filter((a) => a.employee_id === id) ?? [];

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <SkeletonCard className="h-40" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8">
        <EmptyState
          type="employee"
          title="Employee not found"
          description="The employee you're looking for doesn't exist or you don't have access."
          action={
            <Link href="/employees">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4" />
                Back to Employees
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Back */}
      <Link href="/employees" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ChevronLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      {/* Employee Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-start gap-5">
          <Avatar src={employee.profile?.avatar_url} name={employee.profile?.full_name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">{employee.profile?.full_name}</h1>
                <p className="text-base text-zinc-500 mt-0.5">{employee.job_title}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <StatusBadge status={employee.employment_status} />
                  <span className="text-xs text-zinc-500 font-mono bg-zinc-100 px-2 py-1 rounded">
                    {employee.employee_code}
                  </span>
                  {employee.job_level && (
                    <Badge variant="secondary">{employee.job_level}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/assessments?employee=${id}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    New Assessment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employee.profile?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-zinc-500">Email</dt>
                      <dd className="text-sm text-zinc-900">{employee.profile.email}</dd>
                    </div>
                  </div>
                )}
                {employee.profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-zinc-500">Phone</dt>
                      <dd className="text-sm text-zinc-900">{employee.profile.phone}</dd>
                    </div>
                  </div>
                )}
                {employee.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-zinc-500">Location</dt>
                      <dd className="text-sm text-zinc-900">{employee.location}</dd>
                    </div>
                  </div>
                )}
                {employee.department && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-zinc-500">Department</dt>
                      <dd className="text-sm text-zinc-900">{employee.department.name}</dd>
                    </div>
                  </div>
                )}
                {employee.manager && (
                  <div className="flex items-center gap-2">
                    <Avatar src={employee.manager.profile?.avatar_url} name={employee.manager.profile?.full_name} size="xs" />
                    <div>
                      <dt className="text-xs text-zinc-500">Manager</dt>
                      <dd className="text-sm text-zinc-900">{employee.manager.profile?.full_name}</dd>
                    </div>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-zinc-500">Hire Date</dt>
                      <dd className="text-sm text-zinc-900">{formatDate(employee.hire_date)}</dd>
                    </div>
                  </div>
                )}
                {employee.salary_band && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-zinc-500">Salary Band</dt>
                      <dd className="text-sm text-zinc-900">{employee.salary_band}</dd>
                    </div>
                  </div>
                )}
                {employee.probation_end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-zinc-500">Probation End</dt>
                      <dd className={cn('text-sm', isOverdue(employee.probation_end_date) ? 'text-zinc-500 line-through' : 'text-zinc-900')}>
                        {formatDate(employee.probation_end_date)}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Assessment History */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <span className="text-sm text-zinc-500">{empAssessments.length} assessments</span>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {empAssessments.length === 0 ? (
                <EmptyState type="assessment" title="No assessments yet" className="py-8" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empAssessments.map((a) => (
                      <TableRow key={a.id} clickable onClick={() => (window.location.href = `/assessments/${a.id}`)}>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell>
                          <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                            {ASSESSMENT_TYPE_LABELS[a.type]}
                          </span>
                        </TableCell>
                        <TableCell><StatusBadge status={a.status} size="sm" /></TableCell>
                        <TableCell>
                          {a.overall_score != null ? (
                            <span className={cn('font-semibold', scoreToColor(a.overall_score))}>
                              {formatScore(a.overall_score)} ({scoreToGrade(a.overall_score)})
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>{formatDate(a.submitted_at ?? a.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <span className="text-sm text-zinc-500">{goals?.length ?? 0} goals</span>
            </CardHeader>
            <CardContent>
              {!goals?.length ? (
                <EmptyState type="goal" title="No goals yet" className="py-6" />
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const pColor = GOAL_PRIORITY_COLORS[goal.priority];
                    return (
                      <div key={goal.id} className="p-4 rounded-lg border border-zinc-100 bg-zinc-50">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', pColor.bg, pColor.text, pColor.border)}>
                              {goal.priority}
                            </span>
                            <StatusBadge status={goal.status} size="sm" />
                          </div>
                          {goal.target_date && (
                            <span className="text-xs text-zinc-500 flex-shrink-0">
                              Due {formatDate(goal.target_date)}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-zinc-900 mb-2">{goal.title}</p>
                        <Progress value={goal.completion_percentage} size="sm" color="indigo" showLabel />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Employment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Employee Code</p>
                <p className="text-sm font-mono text-zinc-900">{employee.employee_code}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Employment Status</p>
                <StatusBadge status={employee.employment_status} className="mt-1" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Hire Date</p>
                <p className="text-sm text-zinc-900">{formatDate(employee.hire_date)}</p>
              </div>
              {employee.job_level && (
                <div>
                  <p className="text-xs text-zinc-500">Job Level</p>
                  <p className="text-sm text-zinc-900">{employee.job_level}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
