import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isCloudOrProduction =
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.DATABASE_URL?.includes('supabase.co')) ||
  Boolean(process.env.DATABASE_URL?.includes('pooler.supabase.com'));

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudOrProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

/**
 * Utility function to execute a block of code within a database transaction.
 * @param callback The function to execute inside the transaction. It receives the `PoolClient`.
 */
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
