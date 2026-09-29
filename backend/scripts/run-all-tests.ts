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

  console.log('========================================================================');
  console.log(`       COGNITO TEST RUNNER: ${modeTitle}`);
  console.log('========================================================================\n');

  const results: { phase: string; name: string; status: 'PASS' | 'FAIL'; durationMs: number; error?: string }[] = [];
  let allPassed = true;

  for (const t of selectedTests) {
    console.log(`\n>>> [STARTING] ${t.phase}: ${t.name} (${t.script})...`);
    const startTime = Date.now();

    const proc = spawnSync('npx', ['ts-node', t.script], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
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
    console.log(`\x1b[32m🎉 ALL SELECTED SUITES PASSED! Zero regression detected.\x1b[0m\n`);
    process.exit(0);
  } else {
    console.error(`\x1b[31m❌ REGRESSION DETECTED! Some test suites failed.\x1b[0m\n`);
    process.exit(1);
  }
}

runRegression();
