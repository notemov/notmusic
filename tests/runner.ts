import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  ensureTestServerRunning,
  stopTestServer,
  TEST_PORT,
  WORKSPACE_ROOT,
  TSX_CLI,
} from './test-helpers.js';

interface TierResult {
  name: string;
  file: string;
  tests: number;
  pass: number;
  fail: number;
  durationMs: number;
  exitCode: number;
}

const TIERS = [
  { name: 'Tier 1: Feature Coverage', file: 'tests/tier1-features.test.ts' },
  { name: 'Tier 2: Boundary & Corner Cases', file: 'tests/tier2-boundary.test.ts' },
  { name: 'Tier 3: Combination Workflows', file: 'tests/tier3-combination.test.ts' },
  { name: 'Tier 4: Real-World Scenarios', file: 'tests/tier4-scenarios.test.ts' },
];

async function runTier(name: string, file: string): Promise<TierResult> {
  const fullPath = path.join(WORKSPACE_ROOT, file);
  const startTime = Date.now();

  console.log(`\n===============================================================`);
  console.log(`▶ Running ${name} (${file})`);
  console.log(`===============================================================`);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [TSX_CLI, '--test', fullPath], {
      cwd: WORKSPACE_ROOT,
      env: {
        ...process.env,
        TEST_PORT: String(TEST_PORT),
        RUNNER_MANAGED_SERVER: '1',
      },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';

    child.stdout?.on('data', (d) => {
      const str = d.toString();
      output += str;
      process.stdout.write(str);
    });

    child.stderr?.on('data', (d) => {
      const str = d.toString();
      output += str;
      process.stderr.write(str);
    });

    child.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      const testsMatch = output.match(/ℹ tests (\d+)/);
      const passMatch = output.match(/ℹ pass (\d+)/);
      const failMatch = output.match(/ℹ fail (\d+)/);

      const tests = testsMatch ? parseInt(testsMatch[1], 10) : code === 0 ? 1 : 0;
      const pass = passMatch ? parseInt(passMatch[1], 10) : code === 0 ? 1 : 0;
      const fail = failMatch ? parseInt(failMatch[1], 10) : code === 0 ? 0 : 1;

      resolve({
        name,
        file,
        tests,
        pass,
        fail,
        durationMs,
        exitCode: code || 0,
      });
    });
  });
}

async function main() {
  console.log('\n===============================================================');
  console.log('   NOTMUSIC 4-TIER AUTOMATED E2E TEST RUNNER');
  console.log('===============================================================');
  console.log(`Working Directory: ${WORKSPACE_ROOT}`);
  console.log(`Isolated Test Port: ${TEST_PORT}`);

  const suiteStartTime = Date.now();
  const results: TierResult[] = [];

  try {
    console.log('\n[Runner] Starting isolated Express test server on port', TEST_PORT);
    await ensureTestServerRunning(TEST_PORT);
    console.log('[Runner] Test server is ready and responding.');

    for (const tier of TIERS) {
      const result = await runTier(tier.name, tier.file);
      results.push(result);
    }
  } catch (err: any) {
    console.error('\n[Runner Error]:', err.message);
  } finally {
    console.log('\n[Runner] Shutting down isolated test server...');
    await stopTestServer();
    console.log('[Runner] Test server stopped.');
  }

  const totalSuiteDurationMs = Date.now() - suiteStartTime;

  // -------------------------------------------------------------
  // Structured Results Summary Table
  // -------------------------------------------------------------
  console.log('\n========================================================================================');
  console.log('                                 TEST EXECUTION SUMMARY');
  console.log('========================================================================================');
  console.log(
    'Tier'.padEnd(36) +
    'Tests'.padStart(8) +
    'Pass'.padStart(8) +
    'Fail'.padStart(8) +
    'Duration'.padStart(14) +
    'Status'.padStart(12)
  );
  console.log('----------------------------------------------------------------------------------------');

  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;

  for (const r of results) {
    totalTests += r.tests;
    totalPass += r.pass;
    totalFail += r.fail;

    const statusStr = r.exitCode === 0 && r.fail === 0 ? 'PASS' : 'FAIL';
    const durStr = `${(r.durationMs / 1000).toFixed(2)}s`;

    console.log(
      r.name.padEnd(36) +
      String(r.tests).padStart(8) +
      String(r.pass).padStart(8) +
      String(r.fail).padStart(8) +
      durStr.padStart(14) +
      statusStr.padStart(12)
    );
  }

  console.log('========================================================================================');
  console.log(
    'TOTAL SUITE'.padEnd(36) +
    String(totalTests).padStart(8) +
    String(totalPass).padStart(8) +
    String(totalFail).padStart(8) +
    `${(totalSuiteDurationMs / 1000).toFixed(2)}s`.padStart(14) +
    (totalFail === 0 && results.length === TIERS.length ? 'PASS' : 'FAIL').padStart(12)
  );
  console.log('========================================================================================');

  if (totalFail === 0 && results.length === TIERS.length) {
    console.log('\n[SUCCESS] All 4 test tiers passed successfully with zero failures!\n');
    process.exit(0);
  } else {
    console.error('\n[FAILURE] One or more test tiers failed. Review logs above.\n');
    process.exit(1);
  }
}

main();
