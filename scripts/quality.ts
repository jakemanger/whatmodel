// npm run quality [-- <dir>] — how good is the data? Per category: how many models are ranked, how many
// results back each one, and how well the score predicts held-out results (leave-one-out).
// With --baseline <dir> (a copy of data/ from before a change), also compares rankings (Spearman).

import { readFileSync, writeFileSync } from "node:fs";
import { CATEGORY_IDS } from "../lib/categories.ts";
import { fit, toCells } from "../lib/score.ts";
import { connectedCells, heldOutPrediction } from "../lib/comparisons.ts";
import type { Benchmark, Model, Result } from "../lib/types.ts";

const args = process.argv.slice(2);
const baseDir = args.includes("--baseline") ? args[args.indexOf("--baseline") + 1] : null;
const saveTo = args.includes("--save") ? args[args.indexOf("--save") + 1] : null;
const load = <T>(dir: string, f: string): T => JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
const repo = process.env.DATA_DIR ?? new URL("../data", import.meta.url).pathname;

function measure(dir: string) {
  const models = load<Model[]>(dir, "models.json");
  const results = load<Result[]>(dir, "results.json");
  const benches = load<Benchmark[]>(dir, "benchmarks.json");
  const cat = (m: Model) => m.category ?? "llm";
  const out: Record<string, { models: number; ranked: number; comparison_sets: number; median_results: number; with3: number; loo_r: number | null; scores: Record<string, number> }> = {};
  for (const c of CATEGORY_IDS) {
    const ms = models.filter((m) => cat(m) === c);
    const ids = new Set(ms.map((m) => m.id));
    const cells = toCells(results.filter((r) => ids.has(r.model)), benches.filter((b) => (b.category ?? "llm") === c));
    const groups = connectedCells(cells), fits = groups.map((group) => fit(group));
    const scores = new Map(fits.flatMap((f) => [...f.scores]));
    const per = ms.map((m) => cells.filter((x) => x.model === m.id).length).sort((a, b) => a - b);
    const zs: [number, number][] = [];
    for (const [g, group] of groups.entries()) {
      for (let i = 0; i < group.length; i++) {
        const rest = group.filter((_, j) => j !== i);
        if (!rest.some((x) => x.model === group[i].model)) continue;
        const yhat = heldOutPrediction(rest, group[i].model, group[i].key);
        const p = fits[g].params.get(group[i].key);
        if (yhat !== undefined && p) zs.push([(group[i].y - p.d) / p.a, (yhat - p.d) / p.a]);
      }
    }
    out[c] = {
      models: ms.length,
      ranked: scores.size,
      comparison_sets: groups.length,
      median_results: per[per.length >> 1] ?? 0,
      with3: per.filter((n) => n >= 3).length,
      loo_r: zs.length > 3 ? +corr(zs).toFixed(3) : null,
      scores: Object.fromEntries([...scores].map(([id, s]) => [id, s.g])),
    };
  }
  return out;
}

function corr(xy: [number, number][]) {
  const n = xy.length, mx = xy.reduce((s, [x]) => s + x, 0) / n, my = xy.reduce((s, [, y]) => s + y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of xy) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  return sxy / Math.sqrt(sxx * syy);
}
const ranks = (xs: number[]) => { const o = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]); const r = Array(xs.length); o.forEach(([, i], k) => (r[i] = k)); return r; };

const now = measure(repo);
const base = baseDir ? measure(baseDir) : null;
console.log("category  ranked/models  median results  >=3 results  leave-one-out r" + (base ? "   vs baseline: ranked, >=3, r, rank agreement" : ""));
for (const c of CATEGORY_IDS) {
  const a = now[c];
  let line = `${c.padEnd(8)}  ${`${a.ranked}/${a.models}`.padStart(13)}  ${String(a.median_results).padStart(14)}  ${String(a.with3).padStart(11)}  ${String(a.loo_r ?? "-").padStart(15)}`;
  if (base) {
    const b = base[c];
    const both = Object.keys(a.scores).filter((id) => id in b.scores);
    const rho = a.comparison_sets === 1 && b.comparison_sets === 1 && both.length > 3 ? corr(ranks(both.map((id) => a.scores[id])).map((x, i) => [x, ranks(both.map((id) => b.scores[id]))[i]]) as [number, number][]) : NaN;
    line += `   ${b.ranked}→${a.ranked}, ${b.with3}→${a.with3}, ${b.loo_r}→${a.loo_r}, ${Number.isFinite(rho) ? `spearman ${rho.toFixed(2)} (n=${both.length})` : "cross-set rank agreement not applicable"}`;
  }
  console.log(line);
}
if (saveTo) writeFileSync(saveTo, JSON.stringify(now, null, 2));
