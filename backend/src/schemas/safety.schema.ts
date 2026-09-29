import { z } from 'zod';

export const reportContentSchema = z.object({
  targetType: z.enum(['resource', 'comment', 'user'], {
    message: 'Loại mục tiêu tố cáo phải là resource, comment hoặc user',
  }),
  targetId: z.coerce.number().int().positive({
    message: 'ID mục tiêu tố cáo là bắt buộc',
  }),
  reason: z.enum(
    ['SPAM', 'INAPPROPRIATE', 'COPYRIGHT_VIOLATION', 'HARASSMENT', 'FALSE_INFORMATION', 'OTHER'],
    {
      message: 'Lý do tố cáo không hợp lệ (chấp nhận: SPAM, INAPPROPRIATE, COPYRIGHT_VIOLATION, HARASSMENT, FALSE_INFORMATION, OTHER)',
    }
  ),
  details: z.string().max(1000, 'Chi tiết tố cáo không quá 1000 ký tự').optional(),
});

export const blockUserSchema = z.object({
  reason: z.string().max(500, 'Lý do chặn không quá 500 ký tự').optional(),
});

export const moderationActionSchema = z.object({
  action: z.enum(['KEEP', 'HIDE', 'REMOVE', 'WARN', 'SUSPEND'], {
    message: 'Hành động kiểm duyệt phải là KEEP, HIDE, REMOVE, WARN hoặc SUSPEND',
  }),
  reason: z.string().min(3, 'Lý do xử lý kiểm duyệt bắt buộc có ít nhất 3 ký tự'),
  notes: z.string().max(1000, 'Ghi chú nội bộ không quá 1000 ký tự').optional(),
});

export const moderationReportsQuerySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED', 'ALL']).optional().default('PENDING'),
  targetType: z.enum(['resource', 'comment', 'user', 'ALL']).optional().default('ALL'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type ReportContentInput = z.infer<typeof reportContentSchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
export type ModerationReportsQuery = z.infer<typeof moderationReportsQuerySchema>;
