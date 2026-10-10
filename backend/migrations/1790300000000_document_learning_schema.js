/**
 * Migration: 1790300000000_document_learning_schema.js
 * Phase 4: Document Learning Schema Standards
 * - Ensure 'updated_at' exists with TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
 * - Ensure 'is_community_published' exists with BOOLEAN DEFAULT false
 * - Add CHECK constraint on visibility IN ('private', 'public')
 * - Add trigger or function to update 'updated_at' on row update
 */

exports.up = (pgm) => {
  pgm.sql(`
    -- 1. Add updated_at column to documents if not exists
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'updated_at'
      ) THEN 
        ALTER TABLE documents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        UPDATE documents SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP);
      END IF;
    END $$;

    -- 2. Add is_community_published column to documents if not exists
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'is_community_published'
      ) THEN 
        ALTER TABLE documents ADD COLUMN is_community_published BOOLEAN DEFAULT false;
      END IF;
    END $$;

    -- 3. Ensure visibility defaults to 'private' and normalize existing data
    UPDATE documents SET visibility = 'private' WHERE visibility IS NULL OR visibility NOT IN ('private', 'public');
    ALTER TABLE documents ALTER COLUMN visibility SET DEFAULT 'private';

    -- 4. Add check constraint on visibility
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_visibility;
    ALTER TABLE documents ADD CONSTRAINT chk_documents_visibility CHECK (visibility IN ('private', 'public'));

    -- 5. Trigger to automatically update updated_at on document changes
    CREATE OR REPLACE FUNCTION update_documents_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
    CREATE TRIGGER trg_documents_updated_at
      BEFORE UPDATE ON documents
      FOR EACH ROW
      EXECUTE FUNCTION update_documents_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
    DROP FUNCTION IF EXISTS update_documents_updated_at_column();
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_visibility;
    ALTER TABLE documents DROP COLUMN IF EXISTS is_community_published;
    ALTER TABLE documents DROP COLUMN IF EXISTS updated_at;
  `);
};
