import { fit, type Cell } from "./score.ts";

// A score can only compare models connected through shared evaluation series.
// Different protocols already have different Cell keys; sharing a metric name is not a bridge.
export function connectedCells(cells: Cell[]): Cell[][] {
  const byModel = new Map<string, Cell[]>(), byKey = new Map<string, Cell[]>();
  for (const c of cells) {
    byModel.set(c.model, [...(byModel.get(c.model) ?? []), c]);
    byKey.set(c.key, [...(byKey.get(c.key) ?? []), c]);
  }
  const seenModels = new Set<string>(), seenKeys = new Set<string>(), groups: Cell[][] = [];
  for (const model of byModel.keys()) {
    if (seenModels.has(model)) continue;
    const pending = [model], group: Cell[] = [];
    while (pending.length) {
      const id = pending.pop()!;
      if (seenModels.has(id)) continue;
      seenModels.add(id);
      for (const c of byModel.get(id) ?? []) {
        if (seenKeys.has(c.key)) continue;
        seenKeys.add(c.key);
        const series = byKey.get(c.key)!;
        group.push(...series);
        pending.push(...series.map((x) => x.model));
      }
    }
    groups.push(group);
  }
  return groups.sort((a, b) => new Set(b.map((c) => c.model)).size - new Set(a.map((c) => c.model)).size);
}

// Removing a bridge observation can disconnect a validation fold. In that case
// the held-out comparison is not identifiable and must not receive a prediction.
export function heldOutPrediction(rest: Cell[], model: string, key: string) {
  const group = connectedCells(rest).find((g) => g.some((c) => c.model === model) && g.some((c) => c.key === key));
  return group ? fit(group, 200).predict(model, key) : undefined;
}
