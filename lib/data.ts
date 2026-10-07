import modelsJson from "../data/models.json" with { type: "json" };
import resultsJson from "../data/results.json" with { type: "json" };
import benchmarksJson from "../data/benchmarks.json" with { type: "json" };
import metaJson from "../data/meta.json" with { type: "json" };
import quantJson from "../data/quant.json" with { type: "json" };
import hardwareJson from "../data/hardware.json" with { type: "json" };
import speedsJson from "../data/speeds.json" with { type: "json" };
import { CATEGORY_IDS, catOf } from "./categories.ts";
import { measuredSpeed } from "./measured.ts";
import { bitsLabel, bitsOf, type QuantFinding, type QuantRow } from "./quant.ts";
import { fit, toCells, type Fit } from "./score.ts";
import { connectedCells } from "./comparisons.ts";
import { sourceIcon, sourceId, sourceName, sourceOf } from "./sources.ts";
import type { Benchmark, Category, Hardware, Model, Result, Specs, Speed, Variant } from "./types.ts";

// Bytes per weight by precision name, for variants whose sources give no memory figure.
const BYTES: [RegExp, number][] = [[/fp32|f32/, 4], [/fp16|bf16|f16/, 2], [/8.?bit|q8|int8|fp8/, 1], [/4.?bit|q4|int4|nf4|fp4/, 0.5], [/2.?bit|q2/, 0.25], [/1.?bit|iq1/, 0.125]];
const withMemory = (m: Model): Model => {
  if (!m.local || !m.params_b) return m;
  const variants = m.local.variants.map((v) => {
    if (v.gb > 0) return v;
    const bytes = BYTES.find(([re]) => re.test(v.quant.toLowerCase()))?.[1] ?? 2;
    return { ...v, gb: Math.round((m.params_b! * bytes * 1.2 + 0.5) * 10) / 10, gb_estimated: true };
  });
  return { ...m, local: { variants: variants.filter((v) => v.gb > 0) } };
};

export const models = (modelsJson as Model[]).map(withMemory);
export const results = resultsJson as Result[];
export const benchmarks = benchmarksJson as Benchmark[];
export const benchmarkById = new Map(benchmarks.map((b) => [b.id, b]));
export const hardware = hardwareJson as Hardware[];
export const speeds = speedsJson as Speed[];
export const modelById = new Map(models.map((m) => [m.id, m]));

// Separate categories and connected comparison sets have separate score scales.
// Tiny datasets, so fit once per server instance.
const benchCat = (b: Benchmark): Category => b.category ?? "llm";
export type ComparisonSet = { id: string; label: string; models: string[]; fit: Fit };
const emptyFit = fit([]);
export const comparisonSets = Object.fromEntries(
  CATEGORY_IDS.map((c) => {
    const rs = results.filter((r) => catOf(modelById.get(r.model) ?? ({} as Model)) === c);
    const cells = toCells(rs, benchmarks.filter((b) => benchCat(b) === c));
    return [c, setsForCells(cells)];
  })
) as Record<Category, ComparisonSet[]>;

export function setsForCells(cells: import("./score.ts").Cell[]): ComparisonSet[] {
  return connectedCells(cells).map((group) => {
      const counts = new Map<string, number>();
      for (const cell of group) counts.set(cell.key, (counts.get(cell.key) ?? 0) + 1);
      const representative = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
      return { id: representative, label: benchmarkById.get(representative.split("@")[0])?.name ?? representative,
        models: [...new Set(group.map((x) => x.model))], fit: fit(group) };
  });
}

export const comparisonFor = (c: Category, id?: string | null) =>
  comparisonSets[c].find((set) => set.id === id) ?? comparisonSets[c][0];
export const comparisonForModel = (id: string) =>
  comparisonSets[catOf(modelById.get(id) ?? ({} as Model))].find((set) => set.fit.scores.has(id));

export const modelsIn = (c: Category) => models.filter((m) => catOf(m) === c);
export const fitFor = (id: string) => comparisonForModel(id)?.fit ?? emptyFit;

// Benchmarks with enough results to count toward g.
export const benchesUsed = (c: Category, id?: string | null) => new Set([...(comparisonFor(c, id)?.fit.params.keys() ?? [])].map((k) => k.split("@")[0])).size;

export const quantTable = quantJson.table as QuantRow[];
export const quantFindings = quantJson.findings as QuantFinding[];

// The score describes the published evaluation, not a measured quantized download.
// Quantization adjustments and speed estimates are withheld pending reviewed evidence.
export function gFor(m: Model, v: Variant) {
  return { g: fitFor(m.id).scores.get(m.id)!.g, label: catOf(m) === "llm" ? bitsLabel(bitsOf(v)) : v.quant, kept: null };
}

export const speedFor = (m: Model, v: Variant, s: Specs) => measuredSpeed(speeds, m, v, s);

// When the data last changed (set by whoever edits data/, see UPDATING.md).
export const updated = metaJson.updated;
export const updatedLabel = updated.replace("T", " ").replace(/:\d\dZ$/, " UTC");

export type SourceSummary = {
  id: string;
  icon: string;
  name: string;
  license?: string;
  lab: boolean;
  share: number;
  tests: string[];
};

// Which sources a model's score came from, and how much each one weighed.
const sourceSummaries = new Map<string, SourceSummary[]>();
export function sourcesFor(id: string): SourceSummary[] {
  const cached = sourceSummaries.get(id);
  if (cached) return cached;
  const summaries = sourcesForFit(id, fitFor(id));
  sourceSummaries.set(id, summaries);
  return summaries;
}

export function sourcesForFit(id: string, fitted: Fit): SourceSummary[] {
  const e = fitted.explain(id);
  if (!e) return [];
  const by = new Map<string, SourceSummary>();
  for (const p of e.parts) {
    for (const r of p.cell.results) {
      const h = sourceId(r.source);
      const s = by.get(h) ?? {
        id: h,
        icon: sourceIcon(r.source),
        name: sourceName(r.source),
        license: sourceOf(r.source)?.license,
        lab: true,
        share: 0,
        tests: [],
      };
      s.share += p.share / p.cell.results.length;
      s.lab &&= r.by === "lab";
      const test = benchmarkById.get(r.bench)?.name ?? r.bench;
      if (!s.tests.includes(test)) s.tests.push(test);
      by.set(h, s);
    }
  }
  const summaries = [...by.values()].sort((a, b) => b.share - a.share);
  return summaries;
}
