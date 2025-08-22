#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

function usage() {
  console.error(`Usage:
  FIGMA_TOKEN=... FIGMA_FILE_ID=... [FIGMA_NODE_IDS="id1,id2"] [FIGMA_OUT_DIR=tmp/figma] node ${path.basename(
    __filename
  )}
Or set values in .env file (supports dotenv).
Options:
  --token <token>
  --file <fileId>
  --nodes <comma-separated node ids>
  --out <outDir>
`);
  process.exit(2);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--token') out.token = argv[++i];
    else if (a === '--file') out.fileId = argv[++i];
    else if (a === '--nodes') out.nodeIds = argv[++i];
    else if (a === '--out') out.outDir = argv[++i];
    else {
      // ignore unknown
    }
  }
  return out;
}

function fetchJson(urlStr, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers,
    };
    const req = https.get(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const status = res.statusCode || 0;
        if (status >= 400) {
          return reject(
            new Error(`HTTP ${status} from ${urlStr}: ${data.slice(0, 200)}`)
          );
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(
            new Error(`Invalid JSON response from ${urlStr}: ${e.message}`)
          );
        }
      });
    });
    req.on('error', reject);
  });
}

async function fetchImage(urlStr, headers, maxRedirects = 5) {
  // follow simple redirects
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers,
    };
    const req = https.get(opts, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        if (maxRedirects <= 0)
          return reject(new Error('Too many redirects for image'));
        return resolve(
          fetchImage(res.headers.location, headers, maxRedirects - 1)
        );
      }
      if (status >= 400) {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () =>
          reject(
            new Error(
              `HTTP ${status} while fetching image ${urlStr}: ${buf.slice(
                0,
                200
              )}`
            )
          )
        );
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

async function main() {
  const cli = parseArgs();
  const token = cli.token || getEnv('FIGMA_TOKEN');
  const fileId = cli.fileId || getEnv('FIGMA_FILE_ID');
  const nodeIds = cli.nodeIds || getEnv('FIGMA_NODE_IDS');
  const outDir = cli.outDir || getEnv('FIGMA_OUT_DIR', 'tmp/figma');

  if (!token || !fileId) {
    console.error(
      'Missing FIGMA_TOKEN or FIGMA_FILE_ID in environment or CLI arguments.'
    );
    usage();
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const headers = {
    'X-Figma-Token': token,
    Accept: 'application/json',
  };

  try {
    console.log(`Fetching Figma file ${fileId}...`);
    const fileJson = await fetchJson(
      `https://api.figma.com/v1/files/${encodeURIComponent(fileId)}`,
      headers
    );
    const filePath = path.join(outDir, `${fileId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fileJson, null, 2));
    console.log(`Saved file JSON to ${filePath}`);

    if (nodeIds) {
      const ids = nodeIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        console.log(`Requesting images for nodes: ${ids.join(',')}`);
        const idsParam = ids.map(encodeURIComponent).join(',');
        const imagesJson = await fetchJson(
          `https://api.figma.com/v1/images/${encodeURIComponent(
            fileId
          )}?ids=${idsParam}&format=png`,
          headers
        );
        const images = imagesJson.images || {};
        for (const [nodeId, imageUrl] of Object.entries(images)) {
          if (!imageUrl) continue;
          try {
            const imgBuf = await fetchImage(imageUrl, {});
            const imgPath = path.join(outDir, `${fileId}-${nodeId}.png`);
            fs.writeFileSync(imgPath, imgBuf);
            console.log(`Saved image for ${nodeId} -> ${imgPath}`);
          } catch (e) {
            console.error(
              `Failed to download image for ${nodeId}: ${e.message}`
            );
          }
        }
      }
    }

    console.log('Done');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});