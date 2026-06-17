import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Run bootstrap database schema updates
db.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_study_date TIMESTAMP DEFAULT NULL;
  
  CREATE TABLE IF NOT EXISTS user_daily_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    active_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE UNIQUE INDEX IF NOT EXISTS unique_user_daily_activity ON user_daily_activity(user_id, activity_date);
`).then(() => {
  console.log('Database schema bootstrap completed successfully.');
}).catch((err) => {
  console.error('Database schema bootstrap error:', err);
});

