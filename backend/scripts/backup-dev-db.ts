import { db } from '../src/db';
import fs from 'fs';
import path from 'path';

async function backupDevDatabase() {
  console.log('=== STARTING DATABASE BACKUP BEFORE PHASE 40 CLEANUP ===');
  
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `backup_dev_cognito_${timestamp}.json`);

  const client = await db.connect();
  try {
    const tablesToBackup = [
      'users',
      'documents',
      'document_chunks',
      'shared_links',
      'community_resources',
      'community_likes',
      'community_saves',
      'community_comments',
      'test_sets',
      'questions',
      'flashcard_decks',
      'flashcards',
      'notifications'
    ];

    const backupData: Record<string, any[]> = {};

    for (const table of tablesToBackup) {
      try {
        const res = await client.query(`SELECT * FROM ${table}`);
        backupData[table] = res.rows;
        console.log(`- Backed up table '${table}': ${res.rows.length} rows`);
      } catch (err: any) {
        console.warn(`! Table '${table}' could not be backed up: ${err.message}`);
      }
    }

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\n✅ Backup successfully saved to: ${backupFilePath}`);
    console.log(`Backup file size: ${(fs.statSync(backupFilePath).size / (1024 * 1024)).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await db.end();
  }
}

backupDevDatabase();
