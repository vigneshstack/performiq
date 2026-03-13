'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, X, ClipboardList } from 'lucide-react';
import { useCreateAssessment, useTemplates, useEmployees } from '@/hooks/useAssessments';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Template {
  id: string;
  title: string;
  type: string;
}

interface Employee {
  id: string;
  profile: { full_name: string | null };
  department: { name: string } | null;
}

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const ratingSchema = z.object({
  competency: z.string().min(1, 'Competency name is required'),
  score: z.coerce
    .number()
    .min(1, 'Score must be at least 1')
    .max(5, 'Score cannot exceed 5'),
  notes: z.string().optional(),
});

const assessmentFormSchema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  template_id: z.string().optional(),
  type: z.enum(['annual', 'quarterly', 'probation', 'peer', 'self', 'project'], {
    errorMap: () => ({ message: 'Please select a type' }),
  }),
  status: z.enum(['draft', 'in_progress', 'completed', 'cancelled']),
  overall_score: z.coerce
    .number()
    .min(0)
    .max(5)
    .optional()
    .or(z.literal('')),
  due_date: z.string().optional(),
  completed_at: z.string().optional(),
  summary: z.string().optional(),
  strengths: z.string().optional(),
  areas_for_improvement: z.string().optional(),
  goals_for_next_period: z.string().optional(),
  ratings: z.array(ratingSchema),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

