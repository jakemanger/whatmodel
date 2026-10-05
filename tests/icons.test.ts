import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { boardData } from '../lib/board-data.ts';
import { modelsIn } from '../lib/data.ts';
import { ICONS, ICON_SIZE, iconEntry, iconResolver, modelIcon, pngSize, providerIcon, type MakerIcon } from '../lib/icons.ts';

const entry = (id: string, providers: string[], models?: MakerIcon['models']): MakerIcon =>
  ({ id, name: id, providers, models, url: `https://example.com/${id}.png`, page: 'https://example.com/', retrieved: '2026-10-05' });

test('an exact family id beats the longest prefix, which beats the provider mark', () => {
  const r = iconResolver([
    entry('lab', ['Lab']),
    entry('family', [], { Lab: ['fam*'] }),
    entry('family-pro', [], { Lab: ['fam-pro*'] }),
    entry('one-off', [], { Lab: ['fam-pro-2'] }),
  ]);
  assert.equal(r.model({ id: 'other-1', provider: 'Lab' })?.id, 'lab');
  assert.equal(r.model({ id: 'fam-1', provider: 'Lab' })?.id, 'family');
  assert.equal(r.model({ id: 'fam-pro-1', provider: 'Lab' })?.id, 'family-pro');
  assert.equal(r.model({ id: 'fam-pro-2', provider: 'Lab' })?.id, 'one-off');
  assert.equal(r.model({ id: 'fam-1', provider: 'Someone else' }), undefined);
  assert.equal(r.provider('Lab')?.id, 'lab');
});

test('models get their maker logo, and family marks stay within their provider', () => {
  assert.equal(modelIcon({ id: 'gpt-5', provider: 'OpenAI' }), 'providers/openai');
  assert.equal(modelIcon({ id: 'qwen3-5-4b', provider: 'Alibaba' }), 'providers/qwen');
  assert.equal(modelIcon({ id: 'wan-2-5', provider: 'Alibaba' }), 'providers/alibaba-cloud');
  assert.equal(modelIcon({ id: 'gemma-3-27b', provider: 'Google' }), 'providers/gemma');
  assert.equal(modelIcon({ id: 'gemma-2-9b-simpo', provider: 'Princeton NLP' }), 'providers/princeton-nlp');
  assert.equal(modelIcon({ id: 'anything', provider: 'Not a provider' }), undefined);
  assert.equal(providerIcon('Alibaba (Qwen)'), 'providers/qwen');
  assert.equal(iconEntry({ id: 'kimi-k2', provider: 'Moonshot AI' })?.name, 'Kimi');
});

test('every logo is a committed 64x64 PNG with its official source recorded', () => {
  for (const e of ICONS) {
    const file = new URL(`../icons/providers/${e.id}.png`, import.meta.url);
    assert.ok(existsSync(file), `missing ${e.id}.png`);
    assert.deepEqual(pngSize(readFileSync(file)), { width: ICON_SIZE, height: ICON_SIZE }, e.id);
    assert.match(e.url, /^https:\/\//, e.id);
    assert.match(e.page, /^https:\/\//, e.id);
  }
});

test('board data carries each model\'s logo path for the browser', () => {
  const data = JSON.parse(JSON.stringify(boardData('llm')));
  for (const m of modelsIn('llm')) assert.equal(data.icons[m.id], modelIcon(m), m.id);
  assert.ok(Object.keys(data.icons).length > modelsIn('llm').length / 2);
});
