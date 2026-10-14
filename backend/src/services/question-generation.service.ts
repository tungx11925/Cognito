import { db } from '../db';
import { aiProviderService } from './ai-provider.service';
import { documentChunksRepository, DocumentChunkRow } from '../repositories/document-chunks.repository';
import { documentProcessingService, DocumentChunkStatus } from './document-processing.service';
import { sanitizeUserInstruction } from '../schemas/question-generation.schema';
import { AppError } from '../utils/AppError';
import { jaccardSimilarity } from '../utils/math.utils';
import {
  QUIZ_SYSTEM_PROMPT,
  AIQuizGenerationOutputSchema,
  buildQuizUserPrompt,
  normalizeAIQuestions,
  CleanQuizQuestion,
} from '../utils/quiz-system-prompt';

export const QUESTION_GEN_SYSTEM_PROMPT = QUIZ_SYSTEM_PROMPT;

export const PROMPT_TEMPLATES: Record<string, { name: string; description: string; prompt: string }> = {
  beginner_explanation: {
    name: 'Beginner Explanation',
    description: 'Mặc định cho học sinh yếu, giải thích từng bước dễ hiểu',
    prompt: 'Ưu tiên câu hỏi kiểm tra hiểu biết nền tảng, mỗi câu có explanation giải thích từng bước dễ hiểu bằng ngôn ngữ đơn giản.',
  },
  basic_quiz: {
    name: 'Basic Quiz',
    description: 'Trắc nghiệm kiểm tra nhận biết & thông hiểu cơ bản',
    prompt: 'Phân bổ câu hỏi bám sát nội dung bài học, ưu tiên nhận biết và thông hiểu.',
  },
  exam_questions: {
    name: 'Exam Questions',
    description: 'Đề thi chuẩn hóa theo thang đo nhận thức Bloom',
    prompt: 'Phân bổ câu hỏi theo các mức nhận thức (nhận biết → thông hiểu → vận dụng → vận dụng cao).',
  },
  critical_thinking: {
    name: 'Critical Thinking',
    description: 'Câu hỏi tư duy phản biện, phân tích và giải quyết vấn đề',
    prompt: 'Ưu tiên câu hỏi phân tích nguyên nhân-kết quả, so sánh, đánh giá, tình huống thực tế.',
  },
};

export interface GenerateQuestionsInput {
  userId: number;
  sourceIds?: number[];
  textContent?: string;
  focusKeywords?: string[];
  audienceLevel?: 'weak' | 'medium' | 'advanced';
  questionType?: 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'ESSAY' | 'TRUE_FALSE' | 'mixed';
  difficulty?: 'easy' | 'medium' | 'hard';
  quantity?: number;
  templateId?: string;
  modelId?: number;
  customInstruction?: string;
  customPrompt?: string;
  topic?: string;
  mode?: 'practice' | 'exam';
  name?: string;
  configKey?: string;
}

export interface GeneratedQuestionRecord {
  id: number;
  test_set_id: number;
  type: string;
  content: string;
  score: string | number;
  options: any;
  correct_answer: any;
  status: string;
  explanation: string | null;
  difficulty: string | null;
  source_keyword: string | null;
  source_chunk_id: number | null;
}

export interface GenerateQuestionsResult {
  status: 'SUCCESS' | 'PROCESSING';
  message?: string;
  processingDocs?: DocumentChunkStatus[];
  testSet?: any;
  questions?: GeneratedQuestionRecord[];
}

function parseJSONStrict(text: string): any {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }
  return JSON.parse(cleaned);
}

/**
 * Làm sạch văn bản và lọc các dòng lặp lại như header/footer/số trang.
 */
function cleanAndNormalizeText(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => line.trim())
    // Lọc các dòng số trang lặp lại (ví dụ "Trang 1/20", "Slide 5")
    .filter(line => !/^(trang|slide|page)\s*\d+(\/\d+)?$/i.test(line))
    .join('\n')
    // Gộp khoảng trắng và dòng trống liên tiếp
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Chọn lọc nội dung bao phủ đại diện đều khắp tài liệu trong giới hạn ký tự cho phép.
 */
