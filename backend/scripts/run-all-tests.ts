import { spawnSync } from 'child_process';
import path from 'path';

interface PhaseTest {
  phase: string;
  name: string;
  script: string;
  isLiveAi: boolean;
}

const ALL_TESTS: PhaseTest[] = [
  { phase: 'Phase 3', name: 'Auth & User System (Profile, Avatar, Forgot/Reset)', script: 'scripts/test-phase3.ts', isLiveAi: false },
  { phase: 'Phase 4', name: 'Document Management & Processing Pipeline', script: 'scripts/test-phase4.ts', isLiveAi: false },
  { phase: 'Phase 5', name: 'AI Chat with Documents & Mindmap Generation', script: 'scripts/test-phase5.ts', isLiveAi: true },
  { phase: 'Phase 6', name: 'Question Generator & Bloom Taxonomy', script: 'scripts/test-phase6.ts', isLiveAi: true },
  { phase: 'Phase 7', name: 'Exam & Question Bank Management', script: 'scripts/test-phase7.ts', isLiveAi: false },
  { phase: 'Phase 8', name: 'Quiz / Test System & Anti-Cheat Grading', script: 'scripts/test-phase8.ts', isLiveAi: false },
  { phase: 'Phase 9', name: 'Notes, Mindmaps & Flashcards Workspace', script: 'scripts/test-phase9.ts', isLiveAi: false },
  { phase: 'Phase 10', name: 'Learning Activity, Learning Goals & StudyStreak', script: 'scripts/test-phase10.ts', isLiveAi: false },
  { phase: 'Phase 11', name: 'Focus Mode & Distraction Detection Engine', script: 'scripts/test-phase11.ts', isLiveAi: false },
  { phase: 'Phase 12', name: 'Community Ecosystem & Resource Exchange', script: 'scripts/test-phase12.ts', isLiveAi: false },
  { phase: 'Phase 13', name: 'Community Safety & Content Moderation System', script: 'scripts/test-phase13.ts', isLiveAi: false },
  { phase: 'Phase 14', name: 'User Profile & Public Profile System', script: 'scripts/test-phase14.ts', isLiveAi: false },
  { phase: 'Phase 15', name: 'User-to-User Chat & Direct Messaging', script: 'scripts/test-phase15.ts', isLiveAi: false },
  { phase: 'Phase 16', name: 'Notification System & Multiplexed SSE', script: 'scripts/test-phase16.ts', isLiveAi: false },
  { phase: 'Phase 17', name: 'Subscription & Payment System (PayOS / Sandbox)', script: 'scripts/test-phase17.ts', isLiveAi: false },
  { phase: 'Phase 18', name: 'Admin Dashboard & Analytics System', script: 'scripts/test-phase18.ts', isLiveAi: false },
  { phase: 'Phase 20', name: 'Entitlement & Access Control System', script: 'scripts/test-phase20.ts', isLiveAi: false },
  { phase: 'Phase 22', name: 'Unified Search System', script: 'scripts/test-phase22.ts', isLiveAi: false },
  { phase: 'Phase 26', name: 'Security Hardening & Protection', script: 'scripts/test-phase26.ts', isLiveAi: false },
  { phase: 'Phase 27', name: 'AI Security & Cost Control System', script: 'scripts/test-phase27.ts', isLiveAi: false },
  { phase: 'Phase 28', name: 'Data Integrity & Consistency System', script: 'scripts/test-phase28.ts', isLiveAi: false },
  { phase: 'Phase 29', name: 'Remove Mock Data & Seed Isolation', script: 'scripts/test-phase29.ts', isLiveAi: false },
  { phase: 'Phase 30', name: 'Full Business Flow E2E Tests (Flows A-F)', script: 'scripts/test-phase30.ts', isLiveAi: false },
  { phase: 'Phase 32', name: 'Performance & System Efficiency Tests', script: 'scripts/test-phase32.ts', isLiveAi: false },
  { phase: 'Phase 33', name: 'Final UI & Responsive Audit (Desktop/Tablet/Mobile/Theme/States)', script: 'scripts/audit-ui-phase33.ts', isLiveAi: false },
  { phase: 'Phase 34', name: 'Schema Cleanup & Dead Code Elimination', script: 'scripts/test-phase34.ts', isLiveAi: false },
  { phase: 'Phase 35', name: 'Final Architecture Verification (No School/Teacher/Studio, Roles Clean)', script: 'scripts/test-phase35.ts', isLiveAi: false },
  { phase: 'Phase 36', name: 'Final Acceptance Criteria (Real Behavior Verification)', script: 'scripts/test-phase36.ts', isLiveAi: false },
  { phase: 'Phase 38B', name: 'Session Lifecycle & Token Security Verification', script: 'scripts/test-session.ts', isLiveAi: false },
  { phase: 'Phase 38B-RateLimit', name: 'Rate Limiting Behind Proxy & Multi-User Keying', script: 'scripts/test-rate-limit-proxy.ts', isLiveAi: false },
  { phase: 'Pre-Phase 39-Guard', name: 'RouteGuard Sub-Route Hardening & ReturnUrl Sanitization', script: '../frontend/scripts/test-route-guard.js', isLiveAi: false },
  { phase: 'Pre-Phase 39-AI', name: 'Gemini 2.5 Flash Long Document Routing & Generation', script: 'scripts/test-live-gemini-flashcards.ts', isLiveAi: true },
  { phase: 'Phase 40', name: 'Real Data Isolation, Community Sharing, Likes & Saves', script: 'scripts/test-phase40-e2e.ts', isLiveAi: false },
  { phase: 'Phase 41', name: 'Flashcard Fullscreen Study, Batch Editor & Sticky AI Prompts', script: 'scripts/test-phase41.ts', isLiveAi: false },
];

