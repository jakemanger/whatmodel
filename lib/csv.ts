// Flat CSV versions of the data for spreadsheets, pandas and the Hugging Face mirror.
// One row per score, model, result, speed measurement and bench run.
import { CATEGORIES, catOf, priceOf } from "./categories.ts";
import { benchmarkById, comparisonSets, models, results, speeds } from "./data.ts";
import { benchName, resultLabel } from "./views.ts";
import type { Category } from "./types.ts";

type Value = string | number | boolean | null | undefined;
const field = (v: Value) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(head: string[], rows: Value[][]) {
  return [head, ...rows].map((r) => r.map(field).join(",")).join("\n") + "\n";
}

type BenchRun = { id: string; submitted: string; hardware: string; hardware_label: string; os: string; engine: string; model: string; model_id: string; quant: string; ctx: number; tg_median: number; pp_median: number; gpu_pct: number };

export function csvTables(bench: BenchRun[]): Record<string, string> {
  const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  const scores = Object.entries(comparisonSets).flatMap(([cat, sets]) => sets.flatMap((set) =>
    [...set.fit.scores.values()].sort((a, b) => b.g - a.g).map((s, i) => [
      cat, set.id, s.id, models.find((m) => m.id === s.id)?.name, i + 1, round(s.g, 1), round(s.pm, 1), s.n,
    ])));
  return {
    "scores.csv": toCsv(["category", "comparison_set", "model_id", "model", "rank_in_set", "score", "uncertainty", "results_used"], scores),
    "models.csv": toCsv(
      ["model_id", "name", "provider", "category", "released", "params_b", "active_b", "open_weights", "license", "context_k",
        "api_provider", "api_price", "api_price_unit", "api_url", "local_downloads"],
      models.map((m) => {
        const cat: Category = catOf(m);
        return [m.id, m.name, m.provider, cat, m.released, m.params_b, m.active_b, m.open_weights, m.license, m.context_k,
          m.api?.provider, priceOf(m.api), m.api ? CATEGORIES[cat].priceUnit : null, m.api?.url, m.local?.variants.length ?? 0];
      })),
    "results.csv": toCsv(
      ["model_id", "benchmark_id", "benchmark", "score", "score_as_published", "benchmark_kind", "reported_by", "date", "source", "note"],
      results.map((r) => [r.model, r.bench, benchName(r.bench), r.score, resultLabel(r), benchmarkById.get(r.bench)?.kind, r.by, r.date, r.source, r.note])),
    "speeds.csv": toCsv(
      ["model_id", "hardware", "hardware_kind", "precision", "offload", "speed", "unit", "engine", "settings", "source", "note"],
      speeds.map((x) => [x.model, x.hardware, x.kind, x.quant, x.offload, x.value, x.unit, x.engine, x.settings, x.source, x.note])),
    "bench-runs.csv": toCsv(
      ["run_id", "submitted", "hardware_id", "hardware", "os", "engine", "model_id", "ollama_model", "precision", "context", "generation_tok_s", "prompt_tok_s", "gpu_percent"],
      bench.map((b) => [b.id, b.submitted, b.hardware, b.hardware_label, b.os, b.engine, b.model_id, b.model, b.quant, b.ctx, b.tg_median, b.pp_median, b.gpu_pct])),
  };
}
