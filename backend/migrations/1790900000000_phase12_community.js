/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  // 1. Enhance community_resources with Category, Reshare & Attribution support
  await pgm.sql(`
    ALTER TABLE community_resources 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Chung',
      ADD COLUMN IF NOT EXISTS is_reshare BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS original_resource_id INTEGER REFERENCES community_resources(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS original_author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS reshare_note TEXT;

    -- Indices for high performance feed ordering and filtering
    CREATE INDEX IF NOT EXISTS idx_community_resources_category ON community_resources(category);
    CREATE INDEX IF NOT EXISTS idx_community_resources_feed_recent ON community_resources(is_public, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_community_resources_feed_popular ON community_resources(is_public, like_count DESC, save_count DESC, view_count DESC);
    CREATE INDEX IF NOT EXISTS idx_community_resources_original ON community_resources(original_resource_id);
    CREATE INDEX IF NOT EXISTS idx_community_saves_user ON community_saves(user_id, created_at DESC);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_community_saves_user;
    DROP INDEX IF EXISTS idx_community_resources_original;
    DROP INDEX IF EXISTS idx_community_resources_feed_popular;
    DROP INDEX IF EXISTS idx_community_resources_feed_recent;
    DROP INDEX IF EXISTS idx_community_resources_category;

    ALTER TABLE community_resources
      DROP COLUMN IF EXISTS reshare_note,
      DROP COLUMN IF EXISTS original_author_id,
      DROP COLUMN IF EXISTS original_resource_id,
      DROP COLUMN IF EXISTS is_reshare,
      DROP COLUMN IF EXISTS category;
  `);
};
