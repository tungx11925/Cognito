import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspect() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('=== TABLES SCHEMA INSPECTION ===');
  
  // ai_usage
  const aiUsageCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ai_usage'
  `);
  console.log('ai_usage columns:', aiUsageCols.rows);
  const aiUsageData = await client.query('SELECT * FROM ai_usage LIMIT 5');
  console.log('ai_usage rows:', aiUsageData.rows);

  // generation_jobs
  const genCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'generation_jobs'
  `);
  console.log('generation_jobs columns:', genCols.rows);
  const genData = await client.query('SELECT * FROM generation_jobs LIMIT 5');
  console.log('generation_jobs rows:', genData.rows);

  // Foreign keys pointing to purchased_resources, transactions, generation_jobs, ai_usage
  const fkRes = await client.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND (ccu.table_name IN ('purchased_resources', 'transactions', 'generation_jobs', 'ai_usage')
           OR tc.table_name IN ('purchased_resources', 'transactions', 'generation_jobs', 'ai_usage'));
  `);
  console.log('Foreign key relations:', fkRes.rows);

  await client.end();
}

inspect();
