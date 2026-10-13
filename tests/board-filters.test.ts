import assert from 'node:assert/strict';
import test from 'node:test';
import { leaderboard } from '../lib/api.ts';
import { chartsFor } from '../lib/chart.ts';
import { comparisonSets, modelsIn, speedFor } from '../lib/data.ts';
import { boardData } from '../lib/board-data.ts';
import { boardFromData } from '../lib/board.ts';
import { CATEGORY_IDS } from '../lib/categories.ts';
import { kvGb, llmOverheadGb, needGb, parseSpecs, rank, usable } from '../lib/fit.ts';
import { measuredFor } from '../lib/measured.ts';
import { curlFor, toText, whereLabel } from '../lib/format.ts';
import { boardView, modelView, pageModels } from '../lib/views.ts';
import { TASKS } from '../lib/tasks.ts';

const view = (query = '') => boardView('llm', new URLSearchParams(query));
// Text models now share one scale; set behaviour is tested on the first category that still has several.
const SET_CAT = (['llm', 'image', 'tts', 'stt', 'video'] as const).find((c) => comparisonSets[c].length > 1)!;
const setView = (query = '') => boardView(SET_CAT, new URLSearchParams(query));
const secondary = comparisonSets[SET_CAT][1];
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
});

test('a machine without a price lists what runs on it locally; max=any adds API models', async () => {
  const local = view('ram=16&gpu=apple');
  assert.equal(local.max, 0);
  assert.ok(local.shown.length && local.shown.every((r) => r.where.startsWith('local')));
  const any = view('ram=16&gpu=apple&max=any');
  assert.equal(any.max, null);
  assert.ok(any.shown.some((r) => r.where === 'api'));
  assert.equal(view('ram=16&gpu=apple&max=1').max, 1);
  assert.equal(view('').max, null);
  assert.equal(view('max=any').max, null);
  const text = async (query: string) => (await leaderboard(new Request(`https://whatmodel.sh/api?${query}`), 'llm')).text();
  const mac = await text('mac=17179869184&n=20');
  assert.match(mac, /local only/);
  assert.match(mac, /Include API models: curl "whatmodel\.sh\/\?mac=17179869184&max=any&n=20"/);
  assert.doesNotMatch(await text('mac=17179869184&max=0'), /Include API models/);
  assert.doesNotMatch(await text('mac=17179869184&max=any'), /local only|Include API models/);
});

test('unified memory machines give the GPU a share of RAM, and a detected GB10 is one', () => {
  const { hardware } = boardData('llm');
  const spark = parseSpecs(new URLSearchParams({ ram: '128', nv: 'NVIDIA GB10, [N/A]' }), hardware)!;
  assert.equal(spark.gpu, 'unified');
  assert.equal(spark.hw?.id, 'dgx-spark');
  assert.deepEqual(usable(spark), { fast: 96, total: 96 });
  const board = view('ram=128&gpu=unified');
  assert.equal(board.specs?.gpu, 'unified');
  assert.ok(board.shown.length > 0 && board.shown.every((r) => r.where.startsWith('local') && (r.mem_gb ?? 0) <= 96));
});

test('text models with fewer than 3 results are left off unless ?thin=1, and ranks close up', () => {
  const n = new Map(comparisonSets.llm[0].fit.scores.entries().map(([id, x]) => [id, x.n]));
  const scored = (v: ReturnType<typeof view>) => v.shown.filter((r) => r.score !== null);
  const off = view(), on = view('thin=1');
  assert.ok(off.thinCount > 0 && off.thinCount === on.thinCount);
  assert.ok(scored(off).every((r) => (n.get(r.id) ?? 0) >= 3));
  assert.ok(scored(on).some((r) => (n.get(r.id) ?? 0) < 3));
  assert.deepEqual(scored(off).map((r) => r.rank), scored(off).map((_, i) => i + 1));
  // Task boards judge by the model's results across all text tests, not just the task's.
  const chat = view('task=chat');
  assert.ok(scored(chat).length > 0 && scored(chat).every((r) => (n.get(r.id) ?? 0) >= 3));
  // Image, video and speech are ranked by arenas, where one or two results are normal.
  const image = boardView('image', new URLSearchParams());
  assert.equal(image.thinCount, 0);
  assert.ok(image.shown.some((r) => r.thin));
});

