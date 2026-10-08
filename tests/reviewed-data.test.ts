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

// Six models on two tests, each run by one independent evaluator, read exactly (linear units).
const ability: Record<string, number> = { m1: -1.5, m2: -0.8, m3: -0.2, m4: 0.3, m5: 0.9, m6: 1.4 };
const run = (key: string, a: number, d: number, models = Object.keys(ability), shift = 0) =>
  models.map((model, i) => ({ model, key, bench: key.split('@')[0], y: a * ability[model] + d + shift + 0.05 * Math.sin(3 * i + a), results: [] }));
const base = [...run('t1', 2, 0), ...run('t2', 1, 3)];

test('an evaluator whose setup runs hot cannot lift the models it ran', () => {
  const g = (cells: typeof base) => fit(cells).scores;
  const without = g(base), hot = g([...base, ...run('t1@lab', 2, 0, ['m2', 'm3'], 5)]);
  for (const m of ['m2', 'm3']) assert.ok(Math.abs(hot.get(m)!.g - without.get(m)!.g) < 1, `${m} moved by a run's level`);
});

test('runs of the same test share its sharpness, and a result alone in its run carries no weight', () => {
  const f = fit([...base, ...run('t1@lab', 2, 7, ['m4', 'm5']), ...run('t2@solo', 1, 9, ['m1'])]);
  assert.equal(f.params.get('t1@lab')!.a, f.params.get('t1')!.a);
  const solo = f.explain('m1')!.parts.find((p) => p.cell.key === 't2@solo')!;
  assert.equal(solo.share, 0);
  const g = f.scores;
  assert.ok(g.get('m5')!.g > g.get('m4')!.g);
});

test('a small run leans on its test\'s other runs, as far as the fitted spread between evaluators allows', () => {
  const offset = (shift: number) => {
    const f = fit([...base, ...run('t1@lab', 2, 0, ['m4', 'm5'], shift)]);
    return { level: f.params.get('t1@lab')!.d - f.params.get('t1')!.d, spread: f.levelSpread };
  };
  const mild = offset(0.5), hot = offset(5);
  assert.ok(mild.level > 0 && mild.level < 0.5, `a mildly hot run is pulled toward the test (${mild.level})`);
  assert.ok(hot.level > 4.5, `a run far off the others keeps its own level (${hot.level})`);
  assert.ok(hot.spread > mild.spread);
});

test('edit error ratios above 100% retain their magnitude and ordering', () => {
  const b = { id: 'cer', name: 'CER', kind: 'err' as const, url: 'https://example.com' };
  assert.ok(toLatent(1.1, b) > toLatent(1.5, b));
  for (const rate of [0, 0.05, 0.9, 1.1, 1.5]) assert.ok(Math.abs(fromLatent(toLatent(rate, b), b) - rate) < 1e-12);
});

test('signed treatment effects retain negative values and raw units', () => {
  const b = { id: 'ips', name: 'Agent IPS', kind: 'linear' as const, latent_scale: 0.1, url: 'https://example.com' };
  for (const effect of [-0.159026, 0, 0.143104]) assert.ok(Math.abs(fromLatent(toLatent(effect, b), b) - effect) < 1e-12);
  assert.ok(toLatent(-0.02, b) > toLatent(-0.1, b));
  assert.equal(toLatent(0, b), 0);
});

test('lower-is-better distances preserve published units and ranking direction', () => {
  const b = { id: 'fid', name: 'FID', kind: 'linear' as const, direction: 'lower' as const, latent_scale: 10, url: 'https://example.com' };
  for (const distance of [0, 8.21, 20, 150]) assert.ok(Math.abs(fromLatent(toLatent(distance, b), b) - distance) < 1e-12);
  assert.ok(toLatent(8.21, b) > toLatent(20, b));
});

test('all published benchmark and price evidence has an approved licence scope', () => {
  const load = (file: string) => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
  for (const r of load('results.json')) assert.equal(sourceOf(r.source)?.verdict, 'allowed', r.source);
  for (const m of load('models.json')) {
    if (m.api?.price_in !== undefined || m.api?.price !== undefined) assert.equal(sourceOf(m.api.price_source)?.verdict, 'allowed', m.id);
  }
});
