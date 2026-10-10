import path from 'path';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { documentService } from '../services/document.service';
import { documentProcessingService } from '../services/document-processing.service';
import { activityService } from '../services/activity.service';
import { entitlementService } from '../services/entitlement.service';
import { validateFileContent } from '../utils/file-security';
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
function getResourceType(mimetype: string): 'auto' | 'image' {
  if (mimetype.startsWith('image/')) return 'image';
  return 'auto'; // PDF, DOCX, TXT, XLSX → auto
}

// ─── POST /api/documents/upload ───────────────────────────────────────────────
export const uploadDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Vui lòng chọn file hợp lệ (PDF, DOC, DOCX, TXT, ảnh, XLSX, CSV)' });
    }

    // Security Hardening: Validate real magic bytes & reject spoofed executables / scripts
    validateFileContent(file.buffer, file.originalname, file.mimetype);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { title, description, category, visibility, is_community_published } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Tiêu đề tài liệu là bắt buộc' });
    }

    // 1. Entitlement check (Phase 20)
    let pageCount: number | undefined;
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(file.buffer);
        pageCount = pdfData.numpages;
      } catch (e) {
        // Continue if page count probe fails
      }
    }

    const entitlementCheck = await entitlementService.checkDocumentUpload(userId, pageCount);
    if (!entitlementCheck.allowed) {
      return res.status(403).json({
        error: entitlementCheck.code || 'LIMIT_EXCEEDED',
        message: entitlementCheck.message,
        feature: 'document_upload',
      });
    }

    // Upload buffer to Cloudinary
    const ext = path.extname(file.originalname || '').toLowerCase();
    const resourceType = getResourceType(file.mimetype);
    const cloudinaryResult = await uploadToCloudinary(file.buffer, {
      folder: `cognito/documents/${userId}`,
      resource_type: resourceType,
      public_id: `doc_${Date.now()}${ext}`,
      use_filename: false,
      overwrite: false,
    });

    const isCommunity = is_community_published === true || is_community_published === 'true';

    const document = await documentService.uploadDocument({
      userId,
      title: title.trim(),
      description,
      category,
      visibility,
      isCommunityPublished: isCommunity,
      docUrl: cloudinaryResult.secure_url,
      fileType: file.mimetype,
      fileSize: file.size,
      publicId: cloudinaryResult.public_id,
    });

    // Increment document upload telemetry
    await entitlementService.incrementDocumentUploaded(userId).catch(() => {});

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

    const { search, category, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const documents = await documentService.getDocuments(
      userId, 
      search as string, 
      category as string,
      limitNum,
      offset
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
    const userRole = req.user?.role;

    const document = await documentService.getDocumentById(docId, userId, userRole);

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

// ─── GET /api/documents/:id/chunks — danh sách chunks & keywords để preview ───
export const getDocumentChunks = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const docId = parseInt(req.params.id, 10);
    // Verify accessibility before returning chunks
    await documentService.getDocumentById(docId, userId, req.user?.role);

    const data = await documentProcessingService.getDocumentChunks(docId, userId);
    if (!data) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    res.status(200).json(data);
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
    const { title, description, category, visibility, is_community_published, solution_text } = req.body;

    const document = await documentService.updateDocument(docId, userId, { 
      title, 
      description, 
      category, 
      visibility, 
      is_community_published: is_community_published !== undefined 
        ? (is_community_published === true || is_community_published === 'true')
        : undefined,
      solution_text 
    });
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
