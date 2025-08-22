Figma fetcher helper

This small helper fetches a Figma file JSON and optional node images using the Figma REST API.

Usage

1. Create a personal access token in Figma (Account > Settings > Personal access tokens).
2. Copy `packages/tools/figma/.env.example` to `.env.local` or set environment variables in your shell.

Run (from repo root):

```powershell
# Windows PowerShell example
$env:FIGMA_TOKEN = 'your-token'; $env:FIGMA_FILE_ID = 'your-file-id'; node packages/tools/figma/fetch-figma-file.js
```

Or with node environment file loader (optional):

```powershell
# using cross-env or dotenv-cli not included; set env vars in your shell then run
node packages/tools/figma/fetch-figma-file.js
```

Options (env vars)

- `FIGMA_TOKEN` (required)
- `FIGMA_FILE_ID` (required)
- `FIGMA_NODE_IDS` (optional comma-separated node ids) - will download PNG images for those nodes
- `FIGMA_OUT_DIR` (optional) - default `tmp/figma`