function selectRepresentativeContent(chunks: DocumentChunkRow[], maxChars = 14000): string {
  if (chunks.length === 0) return '';
  
  const totalLength = chunks.reduce((sum, c) => sum + (c.content?.length || 0), 0);
  if (totalLength <= maxChars) {
    return cleanAndNormalizeText(chunks.map(c => c.content).join('\n\n'));
  }

  // Nếu tài liệu dài, chia đều các phân đoạn để lấy đại diện từ đầu, giữa đến cuối tài liệu
  const avgChunkLen = Math.max(1, Math.round(totalLength / chunks.length));
  const maxChunksToPick = Math.max(1, Math.floor(maxChars / avgChunkLen));
  
  if (maxChunksToPick >= chunks.length) {
    return cleanAndNormalizeText(chunks.map(c => c.content).join('\n\n')).substring(0, maxChars);
  }

  const step = chunks.length / maxChunksToPick;
  const picked: string[] = [];
  let currentChars = 0;

  for (let i = 0; i < maxChunksToPick; i++) {
    const idx = Math.min(chunks.length - 1, Math.floor(i * step));
    const content = cleanAndNormalizeText(chunks[idx].content);
    if (currentChars + content.length <= maxChars) {
      picked.push(content);
      currentChars += content.length;
    } else {
      const remaining = maxChars - currentChars;
      if (remaining > 200) {
        picked.push(content.substring(0, remaining));
      }
      break;
    }
  }

  return picked.join('\n\n');
}

export class QuestionGenerationService {
  /**
   * Sinh câu hỏi trắc nghiệm AI tối ưu toàn diện:
   * 1. Xác thực nguồn tài liệu và quyền truy cập của người dùng.
   * 2. Tiền xử lý, làm sạch văn bản, kiểm tra tính đầy đủ của tài liệu.
   * 3. Ghép System Prompt và User Prompt kèm tùy chỉnh an toàn.
   * 4. Gọi AI đúng 1 request ban đầu cho toàn bộ đề thi, tối đa 1 retry khi lỗi cấu trúc JSON.
   * 5. Parse, validation Zod, khử trùng lặp câu hỏi bằng code (không gọi AI).
   * 6. Lưu bộ đề và câu hỏi vào Database theo cấu trúc hiện hành.
   */
  async generate(input: GenerateQuestionsInput): Promise<GenerateQuestionsResult> {
    const userId = input.userId;
    const difficulty = (input.difficulty || 'medium') as 'easy' | 'medium' | 'hard';
    const quantity = Math.max(1, Math.min(50, Number(input.quantity) || 10));
    const mode = input.mode || 'practice';
    const customPromptRaw = (input.customPrompt || input.customInstruction || '').trim();
    const sanitizedInstruction = customPromptRaw ? sanitizeUserInstruction(customPromptRaw) : undefined;

    let contextText = '';
    let docTitleSuggestion: string | undefined = undefined;

    // ── BƯỚC 1: Thu thập và chuẩn bị tài liệu ──
    if (input.sourceIds && input.sourceIds.length > 0) {
      const docsRes = await db.query(
        `SELECT id, title, status, doc_url, file_type, user_id
         FROM documents
         WHERE id = ANY($1::int[]) AND (user_id = $2 OR visibility = 'public')`,
        [input.sourceIds, userId]
      );

      if (docsRes.rows.length === 0) {
        throw new AppError('Không tìm thấy tài liệu nào hợp lệ trong danh sách đã chọn hoặc bạn không có quyền truy cập', 404);
      }

      docTitleSuggestion = docsRes.rows[0].title;

      // Đảm bảo tài liệu đã được trích xuất văn bản
      const chunkStatuses = await documentProcessingService.ensureChunked(docsRes.rows);
      const notReady = chunkStatuses.filter(s => s.status !== 'READY' || s.chunkCount === 0);
      if (notReady.length > 0) {
        return {
          status: 'PROCESSING',
          message: 'Tài liệu đang được xử lý văn bản, vui lòng đợi trong giây lát...',
          processingDocs: notReady,
        };
      }

      const readyDocIds = chunkStatuses.filter(s => s.status === 'READY').map(s => s.documentId);
      const chunks = await documentChunksRepository.listByDocuments(readyDocIds, { perDocLimit: 60, totalCap: 200 });
      if (chunks.length === 0) {
        throw new AppError('Tài liệu chưa có nội dung văn bản để tạo đề thi.', 400);
      }

      // Chọn lọc nội dung đại diện bao phủ đều khắp tài liệu (tối đa ~14.000 ký tự)
      contextText = selectRepresentativeContent(chunks, 14000);

    } else if (input.textContent && input.textContent.trim()) {
      contextText = cleanAndNormalizeText(input.textContent.trim()).substring(0, 14000);
    } else if (input.topic && input.topic.trim()) {
      contextText = `Chủ đề kiến thức trọng tâm yêu cầu: ${input.topic.trim().substring(0, 4000)}`;
    } else {
      throw new AppError('Cần chọn ít nhất 1 tài liệu, cung cấp nội dung văn bản, hoặc nhập chủ đề câu hỏi', 400);
    }

    // ── BƯỚC 2: Kiểm tra mức độ đầy đủ của tài liệu (Section 5.3) ──
    const words = contextText.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length < 30) {
      throw new AppError(
        'Nội dung tài liệu quá ngắn hoặc không đọc được chữ để tạo bài trắc nghiệm chính xác. Vui lòng chọn tài liệu khác hoặc bổ sung thêm nội dung (tối thiểu 30 từ).',
        400
      );
    }