async function runRegression() {
  const args = process.argv.slice(2);
  const isFastMode = args.includes('--fast');
  const isLiveAiMode = args.includes('--live-ai');

  let selectedTests = ALL_TESTS;
  let modeTitle = 'COMPREHENSIVE FULL REGRESSION (ALL PHASES)';

  if (isFastMode) {
    selectedTests = ALL_TESTS.filter(t => !t.isLiveAi);
    modeTitle = 'FAST REGRESSION SUITE (NO LIVE AI — LOCAL & FAST)';
  } else if (isLiveAiMode) {
    selectedTests = ALL_TESTS.filter(t => t.isLiveAi);
    modeTitle = 'LIVE AI SUITE (GEMINI / GROQ LLM MODULES)';
  }

  const testDbUrl = process.env.DATABASE_URL_TEST || 'postgresql://tu:123@localhost:5432/cognito_test?schema=public';

  // Fail-Safe Guard: Never allow running test suite on dev/prod database
  if (!testDbUrl.includes('test') && !testDbUrl.includes('cognito_test')) {
    console.error('\x1b[31m❌ SECURITY VIOLATION: Tests must execute on a dedicated test database (containing "test" in DB name). Refusing to run tests on dev/production database!\x1b[0m');
    process.exit(1);
  }

  console.log(`🔒 Test Database Isolation Active: Target DB -> ${testDbUrl.replace(/:[^:@]+@/, ':***@')}`);

  console.log('========================================================================');
  console.log(`       COGNITO TEST RUNNER: ${modeTitle}`);
  console.log('========================================================================\n');

  const results: { phase: string; name: string; status: 'PASS' | 'FAIL'; durationMs: number; error?: string }[] = [];
  let allPassed = true;

  for (const t of selectedTests) {
    console.log(`\n>>> [STARTING] ${t.phase}: ${t.name} (${t.script})...`);
    const startTime = Date.now();

    const isJs = t.script.endsWith('.js');
    const cmd = isJs ? 'node' : 'npx';
    const cmdArgs = isJs ? [t.script] : ['ts-node', t.script];

    const proc = spawnSync(cmd, cmdArgs, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: testDbUrl,
        NODE_ENV: 'test',
        IS_TEST_RUNNER: 'true',
      },
    });

    const durationMs = Date.now() - startTime;

    if (proc.status === 0) {
      console.log(`\x1b[32m>>> [PASSED] ${t.phase} finished in ${(durationMs / 1000).toFixed(2)}s\x1b[0m`);
      results.push({ phase: t.phase, name: t.name, status: 'PASS', durationMs });
    } else {
      console.error(`\x1b[31m>>> [FAILED] ${t.phase} exited with code ${proc.status}\x1b[0m`);
      results.push({
        phase: t.phase,
        name: t.name,
        status: 'FAIL',
        durationMs,
        error: `Exited with code ${proc.status}`,
      });
      allPassed = false;
    }
  }

  console.log('\n========================================================================');
  console.log(`                   REGRESSION REPORT SUMMARY: ${isFastMode ? 'FAST' : isLiveAiMode ? 'LIVE-AI' : 'ALL'}`);
  console.log('========================================================================');
  console.log('Phase   | Status | Duration | Module Name');
  console.log('--------+--------+----------+-------------------------------------------');
  for (const r of results) {
    const statusStr = r.status === 'PASS' ? '\x1b[32mPASS\x1b[0m  ' : '\x1b[31mFAIL\x1b[0m  ';
    const durationStr = `${(r.durationMs / 1000).toFixed(2)}s`.padEnd(8);
    const phaseStr = r.phase.padEnd(7);
    console.log(`${phaseStr} | ${statusStr} | ${durationStr} | ${r.name}`);
  }
  console.log('========================================================================');

  if (allPassed) {
    console.log(`\x1b[32m🎉 ALL ${results.length}/${selectedTests.length} SELECTED SUITES PASSED! Zero regression detected.\x1b[0m\n`);
    process.exit(0);
  } else {
    console.error(`\x1b[31m❌ REGRESSION DETECTED! Some test suites failed.\x1b[0m\n`);
    process.exit(1);
  }
}

runRegression();
