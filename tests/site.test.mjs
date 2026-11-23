import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(path.join(root,'index.html'),'utf8');
const assets = JSON.parse(await readFile(path.join(root,'asset-manifest.json'),'utf8'));

test('15 worksheet formats, with a gameboard inside the stack',()=>{
  const formats=[...html.matchAll(/data-resource-format="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(formats.length,15);
  assert.equal(new Set(formats).size,15);
  const gameboard=formats.findIndex(x=>x.includes('game-board'));
  assert.ok(gameboard>0&&gameboard<14);
});
test('SEO points at the production domain',()=>{
  assert.ok(html.includes('<link rel="canonical" href="https://nickhu.info/">'));
  assert.match(html,/<meta name="robots" content="index, follow/);
  assert.ok(!html.includes('cdn-cgi/challenge-platform'));
  assert.ok(!html.includes('width="1" height="1"'));
});
test('JavaScript syntax and complete media manifest',()=>{
  for(const f of ['project-browser.js','kurb-explorer.js','worksheet-stack.js','main.js','bot-gallery.js','oil-surface.js']) {
    execFileSync(process.execPath,['--check',path.join(root,f)]);
  }
  assert.equal(assets.length,41);
  assert.equal(new Set(assets).size,41);
  assert.equal(assets.filter(p=>p.endsWith('.gif')).length,10);
  assert.ok(assets.some(p=>p.endsWith('.woff2')));
});
