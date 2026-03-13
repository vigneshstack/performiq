import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const assessmentStatusSchema = z.enum([
  'draft',
  'pending',
  'in_progress',
  'completed',
  'archived',
]);

export const questionTypeSchema = z.enum([
  'rating',
  'text',
  'multiple_choice',
  'scale',
  'yes_no',
]);

export const assigneeRoleSchema = z.enum([
  'self',
  'manager',
  'peer',
  'direct_report',
]);

// ---------------------------------------------------------------------------
// Assignee sub-schema
// ---------------------------------------------------------------------------

export const assigneeSchema = z.object({
  employee_id: z.string().uuid({ message: 'employee_id must be a valid UUID' }),
  role: assigneeRoleSchema,
});

// ---------------------------------------------------------------------------
// createAssessmentSchema
// Used when creating a new assessment from a template.
// ---------------------------------------------------------------------------

export const createAssessmentSchema = z.object({
  template_id: z
    .string()
    .uuid({ message: 'template_id must be a valid UUID' }),

  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title must be 200 characters or fewer' })
    .transform((v) => v.trim()),

  description: z
    .string()
    .max(1000, { message: 'Description must be 1000 characters or fewer' })
    .optional()
    .nullable()
    .transform((v) => v?.trim() ?? null),

  due_date: z
    .string()
    .datetime({ message: 'due_date must be a valid ISO 8601 datetime string' })
    .optional()
    .nullable(),

  status: assessmentStatusSchema.optional().default('pending'),

  assignees: z
    .array(assigneeSchema)
    .min(1, { message: 'At least one assignee is required' })
    .optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

// ---------------------------------------------------------------------------
// updateAssessmentSchema
// Partial schema for PATCH requests.
// ---------------------------------------------------------------------------

export const updateAssessmentSchema = createAssessmentSchema.partial().extend({
  // ID is required when updating
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;

// ---------------------------------------------------------------------------
// assessmentResponseSchema
// Represents a single question response.
// At least one value field must be present.
// ---------------------------------------------------------------------------

export const assessmentResponseSchema = z
  .object({
    question_id: z
      .string()
      .uuid({ message: 'question_id must be a valid UUID' }),

    assignment_id: z
      .string()
      .uuid({ message: 'assignment_id must be a valid UUID' }),

    value_text: z
      .string()
      .max(5000, { message: 'Text response must be 5000 characters or fewer' })
      .optional()
      .nullable(),

    value_numeric: z
      .number()
      .min(0, { message: 'Numeric value must be >= 0' })
      .max(10, { message: 'Numeric value must be <= 10' })
      .optional()
      .nullable(),

    value_choice: z
      .string()
      .max(500, { message: 'Choice value must be 500 characters or fewer' })
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      data.value_text != null ||
      data.value_numeric != null ||
      data.value_choice != null,
    {
      message: 'At least one of value_text, value_numeric, or value_choice must be provided',
      path: ['value_text'],
    },
  );

export type AssessmentResponseInput = z.infer<typeof assessmentResponseSchema>;

// ---------------------------------------------------------------------------
// assessmentResponsesSchema
// Array of responses — used for bulk submit.
// ---------------------------------------------------------------------------

export const assessmentResponsesSchema = z
  .array(assessmentResponseSchema)
  .min(1, { message: 'At least one response is required' });

export type AssessmentResponsesInput = z.infer<typeof assessmentResponsesSchema>;

// ---------------------------------------------------------------------------
// submitAssessmentSchema
// Top-level payload for the submit endpoint.
// ---------------------------------------------------------------------------

export const submitAssessmentSchema = z.object({
  assignment_id: z
    .string()
    .uuid({ message: 'assignment_id must be a valid UUID' }),

  responses: assessmentResponsesSchema,
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
