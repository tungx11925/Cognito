import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface NoteItem {
  id: number;
  user_id: number;
  document_id: number | null;
  title: string | null;
  content: string;
  created_at: string | Date;
  updated_at: string | Date;
  document_title?: string | null;
}

export class NoteService {
  /**
   * Tạo ghi chú mới (độc lập hoặc gắn với tài liệu)
   */
  async createNote(
    userId: number,
    data: { title?: string; content: string; document_id?: number | null }
  ): Promise<NoteItem> {
    const { title = 'Ghi chú mới', content, document_id = null } = data;

    if (!content || !content.trim()) {
      throw new AppError('Nội dung ghi chú không được để trống', 400);
    }

    // Nếu có document_id, kiểm tra xem document có tồn tại và người dùng có quyền truy cập không
    if (document_id) {
      const docCheck = await db.query('SELECT id, user_id, visibility, title FROM documents WHERE id = $1', [document_id]);
      if (docCheck.rows.length === 0) {
        throw new AppError('Tài liệu được gắn không tồn tại', 404);
      }
      const doc = docCheck.rows[0];
      if (doc.user_id !== userId && doc.visibility !== 'public') {
        throw new AppError('Bạn không có quyền truy cập hoặc liên kết với tài liệu riêng tư này', 403);
      }
    }

    const result = await db.query(
      `INSERT INTO notes (user_id, document_id, title, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, document_id, title.trim() || 'Ghi chú mới', content.trim()]
    );

    const note = result.rows[0];

    if (note.document_id) {
      const docRes = await db.query('SELECT title FROM documents WHERE id = $1', [note.document_id]);
      if (docRes.rows.length > 0) {
        note.document_title = docRes.rows[0].title;
      }
    }

    return note;
  }

  /**
   * Lấy danh sách ghi chú của người dùng (kèm tìm kiếm và lọc tài liệu)
   */
  async getUserNotes(
    userId: number,
    options?: { q?: string; documentId?: number | null }
  ): Promise<NoteItem[]> {
    let query = `
      SELECT n.*, d.title as document_title
      FROM notes n
      LEFT JOIN documents d ON n.document_id = d.id
      WHERE n.user_id = $1
    `;
    const params: any[] = [userId];

    if (options?.documentId !== undefined && options.documentId !== null) {
      params.push(options.documentId);
      query += ` AND n.document_id = $${params.length}`;
    }

    if (options?.q && options.q.trim()) {
      params.push(`%${options.q.trim()}%`);
      query += ` AND (n.title ILIKE $${params.length} OR n.content ILIKE $${params.length})`;
    }

    query += ` ORDER BY n.updated_at DESC, n.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Lấy ghi chú theo tài liệu (hỗ trợ tương thích ngược cho màn hình học)
   */
  async getNotesByDocument(userId: number, documentId: number): Promise<NoteItem[]> {
    return this.getUserNotes(userId, { documentId });
  }

  /**
   * Lấy chi tiết 1 ghi chú theo ID (kiểm tra chặt chẽ quyền sở hữu IDOR)
   */
  async getNoteById(noteId: number, userId: number): Promise<NoteItem> {
    const result = await db.query(
      `SELECT n.*, d.title as document_title
       FROM notes n
       LEFT JOIN documents d ON n.document_id = d.id
       WHERE n.id = $1`,
      [noteId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy ghi chú', 404);
    }

    const note = result.rows[0];
    if (note.user_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập ghi chú này', 403);
    }

    return note;
  }

  /**
   * Cập nhật ghi chú (kiểm tra quyền sở hữu IDOR)
   */
  async updateNote(
    noteId: number,
    userId: number,
    data: { title?: string; content?: string; document_id?: number | null }
  ): Promise<NoteItem> {
    // Kiểm tra quyền
    const existing = await this.getNoteById(noteId, userId);

    const newTitle = data.title !== undefined ? (data.title.trim() || 'Ghi chú mới') : existing.title;
    const newContent = data.content !== undefined ? data.content.trim() : existing.content;
    const newDocId = data.document_id !== undefined ? data.document_id : existing.document_id;

    if (!newContent) {
      throw new AppError('Nội dung ghi chú không được để trống', 400);
    }

    if (newDocId) {
      const docCheck = await db.query('SELECT id, user_id, visibility FROM documents WHERE id = $1', [newDocId]);
      if (docCheck.rows.length === 0) {
        throw new AppError('Tài liệu được gắn không tồn tại', 404);
      }
      const doc = docCheck.rows[0];
      if (doc.user_id !== userId && doc.visibility !== 'public') {
        throw new AppError('Bạn không có quyền truy cập hoặc liên kết với tài liệu riêng tư này', 403);
      }
    }

    const result = await db.query(
      `UPDATE notes
       SET title = $1, content = $2, document_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [newTitle, newContent, newDocId, noteId, userId]
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
   * Xóa ghi chú (kiểm tra quyền sở hữu IDOR)
   */
  async deleteNote(noteId: number, userId: number): Promise<{ success: boolean; id: number }> {
    // Kiểm tra quyền
    await this.getNoteById(noteId, userId);

    const result = await db.query('DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id', [
      noteId,
      userId,
    ]);

    if (result.rowCount === 0) {
      throw new AppError('Không tìm thấy ghi chú để xóa', 404);
    }

    return { success: true, id: noteId };
  }
}

export const noteService = new NoteService();
