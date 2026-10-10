/* eslint-disable camelcase */

exports.up = async (pgm) => {
  // 1. Extensions for Vietnamese / trigram search
  await pgm.sql(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
  await pgm.sql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  // 2. Immutable wrapper for unaccent to allow GIN indexing
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION immutable_unaccent(text)
      RETURNS text AS
    $func$
      SELECT public.unaccent('public.unaccent', $1)
    $func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;
  `);

  // 3. GIN Trigram indexes on documents (title and description)
  await pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_documents_search_title_trgm
      ON documents USING gin (LOWER(immutable_unaccent(title)) gin_trgm_ops);
      
    CREATE INDEX IF NOT EXISTS idx_documents_search_desc_trgm
      ON documents USING gin (LOWER(immutable_unaccent(COALESCE(description, ''))) gin_trgm_ops);
  `);

  // 4. GIN Trigram indexes on community_resources (title and description)
  await pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_community_resources_search_title_trgm
      ON community_resources USING gin (LOWER(immutable_unaccent(title)) gin_trgm_ops);
      
    CREATE INDEX IF NOT EXISTS idx_community_resources_search_desc_trgm
      ON community_resources USING gin (LOWER(immutable_unaccent(COALESCE(description, ''))) gin_trgm_ops);
  `);

  // 5. GIN Trigram index on test_sets
  await pgm.sql(`
    DO $$ BEGIN
      IF to_regclass('public.test_sets') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_test_sets_search_name_trgm
          ON test_sets USING gin (LOWER(immutable_unaccent(name)) gin_trgm_ops);
      END IF;
    END $$;
  `);

  // 6. GIN Trigram index on users (public profiles)
  await pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_users_search_name_trgm
      ON users USING gin (LOWER(immutable_unaccent(name)) gin_trgm_ops);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_documents_search_title_trgm;
    DROP INDEX IF EXISTS idx_documents_search_desc_trgm;
    DROP INDEX IF EXISTS idx_community_resources_search_title_trgm;
    DROP INDEX IF EXISTS idx_community_resources_search_desc_trgm;
    DROP INDEX IF EXISTS idx_test_sets_search_name_trgm;
    DROP INDEX IF EXISTS idx_users_search_name_trgm;
    DROP FUNCTION IF EXISTS immutable_unaccent(text);
  `);
};
