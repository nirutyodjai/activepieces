const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    if (!line) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.substring(0, idx);
    let val = line.substring(idx + 1);
    // remove surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  });
}

const edition = process.argv[2] || 'ce';
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const envPath = path.join(repoRoot, 'packages', 'server', 'api', '.env.tests');
if (fs.existsSync(envPath)) {
  loadEnv(envPath);
}
process.env.AP_EDITION = edition;

const args = [
  'nx',
  `test-${edition}-command`,
  'server-api',
  '--output-style',
  'stream-without-prefixes',
];
const res = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
  stdio: 'inherit',
});
process.exit(res.status);
