import { z } from 'zod';

export const createDeckSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên bộ thẻ là bắt buộc' }).min(1, 'Tên bộ thẻ không được để trống').trim(),
    description: z.string().nullable().optional(),
    is_public: z.boolean().optional(),
  })
});

export const updateDeckSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    description: z.string().nullable().optional(),
    is_public: z.boolean().optional(),
  })
});

export const createFlashcardSchema = z.object({
  body: z.object({
    deck_id: z.number({ message: 'Thiếu ID bộ thẻ' }).or(z.string().transform(v => parseInt(v, 10))),
    document_id: z.number().nullable().optional().or(z.string().transform(v => parseInt(v, 10)).optional()),
    front: z.string({ message: 'Mặt trước (front) là bắt buộc' }).min(1, 'Mặt trước (front) không được để trống').trim(),
    back: z.string({ message: 'Mặt sau (back) là bắt buộc' }).min(1, 'Mặt sau (back) không được để trống').trim(),
  })
});

export const updateFlashcardSchema = z.object({
  body: z.object({
    front: z.string({ message: 'Mặt trước (front) là bắt buộc' }).min(1, 'Mặt trước (front) không được để trống').trim(),
    back: z.string({ message: 'Mặt sau (back) là bắt buộc' }).min(1, 'Mặt sau (back) không được để trống').trim(),
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
    difficulty: z.enum(['easy', 'good', 'hard'], { message: 'Độ khó phải là easy, good hoặc hard' })
  })
});
