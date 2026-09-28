import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import test from 'node:test';
import { renderPages } from '../lib/markdown.ts';

const root = new URL('../', import.meta.url);
const pages = renderPages(readFileSync(new URL('scripts/readme-about.md', root), 'utf8'));

test('every relative link and image in the generated pages resolves', () => {
  const broken: string[] = [];
  let checked = 0;
  for (const [file, md] of pages) {
    const targets = [...md.matchAll(/\]\(([^)\s]+)\)|(?:src|href)="([^"]+)"/g)].map((m) => m[1] ?? m[2]);
    for (const t of targets) {
      if (/^(https?:|mailto:|#)/.test(t)) continue;
      checked++;
      const path = posix.normalize(posix.join(posix.dirname(file), t.split('#')[0]));
      if (!pages.has(path) && !existsSync(new URL(path, root))) broken.push(`${file} -> ${t}`);
    }
  }
  assert.deepEqual(broken.slice(0, 10), []);
  assert.ok(checked > 2000, `only ${checked} links checked`);
});

test('the README is the LLM leaderboard and stays small enough for GitHub to render', () => {
  const readme = pages.get('README.md')!;
  assert.match(readme, /^# whatmodel\.sh · find the best AI models you can run$/m);
  assert.match(readme, /^## About this repo$/m);
  assert.ok(readme.length < 400_000, `README is ${readme.length} bytes`);
});
