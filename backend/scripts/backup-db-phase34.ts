import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createBackup() {
  console.log('=== CREATING SQL BACKUP BEFORE PHASE 34 DROPS ===');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup_before_phase34_${timestamp}.sql`);

  let sqlDump = `-- BACKUP TAKEN BEFORE PHASE 34 DEAD CODE DROPS\n-- Timestamp: ${new Date().toISOString()}\n\n`;

  // Backup purchased_resources
  try {
    const res = await client.query('SELECT * FROM purchased_resources');
    sqlDump += `-- Table: purchased_resources (${res.rows.length} rows)\n`;
    sqlDump += `CREATE TABLE IF NOT EXISTS backup_purchased_resources AS SELECT * FROM purchased_resources;\n\n`;
    console.log(`Backed up purchased_resources (${res.rows.length} rows)`);
  } catch (err: any) {
    console.log('Table purchased_resources could not be queried:', err.message);
  }

  // Backup transactions
  try {
    const res = await client.query('SELECT * FROM transactions');
    sqlDump += `-- Table: transactions (${res.rows.length} rows)\n`;
    sqlDump += `CREATE TABLE IF NOT EXISTS backup_transactions AS SELECT * FROM transactions;\n\n`;
    console.log(`Backed up transactions (${res.rows.length} rows)`);
  } catch (err: any) {
    console.log('Table transactions could not be queried:', err.message);
  }

  // Backup generation_jobs
  try {
    const res = await client.query('SELECT * FROM generation_jobs');
    sqlDump += `-- Table: generation_jobs (${res.rows.length} rows)\n`;
    sqlDump += `CREATE TABLE IF NOT EXISTS backup_generation_jobs AS SELECT * FROM generation_jobs;\n\n`;
    console.log(`Backed up generation_jobs (${res.rows.length} rows)`);
  } catch (err: any) {
    console.log('Table generation_jobs could not be queried:', err.message);
  }

  // Backup ai_usage
  try {
    const res = await client.query('SELECT * FROM ai_usage');
    sqlDump += `-- Table: ai_usage (${res.rows.length} rows)\n`;
    sqlDump += `CREATE TABLE IF NOT EXISTS backup_ai_usage AS SELECT * FROM ai_usage;\n\n`;
    console.log(`Backed up ai_usage (${res.rows.length} rows)`);
  } catch (err: any) {
    console.log('Table ai_usage could not be queried:', err.message);
  }

  // Backup wallet_balance column
  try {
    const res = await client.query('SELECT id, email, wallet_balance FROM users WHERE wallet_balance IS NOT NULL AND wallet_balance > 0');
    sqlDump += `-- Column: users.wallet_balance (${res.rows.length} non-zero users)\n`;
    sqlDump += `CREATE TABLE IF NOT EXISTS backup_users_wallet AS SELECT id, email, wallet_balance FROM users;\n\n`;
    console.log(`Backed up users.wallet_balance (${res.rows.length} non-zero rows)`);
  } catch (err: any) {
    console.log('Column users.wallet_balance could not be queried:', err.message);
  }

  fs.writeFileSync(backupFile, sqlDump);
  console.log(`\n✅ Backup successfully generated: ${backupFile}`);

  await client.end();
}

createBackup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
