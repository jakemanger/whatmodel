import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeBench, median, validateBench, type Bench } from '../lib/bench.ts';
import { readFileSync } from 'node:fs';
import { measuredSpeed } from '../lib/measured.ts';
import type { Hardware, Model, Specs, Speed, Variant } from '../lib/types.ts';

const load = <T>(f: string): T => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const models = load<Model[]>('models'), hardware = load<Hardware[]>('hardware'), speeds = load<Speed[]>('speeds');
const speedFor = (m: Model, v: Variant, s: Specs) => measuredSpeed(speeds, m, v, s);

const run = (): Bench => ({
  v: 1, at: '2026-09-25T15:25:20Z', nonce: '7eaf45b9-cb7f-4bbe-8e90-ed71328d5dc4', os: 'macos', os_version: '27.0',
  cpu: 'Apple M2 Pro', gpu: 'Apple M2 Pro', gpu_cores: 16, gpus: 1, ram_gb: 16, vram_gb: null, engine: 'ollama', engine_version: '0.30.8', tokens: 256,
  runs: [{ model: 'qwen3:8b', digest: '500a1f067a9f782620b40bee6f7b0c89e17ae61f686b92c24933e4ca4b2b8b41', quant: 'Q4_K_M', params: '8.2B', bytes: 5225388164,
    gpu_pct: 100, ctx: 4096, load_s: 6, prompt_tokens: [168, 168, 168], pp: [228.4, 220.4, 200.4], gen_tokens: [256, 256, 256], tg: [22.56, 21.05, 18.79], ms: [12334, 13116, 14672] }],
});
const link = (b: unknown) => 'https://whatmodel.sh/bench#r=' + Buffer.from(JSON.stringify(b)).toString('base64url');

test('bench results round-trip through the link and validate', () => {
  const v = validateBench(decodeBench(link(run())));
  assert.equal(v.ok, true);
  assert.equal(median(run().runs[0].tg), 21.05);
  assert.equal(validateBench(decodeBench(link(run()).split('#r=')[1])).ok, true);
});

test('bench validation rejects markup, extra fields, bad numbers and oversized results', () => {
  const markup = run(); markup.runs[0].model = '<img src=x onerror=alert(1)>';
  assert.equal(validateBench(markup).ok, false);
  const extra = { ...run(), hostname: 'someones-mac' };
  assert.equal(validateBench(extra).ok, false);
  const negative = run(); negative.runs[0].tg = [-5];
  assert.equal(validateBench(negative).ok, false);
  const huge = run(); huge.runs = Array.from({ length: 21 }, () => run().runs[0]);
  assert.equal(validateBench(huge).ok, false);
  assert.throws(() => decodeBench('not a result'));
});

test('board speeds come only from exact download + exact chip measurements', () => {
  const m = models.find((x) => x.id === 'qwen3-8b')!;
  const v = m.local!.variants.find((x) => x.cmd === 'ollama run qwen3:8b')!;
  const m2pro: Specs = { ram: 16, vram: 0, gpu: 'apple', hw: hardware.find((h) => h.id === 'm2-pro') };
  const m3: Specs = { ...m2pro, hw: hardware.find((h) => h.id === 'm3') };
  assert.equal(speedFor(m, v, m2pro)?.how, 'measured');
  assert.equal(speedFor(m, v, m3), null);
  assert.equal(speedFor(m, v, { ...m2pro, hw: null }), null);
  assert.equal(speedFor(m, { ...v, cmd: 'ollama run qwen3:8b-q8_0' }, m2pro), null);
});
