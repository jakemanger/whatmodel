// The "g" score: a one-factor latent model fit over every benchmark result.
//
//   y[model, bench] ≈ a[bench] · θ[model] + d[bench] + noise(σ[bench])
//
// y is the benchmark score moved onto a logit scale (after removing the chance
// rate), so an easy benchmark and a hard one are comparable. θ is each model's
// ability; a is how well a benchmark separates strong from weak models (saturated
// ones get a small a); d is its difficulty. Because a and d are fit jointly with θ,
// a model tested only on easy benchmarks doesn't get an inflated score, and models
// with few results are shrunk toward the middle with a wider ± interval.

import { sourceId } from "./sources.ts";
import type { Benchmark, Result, Scored } from "./types.ts";

const MIN_OBS = 3; // benchmarks with fewer results can't pin down their own a and d
const G_MEAN = 50;
const G_SD = 15;

const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function toLatent(score: number, b: Benchmark): number {
  if (b.kind === "elo") return (score * Math.LN10) / 400;
  // Edit-distance error ratios can exceed 1 through insertions. A negative log
  // preserves that ordering; 1-error is not a probability of a correct word.
  if (b.kind === "err") return -Math.log(score + 0.005);
  const c = b.chance ?? 0;
  return logit(clamp((score - c) / (1 - c), 0.005, 0.995));
}

export function fromLatent(y: number, b: Benchmark): number {
  if (b.kind === "elo") return (y * 400) / Math.LN10;
  if (b.kind === "err") return Math.max(0, Math.exp(-y) - 0.005);
  const c = b.chance ?? 0;
  return sigmoid(y) * (1 - c) + c;
}

// One model × benchmark-version data point, averaged over the raw results that fed it.
export type Cell = { model: string; key: string; bench: string; y: number; results: Result[] };

// Keep evaluations from different reports separate. `by` discloses self-reporting;
// it must not pool unrelated labs into one evaluator or split a paper's own comparison run.
export const evaluator = (r: Result) => sourceId(r.source);

// Each evaluator's version of a benchmark is its own key with its own a and d, since
// harnesses and settings differ (and labs' own numbers tend to run hot). The evaluator
// with the most independent results owns the bare key. Sparse series remain raw
// evidence; they must not be pooled with a different evaluator to manufacture overlap.
export function toCells(results: Result[], benches: Benchmark[]): Cell[] {
  const bench = new Map(benches.map((b) => [b.id, b]));
  const mean = (ys: number[]) => ys.reduce((s, y) => s + y, 0) / ys.length;
  const group = (items: Cell[]) => {
    const g = new Map<string, Cell & { ys: number[] }>();
    for (const c of items) {
      const k = `${c.model}|${c.key}`;
      const e = g.get(k) ?? { ...c, ys: [], results: [] };
      e.ys.push(c.y);
      e.results.push(...c.results);
      g.set(k, e);
    }
    return [...g.values()].map(({ ys, ...e }) => ({ ...e, y: mean(ys) }));
  };
  const count = (cs: Cell[]) => cs.reduce((m, c) => m.set(c.key, (m.get(c.key) ?? 0) + 1), new Map<string, number>());

  const raw = results.flatMap((r) => {
    const b = bench.get(r.bench);
    return b ? [{ model: r.model, bench: r.bench, key: `${r.bench}@${evaluator(r)}`, y: toLatent(r.score, b), results: [r] }] : [];
  });
  let cells = group(raw);

  const n = count(cells);
  const primary = new Map<string, string>();
  const independent = new Set(cells.filter((c) => c.results.some((r) => r.by === "independent")).map((c) => c.key));
  for (const [k] of [...n].sort((x, y) => y[1] - x[1])) {
    const [b] = k.split("@");
    if (independent.has(k) && !primary.has(b)) primary.set(b, k);
  }
  const main = (c: Cell) => primary.get(c.bench) === c.key;
  cells = cells.flatMap((c) => {
    if (main(c)) return [{ ...c, key: c.bench }];
    if (n.get(c.key)! >= MIN_OBS) return [c];
    return [];
  });
  cells = group(cells);
  const n2 = count(cells);
  return cells.filter((c) => n2.get(c.key)! >= MIN_OBS);
}

export type Fit = {
  scores: Map<string, Scored>;
  params: Map<string, { a: number; d: number; sigma: number; n: number }>;
  predict: (model: string, key: string) => number | undefined;
  explain: (model: string) => Explained | undefined;
  toG: (rawTheta: number) => number;
};

// g is exactly a weighted average of the g each result implies on its own ((y - d) / a,
// weighted by a² / σ²) plus the prior (the middle, weight 1). This returns those parts.
export type Explained = {
  prior: { g: number; share: number };
  parts: { cell: Cell; g: number; share: number }[];
};

