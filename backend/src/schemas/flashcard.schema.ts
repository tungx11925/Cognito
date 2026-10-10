import { z } from 'zod';

export const flashcardItemSchema = z.object({
  id: z.number().optional(),
  front: z.string({ message: 'Thuật ngữ (mặt trước) là bắt buộc' }).min(1, 'Thuật ngữ không được để trống').max(1000, 'Thuật ngữ tối đa 1.000 ký tự').trim(),
  back: z.string({ message: 'Định nghĩa (mặt sau) là bắt buộc' }).min(1, 'Định nghĩa không được để trống').max(10000, 'Định nghĩa tối đa 10.000 ký tự').trim(),
  position: z.number().int().optional(),
  term_image_url: z.string().nullable().optional(),
  definition_image_url: z.string().nullable().optional(),
});

export const createDeckSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên bộ thẻ là bắt buộc' }).min(1, 'Tên bộ thẻ không được để trống').max(255).trim(),
    description: z.string().nullable().optional(),
    category: z.string().max(100).nullable().optional(),
    visibility: z.enum(['private', 'link', 'public']).optional(),
    is_public: z.boolean().optional(),
    cards: z.array(flashcardItemSchema).optional(),
  })
});

export const updateDeckSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    description: z.string().nullable().optional(),
    category: z.string().max(100).nullable().optional(),
    visibility: z.enum(['private', 'link', 'public']).optional(),
    is_public: z.boolean().optional(),
    cards: z.array(flashcardItemSchema).optional(),
  })
});

export const studySettingsSchema = z.object({
  body: z.object({
    shuffle_cards: z.boolean().optional(),
    front_display: z.enum(['term', 'definition']).optional(),
    starred_only: z.boolean().optional(),
    difficult_only: z.boolean().optional(),
    auto_tts: z.boolean().optional(),
  })
});

export const createFlashcardSchema = z.object({
  body: z.object({
    deck_id: z.number({ message: 'Thiếu ID bộ thẻ' }).or(z.string().transform(v => parseInt(v, 10))),
    document_id: z.number().nullable().optional().or(z.string().transform(v => parseInt(v, 10)).optional()),
    front: z.string({ message: 'Mặt trước (front) là bắt buộc' }).min(1, 'Mặt trước (front) không được để trống').max(1000).trim(),
    back: z.string({ message: 'Mặt sau (back) là bắt buộc' }).min(1, 'Mặt sau (back) không được để trống').max(10000).trim(),
    position: z.number().int().optional(),
    term_image_url: z.string().nullable().optional(),
    definition_image_url: z.string().nullable().optional(),
  })
});

export const updateFlashcardSchema = z.object({
  body: z.object({
    front: z.string({ message: 'Mặt trước (front) là bắt buộc' }).min(1, 'Mặt trước (front) không được để trống').max(1000).trim(),
    back: z.string({ message: 'Mặt sau (back) là bắt buộc' }).min(1, 'Mặt sau (back) không được để trống').max(10000).trim(),
    position: z.number().int().optional(),
    term_image_url: z.string().nullable().optional(),
    definition_image_url: z.string().nullable().optional(),
  })
});

export const starFlashcardSchema = z.object({
  body: z.object({
    is_starred: z.boolean({ message: 'Trạng thái is_starred là bắt buộc' })
  })
});

export const matchLeaderboardSchema = z.object({
  body: z.object({
    time_ms: z.number({ message: 'Thời gian (time_ms) là bắt buộc' })
  })
});

export const reviewFlashcardSchema = z.object({
  body: z.object({
    difficulty: z.enum(['easy', 'good', 'hard', 'again'], { message: 'Độ khó phải là easy, good, hard hoặc again' })
  })
});
