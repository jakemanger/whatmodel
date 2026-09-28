// npm run provenance — recomputes the coverage block of data/provenance.json against the original
// catalogue (commit 60c5632, before restricted sources were removed). Run after each import.
// Needs local git history for the baseline; CI doesn't run it.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { CATEGORY_IDS, catOf } from "../lib/categories.ts";
import { fit, toCells } from "../lib/score.ts";
import { connectedCells } from "../lib/comparisons.ts";
import { sourceId } from "../lib/sources.ts";
import type { Benchmark, Model, Result, Speed } from "../lib/types.ts";

const BASELINE = "60c5632";
const file = (f: string) => new URL(`../data/${f}`, import.meta.url);
const load = <T>(f: string): T => JSON.parse(readFileSync(file(f), "utf8"));
const old = <T>(f: string): T => JSON.parse(execFileSync("git", ["show", `${BASELINE}:data/${f}`], { encoding: "utf8", maxBuffer: 1 << 28 }));

const models = load<Model[]>("models.json"), results = load<Result[]>("results.json"), benches = load<Benchmark[]>("benchmarks.json");
const speeds = load<Speed[]>("speeds.json"), quant = load<{ findings: unknown[]; memory?: unknown[] }>("quant.json");
const apiSpeed = load<unknown[]>("api-speed.json");
const oModels = old<Model[]>("models.json"), oResults = old<Result[]>("results.json");
const oSpeeds = old<Speed[]>("speeds.json"), oQuant = old<{ findings: unknown[] }>("quant.json");

const priced = (m: Model) => [m.api?.price, m.api?.price_in, m.api?.price_out].some((x) => x !== undefined && x !== null);
const hasContext = (m: Model) => m.context_k !== undefined || (m as { context?: number }).context !== undefined;
const catById = new Map([...oModels, ...models].map((m) => [m.id, catOf(m)]));
const withResults = new Set(results.map((r) => r.model));

const categories = Object.fromEntries(CATEGORY_IDS.map((cat) => {
  const now = models.filter((m) => catOf(m) === cat), was = oModels.filter((m) => catOf(m) === cat);
  const inCat = new Set(now.map((m) => m.id)), wasIds = new Set(was.map((m) => m.id));
  const rs = results.filter((r) => inCat.has(r.model));
  const groups = connectedCells(toCells(rs, benches.filter((b) => (b.category ?? "llm") === cat)));
  const fits = groups.map((cells) => fit(cells));
  const scored = new Set(fits.flatMap((f) => [...f.scores.keys()]));
  return [cat, {
    original_models: was.length,
    original_results: oResults.filter((r) => catById.get(r.model) === cat).length,
    catalogue_models: now.length,
    results: rs.length,
    benchmark_definitions: benches.filter((b) => (b.category ?? "llm") === cat).length,
    models_with_results: now.filter((m) => withResults.has(m.id)).length,
    original_models_with_results: was.filter((m) => withResults.has(m.id)).length,
    models_with_score: scored.size,
    comparison_sets: fits.map((f) => ({ models: f.scores.size, series: f.params.size })).filter((s) => s.models > 0),
    original_priced: was.filter(priced).length,
    priced: now.filter(priced).length,
    original_models_without_results: was.filter((m) => !withResults.has(m.id)).map((m) => m.id),
    new_models: now.filter((m) => !wasIds.has(m.id)).map((m) => m.id),
  }];
}));

const p = load<Record<string, unknown>>("provenance.json");
p.updated = new Date().toISOString().replace(/\.\d+Z$/, "Z");
p.coverage = {
  baseline_commit: BASELINE,
  totals: {
    original_models: oModels.length, original_results: oResults.length,
    catalogue_models: models.length, results: results.length,
    original_priced_models: oModels.filter(priced).length, priced_models: models.filter(priced).length,
    original_context_models: oModels.filter(hasContext).length, context_models: models.filter(hasContext).length,
    original_speed_references: oSpeeds.length, published_speed_references: speeds.length, speed_models: new Set(speeds.map((s) => s.model)).size,
    original_quantization_findings: oQuant.findings.length, quantization_findings: quant.findings.length, memory_findings: quant.memory?.length ?? 0,
    original_api_speeds: oModels.filter((m) => m.api?.tps || m.api?.speed).length, api_speeds: models.filter((m) => m.api?.tps || m.api?.speed).length,
    api_speed_measurements: apiSpeed.length,
  },
  categories,
};
p.results_by_source = Object.fromEntries(Object.entries(results.reduce<Record<string, number>>((acc, r) => {
  const id = sourceId(r.source); acc[id] = (acc[id] ?? 0) + 1; return acc;
}, {})).sort());
p.remaining_original_models_without_results = Object.fromEntries(CATEGORY_IDS.map((c) => [c, (categories[c] as { original_models_without_results: string[] }).original_models_without_results]));
writeFileSync(file("provenance.json"), JSON.stringify(p, null, 2) + "\n");
const t = (p.coverage as { totals: Record<string, number> }).totals;
console.log(`results ${t.original_results} → ${t.results} · priced ${t.original_priced_models} → ${t.priced_models} · context ${t.original_context_models} → ${t.context_models}`);
console.log(`local speeds ${t.original_speed_references} → ${t.published_speed_references} · quant ${t.original_quantization_findings} → ${t.quantization_findings} · api speed ${t.original_api_speeds} → ${t.api_speeds}`);
for (const c of CATEGORY_IDS) {
  const x = categories[c] as { original_models_with_results: number; original_models: number; models_with_score: number; results: number; original_results: number };
  console.log(`  ${c.padEnd(5)} results ${x.original_results} → ${x.results} · original models covered ${x.original_models_with_results}/${x.original_models} · scored ${x.models_with_score}`);
}
