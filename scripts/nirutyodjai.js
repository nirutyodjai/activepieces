#!/usr/bin/env node
// scripts/nirutyodjai.js
const { spawnSync } = require('child_process');

function run(cmd, args, opts = {}) {
  console.log(`\n>>> RUN: ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (r.error) {
    console.error('Spawn error:', r.error);
    process.exit(1);
  }
  if (typeof r.status === 'number' && r.status !== 0) {
    console.error(`Command failed: ${cmd} ${args.join(' ')} (exit ${r.status})`);
    process.exit(r.status);
  }
  return r;
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

(async () => {
  try {
    // Pre-check: ensure we're running inside project (package.json present)
    const fs = require('fs');
    const path = require('path');
    const cwd = process.cwd();
    if (!fs.existsSync(path.join(cwd, 'package.json'))) {
      console.error('package.json not found in current directory. cd to project root and run again.');
      process.exit(1);
    }

    // Define sequence (customize if needed)
    const sequence = [
      { cmd: 'npm', args: ['run', 'build'] },
      { cmd: 'npm', args: ['run', 'test'] },
      { cmd: 'npm', args: ['run', 'lint'] },
      { cmd: 'npm', args: ['run', 'figma:fetch'] },
    ];

    for (const step of sequence) {
      run(step.cmd, step.args);
    }

    // After pre-steps, run upgrade once
    run('npm', ['run', 'upgrade']);

    // Then run integration tests in a loop (every 30s). Stop with Ctrl+C.
    const delayMs = process.env.NIRUTYODJAI_DELAY ? Number(process.env.NIRUTYODJAI_DELAY) : 30000;
    console.log('\nAll pre-steps passed. Starting continuous integration-test loop (Ctrl+C to stop).');
    while (true) {
      const res = spawnSync('npm', ['run', 'integration-test'], { stdio: 'inherit' });

      if (res.error) {
        console.error('integration-test spawn error:', res.error);
      } else if (res.status !== 0) {
        console.error(`integration-test exited with ${res.status}. Will retry after ${delayMs} ms.`);
      } else {
        console.log(`integration-test passed. Next run in ${delayMs} ms.`);
      }

      await sleep(delayMs);
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();