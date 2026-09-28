// npm run import -- <seed.json...> — merges {models, results, speeds, benchmarks, api_patches} files
// into data/. Skips models whose id or name already exists, results for unknown models/benchmarks,
// and exact duplicates. api_patches set fields on an existing model's api (null removes one).
// --drop <source id> first removes every result and speed from that ledger source (e.g. when
// re-sourcing it). Prints what it did; run npm run check afterwards. Ledger entries are NOT
// imported automatically: add them to data/sources.json by hand after reading the terms.

import { readFileSync, writeFileSync } from "node:fs";
import { sourceId, sourceOf } from "../lib/sources.ts";
import type { Api, Benchmark, Model, Result, Speed } from "../lib/types.ts";

const path = (f: string) => new URL(`../data/${f}`, import.meta.url);
const load = <T>(f: string): T => JSON.parse(readFileSync(path(f), "utf8"));
const save = (f: string, v: unknown) => writeFileSync(path(f), JSON.stringify(v, null, 2) + "\n");

const models = load<Model[]>("models.json");
const results = load<Result[]>("results.json");
const speeds = load<Speed[]>("speeds.json");
const benchList = load<Benchmark[]>("benchmarks.json");
const benches = new Set(benchList.map((b) => b.id));

const args = process.argv.slice(2);
const drops = args.flatMap((a, i) => (args[i - 1] === "--drop" ? [a] : []));
const files = args.filter((a, i) => a !== "--drop" && args[i - 1] !== "--drop");
for (const id of drops) {
  const before = [results.length, speeds.length];
  results.splice(0, results.length, ...results.filter((r) => sourceId(r.source) !== id));
  speeds.splice(0, speeds.length, ...speeds.filter((x) => sourceId(x.source) !== id));
  console.log(`--drop ${id}: -${before[0] - results.length} results, -${before[1] - speeds.length} speeds`);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const ids = new Set(models.map((m) => m.id));
const names = new Map(models.map((m) => [norm(m.name), m.id]));
const resultKey = (r: Result) => `${r.model}|${r.bench}|${r.source}`;
const speedKey = (s: Speed) => `${s.model}|${s.hardware}|${s.quant}|${s.value}|${s.source}`;
const haveResults = new Map(results.map((r) => [resultKey(r), r.score]));
const haveSpeeds = new Set(speeds.map(speedKey));

for (const file of files) {
  const seed = JSON.parse(readFileSync(file, "utf8")) as {
    models?: Model[];
    results?: Result[];
    speeds?: Speed[];
    benchmarks?: Benchmark[];
    api_patches?: { id: string; api: Partial<Record<keyof Api, unknown>> | null }[];
  };
  const log = { models: 0, results: 0, speeds: 0, benchmarks: 0, patches: 0, skipped: [] as string[] };

  for (const b of seed.benchmarks ?? []) {
    if (benches.has(b.id)) continue;
    benchList.push(b);
    benches.add(b.id);
    log.benchmarks++;
  }

  for (const m of seed.models ?? []) {
    const dupe = ids.has(m.id) ? m.id : names.get(norm(m.name));
    if (dupe) { log.skipped.push(`model ${m.id} (already have ${dupe})`); continue; }
    models.push(m);
    ids.add(m.id);
    names.set(norm(m.name), m.id);
    log.models++;
  }
  for (const r of seed.results ?? []) {
    if (!ids.has(r.model)) { log.skipped.push(`result ${r.model}/${r.bench}: unknown model`); continue; }
    if (!benches.has(r.bench)) { log.skipped.push(`result ${r.model}/${r.bench}: unknown benchmark`); continue; }
    if (haveResults.has(resultKey(r))) {
      if (haveResults.get(resultKey(r)) !== r.score) throw new Error(`Conflicting result ${resultKey(r)}; review and replace explicitly`);
      continue;
    }
    results.push(r.source_id ? r : { ...r, source_id: sourceId(r.source) }); // every row names its ledger entry
    haveResults.set(resultKey(r), r.score);
    log.results++;
  }
  for (const s of seed.speeds ?? []) {
    if (!ids.has(s.model)) { log.skipped.push(`speed ${s.model}: unknown model`); continue; }
    if (haveSpeeds.has(speedKey(s))) continue;
    speeds.push(s);
    haveSpeeds.add(speedKey(s));
    log.speeds++;
  }
  for (const p of seed.api_patches ?? []) {
    const m = models.find((x) => x.id === p.id);
    if (!m) { log.skipped.push(`api patch ${p.id}: unknown model`); continue; }
    if (p.api === null) { m.api = null; log.patches++; continue; }
    const api = { ...(m.api ?? {}) } as Record<string, unknown>;
    for (const [k, v] of Object.entries(p.api)) { if (v === null) delete api[k]; else api[k] = v; }
    if (!api.url) { log.skipped.push(`api patch ${p.id}: no url`); continue; }
    m.api = api as unknown as Api;
    log.patches++;
  }
  console.log(`${file}: +${log.models} models, +${log.results} results, +${log.speeds} speeds, +${log.benchmarks} benchmarks, ${log.patches} api patches`);
  for (const s of log.skipped) console.log(`  skipped ${s}`);
}

// Validate all staged changes before the first write. A seed cannot approve its own source.
const requireSource = (url: string | undefined, label: string) => {
  if (!url || sourceOf(url)?.verdict !== "allowed") throw new Error(`${label}: source is not approved: ${url ?? "missing"}`);
};
for (const r of results) requireSource(r.source, `result ${r.model}/${r.bench}`);
for (const s of speeds) requireSource(s.source, `speed ${s.model}`);
for (const m of models) {
  if (m.api && [m.api.price, m.api.price_in, m.api.price_out].some((x) => x !== undefined)) requireSource(m.api.price_source, `price ${m.id}`);
  if (m.api?.tps !== undefined) requireSource(m.api.tps_source, `speed ${m.id}`);
  if (m.api?.speed !== undefined) requireSource(m.api.speed_source, `speed ${m.id}`);
  if (m.context_k !== undefined) requireSource(m.context_source, `context ${m.id}`);
}
save("models.json", models);
save("results.json", results);
save("speeds.json", speeds);
writeFileSync(path("benchmarks.json"), "[\n" + benchList.map((b) => "  " + JSON.stringify(b)).join(",\n") + "\n]\n");
