/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async pgm => {
  await pgm.sql(`
    -- 1. Updates for notes table (Phase 9 Study System)
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      title VARCHAR(255),
      content TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE notes ALTER COLUMN document_id DROP NOT NULL;
    ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    CREATE INDEX IF NOT EXISTS idx_notes_user_doc ON notes(user_id, document_id);
    CREATE INDEX IF NOT EXISTS idx_notes_user_created ON notes(user_id, created_at DESC);

    -- 2. Updates for mindmaps table (Phase 9 Study System)
    CREATE TABLE IF NOT EXISTS mindmaps (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      title VARCHAR(255) DEFAULT 'Sơ đồ tư duy',
      mermaid_code TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE mindmaps ALTER COLUMN document_id DROP NOT NULL;
    ALTER TABLE mindmaps ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Sơ đồ tư duy';
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_document_user_mindmap') THEN
        ALTER TABLE mindmaps ADD CONSTRAINT unique_document_user_mindmap UNIQUE (document_id, user_id);
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_mindmaps_user_doc ON mindmaps(user_id, document_id);
    -- 3. Updates for flashcards table
    ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
  `);
};

exports.down = async pgm => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_notes_user_doc;
    DROP INDEX IF EXISTS idx_notes_user_created;
    DROP INDEX IF EXISTS idx_mindmaps_user_doc;
    DROP INDEX IF EXISTS idx_mindmaps_user_created;
  `);
};
