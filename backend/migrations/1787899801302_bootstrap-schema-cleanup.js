/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.sql(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_study_date TIMESTAMP DEFAULT NULL;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_setting VARCHAR(20) NOT NULL DEFAULT 'public';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
  
  CREATE TABLE IF NOT EXISTS user_daily_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    active_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE UNIQUE INDEX IF NOT EXISTS unique_user_daily_activity ON user_daily_activity(user_id, activity_date);

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_daily_tasks' AND column_name='task_date') THEN
      ALTER TABLE user_daily_tasks RENAME COLUMN task_date TO activity_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_daily_tasks' AND column_name='is_completed') THEN
      ALTER TABLE user_daily_tasks RENAME COLUMN is_completed TO completed;
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS user_daily_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(255) NOT NULL,
    current_value INTEGER DEFAULT 0,
    target_value INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  ALTER TABLE user_daily_tasks ADD COLUMN IF NOT EXISTS is_notified BOOLEAN DEFAULT false;
  CREATE UNIQUE INDEX IF NOT EXISTS unique_user_daily_tasks ON user_daily_tasks(user_id, activity_date, task_type);
  
  CREATE TABLE IF NOT EXISTS user_study_dates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS unique_user_study_dates ON user_study_dates(user_id, study_date);
  
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private';
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

  ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private';
  ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

  CREATE TABLE IF NOT EXISTS shared_links (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    access_type VARCHAR(50) DEFAULT 'viewer',
    expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchased_resources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    next_review_at TIMESTAMP,
    interval INTEGER DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  UPDATE users SET role = 'admin' WHERE email = 'admin';

  -- Performance indexes for frequently queried columns
  CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON flashcard_decks(user_id);
  CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
  CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_document_id ON notes(document_id);
  CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date ON user_daily_activity(user_id, activity_date);
  CREATE INDEX IF NOT EXISTS idx_user_study_dates_user_id ON user_study_dates(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_user_date ON user_daily_tasks(user_id, activity_date);
  CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_at) WHERE next_review_at IS NOT NULL;
  `);
};

exports.down = pgm => {
  // Reverting all IF NOT EXISTS is not safe, keep empty
};