test('models listed by their API also say when a download runs locally', () => {
  const glm = (q: string) => view(q).rows.find((r) => r.id === 'glm-5-3')!;
  assert.equal(glm('').where, 'api');
  assert.equal(glm('').also_local, true, 'no machine given: any download counts');
  assert.match(whereLabel(glm('')), /\+local$/);
  assert.ok(glm('').mem_gb! > 0, 'a model listed by its API still shows what its download needs');
  assert.ok(!view().rows.some((r) => r.where === 'api' && !r.also_local && r.mem_gb !== null && !modelsIn('llm').find((m) => m.id === r.id)?.local?.variants.length), 'API-only models show no RAM');
  assert.equal(glm('ram=64&gpu=apple').also_local, false, 'a download too big for this machine does not count');
  assert.equal(glm('max=0').where, 'local');
  assert.ok(!view().rows.some((r) => r.also_local && r.where !== 'api'));
});

test('scored comparison-only models are listed by default, labelled, and never fit a budget or a machine', () => {
  const old = view().shown.find((r) => r.id === 'gpt-4-0314');
  assert.ok(old && old.score !== null, 'A scored historical model is listed by default');
  assert.equal(old.where, 'retired');
  assert.equal(whereLabel(old), 'comparison only');
  assert.ok(!view('retired=0').shown.some((r) => r.id === 'gpt-4-0314'), '?retired=0 hides historical models');
  for (const query of ['max=0', 'max=10', 'ram=16&gpu=apple', 'ram=16&gpu=apple&max=0'])
    assert.ok(!view(query).shown.some((r) => r.id === 'gpt-4-0314'), `A retired model cannot satisfy ${query}`);
  assert.ok(!view().shown.some((r) => r.where === 'retired' && r.score === null), 'Unscored retired models stay outside the default table');
  const retiredRows = (q: string) => view(q).shown.filter((r) => r.where === 'retired').length;
  assert.ok(retiredRows('retired=1') >= retiredRows(''), '?retired=1 lists every retired model the default lists');
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
        assert.deepEqual(measuredFor(snapshot.speeds, snapshot.hardware, model, variant, specs, false), speedFor(model, variant, specs, false));
      }
    }
  }
});

test('all comparison sets appear together without mixing their score scales', () => {
  const board = setView('retired=1');
  assert.equal(board.comparison, undefined);
  assert.equal(board.scoreMode, 'overall');
  assert.deepEqual(new Set(board.rows.map((r) => r.id)), new Set(modelsIn(SET_CAT).map((m) => m.id)));
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
  // Any listed model with no reviewed results yet (the examples change as results are added).
  const row = (['llm', 'image', 'video', 'stt', 'tts'] as const).map((c) => boardView(c, new URLSearchParams()).shown.find((r) => r.evidence === 'none')).find(Boolean);
  assert.ok(row, 'a model without results should be discoverable on a default board');
  assert.equal(row.evidence, 'none');
  assert.equal(row.score, null);
  assert.equal(row.rank, null);
  assert.equal(row.pm, null);
  assert.ok(pageModels().some((m) => m.id === row.id));
  const detail = modelView(row.id);
  assert.equal(detail?.kind, 'raw');
  if (detail?.kind === 'raw') assert.deepEqual(detail.raw, []);
  assert.equal(modelView('does-not-exist'), null);
  const catalogue = boardView('video', new URLSearchParams('retired=1'));
  assert.equal(catalogue.rows.find((r) => r.id === 'stable-video-diffusion')?.score, null);
  assert.deepEqual(catalogue.outside, { comparisonOnly: [], unscored: [], withoutResults: [] });
});

test('a set filter preserves overall scores until set scoring is explicitly selected', () => {
  const overall = setView('retired=1');
  for (const set of comparisonSets[SET_CAT]) {
    const query = `set=${encodeURIComponent(set.id)}&retired=1`;
    const filtered = setView(query);
    assert.deepEqual(new Set(filtered.rows.map((r) => r.id)), new Set(set.models));
    for (const row of filtered.rows) assert.equal(row.score, overall.rows.find((r) => r.id === row.id)!.score);
    const recalculated = setView(`${query}&score=set`);
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
    const board = setView(query);
    const response = await leaderboard(new Request(`https://whatmodel.sh/api?${query}&format=json`), SET_CAT).json();
    assert.equal(response.score_mode, board.scoreMode);
    assert.equal(response.comparison_set, secondary.id);
    assert.deepEqual(response.models.map((r: { id: string; score: number | null }) => [r.id, r.score]), board.shown.map((r) => [r.id, r.score]));
  }
  const uncalibrated = setView(setQuery);
  assert.deepEqual(chartsFor(uncalibrated.rows, SET_CAT), []);
  const output = toText(uncalibrated.rows, null, null, { cat: SET_CAT, color: false, base: 'https://whatmodel.sh', limit: 1000, all: true, benches: uncalibrated.benches, updated: '' });
  assert.match(output, /not yet calibrated/);
  assert.doesNotMatch(output, /NaN|Infinity|0±0/);
  assert.match(curlFor('whatmodel.sh', '/', new URLSearchParams(`${setQuery}&score=set`)), /score=set/);
});

