/* eslint-disable camelcase */

/**
 * Migration: Question Generator + AI Model Selection
 *
 * LƯU Ý QUAN TRỌNG (khác với thiết kế ban đầu, đã audit schema thật):
 * - Toàn bộ PK/FK hệ thống là SERIAL INTEGER (users, documents, questions...) →
 *   các bảng mới dùng SERIAL + INTEGER FK, KHÔNG dùng UUID (FK user_id REFERENCES users(id) là integer).
 * - pgvector + document_chunks ĐÃ được tạo trong 1787900100000_rag-pipeline.js
 *   → chỉ ALTER thêm cột keywords/metadata, KHÔNG tạo lại bảng.
 * - users.role ĐÃ tồn tại (VARCHAR(50) DEFAULT 'user') → normalize 'user' → 'student',
 *   đổi default thành 'student', CHECK constraint giữ thêm 'premium' vì FE premium
 *   (frontend/src/app/premium/page.tsx) phụ thuộc role='premium'.
 * - ai_task_configs / test_sets / questions được tạo RUNTIME (src/db/ai-test-schema.ts)
 *   → mọi ALTER trên 2 bảng đó phải guard bằng to_regclass() để migration chạy được
 *   trên DB chưa từng start server.
 * - Enum question_type thật: ('MULTIPLE_CHOICE','FILL_BLANK','ESSAY','TRUE_FALSE') — UPPERCASE.
 */
