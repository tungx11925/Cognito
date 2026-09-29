import { z } from 'zod';

export const startFocusSessionSchema = z.object({
  body: z.object({
    target_duration_seconds: z.number().int().min(60, { message: 'Thời gian mục tiêu tối thiểu là 60 giây (1 phút)' }).max(14400, { message: 'Thời gian mục tiêu tối đa là 4 giờ' }).default(1500),
    document_id: z.number().int().positive().nullable().optional(),
    quiz_id: z.number().int().positive().nullable().optional(),
    learning_goal_id: z.number().int().positive().nullable().optional(),
  }),
});

export const recordDistractionEventSchema = z.object({
  body: z.object({
    event_type: z.enum(['TAB_SWITCH', 'PAGE_BLUR', 'PAGE_HIDDEN', 'IDLE', 'RETURNED'], {
      message: 'Loại sự kiện mất tập trung không hợp lệ',
    }),
    duration_seconds: z.number().int().min(0).default(0).optional(),
    details: z.record(z.string(), z.any()).optional(),
  }),
});

export const finishFocusSessionSchema = z.object({
  body: z.object({
    status: z.enum(['COMPLETED', 'INTERRUPTED', 'CANCELLED'], {
      message: 'Trạng thái kết thúc phiên không hợp lệ',
    }),
    actual_duration_seconds: z.number().int().min(0, { message: 'Thời gian tập trung thực tế phải >= 0' }),
  }),
});

export const focusPingSchema = z.object({
  body: z.object({
    seconds: z.number().int().min(1, { message: 'Số giây tối thiểu là 1' }).max(300, { message: 'Số giây tối đa là 300' }),
  }),
});