test('a known KV cache sizes the memory a download needs; other models keep the flat allowance', () => {
  // Llama 2 13B: 40 layers × 40 KV heads × 128 × (K+V) × 2 bytes, no grouped-query attention.
  const llama2 = { full: 819200, vocab: 32000 };
  assert.equal(Math.round(kvGb(llama2) * 10) / 10, 6.7);
  // gpt-oss: sliding-window layers keep 4 slots' windows plus a batch (1,024 tokens), not the whole conversation.
  assert.equal(Math.round(kvGb({ full: 24576, swa: [[24576, 128]] }) * 1000), Math.round((24576 * 8192 + 24576 * 1024) / 1e6));
  const v = { quant: 'Q4_K_M', gb: 7.9, cmd: 'llama-server -hf x/y:Q4_K_M' };
  assert.equal(needGb(v), 7.9 + llmOverheadGb(7.9));
  assert.ok(needGb(v, 'llm', llama2) > 7.9 + 6.7 && needGb(v, 'llm', llama2) < needGb(v) + 6);
  assert.equal(needGb({ ...v, gb: 12 }, 'image', llama2), 12);
  // On a 12 GB card the flat allowance says it fits; its real KV cache doesn't.
  const m = { id: 'x', name: 'X', provider: 'p', open_weights: true, local: { variants: [v] } };
  const scores = new Map([['x', { id: 'x', g: 50, pm: 1, n: 5, lab: 0 }]]);
  const specs = parseSpecs(new URLSearchParams('ram=16&gpu=card&vram=12'))!;
  const where = (model: object) => rank([model as never], scores as never, { specs })[0].where;
  assert.equal(where(m), 'local');
  assert.equal(where({ ...m, kv: llama2 }), 'local-slow');
});

test('a split download (Strata) runs when the machine has one of its GPU memory and RAM pairs, on a PC graphics card only', () => {
  const strata = { quant: 'Q2_0', gb: 66.4, platform: 'gpu' as const, offload: 'experts' as const,
    cmd: 'git clone https://github.com/Niko1221/Strata.git && cd Strata && ./setup.sh --yes --family qwen --model Q2_0 --no-start && ./run-q2_0.sh',
    needs: [{ vram_gb: 12, ram_gb: 48 }, { vram_gb: 24, ram_gb: 32 }, { vram_gb: 8, ram_gb: 48, slow: true }] };
  const whole = { quant: 'q4_k_m', gb: 108.5, cmd: 'ollama run big:q4_K_M' };
  const m = { id: 'x', name: 'X', provider: 'p', open_weights: true, params_b: 180, active_b: 6, local: { variants: [whole, strata] } };
  const scores = new Map([['x', { id: 'x', g: 50, pm: 1, n: 5, lab: 0 }]]);
  const row = (q: string) => rank([m as never], scores as never, { specs: parseSpecs(new URLSearchParams(q))! })[0];
  assert.equal(row('ram=64&gpu=card&vram=12').where, 'local');
  assert.equal(row('ram=64&gpu=card&vram=12').cmd, strata.cmd);
  assert.equal(row('ram=64&gpu=card&vram=12').mem_gb, 48);
  assert.equal(row('ram=32&gpu=card&vram=24').where, 'local');
  assert.equal(row('ram=64&gpu=card&vram=8').where, 'local-slow');
  assert.equal(row('ram=32&gpu=card&vram=12').cmd, null);
  assert.notEqual(row('ram=128&gpu=apple').cmd, strata.cmd);
});

test('Qwen3.8-Flash-Next runs at full speed through Strata on a 12 GB card with 64 GB of RAM', () => {
  const data = boardData('llm');
  const flash = (q: string) => (boardFromData(data, new URLSearchParams(`${q}&n=2000`)) as { rows: { id: string; where: string; cmd: string | null }[] }).rows.find((r) => r.id === 'qwen3-8-flash-next')!;
  const pc = flash('ram=64&gpu=card&vram=12');
  assert.equal(pc.where, 'local');
  assert.match(pc.cmd!, /Niko1221\/Strata.*--model IQ3_S/);
  assert.doesNotMatch(flash('ram=128&gpu=apple').cmd ?? '', /Strata/);
});
