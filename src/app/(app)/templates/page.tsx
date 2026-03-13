'use client';

import React, { useState } from 'react';
import { Clock, FileText, HelpCircle } from 'lucide-react';
import { useTemplates, useTemplate } from '@/hooks/useAssessments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ASSESSMENT_TYPE_LABELS, cn } from '@/lib/utils';

const questionTypeIcon: Record<string, string> = {
  rating: '⭐',
  text: '✍️',
  yes_no: '✓✗',
  multiple_choice: '◉',
  scale: '📊',
};

export default function TemplatesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: templates, isLoading } = useTemplates();
  const { data: templateDetail } = useTemplate(selectedId ?? undefined);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Assessment Templates</h1>
        {templates && (
          <span className="bg-zinc-100 text-zinc-600 text-sm font-medium px-2.5 py-1 rounded-full">
            {templates.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !templates?.length ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-zinc-400" />}
          title="No templates yet"
          description="Assessment templates will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardContent className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center justify-center w-9 h-9 bg-indigo-100 rounded-lg flex-shrink-0">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="secondary" size="sm">{ASSESSMENT_TYPE_LABELS[t.type]}</Badge>
                    {t.anonymous_responses && <Badge variant="info" size="sm">Anonymous</Badge>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">{t.title}</h3>
                  {t.description && (
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{t.description}</p>
                  )}
                </div>
                {t.estimated_duration_minutes && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    ~{t.estimated_duration_minutes} min
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-zinc-100">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedId(t.id)}>
                    View Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedId} onClose={() => setSelectedId(null)} maxWidth="xl">
        <DialogHeader>
          <DialogTitle>{templateDetail?.title ?? 'Template Details'}</DialogTitle>
          {templateDetail?.description && (
            <p className="text-sm text-zinc-500 mt-1">{templateDetail.description}</p>
          )}
        </DialogHeader>
        <DialogClose onClose={() => setSelectedId(null)} />
        <DialogContent className="max-h-[65vh] overflow-y-auto space-y-4">
          {templateDetail?.instructions && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <p className="text-sm text-indigo-800">{templateDetail.instructions}</p>
            </div>
          )}
          {(templateDetail?.sections ?? []).map((section, idx) => (
            <div key={section.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                  {idx + 1}
                </span>
                <h3 className="font-semibold text-zinc-900">{section.title}</h3>
              </div>
              {section.description && (
                <p className="text-sm text-zinc-500 pl-8">{section.description}</p>
              )}
              <div className="pl-8 space-y-2">
                {section.questions.map((q, qi) => (
                  <div key={q.id} className="flex items-start gap-2 bg-zinc-50 rounded-lg p-3">
                    <span className="text-base flex-shrink-0 w-5 text-center">
                      {questionTypeIcon[q.question_type] ?? <HelpCircle className="h-4 w-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800">
                        {qi + 1}. {q.question_text}
                        {q.is_required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 capitalize">{q.question_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
