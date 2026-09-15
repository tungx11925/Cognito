/* eslint-disable camelcase */

/**
 * Migration: Document Processing Pipeline (RAG)
 * - Bật extension pgvector (yêu cầu image pgvector/pgvector:pg15)
 * - documents: thêm status (UPLOADING/PROCESSING/INDEXING/READY/FAILED) + processing_error
 * - document_chunks: lưu chunk text + embedding vector(768) (Gemini text-embedding-004)
 */
exports.up = async (pgm) => {
  // 1. Bật pgvector extension (user chạy migrate trong container Postgres là superuser)
  await pgm.sql(`CREATE EXTENSION IF NOT EXISTS vector;`);

  // 2. Thêm trạng thái xử lý cho documents
  //    Legacy documents (đã upload trước khi có pipeline) mặc định READY để không phá vỡ chức năng đang chạy.
  await pgm.sql(`
    ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'READY',
      ADD COLUMN IF NOT EXISTS processing_error TEXT,
      ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'documents_status_check'
      ) THEN
        ALTER TABLE documents ADD CONSTRAINT documents_status_check
          CHECK (status IN ('UPLOADING', 'PROCESSING', 'INDEXING', 'READY', 'FAILED'));
      END IF;
    END $$;
  `);

  // 3. Bảng chunks phục vụ RAG
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      page_number INTEGER,
      token_count INTEGER,
      embedding VECTOR(768),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (document_id, chunk_index)
    );
  `);

  // 4. Index phục vụ similarity search (cosine) — HNSW của pgvector
  await pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_document_chunks_document
      ON document_chunks(document_id);

    CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
      ON document_chunks USING hnsw (embedding vector_cosine_ops);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`DROP TABLE IF EXISTS document_chunks;`);
  await pgm.sql(`
    ALTER TABLE documents
      DROP COLUMN IF EXISTS status,
      DROP COLUMN IF EXISTS processing_error,
      DROP COLUMN IF EXISTS processed_at;
  `);
  // Giữ lại extension vector khi rollback (an toàn: các bảng khác có thể phụ thuộc)
};