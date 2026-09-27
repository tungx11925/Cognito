import { documentRepository } from '../repositories/document.repository';
import { communityRepository } from '../repositories/community.repository';
import { AppError } from '../utils/AppError';
import cloudinary from '../config/cloudinary';
import { documentProcessingService } from './document-processing.service';
import { db } from '../db';

class DocumentService {
  /**
   * Format document object adhering to Master Prompt Phase 4 specification:
   * owner, title, description, file, type, size, status, visibility, createdAt, updatedAt
   */
  formatDocument(doc: any) {
    if (!doc) return null;
    return {
      id: doc.id,
      user_id: doc.user_id,
      owner: doc.user_id,
      title: doc.title,
      description: doc.description || '',
      category: doc.category || 'Khác',
      doc_url: doc.doc_url || '',
      file: doc.doc_url || '',
      file_type: doc.file_type || '',
      type: doc.file_type || '',
      file_size: doc.file_size || 0,
      size: doc.file_size || 0,
      status: doc.status || 'PROCESSING',
      processing_status: doc.processing_status || 'PENDING',
      processing_error: doc.processing_error || null,
      visibility: (doc.visibility || 'private').toLowerCase(),
      is_community_published: !!doc.is_community_published,
      page_count: doc.page_count || 1,
      processed_at: doc.processed_at,
      created_at: doc.created_at,
      updated_at: doc.updated_at || doc.created_at,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at || doc.created_at,
      solution_text: doc.solution_text || '',
      solution_url: doc.solution_url || '',
    };
  }