exports.up = async (pgm) => {
  // ── 1. pgvector (idempotent — image pgvector/pgvector:pg15 đã cấu hình trong docker-compose.yml) ──
  await pgm.sql(`CREATE EXTENSION IF NOT EXISTS vector;`);

  // ── 2. users.role: normalize + default 'student' + CHECK (giữ 'premium' cho tính năng Premium) ──
  await pgm.sql(`
    UPDATE users SET role = 'student' WHERE role IS NULL OR role = 'user' OR role = '';
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'student';
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check
          CHECK (role IN ('student', 'teacher', 'admin', 'premium'));
      END IF;
    END $$;
  `);

  // ── 3. Enum statuses (idempotent — phòng trường hợp migration chạy trước khi server bootstrap) ──
  await pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK', 'ESSAY', 'TRUE_FALSE');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE question_status AS ENUM ('DRAFT', 'APPROVED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // ── 4. ai_providers ──
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS ai_providers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,          -- 'groq' | 'gemini' | ...
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ── 5. ai_models ──
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS ai_models (
      id SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
      model_name VARCHAR(255) NOT NULL,           -- tên model thật gửi cho API, vd 'gemini-1.5-flash'
      display_name VARCHAR(255) NOT NULL,         -- tên hiển thị cho user, vd 'Gemini 1.5 Flash — nhanh'
      capabilities JSONB,                         -- { "chat": true, "embedding": false, "jsonMode": true }
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ai_models_provider_model ON ai_models(provider_id, model_name);
    CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(is_active);
  `);


  // ── 6. Seed dữ liệu ban đầu = đúng các model đang hardcode trong ai.service.ts / ai-engine.service.ts ──
  //    (groq/compound, gemini-3.6-flash, gemini-1.5-flash, llama-3.1-8b-instant)
  await pgm.sql(`
    INSERT INTO ai_providers (name) VALUES ('groq'), ('gemini')
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO ai_models (provider_id, model_name, display_name, capabilities)
    SELECT p.id, v.model_name, v.display_name, v.capabilities::jsonb
    FROM (VALUES
      ('groq',   'groq/compound',          'Groq Compound — nhanh, sinh đề chất lượng cao', '{"chat": true, "embedding": false, "jsonMode": false}'),
      ('groq',   'groq/compound-mini',     'Groq Compound Mini — siêu nhanh, tối ưu câu hỏi', '{"chat": true, "embedding": false, "jsonMode": true}'),
      ('gemini', 'gemini-3.6-flash',       'Gemini 3.6 Flash — cân bằng tốc độ/chất lượng', '{"chat": true, "embedding": false, "jsonMode": true}'),
      ('gemini', 'gemini-1.5-flash',       'Gemini 1.5 Flash — ổn định, hỗ trợ JSON mode', '{"chat": true, "embedding": false, "jsonMode": true}')
    ) AS v(provider, model_name, display_name, capabilities)
    JOIN ai_providers p ON p.name = v.provider
    ON CONFLICT (provider_id, model_name) DO NOTHING;
  `);

  // ── 7. ai_request_logs (KHÔNG lưu API key, KHÔNG lưu nguyên văn prompt/content) ──
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS ai_request_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_type VARCHAR(50) NOT NULL,             -- 'question_generation' | 'keyword_extraction' | 'embedding' | 'chat' | 'mindmap' | 'flashcard'
      model_id INTEGER REFERENCES ai_models(id) ON DELETE SET NULL,
      input_tokens INTEGER,
      output_tokens INTEGER,
      latency_ms INTEGER,
      status VARCHAR(20) NOT NULL,                -- 'success' | 'failed' | 'timeout'
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user ON ai_request_logs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_request_logs_model ON ai_request_logs(model_id);
  `);

  // ── 8. document_chunks: thêm cột keywords (AI trích xuất) + metadata ──
  //    Bảng đã tồn tại từ 1787900100000_rag-pipeline.js (id SERIAL, embedding VECTOR(768))
  await pgm.sql(`
    ALTER TABLE document_chunks
      ADD COLUMN IF NOT EXISTS keywords TEXT[],
      ADD COLUMN IF NOT EXISTS metadata JSONB;

    CREATE INDEX IF NOT EXISTS idx_document_chunks_keywords
      ON document_chunks USING gin (keywords);
  `);

  // ── 9. questions: bổ sung trường phục vụ Question Generator (guard vì bảng tạo runtime) ──
  await pgm.sql(`
    DO $$ BEGIN
      IF to_regclass('public.questions') IS NOT NULL THEN
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium';
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_keyword TEXT;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_chunk_id INTEGER REFERENCES document_chunks(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  // ── 10. test_sets: cấu hình sinh đề + trạng thái Preview(DRAFT) → Save(APPROVED) ──
  await pgm.sql(`
    DO $$ BEGIN
      IF to_regclass('public.test_sets') IS NOT NULL THEN
        ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS generation_config JSONB;
        ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS ai_model_id INTEGER REFERENCES ai_models(id) ON DELETE SET NULL;
        ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS status question_status DEFAULT 'DRAFT';
        -- Bộ đề đã tồn tại trước tính năng này coi như đã được duyệt (giữ nguyên hành vi hiển thị cũ)
        UPDATE test_sets SET status = 'APPROVED' WHERE status IS NULL;
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP TABLE IF EXISTS ai_request_logs;
    DROP TABLE IF EXISTS ai_models;
    DROP TABLE IF EXISTS ai_providers;

    DO $$ BEGIN
      IF to_regclass('public.test_sets') IS NOT NULL THEN
        ALTER TABLE test_sets DROP COLUMN IF EXISTS status;
        ALTER TABLE test_sets DROP COLUMN IF EXISTS ai_model_id;
        ALTER TABLE test_sets DROP COLUMN IF EXISTS generation_config;
      END IF;
      IF to_regclass('public.questions') IS NOT NULL THEN
        ALTER TABLE questions DROP COLUMN IF EXISTS source_chunk_id;
        ALTER TABLE questions DROP COLUMN IF EXISTS source_keyword;
        ALTER TABLE questions DROP COLUMN IF EXISTS difficulty;
        ALTER TABLE questions DROP COLUMN IF EXISTS explanation;
      END IF;
    END $$;

    ALTER TABLE document_chunks DROP COLUMN IF EXISTS keywords;
    ALTER TABLE document_chunks DROP COLUMN IF EXISTS metadata;

    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
  `);
};
