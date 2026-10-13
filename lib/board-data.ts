// Build-time adapter from the research data to the small, browser-safe board inputs.
import { benchmarks, comparisonSets, hardware, modelsIn, results, setsForCells, sourcesFor, sourcesForFit, speeds, updated, updatedLabel, type ComparisonSet } from "./data.ts";
import type { BoardData } from "./board.ts";
import { modelIcon } from "./icons.ts";
import type { Category } from "./types.ts";
import { listedByDefault } from "./fit.ts";
import type { BenchSpeed } from "./measured.ts";
import { TASKS } from "./tasks.ts";
import { toCells } from "./score.ts";

const serializeSets = (sets: ComparisonSet[]) => sets.map((set) => ({
  id: set.id, label: set.label, models: set.models, scores: [...set.fit.scores.values()],
  benches: new Set([...set.fit.params.keys()].map((key) => key.split("@")[0])).size,
}));

const cache = new Map<Category, BoardData>();
export function boardData(cat: Category): BoardData {
  const existing = cache.get(cat);
  if (existing) return existing;
  const models = modelsIn(cat);
  const ids = new Set(models.map((m) => m.id));
  const sets = serializeSets(comparisonSets[cat]);
  const tasks = TASKS.filter((t) => t.category === cat).map((task) => {
    const selected = new Set(task.benchmarks);
    const rs = results.filter((r) => ids.has(r.model) && selected.has(r.bench));
    const fitted = setsForCells(toCells(rs, benchmarks.filter((b) => selected.has(b.id))));
    return { ...task, sets: serializeSets(fitted), resultModels: [...new Set(rs.map((r) => r.model))],
      sources: Object.fromEntries(fitted.flatMap((set) => set.models.map((id) => [id, sourcesForFit(id, set.fit)]))),
    };
  });
  const data: BoardData = {
    cat, updated, updatedLabel, models, hardware,
    // Every measured speed, with what lib/measured.ts needs to pick the one a row shows.
    speeds: (speeds as BenchSpeed[])
      .filter((s) => ids.has(s.model))
      .map(({ model, quant, hardware, hardware_id, kind, offload, value, unit, source, context_tokens }) => ({ model, quant, hardware, hardware_id, kind, offload, value, unit, source, context_tokens })),
    sets, tasks,
    resultModels: [...new Set(results.filter((r) => ids.has(r.model)).map((r) => r.model))],
    sources: Object.fromEntries(models.map((m) => [m.id, sourcesFor(m.id)])),
    icons: Object.fromEntries(models.flatMap((m) => { const icon = modelIcon(m); return icon ? [[m.id, icon]] : []; })),
  };
  cache.set(cat, data);
  return data;
}

// Whether a model is on its category's leaderboards by default (lib/fit.ts listedByDefault).
const counts = new Map<Category, Map<string, number>>();
export function listedModel(cat: Category, id: string) {
  if (!counts.has(cat)) counts.set(cat, new Map(boardData(cat).sets[0]?.scores.map((s) => [s.id, s.n]) ?? []));
  return listedByDefault(cat, counts.get(cat)!.get(id));
}
