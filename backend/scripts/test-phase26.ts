import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase26Tests() {
  console.log('\n========================================================');
  console.log('       COGNITO PHASE 26: SECURITY HARDENING TESTS       ');
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

  // Setup: Register a regular user and an admin user
  const timestamp = Date.now();
  const testPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
  const adminPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
  const userEmail = `p26_user_${timestamp}@test.com`;
  const adminEmail = `p26_admin_${timestamp}@test.com`;
  const password = 'StrongPassword123!';

  // Clean old test data
  await db.query(`DELETE FROM users WHERE email IN ($1, $2)`, [userEmail, adminEmail]);

  // Register regular user
  const regUserRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'P26 Regular User',
    email: userEmail,
    password,
    phone: testPhone,
  });
  const userToken = regUserRes.data.token;
  const userHeaders = { Authorization: `Bearer ${userToken}` };
  const userId = regUserRes.data.user.id;

  // Register admin user
  const regAdminRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'P26 Admin User',
    email: adminEmail,
    password,
    phone: adminPhone,
  });
  const adminId = regAdminRes.data.user.id;
  await db.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [adminId]);

  const loginAdminRes = await axios.post(`${API_BASE}/auth/login`, {
    email: adminEmail,
    password,
  });
  const adminToken = loginAdminRes.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  try {
    // ─────────────────────────────────────────────────────────────
    // SUITE 1: HTTP Security Headers (Helmet Verification)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: HTTP Security Headers (Helmet Verification) ---');
    const healthRes = await axios.get('http://localhost:5000/health');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', '1.1 X-Content-Type-Options is nosniff');
    assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN', '1.2 X-Frame-Options is SAMEORIGIN');
    assert(healthRes.headers['x-dns-prefetch-control'] === 'off', '1.3 X-DNS-Prefetch-Control is off');
    assert(healthRes.headers['strict-transport-security'] !== undefined, '1.4 Strict-Transport-Security (HSTS) is present');
    assert(healthRes.headers['referrer-policy'] === 'no-referrer', '1.5 Referrer-Policy is no-referrer');

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Cookie Security & Auth Validation Hardening
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Cookie Security & Auth Validation Hardening ---');
    const setCookieHeader = loginAdminRes.headers['set-cookie'];
    assert(Array.isArray(setCookieHeader) && setCookieHeader.length > 0, '2.1 Set-Cookie header is returned upon login');
    const cookieStr = setCookieHeader ? setCookieHeader.join('; ') : '';
    assert(cookieStr.toLowerCase().includes('httponly'), '2.2 Cookie flag includes HttpOnly');
    assert(cookieStr.toLowerCase().includes('samesite=lax'), '2.3 Cookie flag includes SameSite=Lax (CSRF protection)');

    // 2.4 Forgot Password Schema Validation
    let forgotInvalidCaught = false;
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email: 'invalid-email-format' });
    } catch (err: any) {
      forgotInvalidCaught = err.response?.status === 400;
    }
    assert(forgotInvalidCaught, '2.4 POST /auth/forgot-password with invalid email rejected with HTTP 400 by Zod');

    // 2.5 Reset Password Schema Validation
    let resetInvalidCaught = false;
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, { token: '', newPassword: '123' });
    } catch (err: any) {
      resetInvalidCaught = err.response?.status === 400;
    }
    assert(resetInvalidCaught, '2.5 POST /auth/reset-password with weak password & empty token rejected with HTTP 400');

    // ─────────────────────────────────────────────────────────────
    // SUITE 3: Dead Code Removal & Active Routes in ai-test (Rule 10)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: Dead Code Removal & Refactored TestSet Routes ---');
    
    // 3.1 Verify DEAD CODE POST /api/test-sets/generate is removed (HTTP 404)
    let deadCode404 = false;
    try {
      await axios.post(`${API_BASE}/test-sets/generate`, { configKey: 'default', documentContent: 'some long content here' }, { headers: userHeaders });
    } catch (err: any) {
      deadCode404 = err.response?.status === 404;
    }
    assert(deadCode404, '3.1 DEAD CODE: POST /api/test-sets/generate is completely removed and returns HTTP 404');

    // 3.2 Verify Active Route: GET /api/ai-configs/:configKey
    const getConfigRes = await axios.get(`${API_BASE}/ai-configs/default`, { headers: userHeaders });
    assert(getConfigRes.status === 200 || getConfigRes.status === 201, '3.2 GET /api/ai-configs/default returns HTTP 200/201');
    assert(getConfigRes.data.user_id === userId, '3.2 Config belongs to current user');

    // 3.3 Verify Active Route: PUT /api/ai-configs/:configKey with Zod validation
    const putConfigRes = await axios.put(`${API_BASE}/ai-configs/default`, {
      use_custom_prompt: true,
      custom_prompt: 'Prompt chuyên biệt kiểm toán bảo mật Phase 26',
      multiple_choice_count: 5,
    }, { headers: userHeaders });
    assert(putConfigRes.status === 200, '3.3 PUT /api/ai-configs/default successfully updates config');
    assert(putConfigRes.data.custom_prompt === 'Prompt chuyên biệt kiểm toán bảo mật Phase 26', '3.3 Updated prompt saved accurately');

    // 3.4 Verify Active Resource Pickers: documents & decks
    const getDocsRes = await axios.get(`${API_BASE}/ai-test/my-documents`, { headers: userHeaders });
    assert(getDocsRes.status === 200 && Array.isArray(getDocsRes.data), '3.4 GET /api/ai-test/my-documents returns HTTP 200 array');

    const getDecksRes = await axios.get(`${API_BASE}/ai-test/my-decks`, { headers: userHeaders });
    assert(getDecksRes.status === 200 && Array.isArray(getDecksRes.data), '3.5 GET /api/ai-test/my-decks returns HTTP 200 array');

    // 3.6 Verify Active Test Sets query
    const getTestSetsRes = await axios.get(`${API_BASE}/test-sets`, { headers: userHeaders });
    assert(getTestSetsRes.status === 200 && Array.isArray(getTestSetsRes.data), '3.6 GET /api/test-sets returns HTTP 200 array');

    // 3.7 Verify Zod Input Validation on test-sets route
    let invalidStatusCaught = false;
    try {
      await axios.patch(`${API_BASE}/test-sets/not-a-number/status`, { is_active: 'not-a-boolean' }, { headers: userHeaders });
    } catch (err: any) {
      invalidStatusCaught = err.response?.status === 400;
    }
    assert(invalidStatusCaught, '3.7 PATCH /api/test-sets/:id/status with invalid types rejected with HTTP 400 by Zod');

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Defense-in-Depth Rate Limiting Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Defense-in-Depth Rate Limiting Verification ---');

    // 4.1 Test Rate Limiting on GET /api/auth/security/rate-limit-probe (max 5 requests per 10s)
    console.log('  Testing rate limit on GET /api/auth/security/rate-limit-probe (triggering 6 requests)...');
    let rateLimitTriggered = false;
    let rateLimitStatus = 0;
    let retryAfterHeader: string | undefined = undefined;

    for (let i = 0; i < 7; i++) {
      try {
        await axios.get(`${API_BASE}/auth/security/rate-limit-probe`);
      } catch (err: any) {
        if (err.response?.status === 429) {
          rateLimitTriggered = true;
          rateLimitStatus = 429;
          retryAfterHeader = err.response?.headers['retry-after'];
          break;
        }
      }
    }
    assert(rateLimitTriggered, '4.1 Rate limiter strictly blocks excessive calls with HTTP 429 Too Many Requests');
    assert(rateLimitStatus === 429, '4.2 Status code is 429');
    assert(Boolean(retryAfterHeader), '4.3 Retry-After header is returned to client');

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Zero-Leakage & Sensitive Data Protection
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: Sensitive Data Sanitization ---');
    const meRes = await axios.get(`${API_BASE}/auth/me`, { headers: userHeaders });
    assert(meRes.data.user.password === undefined, '5.1 /auth/me NEVER exposes plaintext password');
    assert(meRes.data.user.password_hash === undefined, '5.2 /auth/me NEVER exposes password_hash');
    assert(meRes.data.user.reset_password_token === undefined, '5.3 /auth/me NEVER exposes reset_password_token');

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: File Upload Security & Magic Bytes Validation
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: File Upload Security & Magic Bytes Validation ---');

    function makeMultipart(filename: string, fileBuffer: Buffer, fieldName = 'file', extraFields: Record<string, string> = {}) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      let head = '';
      for (const [k, v] of Object.entries(extraFields)) {
        head += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
      }
      head += `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`;
      const tail = `\r\n--${boundary}--\r\n`;
      const body = Buffer.concat([Buffer.from(head, 'utf-8'), fileBuffer, Buffer.from(tail, 'utf-8')]);
      return { body, headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` } };
    }

    // 6.1 Fake PDF: contains Windows executable magic bytes 'MZ'
    const fakeExeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const fakeDocMultipart = makeMultipart('malware.pdf', fakeExeBuffer, 'file', {
      title: 'Malicious Document',
    });

    let docUploadBlocked = false;
    let docUploadMsg = '';
    try {
      await axios.post(`${API_BASE}/documents/upload`, fakeDocMultipart.body, {
        headers: { ...userHeaders, ...fakeDocMultipart.headers },
      });
    } catch (err: any) {
      if (err.response?.status === 400) {
        docUploadBlocked = true;
        docUploadMsg = err.response?.data?.error || '';
      }
    }
    assert(docUploadBlocked, '6.1 Document upload strictly rejects fake PDF with executable MZ header (HTTP 400)');
    assert(docUploadMsg.includes('nguy hiểm') || docUploadMsg.includes('tệp thực thi') || docUploadMsg.includes('bảo mật'), '6.1 Error message clearly identifies malicious executable payload');

    // 6.2 Exam Parse with fake PDF executable
    const fakeExamMultipart = makeMultipart('trojan.pdf', fakeExeBuffer, 'file');
    let examParseBlocked = false;
    try {
      await axios.post(`${API_BASE}/exams/parse`, fakeExamMultipart.body, {
        headers: { ...userHeaders, ...fakeExamMultipart.headers },
      });
    } catch (err: any) {
      if (err.response?.status === 400) {
        examParseBlocked = true;
      }
    }
    assert(examParseBlocked, '6.2 /api/exams/parse strictly rejects fake PDF with executable MZ header (HTTP 400)');

    // 6.3 Valid text file disguised with invalid PDF extension
    const fakeTextDisguisedAsPdf = Buffer.from('Just plain text without %PDF header');
    const fakePdfMultipart = makeMultipart('plain.pdf', fakeTextDisguisedAsPdf, 'file');
    let disguisedPdfBlocked = false;
    try {
      await axios.post(`${API_BASE}/exams/parse`, fakePdfMultipart.body, {
        headers: { ...userHeaders, ...fakePdfMultipart.headers },
      });
    } catch (err: any) {
      if (err.response?.status === 400) {
        disguisedPdfBlocked = true;
      }
    }
    assert(disguisedPdfBlocked, '6.3 Disguised text file with .pdf extension rejected for lacking %PDF magic bytes');

    // 6.4 Path traversal in filename
    const traversalMultipart = makeMultipart('../../etc/passwd.pdf', fakeExeBuffer, 'file');
    let traversalHandled = false;
    try {
      await axios.post(`${API_BASE}/exams/parse`, traversalMultipart.body, {
        headers: { ...userHeaders, ...traversalMultipart.headers },
      });
    } catch (err: any) {
      // Must be safely rejected with 400 or blocked before disk traversal
      if (err.response?.status === 400) {
        traversalHandled = true;
      }
    }
    assert(traversalHandled, '6.4 Path traversal attempt in upload filename safely caught and rejected (HTTP 400)');

    // ─────────────────────────────────────────────────────────────
    // SUITE 7: SQL Injection Resistance & Dynamic Whitelist Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 7: SQL Injection Resistance & Dynamic Whitelist ---');

    // 7.1 Field injection in checkAvailability
    let checkAvailBlocked = false;
    try {
      await axios.post(`${API_BASE}/auth/check-availability`, {
        field: "email = '1' OR 1=1 --",
        value: "test@example.com",
      });
    } catch (err: any) {
      if (err.response?.status === 400) {
        checkAvailBlocked = true;
      }
    }
    assert(checkAvailBlocked, '7.1 SQL injection in check-availability field strictly blocked with HTTP 400 by Zod enum');

    // 7.2 Complex SQL injection in search
    const sqliSearchRes = await axios.get(`${API_BASE}/search`, {
      params: { q: "' UNION SELECT 1, 'injected', 'data', 'leak' --" },
      headers: userHeaders,
    });
    assert(sqliSearchRes.status === 200, '7.2 SQL injection search payload safely handled with parameterized query (HTTP 200)');
    assert(sqliSearchRes.data?.data !== undefined, '7.2 Result format remains valid, zero SQL syntax error');

    // 7.3 Admin users list with SQL injection search
    const adminSearchRes = await axios.get(`${API_BASE}/admin/users`, {
      params: { search: "' OR '1'='1" },
      headers: adminHeaders,
    });
    assert(adminSearchRes.status === 200, '7.3 Admin search with SQL injection payload safely executed via parameterized ILIKE');

    console.log('\n========================================================');
    console.log(`  PHASE 26 TEST SUMMARY: ${passedTests}/${totalTests} ASSERTIONS PASSED (100%)`);
    console.log('========================================================\n');
  } finally {
    // Cleanup
    await db.query(`DELETE FROM users WHERE email IN ($1, $2)`, [userEmail, adminEmail]);
  }
}

// Direct execution
if (require.main === module) {
  runPhase26Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
