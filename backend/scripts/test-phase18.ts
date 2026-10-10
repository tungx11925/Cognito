import axios from 'axios';
import { db } from '../src/db';
import { subscriptionService } from '../src/services/subscription.service';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase18Tests() {
  console.log('\n========================================================');
  console.log('     COGNITO PHASE 18: ADMIN DASHBOARD & ANALYTICS      ');
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

  // 1. Cleanup old test data
  await db.query(`DELETE FROM payment_orders WHERE order_code LIKE 'P18%'`);
  await db.query(`DELETE FROM users WHERE name LIKE 'P18 %' OR email LIKE '%@p18.cognito.test'`);

  async function registerUser(email: string, name: string, role: string = 'user') {
    const phone = '098' + Math.floor(1000000 + Math.random() * 9000000);
    const uniqueName = `${name} ${Math.floor(Math.random() * 100000)}`;
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: uniqueName,
      email,
      password: 'Password123!',
      phone,
    });
    const userId = res.data.user.id;
    let token = res.data.token;
    if (role !== 'user') {
      await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password: 'Password123!',
      });
      token = loginRes.data.token;
    }
    return {
      id: userId,
      name: uniqueName,
      email,
      token,
      headers: { Authorization: `Bearer ${token}` },
    };
  }

  const timestamp = Date.now();
  const regularUser = await registerUser(`p18_user_${timestamp}@p18.cognito.test`, 'P18 Regular User', 'user');
  const adminUser = await registerUser(`p18_admin_${timestamp}@p18.cognito.test`, 'P18 Admin User', 'admin');

  // =========================================================================
  // SUITE 1: RBAC & IDOR SECURITY FOR ALL /api/admin/* ENDPOINTS
  // =========================================================================
  console.log('\n--- SUITE 1: RBAC & IDOR Security for Admin Endpoints ---');

  // 1.1 Unauthenticated requests return 401
  try {
    await axios.get(`${API_BASE}/admin/stats`);
    assert(false, '1.1 GET /api/admin/stats without token should fail');
  } catch (err: any) {
    assert(err.response?.status === 401, '1.1 Unauthenticated GET /api/admin/stats returns HTTP 401 Unauthorized');
  }

  // 1.2 Regular user token returns 403 Forbidden across all admin routes
  const protectedAdminRoutes = [
    { method: 'get', url: `${API_BASE}/admin/stats` },
    { method: 'get', url: `${API_BASE}/admin/users` },
    { method: 'get', url: `${API_BASE}/admin/subscriptions` },
    { method: 'get', url: `${API_BASE}/admin/orders` },
    { method: 'get', url: `${API_BASE}/admin/documents` },
    { method: 'post', url: `${API_BASE}/admin/subscriptions/sync`, data: {} },
    { method: 'post', url: `${API_BASE}/admin/users/${regularUser.id}/suspend`, data: { reason: 'Test' } },
  ];

  for (let i = 0; i < protectedAdminRoutes.length; i++) {
    const route = protectedAdminRoutes[i];
    try {
      if (route.method === 'get') {
        await axios.get(route.url, { headers: regularUser.headers });
      } else {
        await axios.post(route.url, route.data, { headers: regularUser.headers });
      }
      assert(false, `1.2.${i + 1} Regular user calling ${route.url} must fail`);
    } catch (err: any) {
      assert(
        err.response?.status === 403,
        `1.2.${i + 1} Regular user calling ${route.method.toUpperCase()} ${route.url} strictly returns HTTP 403 Forbidden`
      );
    }
  }

  // 1.3 Admin user succeeds
  const adminStatsRes = await axios.get(`${API_BASE}/admin/stats`, { headers: adminUser.headers });
  assert(adminStatsRes.status === 200, '1.3 Admin user calling GET /api/admin/stats returns HTTP 200 OK');

  // =========================================================================
  // SUITE 2: FRESHNESS GUARANTEE & REAL DATABASE ANALYTICS
  // =========================================================================
  console.log('\n--- SUITE 2: Freshness Guarantee & Real Database Analytics ---');

  const stats = adminStatsRes.data.stats;
  const charts = adminStatsRes.data.charts;

  // 2.1 Verify stats structure
  assert(typeof stats.totalUsers === 'number', '2.1.1 stats.totalUsers is a valid number');
  assert(typeof stats.activeUsers === 'number', '2.1.2 stats.activeUsers is a valid number');
  assert(typeof stats.suspendedUsers === 'number', '2.1.3 stats.suspendedUsers is a valid number');
  assert(typeof stats.premiumUsers === 'number', '2.1.4 stats.premiumUsers is a valid number');
  assert(typeof stats.freeUsers === 'number', '2.1.5 stats.freeUsers is a valid number');
  assert(typeof stats.activeSubscriptions === 'number', '2.1.6 stats.activeSubscriptions is a valid number');
  assert(typeof stats.mrr === 'number', '2.1.7 stats.mrr is a valid number');
  assert(typeof stats.totalRevenue === 'number', '2.1.8 stats.totalRevenue is a valid number');
  assert(typeof stats.totalDocuments === 'number', '2.1.9 stats.totalDocuments is a valid number');
  assert(typeof stats.totalStorageBytes === 'number' || typeof stats.totalStorageBytes === 'string', '2.1.10 stats.totalStorageBytes is a valid value');
  assert(typeof stats.totalDecks === 'number', '2.1.11 stats.totalDecks is a valid number');
  assert(typeof stats.totalTestSets === 'number', '2.1.12 stats.totalTestSets is a valid number');
  assert(Array.isArray(charts.monthlyRevenue), '2.1.13 charts.monthlyRevenue is an array');
  assert(Array.isArray(charts.subscriptionsByPlan), '2.1.14 charts.subscriptionsByPlan is an array');

  // 2.2 Test Freshness Guarantee: Setup an expired subscription in DB
  const planRes = await db.query("SELECT id FROM subscription_plans WHERE code = 'PRO_MONTHLY'");
  const planId = planRes.rows[0].id;
  const expiredEndDate = new Date(Date.now() - 3600000); // 1 hour ago

  const testSub = await db.query(
    `INSERT INTO subscriptions (user_id, plan, status, start_date, end_date, amount, order_code, plan_id, auto_renew)
     VALUES ($1, 'PRO_MONTHLY', 'ACTIVE', NOW() - INTERVAL '31 days', $2, 99000, 180001, $3, false)
     RETURNING id`,
    [regularUser.id, expiredEndDate, planId]
  );
  const testSubId = testSub.rows[0].id;

  // Make sure regularUser has is_premium = true temporarily
  await db.query('UPDATE users SET is_premium = true, premium_until = $1 WHERE id = $2', [expiredEndDate, regularUser.id]);

  // Now trigger manual sync cron endpoint: POST /api/admin/subscriptions/sync
  const syncRes = await axios.post(`${API_BASE}/admin/subscriptions/sync`, {}, { headers: adminUser.headers });
  assert(syncRes.status === 200, '2.2.1 POST /api/admin/subscriptions/sync returns HTTP 200 OK');
  assert(syncRes.data.success === true, '2.2.2 Sync endpoint reports success = true');

  // Verify the expired subscription was updated away from ACTIVE to EXPIRED
  const subCheck = await db.query('SELECT status FROM subscriptions WHERE id = $1', [testSubId]);
  assert(subCheck.rows[0].status === 'EXPIRED', '2.2.3 Expired subscription automatically transitioned from ACTIVE to EXPIRED (No ACTIVE ảo)');

  // Verify users.is_premium was revoked
  const userCheck = await db.query('SELECT is_premium FROM users WHERE id = $1', [regularUser.id]);
  assert(userCheck.rows[0].is_premium === false, '2.2.4 users.is_premium correctly synchronized to false');

  // =========================================================================
  // SUITE 3: USER MANAGEMENT & ACTIONS
  // =========================================================================
  console.log('\n--- SUITE 3: User Management & Suspension Workflows ---');

  // 3.1 List users with pagination and filters
  const usersRes = await axios.get(`${API_BASE}/admin/users?limit=5`, { headers: adminUser.headers });
  assert(usersRes.status === 200, '3.1.1 GET /api/admin/users returns HTTP 200');
  assert(Array.isArray(usersRes.data.users), '3.1.2 users is an array');
  assert(usersRes.data.pagination && usersRes.data.pagination.total > 0, '3.1.3 pagination metadata is present');
  assert(usersRes.data.users[0].wallet_balance === undefined, '3.1.4 ANTI-LEAK: wallet_balance is NOT exposed in getUsers response');

  // 3.2 Search user by email
  const searchRes = await axios.get(`${API_BASE}/admin/users?search=${encodeURIComponent(regularUser.email)}`, {
    headers: adminUser.headers,
  });
  assert(searchRes.data.users.length === 1, '3.2.1 Search by user email returns exactly 1 match');
  assert(searchRes.data.users[0].id === regularUser.id, '3.2.2 Search result matches regularUser ID');

  // 3.3 Warn user
  const warnRes = await axios.post(
    `${API_BASE}/admin/users/${regularUser.id}/warn`,
    { message: 'Cảnh báo vi phạm quy định cộng đồng lần 1' },
    { headers: adminUser.headers }
  );
  assert(warnRes.status === 200, '3.3.1 POST /api/admin/users/:id/warn returns HTTP 200');
  const userWarnCheck = await db.query('SELECT warning_count FROM users WHERE id = $1', [regularUser.id]);
  assert(userWarnCheck.rows[0].warning_count >= 1, '3.3.2 warning_count incremented in database');

  // 3.4 Suspend user
  const suspendRes = await axios.post(
    `${API_BASE}/admin/users/${regularUser.id}/suspend`,
    { reason: 'Vi phạm điều khoản dịch vụ liên tục', notes: 'Ghi chú kiểm duyệt nội bộ' },
    { headers: adminUser.headers }
  );
  assert(suspendRes.status === 200, '3.4.1 POST /api/admin/users/:id/suspend returns HTTP 200');
  const suspendedCheck = await db.query('SELECT is_suspended, suspension_reason FROM users WHERE id = $1', [regularUser.id]);
  assert(suspendedCheck.rows[0].is_suspended === true, '3.4.2 user is_suspended updated to true');
  assert(suspendedCheck.rows[0].suspension_reason.includes('Vi phạm'), '3.4.3 suspension_reason saved accurately');

  // Verify suspension audit log
  const logCheck = await db.query("SELECT * FROM moderation_logs WHERE target_id = $1 AND action = 'SUSPEND'", [regularUser.id]);
  assert(logCheck.rows.length >= 1, '3.4.4 Action logged in moderation_logs table');

  // 3.5 Unsuspend user
  const unsuspendRes = await axios.post(
    `${API_BASE}/admin/users/${regularUser.id}/unsuspend`,
    {},
    { headers: adminUser.headers }
  );
  assert(unsuspendRes.status === 200, '3.5.1 POST /api/admin/users/:id/unsuspend returns HTTP 200');
  const unsuspendedCheck = await db.query('SELECT is_suspended FROM users WHERE id = $1', [regularUser.id]);
  assert(unsuspendedCheck.rows[0].is_suspended === false, '3.5.2 user is_suspended restored to false');

  // =========================================================================
  // SUITE 4: ZERO-LEAKAGE PRIVACY GUARDRAILS
  // =========================================================================
  console.log('\n--- SUITE 4: Zero-Leakage Privacy Guardrails ---');

  // 4.1 Create a private document for regularUser
  const privateDocRes = await db.query(
    `INSERT INTO documents (user_id, title, category, price, visibility, is_community_published, file_type, file_size, description, solution_text, doc_url)
     VALUES ($1, 'Private Notes P18', 'Mathematics', 0, 'private', false, 'PDF', 1048576, 'Private description', 'SECRET_RAW_TEXT_CONTENT_123', 'https://secure-bucket/private-file.pdf')
     RETURNING id`,
    [regularUser.id]
  );
  const privateDocId = privateDocRes.rows[0].id;

  // Create a public document for regularUser
  const publicDocRes = await db.query(
    `INSERT INTO documents (user_id, title, category, price, visibility, is_community_published, file_type, file_size, description)
     VALUES ($1, 'Public Research P18', 'Physics', 50, 'public', true, 'PDF', 2097152, 'Public description')
     RETURNING id`,
    [regularUser.id]
  );
  const publicDocId = publicDocRes.rows[0].id;

  // 4.2 Test GET /api/admin/users/:id/details:
  // Must NOT leak private document bodies, private file URLs, or raw text
  const userDetailsRes = await axios.get(`${API_BASE}/admin/users/${regularUser.id}/details`, {
    headers: adminUser.headers,
  });
  assert(userDetailsRes.status === 200, '4.2.1 GET /api/admin/users/:id/details returns HTTP 200');
  
  const details = userDetailsRes.data;
  assert(details.learningMetrics.docs_count >= 2, '4.2.2 Aggregate learningMetrics includes total document count');
  assert(details.publicDocuments.length >= 1, '4.2.3 publicDocuments array includes public documents');
  
  // Verify private document is NOT included in publicDocuments array
  const hasPrivateDoc = details.publicDocuments.some((d: any) => d.id === privateDocId);
  assert(!hasPrivateDoc, '4.2.4 Private document is EXCLUDED from user details document list');

  // Verify response JSON nowhere contains the private secret solution_text or private doc_url
  const responseJsonStr = JSON.stringify(details);
  assert(!responseJsonStr.includes('SECRET_RAW_TEXT_CONTENT_123'), '4.2.5 ZERO-LEAKAGE: Raw text / private solution text NOT exposed in details API');
  assert(!responseJsonStr.includes('https://secure-bucket/private-file.pdf'), '4.2.6 ZERO-LEAKAGE: Private file storage URL NOT exposed in details API');

  // 4.3 Test GET /api/admin/documents:
  // Returns safe metadata only, never raw_text or solution_text
  const docsListRes = await axios.get(`${API_BASE}/admin/documents`, { headers: adminUser.headers });
  assert(docsListRes.status === 200, '4.3.1 GET /api/admin/documents returns HTTP 200');
  assert(Array.isArray(docsListRes.data.documents), '4.3.2 documents list is an array');

  const allDocsJsonStr = JSON.stringify(docsListRes.data.documents);
  assert(!allDocsJsonStr.includes('SECRET_RAW_TEXT_CONTENT_123'), '4.3.3 ZERO-LEAKAGE: Document list API strictly omits raw_text/solution_text');

  // =========================================================================
  // SUITE 5: SUBSCRIPTIONS & ORDERS MANAGEMENT
  // =========================================================================
  console.log('\n--- SUITE 5: Subscriptions & Payment Orders Management ---');

  // 5.1 Create a test payment order
  const orderCode = `P18_${Date.now()}`;
  await db.query(
    `INSERT INTO payment_orders (user_id, plan_id, order_code, amount, currency, status, payment_gateway, paid_at)
     VALUES ($1, $2, $3, 99000, 'VND', 'COMPLETED', 'PAYOS', NOW())`,
    [regularUser.id, planId, orderCode]
  );

  // 5.2 Query orders via admin API
  const ordersRes = await axios.get(`${API_BASE}/admin/orders?search=${orderCode}`, {
    headers: adminUser.headers,
  });
  assert(ordersRes.status === 200, '5.2.1 GET /api/admin/orders returns HTTP 200');
  assert(ordersRes.data.orders.length === 1, '5.2.2 Found payment order by search code');
  assert(ordersRes.data.orders[0].order_code === orderCode, '5.2.3 Order code matches expected value');
  assert(ordersRes.data.orders[0].status === 'COMPLETED', '5.2.4 Order status is COMPLETED');

  // 5.3 Query subscriptions via admin API
  const subsRes = await axios.get(`${API_BASE}/admin/subscriptions?search=${encodeURIComponent(regularUser.email)}`, {
    headers: adminUser.headers,
  });
  assert(subsRes.status === 200, '5.3.1 GET /api/admin/subscriptions returns HTTP 200');
  assert(subsRes.data.subscriptions.length >= 1, '5.3.2 Subscriptions list includes user subscriptions');

  // 5.4 Test Admin Cancel Subscription
  // Create an ACTIVE subscription
  const activeSubRes = await db.query(
    `INSERT INTO subscriptions (user_id, plan, status, start_date, end_date, amount, order_code, plan_id, auto_renew)
     VALUES ($1, 'PRO_MONTHLY', 'ACTIVE', NOW(), NOW() + INTERVAL '30 days', 99000, 180002, $2, true)
     RETURNING id`,
    [regularUser.id, planId]
  );
  const activeSubId = activeSubRes.rows[0].id;

  const cancelRes = await axios.post(`${API_BASE}/admin/subscriptions/${activeSubId}/cancel`, {}, {
    headers: adminUser.headers,
  });
  assert(cancelRes.status === 200, '5.4.1 POST /api/admin/subscriptions/:id/cancel returns HTTP 200');
  const cancelledSubCheck = await db.query('SELECT status, auto_renew, cancelled_at FROM subscriptions WHERE id = $1', [activeSubId]);
  assert(cancelledSubCheck.rows[0].status === 'CANCELLED', '5.4.2 Subscription status updated to CANCELLED');
  assert(cancelledSubCheck.rows[0].auto_renew === false, '5.4.3 auto_renew set to false');
  assert(cancelledSubCheck.rows[0].cancelled_at !== null, '5.4.4 cancelled_at recorded');

  // =========================================================================
  // SUITE 6: DOCUMENT MANAGEMENT, DEPENDENCY CLEANUP & PRESERVATION
  // =========================================================================
  console.log('\n--- SUITE 6: Document Deletion, Dependency Cleanup & User Knowledge Preservation ---');

  // 6.0 Setup: Publish publicDocId to Community and link Note, Mindmap, StudySession to it
  const commRes = await db.query(
    `INSERT INTO community_resources (user_id, resource_type, resource_id, title, description, is_public)
     VALUES ($1, 'document', $2, 'Public Test Doc Listing', 'Testing cascade cleanup', true)
     RETURNING id`,
    [regularUser.id, publicDocId]
  );
  const commPostId = commRes.rows[0].id;

  const noteRes = await db.query(
    `INSERT INTO notes (user_id, document_id, title, content)
     VALUES ($1, $2, 'Valuable Student Note', 'Notes derived from document')
     RETURNING id`,
    [regularUser.id, publicDocId]
  );
  const testNoteId = noteRes.rows[0].id;

  const mmRes = await db.query(
    `INSERT INTO mindmaps (user_id, document_id, title, mermaid_code)
     VALUES ($1, $2, 'Student Mindmap', 'graph TD; A-->B;')
     RETURNING id`,
    [regularUser.id, publicDocId]
  );
  const testMindmapId = mmRes.rows[0].id;

  const ssRes = await db.query(
    `INSERT INTO study_sessions (user_id, document_id, duration_seconds)
     VALUES ($1, $2, 1800)
     RETURNING id`,
    [regularUser.id, publicDocId]
  );
  const testSessionId = ssRes.rows[0].id;

  // Execute Admin Document Deletion
  const deleteDocRes = await axios.delete(`${API_BASE}/admin/documents/${publicDocId}`, {
    headers: adminUser.headers,
  });
  assert(deleteDocRes.status === 200, '6.1 DELETE /api/admin/documents/:id returns HTTP 200');

  // Verify doc was removed from DB
  const docDeletedCheck = await db.query('SELECT id FROM documents WHERE id = $1', [publicDocId]);
  assert(docDeletedCheck.rows.length === 0, '6.2 Document removed from database');

  // Verify deletion audit log in moderation_logs
  const docLogCheck = await db.query("SELECT * FROM moderation_logs WHERE target_id = $1 AND action = 'DELETE_DOCUMENT'", [publicDocId]);
  assert(docLogCheck.rows.length >= 1, '6.3 Document deletion logged in moderation_logs');

  // Verify community listing was cleanly cleaned up (no orphaned/dangling community resource)
  const commCheck = await db.query("SELECT id FROM community_resources WHERE resource_type = 'document' AND resource_id = $1", [publicDocId]);
  assert(commCheck.rows.length === 0, '6.4 Community listing for deleted document cleanly removed (no orphaned record)');

  // Verify user Note was PRESERVED (NOT deleted by CASCADE) and document_id is SET NULL
  const noteCheck = await db.query('SELECT id, document_id, title FROM notes WHERE id = $1', [testNoteId]);
  assert(noteCheck.rows.length === 1, '6.5 User note still exists in database (NOT deleted)');
  assert(noteCheck.rows[0].document_id === null, '6.6 User note document_id was safely unlinked (ON DELETE SET NULL)');

  // Verify user Mindmap was PRESERVED and document_id is SET NULL
  const mmCheck = await db.query('SELECT id, document_id FROM mindmaps WHERE id = $1', [testMindmapId]);
  assert(mmCheck.rows.length === 1, '6.7 User mindmap still exists (NOT deleted)');
  assert(mmCheck.rows[0].document_id === null, '6.8 User mindmap document_id was safely unlinked (ON DELETE SET NULL)');

  // Verify user Study Session was PRESERVED and document_id is SET NULL
  const ssCheck = await db.query('SELECT id, document_id FROM study_sessions WHERE id = $1', [testSessionId]);
  assert(ssCheck.rows.length === 1, '6.9 User study session still exists (NOT deleted)');
  assert(ssCheck.rows[0].document_id === null, '6.10 User study session document_id was safely unlinked (ON DELETE SET NULL)');

  // Clean up created test items
  await db.query('DELETE FROM notes WHERE id = $1', [testNoteId]);
  await db.query('DELETE FROM mindmaps WHERE id = $1', [testMindmapId]);
  await db.query('DELETE FROM study_sessions WHERE id = $1', [testSessionId]);
  await db.query('DELETE FROM documents WHERE id = $1', [privateDocId]);

  console.log('\n========================================================');
  console.log(`  PHASE 18 TEST SUMMARY: ${passedTests}/${totalTests} ASSERTIONS PASSED (100%)`);
  console.log('========================================================\n');

  return { passedTests, totalTests };
}

// Allow direct CLI execution
if (require.main === module) {
  runPhase18Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Phase 18 tests failed:', err);
      process.exit(1);
    });
}
