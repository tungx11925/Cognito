import { db } from '../db';
import { PoolClient } from 'pg';

/**
 * Document Chunks Repository — raw SQL theo pattern Repository hiện tại.
 * Bảng document_chunks:
 *   id SERIAL, document_id INTEGER, chunk_index, content, page_number,
 *   token_count, embedding VECTOR(768), keywords TEXT[], metadata JSONB, is_ocr BOOLEAN
 */
export interface DocumentChunkRow {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  page_number: number | null;
  token_count: number | null;
  keywords: string[] | null;
  is_ocr: boolean;
}

export class DocumentChunksRepository {
  /** Xoá toàn bộ chunks của 1 tài liệu (dùng khi re-process) */
  async deleteByDocument(documentId: number, client?: PoolClient): Promise<void> {
    const q = client || db;
    await q.query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);
  }

  /** Thêm mới nhiều chunk cho 1 tài liệu */
  async insertChunks(
    chunks: Array<{
      document_id: number;
      chunk_index: number;
      content: string;
      page_number?: number | null;
      token_count?: number | null;
      is_ocr?: boolean;
      keywords?: string[];
    }>,
    client?: PoolClient
  ): Promise<DocumentChunkRow[]> {
    if (!chunks.length) return [];
    const q = client || db;
    const inserted: DocumentChunkRow[] = [];

    for (const c of chunks) {
      const res = await q.query(
        `INSERT INTO document_chunks 
           (document_id, chunk_index, content, page_number, token_count, is_ocr, keywords)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, false), COALESCE($7::text[], '{}'::text[]))
         ON CONFLICT (document_id, chunk_index) 
         DO UPDATE SET 
           content = EXCLUDED.content,
           page_number = EXCLUDED.page_number,
           token_count = EXCLUDED.token_count,
           is_ocr = EXCLUDED.is_ocr,
           keywords = EXCLUDED.keywords
         RETURNING id, document_id, chunk_index, content, page_number, token_count, keywords, is_ocr`,
        [
          c.document_id,
          c.chunk_index,
          c.content,
          c.page_number ?? null,
          c.token_count ?? null,
          c.is_ocr ?? false,
          c.keywords ?? [],
        ]
      );
      if (res.rows[0]) inserted.push(res.rows[0]);
    }
    return inserted;
  }

  /** Đếm số chunk của 1 tài liệu */
  async countByDocument(documentId: number, client?: PoolClient): Promise<number> {
    const q = client || db;
    const result = await q.query(
      'SELECT COUNT(*)::int AS count FROM document_chunks WHERE document_id = $1',
      [documentId]
    );
    return result.rows[0]?.count || 0;
  }

  /** Lấy danh sách chunks của 1 tài liệu theo thứ tự chunk_index */
  async listByDocument(documentId: number, client?: PoolClient): Promise<DocumentChunkRow[]> {
    const q = client || db;
    const result = await q.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count, keywords, is_ocr
       FROM document_chunks
       WHERE document_id = $1
       ORDER BY chunk_index ASC`,
      [documentId]
    );
    return result.rows as DocumentChunkRow[];
  }

  /** Lấy chunk theo danh sách document_id (theo thứ tự chunk_index), giới hạn tổng số */
  async listByDocuments(documentIds: number[], opts?: { perDocLimit?: number; totalCap?: number }, client?: PoolClient) {
    const q = client || db;
    const perDocLimit = opts?.perDocLimit ?? 12;
    const totalCap = opts?.totalCap ?? 30;
    const result = await q.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count, keywords, is_ocr
       FROM (
         SELECT dc.*, ROW_NUMBER() OVER (PARTITION BY dc.document_id ORDER BY dc.chunk_index) AS rn
         FROM document_chunks dc
         WHERE dc.document_id = ANY($1::int[])
       ) t
       WHERE t.rn <= $2
       ORDER BY t.document_id, t.chunk_index
       LIMIT $3`,
      [documentIds, perDocLimit, totalCap]
    );
    return result.rows as DocumentChunkRow[];
  }

  /** Lọc chunk trùng/trái từ khoá trên cột keywords[] (AI đã trích xuất) */
  async searchByKeywords(documentIds: number[], keywords: string[], limit = 25, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count, keywords, is_ocr
       FROM document_chunks
       WHERE document_id = ANY($1::int[]) AND keywords && $2::text[]
       ORDER BY chunk_index
       LIMIT $3`,
      [documentIds, keywords, limit]
    );
    return result.rows as DocumentChunkRow[];
  }

  /** Lấy chunk theo id (validate sourceChunkId do AI trả về) */
  async getByIds(chunkIds: number[], client?: PoolClient) {
    const q = client || db;
    if (!chunkIds.length) return [];
    const result = await q.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count, keywords, is_ocr
       FROM document_chunks WHERE id = ANY($1::int[])`,
      [chunkIds]
    );
    return result.rows as DocumentChunkRow[];
  }

  /** Lưu keywords AI trích xuất cho từng chunk */
  async setKeywords(chunkId: number, keywords: string[], client?: PoolClient) {
    const q = client || db;
    await q.query(
      'UPDATE document_chunks SET keywords = $2::text[] WHERE id = $1',
      [chunkId, keywords]
    );
  }

  /** Chunk nào chưa có keywords */
  async listMissingKeywords(documentId: number, limit = 50, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count, keywords, is_ocr
       FROM document_chunks
       WHERE document_id = $1 AND (keywords IS NULL OR array_length(keywords, 1) IS NULL OR array_length(keywords, 1) = 0)
       ORDER BY chunk_index
       LIMIT $2`,
      [documentId, limit]
    );
    return result.rows as DocumentChunkRow[];
  }

  /** Tổng hợp từ khoá theo tần suất xuất hiện trong chunks (cho chip FE) */
  async getKeywordCatalog(documentId: number, limit = 30, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `SELECT keyword, COUNT(*)::int AS count
       FROM (
         SELECT unnest(keywords) AS keyword
         FROM document_chunks
         WHERE document_id = $1 AND keywords IS NOT NULL
       ) s
       WHERE keyword IS NOT NULL AND length(keyword) > 0
       GROUP BY keyword
       ORDER BY count DESC, keyword ASC
       LIMIT $2`,
      [documentId, limit]
    );
    return result.rows as { keyword: string; count: number }[];
  }

  /** Lấy tất cả từ khóa duy nhất (unique) của 1 hoặc nhiều tài liệu */
  async getUniqueKeywords(documentIds: number[], client?: PoolClient): Promise<string[]> {
    const q = client || db;
    const result = await q.query(
      `SELECT DISTINCT unnest(keywords) AS keyword
       FROM document_chunks
       WHERE document_id = ANY($1::int[]) AND keywords IS NOT NULL
       ORDER BY keyword ASC`,
      [documentIds]
    );
    return result.rows.map(r => r.keyword).filter(Boolean);
  }

  /** Đếm số chunk đã có keywords */
  async countWithKeywords(documentId: number, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      `SELECT COUNT(*)::int AS count FROM document_chunks
       WHERE document_id = $1 AND keywords IS NOT NULL AND array_length(keywords, 1) > 0`,
      [documentId]
    );
    return result.rows[0]?.count || 0;
  }
}

export const documentChunksRepository = new DocumentChunksRepository();
