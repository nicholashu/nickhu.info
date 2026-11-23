import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const origin = process.env.PORTFOLIO_MEDIA_ORIGIN || 'https://nickhu-beyond-prototype.nick-hu.chatgpt.site/';
const files = ['index.html','portfolio.css','oil-surface.css','project-browser.js','kurb-explorer.js','worksheet-stack.js','main.js','bot-gallery.js','oil-surface.js','favicon.svg','robots.txt','sitemap.xml'];
const assets = JSON.parse(await readFile(path.join(root, 'asset-manifest.json'), 'utf8'));

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await Promise.all(files.map(file => copyFile(path.join(root, file), path.join(out, file))));

async function present(file) {
  try { const result = await stat(file); return result.isFile() && result.size > 0; }
  catch { return false; }
}
async function obtain(asset) {
  if (!/^assets\/[a-zA-Z0-9_./-]+$/.test(asset) || asset.includes('..')) throw new Error('Unsafe asset path: ' + asset);
  const outputPath = path.join(out, asset);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const localPath = path.join(root, asset);
  if (await present(localPath)) { await copyFile(localPath, outputPath); return; }
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(new URL(asset, origin), {
        signal: AbortSignal.timeout(45000),
        headers: { Accept: 'image/avif,image/webp,image/*,font/woff2,*/*', 'User-Agent': 'Mozilla/5.0 (compatible; PortfolioAssetMirror/1.0)' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      if ((response.headers.get('content-type') || '').includes('text/html')) throw new Error('HTML challenge returned instead of media');
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length < 100) throw new Error('Media unexpectedly empty');
      await writeFile(outputPath, data);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 700));
    }
  }
  throw new Error('Unable to mirror ' + asset + ': ' + lastError?.message);
}
let cursor = 0;
async function worker() {
  while (cursor < assets.length) await obtain(assets[cursor++]);
}
await Promise.all(Array.from({ length: Math.min(6, assets.length) }, worker));
console.log('Portfolio ready in dist/ with ' + assets.length + ' local media assets.');
