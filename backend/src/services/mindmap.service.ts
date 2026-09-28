import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface MindmapItem {
  id: number;
  user_id: number;
  document_id: number | null;
  title: string;
  mermaid_code: string;
  created_at: string | Date;
  updated_at: string | Date;
  document_title?: string | null;
}

export class MindmapService {
  /**
   * Tạo sơ đồ tư duy mới (độc lập hoặc gắn với tài liệu)
   */
  async createMindmap(
    userId: number,
    data: { title?: string; mermaid_code: string; document_id?: number | null }
  ): Promise<MindmapItem> {
    const { title = 'Sơ đồ tư duy mới', mermaid_code, document_id = null } = data;

    if (!mermaid_code || !mermaid_code.trim()) {
      throw new AppError('Mã Mermaid không được để trống', 400);
    }

    if (document_id) {
      const docCheck = await db.query('SELECT id, title FROM documents WHERE id = $1', [document_id]);
      if (docCheck.rows.length === 0) {
        throw new AppError('Tài liệu được gắn không tồn tại', 404);
      }
    }

    const result = await db.query(
      `INSERT INTO mindmaps (user_id, document_id, title, mermaid_code, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, document_id, title.trim() || 'Sơ đồ tư duy mới', mermaid_code.trim()]
    );

    const mindmap = result.rows[0];

    if (mindmap.document_id) {
      const docRes = await db.query('SELECT title FROM documents WHERE id = $1', [mindmap.document_id]);
      if (docRes.rows.length > 0) {
        mindmap.document_title = docRes.rows[0].title;
      }
    }

    return mindmap;
  }

  /**
   * Lấy danh sách sơ đồ tư duy của người dùng (kèm tìm kiếm và lọc tài liệu)
   */
  async getUserMindmaps(
    userId: number,
    options?: { q?: string; documentId?: number | null }
  ): Promise<MindmapItem[]> {
    let query = `
      SELECT m.*, d.title as document_title
      FROM mindmaps m
      LEFT JOIN documents d ON m.document_id = d.id
      WHERE m.user_id = $1
    `;
    const params: any[] = [userId];

    if (options?.documentId !== undefined && options.documentId !== null) {
      params.push(options.documentId);
      query += ` AND m.document_id = $${params.length}`;
    }

    if (options?.q && options.q.trim()) {
      params.push(`%${options.q.trim()}%`);
      query += ` AND (m.title ILIKE $${params.length} OR m.mermaid_code ILIKE $${params.length})`;
    }

    query += ` ORDER BY m.updated_at DESC, m.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Lấy sơ đồ tư duy theo tài liệu
   */
  async getMindmapsByDocument(userId: number, documentId: number): Promise<MindmapItem[]> {
    return this.getUserMindmaps(userId, { documentId });
  }

  /**
   * Lấy chi tiết 1 sơ đồ tư duy theo ID (kiểm tra chặt chẽ quyền sở hữu IDOR)
   */
  async getMindmapById(mindmapId: number, userId: number): Promise<MindmapItem> {
    const result = await db.query(
      `SELECT m.*, d.title as document_title
       FROM mindmaps m
       LEFT JOIN documents d ON m.document_id = d.id
       WHERE m.id = $1`,
      [mindmapId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy sơ đồ tư duy', 404);
    }

    const mindmap = result.rows[0];
    if (mindmap.user_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập sơ đồ tư duy này', 403);
    }

    return mindmap;
  }

  /**
   * Cập nhật sơ đồ tư duy (kiểm tra quyền sở hữu IDOR)
   */
  async updateMindmap(
    mindmapId: number,
    userId: number,
    data: { title?: string; mermaid_code?: string; document_id?: number | null }
  ): Promise<MindmapItem> {
    const existing = await this.getMindmapById(mindmapId, userId);

    const newTitle = data.title !== undefined ? (data.title.trim() || 'Sơ đồ tư duy') : existing.title;
    const newCode = data.mermaid_code !== undefined ? data.mermaid_code.trim() : existing.mermaid_code;
    const newDocId = data.document_id !== undefined ? data.document_id : existing.document_id;

    if (!newCode) {
      throw new AppError('Mã Mermaid không được để trống', 400);
    }

    if (newDocId) {
      const docCheck = await db.query('SELECT id FROM documents WHERE id = $1', [newDocId]);
      if (docCheck.rows.length === 0) {
        throw new AppError('Tài liệu được gắn không tồn tại', 404);
      }
    }

    const result = await db.query(
      `UPDATE mindmaps
       SET title = $1, mermaid_code = $2, document_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [newTitle, newCode, newDocId, mindmapId, userId]
    );

    const updated = result.rows[0];
    if (updated.document_id) {
      const docRes = await db.query('SELECT title FROM documents WHERE id = $1', [updated.document_id]);
      if (docRes.rows.length > 0) {
        updated.document_title = docRes.rows[0].title;
      }
    }

    return updated;
  }

  /**
   * Xóa sơ đồ tư duy (kiểm tra quyền sở hữu IDOR)
   */
  async deleteMindmap(mindmapId: number, userId: number): Promise<{ success: boolean; id: number }> {
    await this.getMindmapById(mindmapId, userId);

    const result = await db.query('DELETE FROM mindmaps WHERE id = $1 AND user_id = $2 RETURNING id', [
      mindmapId,
      userId,
    ]);

    if (result.rowCount === 0) {
      throw new AppError('Không tìm thấy sơ đồ tư duy để xóa', 404);
    }

    return { success: true, id: mindmapId };
  }
}

export const mindmapService = new MindmapService();
