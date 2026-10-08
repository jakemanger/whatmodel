// What each whatmodel.sh page shows, computed in one place. The site renders these as HTML
// and scripts/pages.ts renders them as markdown, so the two always agree.
import {
  benchmarkById, comparisonForModel, comparisonSets, fitFor, gFor,
  models, modelsIn, quantFindings, results, sourcesFor, speeds, type ComparisonSet, type SourceSummary,
} from "./data.ts";
import { CATEGORIES, CATEGORY_IDS, catOf } from "./categories.ts";
import { catalogueOnly, rank } from "./fit.ts";
import { boardFromData } from "./board.ts";
import { boardData } from "./board-data.ts";
import type { QuantFinding } from "./quant.ts";
import type { Explained } from "./score.ts";
import { SOURCES, sourceId } from "./sources.ts";
import type { Category, Model, Result, Scored, Speed, Variant } from "./types.ts";

// A category's leaderboard for one query (machine, budget, sort, comparison set).
export function boardView(cat: Category, q: URLSearchParams) {
  return boardFromData(boardData(cat), q);
}
export type BoardView = ReturnType<typeof boardView>;

// Scored models that can no longer be run: no API and no weights. They anchor the fit and are listed on request.
export const retiredCount = (list: Model[], scores?: Map<string, Scored>) =>
  list.filter((m) => scores?.has(m.id) && catalogueOnly(m)).length;

// Catalogue entries have a page even before comparable measurements are available.
export const pageModels = () => models;

// A benchmark result as published: Elo as is, raw scales restored, everything else as a percentage.
export function resultLabel(r: Result) {
  const b = benchmarkById.get(r.bench);
  if (b?.kind === "linear") return `${r.score.toFixed(4)}${b.unit ? ` ${b.unit}` : ""}`;
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
  "other-source": "the only model in this source's run of the test, so there is nothing to compare it with there; another run of the test counts",
  sparse: "fewer than three models have this test yet, or this source ran it for this model alone",
  failed: "failed run",
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
      unused: { r: Result; reason: "untracked" | "other-source" | "sparse" | "failed"; why: string }[];
      variants: { v: Variant; label: string; g: number }[];
      measured: Speed[];
      quant: QuantFinding[];
    };

// Everything a model's page shows. null: no such model.
export function modelView(id: string): ModelView | null {
  const model = models.find((x) => x.id === id);
  if (!model) return null;
  const score = fitFor(id).scores.get(id);
  const explain = fitFor(id).explain(id);
  if (!score || !explain) {
    const raw = results.filter((r) => r.model === id);
    return { kind: "raw", model, raw };
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
      const reason = r.invalid ? "failed" as const : !benchmarkById.has(r.bench) ? "untracked" as const : usedBench.has(r.bench) ? "other-source" as const : "sparse" as const;
      return { r, reason, why: r.invalid ? `failed run: ${r.invalid}` : UNUSED[reason] };
    });

  return {
    kind: "scored", model, cat, score, explain,
    place: all.find((r) => r.id === id)?.rank ?? undefined,
    total: all.length,
    sources: sourcesFor(id),
    set: comparisonSets[cat].length > 1 ? comparisonForModel(id) : undefined,
    groups, unused,
    variants: (model.local?.variants ?? []).map((v) => { const q = gFor(model, v); return { v, label: q.label, g: q.g }; }),
    measured: speeds.filter((x) => x.model === id),
    quant: quantFindings.filter((f) => f.model_id === id).sort((a, b) => a.quant.localeCompare(b.quant) || b.retention - a.retention),
  };
}

// A benchmark run's place in the score: how sharply it separates models (a), its noise (σ),
// the weight one result carries (a² / σ²), and its share of all the evidence behind the
// category's scores (each model's explained shares, averaged over the scored models).
export type InfluenceRow = {
  key: string; id: string; evaluator?: string; benchmark?: ReturnType<typeof benchmarkById.get>;
  n: number; a: number; sigma: number; info: number; influence: number;
};
// One model's score split by benchmark, for the method page's colour bars.
export type ScoreSplit = { id: string; name: string; why: string; g: number; pm: number; n: number; prior: number; parts: { bench: string; share: number }[] };