    // ── BƯỚC 3: Ghép Prompt và gọi AI API đúng 1 request ──
    const userPromptContent = buildQuizUserPrompt({
      documentText: contextText,
      quantity,
      difficulty,
      customPrompt: sanitizedInstruction || undefined,
      titleSuggestion: input.name || (docTitleSuggestion ? `Trắc nghiệm: ${docTitleSuggestion}` : undefined),
    });

    const messages = [
      { role: 'system' as const, content: QUIZ_SYSTEM_PROMPT },
      { role: 'user' as const, content: userPromptContent },
    ];

    const tryParseAndValidate = (text: string) => {
      try {
        const rawObj = parseJSONStrict(text);
        let parsed = AIQuizGenerationOutputSchema.safeParse(rawObj);
        if (parsed.success) {
          return parsed.data;
        }
        // Trường hợp AI trả về mảng trực tiếp
        if (Array.isArray(rawObj)) {
          parsed = AIQuizGenerationOutputSchema.safeParse({ questions: rawObj });
          if (parsed.success) return parsed.data;
        }
      } catch {
        // Parse error
      }
      return null;
    };

    // Gọi AI Provider (Gemini / Groq được cấu hình từ server qua AIProviderService)
    const aiResult = await aiProviderService.chat({
      messages,
      modelId: input.modelId || null,
      temperature: 0.3,
      maxTokens: 4096,
      jsonMode: true,
      taskType: 'question_generation',
      userId,
    });

    let validatedData = tryParseAndValidate(aiResult.text);

    // ── BƯỚC 4: Tối đa 1 lần retry khi lỗi JSON parse hoặc sai schema (Section 8.1) ──
    if (!validatedData) {
      console.warn('[QuestionGen] Kết quả ban đầu không đạt JSON schema, thực hiện retry 1 lần duy nhất...');
      try {
        const retryResult = await aiProviderService.chat({
          messages: [
            ...messages,
            { role: 'assistant' as const, content: aiResult.text },
            {
              role: 'user' as const,
              content:
                'Kết quả trước không đúng định dạng JSON yêu cầu. Vui lòng chỉ trả về đúng chuỗi JSON hợp lệ theo schema: { "title": "...", "questions": [ { "question": "...", "options": { "A": "...", "B": "...", "C": "...", "D": "..." }, "correctAnswer": "A", "explanation": "..." } ] }, không thêm markdown.',
            },
          ],
          modelId: input.modelId || null,
          temperature: 0.2,
          maxTokens: 4096,
          jsonMode: true,
          taskType: 'question_generation',
          userId,
        });
        validatedData = tryParseAndValidate(retryResult.text);
      } catch (retryErr: any) {
        console.error('[QuestionGen] Lỗi khi retry câu hỏi:', retryErr?.message || retryErr);
      }
    }

