import { db } from '../src/db';

async function runScaledBenchmark() {
  console.log('========================================================================');
  console.log('       COGNITO SCALED DATA PERFORMANCE & BENCHMARK AUDIT                ');
  console.log('========================================================================\n');

  // 1. Initial State Check
  const countRes = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM documents) as docs,
      (SELECT COUNT(*) FROM community_resources) as resources,
      (SELECT COUNT(*) FROM notifications) as notifs,
      (SELECT COUNT(*) FROM messages) as msgs,
      (SELECT COUNT(*) FROM users) as users;
  `);
  console.log('📊 BASELINE DATABASE ROW COUNTS (Before Scale):');
  console.table([countRes.rows[0]]);

  // 2. Setup Test Seed User
  const ts = Date.now();
  const testUserRes = await db.query(`
    INSERT INTO users (email, name, password, role)
    VALUES ($1, $2, $3, 'user')
    RETURNING id;
  `, [`scale_bench_${ts}@test.local`, `Bench User ${ts}`, 'Secret123!']);
  const userId = testUserRes.rows[0].id;

  const convRes = await db.query(`
    INSERT INTO conversations (last_message_text, last_message_at)
    VALUES ('Benchmark conversation', NOW())
    RETURNING id;
  `);
  const convId = convRes.rows[0].id;

  try {
    console.log('\n⏳ Seeding temporary scaled datasets (3k docs, 5k resources, 10k notifs, 5k messages)...');

    // Seed 3,000 documents for this user
    await db.query(`
      INSERT INTO documents (user_id, title, description, file_type, file_size, visibility, is_community_published, created_at)
      SELECT 
        $1,
        'Tài liệu ôn thi số ' || g,
        'Nội dung tài liệu đại cương môn học chương ' || (g % 50),
        'pdf',
        1024 * (100 + (g % 500)),
        CASE WHEN g % 2 = 0 THEN 'public' ELSE 'private' END,
        CASE WHEN g % 3 = 0 THEN true ELSE false END,
        CURRENT_TIMESTAMP - (g || ' minutes')::interval
      FROM generate_series(1, 3000) AS g;
    `, [userId]);
    console.log('  ✓ Seeded 3,000 documents');

    // Seed 5,000 community resources
    await db.query(`
      INSERT INTO community_resources (user_id, resource_type, resource_id, title, description, is_public, is_hidden, like_count, save_count, view_count, created_at)
      SELECT 
        $1,
        'DOCUMENT',
        1,
        'Bài giảng cộng đồng môn Toán ' || g,
        'Tài liệu ôn thi THPT QG đề số ' || g,
        true,
        CASE WHEN g % 200 = 0 THEN true ELSE false END,
        (g % 100),
        (g % 50),
        (g * 3),
        CURRENT_TIMESTAMP - (g || ' minutes')::interval
      FROM generate_series(1, 5000) AS g;
    `, [userId]);
    console.log('  ✓ Seeded 5,000 community resources');

    // Seed 10,000 notifications
    await db.query(`
      INSERT INTO notifications (user_id, type, title, content, is_read, created_at)
      SELECT 
        $1,
        'SYSTEM',
        'Thông báo hệ thống số ' || g,
        'Chi tiết nội dung cập nhật bài học chương ' || g,
        CASE WHEN g % 3 = 0 THEN true ELSE false END,
        CURRENT_TIMESTAMP - (g || ' minutes')::interval
      FROM generate_series(1, 10000) AS g;
    `, [userId]);
    console.log('  ✓ Seeded 10,000 notifications');

    // Seed 5,000 messages in conversation
    await db.query(`
      INSERT INTO messages (conversation_id, sender_id, content, created_at)
      SELECT 
        $1,
        $2,
        'Tin nhắn trao đổi học tập số ' || g,
        CURRENT_TIMESTAMP - (g || ' seconds')::interval
      FROM generate_series(1, 5000) AS g;
    `, [convId, userId]);
    console.log('  ✓ Seeded 5,000 messages');

    // Verify row counts after seeding
    const scaledCountRes = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM documents) as docs,
        (SELECT COUNT(*) FROM community_resources) as resources,
        (SELECT COUNT(*) FROM notifications) as notifs,
        (SELECT COUNT(*) FROM messages) as msgs;
    `);
    console.log('\n📊 DATABASE ROW COUNTS DURING BENCHMARK:');
    console.table([scaledCountRes.rows[0]]);

    console.log('\n========================================================================');
    console.log('  1. DOCUMENTS QUERY PERFORMANCE (3,000+ rows for single user)          ');
    console.log('========================================================================');
    const docExplain = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, title, file_type, file_size, visibility, created_at 
      FROM documents 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50;
    `, [userId]);
    console.log(docExplain.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('\n========================================================================');
    console.log('  2. COMMUNITY FEED (5,000+ resources) - PAGE 1 (LIMIT 20)              ');
    console.log('========================================================================');
    const feedPage1 = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT cr.id, cr.title, cr.like_count, cr.created_at, u.name as author_name
      FROM community_resources cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.is_hidden = false
      ORDER BY cr.created_at DESC
      LIMIT 20;
    `);
    console.log(feedPage1.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('\n========================================================================');
    console.log('  3. COMMUNITY FEED - DEEP OFFSET (PAGE 100: LIMIT 20 OFFSET 2000)       ');
    console.log('========================================================================');
    const feedDeepOffset = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT cr.id, cr.title, cr.like_count, cr.created_at, u.name as author_name
      FROM community_resources cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.is_hidden = false
      ORDER BY cr.created_at DESC
      LIMIT 20 OFFSET 2000;
    `);
    console.log(feedDeepOffset.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('\n========================================================================');
    console.log('  4. NOTIFICATIONS (10,000+ rows) - PAGE 1 (LIMIT 20)                   ');
    console.log('========================================================================');
    const notifPage1 = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, title, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20;
    `, [userId]);
    console.log(notifPage1.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('\n========================================================================');
    console.log('  5. NOTIFICATIONS - DEEP OFFSET (PAGE 250: LIMIT 20 OFFSET 5000)        ');
    console.log('========================================================================');
    const notifDeepOffset = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, title, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20 OFFSET 5000;
    `, [userId]);
    console.log(notifDeepOffset.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('\n========================================================================');
    console.log('  6. MESSAGES - CURSOR PAGINATION vs OFFSET PAGINATION                   ');
    console.log('========================================================================');
    // First, find a mid-point cursor
    const midMsg = await db.query('SELECT id FROM messages WHERE conversation_id = $1 ORDER BY id DESC LIMIT 1 OFFSET 2500', [convId]);
    const cursorId = midMsg.rows[0]?.id || 2500;

    console.log('--- [6A] Cursor Keyset Pagination (WHERE id < $cursor LIMIT 50):');
    const msgCursor = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, content, created_at
      FROM messages
      WHERE conversation_id = $1 AND id < $2
      ORDER BY id DESC
      LIMIT 50;
    `, [convId, cursorId]);
    console.log(msgCursor.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('\n--- [6B] Offset Pagination (OFFSET 2500 LIMIT 50):');
    const msgOffset = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, content, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY id DESC
      LIMIT 50 OFFSET 2500;
    `, [convId]);
    console.log(msgOffset.rows.map(r => r['QUERY PLAN']).join('\n'));

  } finally {
    console.log('\n========================================================================');
    console.log('🧹 CLEANING UP BENCHMARK DATA...');
    console.log('========================================================================');
    await db.query('DELETE FROM messages WHERE conversation_id = $1', [convId]);
    await db.query('DELETE FROM conversations WHERE id = $1', [convId]);
    await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM community_resources WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM documents WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('  ✓ Cleaned up all 23,000+ benchmark records.');

    const finalCount = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM documents) as docs,
        (SELECT COUNT(*) FROM community_resources) as resources,
        (SELECT COUNT(*) FROM notifications) as notifs,
        (SELECT COUNT(*) FROM messages) as msgs;
    `);
    console.log('📊 DATABASE ROW COUNTS (After Cleanup Restoration):');
    console.table([finalCount.rows[0]]);
  }
}

runScaledBenchmark().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
