import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { ENGINES, median, reportFromText, validateReport, type Report } from '../lib/bench.ts';
import { readFileSync } from 'node:fs';
import { measuredSpeed } from '../lib/measured.ts';
import type { Hardware, Model, Specs, Speed, Variant } from '../lib/types.ts';

const load = <T>(f: string): T => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const models = load<Model[]>('models'), hardware = load<Hardware[]>('hardware'), speeds = load<Speed[]>('speeds');
const speedFor = (m: Model, v: Variant, s: Specs) => measuredSpeed(speeds, m, v, s);

const report = (): Report => ({
  schema: 'whatmodel-bench-v3', script_version: '3.0.0',
  protocol: { prompt_sha256: 'a'.repeat(64), agent_prompt_sha256: 'b'.repeat(64), max_output_tokens: 256, runs: 3, warmups: 1, order_seed: 42,
    note: 'one call at a time; shuffled rounds; warm-ups discarded; one retry per failed call' },
  hardware: { os: 'Darwin', arch: 'arm64', chip: 'Apple M2 Pro', ram_gb: 16, gpu_cores: 16 },
  results: [{ model: 'qwen3-8b', engine: 'ollama', engine_version: '0.30.8', quant: 'Q4_K_M', params: '8.2B', digest: '500a1f067a9f782620b40bee6f7b0c89e17ae61f686b92c24933e4ca4b2b8b41',
    samples: [{ gen_tok_s: 22.56, prompt_tok_s: 228.4, load_s: 0.1, output_tokens: 256, elapsed_s: 12.3 }, { gen_tok_s: 21.05, output_tokens: 256 }, { gen_tok_s: 18.79, output_tokens: 256 }] }],
});
const issue = (r: unknown) => '### Benchmark results\n\n```json\n' + JSON.stringify(r) + '\n```\n\nI reviewed this report and release these measurements under CC0 1.0.\n';

test('bench reports read back from the GitHub issue body and validate', () => {
  const v = validateReport(reportFromText(issue(report())));
  assert.equal(v.ok, true);
  assert.equal(validateReport(reportFromText(JSON.stringify(report(), null, 2))).ok, true);
  assert.equal(median(report().results[0].samples.map((s) => s.gen_tok_s)), 21.05);
  assert.throws(() => reportFromText('not a report'));
});

test('bench validation rejects markup, extra fields, bad numbers and oversized reports', () => {
  const markup = report(); markup.results[0].model = '<img src=x onerror=alert(1)>';
  assert.equal(validateReport(markup).ok, false);
  const chip = report(); chip.hardware.chip = 'M2 <script>';
  assert.equal(validateReport(chip).ok, false);
  const extra = { ...report(), hostname: 'someones-mac' };
  assert.equal(validateReport(extra).ok, false);
  const field = report(); (field.results[0].samples[0] as Record<string, unknown>).output = 'generated text';
  assert.equal(validateReport(field).ok, false);
  const negative = report(); negative.results[0].samples[0].gen_tok_s = -5;
  assert.equal(validateReport(negative).ok, false);
  const huge = report(); huge.results = Array.from({ length: 41 }, () => report().results[0]);
  assert.equal(validateReport(huge).ok, false);
});

test('every report bench.py can write passes the schema, for each engine it times', () => {
  const py = `
import json, sys
sys.path.insert(0, '.')
import bench
kinds = [dict(kind='ollama', model='qwen3:8b', quant='Q4_K_M', params='8.2B', digest='0'*64, engine_version='0.30.8'),
         dict(kind='llama-bench', path='/x/Qwen3-8B-Q4_K_M.gguf', engine_version='version: 6730 (e60f01d9)'),
         dict(kind='openai', model='m', base='http://127.0.0.1:1234/v1'),
         dict(kind='claude', engine_version='2.1.290 (Claude Code)'), dict(kind='codex', engine_version='codex-cli 0.46.0'),
         dict(kind='gemini', engine_version='0.9.0')] + [dict(kind='harness', tool=t) for t in bench.HARNESSES]
jobs, ids = [], {}
for t in kinds:
    t.update(group='local', label='x'); job = bench.Run(t, 1, 1)
    job.samples = [dict(gen_tok_s=12.5, prompt_tok_s=300.0, output_tokens=200, elapsed_s=3.2, ttft_s=0.4, load_s=0.1, cost_usd=0.01)]
    jobs.append(job); ids[id(t)] = 'qwen3-8b'
hw = dict(os='Darwin', arch='arm64', chip='Apple M2 Pro', ram_gb=16, gpu_cores=19, gpu='NVIDIA GeForce RTX 4090', vram_gb=24, gpus=1)
print(json.dumps(dict(report=bench.public_report(jobs, 256, 3, 1, 123456, hw, ids), engines=sorted(set(bench.ENGINES.values()) - {'agent-cli'} | set(bench.HARNESSES)))))
`;
  const out = JSON.parse(execFileSync('python3', ['-I', '-c', py], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }));
  const v = validateReport(out.report);
  assert.ok(v.ok, v.ok ? '' : v.errors.join('; '));
  assert.equal(out.report.results.length, out.engines.length);
  assert.deepEqual([...ENGINES].sort(), out.engines);
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
