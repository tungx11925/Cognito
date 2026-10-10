import axios from 'axios';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runPhase34Tests() {
  console.log('\n==================================================');
  console.log('🛡️  PHASE 34: SCHEMA CLEANUP & DEAD CODE VERIFICATION');
  console.log('==================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Database Schema Checks
  console.log('--- 1. Database Catalog Verification ---');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const deadTablesCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('purchased_resources', 'transactions', 'generation_jobs', 'ai_usage')
  `);
  assert(deadTablesCheck.rows.length === 0, 'Dead tables (purchased_resources, transactions, generation_jobs, ai_usage) are absent from DB');

  const deadColCheck = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
      AND column_name = 'wallet_balance'
  `);
  assert(deadColCheck.rows.length === 0, 'Dead column users.wallet_balance is absent from DB');

  // Check that core tables remain healthy
  const coreTablesCheck = await client.query(`
    SELECT count(*)::int as count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('users', 'documents', 'flashcard_decks', 'test_sets', 'quiz_attempts', 'community_resources', 'payment_orders')
  `);
  assert(coreTablesCheck.rows[0].count === 7, 'Core active tables remain 100% intact');

  await client.end();

  // 2. Dead Files Absence Verification
  console.log('\n--- 2. File System Deletion Verification ---');
  const projectRoot = path.join(__dirname, '../..');
  const deletedFiles = [
    'backend/src/routes/marketplace.routes.ts',
    'backend/src/controllers/marketplace.controller.ts',
    'backend/src/services/processing.service.ts',
    'backend/src/repositories/quiz-attempt.repository.ts',
    'backend/src/server2.ts',
    'backend/src/check_constraints.ts',
    'frontend/src/components/ai-test/EditTestModal.tsx',
    'frontend/src/components/dashboard/StreakChart.tsx',
    'frontend/src/components/documents/MammothRenderer.tsx',
    'frontend/src/components/flashcards/modes/SpellMode.tsx',
    'frontend/src/app/marketplace/page.tsx'
  ];

  for (const f of deletedFiles) {
    const fullPath = path.join(projectRoot, f);
    const exists = fs.existsSync(fullPath);
    assert(!exists, `Dead file purged from disk: ${f}`);
  }

  // 3. Purged Endpoints Verification
  console.log('\n--- 3. Purged API Routes Verification ---');
  // Register admin to test authenticated /admin routes
  const adminEmail = `admin_p34_${Date.now()}@example.com`;
  const adminName = `Admin Test ${Date.now()}`;
  const phone = '097' + Math.floor(1000000 + Math.random() * 9000000);
  const regRes = await axios.post(`${API_URL}/auth/register`, {
    email: adminEmail,
    name: adminName,
    password: 'Password123!',
    phone
  });
  const adminId = regRes.data.user.id;
  
  const client2 = new Client({ connectionString: process.env.DATABASE_URL });
  await client2.connect();
  await client2.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminId]);
  await client2.end();

  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: adminEmail,
    password: 'Password123!'
  });
  const adminToken = loginRes.data.token || loginRes.data.accessToken;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // Attempting to access legacy /api/admin/transactions as admin should return 404 (not found)
  const resAdmin = await axios.get(`${API_URL}/admin/transactions`, {
    headers: adminHeaders,
    validateStatus: () => true
  });
  assert(resAdmin.status === 404, `Legacy route /admin/transactions returns 404 for admin (Actual: ${resAdmin.status})`);

  // Attempting to access legacy /api/marketplace should return 404
  const resMarket = await axios.get(`${API_URL}/marketplace/resources`, {
    headers: adminHeaders,
    validateStatus: () => true
  });
  assert(resMarket.status === 404, `Legacy route /marketplace/resources returns 404 (Actual: ${resMarket.status})`);

  // 4. Healthy API Check
  console.log('\n--- 4. Active API Sanity Check ---');
  const healthRes = await axios.get(`${API_URL.replace('/api', '')}/health`);
  assert(healthRes.status === 200, 'Backend /health responds HTTP 200 OK');

  console.log(`\n🎉 ALL PHASE 34 VERIFICATION TESTS PASSED (${passedTests}/${totalTests})!`);
}

runPhase34Tests().catch(err => {
  console.error('\n❌ Test failure:', err.message);
  if (err.response?.data) {
    console.error('Response data:', JSON.stringify(err.response.data));
  }
  process.exit(1);
});
