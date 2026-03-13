'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  Assessment,
  AssessmentWithDetails,
  AssessmentTemplate,
  AssessmentQuestion,
  AssessmentResponse,
  Goal,
  Notification,
  DashboardStats,
  FilterState,
  EmployeeFilters,
  AssessmentFormData,
  ResponseData,
  EmployeeWithProfile,
  Department,
  AssessmentStatus,
} from '@/types';

// ============================================================
// DASHBOARD
// ============================================================
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const supabase = createClient();

      // Total employees
      const { count: totalEmployees, error: empErr } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');
      if (empErr) throw empErr;

      // Active assessments
      const { count: activeAssessments, error: activeErr } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress']);
      if (activeErr) throw activeErr;

      // Completed this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: completedThisMonth, error: compErr } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'completed'])
        .gte('submitted_at', monthStart);
      if (compErr) throw compErr;

      // Average score
      const { data: scoreData, error: scoreErr } = await supabase
        .from('assessments')
        .select('overall_score')
        .in('status', ['submitted', 'completed'])
        .not('overall_score', 'is', null);
      if (scoreErr) throw scoreErr;
      const avgScore =
        scoreData && scoreData.length > 0
          ? scoreData.reduce((sum, a) => sum + (a.overall_score ?? 0), 0) / scoreData.length
          : 0;

      // Score trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: trendData, error: trendErr } = await supabase
        .from('assessments')
        .select('overall_score, submitted_at')
        .in('status', ['submitted', 'completed'])
        .not('overall_score', 'is', null)
        .gte('submitted_at', sixMonthsAgo.toISOString())
        .order('submitted_at', { ascending: true });
      if (trendErr) throw trendErr;

      const trendByMonth: Record<string, { sum: number; count: number }> = {};
      (trendData ?? []).forEach((a) => {
        if (!a.submitted_at) return;
        const monthKey = new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!trendByMonth[monthKey]) trendByMonth[monthKey] = { sum: 0, count: 0 };
        trendByMonth[monthKey].sum += a.overall_score ?? 0;
        trendByMonth[monthKey].count += 1;
      });
      const score_trend = Object.entries(trendByMonth).map(([month, { sum, count }]) => ({
        month,
        score: Math.round((sum / count) * 10) / 10,
        count,
      }));

      // Department performance
      const { data: deptData, error: deptErr } = await supabase
        .from('department_performance')
        .select('department_name, avg_score, assessment_count');
      if (deptErr) throw deptErr;
      const department_performance = (deptData ?? []).map((d) => ({
        department: d.department_name ?? 'Unknown',
        avg_score: d.avg_score ?? 0,
        count: d.assessment_count ?? 0,
      }));

      // Recent assessments
      const { data: recentData, error: recentErr } = await supabase
        .from('assessments')
        .select(`
          *,
          template:assessment_templates(*),
          employee:employees(
            *,
            profile:profiles(*),
            department:departments(*),
            manager:employees(*, profile:profiles(*))
          ),
          reviewer:profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentErr) throw recentErr;

      return {
        total_employees: totalEmployees ?? 0,
        active_assessments: activeAssessments ?? 0,
        completed_this_month: completedThisMonth ?? 0,
        avg_score: Math.round(avgScore * 10) / 10,
        score_trend,
        department_performance,
        recent_assessments: (recentData ?? []) as AssessmentWithDetails[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// EMPLOYEES
// ============================================================
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery<EmployeeWithProfile[]>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(*),
          department:departments(*),
          manager:employees(*, profile:profiles(*))
        `)
        .order('created_at', { ascending: false });

      if (filters?.employment_status) {
        query = query.eq('employment_status', filters.employment_status);
      }
      if (filters?.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      if (filters?.manager_id) {
        query = query.eq('manager_id', filters.manager_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data ?? []) as EmployeeWithProfile[];

      // Client-side search across joined profile fields
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(
          (e) =>
            e.profile?.full_name?.toLowerCase().includes(s) ||
            e.profile?.email?.toLowerCase().includes(s) ||
            e.employee_code?.toLowerCase().includes(s) ||
            e.job_title?.toLowerCase().includes(s)
        );
      }

      return result;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery<EmployeeWithProfile | null>({
    queryKey: ['employees', id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles(*),
          department:departments(*),
          manager:employees(*, profile:profiles(*))
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as EmployeeWithProfile;
    },
    enabled: !!id,
  });
}