const byBenchmark = (e: Explained) => {
  const m = new Map<string, number>();
  for (const p of e.parts) m.set(p.cell.bench, (m.get(p.cell.bench) ?? 0) + p.share);
  return [...m].map(([bench, share]) => ({ bench, share })).sort((a, b) => b.share - a.share);
};

// The method page: every benchmark run's weight per category, example score breakdowns and the sources.
export function methodView() {
  const categories = CATEGORY_IDS.flatMap((cat) => {
    const set = comparisonSets[cat][0];
    if (!set) return [];
    const f = set.fit, ids = [...f.scores.keys()];
    const share = new Map<string, number>();
    let prior = 0;
    for (const id of ids) {
      const e = f.explain(id)!;
      prior += e.prior.share;
      for (const p of e.parts) share.set(p.cell.key, (share.get(p.cell.key) ?? 0) + p.share);
    }
    const rows: InfluenceRow[] = [...f.params].map(([key, p]) => {
      const [id, ev] = key.split("@");
      return { key, id, evaluator: ev, benchmark: benchmarkById.get(id), n: p.n, a: p.a, sigma: p.sigma, info: (p.a * p.a) / (p.sigma * p.sigma), influence: (share.get(key) ?? 0) / ids.length };
    }).sort((a, b) => b.influence - a.influence);
    return [{ cat, title: CATEGORIES[cat].title, models: ids.length, prior: prior / ids.length, spread: f.levelSpread, rows }];
  });

  // Example text models: the leader, the best open-weights model, a mid-table model, a 2023 model,
  // the best thinly tested model and the best model with no verified way to run it.
  const llm = comparisonSets.llm[0].fit;
  const scored = [...llm.scores.values()].sort((a, b) => b.g - a.g);
  const meta = (id: string) => models.find((m) => m.id === id)!;
  const picks: [Scored | undefined, string][] = [
    [scored[0], "highest score"],
    [scored.find((s) => meta(s.id).open_weights), "best open weights"],
    [scored[Math.floor(scored.length / 2)], "middle of the table"],
    [scored.find((s) => (meta(s.id).released ?? "") < "2024" && meta(s.id).released && s.n >= 5), "best from 2023"],
    [scored.find((s) => s.n < 3), "fewest results near the top (*)"],
    [scored.find((s) => catalogueOnly(meta(s.id))), "best comparison-only model"],
  ];
  const seen = new Set<string>();
  const examples: ScoreSplit[] = picks.flatMap(([s, why]) => {
    if (!s || seen.has(s.id)) return [];
    seen.add(s.id);
    const e = llm.explain(s.id)!;
    return [{ id: s.id, name: meta(s.id).name, why, g: s.g, pm: s.pm, n: s.n, prior: e.prior.share, parts: byBenchmark(e) }];
  });

  // How much of the top 20 text models' evidence comes from FrontierMath, and from its single biggest test.
  const top = scored.slice(0, 20).map((s) => byBenchmark(llm.explain(s.id)!));
  const fm = top.reduce((t, parts) => t + parts.filter((p) => p.bench.startsWith("frontiermath")).reduce((u, p) => u + p.share, 0), 0) / top.length;
  const allFm = scored.reduce((t, s) => t + byBenchmark(llm.explain(s.id)!).filter((p) => p.bench.startsWith("frontiermath")).reduce((u, p) => u + p.share, 0), 0) / scored.length;

  return {
    categories, examples, frontiermath: { top20: fm, all: allFm },
    results: results.length, sources: SOURCES.filter((x) => x.verdict === "allowed"),
  };
}
