import { z } from 'zod';

export const logActivitySchema = z.object({
  body: z.object({
    activity_type: z.string({ message: 'activity_type là bắt buộc' }).min(1),
    entity_type: z.string().optional(),
    entity_id: z.number().int().optional(),
    duration_seconds: z.number().nonnegative().optional().default(0),
    subject: z.string().optional(),
    details: z.record(z.string(), z.any()).optional().default({}),
    idempotency_key: z.string().optional(),
  }),
});

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Tiêu đề mục tiêu là bắt buộc' }).min(1, 'Tiêu đề không được để trống').max(255),
    subject: z.string().optional().nullable(),
    target_type: z.enum(
      ['study_time_minutes', 'quizzes_completed', 'flashcards_reviewed', 'documents_read'] as const
    ),
    target_value: z.number({ message: 'target_value là bắt buộc' }).int().positive('Chỉ tiêu phải lớn hơn 0'),
    period: z.enum(['daily', 'weekly'] as const).optional().default('daily'),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID mục tiêu phải là số'),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    subject: z.string().optional().nullable(),
    target_type: z.enum(['study_time_minutes', 'quizzes_completed', 'flashcards_reviewed', 'documents_read'] as const).optional(),
    target_value: z.number().int().positive().optional(),
    period: z.enum(['daily', 'weekly'] as const).optional(),
    is_active: z.boolean().optional(),
  }),
});