    if (!validatedData || !Array.isArray(validatedData.questions) || validatedData.questions.length === 0) {
      throw new AppError('AI phản hồi không đúng cấu trúc đề thi trắc nghiệm. Vui lòng thử lại.', 422);
    }

    // ── BƯỚC 5: Chuẩn hóa và khử câu trùng lặp bằng thuật toán code (không gọi AI) ──
    const normalizedQuestions = normalizeAIQuestions(validatedData.questions);
    const validQuestions: CleanQuizQuestion[] = [];

    for (const q of normalizedQuestions) {
      // Bỏ qua nếu câu hỏi rỗng hoặc thiếu phương án
      if (!q.question || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
        continue;
      }
      // Kiểm tra trùng lặp với các câu đã nhận
      const isDuplicate = validQuestions.some(
        existing => jaccardSimilarity(existing.question, q.question) > 0.80
      );
      if (!isDuplicate) {
        validQuestions.push(q);
      }
    }

    if (validQuestions.length === 0) {
      throw new AppError('Không tạo được câu hỏi trắc nghiệm hợp lệ từ tài liệu đã cung cấp.', 422);
    }

    // Lấy tối đa số lượng câu yêu cầu
    const finalQuestions = validQuestions.slice(0, quantity);

    // ── BƯỚC 6: Lưu đề thi và câu hỏi vào Database trong 1 transaction an toàn ──
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const testName =
        input.name?.trim() ||
        validatedData.title?.trim() ||
        (docTitleSuggestion
          ? `Trắc nghiệm: ${docTitleSuggestion}`
          : `Bài trắc nghiệm AI (${new Date().toLocaleDateString('vi-VN')})`);

      const totalScore = finalQuestions.length * 1.0;

      let configId: number | null = null;
      if (input.configKey) {
        const cfgRes = await client.query(
          'SELECT id FROM ai_task_configs WHERE course_id = $1 AND user_id = $2 LIMIT 1',
          [input.configKey, userId]
        );
        configId = cfgRes.rows[0]?.id || null;
      }

      const generationConfig = {
        sourceIds: input.sourceIds || [],
        difficulty,
        mode,
        customPrompt: sanitizedInstruction || null,
        requestedCount: quantity,
        generatedCount: finalQuestions.length,
      };

      const testSetRes = await client.query(
        `INSERT INTO test_sets (name, config_id, total_questions, total_score, is_active, created_by, generation_config, ai_model_id, status)
         VALUES ($1, $2, $3, $4, true, $5, $6, $7, 'DRAFT') RETURNING *`,
        [testName, configId, finalQuestions.length, totalScore, userId, JSON.stringify(generationConfig), input.modelId || null]
      );
      const testSet = testSetRes.rows[0];

      const insertedQuestions: GeneratedQuestionRecord[] = [];
      for (const q of finalQuestions) {
        const qRes = await client.query(
          `INSERT INTO questions (test_set_id, type, content, score, status, options, correct_answer, explanation, difficulty)
           VALUES ($1, 'MULTIPLE_CHOICE', $2, 1.0, 'DRAFT', $3, $4, $5, $6) RETURNING *`,
          [
            testSet.id,
            q.question,
            JSON.stringify(q.options),
            JSON.stringify(q.correctAnswer),
            q.explanation,
            difficulty,
          ]
        );
        insertedQuestions.push(qRes.rows[0]);
      }

      await client.query('COMMIT');

