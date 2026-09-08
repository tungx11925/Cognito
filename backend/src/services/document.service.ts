import { documentRepository } from '../repositories/document.repository';
import { AppError } from '../utils/AppError';

class DocumentService {
  async uploadDocument(data: { userId: number, title: string, description?: string, category?: string, docUrl: string }) {
    const document = await documentRepository.createDocument({
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      category: data.category || 'Khác',
      docUrl: data.docUrl
    });
    return document;
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
  }
}

export const documentService = new DocumentService();
