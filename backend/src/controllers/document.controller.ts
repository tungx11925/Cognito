import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { documentService } from '../services/document.service';
import { activityService } from '../services/activity.service';
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
export const uploadDocument = async (req: AuthRequest, res: Response, next: any) => {
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

    const document = await documentService.uploadDocument({
      userId,
      title: title.trim(),
      description,
      category,
      docUrl: cloudinaryResult.secure_url,
      fileType: file.mimetype,
      fileSize: file.size,
      publicId: cloudinaryResult.public_id,
    });

    res.status(201).json({
      message: 'Tải lên tài liệu thành công',
      document
    });
  } catch (error: any) {
    next(error);
  }
};

// ─── GET /api/documents ───────────────────────────────────────────────────────
export const getDocuments = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { search, category } = req.query;

    const documents = await documentService.getDocuments(
      userId, 
      search as string, 
      category as string
    );

    res.status(200).json(documents);
  } catch (error: any) {
    next(error);
  }
};

// ─── GET /api/documents/:id ───────────────────────────────────────────────────
export const getDocumentById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const docId = parseInt(req.params.id, 10);

    const document = await documentService.getDocumentById(docId, userId);

    // Log study activity and update streak asynchronously in background
    Promise.all([
      activityService.updateUserStreak(userId),
      activityService.incrementTaskProgress(userId, 'read_document', 1)
    ]).catch(err => console.error('Error updating study task for read_document:', err));

    res.status(200).json(document);
  } catch (error: any) {
    next(error);
  }
};

// ─── GET /api/documents/:id/status — trạng thái pipeline (polling từ frontend) ─
export const getDocumentStatus = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const docId = parseInt(req.params.id, 10);
    const status = await documentService.getDocumentStatus(docId, userId);
    res.status(200).json(status);
  } catch (error: any) {
    next(error);
  }
};

// ─── POST /api/documents/:id/reprocess — chạy lại pipeline (khi FAILED) ────────
export const reprocessDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const docId = parseInt(req.params.id, 10);
    const result = await documentService.reprocessDocument(docId, userId);
    res.status(202).json({ message: 'Đã đưa tài liệu vào hàng đợi xử lý lại', ...result });
  } catch (error: any) {
    next(error);
  }
};

export const createDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const document = await documentService.createDocument({
      userId,
      ...req.body
    });

    res.status(201).json(document);
  } catch (error: any) {
    next(error);
  }
};

export const updateDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const docId = parseInt(req.params.id, 10);
    const { title, description, category } = req.body;

    const document = await documentService.updateDocument(docId, userId, { title, description, category });
    res.status(200).json(document);
  } catch (error: any) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const docId = parseInt(req.params.id, 10);
    await documentService.deleteDocument(docId, userId);

    res.status(200).json({ message: 'Đã xóa tài liệu thành công' });
  } catch (error: any) {
    next(error);
  }
};
