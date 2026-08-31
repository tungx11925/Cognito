import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';
import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

// ─── Helper: Stream buffer → Cloudinary ──────────────────────────────────────
function uploadToCloudinary(
  buffer: Buffer,
  options: Record<string, any>
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('[Cloudinary] Upload error details:', JSON.stringify(error));
        return reject(error);
      }
      if (!result) return reject(new Error('Cloudinary không trả về kết quả'));
      resolve(result);
    });
    stream.end(buffer);
  });
}

// ─── Resource type: dùng 'auto' để Cloudinary tự phát hiện ───────────────────
// Dùng 'auto' tránh lỗi 403 với 'raw' trên Cloudinary free plan
function getResourceType(mimetype: string): 'auto' | 'image' {
  if (mimetype.startsWith('image/')) return 'image';
  return 'auto'; // PDF, DOCX, TXT → auto (Cloudinary tự detect)
}

// ─── POST /api/documents/upload ───────────────────────────────────────────────
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Vui lòng chọn file hợp lệ (PDF, DOC, DOCX, TXT, ảnh)' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { title, description, category } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Tiêu đề tài liệu là bắt buộc' });
    }

    // Upload buffer to Cloudinary
    // Dùng resource_type 'auto' để Cloudinary tự phát hiện loại file
    // Tránh lỗi 403 xảy ra khi dùng 'raw' trên một số Cloudinary accounts
    const resourceType = getResourceType(file.mimetype);
    const cloudinaryResult = await uploadToCloudinary(file.buffer, {
      folder: `cognito/documents/${userId}`,
      resource_type: resourceType,
      public_id: `doc_${Date.now()}`,
      use_filename: false,
      overwrite: false,
    });

    const docUrl = cloudinaryResult.secure_url;
    const publicId = cloudinaryResult.public_id;
    const fileType = file.mimetype;
    const fileSize = file.size;

    const result = await db.query(
      `INSERT INTO documents (user_id, title, description, category, doc_url, file_type, file_size, cloudinary_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        title.trim(),
        description?.trim() || '',
        category?.trim() || 'Khác',
        docUrl,
        fileType,
        fileSize,
        publicId,
      ]
    );

    res.status(201).json({
      message: 'Tải lên tài liệu thành công',
      document: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    // Cloudinary errors have a specific structure
    const message = error?.message || 'Lỗi server khi tải lên tài liệu';
    res.status(500).json({ error: message });
  }
};

// ─── GET /api/documents ───────────────────────────────────────────────────────
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { search, category } = req.query;

    let query = `SELECT * FROM documents WHERE user_id = $1`;
    const values: any[] = [userId];
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

// ─── GET /api/documents/:id ───────────────────────────────────────────────────
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

// ─── DELETE /api/documents/:id ────────────────────────────────────────────────
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const docId = req.params.id;

    // Fetch document to get Cloudinary public_id before deleting
    const docResult = await db.query(
      `SELECT cloudinary_public_id, file_type FROM documents WHERE id = $1 AND user_id = $2`,
      [docId, userId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu hoặc bạn không có quyền xóa' });
    }

    const { cloudinary_public_id, file_type } = docResult.rows[0];

    // Delete from DB first
    await db.query(`DELETE FROM documents WHERE id = $1`, [docId]);

    // Delete from Cloudinary (non-blocking — best-effort)
    if (cloudinary_public_id) {
      const resourceType = getResourceType(file_type || '') as 'auto' | 'image' | 'raw' | 'video';
      // Try both 'image' and 'raw' for deletion since resource_type stored may differ
      cloudinary.uploader.destroy(cloudinary_public_id, { resource_type: resourceType === 'image' ? 'image' : 'raw' })
        .catch(() => cloudinary.uploader.destroy(cloudinary_public_id, { resource_type: 'raw' })
          .catch(err => console.error('Cloudinary delete error (non-fatal):', err)));
    }

    res.status(200).json({ message: 'Đã xóa tài liệu thành công' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa tài liệu' });
  }
};
