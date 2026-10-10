import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface PromptTemplate {
  id: number;
  user_id: number | null;
  title: string;
  prompt_text: string;
  category: string;
  is_system: boolean;
  created_at: Date;
}

export interface PromptHistoryItem {
  id: number;
  user_id: number;
  document_id: number | null;
  prompt_text: string;
  context_mode: string;
  scope: string;
  is_pinned: boolean;
  created_at: Date;
}

class AiPromptService {
  /**
   * Lấy tất cả template: hệ thống + cá nhân người dùng
   */
  async getTemplates(userId: number): Promise<PromptTemplate[]> {
    const result = await db.query(
      `SELECT * FROM ai_prompt_templates 
       WHERE is_system = true OR user_id = $1 
       ORDER BY is_system DESC, created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Tạo template tùy chỉnh cho user
   */
  async createTemplate(userId: number, title: string, promptText: string, category: string = 'custom'): Promise<PromptTemplate> {
    const result = await db.query(
      `INSERT INTO ai_prompt_templates (user_id, title, prompt_text, category, is_system)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [userId, title, promptText, category]
    );
    return result.rows[0];
  }

  /**
   * Cập nhật template tùy chỉnh của user
   */
  async updateTemplate(templateId: number, userId: number, title: string, promptText: string, category: string = 'custom'): Promise<PromptTemplate> {
    const check = await db.query('SELECT * FROM ai_prompt_templates WHERE id = $1', [templateId]);
    if (check.rows.length === 0) {
      throw new AppError('Mẫu prompt không tồn tại', 404);
    }
    if (check.rows[0].is_system || check.rows[0].user_id !== userId) {
      throw new AppError('Bạn không có quyền sửa mẫu prompt này', 403);
    }

    const result = await db.query(
      `UPDATE ai_prompt_templates 
       SET title = $1, prompt_text = $2, category = $3 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [title, promptText, category, templateId, userId]
    );
    return result.rows[0];
  }

  /**
   * Xóa template của user (không cho xóa system template)
   */
  async deleteTemplate(templateId: number, userId: number): Promise<{ success: boolean }> {
    const check = await db.query('SELECT * FROM ai_prompt_templates WHERE id = $1', [templateId]);
    if (check.rows.length === 0) {
      throw new AppError('Mẫu prompt không tồn tại', 404);
    }
    if (check.rows[0].is_system || check.rows[0].user_id !== userId) {
      throw new AppError('Bạn không có quyền xóa mẫu prompt này', 403);
    }

    await db.query('DELETE FROM ai_prompt_templates WHERE id = $1 AND user_id = $2', [templateId, userId]);
    return { success: true };
  }

  /**
   * Lấy lịch sử prompt theo document hoặc toàn bộ
   */
  async getHistory(userId: number, documentId?: number | null): Promise<PromptHistoryItem[]> {
    let query: string;
    let params: any[];

    if (documentId) {
      query = `
        SELECT * FROM ai_prompt_history 
        WHERE user_id = $1 AND (document_id = $2 OR document_id IS NULL)
        ORDER BY is_pinned DESC, created_at DESC 
        LIMIT 30
      `;
      params = [userId, documentId];
    } else {
      query = `
        SELECT * FROM ai_prompt_history 
        WHERE user_id = $1 
        ORDER BY is_pinned DESC, created_at DESC 
        LIMIT 30
      `;
      params = [userId];
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Thêm prompt vào lịch sử
   */
  async addHistory(
    userId: number,
    documentId: number | null,
    promptText: string,
    contextMode: string = 'document',
    scope: string = 'full',
    isPinned: boolean = false
  ): Promise<PromptHistoryItem> {
    const result = await db.query(
      `INSERT INTO ai_prompt_history (user_id, document_id, prompt_text, context_mode, scope, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, documentId, promptText, contextMode, scope, isPinned]
    );
    return result.rows[0];
  }

  /**
   * Toggle ghim (pin) một prompt trong lịch sử
   */
  async togglePinHistory(historyId: number, userId: number): Promise<PromptHistoryItem> {
    const check = await db.query('SELECT * FROM ai_prompt_history WHERE id = $1', [historyId]);
    if (check.rows.length === 0) {
      throw new AppError('Lịch sử prompt không tồn tại', 404);
    }
    if (check.rows[0].user_id !== userId) {
      throw new AppError('Bạn không có quyền thao tác lịch sử này', 403);
    }

    const newPinned = !check.rows[0].is_pinned;
    const result = await db.query(
      `UPDATE ai_prompt_history 
       SET is_pinned = $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [newPinned, historyId, userId]
    );
    return result.rows[0];
  }

  /**
   * Xóa một prompt khỏi lịch sử
   */
  async deleteHistory(historyId: number, userId: number): Promise<{ success: boolean }> {
    const check = await db.query('SELECT * FROM ai_prompt_history WHERE id = $1', [historyId]);
    if (check.rows.length === 0) {
      throw new AppError('Lịch sử prompt không tồn tại', 404);
    }
    if (check.rows[0].user_id !== userId) {
      throw new AppError('Bạn không có quyền xóa lịch sử này', 403);
    }

    await db.query('DELETE FROM ai_prompt_history WHERE id = $1 AND user_id = $2', [historyId, userId]);
    return { success: true };
  }
}

export const aiPromptService = new AiPromptService();
