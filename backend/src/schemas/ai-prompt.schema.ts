import { z } from 'zod';

export const createPromptTemplateSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Tiêu đề mẫu prompt là bắt buộc' }).min(1, 'Tiêu đề không được để trống').max(255).trim(),
    prompt_text: z.string({ message: 'Nội dung prompt là bắt buộc' }).min(1, 'Nội dung prompt không được để trống').trim(),
    category: z.string().max(100).optional().default('custom'),
  })
});

export const createPromptHistorySchema = z.object({
  body: z.object({
    document_id: z.number().nullable().optional().or(z.string().transform(v => parseInt(v, 10)).optional()),
    prompt_text: z.string({ message: 'Nội dung prompt là bắt buộc' }).min(1).trim(),
    context_mode: z.enum(['document', 'general', 'DOCUMENT_CONTEXT', 'GENERAL']).optional().default('document').transform(v => (v.toUpperCase() === 'GENERAL' || v === 'general') ? 'general' : 'document'),
    scope: z.string().max(100).optional().default('full'),
    is_pinned: z.boolean().optional().default(false),
  })
});
