/* eslint-disable camelcase */

exports.shorthands = undefined;

/**
 * PHASE 1 MIGRATION: Personal Learning Platform Database Foundation
 *
 * 1. Tháo gỡ các ràng buộc khóa ngoại (FK) trỏ chéo từ School sang Core (User, Document, TestSet, Question).
 * 2. Chuẩn hóa bảng users: Role chuẩn ('user', 'admin'), thêm cờ is_premium, premium_until, bio, headline.
 * 3. Chuẩn hóa & chuyển đổi schema runtime sang migration có version:
 *    ai_task_configs, test_sets, questions, lectures, lecture_slides.
 * 4. Chuẩn hóa bảng Quiz Attempts & Answers cho cá nhân (Personal Quiz Engine).
 * 5. Chuẩn hóa Learning Goals & Learning Activities & Focus Session metrics.
 * 6. Chuẩn hóa Community Ecosystem (Resources, Likes, Comments, Saves).
 * 7. Chuẩn hóa 1-on-1 Messaging (Conversations, Messages).
 * 8. Chuẩn hóa Notifications.
 * 9. Chuẩn hóa Subscription, Plans, Payment Orders & Daily Usages.
 */
exports.up = async (pgm) => {
  // ─── 1. THÁO GỠ CÁC RÀNG BUỘC NGOẠI TRỎ CHÉO TỪ SCHOOL SANG CORE ───
  await pgm.sql(`
    -- Tháo gỡ FK từ users.primary_organization_id sang organizations
    ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_primary_organization;

    -- Tháo gỡ FK từ class_assignments sang test_sets và documents
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_assignments') THEN
        ALTER TABLE class_assignments DROP CONSTRAINT IF EXISTS class_assignments_test_set_id_fkey;
        ALTER TABLE class_assignments DROP CONSTRAINT IF EXISTS class_assignments_document_id_fkey;
      END IF;
    END $$;

    -- Tháo gỡ FK từ attempt_answers sang questions
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attempt_answers') THEN
        ALTER TABLE attempt_answers DROP CONSTRAINT IF EXISTS attempt_answers_question_id_fkey;
      END IF;
    END $$;
  `);

  // ─── 2. CHUẨN HÓA BẢNG USERS ───
  await pgm.sql(`
    -- Thêm các cột profile & premium nếu chưa có
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(255);

    -- Di chuyển dữ liệu role hiện tại sang chuẩn ('user', 'admin')
    UPDATE users SET is_premium = true WHERE role = 'premium';
    UPDATE users SET role = 'user' WHERE role IN ('student', 'teacher', 'premium', 'user', '') OR role IS NULL;
    UPDATE users SET role = 'admin' WHERE role = 'admin';

    -- Đặt lại giá trị mặc định cho cột role
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

    -- Cập nhật ràng buộc CHECK constraint trên users.role
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  `);

  // ─── 3. FORMALIZE CORE SCHEMAS (AI TASK CONFIGS, TEST SETS, QUESTIONS) ───
  await pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK', 'ESSAY', 'TRUE_FALSE');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE question_status AS ENUM ('DRAFT', 'APPROVED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS ai_task_configs (
      id SERIAL PRIMARY KEY,
      course_id VARCHAR(255) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      use_custom_prompt BOOLEAN DEFAULT true,
      custom_prompt TEXT,
      multiple_choice_count INTEGER DEFAULT 10,
      multiple_choice_score NUMERIC(4,2) DEFAULT 1.0,
      fill_blank_count INTEGER DEFAULT 5,
      fill_blank_score NUMERIC(4,2) DEFAULT 1.0,
      essay_count INTEGER DEFAULT 2,
      essay_score NUMERIC(4,2) DEFAULT 2.0,
      true_false_count INTEGER DEFAULT 5,
      true_false_score NUMERIC(4,2) DEFAULT 0.5,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_sets (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      config_id INTEGER REFERENCES ai_task_configs(id) ON DELETE SET NULL,
      total_questions INTEGER DEFAULT 0,
      total_score NUMERIC(6,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      generation_config JSONB,
      ai_model_id INTEGER REFERENCES ai_models(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'DRAFT',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      test_set_id INTEGER REFERENCES test_sets(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      score NUMERIC(4,2) DEFAULT 1.0,
      options JSONB,
      correct_answer JSONB,
      explanation TEXT,
      difficulty VARCHAR(20) DEFAULT 'medium',
      source_keyword TEXT,
      source_chunk_id INTEGER REFERENCES document_chunks(id) ON DELETE SET NULL,
      type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE',
      status question_status NOT NULL DEFAULT 'DRAFT',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_test_sets_created_by ON test_sets(created_by);
    CREATE INDEX IF NOT EXISTS idx_questions_test_set ON questions(test_set_id);
  `);

  // ─── 4. FORMALIZE LECTURES & PRESENTATIONS ───
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS lectures (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(100) DEFAULT 'Khoa học máy tính',
      chapter_count INTEGER DEFAULT 1,
      total_slides INTEGER DEFAULT 0,
      cover_color VARCHAR(50) DEFAULT '#0B132B',
      file_url TEXT,
      presentation_mode VARCHAR(50) DEFAULT 'ORIGINAL',
      original_filename VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lecture_slides (
      id SERIAL PRIMARY KEY,
      lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
      slide_number INTEGER NOT NULL,
      chapter_index INTEGER DEFAULT 1,
      chapter_title VARCHAR(255) DEFAULT 'Chapter 1',
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      content TEXT NOT NULL,
      callout_type VARCHAR(50) DEFAULT 'definition',
      callout_title VARCHAR(255),
      callout_content TEXT,
      speaker_notes TEXT,
      page_number INTEGER,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_lectures_user ON lectures(user_id);
    CREATE INDEX IF NOT EXISTS idx_lecture_slides_lecture ON lecture_slides(lecture_id, slide_number);
  `);

  // ─── 5. QUIZ ATTEMPTS & ANSWERS (PERSONAL PLATFORM) ───
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      test_set_id INTEGER NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
      score NUMERIC(5,2) DEFAULT 0,
      total_score NUMERIC(5,2) DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'SUBMITTED', 'ABANDONED'
      started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
      id SERIAL PRIMARY KEY,
      attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      user_answer JSONB,
      is_correct BOOLEAN DEFAULT false,
      score_awarded NUMERIC(4,2) DEFAULT 0,
      explanation TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_test_set ON quiz_attempts(test_set_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON quiz_attempt_answers(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_question ON quiz_attempt_answers(question_id);
  `);

  // ─── 6. FOCUS, GOALS & ACTIVITIES ───
  await pgm.sql(`
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS distraction_count INTEGER DEFAULT 0;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS break_seconds INTEGER DEFAULT 0;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS notes_count INTEGER DEFAULT 0;

    CREATE TABLE IF NOT EXISTS learning_goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type VARCHAR(50) NOT NULL, -- 'study_time_minutes', 'quizzes_completed', 'flashcards_reviewed'
      target_value INTEGER NOT NULL,
      period VARCHAR(20) NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learning_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type VARCHAR(50) NOT NULL, -- 'read_doc', 'take_quiz', 'study_flashcards', 'focus_session', 'create_note'
      entity_type VARCHAR(50), -- 'document', 'test_set', 'deck', 'session'
      entity_id INTEGER,
      details JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_learning_goals_user ON learning_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_learning_activities_user ON learning_activities(user_id, created_at DESC);
  `);

  // ─── 7. COMMUNITY ECOSYSTEM ───
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS community_resources (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_type VARCHAR(50) NOT NULL, -- 'document', 'test_set', 'flashcard_deck', 'mindmap', 'note'
      resource_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      tags TEXT[] DEFAULT '{}',
      view_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      save_count INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0,
      is_public BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_likes (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_community_likes UNIQUE (resource_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS community_comments (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      parent_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_saves (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER NOT NULL REFERENCES community_resources(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_community_saves UNIQUE (resource_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_community_resources_lookup ON community_resources(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_community_resources_user ON community_resources(user_id);
    CREATE INDEX IF NOT EXISTS idx_community_resources_public ON community_resources(is_public, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_community_comments_resource ON community_comments(resource_id);
  `);

  // ─── 8. 1-ON-1 MESSAGING ───
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_conversations_pair UNIQUE (user1_id, user2_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
  `);

  // ─── 9. NOTIFICATIONS ───
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'message', 'streak', 'system'
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      link TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
  `);

  // ─── 10. SUBSCRIPTION, PLANS, PAYMENTS & DAILY USAGES ───
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL, -- 'FREE', 'PRO_MONTHLY', 'PRO_YEARLY'
      name VARCHAR(100) NOT NULL,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'VND',
      interval VARCHAR(20) NOT NULL DEFAULT 'month',
      features JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO subscription_plans (code, name, price, currency, interval, features)
    VALUES
      ('FREE', 'Gói Miễn Phí', 0, 'VND', 'month', '{"ai_questions_daily": 10, "ai_chat_daily": 20, "max_documents": 20, "document_max_pages": 30}'),
      ('PRO_MONTHLY', 'Cognito Pro (Tháng)', 99000, 'VND', 'month', '{"ai_questions_daily": -1, "ai_chat_daily": -1, "max_documents": -1, "document_max_pages": 200, "priority_ai": true}'),
      ('PRO_YEARLY', 'Cognito Pro (Năm)', 899000, 'VND', 'year', '{"ai_questions_daily": -1, "ai_chat_daily": -1, "max_documents": -1, "document_max_pages": 200, "priority_ai": true}')
    ON CONFLICT (code) DO NOTHING;

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'CANCELLED', 'EXPIRED'
      start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMPTZ NOT NULL,
      cancelled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE SET NULL,
      order_code VARCHAR(100) UNIQUE NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'VND',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
      payment_gateway VARCHAR(50) NOT NULL DEFAULT 'SANDBOX',
      gateway_transaction_id VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS user_usages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
      ai_question_gens INTEGER NOT NULL DEFAULT 0,
      ai_chat_messages INTEGER NOT NULL DEFAULT 0,
      documents_uploaded INTEGER NOT NULL DEFAULT 0,
      storage_bytes_used BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_user_daily_usage UNIQUE (user_id, usage_date)
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_code ON payment_orders(order_code);
    CREATE INDEX IF NOT EXISTS idx_user_usages_user_date ON user_usages(user_id, usage_date);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP TABLE IF EXISTS user_usages;
    DROP TABLE IF EXISTS payment_orders;
    DROP TABLE IF EXISTS subscriptions;
    DROP TABLE IF EXISTS subscription_plans;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS conversations;
    DROP TABLE IF EXISTS community_saves;
    DROP TABLE IF EXISTS community_comments;
    DROP TABLE IF EXISTS community_likes;
    DROP TABLE IF EXISTS community_resources;
    DROP TABLE IF EXISTS learning_activities;
    DROP TABLE IF EXISTS learning_goals;
    DROP TABLE IF EXISTS quiz_attempt_answers;
    DROP TABLE IF EXISTS quiz_attempts;
  `);
};