interface FieldLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldLabel({ htmlFor, required, children }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-zinc-700"
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all';

const textareaClass =
  'w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all';

const selectClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all';

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NewAssessmentPage() {
  const router = useRouter();
  const createAssessment = useCreateAssessment();
  const { data: templates = [] } = useTemplates() as unknown as { data: Template[] };
  const { data: employees = [] } = useEmployees() as unknown as { data: Employee[] };

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      employee_id: '',
      template_id: '',
      type: 'annual',
      status: 'draft',
      overall_score: '',
      due_date: '',
      completed_at: '',
      summary: '',
      strengths: '',
      areas_for_improvement: '',
      goals_for_next_period: '',
      ratings: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ratings',
  });

  const status = watch('status');

  const onSubmit = async (values: AssessmentFormValues) => {
    // Sanitise optional empty strings
    const typeLabels: Record<string, string> = {
      annual: 'Annual Review',
      quarterly: 'Quarterly Review',
      probation: 'Probation Review',
      peer: 'Peer Review',
      self: 'Self Assessment',
      project: 'Project Review',
    };
    const payload = {
      ...values,
      title: `${typeLabels[values.type] ?? values.type} — ${new Date().getFullYear()}`,
      overall_score:
        values.overall_score === '' ? undefined : Number(values.overall_score),
      template_id: values.template_id || undefined,
      due_date: values.due_date || undefined,
      completed_at: values.completed_at || undefined,
    };

    const result = await createAssessment.mutateAsync(payload);
    const newId: string | undefined =
      typeof result === 'object' && result !== null && 'id' in result
        ? (result as { id: string }).id
        : undefined;

    if (newId) {
      router.push(`/assessments/${newId}`);
    } else {
      router.push('/assessments');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link
          href="/assessments"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Link>

        {/* Page Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">New Assessment</h1>
            <p className="text-sm text-zinc-500">
              Fill in the details below to create a performance assessment
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Section 1: Core Details ── */}
          <Section
            title="Core Details"
            description="Basic information about this assessment"
          >
            {/* Employee */}
            <div>
              <FieldLabel htmlFor="employee_id" required>
                Employee
              </FieldLabel>
              <select id="employee_id" {...register('employee_id')} className={selectClass}>
                <option value="">Select employee...</option>
                {(employees as Employee[]).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.profile.full_name}
                    {emp.department ? ` — ${emp.department.name}` : ''}
                  </option>
                ))}
              </select>
              <FieldError message={errors.employee_id?.message} />
            </div>

            {/* Template */}
            <div>
              <FieldLabel htmlFor="template_id">Assessment Template</FieldLabel>
              <select id="template_id" {...register('template_id')} className={selectClass}>
                <option value="">No template (custom)</option>
                {(templates as Template[]).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                    {t.type ? ` (${t.type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Type + Status row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="type" required>
                  Assessment Type
                </FieldLabel>
                <select id="type" {...register('type')} className={selectClass}>
                  <option value="annual">Annual Review</option>
                  <option value="quarterly">Quarterly Review</option>
                  <option value="probation">Probation Review</option>
                  <option value="peer">Peer Review</option>
                  <option value="self">Self Assessment</option>
                  <option value="project">Project Review</option>
                </select>
                <FieldError message={errors.type?.message} />
              </div>

              <div>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <select id="status" {...register('status')} className={selectClass}>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Due Date + Completed At */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="due_date">Due Date</FieldLabel>
                <input
                  id="due_date"
                  {...register('due_date')}
                  type="date"
                  className={inputClass}
                />
              </div>

              {status === 'completed' && (
                <div>
                  <FieldLabel htmlFor="completed_at">Completed On</FieldLabel>
                  <input
                    id="completed_at"
                    {...register('completed_at')}
                    type="date"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* ── Section 2: Competency Ratings ── */}
          <Section
            title="Competency Ratings"
            description="Score each competency from 1 (poor) to 5 (exceptional)"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                {fields.length} competenc{fields.length !== 1 ? 'ies' : 'y'} added
              </span>
              <button
                type="button"
                onClick={() => append({ competency: '', score: 3, notes: '' })}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Competency
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center">
                <p className="text-sm text-zinc-400">
                  No competencies added. Click "Add Competency" to start rating.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Competency {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <FieldLabel htmlFor={`ratings.${index}.competency`} required>
                          Competency Name
                        </FieldLabel>
                        <input
                          id={`ratings.${index}.competency`}
                          {...register(`ratings.${index}.competency`)}
                          type="text"
                          placeholder="e.g. Communication"
                          className={inputClass}
                        />
                        <FieldError
                          message={errors.ratings?.[index]?.competency?.message}
                        />
                      </div>

                      <div>
                        <FieldLabel htmlFor={`ratings.${index}.score`} required>
                          Score (1–5)
                        </FieldLabel>
                        <input
                          id={`ratings.${index}.score`}
                          {...register(`ratings.${index}.score`)}
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          className={inputClass}
                        />
                        <FieldError
                          message={errors.ratings?.[index]?.score?.message}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <FieldLabel htmlFor={`ratings.${index}.notes`}>
                        Notes (optional)
                      </FieldLabel>
                      <textarea
                        id={`ratings.${index}.notes`}
                        {...register(`ratings.${index}.notes`)}
                        rows={2}
                        placeholder="Additional context for this competency..."
                        className={textareaClass}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Overall Score */}
            <div className="border-t border-zinc-100 pt-4">
              <FieldLabel htmlFor="overall_score">Overall Score (0–5)</FieldLabel>
              <input
                id="overall_score"
                {...register('overall_score')}
                type="number"
                min="0"
                max="5"
                step="0.01"
                placeholder="e.g. 3.75"
                className={`${inputClass} max-w-[160px]`}
              />
              <p className="mt-1 text-xs text-zinc-400">
                Leave blank to auto-calculate from competency scores
              </p>
              <FieldError message={errors.overall_score?.message} />
            </div>
          </Section>

          {/* ── Section 3: Written Feedback ── */}
          <Section
            title="Written Feedback"
            description="Qualitative notes to support the numerical ratings"
          >
            <div>
              <FieldLabel htmlFor="summary">Assessment Summary</FieldLabel>
              <textarea
                id="summary"
                {...register('summary')}
                rows={4}
                placeholder="Overall summary of the employee's performance during this period..."
                className={textareaClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="strengths">Key Strengths</FieldLabel>
              <textarea
                id="strengths"
                {...register('strengths')}
                rows={3}
                placeholder="List the employee's standout strengths and achievements..."
                className={textareaClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="areas_for_improvement">
                Areas for Improvement
              </FieldLabel>
              <textarea
                id="areas_for_improvement"
                {...register('areas_for_improvement')}
                rows={3}
                placeholder="Describe specific areas where growth or improvement is needed..."
                className={textareaClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="goals_for_next_period">
                Goals for Next Period
              </FieldLabel>
              <textarea
                id="goals_for_next_period"
                {...register('goals_for_next_period')}
                rows={3}
                placeholder="Outline measurable goals and objectives for the next review cycle..."
                className={textareaClass}
              />
            </div>
          </Section>

          {/* ── Form Actions ── */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/assessments"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || createAssessment.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting || createAssessment.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <ClipboardList className="h-4 w-4" />
                  Create Assessment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
