// What each whatmodel.sh page shows, computed in one place. The site renders these as HTML
// and scripts/pages.ts renders them as markdown, so the two always agree.
import {
  benchesUsed, benchmarkById, comparisonFor, comparisonForModel, comparisonSets, fitFor, gFor, hardware,
  models, modelsIn, quantFindings, results, sourcesFor, speedFor, speeds, type ComparisonSet, type SourceSummary,
} from "./data.ts";
import { catOf } from "./categories.ts";
import { parseMax, parseSort, parseSpecs, rank, sortRows } from "./fit.ts";
import type { QuantFinding } from "./quant.ts";
import type { Explained } from "./score.ts";
import { SOURCES, sourceId } from "./sources.ts";
import type { Category, Model, Result, Scored, Speed, Variant } from "./types.ts";

// A category's leaderboard for one query (machine, budget, sort, comparison set).
export function boardView(cat: Category, q: URLSearchParams) {
  const specs = parseSpecs(q, hardware);
  const max = parseMax(q);
  const list = modelsIn(cat);
  const comparison = comparisonFor(cat, q.get("set"));
  const ranked = rank(list, comparison?.fit.scores ?? new Map(), { specs, max, gFor, speedFor, thinBelow: 3 });
  const { sort, dir } = parseSort(q, ranked);
  const rows = sortRows(ranked, sort, dir);
  const all = q.has("all");
  const shown = all ? rows : rows.filter((r) => r.where !== "none");
  return {
    cat, specs, max, models: list, comparison, sets: comparisonSets[cat], ranked, rows, sort, dir, all, shown,
    hidden: rows.length - shown.length,
    benches: benchesUsed(cat, comparison?.id),
    // Catalogue models the leaderboard can't rank, and why.
    outside: {
      comparisonOnly: list.filter((m) => comparison?.models.includes(m.id) && !m.api && !m.local?.variants.length),
      unscored: list.filter((m) => !fitFor(m.id).scores.has(m.id) && results.some((r) => r.model === m.id)),
      withoutResults: list.filter((m) => !results.some((r) => r.model === m.id)),
    },
  };
}
export type BoardView = ReturnType<typeof boardView>;

// Models with a page: anything with at least one reviewed result.
export const pageModels = () => models.filter((m) => results.some((r) => r.model === m.id));

// A benchmark result as published: Elo as is, raw scales restored, everything else as a percentage.
export function resultLabel(r: Result) {
  const b = benchmarkById.get(r.bench);
  if (b?.kind === "elo") return r.score.toFixed(1);
  if (b?.raw_scale_min !== undefined && b.raw_scale_max !== undefined)
    return `${(b.raw_scale_min + r.score * (b.raw_scale_max - b.raw_scale_min)).toFixed(2)} / ${b.raw_scale_max}`;
  return `${(r.score * 100).toFixed(1)}%`;
}
export const benchName = (id: string) => benchmarkById.get(id)?.name ?? id;
export const shareBar = (share: number) => "▇".repeat(Math.max(1, Math.round(share * 30)));

// Why a published result doesn't count toward the score.
const UNUSED = {
  untracked: "not a tracked benchmark",
  "other-source": "too few results from this source to calibrate it; another source's number for this test is used",
  sparse: "too few models have this result to calibrate it yet",
};

export type ScoreRow = { r: Result; g: number; share: number; avg: number };
export type ModelView =
  | { kind: "raw"; model: Model; raw: Result[] }
  | {
      kind: "scored";
      model: Model;
      cat: Category;
      score: Scored;
      explain: Explained;
      place: number | undefined; // undefined: comparison only (no API or weights left)
      total: number;
      sources: SourceSummary[];
      set: ComparisonSet | undefined; // named only when the category has several sets
      groups: { id: string; share: number; rows: ScoreRow[] }[]; // by source, biggest influence first
      unused: { r: Result; reason: "untracked" | "other-source" | "sparse"; why: string }[];
      variants: { v: Variant; label: string; g: number }[];
      measured: Speed[];
      quant: QuantFinding[];
    };

// Everything a model's page shows. null: no such model, or nothing published about it.
export function modelView(id: string): ModelView | null {
  const model = models.find((x) => x.id === id);
  if (!model) return null;
  const score = fitFor(id).scores.get(id);
  const explain = fitFor(id).explain(id);
  if (!score || !explain) {
    const raw = results.filter((r) => r.model === id);
    return raw.length ? { kind: "raw", model, raw } : null;
  }

  const cat = catOf(model);
  const all = rank(modelsIn(cat), fitFor(id).scores, { specs: null });

  // One row per raw result, grouped by the source it came from.
  const bySource = new Map<string, { share: number; rows: ScoreRow[] }>();
  for (const p of explain.parts) {
    for (const r of p.cell.results) {
      const h = sourceId(r.source);
      const grp = bySource.get(h) ?? { share: 0, rows: [] };
      const share = p.share / p.cell.results.length;
      grp.share += share;
      grp.rows.push({ r, g: p.g, share, avg: p.cell.results.length });
      bySource.set(h, grp);
    }
  }
  const groups = [...bySource]
    .sort((a, b) => b[1].share - a[1].share)
    .map(([h, grp]) => ({ id: h, share: grp.share, rows: grp.rows.sort((a, b) => b.share - a.share) }));

  const used = new Set(explain.parts.flatMap((p) => p.cell.results));
  const usedBench = new Set(explain.parts.map((p) => p.cell.bench));
  const unused = results
    .filter((r) => r.model === id && !used.has(r))
    .map((r) => {
      const reason = !benchmarkById.has(r.bench) ? "untracked" as const : usedBench.has(r.bench) ? "other-source" as const : "sparse" as const;
      return { r, reason, why: UNUSED[reason] };
    });

  return {
    kind: "scored", model, cat, score, explain,
    place: all.find((r) => r.id === id)?.rank,
    total: all.length,
    sources: sourcesFor(id),
    set: comparisonSets[cat].length > 1 ? comparisonForModel(id) : undefined,
    groups, unused,
    variants: (model.local?.variants ?? []).map((v) => { const q = gFor(model, v); return { v, label: q.label, g: q.g }; }),
    measured: speeds.filter((x) => x.model === id),
    quant: quantFindings.filter((f) => f.model_id === id).sort((a, b) => a.quant.localeCompare(b.quant) || b.retention - a.retention),
  };
}

// The method page's tables: every calibrated benchmark series, strongest separators first, and the sources.
export function methodView() {
  // Benchmark keys are unique across categories (each benchmark belongs to one).
  const params = Object.values(comparisonSets)
    .flatMap((sets) => sets.flatMap((set) => [...set.fit.params]))
    .sort((a, b) => b[1].a - a[1].a)
    .map(([key, p]) => {
      const [id, ev] = key.split("@");
      return { key, id, evaluator: ev, benchmark: benchmarkById.get(id), ...p };
    });
  return { params, results: results.length, sources: SOURCES.filter((x) => x.verdict === "allowed") };
}
