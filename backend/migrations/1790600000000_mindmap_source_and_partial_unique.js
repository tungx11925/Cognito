/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async pgm => {
  await pgm.sql(`
    -- 1. Add source column to mindmaps table (default 'manual')
    ALTER TABLE mindmaps ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual';

    -- 2. Drop the restrictive unconditional unique constraint if it exists
    ALTER TABLE mindmaps DROP CONSTRAINT IF EXISTS unique_document_user_mindmap;

    -- 3. Create partial unique index only for AI-generated mindmaps
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mindmaps_doc_user_ai ON mindmaps(document_id, user_id) WHERE source = 'ai';
  `);
};

exports.down = async pgm => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_mindmaps_doc_user_ai;
    ALTER TABLE mindmaps DROP COLUMN IF EXISTS source;
  `);
};
