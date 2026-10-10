/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- 1. Add is_test column to core tables
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE community_resources ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE test_sets ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE mindmaps ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

    -- Indexes for high-performance public filtering
    CREATE INDEX IF NOT EXISTS idx_users_is_test ON users(is_test);
    CREATE INDEX IF NOT EXISTS idx_documents_is_test ON documents(is_test);
    CREATE INDEX IF NOT EXISTS idx_community_resources_is_test ON community_resources(is_test);

    -- 2. Document sharing and community publication flags
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_community_published BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS save_count INTEGER NOT NULL DEFAULT 0;

    -- Open Educational Resource (OER) metadata columns
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_open_license BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS license VARCHAR(100);
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_author VARCHAR(255);
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_url TEXT;

    -- 3. Document Likes table
    CREATE TABLE IF NOT EXISTS document_likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, document_id)
    );
    CREATE INDEX IF NOT EXISTS idx_document_likes_doc ON document_likes(document_id);
    CREATE INDEX IF NOT EXISTS idx_document_likes_user ON document_likes(user_id);

    -- 4. Document Saves (Bookmarks) table
    CREATE TABLE IF NOT EXISTS document_saves (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, document_id)
    );
    CREATE INDEX IF NOT EXISTS idx_document_saves_doc ON document_saves(document_id);
    CREATE INDEX IF NOT EXISTS idx_document_saves_user ON document_saves(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS document_saves CASCADE;
    DROP TABLE IF EXISTS document_likes CASCADE;

    ALTER TABLE documents DROP COLUMN IF EXISTS source_url;
    ALTER TABLE documents DROP COLUMN IF EXISTS original_author;
    ALTER TABLE documents DROP COLUMN IF EXISTS license;
    ALTER TABLE documents DROP COLUMN IF EXISTS is_open_license;
    ALTER TABLE documents DROP COLUMN IF EXISTS save_count;
    ALTER TABLE documents DROP COLUMN IF EXISTS like_count;
    ALTER TABLE documents DROP COLUMN IF EXISTS is_community_published;

    DROP INDEX IF EXISTS idx_community_resources_is_test;
    DROP INDEX IF EXISTS idx_documents_is_test;
    DROP INDEX IF EXISTS idx_users_is_test;

    ALTER TABLE lectures DROP COLUMN IF EXISTS is_test;
    ALTER TABLE notes DROP COLUMN IF EXISTS is_test;
    ALTER TABLE mindmaps DROP COLUMN IF EXISTS is_test;
    ALTER TABLE flashcard_decks DROP COLUMN IF EXISTS is_test;
    ALTER TABLE questions DROP COLUMN IF EXISTS is_test;
    ALTER TABLE test_sets DROP COLUMN IF EXISTS is_test;
    ALTER TABLE community_resources DROP COLUMN IF EXISTS is_test;
    ALTER TABLE documents DROP COLUMN IF EXISTS is_test;
    ALTER TABLE users DROP COLUMN IF EXISTS is_test;
  `);
};