  async uploadDocument(data: {
    userId: number;
    title: string;
    description?: string;
    category?: string;
    visibility?: string;
    isCommunityPublished?: boolean;
    docUrl: string;
    fileType?: string;
    fileSize?: number;
    publicId?: string;
  }) {
    const visibility = data.visibility === 'public' ? 'public' : 'private';
    const isCommunityPublished = !!data.isCommunityPublished;

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
      visibility,
      isCommunityPublished,
    });

    // If community published is explicitly requested, publish to community_resources
    if (isCommunityPublished && visibility === 'public') {
      communityRepository.publishResource({
        userId: data.userId,
        resourceType: 'document',
        resourceId: document.id,
        title: document.title,
        description: document.description,
        isPublic: true,
      }).catch(err => console.error('[CommunityPublish] Upload publish error:', err));
    }

    // Kích hoạt pipeline xử lý chuyên sâu (PDF/PPTX/Word/TXT/Spreadsheets/OCR/Chunking/Keyword Extraction)
    documentProcessingService.processDocument(document.id).catch(err => {
      console.error(`[Upload] documentProcessingService failed for doc ${document.id}:`, err);
    });

    return this.formatDocument(document);
  }

  async getDocumentStatus(docId: number, userId: number) {
    const status = await documentRepository.findDocumentStatus(docId, userId);
    if (!status) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }
    return status;
  }

  async reprocessDocument(docId: number, userId: number) {
    const doc = await documentRepository.findDocumentById(docId);
    if (!doc) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }
    if (doc.user_id !== userId) {
      throw new AppError('Bạn không có quyền xử lý lại tài liệu này', 403);
    }
    if (!doc.doc_url) {
      throw new AppError('Tài liệu không có file để xử lý lại', 400);
    }
    
    // Trigger deep document processing pipeline
    documentProcessingService.processDocument(doc.id).catch(err => {
      console.error(`[Reprocess] documentProcessingService failed for doc ${doc.id}:`, err);
    });

    return { id: doc.id, status: 'PROCESSING' };
  }

  async getDocuments(userId: number, search?: string, category?: string) {
    const documents = await documentRepository.findDocuments(userId, search, category);
    return documents.map(d => this.formatDocument(d));
  }

  async getDocumentById(docId: number, userId: number, userRole?: string | null) {
    const document = await documentRepository.findDocumentById(docId);
    if (!document) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }

    const isOwner = document.user_id === userId;
    const isPublic = (document.visibility || '').toLowerCase() === 'public';
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isPublic && !isAdmin) {
      throw new AppError('Bạn không có quyền truy cập tài liệu riêng tư này', 403);
    }

    return this.formatDocument(document);
  }

  async createDocument(data: {
    userId: number;
    title: string;
    description?: string;
    category?: string;
    docUrl?: string;
    solutionText?: string;
    solutionUrl?: string;
    visibility?: string;
    isCommunityPublished?: boolean;
  }) {
    const visibility = data.visibility === 'public' ? 'public' : 'private';
    const isCommunityPublished = !!(data.isCommunityPublished ?? (data as any).is_community_published);

    const result = await db.query(
      `INSERT INTO documents (
        user_id, title, description, doc_url, solution_text, solution_url, category, 
        visibility, is_community_published, status, processing_status, updated_at
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'READY', 'READY', CURRENT_TIMESTAMP) 
       RETURNING *`,
      [
        data.userId, 
        data.title, 
        data.description || '', 
        data.docUrl || '', 
        data.solutionText || '', 
        data.solutionUrl || '', 
        data.category || 'Khác',
        visibility,
        isCommunityPublished
      ]
    );

    const doc = result.rows[0];
    if (isCommunityPublished && visibility === 'public') {
      communityRepository.publishResource({
        userId: data.userId,
        resourceType: 'document',
        resourceId: doc.id,
        title: doc.title,
        description: doc.description,
        isPublic: true,
      }).catch(() => {});
    }

    return this.formatDocument(doc);
  }

  async updateDocument(docId: number, userId: number, data: {
    title?: string;
    description?: string;
    category?: string;
    visibility?: string;
    is_community_published?: boolean;
    solution_text?: string;
  }) {
    const doc = await documentRepository.findDocumentById(docId);
    if (!doc) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }
    if (doc.user_id !== userId) {
      throw new AppError('Bạn không có quyền sửa tài liệu này', 403);
    }

    const updated = await documentRepository.updateDocument(docId, userId, data);

    // Sync with community_resources if visibility or is_community_published was modified
    if (data.is_community_published !== undefined || data.visibility !== undefined) {
      const isNowPublic = (data.visibility !== undefined ? data.visibility === 'public' : updated.visibility === 'public');
      const isNowPublished = (data.is_community_published !== undefined ? data.is_community_published : updated.is_community_published);
      if (isNowPublic && isNowPublished) {
        communityRepository.publishResource({
          userId,
          resourceType: 'document',
          resourceId: docId,
          title: updated.title,
          description: updated.description,
          isPublic: true,
        }).catch(err => console.error('[CommunityPublish] Update publish error:', err));
      } else {
        db.query(
          `UPDATE community_resources SET is_public = false WHERE resource_type = 'document' AND resource_id = $1`,
          [docId]
        ).catch(() => {});
      }
    }

    return this.formatDocument(updated);
  }

  async deleteDocument(docId: number, userId: number) {
    const doc = await documentRepository.findDocumentById(docId);
    if (!doc) {
      throw new AppError('Bạn không có quyền xóa tài liệu này hoặc tài liệu không tồn tại', 403);
    }
    if (doc.user_id !== userId) {
      throw new AppError('Bạn không có quyền xóa tài liệu này', 403);
    }

    // Unlink or delete from community_resources
    await db.query(
      `DELETE FROM community_resources WHERE resource_type = 'document' AND resource_id = $1`,
      [docId]
    ).catch(() => {});

    await documentRepository.deleteDocument(docId, userId);

    // Delete from Cloudinary (non-blocking — best-effort)
    const cloudinaryPublicId = doc.cloudinary_public_id;
    if (cloudinaryPublicId) {
      const isImage = (doc.file_type || '').startsWith('image/');
      cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: isImage ? 'image' : 'raw' })
        .catch(() => cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'raw' })
          .catch(err => console.error('Cloudinary delete error (non-fatal):', err)));
    }
  }
}

export const documentService = new DocumentService();
