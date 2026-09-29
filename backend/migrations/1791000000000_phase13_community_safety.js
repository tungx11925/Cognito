/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  // 1. User Blocks Table
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_blocks (
      id SERIAL PRIMARY KEY,
      blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_user_blocks_pair UNIQUE (blocker_id, blocked_id),
      CONSTRAINT ck_user_blocks_self CHECK (blocker_id != blocked_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks (blocker_id);
    CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks (blocked_id);
  `);

  // 2. Content Reports Table
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS content_reports (
      id SERIAL PRIMARY KEY,
      reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type VARCHAR(20) NOT NULL, -- 'resource', 'comment', 'user'
      target_id INTEGER NOT NULL,
      reason VARCHAR(50) NOT NULL, -- 'SPAM', 'INAPPROPRIATE', 'COPYRIGHT_VIOLATION', 'HARASSMENT', 'FALSE_INFORMATION', 'OTHER'
      details TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'
      action_taken VARCHAR(20), -- 'KEEP', 'HIDE', 'REMOVE', 'WARN', 'SUSPEND'
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      moderation_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_content_reports_target ON content_reports (target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports (status);
    CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports (reporter_id);

    -- Unique pending report per user per target to stop report spamming
    CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_content_report 
      ON content_reports (reporter_id, target_type, target_id) 
      WHERE status = 'PENDING';
  `);

  // 3. Moderation History Logs Table
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS moderation_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(20) NOT NULL, -- 'KEEP', 'HIDE', 'REMOVE', 'WARN', 'SUSPEND'
      target_type VARCHAR(20) NOT NULL,
      target_id INTEGER NOT NULL,
      report_id INTEGER REFERENCES content_reports(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs (target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON moderation_logs (admin_id);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs (created_at DESC);
  `);

  // 4. Enhance Users & Community tables with safety attributes
  await pgm.sql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
      ADD COLUMN IF NOT EXISTS warning_count INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE community_resources
      ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;

    CREATE INDEX IF NOT EXISTS idx_community_resources_safety 
      ON community_resources (is_public, is_hidden);

    ALTER TABLE community_comments
      ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    ALTER TABLE community_comments
      DROP COLUMN IF EXISTS report_count,
      DROP COLUMN IF EXISTS is_hidden;

    DROP INDEX IF EXISTS idx_community_resources_safety;

    ALTER TABLE community_resources
      DROP COLUMN IF EXISTS report_count,
      DROP COLUMN IF EXISTS is_hidden;

    ALTER TABLE users
      DROP COLUMN IF EXISTS warning_count,
      DROP COLUMN IF EXISTS suspension_reason,
      DROP COLUMN IF EXISTS is_suspended,
      DROP COLUMN IF EXISTS status;

    DROP TABLE IF EXISTS moderation_logs;
    DROP TABLE IF EXISTS content_reports;
    DROP TABLE IF EXISTS user_blocks;
  `);
};
