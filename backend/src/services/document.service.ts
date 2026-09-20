import { documentRepository } from '../repositories/document.repository';
import { AppError } from '../utils/AppError';
import cloudinary from '../config/cloudinary';
import { processingService } from './processing.service';
import { documentProcessingService } from './document-processing.service';

class DocumentService {
  async uploadDocument(data: { userId: number, title: string, description?: string, category?: string, docUrl: string, fileType?: string, fileSize?: number, publicId?: string }) {
    const document = await documentRepository.createDocument({
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      category: data.category || 'Khác',
      docUrl: data.docUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
      publicId: data.publicId,
      status: 'PROCESSING',
      processingStatus: 'PENDING',
    });

    // Kích hoạt pipeline xử lý chuyên sâu (PDF/PPTX/OCR/Chunking/Keyword Extraction)
    // Chạy bất đồng bộ (fire-and-forget), không block HTTP request
    documentProcessingService.processDocument(document.id).catch(err => {
      console.error(`[Upload] documentProcessingService failed for doc ${document.id}:`, err);
    });

    return document;
  }


  async getDocumentStatus(docId: number, userId: number) {
    const status = await documentRepository.findDocumentStatus(docId, userId);
    if (!status) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }
    return status;
  }

  async reprocessDocument(docId: number, userId: number) {
    const doc = await documentRepository.findDocumentById(docId, userId);
    if (!doc) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }
    if (!doc.doc_url) {
      throw new AppError('Tài liệu không có file để xử lý lại', 400);
    }
    processingService.reprocess(doc.id, userId, doc.doc_url, doc.file_type);
    return { id: doc.id, status: 'PROCESSING' };
  }

  async getDocuments(userId: number, search?: string, category?: string) {
    const documents = await documentRepository.findDocuments(userId, search, category);
    return documents;
  }

  async getDocumentById(docId: number, userId: number) {
    const document = await documentRepository.findDocumentById(docId, userId);
    if (!document) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }
    return document;
  }

  async createDocument(data: { userId: number, title: string, description?: string, category?: string, docUrl?: string, solutionText?: string, solutionUrl?: string }) {
    // Re-use uploadDocument logic or create a new one, but app.routes just directly inserted it
    // Wait, the original repo createDocument expects docUrl. 
    // I will write a custom insert here or use raw db. 
    const { db } = require('../db');
    const result = await db.query(
      `INSERT INTO documents (user_id, title, description, doc_url, solution_text, solution_url, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.userId, data.title, data.description || '', data.docUrl || '', data.solutionText || '', data.solutionUrl || '', data.category || 'Khác']
    );
    return result.rows[0];
  }

  async updateDocument(docId: number, userId: number, data: { title?: string, description?: string, category?: string }) {
    const doc = await documentRepository.findDocumentById(docId, userId);
    if (!doc) {
      throw new AppError('Bạn không có quyền sửa tài liệu này hoặc tài liệu không tồn tại', 403);
    }
    return await documentRepository.updateDocument(docId, userId, data);
  }

  async deleteDocument(docId: number, userId: number) {
    const doc = await documentRepository.findDocumentById(docId, userId);
    if (!doc) {
      throw new AppError('Bạn không có quyền xóa tài liệu này hoặc tài liệu không tồn tại', 403);
    }
    await documentRepository.deleteDocument(docId, userId);

    // Delete from Cloudinary (non-blocking — best-effort)
    const cloudinaryPublicId = doc.cloudinary_public_id;
    if (cloudinaryPublicId) {
      const isImage = (doc.file_type || '').startsWith('image/');
      // Try both 'image' and 'raw' for deletion since resource_type stored may differ
      cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: isImage ? 'image' : 'raw' })
        .catch(() => cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'raw' })
          .catch(err => console.error('Cloudinary delete error (non-fatal):', err)));
    }
  }
}

export const documentService = new DocumentService();
