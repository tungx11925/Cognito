import { spawnSync } from 'child_process';
import path from 'path';

interface PhaseTest {
  phase: string;
  name: string;
  script: string;
}

const TESTS: PhaseTest[] = [
  { phase: 'Phase 4', name: 'Document Management & Processing Pipeline', script: 'scripts/test-phase4.ts' },
  { phase: 'Phase 5', name: 'AI Chat with Documents & Mindmap Generation', script: 'scripts/test-phase5.ts' },
  { phase: 'Phase 6', name: 'Question Generator & Bloom Taxonomy', script: 'scripts/test-phase6.ts' },
  { phase: 'Phase 7', name: 'Exam & Question Bank Management', script: 'scripts/test-phase7.ts' },
  { phase: 'Phase 8', name: 'Quiz / Test System & Anti-Cheat Grading', script: 'scripts/test-phase8.ts' },
  { phase: 'Phase 9', name: 'Notes, Mindmaps & Flashcards Workspace', script: 'scripts/test-phase9.ts' },
];

async function runAllTests() {
  console.log('========================================================================');
  console.log('       COGNITO COMPREHENSIVE REGRESSION SUITE (ALL PHASES)              ');
  console.log('========================================================================\n');

  const results: { phase: string; name: string; status: 'PASS' | 'FAIL'; durationMs: number; error?: string }[] = [];
  let allPassed = true;

  for (const t of TESTS) {
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
      // Continue running subsequent tests to see the complete regression picture
    }
  }

  console.log('\n========================================================================');
  console.log('                   FULL REGRESSION REPORT SUMMARY                       ');
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
    console.log('\x1b[32m🎉 ALL SUITES PASSED! Zero regression across all implemented phases.\x1b[0m\n');
    process.exit(0);
  } else {
    console.error('\x1b[31m❌ REGRESSION DETECTED! Some test suites failed.\x1b[0m\n');
    process.exit(1);
  }
}

runAllTests();
