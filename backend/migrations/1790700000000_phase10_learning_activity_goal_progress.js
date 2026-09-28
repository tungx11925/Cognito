/* eslint-disable camelcase */

exports.shorthands = undefined;

/**
 * PHASE 10 MIGRATION: Learning Activities, Learning Goals & Study Streak Foundation
 *
 * 1. Enhances learning_activities:
 *    - Adds duration_seconds (INTEGER DEFAULT 0)
 *    - Adds idempotency_key (VARCHAR(255))
 *    - Adds subject (VARCHAR(100))
 *    - Creates partial unique index on (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
 * 2. Enhances learning_goals:
 *    - Adds title (VARCHAR(255) DEFAULT 'Mục tiêu học tập')
 *    - Adds subject (VARCHAR(100))
 * 3. Backfills legacy data into learning_activities:
 *    - Submitted quiz attempts
 *    - Document study sessions
 *    - Legacy user study dates
 */
exports.up = async (pgm) => {
  await pgm.sql(`
    -- 1. Cập nhật bảng learning_activities
    ALTER TABLE learning_activities ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
    ALTER TABLE learning_activities ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
    ALTER TABLE learning_activities ADD COLUMN IF NOT EXISTS subject VARCHAR(100);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_activities_idempotency 
      ON learning_activities(user_id, idempotency_key) 
      WHERE idempotency_key IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_learning_activities_user_date 
      ON learning_activities(user_id, created_at DESC);

    -- 2. Cập nhật bảng learning_goals
    ALTER TABLE learning_goals ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Mục tiêu học tập';
    ALTER TABLE learning_goals ADD COLUMN IF NOT EXISTS subject VARCHAR(100);

    -- 3. Backfill dữ liệu từ quiz_attempts
    INSERT INTO learning_activities (
      user_id, activity_type, entity_type, entity_id, duration_seconds, details, idempotency_key, created_at
    )
    SELECT
      qa.user_id,
      'take_quiz',
      'test_set',
      qa.test_set_id,
      COALESCE(qa.duration_seconds, qa.time_spent_seconds, 0),
      jsonb_build_object(
        'attemptId', qa.id,
        'score', qa.score,
        'totalScore', qa.total_score,
        'correctCount', qa.correct_count,
        'totalQuestions', qa.total_questions,
        'source', 'backfill'
      ),
      'quiz_attempt:' || qa.id,
      COALESCE(qa.completed_at, qa.created_at, CURRENT_TIMESTAMP)
    FROM quiz_attempts qa
    WHERE (qa.status = 'SUBMITTED' OR qa.completed_at IS NOT NULL)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- 4. Backfill dữ liệu từ study_sessions
    INSERT INTO learning_activities (
      user_id, activity_type, entity_type, entity_id, duration_seconds, details, idempotency_key, created_at
    )
    SELECT
      ss.user_id,
      'read_doc',
      'document',
      ss.document_id,
      COALESCE(ss.duration_seconds, 0),
      jsonb_build_object(
        'sessionId', ss.id,
        'source', 'backfill'
      ),
      'study_session:' || ss.id,
      COALESCE(ss.started_at, CURRENT_TIMESTAMP)
    FROM study_sessions ss
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- 5. Backfill dữ liệu từ user_study_dates
    INSERT INTO learning_activities (
      user_id, activity_type, entity_type, entity_id, duration_seconds, details, idempotency_key, created_at
    )
    SELECT
      usd.user_id,
      'daily_checkin',
      'study_date',
      usd.id,
      300,
      jsonb_build_object('study_date', usd.study_date, 'source', 'backfill'),
      'study_date:' || usd.user_id || ':' || usd.study_date,
      (usd.study_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
    FROM user_study_dates usd
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_learning_activities_idempotency;
    DROP INDEX IF EXISTS idx_learning_activities_user_date;
    ALTER TABLE learning_activities DROP COLUMN IF EXISTS duration_seconds;
    ALTER TABLE learning_activities DROP COLUMN IF EXISTS idempotency_key;
    ALTER TABLE learning_activities DROP COLUMN IF EXISTS subject;
    ALTER TABLE learning_goals DROP COLUMN IF EXISTS title;
    ALTER TABLE learning_goals DROP COLUMN IF EXISTS subject;
  `);
};
