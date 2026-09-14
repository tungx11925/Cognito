/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.sql(`
    -- Fix 'transactions' foreign keys
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
    ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_document_id_fkey;
    ALTER TABLE transactions ADD CONSTRAINT transactions_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE RESTRICT;

    -- Fix 'purchased_resources' foreign keys
    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_user_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_document_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE RESTRICT;
    
    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_deck_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE RESTRICT;
  `);
};

exports.down = pgm => {
  pgm.sql(`
    -- Revert 'transactions' foreign keys back to CASCADE
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
    ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_document_id_fkey;
    ALTER TABLE transactions ADD CONSTRAINT transactions_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

    -- Revert 'purchased_resources' foreign keys back to CASCADE
    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_user_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_document_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    
    ALTER TABLE purchased_resources DROP CONSTRAINT IF EXISTS purchased_resources_deck_id_fkey;
    ALTER TABLE purchased_resources ADD CONSTRAINT purchased_resources_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE;
  `);
};
