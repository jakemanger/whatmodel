// Serializable, precomputed inputs. This module runs in the browser and never loads
// benchmark results, source matching rules, or the statistical fitting engine.
import { catOf } from "./categories.ts";
import { catalogueOnly, listedByDefault, parseMax, parseSort, parseSpecs, rank, sortRows } from "./fit.ts";
import { measuredSpeed } from "./measured.ts";
import { bitsLabel, bitsOf } from "./quant.ts";
import type { Category, Hardware, Model, Scored, Speed } from "./types.ts";
import type { SourceSummary } from "./data.ts";
import type { TaskDefinition } from "./tasks.ts";

export type BoardSet = { id: string; label: string; models: string[]; scores: Scored[]; benches: number };
export type BoardEvidence = { sets: BoardSet[]; resultModels: string[]; sources: Record<string, SourceSummary[]> };
export type BoardTask = TaskDefinition & BoardEvidence;
export type BoardData = {
  cat: Category;
  updated: string;
  updatedLabel: string;
  models: Model[];
  hardware: Hardware[];
  speeds: Speed[];
  sets: BoardSet[];
  resultModels: string[];
  sources: Record<string, SourceSummary[]>;
  tasks?: BoardTask[];
  icons?: Record<string, string>; // model id -> maker logo path under icons/, no extension (lib/icons.ts)
};

const indexes = new WeakMap<BoardEvidence, ReturnType<typeof indexData>>();
// Each model's result count in the category's overall score, which decides whether it's listed by default.
const counts = new WeakMap<BoardData, Map<string, number>>();
const countsOf = (data: BoardData) => {
  let c = counts.get(data);
  if (!c) { c = new Map(data.sets[0]?.scores.map((s) => [s.id, s.n]) ?? []); counts.set(data, c); }
  return c;
};
function indexData(data: BoardEvidence) {
  return {
    scored: new Set(data.sets.flatMap((set) => set.models)),
    results: new Set(data.resultModels),
    scores: new Map(data.sets.map((set) => [set.id, new Map(set.scores.map((s) => [s.id, s]))])),
    models: new Map(data.sets.map((set) => [set.id, new Set(set.models)])),
  };
}

export function boardFromData(data: BoardData, q: URLSearchParams) {
  const task = data.tasks?.find((t) => t.id === q.get("task"));
  const evidence = task ?? data;
  let index = indexes.get(evidence);
  if (!index) { index = indexData(evidence); indexes.set(evidence, index); }
  const { cat, hardware } = data;
  const { sets, sources } = evidence;
  const list = task ? data.models.filter((m) => index.results.has(m.id)) : data.models;
  const specs = parseSpecs(q, hardware);
  const max = parseMax(q);
  const comparison = sets.find((set) => set.id === q.get("set"));
  const scoreMode: "set" | "overall" = comparison && q.get("score") === "set" ? "set" : "overall";
  const scoreSet = scoreMode === "set" ? comparison : sets[0];
  const scores = index.scores.get(scoreSet?.id ?? "") ?? new Map<string, Scored>();
  const eligible = list;
  const members = comparison ? index.models.get(comparison.id) : undefined;
  const filtered = members ? eligible.filter((m) => members.has(m.id)) : eligible;
  // Comparison-only models (no verified API or download, often retired) are listed with their score
  // by default. ?retired=0 hides them; ?retired=1 also lists those without a score.
  const retired = q.get("retired") !== "0";
  const allRetired = q.get("retired") === "1";
  let ranked = rank(filtered, scores, {
    specs, max, thinBelow: 3, retired, includeUnscored: true,
    gFor: (m, v) => ({ g: scores.get(m.id)!.g, label: catOf(m) === "llm" ? bitsLabel(bitsOf(v)) : v.quant }),
    speedFor: (m, v, s) => measuredSpeed(data.speeds, m, v, s),
  }).filter((r) => allRetired || r.where !== "retired" || scores.has(r.id));
  // Text models with fewer than three results are only listed with ?thin=1; the rest are renumbered without them.
  const all = q.has("all");
  const thin = q.get("thin") === "1";
  const n = countsOf(data);
  const unlisted = new Set(ranked.filter((r) => !listedByDefault(cat, n.get(r.id))).map((r) => r.id));
  const thinCount = ranked.filter((r) => unlisted.has(r.id) && (all || r.where !== "none")).length;
  if (!thin && unlisted.size) {
    ranked = ranked.filter((r) => !unlisted.has(r.id));
    let i = 0;
    for (const r of ranked) r.rank = r.score === null ? null : ++i;
  }
  const listed = new Set(ranked.map((r) => r.id));
  for (const row of ranked) row.evidence = !index.results.has(row.id) ? "none" : index.scored.has(row.id) ? "comparison" : "raw";
  const { sort, dir } = parseSort(q, ranked);
  const rows = sortRows(ranked, sort, dir);
  const shown = all ? rows : rows.filter((r) => r.where !== "none");
  return {
    cat, task, sources, specs, max, models: list, comparison, scoreMode, scoreSet, sets, ranked, rows, sort, dir, all, shown,
    hidden: rows.length - shown.length, retired, thin, thinCount,
    retiredCount: filtered.filter((m) => catalogueOnly(m) && (allRetired || scores.has(m.id))).length,
    benches: scoreSet?.benches ?? 0,
    outside: {
      comparisonOnly: filtered.filter((m) => catalogueOnly(m) && !listed.has(m.id) && (thin || !unlisted.has(m.id)) && index.scored.has(m.id)),
      unscored: filtered.filter((m) => catalogueOnly(m) && !listed.has(m.id) && (thin || !unlisted.has(m.id)) && !index.scored.has(m.id) && index.results.has(m.id)),
      withoutResults: filtered.filter((m) => catalogueOnly(m) && !listed.has(m.id) && (thin || !unlisted.has(m.id)) && !index.results.has(m.id)),
    },
  };
}
