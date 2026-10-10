import { Client } from 'pg';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runPhase35ArchitectureVerification() {
  console.log('\n===============================================================');
  console.log('🏛️  COGNITO PHASE 35: FINAL ARCHITECTURE VERIFICATION TEST');
  console.log('===============================================================\n');

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

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // -------------------------------------------------------------
    // SUITE 1: DATABASE CATALOG VERIFICATION (NO SCHOOL / NO LEGACY)
    // -------------------------------------------------------------
    console.log('--- SUITE 1: Database Catalog Cleanliness (No School / Org Tables & Columns) ---');

    // 1.1 Verify absence of 12 legacy school tables
    const legacySchoolTables = [
      'organizations',
      'majors',
      'academic_years',
      'semesters',
      'subjects',
      'school_classes',
      'organization_members',
      'class_enrollments',
      'class_teacher_assignments',
      'class_assignments',
      'assignment_attempts',
      'attempt_answers'
    ];

    const foundSchoolTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = ANY($1::text[])
    `, [legacySchoolTables]);

    assert(
      foundSchoolTables.rows.length === 0,
      `Zero legacy school/teacher tables in database (Found: ${foundSchoolTables.rows.length})`
    );

    // 1.2 Verify absence of any _deprecated_* tables
    const deprecatedTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '_deprecated_%'
    `);
    assert(
      deprecatedTables.rows.length === 0,
      `Zero _deprecated_* tables exist in PostgreSQL (Found: ${deprecatedTables.rows.length})`
    );

    // 1.3 Verify absence of dead prototype tables dropped in Phase 34
    const deadTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('purchased_resources', 'transactions', 'generation_jobs', 'ai_usage')
    `);
    assert(
      deadTables.rows.length === 0,
      `Zero Phase 34 dead tables in database (Found: ${deadTables.rows.length})`
    );

    // 1.4 Verify absence of legacy school/wallet columns
    const legacyColumns = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND (
          (table_name = 'users' AND column_name IN ('primary_organization_id', 'school_code', 'wallet_balance'))
          OR (table_name = 'documents' AND column_name = 'organization_id')
        )
    `);
    assert(
      legacyColumns.rows.length === 0,
      `Zero legacy school/wallet columns in database (Found: ${legacyColumns.rows.length})`
    );

    // 1.5 Verify absence of legacy School ENUM types
    const legacyEnums = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('academic_status', 'semester_status', 'enrollment_status', 'attempt_status')
    `);
    assert(
      legacyEnums.rows.length === 0,
      `Zero legacy school ENUM types in PostgreSQL (Found: ${legacyEnums.rows.length})`
    );

    // -------------------------------------------------------------
    // SUITE 2: USER & ROLE INTEGRITY (ONLY ADMIN AND USER)
    // -------------------------------------------------------------
    console.log('\n--- SUITE 2: Role Integrity Verification (Only ADMIN and USER) ---');

    // 2.1 Verify CHECK constraint on users.role
    const roleConstraint = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'users'::regclass
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) LIKE '%role%'
    `);
    assert(
      roleConstraint.rows.length > 0 &&
      roleConstraint.rows[0].def.includes("'user'") &&
      roleConstraint.rows[0].def.includes("'admin'") &&
      !roleConstraint.rows[0].def.includes("'teacher'") &&
      !roleConstraint.rows[0].def.includes("'student'"),
      `users.role CHECK constraint strictly allows only ('user', 'admin')`
    );

    // 2.2 Verify that all existing users have role in ('user', 'admin')
    const distinctRoles = await client.query(`
      SELECT DISTINCT role FROM users ORDER BY role
    `);
    const rolesList = distinctRoles.rows.map(r => r.role);
    const hasOnlyValidRoles = rolesList.every(r => r === 'user' || r === 'admin');
    assert(
      hasOnlyValidRoles,
      `100% of existing user accounts have role 'user' or 'admin' (Roles present: ${rolesList.join(', ')})`
    );

    // 2.3 Verify rejection of invalid roles (teacher, student, premium)
    let rejectedTeacher = false;
    try {
      await client.query(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ('arch_test_teacher@cognito.test', 'hash', 'Test Teacher', 'teacher')
      `);
    } catch {
      rejectedTeacher = true;
    }
    assert(rejectedTeacher, `PostgreSQL strictly rejects inserting user with legacy role 'teacher'`);

    let rejectedStudent = false;
    try {
      await client.query(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ('arch_test_student@cognito.test', 'hash', 'Test Student', 'student')
      `);
    } catch {
      rejectedStudent = true;
    }
    assert(rejectedStudent, `PostgreSQL strictly rejects inserting user with legacy role 'student'`);

    // -------------------------------------------------------------
    // SUITE 3: BACKEND API SURFACE VERIFICATION (NO SCHOOL / NO AI FLASHCARD GEN)
    // -------------------------------------------------------------
    console.log('\n--- SUITE 3: Backend API Surface (Zero Legacy Endpoints) ---');

    const jwt = require('jsonwebtoken');
    const authToken = jwt.sign(
      { id: 1, email: 'arch_verifier@cognito.test', role: 'user' },
      process.env.JWT_SECRET_KEY || 'test-secret'
    );
    const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };

    // 3.1 School route returns 404
    let school404 = false;
    try {
      await axios.get(`${API_URL}/school/classes`, authHeaders);
    } catch (err: any) {
      school404 = err.response?.status === 404;
    }
    assert(school404, `GET /api/school/* returns HTTP 404 Not Found`);

    // 3.2 Teacher route returns 404
    let teacher404 = false;
    try {
      await axios.get(`${API_URL}/teacher/classes`, authHeaders);
    } catch (err: any) {
      teacher404 = err.response?.status === 404;
    }
    assert(teacher404, `GET /api/teacher/* returns HTTP 404 Not Found`);

    // 3.3 Organizations route returns 404
    let org404 = false;
    try {
      await axios.get(`${API_URL}/organizations`, authHeaders);
    } catch (err: any) {
      org404 = err.response?.status === 404;
    }
    assert(org404, `GET /api/organizations returns HTTP 404 Not Found`);

    // 3.4 AI Flashcards generation from file returns 404 (Removed in Phase 2)
    let aiFlashcardGen404 = false;
    try {
      await axios.post(`${API_URL}/ai/generate-flashcards-from-file`, {}, authHeaders);
    } catch (err: any) {
      aiFlashcardGen404 = err.response?.status === 404;
    }
    assert(aiFlashcardGen404, `POST /api/ai/generate-flashcards-from-file returns HTTP 404 Not Found`);

    // 3.5 Marketplace routes return 404 (Unmounted in Phase 31 & Dropped in Phase 34)
    let marketplace404 = false;
    try {
      await axios.get(`${API_URL}/marketplace/resources`, authHeaders);
    } catch (err: any) {
      marketplace404 = err.response?.status === 404;
    }
    assert(marketplace404, `GET /api/marketplace/* returns HTTP 404 Not Found`);

    // -------------------------------------------------------------
    // SUITE 4: BACKEND CODEBASE VERIFICATION (ZERO DEAD FILES)
    // -------------------------------------------------------------
    console.log('\n--- SUITE 4: Backend Codebase Verification (Zero School/Teacher Code Files) ---');

    const backendRoot = path.join(__dirname, '..');
    const absentBackendFiles = [
      'src/routes/school.routes.ts',
      'src/routes/attempt.routes.ts',
      'src/controllers/school.controller.ts',
      'src/controllers/attempt.controller.ts',
      'src/controllers/academic.controller.ts',
      'src/services/academic.service.ts',
      'src/services/assignment.service.ts',
      'src/services/assignment-attempt.service.ts',
      'src/services/organization.service.ts',
      'src/services/bulk-import.service.ts',
      'src/middlewares/orgRole.middleware.ts',
      'src/routes/marketplace.routes.ts',
      'src/controllers/marketplace.controller.ts',
      'src/services/processing.service.ts',
      'src/repositories/quiz-attempt.repository.ts',
      'src/server2.ts',
      'src/check_constraints.ts'
    ];

    for (const relFile of absentBackendFiles) {
      const fullPath = path.join(backendRoot, relFile);
      assert(!fs.existsSync(fullPath), `Verified absence of backend file: ${relFile}`);
    }

    // -------------------------------------------------------------
    // SUITE 5: FRONTEND ARCHITECTURE VERIFICATION (NO SCHOOL / NO TEACHER STUDIO)
    // -------------------------------------------------------------
    console.log('\n--- SUITE 5: Frontend Architecture Verification (No School / Teacher / Studio) ---');

    const frontendRoot = path.join(__dirname, '../../frontend');
    const absentFrontendPaths = [
      'src/app/school',
      'src/app/teacher',
      'src/app/student',
      'src/app/testhome',
      'src/app/marketplace',
      'src/app/ai-lab',
      'src/app/premium-preview',
      'src/components/teacher',
      'src/components/teacher/TeacherStudioSection.tsx',
      'src/components/flashcards/AIFlashcardLab.tsx'
    ];

    for (const relPath of absentFrontendPaths) {
      const fullPath = path.join(frontendRoot, relPath);
      assert(!fs.existsSync(fullPath), `Verified absence of frontend path: ${relPath}`);
    }

    // -------------------------------------------------------------
    // SUITE 6: FLASHCARD & SRS INTEGRITY (PRESERVED WORKSPACE)
    // -------------------------------------------------------------
    console.log('\n--- SUITE 6: Flashcards & SRS Workspace Preservation ---');

    // 6.1 Verify flashcard_decks and flashcards tables are healthy
    const flashcardTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('flashcard_decks', 'flashcards')
    `);
    assert(
      flashcardTables.rows.length === 2,
      `Core flashcard tables (flashcard_decks, flashcards) are healthy and active`
    );

    // 6.2 Verify Spaced Repetition SRS columns exist on flashcards
    const srsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'flashcards' 
        AND column_name IN ('interval_days', 'ease_factor', 'repetitions', 'next_review_at')
    `);
    assert(
      srsColumns.rows.length === 4,
      `Flashcards table retains full Spaced Repetition (SRS/SM-2) algorithm columns`
    );

    // 6.3 Verify flashcard modes exist on Frontend
    const flashcardModesDir = path.join(frontendRoot, 'src/components/flashcards/modes');
    assert(
      fs.existsSync(flashcardModesDir),
      `Frontend retains dedicated Flashcard Study Modes directory`
    );
    const activeModes = ['LearnMode.tsx', 'MatchGameMode.tsx', 'TestMode.tsx', 'WriteMode.tsx'];
    for (const mode of activeModes) {
      assert(
        fs.existsSync(path.join(flashcardModesDir, mode)),
        `Frontend study mode active: ${mode}`
      );
    }

    console.log('\n===============================================================');
    console.log(`🎉 PHASE 35 ARCHITECTURE VERIFICATION PASSED: ${passedTests}/${totalTests} TESTS`);
    console.log('===============================================================\n');

  } finally {
    await client.end();
  }
}

runPhase35ArchitectureVerification().catch(err => {
  console.error('\n❌ Phase 35 Verification Failed:', err);
  process.exit(1);
});
