import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { generateQuestionsWithAI } from '../utils/ai-engine.service';
import { DEFAULT_CUSTOM_PROMPT } from '../db/ai-test-schema';

const router = Router();

// ===================================================
// AI CONFIG ROUTES — scoped per USER + config_key
// ===================================================

// GET /api/ai-configs/:configKey
router.get('/ai-configs/:configKey', authenticate, async (req: AuthRequest, res: Response) => {
  const { configKey } = req.params;
  const userId = req.user!.id;
  try {
    let result = await db.query(
      'SELECT * FROM ai_task_configs WHERE course_id = $1 AND user_id = $2',
      [configKey, userId]
    );
    if (result.rows.length === 0) {
      const inserted = await db.query(
        `INSERT INTO ai_task_configs
          (course_id, user_id, use_custom_prompt, custom_prompt,
           multiple_choice_count, multiple_choice_score,
           fill_blank_count, fill_blank_score,
           essay_count, essay_score,
           true_false_count, true_false_score)
         VALUES ($1, $2, true, $3, 10, 1.0, 5, 1.0, 2, 2.0, 5, 0.5)
         RETURNING *`,
        [configKey, userId, DEFAULT_CUSTOM_PROMPT]
      );
      return res.status(201).json(inserted.rows[0]);
    }
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/ai-configs/:configKey — upsert per-user config
router.put('/ai-configs/:configKey', authenticate, async (req: AuthRequest, res: Response) => {
  const { configKey } = req.params;
  const userId = req.user!.id;
  const {
    use_custom_prompt, custom_prompt,
    multiple_choice_count, multiple_choice_score,
    fill_blank_count, fill_blank_score,
    essay_count, essay_score,
    true_false_count, true_false_score,
  } = req.body;
  try {
    const existing = await db.query(
      'SELECT id FROM ai_task_configs WHERE course_id = $1 AND user_id = $2',
      [configKey, userId]
    );
    let result;
    if (existing.rows.length === 0) {
      result = await db.query(
        `INSERT INTO ai_task_configs
          (course_id, user_id, use_custom_prompt, custom_prompt,
           multiple_choice_count, multiple_choice_score,
           fill_blank_count, fill_blank_score,
           essay_count, essay_score,
           true_false_count, true_false_score)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          configKey, userId,
          use_custom_prompt ?? true, custom_prompt ?? DEFAULT_CUSTOM_PROMPT,
          multiple_choice_count ?? 10, multiple_choice_score ?? 1.0,
          fill_blank_count ?? 5, fill_blank_score ?? 1.0,
          essay_count ?? 2, essay_score ?? 2.0,
          true_false_count ?? 5, true_false_score ?? 0.5,
        ]
      );
    } else {
      result = await db.query(
        `UPDATE ai_task_configs SET
          use_custom_prompt = COALESCE($1, use_custom_prompt),
          custom_prompt = COALESCE($2, custom_prompt),
          multiple_choice_count = COALESCE($3, multiple_choice_count),
          multiple_choice_score = COALESCE($4, multiple_choice_score),
          fill_blank_count = COALESCE($5, fill_blank_count),
          fill_blank_score = COALESCE($6, fill_blank_score),
          essay_count = COALESCE($7, essay_count),
          essay_score = COALESCE($8, essay_score),
          true_false_count = COALESCE($9, true_false_count),
          true_false_score = COALESCE($10, true_false_score),
          updated_at = CURRENT_TIMESTAMP
         WHERE course_id = $11 AND user_id = $12
         RETURNING *`,
        [
          use_custom_prompt, custom_prompt,
          multiple_choice_count, multiple_choice_score,
          fill_blank_count, fill_blank_score,
          essay_count, essay_score,
          true_false_count, true_false_score,
          configKey, userId,
        ]
      );
    }
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ===================================================
// USER RESOURCES — list real user documents & decks
// ===================================================

router.get('/ai-test/my-documents', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, title, category, file_type, created_at
       FROM documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user!.id]
    );
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/ai-test/my-decks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.query(
      `SELECT fd.id, fd.name, fd.description,
        (SELECT COUNT(*) FROM flashcards WHERE deck_id = fd.id) as card_count
       FROM flashcard_decks fd WHERE fd.user_id = $1 ORDER BY fd.created_at DESC`,
      [req.user!.id]
    );
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/ai-test/deck-content/:deckId', authenticate, async (req: AuthRequest, res: Response) => {
  const { deckId } = req.params;
  try {
    const deckCheck = await db.query(
      'SELECT id, name FROM flashcard_decks WHERE id = $1 AND user_id = $2',
      [deckId, req.user!.id]
    );
    if (deckCheck.rows.length === 0) return res.status(403).json({ error: 'Không có quyền truy cập' });
    const cards = await db.query('SELECT front, back FROM flashcards WHERE deck_id = $1', [deckId]);
    const content = cards.rows.map((c: any) => `- ${c.front}: ${c.back}`).join('\n');
    return res.json({ deckId, deckName: deckCheck.rows[0].name, content, cardCount: cards.rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/ai-test/document-content/:docId', authenticate, async (req: AuthRequest, res: Response) => {
  const { docId } = req.params;
  try {
    const result = await db.query(
      'SELECT id, title, description, category FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: 'Không có quyền truy cập' });
    const doc = result.rows[0];
    // Build context string from metadata since full text isn't stored in DB
    const content = [
      `Tài liệu: ${doc.title}`,
      doc.category ? `Môn học / Danh mục: ${doc.category}` : '',
      doc.description ? `Mô tả: ${doc.description}` : '',
      `\n[Lưu ý: Tài liệu này được lưu dưới dạng file. Hãy tạo câu hỏi dựa trên chủ đề "${doc.title}" thuộc danh mục "${doc.category || 'Chung'}"]`,
    ].filter(Boolean).join('\n');
    return res.json({ docId: doc.id, docTitle: doc.title, content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ===================================================
// TEST SETS
// ===================================================

router.get('/test-sets', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const result = await db.query(
      `SELECT ts.*, atc.course_id as config_key
       FROM test_sets ts
       LEFT JOIN ai_task_configs atc ON ts.config_id = atc.id
       WHERE ts.created_by = $1
       ORDER BY ts.created_at DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/test-sets/generate', authenticate, async (req: AuthRequest, res: Response) => {
  const { configKey, documentContent, name } = req.body;
  if (!documentContent || documentContent.trim().length < 20) {
    return res.status(400).json({ error: 'Nội dung tài liệu phải có ít nhất 20 ký tự' });
  }
  const userId = req.user!.id;
  const effectiveKey = configKey || `user_${userId}_default`;

  try {
    let configResult = await db.query(
      'SELECT * FROM ai_task_configs WHERE course_id = $1 AND user_id = $2',
      [effectiveKey, userId]
    );
    let config = configResult.rows[0];
    if (!config) {
      const inserted = await db.query(
        `INSERT INTO ai_task_configs (course_id, user_id, use_custom_prompt, custom_prompt,
           multiple_choice_count, multiple_choice_score, fill_blank_count, fill_blank_score,
           essay_count, essay_score, true_false_count, true_false_score)
         VALUES ($1, $2, true, $3, 10, 1.0, 5, 1.0, 2, 2.0, 5, 0.5) RETURNING *`,
        [effectiveKey, userId, DEFAULT_CUSTOM_PROMPT]
      );
      config = inserted.rows[0];
    }

    const questions = await generateQuestionsWithAI({
      customPrompt: config.use_custom_prompt ? (config.custom_prompt || '') : '',
      multipleChoiceCount: Number(config.multiple_choice_count),
      multipleChoiceScore: Number(config.multiple_choice_score),
      fillBlankCount: Number(config.fill_blank_count),
      fillBlankScore: Number(config.fill_blank_score),
      essayCount: Number(config.essay_count),
      essayScore: Number(config.essay_score),
      trueFalseCount: Number(config.true_false_count),
      trueFalseScore: Number(config.true_false_score),
      documentContent,
    });

    const totalScore = questions.reduce((s, q) => s + Number(q.score), 0);
    const testName = name || `Bộ đề ${new Date().toLocaleString('vi-VN')}`;

    const testSetResult = await db.query(
      `INSERT INTO test_sets (name, config_id, total_questions, total_score, is_active, created_by)
       VALUES ($1, $2, $3, $4, true, $5) RETURNING *`,
      [testName, config.id, questions.length, totalScore, userId]
    );
    const testSet = testSetResult.rows[0];

    const insertedQuestions: any[] = [];
    for (const q of questions) {
      const r = await db.query(
        `INSERT INTO questions (test_set_id, type, content, score, status, options, correct_answer)
         VALUES ($1,$2,$3,$4,'DRAFT',$5,$6) RETURNING *`,
        [
          testSet.id, q.type, q.content, q.score,
          q.options ? JSON.stringify(q.options) : null,
          JSON.stringify(q.correctAnswer),
        ]
      );
      insertedQuestions.push(r.rows[0]);
    }

    return res.status(201).json({
      testSet, questions: insertedQuestions,
      message: `Đã tạo thành công bộ đề "${testName}" với ${questions.length} câu hỏi!`,
    });
  } catch (err: any) {
    console.error('[Generate TestSet Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/test-sets/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    const result = await db.query(
      `UPDATE test_sets SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND created_by = $3 RETURNING *`,
      [is_active, id, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bộ đề không tồn tại' });
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/test-sets/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM test_sets WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bộ đề không tồn tại' });
    return res.json({ message: 'Đã xóa bộ đề thành công', id: result.rows[0].id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ===================================================
// QUESTIONS
// ===================================================

router.get('/questions/test-sets/:testSetId', authenticate, async (req: AuthRequest, res: Response) => {
  const { testSetId } = req.params;
  try {
    const result = await db.query(
      `SELECT q.* FROM questions q
       JOIN test_sets ts ON q.test_set_id = ts.id
       WHERE q.test_set_id = $1 AND ts.created_by = $2
       ORDER BY q.type, q.id ASC`,
      [testSetId, req.user!.id]
    );
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/questions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content, score, status, options, correct_answer } = req.body;
  try {
    const result = await db.query(
      `UPDATE questions SET
        content = COALESCE($1, content),
        score = COALESCE($2, score),
        status = COALESCE($3::question_status, status),
        options = COALESCE($4, options),
        correct_answer = COALESCE($5, correct_answer),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [
        content, score, status || null,
        options ? JSON.stringify(options) : null,
        correct_answer ? JSON.stringify(correct_answer) : null,
        id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Câu hỏi không tồn tại' });
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/questions/bulk-update', authenticate, async (req: AuthRequest, res: Response) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Mảng câu hỏi là bắt buộc' });
  }
  try {
    const updatedIds: number[] = [];
    for (const q of questions) {
      const r = await db.query(
        `UPDATE questions SET
          content = COALESCE($1, content),
          score = COALESCE($2, score),
          status = COALESCE($3::question_status, status),
          options = COALESCE($4, options),
          correct_answer = COALESCE($5, correct_answer),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 RETURNING id`,
        [
          q.content, q.score, q.status || null,
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer ? JSON.stringify(q.correct_answer) : null,
          q.id,
        ]
      );
      if (r.rows[0]) updatedIds.push(r.rows[0].id);
    }
    return res.json({ message: `Đã cập nhật ${updatedIds.length} câu hỏi`, updatedIds });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
