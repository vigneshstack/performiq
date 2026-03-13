// ============================================================
// ENUM TYPES
// ============================================================
export type UserRole = 'admin' | 'manager' | 'employee';
export type AssessmentStatus = 'draft' | 'pending' | 'in_progress' | 'submitted' | 'completed' | 'cancelled';
export type AssessmentType = 'annual_review' | 'quarterly_self' | '360_feedback' | 'probation_review' | 'manager_effectiveness' | 'peer_review' | 'custom';
export type QuestionType = 'rating' | 'text' | 'yes_no' | 'multiple_choice' | 'scale';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type GoalPriority = 'critical' | 'high' | 'medium' | 'low';
export type EmploymentStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'assessment' | 'goal';

// ============================================================
// DATABASE TABLE TYPES
// ============================================================
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_id: string | null;
  parent_department_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  profile_id: string;
  employee_code: string;
  department_id: string | null;
  manager_id: string | null;
  job_title: string;
  job_level: string | null;
  hire_date: string;
  probation_end_date: string | null;
  employment_status: EmploymentStatus;
  location: string | null;
  salary_band: string | null;
  created_at: string;
  updated_at: string;
}

export interface Competency {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_core: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  description: string | null;
  type: AssessmentType;
  is_active: boolean;
  instructions: string | null;
  estimated_duration_minutes: number | null;
  anonymous_responses: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentSection {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentQuestion {
  id: string;
  template_id: string;
  section_id: string | null;
  competency_id: string | null;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  display_order: number;
  min_value: number | null;
  max_value: number | null;
  min_label: string | null;
  max_label: string | null;
  options: string[] | null;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  template_id: string;
  employee_id: string;
  reviewer_id: string | null;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  submitted_at: string | null;
  overall_score: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  numeric_value: number | null;
  text_value: string | null;
  selected_option: string | null;
  boolean_value: boolean | null;
  responded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  priority: GoalPriority;
  target_date: string | null;
  completion_percentage: number;
  key_results: KeyResult[];
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
}

export interface EmployeeCompetencyScore {
  id: string;
  employee_id: string;
  competency_id: string;
  assessment_id: string | null;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// JOINED / EXTENDED TYPES
// ============================================================
export interface EmployeeWithProfile extends Employee {
  profile: Profile;
  department: Department | null;
  manager: EmployeeWithProfile | null;
}

export interface AssessmentWithDetails extends Assessment {
  template: AssessmentTemplate;
  employee: EmployeeWithProfile;
  reviewer: Profile | null;
  responses?: AssessmentResponse[];
}

export interface GoalWithEmployee extends Goal {
  employee: EmployeeWithProfile;
}

export interface TemplateWithSectionsAndQuestions extends AssessmentTemplate {
  sections: (AssessmentSection & { questions: AssessmentQuestion[] })[];
}

export interface CompetencyScore {
  competency: Competency;
  score: number;
}

// ============================================================
// APP-LEVEL TYPES
// ============================================================
export interface DashboardStats {
  total_employees: number;
  active_assessments: number;
  completed_this_month: number;
  avg_score: number;
  score_trend: ScoreTrendPoint[];
  department_performance: DepartmentPerformancePoint[];
  recent_assessments: AssessmentWithDetails[];
}

export interface ScoreTrendPoint {
  month: string;
  score: number;
  count: number;
}

export interface DepartmentPerformancePoint {
  department: string;
  avg_score: number;
  count: number;
}

export interface AssessmentFormData {
  template_id: string;
  employee_id: string;
  reviewer_id?: string;
  title: string;
  type: AssessmentType;
  period_start?: string;
  period_end?: string;
  due_date?: string;
  notes?: string;
}

export interface ResponseData {
  question_id: string;
  numeric_value?: number | null;
  text_value?: string | null;
  selected_option?: string | null;
  boolean_value?: boolean | null;
}

export interface FilterState {
  search?: string;
  status?: AssessmentStatus | '';
  type?: AssessmentType | '';
  department_id?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface EmployeeFilters {
  search?: string;
  department_id?: string;
  employment_status?: EmploymentStatus | '';
  manager_id?: string;
}
