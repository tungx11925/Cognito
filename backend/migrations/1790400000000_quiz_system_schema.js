/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async pgm => {
  // Đảm bảo bảng quiz_attempts có đầy đủ các cột phục vụ cá nhân hóa và chấm điểm
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
      status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
      started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2) DEFAULT 0;
    ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0;
    ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
    ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'IN_PROGRESS';
    ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
    ALTER TABLE quiz_attempts ALTER COLUMN title DROP NOT NULL;
    ALTER TABLE quiz_attempts ALTER COLUMN title SET DEFAULT '';

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

    ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS user_answer JSONB;
    ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT false;
    ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS score_awarded NUMERIC(4,2) DEFAULT 0;
    ALTER TABLE quiz_attempt_answers ADD COLUMN IF NOT EXISTS explanation TEXT;

    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_test_set_id ON quiz_attempts(test_set_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt_id ON quiz_attempt_answers(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_question_id ON quiz_attempt_answers(question_id);
  `);
};

exports.down = async pgm => {
  await pgm.sql(`
    DROP TABLE IF EXISTS quiz_attempt_answers CASCADE;
    DROP TABLE IF EXISTS quiz_attempts CASCADE;
  `);
};
