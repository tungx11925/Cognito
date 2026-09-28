import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().trim().max(255).optional(),
    content: z.string({ message: 'Nội dung ghi chú là bắt buộc' }).min(1, 'Nội dung ghi chú không được để trống'),
    document_id: z.union([z.number().int().positive(), z.null()]).optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().trim().max(255).optional(),
    content: z.string().min(1, 'Nội dung ghi chú không được để trống').optional(),
    document_id: z.union([z.number().int().positive(), z.null()]).optional(),
  }),
});

export const getNotesQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    document_id: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)).optional(),
  }).optional(),
});
