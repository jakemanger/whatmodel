// Serializable, precomputed inputs. This module runs in the browser and never loads
// benchmark results, source matching rules, or the statistical fitting engine.
import { catOf } from "./categories.ts";
import { parseMax, parseSort, parseSpecs, rank, sortRows } from "./fit.ts";
import { measuredSpeed } from "./measured.ts";
import { bitsLabel, bitsOf } from "./quant.ts";
import type { Category, Hardware, Model, Scored, Speed } from "./types.ts";
import type { SourceSummary } from "./data.ts";

export type BoardSet = { id: string; label: string; models: string[]; scores: Scored[]; benches: number };
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
  icons?: Record<string, string>; // model id -> maker logo path under icons/, no extension (lib/icons.ts)
};

const indexes = new WeakMap<BoardData, ReturnType<typeof indexData>>();
function indexData(data: BoardData) {
  return {
    scored: new Set(data.sets.flatMap((set) => set.models)),
    results: new Set(data.resultModels),
    scores: new Map(data.sets.map((set) => [set.id, new Map(set.scores.map((s) => [s.id, s]))])),
    models: new Map(data.sets.map((set) => [set.id, new Set(set.models)])),
  };
}

export function boardFromData(data: BoardData, q: URLSearchParams) {
  let index = indexes.get(data);
  if (!index) { index = indexData(data); indexes.set(data, index); }
  const { cat, models: list, hardware, sets } = data;
  const specs = parseSpecs(q, hardware);
  const max = parseMax(q);
  const comparison = sets.find((set) => set.id === q.get("set"));
  const scoreMode: "set" | "overall" = comparison && q.get("score") === "set" ? "set" : "overall";
  const scoreSet = scoreMode === "set" ? comparison : sets[0];
  const scores = index.scores.get(scoreSet?.id ?? "") ?? new Map<string, Scored>();
  const eligible = list;
  const members = comparison ? index.models.get(comparison.id) : undefined;
  const filtered = members ? eligible.filter((m) => members.has(m.id)) : eligible;
  const retired = q.has("retired");
  const ranked = rank(filtered, scores, {
    specs, max, thinBelow: 3, retired, includeUnscored: true,
    gFor: (m, v) => ({ g: scores.get(m.id)!.g, label: catOf(m) === "llm" ? bitsLabel(bitsOf(v)) : v.quant }),
    speedFor: (m, v, s) => measuredSpeed(data.speeds, m, v, s),
  });
  for (const row of ranked) row.evidence = !index.results.has(row.id) ? "none" : index.scored.has(row.id) ? "comparison" : "raw";
  const { sort, dir } = parseSort(q, ranked);
  const rows = sortRows(ranked, sort, dir);
  const all = q.has("all");
  const shown = all ? rows : rows.filter((r) => r.where !== "none");
  return {
    cat, specs, max, models: list, comparison, scoreMode, scoreSet, sets, ranked, rows, sort, dir, all, shown,
    hidden: rows.length - shown.length, retired,
    retiredCount: filtered.filter((m) => !m.api && !m.local?.variants.length).length,
    benches: scoreSet?.benches ?? 0,
    outside: {
      comparisonOnly: retired ? [] : filtered.filter((m) => !m.api && !m.local?.variants.length && index.scored.has(m.id)),
      unscored: retired ? [] : filtered.filter((m) => !m.api && !m.local?.variants.length && !index.scored.has(m.id) && index.results.has(m.id)),
      withoutResults: retired ? [] : filtered.filter((m) => !m.api && !m.local?.variants.length && !index.results.has(m.id)),
    },
  };
}
