import assert from 'node:assert/strict';
import test from 'node:test';
import { leaderboard } from '../lib/api.ts';
import { chartsFor } from '../lib/chart.ts';
import { comparisonSets, modelsIn, speedFor } from '../lib/data.ts';
import { boardData } from '../lib/board-data.ts';
import { boardFromData } from '../lib/board.ts';
import { CATEGORY_IDS } from '../lib/categories.ts';
import { parseSpecs } from '../lib/fit.ts';
import { measuredSpeed } from '../lib/measured.ts';
import { curlFor, toText, whereLabel } from '../lib/format.ts';
import { boardView, modelView, pageModels } from '../lib/views.ts';
import { TASKS } from '../lib/tasks.ts';

const view = (query = '') => boardView('llm', new URLSearchParams(query));
const secondary = comparisonSets.llm[1];
const setQuery = `set=${encodeURIComponent(secondary.id)}`;

test('announced previews appear on default and task boards without implying public access', async () => {
  for (const query of ['', 'task=agents', 'retired=1']) {
    const board = view(query);
    const argon = board.shown.find((r) => r.id === 'gemini-4-argon');
    assert.ok(argon, 'Argon must appear without opting into historical models');
    assert.equal(argon.where, 'preview');
    assert.equal(whereLabel(argon), 'limited preview');
    assert.ok(argon.score !== null);
    assert.equal(argon.cmd, null);
    assert.equal(argon.price, null);
    assert.ok(!board.outside.comparisonOnly.some((m) => m.id === argon.id));
    const body = await (await leaderboard(new Request(`https://whatmodel.sh/api?${query}&format=json&n=10000`), 'llm')).json();
    assert.equal(body.models.find((r: {id: string}) => r.id === argon.id)?.where, 'preview');
  }
  for (const query of ['max=0', 'ram=16&gpu=apple&max=0', 'max=10', 'max=0&retired=1']) {
    assert.ok(!view(query).shown.some((r) => r.id === 'gemini-4-argon'), 'A preview with no run route cannot satisfy a local or price filter');
  }
  assert.ok(!view().shown.some((r) => r.id === 'gpt-4-0314'), 'Historical catalogue visibility stays opt-in');
});

test('task rankings use their own evidence, survive serialization and combine with hardware', async () => {
  const image = boardData('image');
  const generation = image.tasks!.find((t) => t.id === 'text-to-image')!;
  const editing = image.tasks!.find((t) => t.id === 'image-to-image')!;
  assert.ok(generation.benchmarks.includes('lmarena-image'));
  assert.ok(!generation.benchmarks.includes('lmarena-image-edit'));
  assert.ok(editing.benchmarks.includes('lmarena-image-edit'));
  assert.ok(!editing.benchmarks.includes('lmarena-image'));
  const q = new URLSearchParams('task=text-to-image&ram=16&gpu=apple&max=0');
  const v = boardFromData(image, q);
  assert.ok(v.shown.length > 0);
  assert.ok(v.shown.every((r) => r.where === 'local' || r.where === 'local-slow'));
  assert.ok(v.shown.every((r) => generation.resultModels.includes(r.id)));
  assert.deepEqual(boardFromData(JSON.parse(JSON.stringify(image)), q).rows, v.rows);
  const overall = boardFromData(image, new URLSearchParams());
  assert.ok(v.ranked.some((r) => r.score !== null && r.score !== overall.ranked.find((s) => s.id === r.id)?.score));
  assert.deepEqual(v.sources, generation.sources);
  const agents = boardView('llm', new URLSearchParams('task=agents&retired=1'));
  assert.ok(agents.models.some((m) => m.id === 'gemini-4-argon'));
  assert.ok(TASKS.find((t) => t.id === 'agents')!.benchmarks.includes('arena-agent-ips-202610'));
  assert.ok(!TASKS.find((t) => t.id === 'agents')!.benchmarks.includes('lmarena-text'));
  const req = new Request('https://whatmodel.sh/api/image?' + q + '&format=json');
  const body = await (await leaderboard(req, 'image')).json();
  assert.equal(body.task, 'text-to-image');
  assert.deepEqual(body.models.map((r: {id: string}) => r.id), v.shown.slice(0, 40).map((r) => r.id));
  assert.match(body.task_note, /within this task/);
});

test('serialized board inputs preserve scores and measured speeds across categories', () => {
  for (const cat of CATEGORY_IDS) {
    const original = boardData(cat);
    const snapshot = JSON.parse(JSON.stringify(original));
    for (const query of ['', 'ram=32&gpu=apple&max=0', 'ram=64&gpu=card&vram=24&all=1&sort=ram']) {
      assert.deepEqual(boardFromData(snapshot, new URLSearchParams(query)).rows, boardFromData(original, new URLSearchParams(query)).rows);
    }
    for (const hw of original.hardware) {
      const specs = parseSpecs(new URLSearchParams({ ram: '32', gpu: hw.kind === 'apple' ? 'apple' : hw.kind === 'cpu' ? 'none' : 'card', vram: String(hw.memory_gb?.[0] ?? 0), hw: hw.id }), original.hardware)!;
      for (const model of modelsIn(cat)) for (const variant of model.local?.variants ?? []) {
        assert.deepEqual(measuredSpeed(snapshot.speeds, model, variant, specs), speedFor(model, variant, specs));
      }
    }
  }
});

