import { db } from '../db';
import { PoolClient } from 'pg';

class DocumentRepository {
  async createDocument(data: {
    userId: number;
    title: string;
    description: string;
    category: string;
    docUrl: string;
    fileType?: string;
    fileSize?: number;
    publicId?: string;
    status?: string;
    processingStatus?: string;
    visibility?: string;
    isCommunityPublished?: boolean;
  }, client?: PoolClient) {
    const q = client || db;
    const visibility = data.visibility === 'public' ? 'public' : 'private';
    const isCommunityPublished = !!data.isCommunityPublished;

    const result = await q.query(
      `INSERT INTO documents (
        user_id, title, description, category, doc_url, file_type, file_size, 
        cloudinary_public_id, status, processing_status, visibility, is_community_published,
        updated_at
      )
       VALUES (
        $1, $2, $3, $4, $5, $6, $7, 
        $8, COALESCE($9, 'PROCESSING'), COALESCE($10, 'PENDING'), $11, $12,
        CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        data.userId,
        data.title,
        data.description,
        data.category,
        data.docUrl,
        data.fileType || null,
        data.fileSize || null,
        data.publicId || null,
        data.status || null,
        data.processingStatus || 'PENDING',
        visibility,
        isCommunityPublished
      ]
    );
    return result.rows[0];
  }

  async findDocumentStatus(docId: number, userId: number, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `SELECT id, title, status, processing_status, processing_error, page_count, processed_at,
              visibility, is_community_published, created_at, updated_at,
              (SELECT COUNT(*)::int FROM document_chunks WHERE document_id = documents.id) AS chunk_count
       FROM documents WHERE id = $1 AND (user_id = $2 OR visibility = 'public')`,
      [docId, userId]
    );
    return result.rows[0];
  }

  async findDocuments(userId: number, search?: string, category?: string, client?: PoolClient) {
    const q = client || db;
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

    const result = await q.query(query, values);
    return result.rows;
  }

  async findDocumentById(docId: number, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `SELECT * FROM documents WHERE id = $1`,
      [docId]
    );
    return result.rows[0];
  }

  async updateDocument(
    docId: number, 
    userId: number, 
    data: { 
      title?: string; 
      description?: string; 
      category?: string; 
      visibility?: string; 
      is_community_published?: boolean; 
      solution_text?: string;
    }, 
    client?: PoolClient
  ) {
    const q = client || db;
    const result = await q.query(
      `UPDATE documents 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           category = COALESCE($3, category),
           visibility = COALESCE($4, visibility),
           is_community_published = COALESCE($5, is_community_published),
           solution_text = COALESCE($6, solution_text),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8 
       RETURNING *`,
      [
        data.title, 
        data.description, 
        data.category, 
        data.visibility, 
        data.is_community_published, 
        data.solution_text,
        docId, 
        userId
      ]
    );
    return result.rows[0];
  }

  async deleteDocument(docId: number, userId: number, client?: PoolClient) {
    const q = client || db;
    await q.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [docId, userId]);
  }
}

export const documentRepository = new DocumentRepository();
