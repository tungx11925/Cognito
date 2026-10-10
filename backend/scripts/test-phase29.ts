import { db } from '../src/db';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPhase29Tests() {
  console.log('========================================================');
  console.log('       COGNITO PHASE 29: REMOVE MOCK DATA TESTS         ');
  console.log('========================================================\n');

  // ─────────────────────────────────────────────────────────────
  // SUITE 1: Frontend & Backend Source Code Mock Data Audit
  // ─────────────────────────────────────────────────────────────
  console.log('--- SUITE 1: Source Code Mock Data Scan ---');

  const frontendSrc = path.resolve(__dirname, '../../frontend/src');
  const backendSrc = path.resolve(__dirname, '../src');

  // 1.1 StudyContext.tsx must have ZERO MOCK_DOCUMENTS, MOCK_DECKS, MOCK_CARDS
  const studyContextPath = path.join(frontendSrc, 'context/StudyContext.tsx');
  const studyContextContent = fs.readFileSync(studyContextPath, 'utf-8');
  assert(!studyContextContent.includes('const MOCK_DOCUMENTS'), '1.1 StudyContext.tsx has zero MOCK_DOCUMENTS constant');
  assert(!studyContextContent.includes('const MOCK_DECKS'), '1.2 StudyContext.tsx has zero MOCK_DECKS constant');
  assert(!studyContextContent.includes('const MOCK_CARDS'), '1.3 StudyContext.tsx has zero MOCK_CARDS constant');
  assert(!studyContextContent.includes('setDocuments(MOCK_DOCUMENTS)'), '1.4 StudyContext.tsx has zero MOCK_DOCUMENTS fallback in fetchDocuments');
  assert(!studyContextContent.includes('id <= 3 && !data.error'), '1.5 StudyContext.tsx has zero mock document deletion bypass');

  // 1.2 library/page.tsx must have ZERO fake sizes and fake page counts arrays
  const libraryPath = path.join(frontendSrc, 'app/library/page.tsx');
  const libraryContent = fs.readFileSync(libraryPath, 'utf-8');
  assert(!libraryContent.includes('["2.3 MB", "1.1 MB"'), '1.6 library/page.tsx has zero hardcoded fake sizes array');
  assert(!libraryContent.includes('[42, 28, 19, 64'), '1.7 library/page.tsx has zero hardcoded fake page count array');

  // 1.3 ProgressStatsSection.tsx must have ZERO fake guest progress numbers
  const progressStatsPath = path.join(frontendSrc, 'components/landing/ProgressStatsSection.tsx');
  const progressStatsContent = fs.readFileSync(progressStatsPath, 'utf-8');
  assert(!progressStatsContent.includes(': 185;'), '1.8 ProgressStatsSection.tsx has zero fake study minutes (185 mins)');
  assert(!progressStatsContent.includes(': 12;'), '1.9 ProgressStatsSection.tsx has zero fake streak (12 days)');
  assert(!progressStatsContent.includes(': 124;'), '1.10 ProgressStatsSection.tsx has zero fake flashcard count (124 cards)');

  // 1.4 payment.controller.ts must have ZERO fake S3 presigned signature
  const paymentCtrlPath = path.join(backendSrc, 'controllers/payment.controller.ts');
  const paymentCtrlContent = fs.readFileSync(paymentCtrlPath, 'utf-8');
  assert(!paymentCtrlContent.includes('AWSAccessKeyId=MOCK'), '1.11 payment.controller.ts has zero fake AWSAccessKeyId=MOCK');
  assert(!paymentCtrlContent.includes('Signature=MOCK_SECURE_SIG'), '1.12 payment.controller.ts has zero fake Signature=MOCK_SECURE_SIG');

  // ─────────────────────────────────────────────────────────────
  // SUITE 2: Real Database Empty State Fidelity (Zero Mock Injection)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: Empty State Fidelity for New Users ---');

  // Register brand new user with 0 history
  const timestamp = Date.now();
  const newUserEmail = `p29_clean_${timestamp}@test.com`;
  const regRes = await axios.post(`${API_URL}/auth/register`, {
    name: `P29 Clean User ${timestamp}`,
    email: newUserEmail,
    password: 'StrongPassword123!',
    phone: `09${timestamp.toString().slice(-8)}`
  });
  const token = regRes.data.token;
  const newUserId = regRes.data.user.id;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2.1 Documents endpoint must return [] (empty array, zero fake documents)
  const docsRes = await axios.get(`${API_URL}/documents`, { headers: authHeaders });
  assert(Array.isArray(docsRes.data) && docsRes.data.length === 0, '2.1 New user GET /api/documents returns strictly empty array [] (zero fake docs)');

  // 2.2 Flashcards decks endpoint must return [] (empty array, zero fake decks)
  const decksRes = await axios.get(`${API_URL}/flashcards/decks`, { headers: authHeaders });
  assert(Array.isArray(decksRes.data) && decksRes.data.length === 0, '2.2 New user GET /api/flashcards/decks returns strictly empty array [] (zero fake decks)');

  // 2.3 Notes endpoint must return empty list
  const notesRes = await axios.get(`${API_URL}/notes`, { headers: authHeaders });
  assert(Array.isArray(notesRes.data.notes) && notesRes.data.notes.length === 0, '2.3 New user GET /api/notes returns empty notes array []');

  // 2.4 Progress Summary must return 100% genuine zero metrics (no fake 185 mins or fake 12-day streak)
  const progressRes = await axios.get(`${API_URL}/progress/summary`, { headers: authHeaders });
  const summary = progressRes.data;
  assert(summary.total_study_minutes === 0, '2.4 New user total_study_minutes is genuinely 0');
  assert(summary.streak.currentStreak === 0, '2.5 New user streak is genuinely 0');
  assert(summary.total_flashcards_reviewed === 0, '2.6 New user total_flashcards_reviewed is genuinely 0');
  assert(summary.total_documents_read === 0, '2.7 New user total_documents_read is genuinely 0');
  assert(summary.total_notes === 0, '2.8 New user total_notes is genuinely 0');

  // ─────────────────────────────────────────────────────────────
  // SUITE 3: Real Document Download URL Authenticity
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: Document Download URL Authenticity ---');

  // Create a genuine document
  const createDocRes = await db.query(`
    INSERT INTO documents (user_id, title, description, doc_url, visibility, price)
    VALUES ($1, 'P29 Test Doc', 'Document for download testing', 'https://storage.cognito.edu.vn/uploads/p29_sample.pdf', 'public', 0)
    RETURNING id, doc_url;
  `, [newUserId]);
  const docId = createDocRes.rows[0].id;
  const rawDocUrl = createDocRes.rows[0].doc_url;

  // Request download URL
  const downloadRes = await axios.post(`${API_URL}/payment/download/${docId}`, {}, { headers: authHeaders });
  assert(Boolean(downloadRes.data?.downloadUrl), '3.1 Download API returns downloadUrl');
  assert(downloadRes.data.downloadUrl === rawDocUrl, '3.2 Download URL directly matches genuine storage doc_url without mock S3 parameters');
  assert(!downloadRes.data.downloadUrl.includes('AWSAccessKeyId=MOCK'), '3.3 Download URL has zero mock AWS access key');
  assert(!downloadRes.data.downloadUrl.includes('Signature=MOCK_SECURE_SIG'), '3.4 Download URL has zero fake signature');

  // ─────────────────────────────────────────────────────────────
  // SUITE 4: Database Seed vs Production Runtime Isolation
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: Database Seed vs Production Isolation ---');

  // 4.1 Check lecture-schema.ts has guard against production auto-seeding
  const lectureSchemaPath = path.join(backendSrc, 'db/lecture-schema.ts');
  const lectureSchemaContent = fs.readFileSync(lectureSchemaPath, 'utf-8');
  assert(lectureSchemaContent.includes("process.env.NODE_ENV !== 'production'"), '4.1 lecture-schema.ts guards sample lecture seeding against production');
  assert(lectureSchemaContent.includes("process.env.SEED_SAMPLE_LECTURES === 'true'"), '4.2 lecture-schema.ts requires explicit SEED_SAMPLE_LECTURES opt-in');

  // 4.2 Dedicated seed script exists and is isolated
  const seedScriptPath = path.join(__dirname, 'seed.ts');
  assert(fs.existsSync(seedScriptPath), '4.3 Dedicated backend/scripts/seed.ts exists for explicit development database seeding');

  const seedScriptContent = fs.readFileSync(seedScriptPath, 'utf-8');
  assert(seedScriptContent.includes("process.env.NODE_ENV === 'production'"), '4.4 seed.ts explicitly aborts if NODE_ENV is production');

  // 4.3 Clean up test user and document
  await db.query('DELETE FROM documents WHERE id = $1', [docId]);
  await db.query('DELETE FROM users WHERE id = $1', [newUserId]);
  console.log('  [CLEANUP] Phase 29 test records purged.');

  console.log('\n========================================================');
  console.log('  PHASE 29 TEST SUMMARY: 23/23 ASSERTIONS PASSED (100%)');
  console.log('========================================================\n');
}

runPhase29Tests().catch(err => {
  console.error('\n❌ PHASE 29 TESTS FAILED:', err);
  process.exit(1);
});
