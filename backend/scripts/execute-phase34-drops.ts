import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('=== VERIFYING & FINALIZING SCHEMA DROPS ===');
  await client.query(`
    DROP TABLE IF EXISTS purchased_resources CASCADE;
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS generation_jobs CASCADE;
    DROP TABLE IF EXISTS ai_usage CASCADE;
    ALTER TABLE users DROP COLUMN IF EXISTS wallet_balance;
  `);

  const tablesCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('purchased_resources', 'transactions', 'generation_jobs', 'ai_usage')
  `);

  const colCheck = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
      AND column_name = 'wallet_balance'
  `);

  console.log('Dead tables remaining:', tablesCheck.rows.map((r: any) => r.table_name));
  console.log('Dead column users.wallet_balance remaining:', colCheck.rows.map((r: any) => r.column_name));

  if (tablesCheck.rows.length === 0 && colCheck.rows.length === 0) {
    console.log('✅ All 4 dead tables and 1 dead column successfully dropped!');
  } else {
    console.error('❌ Some items remain!');
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
