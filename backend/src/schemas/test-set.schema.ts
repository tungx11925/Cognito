import { z } from 'zod';

export const configKeyParamsSchema = z.object({
  params: z.object({
    configKey: z.string().min(1, 'Mã cấu hình không được để trống'),
  }),
});

export const updateAIConfigSchema = z.object({
  params: z.object({
    configKey: z.string().min(1, 'Mã cấu hình không được để trống'),
  }),
  body: z.object({
    use_custom_prompt: z.boolean().optional(),
    custom_prompt: z.string().optional(),
    multiple_choice_count: z.number().min(0).max(100).optional(),
    multiple_choice_score: z.number().min(0).optional(),
    fill_blank_count: z.number().min(0).max(100).optional(),
    fill_blank_score: z.number().min(0).optional(),
    essay_count: z.number().min(0).max(100).optional(),
    essay_score: z.number().min(0).optional(),
    true_false_count: z.number().min(0).max(100).optional(),
    true_false_score: z.number().min(0).optional(),
  }),
});

export const deckIdParamsSchema = z.object({
  params: z.object({
    deckId: z.string().regex(/^\d+$/, 'ID bộ flashcard phải là số hợp lệ'),
  }),
});

export const docIdParamsSchema = z.object({
  params: z.object({
    docId: z.string().regex(/^\d+$/, 'ID tài liệu phải là số hợp lệ'),
  }),
});

export const testSetIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID bộ đề phải là số hợp lệ'),
  }),
});

export const toggleTestSetStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID bộ đề phải là số hợp lệ'),
  }),
  body: z.object({
    is_active: z.boolean({ message: 'is_active phải là kiểu boolean' }),
  }),
});

export const testSetQuestionsParamsSchema = z.object({
  params: z.object({
    testSetId: z.string().regex(/^\d+$/, 'ID bộ đề phải là số hợp lệ'),
  }),
});

export const updateSingleQuestionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID câu hỏi phải là số hợp lệ'),
  }),
  body: z.object({
    content: z.string().optional(),
    score: z.number().min(0).optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).optional(),
    options: z.any().optional(),
    correct_answer: z.any().optional(),
    explanation: z.string().nullable().optional(),
    difficulty: z.string().nullable().optional(),
  }),
});

export const bulkUpdateQuestionsSchema = z.object({
  body: z.object({
    questions: z.array(
      z.object({
        id: z.number({ message: 'ID câu hỏi là bắt buộc' }),
        content: z.string().optional(),
        score: z.number().min(0).optional(),
        status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).optional(),
        options: z.any().optional(),
        correct_answer: z.any().optional(),
        explanation: z.string().nullable().optional(),
        difficulty: z.string().nullable().optional(),
      })
    ).min(1, 'Danh sách câu hỏi không được rỗng'),
  }),
});