export function fit(cells: Cell[], iters = 500): Fit {
  const models = [...new Set(cells.map((c) => c.model))];
  const keys = [...new Set(cells.map((c) => c.key))];
  const mi = new Map(models.map((m, i) => [m, i]));
  const ki = new Map(keys.map((k, i) => [k, i]));
  const obs = cells.map((c) => ({ m: mi.get(c.model)!, k: ki.get(c.key)!, y: c.y }));
  const byKey = keys.map((_, k) => obs.filter((o) => o.k === k));
  const byModel = models.map((_, m) => obs.filter((o) => o.m === m));

  // Start θ at each model's average within-benchmark z-score.
  const kMean = byKey.map((os) => os.reduce((s, o) => s + o.y, 0) / os.length);
  const kSd = byKey.map((os, k) => Math.sqrt(os.reduce((s, o) => s + (o.y - kMean[k]) ** 2, 0) / os.length) || 1);
  let theta = byModel.map((os) => os.reduce((s, o) => s + (o.y - kMean[o.k]) / kSd[o.k], 0) / os.length);
  const a = keys.map(() => 1);
  const d = [...kMean];
  const s2 = keys.map(() => 0.25);
  let v = models.map(() => 1);
  let mu = 0, sd = 1;

  const LAMBDA_A = 1; // prior a ~ N(1, 1)
  const NU0 = 3; // prior noise: σ² ~ 0.25 worth 3 observations
  const S0 = 0.25;

  for (let it = 0; it < iters; it++) {
    // Benchmarks: weighted ridge regression of y on θ.
    byKey.forEach((os, k) => {
      let stt = LAMBDA_A, st = 0, sn = 0, sty = LAMBDA_A, sy = 0;
      for (const o of os) {
        const t = theta[o.m];
        stt += t * t; st += t; sn += 1; sty += t * o.y; sy += o.y;
      }
      const det = stt * sn - st * st;
      a[k] = Math.max(0.05, (sty * sn - st * sy) / det);
      d[k] = (sy - a[k] * st) / sn;
      const ssr = os.reduce((s, o) => s + (o.y - a[k] * theta[o.m] - d[k]) ** 2, 0);
      s2[k] = (ssr + NU0 * S0) / (os.length + NU0);
    });
    // Models: posterior mean of θ under a N(0, 1) prior.
    const next = byModel.map((os, m) => {
      let prec = 1, num = 0;
      for (const o of os) {
        prec += (a[o.k] * a[o.k]) / s2[o.k];
        num += (a[o.k] * (o.y - d[o.k])) / s2[o.k];
      }
      v[m] = 1 / prec;
      return num / prec;
    });
    // Pin the scale: mean 0, sd 1 across models.
    mu = next.reduce((s, t) => s + t, 0) / next.length;
    sd = Math.sqrt(next.reduce((s, t) => s + (t - mu) ** 2, 0) / next.length) || 1;
    const delta = Math.max(...next.map((t, m) => Math.abs((t - mu) / sd - theta[m])));
    theta = next.map((t) => (t - mu) / sd);
    v = v.map((x) => x / (sd * sd));
    if (delta < 1e-7) break;
  }

  const scores = new Map<string, Scored>(
    models.map((id, m) => [
      id,
      { id, g: G_MEAN + G_SD * theta[m], pm: G_SD * Math.sqrt(v[m]), n: byModel[m].length },
    ])
  );
  const params = new Map(keys.map((k, i) => [k, { a: a[i], d: d[i], sigma: Math.sqrt(s2[i]), n: byKey[i].length }]));
  const predict = (model: string, key: string) => {
    const m = mi.get(model), k = ki.get(key);
    return m === undefined || k === undefined ? undefined : a[k] * theta[m] + d[k];
  };
  const toG = (rawTheta: number) => G_MEAN + (G_SD * (rawTheta - mu)) / sd;
  const explain = (model: string): Explained | undefined => {
    const m = mi.get(model);
    if (m === undefined) return undefined;
    const parts = byModel[m].map((o, i) => ({
      cell: cells[obs.indexOf(o)],
      g: toG((o.y - d[o.k]) / a[o.k]),
      w: (a[o.k] * a[o.k]) / s2[o.k],
      i,
    }));
    const total = 1 + parts.reduce((s, p) => s + p.w, 0);
    return {
      prior: { g: toG(0), share: 1 / total },
      parts: parts.map((p) => ({ cell: p.cell, g: p.g, share: p.w / total })).sort((x, y) => y.share - x.share),
    };
  };
  return { scores, params, predict, explain, toG };
}

// g for a degraded copy of a model that keeps `kept` of its accuracy on every test (e.g. a
// quantized download). Accuracy benchmarks are re-scored directly; arena-style ones are
// assumed to move by the same amount, since they can't be scaled the same way.
export function gAtRetention(f: Fit, model: string, kept: number, benches: Map<string, Benchmark>): number | undefined {
  const e = f.explain(model);
  const s = f.scores.get(model);
  if (!e || !s) return undefined;
  if (kept >= 1) return s.g;
  let shift = 0, weight = 0;
  for (const p of e.parts) {
    const b = benches.get(p.cell.bench);
    if (b?.kind !== "acc") continue;
    const k = f.params.get(p.cell.key)!;
    const y = toLatent(fromLatent(p.cell.y, b) * kept, b);
    shift += p.share * (f.toG((y - k.d) / k.a) - p.g);
    weight += p.share;
  }
  return weight ? s.g + (shift / weight) * (1 - e.prior.share) : s.g;
}
