'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import {
  useAssessment,
  useAssessmentQuestions,
  useAssessmentResponses,
  useSubmitResponses,
} from '@/hooks/useAssessments';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatDate, formatScore, scoreToGrade, scoreToColor, scoreToBgColor,
  ASSESSMENT_TYPE_LABELS, getCompletionPercentage, cn,
} from '@/lib/utils';
import type { AssessmentQuestion, ResponseData, AssessmentSection } from '@/types';

// ============================================================
// QUESTION RENDERER
// ============================================================
function QuestionRenderer({
  question,
  value,
  onChange,
  disabled,
}: {
  question: AssessmentQuestion;
  value: ResponseData | undefined;
  onChange: (data: ResponseData) => void;
  disabled?: boolean;
}) {
  const base = (question: AssessmentQuestion): ResponseData => ({ question_id: question.id });

  if (question.question_type === 'rating') {
    const min = question.min_value ?? 1;
    const max = question.max_value ?? 5;
    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {nums.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...base(question), numeric_value: n })}
              className={cn(
                'w-11 h-11 rounded-xl text-sm font-semibold border-2 transition-all',
                value?.numeric_value === n
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {(question.min_label || question.max_label) && (
          <div className="flex justify-between text-xs text-zinc-400 px-1">
            <span>{question.min_label}</span>
            <span>{question.max_label}</span>
          </div>
        )}
      </div>
    );
  }

  if (question.question_type === 'scale') {
    const min = question.min_value ?? 1;
    const max = question.max_value ?? 10;
    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {nums.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...base(question), numeric_value: n })}
              className={cn(
                'w-9 h-9 rounded-lg text-sm font-semibold border-2 transition-all',
                value?.numeric_value === n
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {(question.min_label || question.max_label) && (
          <div className="flex justify-between text-xs text-zinc-400 px-1">
            <span>{question.min_label}</span>
            <span>{question.max_label}</span>
          </div>
        )}
      </div>
    );
  }

  if (question.question_type === 'text') {
    return (
      <Textarea
        value={value?.text_value ?? ''}
        onChange={(e) => onChange({ ...base(question), text_value: e.target.value })}
        disabled={disabled}
        placeholder="Type your response…"
        rows={4}
      />
    );
  }

  if (question.question_type === 'yes_no') {
    return (
      <div className="flex gap-3">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...base(question), boolean_value: v })}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
              value?.boolean_value === v
                ? v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-600 border-red-600 text-white'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            )}
          >
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    );
  }

  if (question.question_type === 'multiple_choice' && question.options) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...base(question), selected_option: opt })}
            className={cn(
              'p-3 rounded-xl text-sm font-medium border-2 text-left transition-all',
              value?.selected_option === opt
                ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50/50'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

// ============================================================
// SCORE CIRCLE
// ============================================================
function ScoreCircle({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = (score / 5) * 100;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (pct / 100) * circ;

  const strokeColor = score >= 4.5 ? '#10b981' : score >= 3.5 ? '#3b82f6' : score >= 2.5 ? '#f59e0b' : score >= 1.5 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f4f4f5" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={strokeColor} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold', scoreToColor(score))}>{formatScore(score)}</span>
          <span className="text-xs text-zinc-500">out of 5</span>
        </div>
      </div>
      <span className={cn('text-lg font-bold', scoreToColor(score))}>{scoreToGrade(score)}</span>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function AssessmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: assessment, isLoading } = useAssessment(id);
  const { data: questions } = useAssessmentQuestions(assessment?.template_id);
  const { data: existingResponses } = useAssessmentResponses(id);
  const submitMutation = useSubmitResponses();

  const [responses, setResponses] = useState<Record<string, ResponseData>>({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  // Pre-fill existing responses
  useEffect(() => {
    if (existingResponses?.length) {
      const map: Record<string, ResponseData> = {};
      existingResponses.forEach((r) => {
        map[r.question_id] = {
          question_id: r.question_id,
          numeric_value: r.numeric_value,
          text_value: r.text_value,
          selected_option: r.selected_option,
          boolean_value: r.boolean_value,
        };
      });
      setResponses(map);
    }
  }, [existingResponses]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-8">
        <EmptyState
          type="assessment"
          title="Assessment not found"
          action={<Link href="/assessments"><Button variant="outline">Back to Assessments</Button></Link>}
        />
      </div>
    );
  }

  const isReadOnly = ['submitted', 'completed', 'cancelled'].includes(assessment.status);

  // Group questions by section
  const sectionMap: Map<string | null, AssessmentQuestion[]> = new Map();
  const sectionMeta: Map<string | null, AssessmentSection | { id: null; title: string; display_order: number }> = new Map();

  (questions ?? []).forEach((q) => {
    const sid = q.section_id;
    if (!sectionMap.has(sid)) sectionMap.set(sid, []);
    sectionMap.get(sid)!.push(q);
  });

  // We'll just use section IDs in order
  const sectionIds = Array.from(sectionMap.keys());
  const currentSectionId = sectionIds[currentSectionIdx];
  const currentQuestions = sectionMap.get(currentSectionId) ?? [];

  const allQuestions = Array.from(sectionMap.values()).flat();
  const answeredCount = allQuestions.filter((q) => {
    const r = responses[q.id];
    if (!r) return false;
    return r.numeric_value != null || r.text_value?.trim() || r.selected_option || r.boolean_value != null;
  }).length;
  const completionPct = getCompletionPercentage(answeredCount, allQuestions.length);

  async function handleSubmit() {
    const responsesList = Object.values(responses);
    try {
      await submitMutation.mutateAsync({ assessmentId: id, responses: responsesList });
      toast({ title: 'Assessment submitted!', type: 'success' });
    } catch (err) {
      toast({ title: 'Submission failed', description: String(err), type: 'error' });
    }
  }

  async function handleSaveAndNext() {
    // Save current section responses
    const responsesList = Object.values(responses);
    if (responsesList.length > 0) {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const rows = responsesList.map((r) => ({
            assessment_id: id,
            question_id: r.question_id,
            numeric_value: r.numeric_value ?? null,
            text_value: r.text_value ?? null,
            selected_option: r.selected_option ?? null,
            boolean_value: r.boolean_value ?? null,
            responded_by: user.id,
          }));
          await supabase.from('assessment_responses').upsert(rows, { onConflict: 'assessment_id,question_id' });
          // Update status to in_progress
          await supabase.from('assessments').update({ status: 'in_progress' }).eq('id', id).eq('status', 'pending');
        }
      } catch {
        // Continue even if save fails
      }
    }
    setCurrentSectionIdx((i) => i + 1);
  }

  // Read-only (completed) view
  if (isReadOnly) {
    return (
      <div className="p-8 space-y-6 max-w-3xl mx-auto">
        <Link href="/assessments" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
          <ChevronLeft className="h-4 w-4" /> Back to Assessments
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={assessment.status} />
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                  {ASSESSMENT_TYPE_LABELS[assessment.type]}
                </span>
              </div>
              <h1 className="text-xl font-bold text-zinc-900">{assessment.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                <Avatar src={assessment.employee?.profile?.avatar_url} name={assessment.employee?.profile?.full_name} size="xs" />
                <span>{assessment.employee?.profile?.full_name}</span>
                {assessment.submitted_at && <span>· Submitted {formatDate(assessment.submitted_at)}</span>}
              </div>
            </div>
            {assessment.overall_score != null && (
              <ScoreCircle score={assessment.overall_score} />
            )}
          </div>
        </div>

        {/* Questions (read-only) */}
        {Array.from(sectionMap.entries()).map(([sid, qs], idx) => (
          <Card key={String(sid)}>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-base font-semibold text-zinc-900 pb-3 border-b border-zinc-100">
                Section {idx + 1}
              </h2>
              {qs.map((q, qi) => {
                const r = responses[q.id] ?? existingResponses?.find((er) => er.question_id === q.id);
                return (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium text-zinc-800">
                      {qi + 1}. {q.question_text}
                    </p>
                    <div className="text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
                      {r ? (
                        r.numeric_value != null ? (
                          <span className={cn('font-bold', scoreToColor(r.numeric_value))}>{r.numeric_value}</span>
                        ) : r.text_value ? (
                          <span>{r.text_value}</span>
                        ) : r.selected_option ? (
                          <span>{r.selected_option}</span>
                        ) : r.boolean_value != null ? (
                          <span>{r.boolean_value ? 'Yes' : 'No'}</span>
                        ) : '—'
                      ) : (
                        <span className="text-zinc-400 italic">No response</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Active (form) view
  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <Link href="/assessments" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ChevronLeft className="h-4 w-4" /> Back to Assessments
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={assessment.status} />
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                {ASSESSMENT_TYPE_LABELS[assessment.type]}
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900">{assessment.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
              <Avatar src={assessment.employee?.profile?.avatar_url} name={assessment.employee?.profile?.full_name} size="xs" />
              <span>{assessment.employee?.profile?.full_name}</span>
              {assessment.due_date && <span>· Due {formatDate(assessment.due_date)}</span>}
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{completionPct}%</p>
            <p className="text-xs text-zinc-500">{answeredCount}/{allQuestions.length} answered</p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={completionPct} color="indigo" size="default" />
        </div>
      </div>

      {/* Section Tabs */}
      {sectionIds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sectionIds.map((sid, idx) => {
            const sQs = sectionMap.get(sid) ?? [];
            const answered = sQs.filter((q) => {
              const r = responses[q.id];
              return r && (r.numeric_value != null || r.text_value?.trim() || r.selected_option || r.boolean_value != null);
            }).length;
            return (
              <button
                key={String(sid)}
                onClick={() => setCurrentSectionIdx(idx)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentSectionIdx === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                )}
              >
                Section {idx + 1}
                {answered > 0 && (
                  <span className={cn('ml-1.5 text-xs', currentSectionIdx === idx ? 'text-indigo-200' : 'text-zinc-400')}>
                    {answered}/{sQs.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Questions */}
      <Card>
        <CardContent className="p-6 space-y-8">
          {currentQuestions.map((q, qi) => (
            <div key={q.id} className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-sm font-bold text-zinc-400 w-6 flex-shrink-0">{qi + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {q.question_text}
                    {q.is_required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <div className="mt-3">
                    <QuestionRenderer
                      question={q}
                      value={responses[q.id]}
                      onChange={(data) => setResponses((prev) => ({ ...prev, [q.id]: data }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSectionIdx((i) => i - 1)}
          disabled={currentSectionIdx === 0}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {currentSectionIdx < sectionIds.length - 1 ? (
          <Button onClick={handleSaveAndNext}>
            Save & Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            isLoading={submitMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4" />
            Submit Assessment
          </Button>
        )}
      </div>
    </div>
  );
}
