import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SOURCES, sourceOf } from '../lib/sources.ts';
import { rank } from '../lib/fit.ts';
import { fit, evaluator, toCells, toLatent, fromLatent } from '../lib/score.ts';
import { connectedCells, heldOutPrediction } from '../lib/comparisons.ts';
import { toText, whereLabel } from '../lib/format.ts';
import type { Model } from '../lib/types.ts';

test('source scopes reject lookalike hosts, sibling repositories, and unreviewed archive members', () => {
  const arena = `https://${SOURCES.find((s) => s.id === 'lmarena-dataset')!.match[0]}`;
  assert.equal(sourceOf(arena)?.verdict, 'allowed');
  assert.notEqual(sourceOf(arena.replace('huggingface.co', 'huggingface.co.evil.example'))?.verdict, 'allowed');
  assert.notEqual(sourceOf(arena + '-other')?.verdict, 'allowed');
  assert.equal(sourceOf('https://epoch.ai/data/benchmark_data.zip#gpqa_diamond.csv')?.verdict, 'allowed');
  assert.equal(sourceOf('https://epoch.ai/data/benchmark_data.zip#hle_external.csv'), undefined);
  assert.equal(sourceOf('https://epoch.ai/data/benchmark_data.zip'), undefined);
  assert.equal(sourceOf('https://user:password@epoch.ai/data/benchmark_data.zip#gpqa_diamond.csv'), undefined);
  assert.equal(sourceOf('not a URL'), undefined);
  const exact = SOURCES.find((s) => s.id === 'models-dev')!.match[0];
  assert.equal(sourceOf(`https://${exact}`)?.verdict, 'allowed');
  assert.equal(sourceOf(`https://${exact}/other`), undefined);
  assert.equal(sourceOf('https://arxiv.org/html/2607.02770v1#S2.T3')?.id, 'quant-gemma4-report-v1');
  assert.equal(sourceOf('https://arxiv.org/html/2607.02770v1#S2.T5')?.id, 'gemma4-report');
});

test('unknown API prices are visible without a budget and excluded by any finite budget', () => {
  const m: Model = { id: 'test', name: 'Test', provider: 'Test', open_weights: false, api: { url: 'https://example.com' } };
  const scores = new Map([['test', { id: 'test', g: 50, n: 1, pm: 15 }]]);
  const [unlimited] = rank([m], scores, { specs: null });
  assert.equal(whereLabel(unlimited), 'api price unknown');
  for (const max of [0, 1, 1000]) assert.equal(rank([m], scores, { specs: null, max })[0].where, 'none');
  m.api!.price_in = 0; m.api!.price_out = 0;
  assert.equal(rank([m], scores, { specs: null, max: 0 })[0].where, 'none');
  assert.equal(rank([m], scores, { specs: null, max: 1 })[0].where, 'api');
});

test('empty categories render an explicit gap, not a fabricated ranking', () => {
  assert.equal(fit([]).scores.size, 0);
  const text = toText([], null, null, { cat: 'tts', color: false, base: 'https://whatmodel.sh', limit: 40, all: false, benches: 0, updated: '2026-09-25' });
  assert.match(text, /No reviewed rankings/);
  assert.doesNotMatch(text, /NaN|Infinity/);
});

test('self-reported results retain the evaluator identity of their source', () => {
  const r = { model: 'test', bench: 'test', score: 0.5, source: 'https://example.com/result', by: 'lab' as const };
  assert.equal(evaluator(r), evaluator({ ...r, by: 'independent' }));
  assert.notEqual(evaluator(r), evaluator({ ...r, source: 'https://other.example/result' }));
});

test('disconnected studies stay separate until an evaluated model connects them', () => {
  const cell = (model: string, key: string) => ({ model, key, bench: key.split('@')[0], y: 1, results: [] });
  const cells = [cell('a', 'test@one'), cell('b', 'test@one'), cell('c', 'test@two'), cell('d', 'test@two')];
  const groups = connectedCells(cells);
  assert.equal(groups.length, 2);
  assert.equal(groups.flat().length, cells.length);
  assert.equal(heldOutPrediction(cells, 'a', 'test@two'), undefined);
  assert.equal(connectedCells([...cells, cell('b', 'test@two')]).length, 1);
});

test('sparse unrelated evaluators are not pooled into a calibration series', () => {
  const rows = ['one', 'two', 'three'].map((s) => ({ model: s, bench: 'test', score: 0.5, source: `https://${s}.example/result`, by: 'lab' as const }));
  assert.equal(toCells(rows, [{ id: 'test', name: 'test', kind: 'acc', url: 'https://example.com' }]).length, 0);
});

test('edit error ratios above 100% retain their magnitude and ordering', () => {
  const b = { id: 'cer', name: 'CER', kind: 'err' as const, url: 'https://example.com' };
  assert.ok(toLatent(1.1, b) > toLatent(1.5, b));
  for (const rate of [0, 0.05, 0.9, 1.1, 1.5]) assert.ok(Math.abs(fromLatent(toLatent(rate, b), b) - rate) < 1e-12);
});

test('all published benchmark and price evidence has an approved licence scope', () => {
  const load = (file: string) => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
  for (const r of load('results.json')) assert.equal(sourceOf(r.source)?.verdict, 'allowed', r.source);
  for (const m of load('models.json')) {
    if (m.api?.price_in !== undefined || m.api?.price !== undefined) assert.equal(sourceOf(m.api.price_source)?.verdict, 'allowed', m.id);
  }
});
