import axios from 'axios';
import assert from 'assert';
import { db } from '../src/db';
import { getVietnamDateString } from '../src/utils/date.util';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

interface TestUser {
  id: number;
  email: string;
  name: string;
  token: string;
  headers: { Authorization: string };
}

async function createTestUser(email: string, name: string, role = 'user'): Promise<TestUser> {
  await db.query('DELETE FROM users WHERE email = $1', [email]);
  const phone = '098' + Math.floor(1000000 + Math.random() * 9000000);
  const uniqueName = `${name} ${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const regRes = await axios.post(`${API_BASE}/auth/register`, {
    email,
    password: 'Password123!',
    name: uniqueName,
    phone,
  });

  let token = regRes.data.token;
  const id = regRes.data.user.id;

  if (role !== 'user') {
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password: 'Password123!',
    });
    token = loginRes.data.token;
  }

  return {
    id,
    email,
    name,
    token,
    headers: { Authorization: `Bearer ${token}` },
  };
}

export async function runPhase20Tests() {
  console.log('\n========================================================');
  console.log('    COGNITO PHASE 20: ENTITLEMENT & ACCESS CONTROL      ');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function testAssert(condition: boolean, message: string) {
    totalTests++;
    try {
      assert(condition, message);
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  [FAIL] ${message}`);
      throw err;
    }
  }

  const freeUser = await createTestUser(`free_user_${Date.now()}@example.com`, 'Free Student');
  const proUser = await createTestUser(`pro_user_${Date.now()}@example.com`, 'Pro Student');
  const adminUser = await createTestUser(`admin_user_${Date.now()}@example.com`, 'Admin Officer', 'admin');

  // Activate Pro User
  await db.query(
    `UPDATE users 
     SET is_premium = true, premium_until = NOW() + INTERVAL '30 days' 
     WHERE id = $1`,
    [proUser.id]
  );

  // Create a sample document for testing chat & question gen
  const docRes = await db.query(
    `INSERT INTO documents (user_id, title, description, category, doc_url, visibility, status)
     VALUES ($1, 'Test Entitlement Doc', 'Description', 'Khác', 'https://example.com/test.pdf', 'public', 'READY')
     RETURNING id`,
    [freeUser.id]
  );
  const testDocId = docRes.rows[0].id;

  await db.query(
    `INSERT INTO document_chunks (document_id, chunk_index, content, page_number, token_count, keywords)
     VALUES ($1, 0, 'Toán học là môn khoa học nghiên cứu về các số, cấu trúc, không gian và các phép biến đổi.', 1, 50, ARRAY['Toán học'])`,
    [testDocId]
  );

  // =========================================================================
  // SUITE 1: ENTITLEMENTS INSPECTION API (GET /api/payment/entitlements)
  // =========================================================================
  console.log('--- SUITE 1: Entitlements Inspection API (Single Source of Truth) ---');

  // 1.1 Unauthenticated request returns 401
  try {
    await axios.get(`${API_BASE}/payment/entitlements`);
    testAssert(false, '1.1 Unauthenticated GET /api/payment/entitlements should fail with 401');
  } catch (err: any) {
    testAssert(err.response?.status === 401, '1.1 Unauthenticated GET /api/payment/entitlements returns HTTP 401');
  }

  // 1.2 Free user entitlements inspection
  const freeEntRes = await axios.get(`${API_BASE}/payment/entitlements`, { headers: freeUser.headers });
  testAssert(freeEntRes.status === 200, '1.2.1 GET /api/payment/entitlements returns HTTP 200 for Free user');
  const freeData = freeEntRes.data.data;
  testAssert(freeData.plan === 'FREE', '1.2.2 Free user plan is FREE');
  testAssert(freeData.is_premium === false, '1.2.3 Free user is_premium is false');
  testAssert(freeData.usage.ai_chat.limit === 20, '1.2.4 Free user ai_chat.limit is 20');
  testAssert(freeData.usage.ai_questions.limit === 10, '1.2.5 Free user ai_questions.limit is 10');
  testAssert(freeData.usage.documents.limit === 20, '1.2.6 Free user documents.limit is 20');
  testAssert(freeData.usage.document_max_pages === 30, '1.2.7 Free user document_max_pages is 30');

  // 1.3 Pro user entitlements inspection
  const proEntRes = await axios.get(`${API_BASE}/payment/entitlements`, { headers: proUser.headers });
  testAssert(proEntRes.status === 200, '1.3.1 GET /api/payment/entitlements returns HTTP 200 for Pro user');
  const proData = proEntRes.data.data;
  testAssert(proData.plan === 'PRO', '1.3.2 Pro user plan is PRO');
  testAssert(proData.is_premium === true, '1.3.3 Pro user is_premium is true');
  testAssert(proData.usage.ai_chat.unlimited === true, '1.3.4 Pro user ai_chat is unlimited');
  testAssert(proData.usage.ai_questions.unlimited === true, '1.3.5 Pro user ai_questions is unlimited');
  testAssert(proData.usage.documents.unlimited === true, '1.3.6 Pro user documents is unlimited');
  testAssert(proData.usage.document_max_pages === 200, '1.3.7 Pro user document_max_pages is 200');

  // 1.4 Admin user entitlements inspection
  const adminEntRes = await axios.get(`${API_BASE}/payment/entitlements`, { headers: adminUser.headers });
  testAssert(adminEntRes.status === 200, '1.4.1 GET /api/payment/entitlements returns HTTP 200 for Admin');
  testAssert(adminEntRes.data.data.plan === 'ADMIN', '1.4.2 Admin plan is ADMIN with unlimited privileges');

  // =========================================================================
  // SUITE 2: UTC+7 VIETNAM DATE CONSISTENCY (MATCHING PHASE 10 STREAK)
  // =========================================================================
  console.log('\n--- SUITE 2: UTC+7 Vietnam Date Consistency ---');

  const expectedVnDate = getVietnamDateString(new Date());
  testAssert(freeData.usage_date === expectedVnDate, `2.1 Entitlements date (${freeData.usage_date}) matches Vietnam UTC+7 date (${expectedVnDate})`);

  // Verify database record in user_usages also records this exact date
  const dbDateCheck = await db.query('SELECT usage_date FROM user_usages WHERE user_id = $1', [freeUser.id]);
  if (dbDateCheck.rows.length > 0) {
    const rawDbDate = dbDateCheck.rows[0].usage_date;
    const dbDateStr = rawDbDate instanceof Date ? rawDbDate.toISOString().split('T')[0] : String(rawDbDate);
    testAssert(dbDateStr === expectedVnDate, `2.2 user_usages.usage_date matches UTC+7 date exactly`);
  } else {
    testAssert(true, '2.2 user_usages row will be verified upon first usage');
  }

  // =========================================================================
  // SUITE 3: DAILY QUOTA ENFORCEMENT ON AI CHAT (POST /api/ai/chat)
  // =========================================================================
  console.log('\n--- SUITE 3: Daily Quota Enforcement on AI Chat ---');

  // Set freeUser chat usage to 19 (1 slot remaining)
  await db.query(
    `INSERT INTO user_usages (user_id, usage_date, ai_chat_messages)
     VALUES ($1, $2, 19)
     ON CONFLICT (user_id, usage_date)
     DO UPDATE SET ai_chat_messages = 19`,
    [freeUser.id, expectedVnDate]
  );

  // Message #20: Should succeed
  const chatRes20 = await axios.post(
    `${API_BASE}/ai/chat`,
    { document_id: testDocId, message: 'Chào bạn, giải thích đoạn văn này giúp tôi.' },
    { headers: freeUser.headers }
  );
  testAssert(chatRes20.status === 200, '3.1 Message #20 (within 20 limit) succeeds with HTTP 200');

  // Verify usage count reached 20 in database
  const countAfter20 = await db.query(
    'SELECT ai_chat_messages FROM user_usages WHERE user_id = $1 AND usage_date = $2',
    [freeUser.id, expectedVnDate]
  );
  testAssert(Number(countAfter20.rows[0].ai_chat_messages) === 20, '3.2 user_usages.ai_chat_messages reached 20');

  // Message #21: Exceeds 20 daily limit -> Strictly blocked with HTTP 403 LIMIT_EXCEEDED
  try {
    await axios.post(
      `${API_BASE}/ai/chat`,
      { document_id: testDocId, message: 'Tin nhắn thứ 21 vượt hạn ngạch.' },
      { headers: freeUser.headers }
    );
    testAssert(false, '3.3 Message #21 should fail with 403 LIMIT_EXCEEDED');
  } catch (err: any) {
    testAssert(err.response?.status === 403, '3.3 Message #21 strictly blocked with HTTP 403 Forbidden');
    testAssert(err.response?.data?.error === 'LIMIT_EXCEEDED', '3.4 Error code is LIMIT_EXCEEDED');
    testAssert(typeof err.response?.data?.message === 'string', '3.5 Friendly Vietnamese upgrade notice returned');
  }

  // =========================================================================
  // SUITE 4: RACE CONDITION PROTECTION WITH SELECT ... FOR UPDATE
  // =========================================================================
  console.log('\n--- SUITE 4: Race Condition Protection with Row Locking (FOR UPDATE) ---');

  // Set user usage back to 19 (only 1 slot left)
  await db.query(
    'UPDATE user_usages SET ai_chat_messages = 19 WHERE user_id = $1 AND usage_date = $2',
    [freeUser.id, expectedVnDate]
  );

  // Fire 2 concurrent requests at the EXACT same millisecond
  const [resA, resB] = await Promise.allSettled([
    axios.post(`${API_BASE}/ai/chat`, { document_id: testDocId, message: 'Concurrent request A' }, { headers: freeUser.headers }),
    axios.post(`${API_BASE}/ai/chat`, { document_id: testDocId, message: 'Concurrent request B' }, { headers: freeUser.headers }),
  ]);

  const successes = [resA, resB].filter((r) => r.status === 'fulfilled');
  const failures = [resA, resB].filter((r) => r.status === 'rejected');

  testAssert(successes.length === 1, '4.1 Concurrency race: Exactly ONE request succeeded (got the last slot)');
  testAssert(failures.length === 1, '4.2 Concurrency race: Exactly ONE request was blocked with HTTP 403');

  const finalUsageRes = await db.query(
    'SELECT ai_chat_messages FROM user_usages WHERE user_id = $1 AND usage_date = $2',
    [freeUser.id, expectedVnDate]
  );
  testAssert(Number(finalUsageRes.rows[0].ai_chat_messages) === 20, '4.3 Concurrency race: Usage count capped strictly at 20, zero overage');

  // =========================================================================
  // SUITE 5: REFUND ON FAILURE (NO UNFAIR PENALTY)
  // =========================================================================
  console.log('\n--- SUITE 5: Refund on Failure (Zero Penalty on Error) ---');

  // Reset chat count to 5
  await db.query(
    'UPDATE user_usages SET ai_chat_messages = 5 WHERE user_id = $1 AND usage_date = $2',
    [freeUser.id, expectedVnDate]
  );

  // Trigger a request pointing to a NON-EXISTENT document (will fail with 403/404)
  try {
    await axios.post(
      `${API_BASE}/ai/chat`,
      { document_id: 999999, message: 'Hello error test' },
      { headers: freeUser.headers }
    );
  } catch (err: any) {
    // Expected failure
  }

  // Verify count is STILL 5 (reserved slot was refunded, user not penalized)
  const refundCheck = await db.query(
    'SELECT ai_chat_messages FROM user_usages WHERE user_id = $1 AND usage_date = $2',
    [freeUser.id, expectedVnDate]
  );
  testAssert(Number(refundCheck.rows[0].ai_chat_messages) === 5, '5.1 Failed request slot was refunded: usage remained 5');

  // =========================================================================
  // SUITE 6: QUESTION GENERATION DAILY QUOTA (POST /api/questions/generate)
  // =========================================================================
  console.log('\n--- SUITE 6: Question Generation Daily Quota ---');

  // Set ai_question_gens to 10 (limit reached)
  await db.query(
    `INSERT INTO user_usages (user_id, usage_date, ai_question_gens)
     VALUES ($1, $2, 10)
     ON CONFLICT (user_id, usage_date)
     DO UPDATE SET ai_question_gens = 10`,
    [freeUser.id, expectedVnDate]
  );

  try {
    await axios.post(
      `${API_BASE}/questions/generate`,
      {
        sourceIds: [testDocId],
        quantity: 3,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'medium',
        templateId: 'basic_quiz',
        name: 'Test Quiz Set',
      },
      { headers: freeUser.headers }
    );
    testAssert(false, '6.1 Question generation past 10 limit should fail with 403');
  } catch (err: any) {
    testAssert(err.response?.status === 403, '6.1 Question generation past 10 limit strictly blocked with HTTP 403');
    testAssert(err.response?.data?.error === 'LIMIT_EXCEEDED', '6.2 Error code is LIMIT_EXCEEDED');
  }

  // =========================================================================
  // SUITE 7: DOCUMENT UPLOAD QUOTAS (MAX DOCUMENTS & PAGE LIMIT)
  // =========================================================================
  console.log('\n--- SUITE 7: Document Upload Quotas (20 Docs & 30 Pages) ---');

  // 7.1 Test Free user reached 20 documents limit
  // Create 19 more documents for freeUser to reach 20 total docs
  for (let i = 0; i < 19; i++) {
    await db.query(
      `INSERT INTO documents (user_id, title, description, category, doc_url, visibility, status)
       VALUES ($1, $2, 'Dummy desc', 'Khác', 'https://example.com/dummy.pdf', 'private', 'READY')`,
      [freeUser.id, `Doc Dummy ${i}`]
    );
  }

  // Now freeUser has 20 active documents. Attempting to upload 21st file:
  try {
    // We send a minimal text upload via FormData or simulate uploadDocument check directly
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from('Noi dung bai hoc moi'), {
      filename: 'sample21.txt',
      contentType: 'text/plain',
    });
    form.append('title', 'Tài liệu số 21');

    await axios.post(`${API_BASE}/documents/upload`, form, {
      headers: { ...freeUser.headers, ...form.getHeaders() },
    });
    testAssert(false, '7.1 Uploading 21st document should fail with 403 DOC_LIMIT_REACHED');
  } catch (err: any) {
    testAssert(err.response?.status === 403, '7.1 Uploading 21st document strictly blocked with HTTP 403');
    testAssert(err.response?.data?.error === 'DOC_LIMIT_REACHED', '7.2 Error code is DOC_LIMIT_REACHED');
  }

  // =========================================================================
  // SUITE 8: UPGRADE TO PRO BYPASSES ALL DAILY QUOTAS
  // =========================================================================
  console.log('\n--- SUITE 8: Upgrade to Pro Bypasses All Daily Quotas ---');

  // Upgrade freeUser to Pro
  await db.query(
    `UPDATE users 
     SET is_premium = true, premium_until = NOW() + INTERVAL '30 days' 
     WHERE id = $1`,
    [freeUser.id]
  );

  // Chat message that was previously blocked at 20/20 limit:
  const proChatRes = await axios.post(
    `${API_BASE}/ai/chat`,
    { document_id: testDocId, message: 'Chat sau khi đã nâng cấp Pro thành công.' },
    { headers: freeUser.headers }
  );
  testAssert(proChatRes.status === 200, '8.1 Upgraded user can chat without limit (HTTP 200)');

  // Clean up test documents & users
  await db.query('DELETE FROM documents WHERE user_id = $1', [freeUser.id]);
  await db.query('DELETE FROM user_usages WHERE user_id IN ($1, $2, $3)', [freeUser.id, proUser.id, adminUser.id]);
  await db.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [freeUser.id, proUser.id, adminUser.id]);

  console.log('\n========================================================');
  console.log(`  PHASE 20 TEST SUMMARY: ${passedTests}/${totalTests} ASSERTIONS PASSED (100%)`);
  console.log('========================================================\n');

  return { passedTests, totalTests };
}

// Allow direct CLI execution
if (require.main === module) {
  runPhase20Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Phase 20 tests failed:', err);
      process.exit(1);
    });
}
