import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const buyerId = req.user?.id;

    if (!buyerId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [documentId]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tài liệu không tồn tại' });
    }

    const document = docResult.rows[0];

    // If free public document or if user is owner
    if ((document.visibility === 'public' && document.price === 0) || document.user_id === buyerId) {
      // Generate a mock secure pre-signed URL (in real app, this would use S3/Firebase Admin SDK)
      const mockPresignedUrl = `${document.doc_url}?AWSAccessKeyId=MOCK&Expires=${Date.now() + 3600000}&Signature=MOCK_SECURE_SIG`;
      return res.json({ downloadUrl: mockPresignedUrl });
    }

    // Check if purchased in purchased_resources
    const purchaseCheck = await db.query(
      'SELECT id FROM purchased_resources WHERE user_id = $1 AND document_id = $2',
      [buyerId, documentId]
    );

    if (purchaseCheck.rows.length > 0) {
      const mockPresignedUrl = `${document.doc_url}?AWSAccessKeyId=MOCK&Expires=${Date.now() + 3600000}&Signature=MOCK_SECURE_SIG`;
      return res.json({ downloadUrl: mockPresignedUrl });
    }

    // Fallback: Check old transactions table (for backward compatibility if needed)
    const txResult = await db.query(
      'SELECT id FROM transactions WHERE user_id = $1 AND document_id = $2 AND status = $3',
      [buyerId, documentId, 'success']
    );

    if (txResult.rows.length > 0) {
      const mockPresignedUrl = `${document.doc_url}?AWSAccessKeyId=MOCK&Expires=${Date.now() + 3600000}&Signature=MOCK_SECURE_SIG`;
      return res.json({ downloadUrl: mockPresignedUrl });
    }

    return res.status(403).json({ error: 'Bạn cần mở khóa tài liệu này trên chợ cộng đồng trước khi tải xuống.' });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tải xuống' });
  }
};
