import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const goalStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'at_risk',
  'completed',
  'cancelled',
]);

export const goalTypeSchema = z.enum([
  'individual',
  'team',
  'company',
]);

export const goalPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

// ---------------------------------------------------------------------------
// keyResultSchema
// Represents a single measurable key result linked to a goal.
// ---------------------------------------------------------------------------

export const keyResultSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Key result title is required' })
    .max(300, { message: 'Key result title must be 300 characters or fewer' })
    .transform((v) => v.trim()),

  description: z
    .string()
    .max(1000, { message: 'Description must be 1000 characters or fewer' })
    .optional()
    .nullable()
    .transform((v) => v?.trim() ?? null),

  current_value: z
    .number({ invalid_type_error: 'Current value must be a number' })
    .finite({ message: 'Current value must be a finite number' }),

  target_value: z
    .number({ invalid_type_error: 'Target value must be a number' })
    .finite({ message: 'Target value must be a finite number' }),

  unit: z
    .string()
    .min(1, { message: 'Unit is required (e.g. %, pts, $, items)' })
    .max(50, { message: 'Unit must be 50 characters or fewer' })
    .transform((v) => v.trim()),

  due_date: z
    .string()
    .datetime({ message: 'due_date must be a valid ISO 8601 datetime string' })
    .optional()
    .nullable(),
});

export type KeyResultInput = z.infer<typeof keyResultSchema>;

// ---------------------------------------------------------------------------
// createGoalSchema
// Used when creating a new goal.
// ---------------------------------------------------------------------------

export const createGoalSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Goal title is required' })
      .max(300, { message: 'Goal title must be 300 characters or fewer' })
      .transform((v) => v.trim()),

    description: z
      .string()
      .max(2000, { message: 'Description must be 2000 characters or fewer' })
      .optional()
      .nullable()
      .transform((v) => v?.trim() ?? null),

    type: goalTypeSchema.default('individual'),

    status: goalStatusSchema.default('not_started'),

    priority: goalPrioritySchema.default('medium'),

    owner_id: z
      .string()
      .uuid({ message: 'owner_id must be a valid UUID' }),

    parent_goal_id: z
      .string()
      .uuid({ message: 'parent_goal_id must be a valid UUID' })
      .optional()
      .nullable(),

    due_date: z
      .string()
      .datetime({ message: 'due_date must be a valid ISO 8601 datetime string' })
      .optional()
      .nullable(),

    start_date: z
      .string()
      .datetime({ message: 'start_date must be a valid ISO 8601 datetime string' })
      .optional()
      .nullable(),

    key_results: z
      .array(keyResultSchema)
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      if (data.start_date && data.due_date) {
        return new Date(data.start_date) <= new Date(data.due_date);
      }
      return true;
    },
    {
      message: 'start_date must be before or equal to due_date',
      path: ['start_date'],
    },
  );

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

// ---------------------------------------------------------------------------
// updateGoalSchema
// Partial version of createGoalSchema for PATCH requests.
// ---------------------------------------------------------------------------

export const updateGoalSchema = createGoalSchema
  .partial()
  .extend({
    // Explicitly allow key_results to be undefined in partial updates
    key_results: z.array(keyResultSchema).optional(),
  });

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// ---------------------------------------------------------------------------
// updateKeyResultProgressSchema
// Used for check-in updates on an individual key result.
// ---------------------------------------------------------------------------

export const updateKeyResultProgressSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  current_value: z
    .number({ invalid_type_error: 'current_value must be a number' })
    .finite({ message: 'current_value must be a finite number' }),
  note: z
    .string()
    .max(1000, { message: 'Note must be 1000 characters or fewer' })
    .optional()
    .nullable(),
});

export type UpdateKeyResultProgressInput = z.infer<typeof updateKeyResultProgressSchema>;
