/* eslint-disable camelcase */

exports.shorthands = undefined;

/**
 * PHASE 11 MIGRATION: Focus Mode Foundation
 * 
 * 1. Enhances study_sessions:
 *    - Makes document_id nullable (DROP NOT NULL) so focus sessions can run standalone or with a quiz
 *    - Adds quiz_id (INTEGER REFERENCES test_sets(id) ON DELETE SET NULL)
 *    - Adds learning_goal_id (INTEGER REFERENCES learning_goals(id) ON DELETE SET NULL)
 *    - Adds target_duration_seconds (INTEGER DEFAULT 1500)
 *    - Adds actual_duration_seconds (INTEGER DEFAULT 0)
 *    - Adds status (VARCHAR(20) DEFAULT 'IN_PROGRESS') -- COMPLETED, INTERRUPTED, CANCELLED, IN_PROGRESS
 *    - Adds ended_at (TIMESTAMP)
 *    - Adds focus_score (NUMERIC(5, 2) DEFAULT 100.00)
 * 2. Creates focus_distraction_events:
 *    - Records browser distraction events (TAB_SWITCH, PAGE_BLUR, PAGE_HIDDEN, IDLE, RETURNED)
 */
exports.up = async (pgm) => {
  await pgm.sql(`
    -- 1. Cập nhật bảng study_sessions
    ALTER TABLE study_sessions ALTER COLUMN document_id DROP NOT NULL;
    
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS quiz_id INTEGER REFERENCES test_sets(id) ON DELETE SET NULL;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS learning_goal_id INTEGER REFERENCES learning_goals(id) ON DELETE SET NULL;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS target_duration_seconds INTEGER DEFAULT 1500;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS actual_duration_seconds INTEGER DEFAULT 0;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'IN_PROGRESS';
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS focus_score NUMERIC(5, 2) DEFAULT 100.00;
    ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS interrupt_token VARCHAR(128);

    CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status ON study_sessions(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON study_sessions(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_interrupt_token ON study_sessions(id, interrupt_token);

    -- 2. Tạo bảng focus_distraction_events
    CREATE TABLE IF NOT EXISTS focus_distraction_events (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL,
      occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      duration_seconds INTEGER DEFAULT 0,
      details JSONB DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_focus_distraction_events_session ON focus_distraction_events(session_id, occurred_at);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP TABLE IF EXISTS focus_distraction_events CASCADE;
    ALTER TABLE study_sessions DROP COLUMN IF EXISTS quiz_id;
    ALTER TABLE study_sessions DROP COLUMN IF EXISTS learning_goal_id;
    ALTER TABLE study_sessions DROP COLUMN IF EXISTS target_duration_seconds;
    ALTER TABLE study_sessions DROP COLUMN IF EXISTS actual_duration_seconds;
    ALTER TABLE study_sessions DROP COLUMN IF EXISTS status;
    ALTER TABLE study_sessions DROP COLUMN IF EXISTS ended_at;
    ALTER TABLE study_sessions DROP COLUMN IF EXISTS focus_score;
  `);
};
