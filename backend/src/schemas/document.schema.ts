import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Tiêu đề tài liệu là bắt buộc' }).min(1, 'Tiêu đề tài liệu là bắt buộc').trim(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
  }),
});

export const getDocumentsSchema = z.object({
  query: z.object({
    search: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
  }),
});

export const getDocumentByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Thiếu ID tài liệu').transform(val => parseInt(val, 10)).refine(val => !isNaN(val), 'ID tài liệu không hợp lệ'),
  }),
});

export const getDocumentStatusSchema = getDocumentByIdSchema;

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Tiêu đề tài liệu là bắt buộc' }).min(1, 'Tiêu đề tài liệu là bắt buộc').trim(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    solution_text: z.string().nullable().optional(),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Thiếu ID tài liệu').transform(val => parseInt(val, 10)).refine(val => !isNaN(val), 'ID tài liệu không hợp lệ'),
  }),
  body: z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống').trim().optional(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    solution_text: z.string().nullable().optional(),
  }),
});
