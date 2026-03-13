// ---------------------------------------------------------------------------
// Barrel re-export of all Zod validation schemas and inferred TypeScript types.
// Import from '@/lib/validations' rather than from individual files.
// ---------------------------------------------------------------------------

// Auth schemas
export {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth';

export type {
  LoginInput,
  SignupInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth';

// Assessment schemas
export {
  assessmentStatusSchema,
  questionTypeSchema,
  assigneeRoleSchema,
  assigneeSchema,
  createAssessmentSchema,
  updateAssessmentSchema,
  assessmentResponseSchema,
  assessmentResponsesSchema,
  submitAssessmentSchema,
} from './assessment';

export type {
  CreateAssessmentInput,
  UpdateAssessmentInput,
  AssessmentResponseInput,
  AssessmentResponsesInput,
  SubmitAssessmentInput,
} from './assessment';

// Goal schemas
export {
  goalStatusSchema,
  goalTypeSchema,
  goalPrioritySchema,
  keyResultSchema,
  createGoalSchema,
  updateGoalSchema,
  updateKeyResultProgressSchema,
} from './goal';

export type {
  KeyResultInput,
  CreateGoalInput,
  UpdateGoalInput,
  UpdateKeyResultProgressInput,
} from './goal';
