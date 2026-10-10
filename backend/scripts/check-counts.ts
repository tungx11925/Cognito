import { db } from '../src/db/index';

async function check() {
  const users = await db.query('SELECT count(*)::int as c FROM users');
  const testUsers = await db.query('SELECT count(*)::int as c FROM users WHERE is_test = true');
  const realUsers = await db.query('SELECT count(*)::int as c FROM users WHERE is_test = false');
  const docs = await db.query('SELECT count(*)::int as c FROM documents');
  const cr = await db.query('SELECT count(*)::int as c FROM community_resources');
  const ts = await db.query('SELECT count(*)::int as c FROM test_sets');
  const likes = await db.query('SELECT count(*)::int as c FROM document_likes');
  const saves = await db.query('SELECT count(*)::int as c FROM document_saves');
  
  console.log('=== DATABASE RECORD COUNTS ===');
  console.log(`Database URL: ${process.env.DATABASE_URL || 'from env'}`);
  console.log(`Users total: ${users.rows[0].c} (Real: ${realUsers.rows[0].c}, Test: ${testUsers.rows[0].c})`);
  console.log(`Documents: ${docs.rows[0].c}`);
  console.log(`Community resources: ${cr.rows[0].c}`);
  console.log(`Test sets: ${ts.rows[0].c}`);
  console.log(`Document likes: ${likes.rows[0].c}`);
  console.log(`Document saves: ${saves.rows[0].c}`);
  console.log('==============================');
  await db.end();
}

check().catch(console.error);
