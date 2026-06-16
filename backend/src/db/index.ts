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
`).then(() => {
  console.log('Database schema bootstrap completed successfully.');
}).catch((err) => {
  console.error('Database schema bootstrap error:', err);
});

