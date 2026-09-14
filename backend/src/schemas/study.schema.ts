import { z } from 'zod';

export const activePingSchema = z.object({
  body: z.object({
    seconds: z.number().min(1, 'Số giây phải lớn hơn 0'),
  }),
});

export const createStudySessionSchema = z.object({
  body: z.object({
    document_id: z.number(),
    duration_seconds: z.number().min(1, 'Thời gian học phải lớn hơn 0'),
  }),
});

export const upsertNoteSchema = z.object({
  body: z.object({
    document_id: z.number(),
    title: z.string().optional(),
    content: z.string().min(1, 'Nội dung ghi chú không được để trống'),
  }),
});

export const getNotesByDocumentSchema = z.object({
  params: z.object({
    docId: z.string().regex(/^\d+$/, 'ID tài liệu không hợp lệ'),
  }),
});
