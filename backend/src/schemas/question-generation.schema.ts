import { z } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Zod schemas cho Question Generator.
 * LƯU Ý: type dùng đúng enum question_type THẬT trong DB (UPPERCASE):
 *   CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE','FILL_BLANK','ESSAY','TRUE_FALSE')
 * options/correctAnswer giữ format lưu trong questions.options / questions.correct_answer (JSONB)
 * giống ai-engine.service.ts: options = { "A","B","C","D" }, correct_answer = string | string[]
 */

// ─────────────────────────── Request body ───────────────────────────

export const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'FILL_BLANK', 'ESSAY', 'TRUE_FALSE'] as const;
export const TEMPLATE_IDS = ['beginner_explanation', 'basic_quiz', 'exam_questions', 'critical_thinking'] as const;

export const generateQuestionsSchema = z.object({
  body: z.object({
    /** Nguồn slide/tài liệu (multi-select) — join qua document_id */
    sourceIds: z.array(z.number().int().positive()).min(1, 'Cần chọn ít nhất 1 tài liệu').max(10).optional(),
    /** Nguồn văn bản trực tiếp (paste/upload/deck) — dùng khi không chọn tài liệu */
    textContent: z.string().min(20, 'Nội dung quá ngắn (tối thiểu 20 ký tự)').max(60_000).optional(),
    /** Trọng tâm từ khoá (chips bật/tắt ở FE) */
    focusKeywords: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    /** Đối tượng học sinh */
    audienceLevel: z.enum(['weak', 'medium', 'advanced']).default('medium'),
    /** Loại câu hỏi ('mixed' → dùng cấu hình theo từng loại như luồng cũ) */
    questionType: z.enum([...QUESTION_TYPES, 'mixed']).default('mixed'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    quantity: z.number().int().min(1, 'Số câu tối thiểu 1').max(50, 'Số câu tối đa 50').default(10),
    /** Prompt template có sẵn (xem PROMPT_TEMPLATES) */
    templateId: z.enum(TEMPLATE_IDS).default('basic_quiz'),
    /** Model AI chọn từ dropdown GET /api/ai/models */
    modelId: z.number().int().positive().optional(),
    /** Hướng dẫn thêm của người dùng (đã sanitize chống prompt injection) */
    customInstruction: z.string().max(500, 'Hướng dẫn thêm tối đa 500 ký tự').optional(),
    mode: z.enum(['practice', 'exam']).default('practice'),
    name: z.string().trim().max(200).optional(),
    /** configKey của ai_task_configs (mặc định 'default' — khớp FE hiện tại) */
    configKey: z.string().trim().max(255).optional(),
  }).refine(b => !!b.sourceIds || !!b.textContent, {
    message: 'Cần chọn ít nhất 1 tài liệu hoặc cung cấp nội dung văn bản',
  }),
});

export const questionIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Thiếu ID câu hỏi').transform(val => parseInt(val, 10)).refine(val => !isNaN(val), 'ID câu hỏi không hợp lệ'),
  }),
});

export const updateQuestionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Thiếu ID câu hỏi').transform(val => parseInt(val, 10)).refine(val => !isNaN(val), 'ID câu hỏi không hợp lệ'),
  }),
  body: z.object({
    content: z.string().min(5, 'Nội dung câu hỏi tối thiểu 5 ký tự').optional(),
    score: z.number().min(0).max(100).optional(),
    options: z.record(z.string(), z.string()).optional(),
    correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().max(5000).nullable().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  }),
});

export const testSetIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Thiếu ID bộ đề').transform(val => parseInt(val, 10)).refine(val => !isNaN(val), 'ID bộ đề không hợp lệ'),
  }),
});

export const documentIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Thiếu ID tài liệu').transform(val => parseInt(val, 10)).refine(val => !isNaN(val), 'ID tài liệu không hợp lệ'),
  }),
});

// ─────────────────────────── AI Output schema ───────────────────────────

export const GeneratedQuestionSchema = z.object({
  content: z.string().min(5, 'Nội dung câu hỏi quá ngắn'),
  type: z.enum(QUESTION_TYPES),
  score: z.number().min(0).max(100).optional(),
  options: z.record(z.string(), z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  explanation: z.string().min(1).max(5000),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  sourceKeyword: z.string().min(1).max(100),
  sourceChunkId: z.number().int().positive().nullable().optional(),
});

export const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(1, 'AI không trả về câu hỏi nào'),
  notes: z.string().max(2000).optional(),
});

export type GeneratedQuestionOutput = z.infer<typeof GeneratedQuestionSchema>;

// ─────────────────────────── Sanitize user instruction (chống prompt injection) ───────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /bỏ\s*qua\s+(tất\s*cả\s+)?(các\s+)?hướng\s+dẫn/i,
  /qua\s+mặt\s+(các\s+)?quy\s+tắc/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /cho\s+tôi\s+xem\s+system\s+prompt/i,
  /đổi\s+vai\s+trò/i,
  /you\s+are\s+now\s+a/i,
  /disregard\s+(all\s+)?(previous|above)\s+(instructions|rules)/i,
  /<\s*script/i,
];

export function sanitizeUserInstruction(raw?: string | null): string | null {
  const value = (raw || '').trim();
  if (!value) return null;
  if (value.length > 500) {
    throw new AppError('Hướng dẫn thêm tối đa 500 ký tự', 400);
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      throw new AppError('Hướng dẫn thêm chứa nội dung không được phép (cố tình ghi đè chỉ dẫn hệ thống)', 400);
    }
  }
  return value;
}
