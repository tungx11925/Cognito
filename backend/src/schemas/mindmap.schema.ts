import { z } from 'zod';

export const createMindmapSchema = z.object({
  body: z.object({
    title: z.string().trim().max(255).optional(),
    mermaid_code: z.string({ message: 'Mã Mermaid là bắt buộc' }).min(1, 'Mã Mermaid không được để trống'),
    document_id: z.union([z.number().int().positive(), z.null()]).optional(),
  }),
});

export const updateMindmapSchema = z.object({
  body: z.object({
    title: z.string().trim().max(255).optional(),
    mermaid_code: z.string().min(1, 'Mã Mermaid không được để trống').optional(),
    document_id: z.union([z.number().int().positive(), z.null()]).optional(),
  }),
});

export const getMindmapsQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    document_id: z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)).optional(),
  }).optional(),
});
