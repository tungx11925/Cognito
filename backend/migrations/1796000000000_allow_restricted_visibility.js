exports.up = (pgm) => {
  pgm.sql(`
    -- Allow 'restricted' (link-only) along with 'private' and 'public'
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_visibility;
    ALTER TABLE documents ADD CONSTRAINT chk_documents_visibility CHECK (visibility IN ('private', 'restricted', 'public'));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    UPDATE documents SET visibility = 'private' WHERE visibility = 'restricted';
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_visibility;
    ALTER TABLE documents ADD CONSTRAINT chk_documents_visibility CHECK (visibility IN ('private', 'public'));
  `);
};
