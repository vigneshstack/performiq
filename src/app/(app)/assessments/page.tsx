'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Calendar, User } from 'lucide-react';
import { useAssessments, useCreateAssessment, useTemplates, useEmployees } from '@/hooks/useAssessments';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  formatDate, formatScore, scoreToColor, scoreToGrade,
  ASSESSMENT_TYPE_LABELS, ASSESSMENT_STATUS_LABELS, isOverdue, isDueSoon, cn,
} from '@/lib/utils';
import type { AssessmentStatus, AssessmentType } from '@/types';

const createSchema = z.object({
  template_id: z.string().min(1, 'Please select a template'),
  employee_id: z.string().min(1, 'Please select an employee'),
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Type is required'),
  due_date: z.string().min(1, 'Due date is required'),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  notes: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export default function AssessmentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { toast } = useToast();

  const { data: assessments, isLoading } = useAssessments({
    search: debouncedSearch,
    status: status as AssessmentStatus | '',
    type: type as AssessmentType | '',
  });
  const { data: templates } = useTemplates();
  const { data: employees } = useEmployees();
  const createMutation = useCreateAssessment();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const watchTemplateId = watch('template_id');
  const watchEmployeeId = watch('employee_id');

  // Auto-fill title
  React.useEffect(() => {
    const template = templates?.find((t) => t.id === watchTemplateId);
    const employee = employees?.find((e) => e.id === watchEmployeeId);
    if (template && employee) {
      setValue('title', `${template.title} - ${employee.profile?.full_name ?? 'Employee'}`);
      setValue('type', template.type);
    }
  }, [watchTemplateId, watchEmployeeId, templates, employees, setValue]);

  async function onSubmit(data: CreateForm) {
    try {
      await createMutation.mutateAsync({
        template_id: data.template_id,
        employee_id: data.employee_id,
        title: data.title,
        type: data.type as AssessmentType,
        due_date: data.due_date,
        period_start: data.period_start,
        period_end: data.period_end,
        notes: data.notes,
      });
      toast({ title: 'Assessment created', type: 'success' });
      reset();
      setShowCreate(false);
    } catch (err) {
      toast({ title: 'Failed to create assessment', description: String(err), type: 'error' });
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900">Assessments</h1>
          {assessments && (
            <span className="bg-zinc-100 text-zinc-600 text-sm font-medium px-2.5 py-1 rounded-full">
              {assessments.length}
            </span>
          )}
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments…"
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All statuses"
            options={[
              { value: '', label: 'All statuses' },
              ...Object.entries(ASSESSMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
        </div>
        <div className="w-44">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="All types"
            options={[
              { value: '', label: 'All types' },
              ...Object.entries(ASSESSMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
        </div>
        {(search || status || type) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus(''); setType(''); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !assessments?.length ? (
        <EmptyState
          type="assessment"
          title="No assessments found"
          description="Create your first assessment to get started."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New Assessment
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assessments.map((a) => (
            <Card key={a.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={a.status} size="sm" />
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md flex-shrink-0">
                    {ASSESSMENT_TYPE_LABELS[a.type]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 line-clamp-2">{a.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <User className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                  <Avatar src={a.employee?.profile?.avatar_url} name={a.employee?.profile?.full_name} size="xs" />
                  <span className="truncate">{a.employee?.profile?.full_name ?? '—'}</span>
                </div>
                {a.due_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                    <span className={cn(
                      isOverdue(a.due_date) && a.status !== 'completed' && a.status !== 'submitted' ? 'text-red-600 font-medium' :
                      isDueSoon(a.due_date) ? 'text-amber-600 font-medium' : 'text-zinc-600'
                    )}>
                      Due {formatDate(a.due_date)}
                    </span>
                  </div>
                )}
                {a.overall_score != null && (
                  <div className="flex items-center gap-2">
                    <Progress value={(a.overall_score / 5) * 100} size="sm" color="indigo" className="flex-1" />
                    <span className={cn('text-sm font-bold', scoreToColor(a.overall_score))}>
                      {formatScore(a.overall_score)} ({scoreToGrade(a.overall_score)})
                    </span>
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-zinc-100">
                  <Link href={`/assessments/${a.id}`}>
                    <Button variant="outline" size="sm" className="w-full">View Assessment</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Assessment Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>New Assessment</DialogTitle>
          <p className="text-sm text-zinc-500 mt-1">Create a new performance assessment</p>
        </DialogHeader>
        <DialogClose onClose={() => setShowCreate(false)} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <Select
                {...register('template_id')}
                label="Template"
                placeholder="Select template"
                error={errors.template_id?.message}
                options={[
                  { value: '', label: 'Select template' },
                  ...(templates ?? []).map((t) => ({ value: t.id, label: t.title })),
                ]}
                required
              />
              <Select
                {...register('employee_id')}
                label="Employee"
                placeholder="Select employee"
                error={errors.employee_id?.message}
                options={[
                  { value: '', label: 'Select employee' },
                  ...(employees ?? []).map((e) => ({
                    value: e.id,
                    label: `${e.profile?.full_name ?? 'Unknown'} (${e.employee_code})`,
                  })),
                ]}
                required
              />
            </div>
            <Input
              {...register('title')}
              label="Assessment Title"
              placeholder="e.g. Annual Review - Jane Smith"
              error={errors.title?.message}
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                {...register('period_start')}
                type="date"
                label="Period Start"
                error={errors.period_start?.message}
              />
              <Input
                {...register('period_end')}
                type="date"
                label="Period End"
                error={errors.period_end?.message}
              />
              <Input
                {...register('due_date')}
                type="date"
                label="Due Date"
                error={errors.due_date?.message}
                required
              />
            </div>
            <Textarea
              {...register('notes')}
              label="Notes"
              placeholder="Optional notes or instructions…"
              rows={3}
            />
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); setShowCreate(false); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Assessment
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
