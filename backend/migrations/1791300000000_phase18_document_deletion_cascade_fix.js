/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.sql(`
    -- 1. notes: change ON DELETE CASCADE to ON DELETE SET NULL
    ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_document_id_fkey;
    ALTER TABLE notes ADD CONSTRAINT notes_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

    -- 2. mindmaps: change ON DELETE CASCADE to ON DELETE SET NULL
    ALTER TABLE mindmaps DROP CONSTRAINT IF EXISTS mindmaps_document_id_fkey;
    ALTER TABLE mindmaps ADD CONSTRAINT mindmaps_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

    -- 3. study_sessions: change ON DELETE CASCADE to ON DELETE SET NULL
    ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_document_id_fkey;
    ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

    -- 4. flashcards: change ON DELETE CASCADE to ON DELETE SET NULL
    ALTER TABLE flashcards DROP CONSTRAINT IF EXISTS flashcards_document_id_fkey;
    ALTER TABLE flashcards ADD CONSTRAINT flashcards_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

    -- 5. transactions: change ON DELETE RESTRICT to ON DELETE SET NULL
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_document_id_fkey;
    ALTER TABLE transactions ADD CONSTRAINT transactions_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

    -- 6. purchased_resources: change ON DELETE RESTRICT to ON DELETE SET NULL
    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_document_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_document_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE RESTRICT;

    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_document_id_fkey;
    ALTER TABLE transactions ADD CONSTRAINT transactions_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE RESTRICT;

    ALTER TABLE flashcards DROP CONSTRAINT IF EXISTS flashcards_document_id_fkey;
    ALTER TABLE flashcards ADD CONSTRAINT flashcards_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

    ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_document_id_fkey;
    ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

    ALTER TABLE mindmaps DROP CONSTRAINT IF EXISTS mindmaps_document_id_fkey;
    ALTER TABLE mindmaps ADD CONSTRAINT mindmaps_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

    ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_document_id_fkey;
    ALTER TABLE notes ADD CONSTRAINT notes_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
  `);
};