// ============================================================
// DEPARTMENTS
// ============================================================
export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Department[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useDepartmentPerformance() {
  return useQuery({
    queryKey: ['departments', 'performance'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('department_performance')
        .select('department_name, avg_score, assessment_count');
      if (error) throw error;
      return (data ?? []).map((d) => ({
        department: d.department_name as string,
        avg_score: d.avg_score as number ?? 0,
        count: d.assessment_count as number ?? 0,
      }));
    },
  });
}

// ============================================================
// ASSESSMENTS
// ============================================================
export function useAssessments(filters?: FilterState) {
  return useQuery<AssessmentWithDetails[]>({
    queryKey: ['assessments', filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('assessments')
        .select(`
          *,
          template:assessment_templates(*),
          employee:employees(
            *,
            profile:profiles(*),
            department:departments(*),
            manager:employees(*, profile:profiles(*))
          ),
          reviewer:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data ?? []) as AssessmentWithDetails[];

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        result = result.filter((a) => a.title?.toLowerCase().includes(s));
      }

      return result;
    },
    staleTime: 60 * 1000,
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery<AssessmentWithDetails | null>({
    queryKey: ['assessments', id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          template:assessment_templates(*),
          employee:employees(
            *,
            profile:profiles(*),
            department:departments(*),
            manager:employees(*, profile:profiles(*))
          ),
          reviewer:profiles(*),
          responses:assessment_responses(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as AssessmentWithDetails;
    },
    enabled: !!id,
  });
}

export function useAssessmentQuestions(templateId: string | undefined) {
  return useQuery<AssessmentQuestion[]>({
    queryKey: ['templates', templateId, 'questions'],
    queryFn: async () => {
      if (!templateId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AssessmentQuestion[];
    },
    enabled: !!templateId,
  });
}

export function useAssessmentResponses(assessmentId: string | undefined) {
  return useQuery<AssessmentResponse[]>({
    queryKey: ['assessments', assessmentId, 'responses'],
    queryFn: async () => {
      if (!assessmentId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);
      if (error) throw error;
      return (data ?? []) as AssessmentResponse[];
    },
    enabled: !!assessmentId,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation<Assessment, Error, AssessmentFormData>({
    mutationFn: async (formData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assessments')
        .insert({
          ...formData,
          created_by: user.id,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSubmitResponses() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { assessmentId: string; responses: ResponseData[] }>({
    mutationFn: async ({ assessmentId, responses }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (responses.length > 0) {
        const responseRows = responses.map((r) => ({
          assessment_id: assessmentId,
          question_id: r.question_id,
          numeric_value: r.numeric_value ?? null,
          text_value: r.text_value ?? null,
          selected_option: r.selected_option ?? null,
          boolean_value: r.boolean_value ?? null,
          responded_by: user.id,
        }));

        const { error: upsertErr } = await supabase
          .from('assessment_responses')
          .upsert(responseRows, { onConflict: 'assessment_id,question_id' });
        if (upsertErr) throw upsertErr;
      }

      // Calculate score via RPC
      await supabase.rpc('calculate_assessment_score', { p_assessment_id: assessmentId });

      // Update status
      const { error: statusErr } = await supabase
        .from('assessments')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', assessmentId);
      if (statusErr) throw statusErr;
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateAssessmentStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; status: AssessmentStatus }>({
    mutationFn: async ({ id, status }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('assessments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

// ============================================================
// TEMPLATES
// ============================================================
export function useTemplates() {
  return useQuery<AssessmentTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AssessmentTemplate[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data: template, error: templateErr } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (templateErr) throw templateErr;

      const { data: sections, error: sectionsErr } = await supabase
        .from('assessment_sections')
        .select('*')
        .eq('template_id', id)
        .order('display_order', { ascending: true });
      if (sectionsErr) throw sectionsErr;

      const { data: questions, error: questionsErr } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', id)
        .order('display_order', { ascending: true });
      if (questionsErr) throw questionsErr;

      return {
        ...template,
        sections: (sections ?? []).map((s) => ({
          ...s,
          questions: (questions ?? []).filter((q) => q.section_id === s.id),
        })),
      };
    },
    enabled: !!id,
  });
}

// ============================================================
// GOALS
// ============================================================
export function useGoals(employeeId?: string) {
  return useQuery<Goal[]>({
    queryKey: ['goals', employeeId ?? 'all'],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation<Goal, Error, Partial<Goal>>({
    mutationFn: async (goalData) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('goals')
        .insert(goalData)
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation<Goal, Error, { id: string; updates: Partial<Goal> }>({
    mutationFn: async ({ id, updates }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const supabase = createClient();
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (notificationId) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
