'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Types
// (These would normally be imported from a shared types file.)
// ---------------------------------------------------------------------------

export interface AssessmentWithDetails {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  assignment_id: string;
}

export interface AssessmentQuestion {
  id: string;
  section_id: string;
  text: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'scale' | 'yes_no';
  options?: string[] | null;
  required: boolean;
  weight?: number | null;
  order_index: number;
}

export interface AssessmentResponse {
  id: string;
  question_id: string;
  assignment_id: string;
  value_text: string | null;
  value_numeric: number | null;
  value_choice: string | null;
  submitted_at: string | null;
}

export interface ResponseData {
  value_text?: string;
  value_numeric?: number;
  value_choice?: string;
}

export interface Section {
  id: string;
  title: string;
  order_index: number;
}

interface ResponseFormProps {
  assessment: AssessmentWithDetails;
  questions: AssessmentQuestion[];
  sections: Section[];
  existingResponses: AssessmentResponse[];
  onSubmitSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Question input components
// ---------------------------------------------------------------------------

interface QuestionInputProps {
  question: AssessmentQuestion;
  value: ResponseData | undefined;
  onChange: (questionId: string, data: ResponseData) => void;
}

function RatingInput({ question, value, onChange }: QuestionInputProps) {
  const max = 5;
  const current = value?.value_numeric ?? 0;

  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Rating for: ${question.text}`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(question.id, { value_numeric: n })}
          aria-label={`${n} out of ${max}`}
          aria-pressed={n === current}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-100',
            n === current
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-gray-300 bg-white text-gray-500 hover:border-indigo-400 hover:text-indigo-600',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ScaleInput({ question, value, onChange }: QuestionInputProps) {
  const current = value?.value_numeric;

  return (
    <div className="space-y-2">
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={current ?? 5}
        onChange={(e) => onChange(question.id, { value_numeric: Number(e.target.value) })}
        className="w-full accent-indigo-600"
        aria-label={question.text}
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>1</span>
        <span className="font-medium text-indigo-600">{current ?? '—'}</span>
        <span>10</span>
      </div>
    </div>
  );
}

function TextInput({ question, value, onChange }: QuestionInputProps) {
  return (
    <textarea
      value={value?.value_text ?? ''}
      onChange={(e) => onChange(question.id, { value_text: e.target.value })}
      rows={4}
      placeholder="Type your response here…"
      aria-label={question.text}
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700',
        'placeholder:text-gray-400',
        'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
        'resize-none',
      )}
    />
  );
}

function MultipleChoiceInput({ question, value, onChange }: QuestionInputProps) {
  const options = question.options ?? [];

  return (
    <div className="space-y-2" role="radiogroup" aria-label={question.text}>
      {options.map((opt) => (
        <label
          key={opt}
          className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-4 py-3 hover:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
        >
          <input
            type="radio"
            name={`q-${question.id}`}
            value={opt}
            checked={value?.value_choice === opt}
            onChange={() => onChange(question.id, { value_choice: opt })}
            className="accent-indigo-600"
          />
          <span className="text-sm text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function YesNoInput({ question, value, onChange }: QuestionInputProps) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label={question.text}>
      {['Yes', 'No'].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(question.id, { value_choice: opt })}
          aria-pressed={value?.value_choice === opt}
          className={cn(
            'flex-1 rounded-md border-2 py-2.5 text-sm font-medium transition-all duration-100',
            value?.value_choice === opt
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function QuestionInput(props: QuestionInputProps) {
  switch (props.question.type) {
    case 'rating':
      return <RatingInput {...props} />;
    case 'scale':
      return <ScaleInput {...props} />;
    case 'text':
      return <TextInput {...props} />;
    case 'multiple_choice':
      return <MultipleChoiceInput {...props} />;
    case 'yes_no':
      return <YesNoInput {...props} />;
    default:
      return <TextInput {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Supabase mutation helpers
// ---------------------------------------------------------------------------

interface UpsertPayload {
  assignment_id: string;
  question_id: string;
  value_text: string | null;
  value_numeric: number | null;
  value_choice: string | null;
  submitted_at: string | null;
}

async function upsertResponses(
  assignmentId: string,
  responses: Record<string, ResponseData>,
  submit: boolean,
) {
  const supabase = createClient();
  const now = submit ? new Date().toISOString() : null;

  const payload: UpsertPayload[] = Object.entries(responses).map(([qId, data]) => ({
    assignment_id: assignmentId,
    question_id: qId,
    value_text: data.value_text ?? null,
    value_numeric: data.value_numeric ?? null,
    value_choice: data.value_choice ?? null,
    submitted_at: now,
  }));

  const { error } = await supabase
    .from('assessment_responses')
    .upsert(payload, { onConflict: 'assignment_id,question_id' });

  if (error) throw error;

  if (submit) {
    const { error: assignError } = await supabase
      .from('assessment_assignments')
      .update({ status: 'completed', completed_at: now })
      .eq('id', assignmentId);

    if (assignError) throw assignError;
  }
}

// ---------------------------------------------------------------------------
// ResponseForm
// ---------------------------------------------------------------------------

export function ResponseForm({
  assessment,
  questions,
  sections,
  existingResponses,
  onSubmitSuccess,
}: ResponseFormProps) {
  const queryClient = useQueryClient();

  // ------------------------------------------------------------------
  // Build initial responses map from existing server data
  // ------------------------------------------------------------------
  const initialResponses = useMemo<Record<string, ResponseData>>(() => {
    return existingResponses.reduce<Record<string, ResponseData>>((acc, r) => {
      acc[r.question_id] = {
        value_text: r.value_text ?? undefined,
        value_numeric: r.value_numeric ?? undefined,
        value_choice: r.value_choice ?? undefined,
      };
      return acc;
    }, {});
  }, [existingResponses]);

  const [responses, setResponses] = useState<Record<string, ResponseData>>(initialResponses);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ------------------------------------------------------------------
  // Sort sections and group questions
  // ------------------------------------------------------------------
  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.order_index - b.order_index),
    [sections],
  );

  const questionsBySection = useMemo(() => {
    return sortedSections.reduce<Record<string, AssessmentQuestion[]>>((acc, section) => {
      acc[section.id] = questions
        .filter((q) => q.section_id === section.id)
        .sort((a, b) => a.order_index - b.order_index);
      return acc;
    }, {});
  }, [sortedSections, questions]);

  const currentSection = sortedSections[currentSectionIndex];
  const currentQuestions = currentSection ? (questionsBySection[currentSection.id] ?? []) : [];
  const isLastSection = currentSectionIndex === sortedSections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  // ------------------------------------------------------------------
  // Completion counts per section
  // ------------------------------------------------------------------
  const sectionCompletionCount = useCallback(
    (sectionId: string): { answered: number; total: number } => {
      const qs = questionsBySection[sectionId] ?? [];
      const answered = qs.filter((q) => {
        const r = responses[q.id];
        if (!r) return false;
        return (
          (r.value_text !== undefined && r.value_text !== '') ||
          r.value_numeric !== undefined ||
          (r.value_choice !== undefined && r.value_choice !== '')
        );
      }).length;
      return { answered, total: qs.length };
    },
    [questionsBySection, responses],
  );

  // ------------------------------------------------------------------
  // Overall progress
  // ------------------------------------------------------------------
  const overallProgress = useMemo(() => {
    const required = questions.filter((q) => q.required);
    const answered = required.filter((q) => {
      const r = responses[q.id];
      if (!r) return false;
      return (
        (r.value_text !== undefined && r.value_text !== '') ||
        r.value_numeric !== undefined ||
        (r.value_choice !== undefined && r.value_choice !== '')
      );
    }).length;
    return required.length === 0 ? 100 : Math.round((answered / required.length) * 100);
  }, [questions, responses]);

  // ------------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------------

  const autoSaveMutation = useMutation({
    mutationFn: async () => {
      await upsertResponses(assessment.assignment_id, responses, false);
    },
    onMutate: () => setAutoSaveStatus('saving'),
    onSuccess: () => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    },
    onError: () => setAutoSaveStatus('error'),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await upsertResponses(assessment.assignment_id, responses, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessment', assessment.id] });
      onSubmitSuccess?.();
    },
  });

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  const handleResponseChange = useCallback((questionId: string, data: ResponseData) => {
    setResponses((prev) => ({ ...prev, [questionId]: data }));
  }, []);

  const handlePrevSection = () => {
    if (!isFirstSection) {
      autoSaveMutation.mutate();
      setCurrentSectionIndex((i) => i - 1);
    }
  };

  const handleNextSection = () => {
    if (!isLastSection) {
      autoSaveMutation.mutate();
      setCurrentSectionIndex((i) => i + 1);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      // Fire-and-forget; no await in cleanup
      upsertResponses(assessment.assignment_id, responses, false).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (!currentSection) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No sections found in this assessment.</p>
      </div>
    );
  }

  const isSubmitting = submitMutation.isPending;
  const isSubmitSuccess = submitMutation.isSuccess;

  if (isSubmitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-semibold text-gray-900">Assessment Submitted</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Your responses have been saved. Thank you for completing this assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------------- */}
      {/* Overall progress bar */}
      {/* ---------------------------------------------------------------- */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Overall completion</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Section tabs */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {sortedSections.map((section, idx) => {
          const { answered, total } = sectionCompletionCount(section.id);
          const isActive = idx === currentSectionIndex;
          const isComplete = answered === total && total > 0;

          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                autoSaveMutation.mutate();
                setCurrentSectionIndex(idx);
              }}
              className={cn(
                'flex shrink-0 flex-col items-start rounded-md border px-4 py-2.5 text-left transition-all duration-100',
                isActive
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
              )}
            >
              <span className={cn('text-xs font-medium', isActive ? 'text-indigo-700' : 'text-gray-600')}>
                {idx + 1}. {section.title}
              </span>
              <span className={cn('mt-0.5 text-xs', isComplete ? 'text-green-600' : 'text-gray-400')}>
                {answered}/{total} answered
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Current section questions */}
      {/* ---------------------------------------------------------------- */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Section {currentSectionIndex + 1}: {currentSection.title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {sectionCompletionCount(currentSection.id).answered} of{' '}
            {sectionCompletionCount(currentSection.id).total} questions answered
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {currentQuestions.map((question, qIdx) => (
            <div key={question.id} className="px-6 py-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-gray-800">
                  {qIdx + 1}. {question.text}
                  {question.required && (
                    <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                  )}
                </p>
                {responses[question.id] && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" aria-label="Answered" />
                )}
              </div>

              <QuestionInput
                question={question}
                value={responses[question.id]}
                onChange={handleResponseChange}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Auto-save status + navigation */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        {/* Auto-save indicator */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {autoSaveStatus === 'saving' && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving…</span>
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <Save className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Saved</span>
            </>
          )}
          {autoSaveStatus === 'error' && (
            <span className="text-red-500">Auto-save failed</span>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {!isFirstSection && (
            <button
              type="button"
              onClick={handlePrevSection}
              disabled={isSubmitting}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                'transition-colors duration-100',
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>
          )}

          {isLastSection ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white',
                'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                'transition-colors duration-100',
                isSubmitting && 'cursor-not-allowed opacity-70',
              )}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Submit Assessment
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextSection}
              disabled={isSubmitting}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white',
                'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                'transition-colors duration-100',
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResponseForm;
