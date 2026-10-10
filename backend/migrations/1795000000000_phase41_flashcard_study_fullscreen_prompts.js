/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- 1. Extend flashcards table
    ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS term_image_url TEXT;
    ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS definition_image_url TEXT;

    CREATE INDEX IF NOT EXISTS idx_flashcards_deck_position ON flashcards(deck_id, position);

    -- 2. Extend flashcard_decks table
    ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS category VARCHAR(100);

    -- 3. Study settings per user per deck
    CREATE TABLE IF NOT EXISTS flashcard_study_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deck_id INTEGER NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
      shuffle_cards BOOLEAN NOT NULL DEFAULT false,
      front_display VARCHAR(20) NOT NULL DEFAULT 'term',
      starred_only BOOLEAN NOT NULL DEFAULT false,
      difficult_only BOOLEAN NOT NULL DEFAULT false,
      auto_tts BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, deck_id)
    );
    CREATE INDEX IF NOT EXISTS idx_flashcard_study_settings_user ON flashcard_study_settings(user_id);
    CREATE INDEX IF NOT EXISTS idx_flashcard_study_settings_deck ON flashcard_study_settings(deck_id);

    -- 4. AI Prompt Templates
    CREATE TABLE IF NOT EXISTS ai_prompt_templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      prompt_text TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'general',
      is_system BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_user ON ai_prompt_templates(user_id);

    -- Insert system prompt templates if not already present
    INSERT INTO ai_prompt_templates (user_id, title, prompt_text, category, is_system)
    SELECT NULL, 'Tóm tắt nội dung', 'Tóm tắt nội dung chính ngắn gọn, có cấu trúc gạch đầu dòng rõ ràng và làm nổi bật các luận điểm quan trọng.', 'summary', true
    WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE is_system = true AND category = 'summary');

    INSERT INTO ai_prompt_templates (user_id, title, prompt_text, category, is_system)
    SELECT NULL, 'Giải thích dễ hiểu', 'Giải thích khái niệm/nội dung này một cách trực quan, dễ hiểu kèm ví dụ minh họa thực tế sinh động.', 'explain', true
    WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE is_system = true AND category = 'explain');

    INSERT INTO ai_prompt_templates (user_id, title, prompt_text, category, is_system)
    SELECT NULL, 'Dịch sang tiếng Việt', 'Dịch nội dung này sang tiếng Việt tự nhiên, chính xác, giữ nguyên các thuật ngữ chuyên ngành trong ngoặc đơn.', 'translate', true
    WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE is_system = true AND category = 'translate');

    INSERT INTO ai_prompt_templates (user_id, title, prompt_text, category, is_system)
    SELECT NULL, 'Tạo câu hỏi ôn tập', 'Tạo 5 câu hỏi trắc nghiệm ôn tập trọng tâm (kèm 4 đáp án A, B, C, D và giải thích chi tiết đáp án đúng) từ nội dung này.', 'quiz', true
    WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE is_system = true AND category = 'quiz');

    INSERT INTO ai_prompt_templates (user_id, title, prompt_text, category, is_system)
    SELECT NULL, 'Tạo thẻ ghi nhớ', 'Trích xuất và tạo các cặp Thuật ngữ - Định nghĩa cô đọng, chính xác nhất từ nội dung này.', 'flashcard', true
    WHERE NOT EXISTS (SELECT 1 FROM ai_prompt_templates WHERE is_system = true AND category = 'flashcard');

    -- 5. AI Prompt History
    CREATE TABLE IF NOT EXISTS ai_prompt_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      prompt_text TEXT NOT NULL,
      context_mode VARCHAR(50) DEFAULT 'document',
      scope VARCHAR(100) DEFAULT 'full',
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_user_doc ON ai_prompt_history(user_id, document_id, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS ai_prompt_history CASCADE;
    DROP TABLE IF EXISTS ai_prompt_templates CASCADE;
    DROP TABLE IF EXISTS flashcard_study_settings CASCADE;
    ALTER TABLE flashcard_decks DROP COLUMN IF EXISTS category;
    DROP INDEX IF EXISTS idx_flashcards_deck_position;
    ALTER TABLE flashcards DROP COLUMN IF EXISTS definition_image_url;
    ALTER TABLE flashcards DROP COLUMN IF EXISTS term_image_url;
    ALTER TABLE flashcards DROP COLUMN IF EXISTS position;
  `);
};
