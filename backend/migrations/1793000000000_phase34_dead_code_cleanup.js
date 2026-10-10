/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Phase 34 - Schema Cleanup: Drop verified dead tables and legacy columns
  pgm.sql(`
    -- 1. Drop dead tables (0 rows in prod/dev, no active business logic, legacy marketplace/queue artifacts)
    DROP TABLE IF EXISTS purchased_resources CASCADE;
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS generation_jobs CASCADE;
    DROP TABLE IF EXISTS ai_usage CASCADE;

    -- 2. Drop dead column from users table (legacy prototype wallet balance)
    ALTER TABLE users DROP COLUMN IF EXISTS wallet_balance;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    -- Recreate wallet_balance column
    ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance INTEGER DEFAULT 0;

    -- Recreate generation_jobs table
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      job_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      result_deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE SET NULL,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Recreate transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Recreate purchased_resources table
    CREATE TABLE IF NOT EXISTS purchased_resources (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
