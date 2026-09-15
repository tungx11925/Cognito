import { db } from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * RAG Service — Chunking, Embedding, Similarity Search
 * Dùng cho Document Processing Pipeline (mục B) và AI Assistant (mục A).
 * Embedding: Google Gemini text-embedding-004 (768 dims) — API key chỉ nằm ở backend.
 */

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  page_number: number | null;
  token_count: number | null;
  similarity?: number;
}

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIM = 768;

// Cấu hình chunk: ~500–800 token, overlap 50–100 token (ước lượng ~4 ký tự/token)
const TARGET_CHUNK_TOKENS = 600;
const OVERLAP_TOKENS = 80;
const CHARS_PER_TOKEN = 4;

export function isEmbeddingConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!(key && !key.includes('your_'));
}

/**
 * Chia text thành các chunk theo biên từ/câu, target ~600 token, overlap ~80 token.
 * Không phụ thuộc thư viện ngoài để tránh đổi package lớn.
 */
export function chunkText(text: string, opts?: { targetTokens?: number; overlapTokens?: number }): string[] {
  const targetTokens = opts?.targetTokens || TARGET_CHUNK_TOKENS;
  const overlapTokens = opts?.overlapTokens || OVERLAP_TOKENS;
  const clean = (text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];

  const targetChars = targetTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + targetChars, clean.length);
    if (end < clean.length) {
      // Cắt tại biên từ/kết thúc câu gần nhất để không đứt giữa từ
      const slice = clean.slice(start, end);
      const lastBoundary = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
      if (lastBoundary > targetChars * 0.5) {
        end = start + lastBoundary + 1;
      }
    }
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (end >= clean.length) break;
    start = Math.max(end - overlapChars, start + 1); // đảm bảo tiến tiến, tránh vòng lặp vô hạn
  }

  return chunks;
}

/**
 * Gọi Gemini embedding cho 1 batch text.
 */
async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('EMBEDDING_NOT_CONFIGURED');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.batchEmbedContents({
    requests: texts.map(t => ({
      model: `models/${EMBEDDING_MODEL}`,
      content: { role: 'user', parts: [{ text: t.substring(0, 8000) }] },
    })),
  });

  return result.embeddings.map(e => e.values as number[]);
}

function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}

/**
 * Pipeline: chunk text → embed → lưu vào document_chunks
 * Trả về số chunk đã lưu.
 */
export async function indexDocumentChunks(
  documentId: number,
  text: string,
  opts?: { targetTokens?: number; overlapTokens?: number }
): Promise<{ chunkCount: number }> {
  // Xóa chunks cũ (re-index)
  await db.query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);

  const chunkTexts = chunkText(text, opts);
  if (chunkTexts.length === 0) return { chunkCount: 0 };

  if (!isEmbeddingConfigured()) {
    throw new Error('EMBEDDING_NOT_CONFIGURED');
  }

  // Embed theo batch 100 (giới hạn batchEmbedContents)
  const batchSize = 100;
  for (let i = 0; i < chunkTexts.length; i += batchSize) {
    const batch = chunkTexts.slice(i, i + batchSize);
    const vectors = await embedBatch(batch);
    for (let j = 0; j < batch.length; j++) {
      const vector = vectors[j];
      if (!vector || vector.length !== EMBEDDING_DIM) continue;
      await db.query(
        `INSERT INTO document_chunks (document_id, chunk_index, content, token_count, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)
         ON CONFLICT (document_id, chunk_index) DO UPDATE
           SET content = EXCLUDED.content,
               token_count = EXCLUDED.token_count,
               embedding = EXCLUDED.embedding`,
        [
          documentId,
          i + j,
          batch[j],
          Math.ceil(batch[j].length / CHARS_PER_TOKEN),
          toVectorLiteral(vector),
        ]
      );
    }
  }

  return { chunkCount: chunkTexts.length };
}

/**
 * Similarity search theo vector (pgvector cosine). Chỉ search trong 1 tài liệu.
 * Fallback tự động về keyword search nếu chưa có embedding/key.
 */
export async function searchChunks(
  documentId: number,
  query: string,
  topK = 6
): Promise<DocumentChunk[]> {
  if (!query.trim() || !isEmbeddingConfigured()) return keywordSearchChunks(documentId, query, topK);

  try {
    const [queryVector] = await embedBatch([query]);
    if (!queryVector || queryVector.length !== EMBEDDING_DIM) {
      return keywordSearchChunks(documentId, query, topK);
    }
    const result = await db.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count,
              1 - (embedding <=> $2::vector) AS similarity
       FROM document_chunks
       WHERE document_id = $1 AND embedding IS NOT NULL
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      [documentId, toVectorLiteral(queryVector), topK]
    );
    return result.rows as DocumentChunk[];
  } catch (err) {
    console.error('[RAG] Vector search failed, fallback to keyword search:', err);
    return keywordSearchChunks(documentId, query, topK);
  }
}

/**
 * Fallback: keyword search (ILIKE) cho tài liệu legacy chưa có embedding.
 */
export async function keywordSearchChunks(
  documentId: number,
  query: string,
  topK = 6
): Promise<DocumentChunk[]> {
  const keywords = (query || '')
    .split(/[\s,.;:!?()"'`]+/)
    .map(k => k.trim())
    .filter(k => k.length >= 3)
    .slice(0, 8);

  let rows: DocumentChunk[] = [];
  if (keywords.length > 0) {
    const conditions = keywords.map((_, i) => `content ILIKE $${i + 2}`).join(' OR ');
    const result = await db.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count, 0.5 AS similarity
       FROM document_chunks
       WHERE document_id = $1 AND (${conditions})
       ORDER BY chunk_index ASC
       LIMIT $${keywords.length + 2}`,
      [documentId, ...keywords, topK]
    );
    rows = result.rows as DocumentChunk[];
  }

  if (rows.length === 0) {
    // Không match keyword: trả về chunk đầu tài liệu làm ngữ cảnh mặc định
    const result = await db.query(
      `SELECT id, document_id, chunk_index, content, page_number, token_count, 0 AS similarity
       FROM document_chunks WHERE document_id = $1
       ORDER BY chunk_index ASC LIMIT $2`,
      [documentId, topK]
    );
    rows = result.rows as DocumentChunk[];
  }
  return rows;
}

/**
 * Đếm số chunk của tài liệu (hiển thị trạng thái index).
 */
export async function getChunkCount(documentId: number): Promise<number> {
  const result = await db.query(
    'SELECT COUNT(*)::int AS count FROM document_chunks WHERE document_id = $1',
    [documentId]
  );
  return result.rows[0]?.count || 0;
}