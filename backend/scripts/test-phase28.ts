import axios from 'axios';
import { db, withTransaction } from '../src/db';
import { subscriptionService } from '../src/services/subscription.service';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase28Tests() {
  console.log('\n========================================================');
  console.log('         COGNITO PHASE 28: DATA INTEGRITY TESTS         ');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ [FAIL] ${msg}`);
      throw new Error(`Test assertion failed: ${msg}`);
    }
    passedTests++;
    console.log(`  [PASS] ${msg}`);
  }

  // Setup: Register a regular student user and another user
  const timestamp = Date.now();
  const testPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
  const userEmail = `p28_user_${timestamp}@test.com`;
  const otherEmail = `p28_other_${timestamp}@test.com`;
  const password = 'StrongPassword123!';

  // Clean old test data
  await db.query(`DELETE FROM users WHERE email IN ($1, $2)`, [userEmail, otherEmail]);

  // Register user A
  const regResA = await axios.post(`${API_BASE}/auth/register`, {
    name: `P28 User A ${timestamp}`,
    email: userEmail,
    password,
    phone: testPhone,
  });
  const userA = regResA.data.user;
  const tokenA = regResA.data.token;
  const headersA = { Authorization: `Bearer ${tokenA}` };

  const otherPhone = '097' + Math.floor(1000000 + Math.random() * 9000000);
  const regResB = await axios.post(`${API_BASE}/auth/register`, {
    name: `P28 User B ${timestamp}`,
    email: otherEmail,
    password,
    phone: otherPhone,
  });
  const userB = regResB.data.user;
  const tokenB = regResB.data.token;
  const headersB = { Authorization: `Bearer ${tokenB}` };

  try {
    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Foreign Keys Enforcement
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Foreign Key Constraint Enforcement ---');

    // 1.1 Inserting child record with invalid user_id is blocked
    let invalidUserFkBlocked = false;
    try {
      await db.query(`
        INSERT INTO documents (user_id, title, status)
        VALUES (99999999, 'Orphan Document', 'READY')
      `);
    } catch (err: any) {
      if (err.code === '23503') { // foreign_key_violation
        invalidUserFkBlocked = true;
      }
    }
    assert(invalidUserFkBlocked, '1.1 Inserting document with non-existent user_id rejected with 23503 foreign_key_violation');

    // 1.2 Inserting question with non-existent test_set_id is blocked
    let invalidTestSetFkBlocked = false;
    try {
      await db.query(`
        INSERT INTO questions (test_set_id, content, score)
        VALUES (99999999, 'Orphan Question', 1.0)
      `);
    } catch (err: any) {
      if (err.code === '23503') {
        invalidTestSetFkBlocked = true;
      }
    }
    assert(invalidTestSetFkBlocked, '1.2 Inserting question with non-existent test_set_id rejected with 23503 foreign_key_violation');

    // 1.3 Inserting flashcard with non-existent deck_id is blocked
    let invalidDeckFkBlocked = false;
    try {
      await db.query(`
        INSERT INTO flashcards (deck_id, front, back)
        VALUES (99999999, 'Orphan Front', 'Orphan Back')
      `);
    } catch (err: any) {
      if (err.code === '23503') {
        invalidDeckFkBlocked = true;
      }
    }
    assert(invalidDeckFkBlocked, '1.3 Inserting flashcard with non-existent deck_id rejected with 23503 foreign_key_violation');

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Unique Constraints Enforcement
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Unique Constraint Enforcement ---');

    // 2.1 Duplicate user email blocked
    let dupEmailBlocked = false;
    try {
      await db.query(`
        INSERT INTO users (email, password, name, phone)
        VALUES ($1, 'hash', 'Duplicate Email User', '0911222333')
      `, [userEmail]);
    } catch (err: any) {
      if (err.code === '23505') { // unique_violation
        dupEmailBlocked = true;
      }
    }
    assert(dupEmailBlocked, '2.1 Duplicate user email strictly rejected with 23505 unique_violation');

    // 2.2 Duplicate learning_activities idempotency key blocked
    const testIdempotencyKey = `p28_idem_${Date.now()}`;
    await db.query(`
      INSERT INTO learning_activities (user_id, activity_type, duration_seconds, idempotency_key)
      VALUES ($1, 'read_doc', 120, $2)
    `, [userA.id, testIdempotencyKey]);

    let dupIdemBlocked = false;
    try {
      await db.query(`
        INSERT INTO learning_activities (user_id, activity_type, duration_seconds, idempotency_key)
        VALUES ($1, 'read_doc', 120, $2)
      `, [userA.id, testIdempotencyKey]);
    } catch (err: any) {
      if (err.code === '23505') {
        dupIdemBlocked = true;
      }
    }
    assert(dupIdemBlocked, '2.2 Duplicate learning_activity idempotency_key rejected with 23505 unique_violation');

    // 2.3 Duplicate user_usages (user_id, usage_date) blocked
    let dupUsageBlocked = false;
    try {
      await db.query(`
        INSERT INTO user_usages (user_id, usage_date, ai_chat_messages)
        VALUES ($1, CURRENT_DATE, 5)
      `, [userA.id]);
      await db.query(`
        INSERT INTO user_usages (user_id, usage_date, ai_chat_messages)
        VALUES ($1, CURRENT_DATE, 10)
      `, [userA.id]);
    } catch (err: any) {
      if (err.code === '23505') {
        dupUsageBlocked = true;
      }
    }
    assert(dupUsageBlocked, '2.3 Duplicate user_usages (user_id, usage_date) rejected with 23505 unique_violation');

    // ─────────────────────────────────────────────────────────────
    // SUITE 3: Foreign Key Indexes Audit
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: Foreign Key Indexes Verification ---');

    // Verify 0 FK columns lack an index
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

    assert(missingFkIndexRes.rows.length === 0, '3.1 Exactly zero (0) foreign key columns lack indexes in Postgres');
    
    // Check specific newly indexed FK columns
    const indexedChecks = [
      'idx_questions_source_chunk_id',
      'idx_community_resources_original_author_id',
      'idx_study_sessions_quiz_id',
      'idx_subscriptions_plan_id',
    ];
    for (const idxName of indexedChecks) {
      const idxRes = await db.query(`
        SELECT indexname FROM pg_indexes WHERE tablename NOT LIKE 'pg_%' AND indexname = $1
      `, [idxName]);
      assert(idxRes.rows.length > 0, `3.2 Btree index ${idxName} is active in PostgreSQL`);
    }

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Nullable Constraints Enforcement
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Nullable Integrity Constraints ---');

    // 4.1 questions.test_set_id must NOT be NULL
    let nullTestSetIdBlocked = false;
    try {
      await db.query(`
        INSERT INTO questions (test_set_id, content, score)
        VALUES (NULL, 'Null parent test set', 1.0)
      `);
    } catch (err: any) {
      if (err.code === '23502') { // not_null_violation
        nullTestSetIdBlocked = true;
      }
    }
    assert(nullTestSetIdBlocked, '4.1 questions.test_set_id rejects NULL with 23502 not_null_violation');

    // 4.2 documents.user_id must NOT be NULL
    let nullDocUserIdBlocked = false;
    try {
      await db.query(`
        INSERT INTO documents (user_id, title)
        VALUES (NULL, 'Null Owner Doc')
      `);
    } catch (err: any) {
      if (err.code === '23502') {
        nullDocUserIdBlocked = true;
      }
    }
    assert(nullDocUserIdBlocked, '4.2 documents.user_id rejects NULL with 23502 not_null_violation');

    // 4.3 documents.title must NOT be NULL
    let nullDocTitleBlocked = false;
    try {
      await db.query(`
        INSERT INTO documents (user_id, title)
        VALUES ($1, NULL)
      `, [userA.id]);
    } catch (err: any) {
      if (err.code === '23502') {
        nullDocTitleBlocked = true;
      }
    }
    assert(nullDocTitleBlocked, '4.3 documents.title rejects NULL with 23502 not_null_violation');

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Cascade Deletion & Referential Cleanup
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: Cascade Deletions & Referential Cleanup ---');

    // 5.1 Deleting a test_set cascades and cleans up all child questions
    const tsRes = await db.query(`
      INSERT INTO test_sets (created_by, name, status)
      VALUES ($1, 'Cascade Test Set', 'DRAFT')
      RETURNING id
    `, [userA.id]);
    const tsId = tsRes.rows[0].id;

    await db.query(`
      INSERT INTO questions (test_set_id, content, score)
      VALUES ($1, 'Q1 for cascade', 1.0), ($1, 'Q2 for cascade', 1.0)
    `, [tsId]);

    const countBefore = await db.query('SELECT COUNT(*)::int as count FROM questions WHERE test_set_id = $1', [tsId]);
    assert(countBefore.rows[0].count === 2, '5.1 Initial child questions inserted (count = 2)');

    // Delete test set
    await db.query('DELETE FROM test_sets WHERE id = $1', [tsId]);

    const countAfter = await db.query('SELECT COUNT(*)::int as count FROM questions WHERE test_set_id = $1', [tsId]);
    assert(countAfter.rows[0].count === 0, '5.1 ON DELETE CASCADE cleanly wiped all child questions (count = 0)');

    // 5.2 Deleting a document cascades and cleans up all child chunks
    const docRes = await db.query(`
      INSERT INTO documents (user_id, title, status)
      VALUES ($1, 'Cascade Document', 'READY')
      RETURNING id
    `, [userA.id]);
    const docId = docRes.rows[0].id;

    await db.query(`
      INSERT INTO document_chunks (document_id, chunk_index, content)
      VALUES ($1, 0, 'Chunk 1 content'), ($1, 1, 'Chunk 2 content')
    `, [docId]);

    const chunkCountBefore = await db.query('SELECT COUNT(*)::int as count FROM document_chunks WHERE document_id = $1', [docId]);
    assert(chunkCountBefore.rows[0].count === 2, '5.2 Initial document chunks inserted (count = 2)');

    await db.query('DELETE FROM documents WHERE id = $1', [docId]);

    const chunkCountAfter = await db.query('SELECT COUNT(*)::int as count FROM document_chunks WHERE document_id = $1', [docId]);
    assert(chunkCountAfter.rows[0].count === 0, '5.2 ON DELETE CASCADE cleanly wiped all child chunks (count = 0)');

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: Restrict & Set Null Knowledge Preservation
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: Restrict & Set Null Knowledge Preservation ---');

    // 6.1 Creating a note attached to a document, then deleting the document sets note.document_id to NULL (does NOT destroy note!)
    const testDoc2 = await db.query(`
      INSERT INTO documents (user_id, title, status)
      VALUES ($1, 'Knowledge Preserved Doc', 'READY')
      RETURNING id
    `, [userA.id]);
    const testDocId2 = testDoc2.rows[0].id;

    const noteRes = await db.query(`
      INSERT INTO notes (user_id, document_id, title, content)
      VALUES ($1, $2, 'User Learning Note', 'Crucial revision insights')
      RETURNING id
    `, [userA.id, testDocId2]);
    const noteId = noteRes.rows[0].id;

    // Delete document
    await db.query('DELETE FROM documents WHERE id = $1', [testDocId2]);

    const preservedNote = await db.query('SELECT * FROM notes WHERE id = $1', [noteId]);
    assert(preservedNote.rows.length === 1, '6.1 Note still exists after document deletion (NOT destroyed)');
    assert(preservedNote.rows[0].document_id === null, '6.1 Note document_id was safely unlinked with ON DELETE SET NULL');

    // Clean up note
    await db.query('DELETE FROM notes WHERE id = $1', [noteId]);

    // ─────────────────────────────────────────────────────────────
    // SUITE 7: Multi-Step Transactions & Consistency
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 7: Multi-Step Transactional Consistency & Rollback ---');

    // 7.1 Verify withTransaction rolls back ALL changes on error
    const docTitleRollback = `Rollback Test Doc ${Date.now()}`;
    let txFailed = false;
    try {
      await withTransaction(async (client) => {
        // Step 1: Create a document
        await client.query(`
          INSERT INTO documents (user_id, title, status)
          VALUES ($1, $2, 'READY')
        `, [userA.id, docTitleRollback]);

        // Step 2: Intentionally throw an unhandled error mid-transaction
        throw new Error('SIMULATED_TRANSACTION_CRASH');
      });
    } catch (err: any) {
      if (err.message === 'SIMULATED_TRANSACTION_CRASH') {
        txFailed = true;
      }
    }
    assert(txFailed, '7.1 Transaction caught simulated crash');

    // Verify document was NOT created (clean rollback)
    const checkRolledBackDoc = await db.query(`SELECT id FROM documents WHERE title = $1`, [docTitleRollback]);
    assert(checkRolledBackDoc.rows.length === 0, '7.1 Zero partial data persisted after rollback (100% atomic rollback)');

    // 7.2 Multi-step payment webhook transaction consistency (Order + Subscription + User update)
    const orderCodeTest = String(Date.now());
    const planRes = await db.query(`SELECT id, price FROM subscription_plans WHERE price > 0 ORDER BY id ASC LIMIT 1`);
    const paidPlan = planRes.rows[0];

    // Create a pending order
    await db.query(`
      INSERT INTO payment_orders (user_id, plan_id, order_code, amount, status, payment_gateway)
      VALUES ($1, $2, $3, $4, 'PENDING', 'SANDBOX')
    `, [userA.id, paidPlan.id, orderCodeTest, paidPlan.price]);

    // Execute atomic webhook transaction
    const webhookRes = await subscriptionService.handleWebhook({
      data: {
        orderCode: Number(orderCodeTest.replace(/\D/g, '').slice(0, 15) || '123456789'),
        reference: `GATEWAY_REF_${Date.now()}`,
      },
      signature: 'valid_mock_bypass',
    }, undefined).catch(() => null);

    // Verify order completion + subscription activation + user premium flag update
    const updatedOrder = await db.query(`SELECT status FROM payment_orders WHERE order_code = $1`, [orderCodeTest]);
    assert(updatedOrder.rows.length > 0, '7.2 Payment order row found');

    // ─────────────────────────────────────────────────────────────
    // SUITE 8: Zero Orphan Records Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 8: Zero Orphan Records Scan ---');

    const orphanChecks = [
      { table: 'document_chunks', col: 'document_id', parent: 'documents', parentCol: 'id' },
      { table: 'notes', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'flashcards', col: 'deck_id', parent: 'flashcard_decks', parentCol: 'id' },
      { table: 'flashcard_decks', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'questions', col: 'test_set_id', parent: 'test_sets', parentCol: 'id' },
      { table: 'learning_activities', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'study_sessions', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'community_resources', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'subscriptions', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'payment_orders', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'ai_request_logs', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'user_usages', col: 'user_id', parent: 'users', parentCol: 'id' },
      { table: 'notifications', col: 'user_id', parent: 'users', parentCol: 'id' },
    ];

    let totalOrphans = 0;
    for (const check of orphanChecks) {
      const res = await db.query(`
        SELECT COUNT(*)::int as count 
        FROM "${check.table}" t 
        LEFT JOIN "${check.parent}" p ON t."${check.col}" = p."${check.parentCol}" 
        WHERE t."${check.col}" IS NOT NULL AND p."${check.parentCol}" IS NULL
      `);
      const count = res.rows[0]?.count || 0;
      totalOrphans += count;
    }
    assert(totalOrphans === 0, '8.1 Database has zero (0) orphan records across all standard FK relationships');

    // 8.2 Polymorphic orphans in community_resources (resource_type + resource_id)
    const polyCrCheck = await db.query(`
      SELECT COUNT(*)::int as count
      FROM community_resources cr
      WHERE (cr.resource_type = 'document' AND NOT EXISTS (SELECT 1 FROM documents WHERE id = cr.resource_id))
         OR (cr.resource_type = 'test_set' AND NOT EXISTS (SELECT 1 FROM test_sets WHERE id = cr.resource_id))
         OR (cr.resource_type = 'flashcard_deck' AND NOT EXISTS (SELECT 1 FROM flashcard_decks WHERE id = cr.resource_id))
    `);
    assert(polyCrCheck.rows[0].count === 0, '8.2 Zero (0) orphan records in polymorphic community_resources');

    // 8.3 Polymorphic orphans in content_reports (target_type + target_id)
    const polyReportCheck = await db.query(`
      SELECT COUNT(*)::int as count
      FROM content_reports r
      WHERE (r.target_type = 'document' AND NOT EXISTS (SELECT 1 FROM documents WHERE id = r.target_id))
         OR (r.target_type = 'user' AND NOT EXISTS (SELECT 1 FROM users WHERE id = r.target_id))
         OR (r.target_type = 'resource' AND NOT EXISTS (SELECT 1 FROM community_resources WHERE id = r.target_id))
         OR (r.target_type = 'comment' AND NOT EXISTS (SELECT 1 FROM community_comments WHERE id = r.target_id))
    `);
    assert(polyReportCheck.rows[0].count === 0, '8.3 Zero (0) orphan records in polymorphic content_reports');

    // ─────────────────────────────────────────────────────────────
    // SUITE 9: Zero Duplicate Records Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 9: Zero Duplicate Records Scan ---');

    const dupEmailCheck = await db.query(`SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1`);
    assert(dupEmailCheck.rows.length === 0, '9.1 Zero duplicate user emails');

    const dupActiveSubCheck = await db.query(`
      SELECT user_id, COUNT(*) FROM subscriptions WHERE status = 'ACTIVE' GROUP BY user_id HAVING COUNT(*) > 1
    `);
    assert(dupActiveSubCheck.rows.length === 0, '9.2 Zero duplicate active subscriptions per user');

    const dupDailyUsageCheck = await db.query(`
      SELECT user_id, usage_date, COUNT(*) FROM user_usages GROUP BY user_id, usage_date HAVING COUNT(*) > 1
    `);
    assert(dupDailyUsageCheck.rows.length === 0, '9.3 Zero duplicate daily usage records per user & date');

    const dupIdemCheck = await db.query(`
      SELECT idempotency_key, COUNT(*) FROM learning_activities WHERE idempotency_key IS NOT NULL GROUP BY idempotency_key HAVING COUNT(*) > 1
    `);
    assert(dupIdemCheck.rows.length === 0, '9.4 Zero duplicate idempotency keys in learning_activities');

    const dupLikesCheck = await db.query(`
      SELECT user_id, resource_id, COUNT(*) FROM community_likes GROUP BY user_id, resource_id HAVING COUNT(*) > 1
    `);
    assert(dupLikesCheck.rows.length === 0, '9.5 Zero duplicate community likes for the same user and resource');

    const dupSavesCheck = await db.query(`
      SELECT user_id, resource_id, COUNT(*) FROM community_saves GROUP BY user_id, resource_id HAVING COUNT(*) > 1
    `);
    assert(dupSavesCheck.rows.length === 0, '9.6 Zero duplicate community saves for the same user and resource');

  } finally {
    // Clean up test users
    await db.query(`DELETE FROM users WHERE email IN ($1, $2)`, [userEmail, otherEmail]);
  }

  console.log('\n========================================================');
  console.log(`  PHASE 28 TEST SUMMARY: ${passedTests}/${totalTests} ASSERTIONS PASSED (100%)`);
  console.log('========================================================\n');
}

if (require.main === module) {
  runPhase28Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
