import { db } from '../db';
import { DEFAULT_CUSTOM_PROMPT } from '../db/ai-test-schema';

export class TestSetRepository {
  /**
   * 1. Get AI Config for user + configKey (or create default)
   */
  async getAIConfig(configKey: string, userId: number) {
    const result = await db.query(
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
      return { config: inserted.rows[0], isNew: true };
    }

    return { config: result.rows[0], isNew: false };
  }

  /**
   * 2. Upsert AI Config
   */
  async upsertAIConfig(configKey: string, userId: number, data: any) {
    const existing = await db.query(
      'SELECT id FROM ai_task_configs WHERE course_id = $1 AND user_id = $2',
      [configKey, userId]
    );

    if (existing.rows.length === 0) {
      const result = await db.query(
        `INSERT INTO ai_task_configs
          (course_id, user_id, use_custom_prompt, custom_prompt,
           multiple_choice_count, multiple_choice_score,
           fill_blank_count, fill_blank_score,
           essay_count, essay_score,
           true_false_count, true_false_score)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          configKey,
          userId,
          data.use_custom_prompt ?? true,
          data.custom_prompt ?? DEFAULT_CUSTOM_PROMPT,
          data.multiple_choice_count ?? 10,
          data.multiple_choice_score ?? 1.0,
          data.fill_blank_count ?? 5,
          data.fill_blank_score ?? 1.0,
          data.essay_count ?? 2,
          data.essay_score ?? 2.0,
          data.true_false_count ?? 5,
          data.true_false_score ?? 0.5,
        ]
      );
      return result.rows[0];
    } else {
      const result = await db.query(
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
          data.use_custom_prompt,
          data.custom_prompt,
          data.multiple_choice_count,
          data.multiple_choice_score,
          data.fill_blank_count,
          data.fill_blank_score,
          data.essay_count,
          data.essay_score,
          data.true_false_count,
          data.true_false_score,
          configKey,
          userId,
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * 3. Get user's documents for test generator
   */
  async getUserDocuments(userId: number) {
    const result = await db.query(
      `SELECT id, title, category, file_type, status, processing_status, processing_error, page_count, created_at
       FROM documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * 4. Get user's flashcard decks for test generator
   */
  async getUserDecks(userId: number) {
    const result = await db.query(
      `SELECT fd.id, fd.name, fd.description,
        (SELECT COUNT(*)::int FROM flashcards WHERE deck_id = fd.id) as card_count
       FROM flashcard_decks fd WHERE fd.user_id = $1 ORDER BY fd.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * 5. Get flashcard deck content formatted for AI context
   */
  async getDeckContent(deckId: string | number, userId: number) {
    const deckCheck = await db.query(
      'SELECT id, name FROM flashcard_decks WHERE id = $1 AND user_id = $2',
      [deckId, userId]
    );
    if (deckCheck.rows.length === 0) return null;

    const cards = await db.query('SELECT front, back FROM flashcards WHERE deck_id = $1', [deckId]);
    const content = cards.rows.map((c: any) => `- ${c.front}: ${c.back}`).join('\n');
    return {
      deckId,
      deckName: deckCheck.rows[0].name,
      content,
      cardCount: cards.rows.length,
    };
  }

  /**
   * 6. Get document content formatted for AI context
   */
  async getDocumentContent(docId: string | number, userId: number) {
    const result = await db.query(
      'SELECT id, title, description, category FROM documents WHERE id = $1 AND user_id = $2',
      [docId, userId]
    );
    if (result.rows.length === 0) return null;

    const doc = result.rows[0];
    const content = [
      `Tài liệu: ${doc.title}`,
      doc.category ? `Môn học / Danh mục: ${doc.category}` : '',
      doc.description ? `Mô tả: ${doc.description}` : '',
      `\n[Lưu ý: Tài liệu này được lưu dưới dạng file. Hãy tạo câu hỏi dựa trên chủ đề "${doc.title}" thuộc danh mục "${doc.category || 'Chung'}"]`,
    ].filter(Boolean).join('\n');

    return { docId: doc.id, docTitle: doc.title, content };
  }

  /**
   * 7. Get test sets created by user
   */
  async getTestSets(userId: number) {
    const result = await db.query(
      `SELECT ts.*, atc.course_id as config_key
       FROM test_sets ts
       LEFT JOIN ai_task_configs atc ON ts.config_id = atc.id
       WHERE ts.created_by = $1
       ORDER BY ts.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * 8. Toggle test set active status
   */
  async toggleStatus(id: string | number, userId: number, isActive: boolean) {
    const result = await db.query(
      `UPDATE test_sets SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND created_by = $3 RETURNING *`,
      [isActive, id, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * 9. Delete test set
   */
  async deleteTestSet(id: string | number, userId: number) {
    const result = await db.query(
      'DELETE FROM test_sets WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0]?.id || null;
  }

  /**
   * 10. Get questions for test set (guarded by owner check)
   */
  async getQuestionsByTestSetId(testSetId: string | number, userId: number) {
    const result = await db.query(
      `SELECT q.* FROM questions q
       JOIN test_sets ts ON q.test_set_id = ts.id
       WHERE q.test_set_id = $1 AND ts.created_by = $2
       ORDER BY q.type, q.id ASC`,
      [testSetId, userId]
    );
    return result.rows;
  }

  /**
   * 11. Update single question
   */
  async updateQuestion(id: string | number, data: any) {
    const result = await db.query(
      `UPDATE questions SET
        content = COALESCE($1, content),
        score = COALESCE($2, score),
        status = COALESCE($3::question_status, status),
        options = COALESCE($4, options),
        correct_answer = COALESCE($5, correct_answer),
        explanation = COALESCE($6, explanation),
        difficulty = COALESCE($7, difficulty),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        data.content,
        data.score,
        data.status || null,
        data.options ? JSON.stringify(data.options) : null,
        data.correct_answer ? JSON.stringify(data.correct_answer) : null,
        data.explanation ?? null,
        data.difficulty ?? null,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * 12. Bulk update questions
   */
  async bulkUpdateQuestions(questions: any[]) {
    const updatedIds: number[] = [];
    for (const q of questions) {
      const r = await db.query(
        `UPDATE questions SET
          content = COALESCE($1, content),
          score = COALESCE($2, score),
          status = COALESCE($3::question_status, status),
          options = COALESCE($4, options),
          correct_answer = COALESCE($5, correct_answer),
          explanation = COALESCE($6, explanation),
          difficulty = COALESCE($7, difficulty),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 RETURNING id`,
        [
          q.content,
          q.score,
          q.status || null,
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer ? JSON.stringify(q.correct_answer) : null,
          q.explanation ?? null,
          q.difficulty ?? null,
          q.id,
        ]
      );
      if (r.rows[0]) updatedIds.push(r.rows[0].id);
    }
    return updatedIds;
  }
}

export const testSetRepository = new TestSetRepository();
