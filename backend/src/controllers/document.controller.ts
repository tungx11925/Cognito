import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Vui lòng chọn file hợp lệ (PDF, DOC, DOCX)' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { title, description, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Tiêu đề tài liệu là bắt buộc' });
    }

    // Build the public URL for the uploaded file
    const docUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    const result = await db.query(
      `INSERT INTO documents (user_id, title, description, category, doc_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title, description || '', category || 'Khác', docUrl]
    );

    res.status(201).json({
      message: 'Tải lên tài liệu thành công',
      document: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Lỗi server khi tải lên tài liệu' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { search, category } = req.query;
    
    let query = `SELECT * FROM documents WHERE user_id = $1`;
    let values: any[] = [userId];
    let idx = 2;

    if (search) {
      query += ` AND title ILIKE $${idx}`;
      values.push(`%${search}%`);
      idx++;
    }

    if (category) {
      query += ` AND category = $${idx}`;
      values.push(category);
      idx++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, values);
    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách tài liệu' });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const docId = req.params.id;

    const result = await db.query(
      `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
      [docId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error getting document:', error);
    res.status(500).json({ error: 'Lỗi server khi xem tài liệu' });
  }
};
