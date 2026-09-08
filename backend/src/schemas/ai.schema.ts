import { z } from 'zod';

export const aiChatSchema = z.object({
  body: z.object({
    document_id: z.number().optional(),
    message: z.string().min(1, 'Vui lòng nhập tin nhắn'),
    chat_history: z.array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({ text: z.string() })),
      })
    ).optional(),
    document_content: z.string().optional(),
    force_regenerate: z.boolean().optional(),
  }),
});

export const aiGenerateQuizSchema = z.object({
  body: z.object({
    document_id: z.number().optional(),
    document_content: z.string().optional(),
    difficulty: z.enum(['Dễ', 'Trung bình', 'Khó']).optional(),
  }),
});

export const aiGenerateFlashcardsSchema = z.object({
  body: z.object({
    document_id: z.number().optional(),
    document_content: z.string().optional(),
    deck_id: z.number().optional(),
  }),
});

export const aiGenerateFlashcardsFromNoteSchema = z.object({
  body: z.object({
    document_id: z.number().optional(),
    note_content: z.string().min(1, 'Nội dung ghi chú không được để trống'),
    deck_id: z.number().optional(),
  }),
});

export const aiGenerateMindmapSchema = z.object({
  body: z.object({
    document_id: z.number().optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    force_regenerate: z.boolean().optional(),
  }),
});

export const aiGetMindmapSchema = z.object({
  params: z.object({
    docId: z.string().regex(/^\d+$/, 'ID tài liệu không hợp lệ'),
  }),
});
