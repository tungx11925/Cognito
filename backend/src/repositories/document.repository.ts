import { db } from '../db';
import { PoolClient } from 'pg';

class DocumentRepository {
  async createDocument(data: { userId: number, title: string, description: string, category: string, docUrl: string }, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `INSERT INTO documents (user_id, title, description, category, doc_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.title, data.description, data.category, data.docUrl]
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

  async findDocumentById(docId: number, userId: number, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
      [docId, userId]
    );
    return result.rows[0];
  }
  async updateDocument(docId: number, userId: number, data: { title?: string, description?: string, category?: string }, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `UPDATE documents 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           category = COALESCE($3, category) 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [data.title, data.description, data.category, docId, userId]
    );
    return result.rows[0];
  }

  async deleteDocument(docId: number, userId: number, client?: PoolClient) {
    const q = client || db;
    await q.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [docId, userId]);
  }
}

export const documentRepository = new DocumentRepository();