test('all comparison sets appear together without mixing their score scales', () => {
  const board = view('retired=1');
  assert.equal(board.comparison, undefined);
  assert.equal(board.scoreMode, 'overall');
  assert.deepEqual(new Set(board.rows.map((r) => r.id)), new Set(modelsIn('llm').map((m) => m.id)));
  for (const id of secondary.models) {
    const row = board.rows.find((r) => r.id === id)!;
    assert.equal(row.score, null);
    assert.equal(row.score_full, null);
    assert.equal(row.pm, null);
    assert.equal(row.rank, null);
  }
  assert.ok(board.rows.some((r) => r.score !== null));
});

test('historical entries without results are visible without inventing a score', () => {
  const row = view().shown.find((r) => r.id === 'gpt-1');
  assert.ok(row, 'GPT-1 should be discoverable on the default board');
  assert.equal(row.evidence, 'none');
  assert.equal(row.score, null);
  assert.equal(row.rank, null);
  assert.equal(row.pm, null);
  assert.ok(pageModels().some((m) => m.id === 'gpt-1'));
  const detail = modelView('gpt-1');
  assert.equal(detail?.kind, 'raw');
  if (detail?.kind === 'raw') assert.deepEqual(detail.raw, []);
  assert.equal(modelView('does-not-exist'), null);
  const catalogue = boardView('video', new URLSearchParams('retired=1'));
  assert.equal(catalogue.rows.find((r) => r.id === 'stable-video-diffusion')?.score, null);
  assert.deepEqual(catalogue.outside, { comparisonOnly: [], unscored: [], withoutResults: [] });
});

test('a set filter preserves overall scores until set scoring is explicitly selected', () => {
  const overall = view('retired=1');
  for (const set of comparisonSets.llm) {
    const query = `set=${encodeURIComponent(set.id)}&retired=1`;
    const filtered = view(query);
    assert.deepEqual(new Set(filtered.rows.map((r) => r.id)), new Set(set.models));
    for (const row of filtered.rows) assert.equal(row.score, overall.rows.find((r) => r.id === row.id)!.score);
    const recalculated = view(`${query}&score=set`);
    assert.equal(recalculated.scoreMode, 'set');
    for (const row of recalculated.rows) {
      assert.equal(row.score, Math.round(set.fit.scores.get(row.id)!.g * 10) / 10);
      assert.ok(row.rank !== null);
    }
  }
});

test('unselected and unknown sets fall back to all models on the overall scale', () => {
  const overall = view();
  for (const query of ['score=set', 'set=unknown&score=set']) {
    const board = view(query);
    assert.equal(board.scoreMode, 'overall');
    assert.equal(board.comparison, undefined);
    assert.deepEqual(board.rows, overall.rows);
  }
});

test('hardware filtering and score sorting never create scores for uncalibrated models', () => {
  for (const dir of ['asc', 'desc']) {
    const board = view(`ram=32&gpu=apple&max=0&sort=score&dir=${dir}`);
    const firstMissing = board.rows.findIndex((r) => r.score === null);
    assert.ok(firstMissing > 0);
    assert.ok(board.rows.slice(firstMissing).every((r) => r.score === null && r.rank === null));
    assert.ok(board.rows.some((r) => r.score === null && r.quant));
    assert.ok(board.shown.every((r) => r.where !== 'none' && r.where !== 'api'));
  }
});

test('API, terminal output, charts and copied commands use the selected score mode', async () => {
  for (const score of ['', '&score=set']) {
    const query = `${setQuery}${score}&all=1&retired=1&n=10000`;
    const board = view(query);
    const response = await leaderboard(new Request(`https://whatmodel.sh/api?${query}&format=json`), 'llm').json();
    assert.equal(response.score_mode, board.scoreMode);
    assert.equal(response.comparison_set, secondary.id);
    assert.deepEqual(response.models.map((r: { id: string; score: number | null }) => [r.id, r.score]), board.shown.map((r) => [r.id, r.score]));
  }
  const uncalibrated = view(setQuery);
  assert.deepEqual(chartsFor(uncalibrated.rows, 'llm'), []);
  const output = toText(uncalibrated.rows, null, null, { cat: 'llm', color: false, base: 'https://whatmodel.sh', limit: 1000, all: true, benches: uncalibrated.benches, updated: '' });
  assert.match(output, /not yet calibrated/);
  assert.doesNotMatch(output, /NaN|Infinity|0±0/);
  assert.match(curlFor('whatmodel.sh', '/', new URLSearchParams(`${setQuery}&score=set`)), /score=set/);
});
