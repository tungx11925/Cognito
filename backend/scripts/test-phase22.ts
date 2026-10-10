import axios from 'axios';
import assert from 'assert';
import { db } from '../src/db';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

interface TestUser {
  id: number;
  email: string;
  name: string;
  token: string;
  headers: { Authorization: string };
}

async function createTestUser(email: string, name: string, role = 'student'): Promise<TestUser> {
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

  if (role !== 'student' && role !== 'user') {
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
    name: uniqueName,
    token,
    headers: { Authorization: `Bearer ${token}` },
  };
}

export async function runPhase22Tests() {
  console.log('\n========================================================');
  console.log('       COGNITO PHASE 22: SEARCH SYSTEM TEST SUITE        ');
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

  // 1. Setup Test Users
  const userA = await createTestUser(`search_a_${Date.now()}@example.com`, 'Nguyễn Văn An');
  const userB = await createTestUser(`search_b_${Date.now()}@example.com`, 'Trần Thị Bích');
  const userC = await createTestUser(`search_c_${Date.now()}@example.com`, 'Lê Hoàng Cường');

  // 2. Setup Documents (Private & Public)
  // User A has 1 Private and 1 Public doc
  const docA1Res = await db.query(
    `INSERT INTO documents (user_id, title, description, category, doc_url, visibility, status)
     VALUES ($1, 'Giáo trình Hóa học Hữu cơ Đại cương', 'Nghiên cứu về liên kết pi và phản ứng cộng electrophin', 'Hóa học', 'https://storage.test/docA1.pdf', 'private', 'READY')
     RETURNING id`,
    [userA.id]
  );
  const docA1Id = docA1Res.rows[0].id;

  const docA2Res = await db.query(
    `INSERT INTO documents (user_id, title, description, category, doc_url, visibility, status)
     VALUES ($1, 'Đại số Tuyến tính và Hình học Giải tích', 'Ma trận trực giao, định thức và không gian vector', 'Toán học', 'https://storage.test/docA2.pdf', 'public', 'READY')
     RETURNING id`,
    [userA.id]
  );
  const docA2Id = docA2Res.rows[0].id;

  // User B has 1 Private doc
  const docB1Res = await db.query(
    `INSERT INTO documents (user_id, title, description, category, doc_url, visibility, status)
     VALUES ($1, 'Bí mật Kinh tế Học Vi mô Bích', 'Tài liệu độc quyền chỉ dành riêng cho Bích', 'Kinh tế', 'https://storage.test/docB1.pdf', 'private', 'READY')
     RETURNING id`,
    [userB.id]
  );
  const docB1Id = docB1Res.rows[0].id;

  // 3. Setup Community Resources
  const comm1Res = await db.query(
    `INSERT INTO community_resources (user_id, resource_type, resource_id, title, description, tags, is_public, like_count, save_count)
     VALUES ($1, 'document', $2, 'Cẩm nang Ôn thi Hóa học 12', 'Tổng hợp mẹo giải nhanh Hóa học hữu cơ cực hay', ARRAY['hoa_hoc', 'on_thi'], true, 15, 20)
     RETURNING id`,
    [userA.id, docA2Id]
  );
  const comm1Id = comm1Res.rows[0].id;

  const commHiddenRes = await db.query(
    `INSERT INTO community_resources (user_id, resource_type, resource_id, title, description, tags, is_public)
     VALUES ($1, 'document', $2, 'Tài nguyên Bị Ẩn do Vi phạm Hóa học', 'Mô tả tài nguyên ẩn', ARRAY['spam'], false)
     RETURNING id`,
    [userB.id, docB1Id]
  );
  const commHiddenId = commHiddenRes.rows[0].id;

  // 4. Setup Question Sets (test_sets)
  const testSet1Res = await db.query(
    `INSERT INTO test_sets (name, total_questions, total_score, is_active, status, created_by)
     VALUES ('Đề thi thử Toán học Chuyên sâu 2026', 20, 10.0, true, 'APPROVED', $1)
     RETURNING id`,
    [userA.id]
  );
  const testSet1Id = testSet1Res.rows[0].id;

  // Publish testSet1 to community
  await db.query(
    `INSERT INTO community_resources (user_id, resource_type, resource_id, title, description, tags, is_public, is_hidden)
     VALUES ($1, 'test_set', $2, 'Đề thi thử Toán học Chuyên sâu 2026', 'Bộ đề thi toán hay', ARRAY['toan'], true, false)`,
    [userA.id, testSet1Id]
  );

  // Draft test set of User A (should NOT be publicly searchable)
  const testSetDraftRes = await db.query(
    `INSERT INTO test_sets (name, total_questions, total_score, is_active, status, created_by)
     VALUES ('Đề thi Toán học Bản nháp chưa duyệt', 5, 5.0, true, 'DRAFT', $1)
     RETURNING id`,
    [userA.id]
  );
  const testSetDraftId = testSetDraftRes.rows[0].id;

  // Private test set belonging to User B
  const testSetBRes = await db.query(
    `INSERT INTO test_sets (name, total_questions, total_score, is_active, status, created_by)
     VALUES ('Đề thi riêng tư của Bích', 10, 10.0, true, 'DRAFT', $1)
     RETURNING id`,
    [userB.id]
  );
  const testSetBId = testSetBRes.rows[0].id;

  // =========================================================================
  // SUITE 1: DOCUMENT SEARCH & PRIVACY ENFORCEMENT
  // =========================================================================
  console.log('--- SUITE 1: Document Search & Zero Private Data Leakage ---');

  // 1.1 User A can search and find their own private document
  const searchAOwn = await axios.get(`${API_BASE}/search?tab=documents&q=Hóa học`, { headers: userA.headers });
  testAssert(searchAOwn.status === 200, '1.1 GET /api/search?tab=documents returns HTTP 200');
  const foundA1 = searchAOwn.data.data.items.some((d: any) => d.id === docA1Id);
  testAssert(foundA1, '1.2 User A can find their own private document');

  // 1.3 User B searching for "Hóa học" cannot see User A's private document docA1
  const searchBOwn = await axios.get(`${API_BASE}/search?tab=documents&q=Hóa học`, { headers: userB.headers });
  const leakA1ToB = searchBOwn.data.data.items.some((d: any) => d.id === docA1Id);
  testAssert(!leakA1ToB, '1.3 ZERO LEAKAGE: User B CANNOT see User A private document');

  // 1.4 User B searching for "Đại số" can find User A's public document docA2
  const searchBPublic = await axios.get(`${API_BASE}/search?tab=documents&q=Đại số`, { headers: userB.headers });
  const foundA2ByB = searchBPublic.data.data.items.some((d: any) => d.id === docA2Id);
  testAssert(foundA2ByB, '1.4 User B CAN find User A public document');

  // 1.5 Unauthenticated user cannot see any private documents
  const searchGuest = await axios.get(`${API_BASE}/search?tab=documents&q=Kinh tế`);
  const leakBToGuest = searchGuest.data.data.items.some((d: any) => d.id === docB1Id);
  testAssert(!leakBToGuest, '1.5 Guest user CANNOT see private documents');

  // 1.6 Verify sensitive columns (raw_text, solution_text, doc_url) are stripped
  if (searchBPublic.data.data.items.length > 0) {
    const sampleDoc = searchBPublic.data.data.items[0];
    testAssert(sampleDoc.raw_text === undefined, '1.6.1 raw_text is completely stripped');
    testAssert(sampleDoc.solution_text === undefined, '1.6.2 solution_text is completely stripped');
    testAssert(sampleDoc.doc_url === undefined, '1.6.3 doc_url is completely stripped');
  }

  // =========================================================================
  // SUITE 2: VIETNAMESE SEARCH (UNACCENT & CASE-INSENSITIVE)
  // =========================================================================
  console.log('\n--- SUITE 2: Vietnamese Search (Unaccent & Case-Insensitive) ---');

  // 2.1 Searching "hoa hoc" without accents matches "Hóa học"
  const unaccentSearch1 = await axios.get(`${API_BASE}/search?tab=documents&q=hoa hoc`, { headers: userA.headers });
  const foundUnaccent1 = unaccentSearch1.data.data.items.some((d: any) => d.id === docA1Id);
  testAssert(foundUnaccent1, '2.1 Searching "hoa hoc" (unaccented) successfully matches "Hóa học"');

  // 2.2 Searching "dai so" without accents matches "Đại số"
  const unaccentSearch2 = await axios.get(`${API_BASE}/search?tab=documents&q=dai so`, { headers: userB.headers });
  const foundUnaccent2 = unaccentSearch2.data.data.items.some((d: any) => d.id === docA2Id);
  testAssert(foundUnaccent2, '2.2 Searching "dai so" (unaccented) successfully matches "Đại số Tuyến tính"');

  // 2.3 Uppercase / Lowercase invariance
  const caseSearch = await axios.get(`${API_BASE}/search?tab=documents&q=ĐẠI SỐ`, { headers: userB.headers });
  const foundCase = caseSearch.data.data.items.some((d: any) => d.id === docA2Id);
  testAssert(foundCase, '2.3 Searching "ĐẠI SỐ" (UPPERCASE) successfully matches');

  // =========================================================================
  // SUITE 3: COMMUNITY RESOURCES SEARCH
  // =========================================================================
  console.log('\n--- SUITE 3: Community Resources Search ---');

  // 3.1 Searching community feed by title keyword
  const commSearch = await axios.get(`${API_BASE}/search?tab=community&q=cam nang on thi`);
  testAssert(commSearch.status === 200, '3.1 GET /api/search?tab=community returns HTTP 200');
  const foundComm1 = commSearch.data.data.items.some((c: any) => c.id === comm1Id);
  testAssert(foundComm1, '3.2 Public community resource found by unaccented title');

  // 3.2 Hidden / Unapproved resource is strictly excluded
  const foundHidden = commSearch.data.data.items.some((c: any) => c.id === commHiddenId);
  testAssert(!foundHidden, '3.3 Hidden/Private community resource is strictly EXCLUDED');

  // 3.3 Popularity sorting
  const commPopular = await axios.get(`${API_BASE}/search?tab=community&sort=popular`);
  testAssert(commPopular.status === 200, '3.4 Community search with sort=popular returns HTTP 200');

  // =========================================================================
  // SUITE 4: QUESTION SETS SEARCH
  // =========================================================================
  console.log('\n--- SUITE 4: Question Sets Search ---');

  // 4.1 Searching question sets
  const qsSearch = await axios.get(`${API_BASE}/search?tab=question_sets&q=toan hoc`);
  testAssert(qsSearch.status === 200, '4.1 GET /api/search?tab=question_sets returns HTTP 200');
  const foundQS1 = qsSearch.data.data.items.some((q: any) => q.id === testSet1Id);
  testAssert(foundQS1, '4.2 Public/published question set is found');

  // 4.2 User C cannot see User B's private test set
  const qsSearchC = await axios.get(`${API_BASE}/search?tab=question_sets&q=Bích`, { headers: userC.headers });
  const leakTestSetB = qsSearchC.data.data.items.some((q: any) => q.id === testSetBId);
  testAssert(!leakTestSetB, '4.3 Private test set of User B is NOT leaked to User C');

  // 4.4 DRAFT test set of User A is NOT discoverable in public search by User C
  const leakDraftToC = qsSearchC.data.data.items.some((q: any) => q.id === testSetDraftId);
  testAssert(!leakDraftToC, '4.4 DRAFT test set is NOT discoverable in public search by other users');

  // 4.5 User A (owner) CAN search and find their own DRAFT test set
  const qsSearchA = await axios.get(`${API_BASE}/search?tab=question_sets&q=Ban nhap`, { headers: userA.headers });
  const foundDraftByOwner = qsSearchA.data.data.items.some((q: any) => q.id === testSetDraftId);
  testAssert(foundDraftByOwner, '4.5 Owner CAN find their own DRAFT test sets');

  // =========================================================================
  // SUITE 5: PUBLIC PROFILE SEARCH & SECURITY
  // =========================================================================
  console.log('\n--- SUITE 5: Public Profile Search & Privacy Guardrails ---');

  // 5.1 Search profiles by name without accents
  const profileSearch = await axios.get(`${API_BASE}/search?tab=profiles&q=nguyen van an`);
  testAssert(profileSearch.status === 200, '5.1 GET /api/search?tab=profiles returns HTTP 200');
  const foundUserA = profileSearch.data.data.items.some((u: any) => u.id === userA.id);
  testAssert(foundUserA, '5.2 Profile found by unaccented name "nguyen van an"');

  // 5.2 ANTI-LEAK: Check sensitive user fields are NOT exposed
  if (profileSearch.data.data.items.length > 0) {
    const prof = profileSearch.data.data.items[0];
    testAssert(prof.email === undefined, '5.3.1 email is NOT exposed in public profile search');
    testAssert(prof.password === undefined, '5.3.2 password is NOT exposed');
    testAssert(prof.phone === undefined, '5.3.3 phone is NOT exposed');
    testAssert(prof.wallet_balance === undefined, '5.3.4 wallet_balance is NOT exposed');
  }

  // 5.3 Bi-directional block filtering
  // User B blocks User A
  await db.query(
    `INSERT INTO user_blocks (blocker_id, blocked_id, reason)
     VALUES ($1, $2, 'Test block')
     ON CONFLICT DO NOTHING`,
    [userB.id, userA.id]
  );

  // User B searching profiles should NOT see User A
  const searchBAfterBlock = await axios.get(`${API_BASE}/search?tab=profiles&q=nguyen van an`, { headers: userB.headers });
  const userASeenByB = searchBAfterBlock.data.data.items.some((u: any) => u.id === userA.id);
  testAssert(!userASeenByB, '5.4 Blocked user is NOT returned in profile search');

  // Cleanup block
  await db.query('DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2', [userB.id, userA.id]);

  // =========================================================================
  // SUITE 6: SEARCH SUGGESTIONS & AUTOCOMPLETE
  // =========================================================================
  console.log('\n--- SUITE 6: Search Suggestions & Autocomplete API ---');

  const suggRes = await axios.get(`${API_BASE}/search/suggestions?q=hoa`);
  testAssert(suggRes.status === 200, '6.1 GET /api/search/suggestions returns HTTP 200');
  testAssert(Array.isArray(suggRes.data.data), '6.2 Suggestions data is an array');
  const hasSuggestion = suggRes.data.data.some((s: any) => s.text.toLowerCase().includes('hóa') || s.text.toLowerCase().includes('hoa'));
  testAssert(hasSuggestion, '6.3 Suggestion contains matched keyword');

  // =========================================================================
  // SUITE 7: UNIFIED SEARCH OVERVIEW (tab=all)
  // =========================================================================
  console.log('\n--- SUITE 7: Unified Search Overview (tab=all) ---');

  const allRes = await axios.get(`${API_BASE}/search?q=toan hoc`, { headers: userA.headers });
  testAssert(allRes.status === 200, '7.1 GET /api/search?q=toan hoc returns HTTP 200');
  testAssert(allRes.data.data.tab === 'all', '7.2 Returned tab is all');
  testAssert(allRes.data.data.results.documents !== undefined, '7.3 Documents section present');
  testAssert(allRes.data.data.results.community !== undefined, '7.4 Community section present');
  testAssert(allRes.data.data.results.question_sets !== undefined, '7.5 Question sets section present');
  testAssert(allRes.data.data.results.profiles !== undefined, '7.6 Profiles section present');

  // =========================================================================
  // SUITE 8: FILTER, SORT & PAGINATION
  // =========================================================================
  console.log('\n--- SUITE 8: Filter, Sort & Pagination ---');

  // 8.1 Category filter
  const filterCat = await axios.get(`${API_BASE}/search?tab=documents&category=Toán học`, { headers: userA.headers });
  const allMath = filterCat.data.data.items.every((d: any) => d.category === 'Toán học');
  testAssert(allMath, '8.1 Category filter correctly narrows down results');

  // 8.2 Pagination metadata
  testAssert(typeof filterCat.data.data.page === 'number', '8.2.1 page is present');
  testAssert(typeof filterCat.data.data.limit === 'number', '8.2.2 limit is present');
  testAssert(typeof filterCat.data.data.total === 'number', '8.2.3 total is present');
  testAssert(typeof filterCat.data.data.totalPages === 'number', '8.2.4 totalPages is present');

  // Cleanup test data
  await db.query('DELETE FROM community_resources WHERE id IN ($1, $2)', [comm1Id, commHiddenId]);
  await db.query('DELETE FROM test_sets WHERE id IN ($1, $2, $3)', [testSet1Id, testSetBId, testSetDraftId]);
  await db.query('DELETE FROM documents WHERE id IN ($1, $2, $3)', [docA1Id, docA2Id, docB1Id]);
  await db.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [userA.id, userB.id, userC.id]);

  console.log('\n========================================================');
  console.log(`  PHASE 22 TEST SUMMARY: ${passedTests}/${totalTests} ASSERTIONS PASSED (100%)`);
  console.log('========================================================\n');

  return { passedTests, totalTests };
}

if (require.main === module) {
  runPhase22Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Phase 22 tests failed:', err);
      process.exit(1);
    });
}
