/* eslint-disable camelcase */

/**
 * Migration: Question Generator End-to-End Pipeline
 * - Bổ sung processing_status và page_count cho documents
 * - Bổ sung is_ocr cho document_chunks
 * - Bổ sung tier, input_cost, output_cost cho ai_models và gán tier chuẩn
 * - Bổ sung document_id cho ai_request_logs
 */
exports.up = async (pgm) => {
  // 1. Vector extension (idempotent)
  await pgm.sql(`CREATE EXTENSION IF NOT EXISTS vector;`);

  // 2. documents: thêm processing_status và page_count
  await pgm.sql(`
    ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS page_count INT;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'documents_processing_status_check'
      ) THEN
        ALTER TABLE documents ADD CONSTRAINT documents_processing_status_check
          CHECK (processing_status IN ('PENDING', 'PARSING', 'CHUNKING', 'EXTRACTING_KEYWORDS', 'READY', 'FAILED'));
      END IF;
    END $$;

    -- Đồng bộ trạng thái cho các tài liệu cũ: nếu đã READY thì giữ READY
    UPDATE documents SET processing_status = 'READY'
    WHERE status = 'READY' AND processing_status = 'PENDING';
  `);

  // 3. document_chunks: thêm cờ is_ocr
  await pgm.sql(`
    ALTER TABLE document_chunks
      ADD COLUMN IF NOT EXISTS is_ocr BOOLEAN NOT NULL DEFAULT false;
  `);

  // 4. ai_models: thêm tier, input_cost, output_cost
  await pgm.sql(`
    ALTER TABLE ai_models
      ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'balanced',
      ADD COLUMN IF NOT EXISTS input_cost NUMERIC,
      ADD COLUMN IF NOT EXISTS output_cost NUMERIC;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_models_tier_check'
      ) THEN
        ALTER TABLE ai_models ADD CONSTRAINT ai_models_tier_check
          CHECK (tier IN ('fast', 'balanced', 'advanced'));
      END IF;
    END $$;

    -- Cập nhật tier cho các model hiện có
    UPDATE ai_models SET tier = 'fast' WHERE model_name IN ('groq/compound', 'groq/compound-mini');
    UPDATE ai_models SET tier = 'balanced' WHERE model_name = 'gemini-1.5-flash';
    UPDATE ai_models SET tier = 'advanced' WHERE model_name = 'gemini-3.6-flash';
  `);

  // 5. ai_request_logs: thêm document_id
  await pgm.sql(`
    ALTER TABLE ai_request_logs
      ADD COLUMN IF NOT EXISTS document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_ai_request_logs_document
      ON ai_request_logs(document_id);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_ai_request_logs_document;
    ALTER TABLE ai_request_logs DROP COLUMN IF EXISTS document_id;

    ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_tier_check;
    ALTER TABLE ai_models
      DROP COLUMN IF EXISTS tier,
      DROP COLUMN IF EXISTS input_cost,
      DROP COLUMN IF EXISTS output_cost;

    ALTER TABLE document_chunks DROP COLUMN IF EXISTS is_ocr;

    ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_processing_status_check;
    ALTER TABLE documents
      DROP COLUMN IF EXISTS processing_status,
      DROP COLUMN IF EXISTS page_count;
  `);
};
