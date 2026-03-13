'use client';

import React from 'react';
import { Building2, Users } from 'lucide-react';
import { useDepartments } from '@/hooks/useAssessments';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Departments</h1>
        {departments && (
          <span className="bg-zinc-100 text-zinc-600 text-sm font-medium px-2.5 py-1 rounded-full">
            {departments.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !departments?.length ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10 text-zinc-400" />}
          title="No departments yet"
          description="Departments will appear here once they've been added."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg flex-shrink-0">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{dept.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
