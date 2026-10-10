import { db } from '../src/db';

async function auditDb() {
  console.log('=== DATABASE INTEGRITY AUDIT ===\n');

  // 1. List all tables
  const tablesRes = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  const tables = tablesRes.rows.map(r => r.table_name);
  console.log('Total tables in public schema:', tables.length);

  // 2. Check Foreign Keys
  const fkRes = await db.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.log('Total foreign key constraints:', fkRes.rows.length);

  // 3. Check for Foreign Key columns that LACK an Index
  const missingFkIndexRes = await db.query(`
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = tc.table_name
          AND a.attname = kcu.column_name
      )
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.log('\n--- Foreign Key Columns Lacking an Index ---');
  if (missingFkIndexRes.rows.length === 0) {
    console.log('None! All FK columns have indexes.');
  } else {
    console.log(`Found ${missingFkIndexRes.rows.length} FK columns without indexes:`);
    missingFkIndexRes.rows.forEach(r => {
      console.log(`  - ${r.table_name}.${r.column_name} -> ${r.referenced_table}`);
    });
  }

  // 4. Unique Constraints
  const uniqueRes = await db.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.log(`\n--- Unique Constraints (${uniqueRes.rows.length}) ---`);
  uniqueRes.rows.forEach(r => {
    console.log(`  - ${r.table_name}.${r.column_name} (${r.constraint_name})`);
  });

  // 5. Check for Orphan Records across all FK relationships
  console.log('\n--- Orphan Records Scan ---');
  let totalOrphans = 0;
  for (const fk of fkRes.rows) {
    try {
      const res = await db.query(`
        SELECT COUNT(*)::int as count 
        FROM "${fk.table_name}" t 
        LEFT JOIN "${fk.foreign_table_name}" p ON t."${fk.column_name}" = p."${fk.foreign_column_name}" 
        WHERE t."${fk.column_name}" IS NOT NULL AND p."${fk.foreign_column_name}" IS NULL
      `);
      const count = res.rows[0]?.count || 0;
      if (count > 0) {
        totalOrphans += count;
        console.log(`  ⚠️ ORPHAN DETECTED: ${fk.table_name}.${fk.column_name} has ${count} dangling rows referencing ${fk.foreign_table_name}!`);
      }
    } catch (err: any) {
      console.log(`  [ERR] ${fk.table_name}.${fk.column_name}: ${err.message}`);
    }
  }
  if (totalOrphans === 0) {
    console.log('  ✓ Zero orphan records found across all FK relationships!');
  }

  // 5b. Check for Polymorphic Orphan Records (Relationships without formal foreign keys)
  console.log('\n--- Polymorphic Orphan Records Scan (Non-FK) ---');
  let polymorphicOrphans = 0;

  // 1) community_resources -> documents
  const crDocs = await db.query(`
    SELECT cr.id, cr.resource_id 
    FROM community_resources cr
    LEFT JOIN documents d ON cr.resource_id = d.id
    WHERE cr.resource_type = 'document' AND d.id IS NULL
  `);
  if (crDocs.rows.length > 0) {
    polymorphicOrphans += crDocs.rows.length;
    console.log(`  ⚠️ ORPHAN DETECTED: community_resources (document): ${crDocs.rows.length} dangling rows!`);
  } else {
    console.log('  ✓ community_resources (document): 0 orphan records');
  }

  // 2) community_resources -> test_sets
  const crTests = await db.query(`
    SELECT cr.id, cr.resource_id 
    FROM community_resources cr
    LEFT JOIN test_sets ts ON cr.resource_id = ts.id
    WHERE cr.resource_type = 'test_set' AND ts.id IS NULL
  `);
  if (crTests.rows.length > 0) {
    polymorphicOrphans += crTests.rows.length;
    console.log(`  ⚠️ ORPHAN DETECTED: community_resources (test_set): ${crTests.rows.length} dangling rows!`);
  } else {
    console.log('  ✓ community_resources (test_set): 0 orphan records');
  }

  // 3) community_resources -> flashcard_decks
  const crDecks = await db.query(`
    SELECT cr.id, cr.resource_id 
    FROM community_resources cr
    LEFT JOIN flashcard_decks fd ON cr.resource_id = fd.id
    WHERE cr.resource_type = 'flashcard_deck' AND fd.id IS NULL
  `);
  if (crDecks.rows.length > 0) {
    polymorphicOrphans += crDecks.rows.length;
    console.log(`  ⚠️ ORPHAN DETECTED: community_resources (flashcard_deck): ${crDecks.rows.length} dangling rows!`);
  } else {
    console.log('  ✓ community_resources (flashcard_deck): 0 orphan records');
  }

  // 4) content_reports -> targets
  const crReports = await db.query(`
    SELECT r.id, r.target_type, r.target_id
    FROM content_reports r
    WHERE (r.target_type = 'document' AND NOT EXISTS (SELECT 1 FROM documents WHERE id = r.target_id))
       OR (r.target_type = 'user' AND NOT EXISTS (SELECT 1 FROM users WHERE id = r.target_id))
       OR (r.target_type = 'resource' AND NOT EXISTS (SELECT 1 FROM community_resources WHERE id = r.target_id))
       OR (r.target_type = 'comment' AND NOT EXISTS (SELECT 1 FROM community_comments WHERE id = r.target_id))
  `);
  if (crReports.rows.length > 0) {
    polymorphicOrphans += crReports.rows.length;
    console.log(`  ⚠️ ORPHAN DETECTED: content_reports: ${crReports.rows.length} dangling rows!`);
  } else {
    console.log('  ✓ content_reports: 0 orphan records');
  }

  // 5) moderation_logs -> targets (Historical audit log note)
  const modLogs = await db.query(`
    SELECT m.id, m.action, m.target_type, m.target_id
    FROM moderation_logs m
    WHERE (m.target_type = 'user' AND NOT EXISTS (SELECT 1 FROM users WHERE id = m.target_id))
       OR (m.target_type = 'resource' AND NOT EXISTS (SELECT 1 FROM community_resources WHERE id = m.target_id))
       OR (m.target_type = 'document' AND NOT EXISTS (SELECT 1 FROM documents WHERE id = m.target_id))
  `);
  if (modLogs.rows.length > 0) {
    console.log(`  ℹ️ moderation_logs audit trail: ${modLogs.rows.length} records preserve historical actions on deleted targets (e.g. DELETE_DOCUMENT / REMOVE).`);
  } else {
    console.log('  ✓ moderation_logs: 0 historical deleted references');
  }

  // 6. Check for Potential Duplicate Records in Key Tables
  console.log('\n--- Duplicate Records Scan ---');
  const duplicateChecks = [
    { table: 'users', col: 'email', title: 'duplicate user emails' },
    { table: 'subscriptions', group: 'user_id', where: "status = 'ACTIVE'", title: 'multiple active subscriptions per user' },
    { table: 'user_usages', group: 'user_id, usage_date', title: 'duplicate daily usage rows per user & date' },
    { table: 'learning_activities', col: 'idempotency_key', where: 'idempotency_key IS NOT NULL', title: 'duplicate idempotency keys in learning_activities' },
    { table: 'community_saves', group: 'user_id, resource_id', title: 'duplicate saves for same user & resource' },
    { table: 'community_likes', group: 'user_id, resource_id', title: 'duplicate likes for same user & resource' },
  ];

  for (const dup of duplicateChecks) {
    try {
      let query = '';
      if (dup.col) {
        query = `SELECT "${dup.col}", COUNT(*) as cnt FROM "${dup.table}" ${dup.where ? `WHERE ${dup.where}` : ''} GROUP BY "${dup.col}" HAVING COUNT(*) > 1`;
      } else if (dup.group) {
        query = `SELECT ${dup.group}, COUNT(*) as cnt FROM "${dup.table}" ${dup.where ? `WHERE ${dup.where}` : ''} GROUP BY ${dup.group} HAVING COUNT(*) > 1`;
      }
      const res = await db.query(query);
      if (res.rows.length > 0) {
        console.log(`  ⚠️ DUPLICATES DETECTED: ${dup.title}: ${res.rows.length} duplicate groups found!`);
      } else {
        console.log(`  ✓ ${dup.title}: 0 duplicates`);
      }
    } catch (err: any) {
      console.log(`  [SKIP] ${dup.title}: ${err.message}`);
    }
  }

  // 7. Check Nullable on critical columns
  console.log('\n--- Nullable Audit on Critical Columns ---');
  const criticalNullChecks = [
    { table: 'users', col: 'email' },
    { table: 'users', col: 'password_hash' },
    { table: 'documents', col: 'user_id' },
    { table: 'documents', col: 'title' },
    { table: 'test_sets', col: 'created_by' },
    { table: 'questions', col: 'test_set_id' },
    { table: 'subscriptions', col: 'user_id' },
    { table: 'subscriptions', col: 'status' },
    { table: 'orders', col: 'user_id' },
    { table: 'orders', col: 'order_code' },
    { table: 'orders', col: 'amount' },
    { table: 'learning_activities', col: 'user_id' },
  ];
  for (const c of criticalNullChecks) {
    const colRes = await db.query(`
      SELECT is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    `, [c.table, c.col]);
    if (colRes.rows.length > 0) {
      const isNullable = colRes.rows[0].is_nullable === 'YES';
      if (isNullable) {
        console.log(`  ⚠️ Column ${c.table}.${c.col} is NULLABLE! Should it be NOT NULL?`);
      } else {
        console.log(`  ✓ ${c.table}.${c.col}: NOT NULL`);
      }
    }
  }

  process.exit(0);
}

auditDb().catch(e => { console.error(e); process.exit(1); });
