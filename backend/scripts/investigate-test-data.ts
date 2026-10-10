import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/db';

async function investigate() {
  console.log('=== INVESTIGATING TEST DATA IN CURRENT DATABASE ===\n');

  // 1. Thống kê users
  const totalUsers = await db.query('SELECT COUNT(*)::int AS c FROM users');
  const suspectedTestUsers = await db.query(`
    SELECT COUNT(*)::int AS c FROM users 
    WHERE email LIKE '%@%.test'
       OR email LIKE '%test%'
       OR email LIKE '%example.com%'
       OR email LIKE '%demo%'
       OR name ILIKE '%test%'
       OR name ILIKE '%student%'
       OR name ILIKE '%spammer%'
       OR name ILIKE '%người dùng%'
       OR name ILIKE '%user %'
       OR name ~* '^[a-z]+_[0-9]+'
  `);

  console.log(`Bảng 'users':`);
  console.log(`  - Tổng số bản ghi: ${totalUsers.rows[0].c}`);
  console.log(`  - Số user nghi vấn do test: ${suspectedTestUsers.rows[0].c}`);

  // Lấy danh sách user THẬT (không phải do test sinh ra)
  const realUsers = await db.query(`
    SELECT id, name, email, role, created_at FROM users 
    WHERE NOT (
      email LIKE '%@%.test'
      OR email LIKE '%@test.com'
      OR email LIKE '%test%'
      OR email LIKE '%example.com%'
      OR email LIKE '%demo%'
      OR email LIKE '%temp%'
      OR name ILIKE '%test%'
      OR name ILIKE '%student%'
      OR name ILIKE '%spammer%'
      OR name ILIKE '%người dùng%'
      OR name ILIKE '%user %'
      OR name ~* '^[a-z0-9]+_[0-9]+'
    )
    ORDER BY id ASC
  `);
  console.log(`\n  ⭐ Danh sách user THẬT (dữ liệu thật, KHÔNG phải test): ${realUsers.rows.length} users`);
  realUsers.rows.forEach(u => console.log(`    [ID: ${u.id}] "${u.name}" (${u.email}) - Role: ${u.role}`));

  // Phân loại test users theo tiền tố / test suite nguồn
  const prefixStats = await db.query(`
    SELECT 
      CASE 
        WHEN email LIKE 'p30_%' OR name LIKE 'P30 %' THEN 'Phase 30 (E2E Business Flows)'
        WHEN email LIKE 'phase8_%' THEN 'Phase 8 (Quiz & Grading)'
        WHEN email LIKE 'phase9_%' THEN 'Phase 9 (Flashcards & Notes)'
        WHEN email LIKE 'phase6_%' THEN 'Phase 6 (Question Generator)'
        WHEN email LIKE 'p18_%' THEN 'Phase 18 (Admin System)'
        WHEN email LIKE 'admin_p34_%' THEN 'Phase 34 (Schema Cleanup)'
        WHEN email LIKE '%ratelimit_%' THEN 'Phase 38B (Rate Limit Proxy)'
        WHEN email LIKE '%benchmark_%' THEN 'Benchmark Tests'
        WHEN email LIKE 'entitlement_%' THEN 'Phase 20 (Entitlement)'
        WHEN email LIKE 'p11_%' THEN 'Phase 11 (Focus Mode)'
        WHEN email LIKE 'p12_%' THEN 'Phase 12 (Community)'
        WHEN email LIKE 'p13_%' THEN 'Phase 13 (Safety & Moderation)'
        WHEN email LIKE 'p14_%' THEN 'Phase 14 (User Profile)'
        WHEN email LIKE 'p15_%' THEN 'Phase 15 (Direct Messaging)'
        WHEN email LIKE 'p16_%' THEN 'Phase 16 (Notifications)'
        WHEN email LIKE 'p17_%' THEN 'Phase 17 (Payment Subscriptions)'
        WHEN email LIKE 'p22_%' THEN 'Phase 22 (Search)'
        WHEN email LIKE 'p26_%' THEN 'Phase 26 (Security)'
        WHEN email LIKE 'p27_%' THEN 'Phase 27 (AI Cost Control)'
        WHEN email LIKE 'p28_%' THEN 'Phase 28 (Data Integrity)'
        WHEN email LIKE 'p3_%' OR email LIKE 'phase3_%' THEN 'Phase 3 (Auth System)'
        WHEN email LIKE 'p4_%' OR email LIKE 'phase4_%' THEN 'Phase 4 (Document Pipeline)'
        WHEN email LIKE 'p5_%' OR email LIKE 'phase5_%' THEN 'Phase 5 (AI Chat)'
        WHEN email LIKE '%student%' OR email LIKE '%tester%' THEN 'Older Student/Tester Scripts'
        ELSE 'Other Test / Demo Scripts'
      END AS suite_source,
      COUNT(*)::int AS count
    FROM users
    WHERE email LIKE '%@%.test'
       OR email LIKE '%@test.com'
       OR email LIKE '%test%'
       OR email LIKE '%example.com%'
       OR email LIKE '%demo%'
       OR name ILIKE '%test%'
       OR name ILIKE '%student%'
       OR name ILIKE '%người dùng%'
    GROUP BY 1
    ORDER BY count DESC
  `);
  console.log(`\n  📊 Phân loại User Test theo Test Suite tạo ra:`);
  prefixStats.rows.forEach(r => console.log(`    - ${r.suite_source.padEnd(35)} : ${r.count} users`));

  // 2. Thống kê documents
  const totalDocs = await db.query('SELECT COUNT(*)::int AS c FROM documents');
  const suspectedTestDocs = await db.query(`
    SELECT COUNT(*)::int AS c FROM documents
    WHERE title ILIKE '%test%'
       OR title ILIKE '%benchmark%'
       OR title ILIKE '%flow%'
       OR title ILIKE '%demo%'
       OR title ILIKE '%sample%'
       OR title ILIKE '%tài liệu test%'
       OR title ILIKE '%tài liệu ôn tập benchmark%'
       OR user_id IN (
         SELECT id FROM users 
         WHERE email LIKE '%@%.test' OR email LIKE '%test%'
       )
  `);
  console.log(`\nBảng 'documents':`);
  console.log(`  - Tổng số bản ghi: ${totalDocs.rows[0].c}`);
  console.log(`  - Số documents nghi vấn test: ${suspectedTestDocs.rows[0].c}`);

  const sampleDocs = await db.query(`
    SELECT id, title, user_id, visibility, file_type, created_at FROM documents
    WHERE title ILIKE '%test%' OR title ILIKE '%benchmark%' OR title ILIKE '%flow%' OR user_id IN (SELECT id FROM users WHERE email LIKE '%@%.test' OR email LIKE '%test%')
    ORDER BY id DESC LIMIT 10
  `);
  console.log('  - Mẫu 10 documents test:');
  sampleDocs.rows.forEach(d => console.log(`    [ID: ${d.id}] "${d.title}" (User: ${d.user_id}, Vis: ${d.visibility})`));

  // 3. Thống kê các bảng cộng đồng / marketplace / shares / document_chunks
  const totalChunks = await db.query('SELECT COUNT(*)::int AS c FROM document_chunks');
  console.log(`\nBảng 'document_chunks': Tổng số = ${totalChunks.rows[0].c}`);

  // Kiểm tra bảng cộng đồng có tên là gì
  const tables = await db.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('\nCác bảng trong DB:');
  console.log(tables.rows.map(r => r.table_name).join(', '));

  // Kiểm tra bảng shares / community / marketplace
  const checkTable = async (tName: string) => {
    try {
      const res = await db.query(`SELECT COUNT(*)::int AS c FROM ${tName}`);
      console.log(`Bảng '${tName}': ${res.rows[0].c} bản ghi`);
    } catch {
      // Table doesn't exist
    }
  };

  await checkTable('shared_documents');
  await checkTable('community_shares');
  await checkTable('community_posts');
  await checkTable('community_interactions');
  await checkTable('marketplace_resources');
  await checkTable('flashcard_decks');
  await checkTable('study_sessions');
  await checkTable('test_sets');
  await checkTable('questions');

  process.exit(0);
}

investigate().catch(err => {
  console.error(err);
  process.exit(1);
});