      return {
        status: 'SUCCESS',
        testSet,
        questions: insertedQuestions,
        message: `Đã tạo thành công ${finalQuestions.length} câu hỏi trắc nghiệm bám sát tài liệu.`,
      };
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }
  }

  /**
   * Cập nhật câu hỏi trong lúc Preview (DRAFT)
   */
  async updateQuestion(userId: number, questionId: number, data: {
    content?: string;
    score?: number;
    options?: any;
    correct_answer?: any;
    explanation?: string | null;
    difficulty?: string;
  }) {
    const checkRes = await db.query(
      `SELECT q.id, q.test_set_id, ts.created_by
       FROM questions q
       JOIN test_sets ts ON ts.id = q.test_set_id
       WHERE q.id = $1 AND ts.created_by = $2`,
      [questionId, userId]
    );

    if (checkRes.rows.length === 0) {
      throw new AppError('Câu hỏi không tồn tại hoặc bạn không có quyền chỉnh sửa', 404);
    }

    const updated = await db.query(
      `UPDATE questions SET
         content = COALESCE($1, content),
         score = COALESCE($2, score),
         options = COALESCE($3, options),
         correct_answer = COALESCE($4, correct_answer),
         explanation = COALESCE($5, explanation),
         difficulty = COALESCE($6, difficulty),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        data.content,
        data.score,
        data.options ? JSON.stringify(data.options) : null,
        data.correct_answer ? JSON.stringify(data.correct_answer) : null,
        data.explanation !== undefined ? data.explanation : null,
        data.difficulty || null,
        questionId,
      ]
    );

    return updated.rows[0];
  }

  /**
   * Xoá câu hỏi trong lúc Preview
   */
  async deleteQuestion(userId: number, questionId: number) {
    const checkRes = await db.query(
      `SELECT q.id, q.test_set_id, ts.created_by, q.score
       FROM questions q
       JOIN test_sets ts ON ts.id = q.test_set_id
       WHERE q.id = $1 AND ts.created_by = $2`,
      [questionId, userId]
    );

    if (checkRes.rows.length === 0) {
      return null;
    }

    const row = checkRes.rows[0];
    await db.query('DELETE FROM questions WHERE id = $1', [questionId]);

    // Cập nhật lại số lượng và tổng điểm của bộ đề
    await db.query(
      `UPDATE test_sets SET
         total_questions = GREATEST(0, total_questions - 1),
         total_score = GREATEST(0, total_score - $1),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [Number(row.score) || 0, row.test_set_id]
    );

    return row;
  }

  /**
   * Duyệt bộ đề: chuyển status từ DRAFT → APPROVED (Lưu chính thức)
   */
  async approveTestSet(userId: number, testSetId: number) {
    const checkRes = await db.query(
      'SELECT id, name, status FROM test_sets WHERE id = $1 AND created_by = $2',
      [testSetId, userId]
    );

    if (checkRes.rows.length === 0) {
      throw new AppError('Bộ đề không tồn tại hoặc bạn không có quyền duyệt', 404);
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const tsRes = await client.query(
        `UPDATE test_sets SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [testSetId]
      );

      await client.query(
        `UPDATE questions SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
         WHERE test_set_id = $1`,
        [testSetId]
      );

      await client.query('COMMIT');
      return tsRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Lấy chi tiết bộ đề và danh sách câu hỏi
   */
  async getTestSet(userId: number, testSetId: number) {
    const tsRes = await db.query(
      `SELECT ts.*, u.name as author_name
       FROM test_sets ts
       LEFT JOIN users u ON u.id = ts.created_by
       WHERE ts.id = $1`,
      [testSetId]
    );

    if (tsRes.rows.length === 0) {
      throw new AppError('Bộ đề không tồn tại', 404);
    }

    const testSet = tsRes.rows[0];
    // Nếu status là DRAFT, chỉ người tạo mới được xem
    if (testSet.status === 'DRAFT' && testSet.created_by !== userId) {
      throw new AppError('Bộ đề đang ở trạng thái bản nháp và chưa được duyệt', 403);
    }

    const qRes = await db.query(
      `SELECT * FROM questions WHERE test_set_id = $1 ORDER BY id ASC`,
      [testSetId]
    );

    return {
      ...testSet,
      questions: qRes.rows,
    };
  }

  async listModels() {
    return aiProviderService.listActiveModels();
  }

  listTemplates() {
    return Object.entries(PROMPT_TEMPLATES).map(([id, t]) => ({
      id,
      name: t.name,
      description: t.description,
    }));
  }
}

export const questionGenerationService = new QuestionGenerationService();
