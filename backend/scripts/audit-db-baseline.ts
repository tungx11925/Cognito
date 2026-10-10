import { db } from '../src/db/index';

async function auditDB() {
  console.log('=== 1. CHECK EXTENSION PG_STAT_STATEMENTS ===');
  try {
    const ext = await db.query("SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements'");
    if (ext.rows.length === 0) {
      console.log('pg_stat_statements is NOT installed. Attempting CREATE EXTENSION IF NOT EXISTS...');
      try {
        await db.query("CREATE EXTENSION IF NOT EXISTS pg_stat_statements");
        console.log('Successfully created pg_stat_statements extension!');
      } catch (err: any) {
        console.log('Could not create pg_stat_statements (might require shared_preload_libraries or superuser):', err.message);
      }
    } else {
      console.log('pg_stat_statements IS INSTALLED:', ext.rows);
    }
  } catch (err: any) {
    console.log('Extension check error:', err.message);
  }

  console.log('\n=== 2. PG_STAT_STATEMENTS TOP 15 SLOWEST / EXPENSIVE QUERIES ===');
  try {
    const pgs = await db.query(`
      SELECT query, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, rows
      FROM pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT 15
    `);
    console.log(`Found ${pgs.rows.length} statements:`);
    for (const r of pgs.rows) {
      console.log(`[Calls: ${r.calls}, TotalTime: ${Number(r.total_exec_time).toFixed(2)}ms, MeanTime: ${Number(r.mean_exec_time).toFixed(2)}ms, Rows: ${r.rows}]`);
      console.log(`Query: ${r.query.replace(/\s+/g, ' ').substring(0, 150)}...\n`);
    }
  } catch (err: any) {
    console.log('pg_stat_statements view query error:', err.message);
  }

  console.log('\n=== 3. UNUSED INDEXES (idx_scan = 0) ===');
  try {
    const unused = await db.query(`
      SELECT 
        schemaname, 
        relname AS table_name, 
        indexrelname AS index_name, 
        idx_scan, 
        idx_tup_read, 
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      ORDER BY relname, indexrelname
    `);
    console.log(`Total unused indexes count: ${unused.rows.length}`);
    for (const r of unused.rows) {
      console.log(`- ${r.table_name}.${r.index_name} (idx_scan: 0)`);
    }
  } catch (err: any) {
    console.log('Unused index query error:', err.message);
  }

  console.log('\n=== 4. TABLES STATS & SEQ SCANS ===');
  try {
    const tbls = await db.query(`
      SELECT 
        relname AS table_name, 
        seq_scan, 
        seq_tup_read, 
        idx_scan, 
        idx_tup_fetch, 
        n_live_tup
      FROM pg_stat_user_tables
      ORDER BY seq_scan DESC
    `);
    console.log(`Table statistics (${tbls.rows.length} tables):`);
    console.table(tbls.rows.slice(0, 20));
  } catch (err: any) {
    console.log('Table scan query error:', err.message);
  }

  console.log('\n=== 5. EXPLAIN (ANALYZE, BUFFERS) FOR TOP 10 TYPICAL HEAVY QUERIES ===');
  const heavyQueries = [
    { name: '1. Documents list with author', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT d.*, u.name as author_name FROM documents d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC LIMIT 20' },
    { name: '2. Flashcards deck cards count', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT fd.*, COUNT(f.id) as card_count FROM flashcard_decks fd LEFT JOIN flashcards f ON fd.id = f.deck_id GROUP BY fd.id ORDER BY fd.updated_at DESC LIMIT 20' },
    { name: '3. Community documents with user & likes', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT cd.*, u.name as author_name FROM community_documents cd LEFT JOIN users u ON cd.user_id = u.id ORDER BY cd.likes_count DESC, cd.created_at DESC LIMIT 20' },
    { name: '4. User notifications unread', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM notifications WHERE is_read = false ORDER BY created_at DESC LIMIT 50' },
    { name: '5. User activities recent', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM learning_activities ORDER BY activity_date DESC LIMIT 30' },
    { name: '6. User messages direct thread', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM messages ORDER BY created_at DESC LIMIT 50' },
    { name: '7. Test sets with question count', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT ts.*, COUNT(q.id) as question_count FROM test_sets ts LEFT JOIN questions q ON ts.id = q.test_set_id GROUP BY ts.id ORDER BY ts.created_at DESC LIMIT 20' },
    { name: '8. Notes recent', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM notes ORDER BY updated_at DESC LIMIT 20' },
    { name: '9. Focus sessions active/history', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM focus_sessions ORDER BY start_time DESC LIMIT 20' },
    { name: '10. User profile by email/id', sql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT id, email, name, role, streak, is_premium FROM users LIMIT 1' },
  ];

  for (const q of heavyQueries) {
    console.log(`\n--- Query: ${q.name} ---`);
    try {
      const res = await db.query(q.sql);
      for (const row of res.rows) {
        console.log(row['QUERY PLAN']);
      }
    } catch (err: any) {
      console.log(`Error running explain for ${q.name}:`, err.message);
    }
  }

  await db.end();
}

auditDB().catch(console.error);
