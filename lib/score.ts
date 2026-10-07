// The "g" score: a one-factor latent model fit over every benchmark result.
//
//   y[model, run] ≈ a[test] · θ[model] + d[run] + noise(σ[run])
//
// y is the benchmark score moved onto a logit scale (after removing the chance
// rate), so an easy benchmark and a hard one are comparable. θ is each model's
// ability; a is how well a test separates strong from weak models (saturated
// ones get a small a); d is a run's level. A run is one evaluator's run of a test.
// Every run of the same test shares its a, learned from all of them together, but
// keeps its own level, so an evaluator whose setup runs hot or cold can't move
// anyone's score. Each result is read against the other models in its run. Because
// a and d are fit jointly with θ, a model tested only on easy benchmarks doesn't get
// an inflated score, and models with few results are shrunk toward the middle with
// a wider ± interval.

import { sourceId } from "./sources.ts";
import type { Benchmark, Result, Scored } from "./types.ts";

const MIN_MODELS = 3; // a test needs this many models across its runs to pin down its a
const MIN_RUN = 2; // a result is only compared within its run, so a run needs a second model
const G_MEAN = 50;
const G_SD = 15;

const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function toLatent(score: number, b: Benchmark): number {
  if (b.kind === "linear") return (b.direction === "lower" ? -score : score) / (b.latent_scale ?? 1);
  if (b.kind === "elo") return (score * Math.LN10) / 400;
  // Edit-distance error ratios can exceed 1 through insertions. A negative log
  // preserves that ordering; 1-error is not a probability of a correct word.
  if (b.kind === "err") return -Math.log(score + 0.005);
  const c = b.chance ?? 0;
  return logit(clamp((score - c) / (1 - c), 0.005, 0.995));
}

export function fromLatent(y: number, b: Benchmark): number {
  if (b.kind === "linear") return (b.direction === "lower" ? -y : y) * (b.latent_scale ?? 1);
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

// Each evaluator's run of a benchmark is its own key with its own level, since harnesses
// and settings differ (and labs' own numbers tend to run hot); runs of the same test share
// only its a. The evaluator with the most independent results owns the bare key. A run
// with one model, or a test with too few models to fix its a, remains raw evidence.
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
  cells = cells.filter((c) => n.get(c.key)! >= MIN_RUN).map((c) => (main(c) ? { ...c, key: c.bench } : c));
  const modelsPerTest = new Map<string, Set<string>>();
  for (const c of cells) modelsPerTest.set(c.bench, (modelsPerTest.get(c.bench) ?? new Set()).add(c.model));
  return cells.filter((c) => modelsPerTest.get(c.bench)!.size >= MIN_MODELS);
}

export type Fit = {
  scores: Map<string, Scored>;
  params: Map<string, { a: number; d: number; sigma: number; n: number }>;
  predict: (model: string, key: string) => number | undefined;
  explain: (model: string) => Explained | undefined;
  toG: (rawTheta: number) => number;
};

// g is exactly a weighted average of the g each result implies on its own plus the prior
// (the middle, weight 1). A result implies (y - d) / a, where d is its run's level estimated
// from the other models in that run; it is weighted by a² / (σ² + that level's uncertainty).
// This returns those parts.
export type Explained = {
  prior: { g: number; share: number };
  parts: { cell: Cell; g: number; share: number; d: number }[];
};

export function fit(cells: Cell[], iters = 500): Fit {
  const models = [...new Set(cells.map((c) => c.model))];
  const keys = [...new Set(cells.map((c) => c.key))];
  const tests = [...new Set(cells.map((c) => c.bench))];
  const mi = new Map(models.map((m, i) => [m, i]));
  const ki = new Map(keys.map((k, i) => [k, i]));
  const ti = new Map(tests.map((t, i) => [t, i]));
  const obs = cells.map((c) => ({ m: mi.get(c.model)!, k: ki.get(c.key)!, y: c.y }));
  const byKey = keys.map((_, k) => obs.filter((o) => o.k === k));
  const byModel = models.map((_, m) => obs.filter((o) => o.m === m));
  const benchOfKey = new Map(cells.map((c) => [c.key, c.bench]));
  const testOf = keys.map((k) => ti.get(benchOfKey.get(k)!)!);
  const keysOf = tests.map((_, t) => keys.flatMap((_, k) => (testOf[k] === t ? [k] : [])));

  // Start θ at each model's average within-benchmark z-score.
  const kMean = byKey.map((os) => os.reduce((s, o) => s + o.y, 0) / os.length);
  const kSd = byKey.map((os, k) => Math.sqrt(os.reduce((s, o) => s + (o.y - kMean[k]) ** 2, 0) / os.length) || 1);
  let theta = byModel.map((os) => os.reduce((s, o) => s + (o.y - kMean[o.k]) / kSd[o.k], 0) / os.length);
  const aT = tests.map(() => 1);
  const a = keys.map((_, k) => aT[testOf[k]]);
  const d = [...kMean];
  const s2 = keys.map(() => 0.25);
  let v = models.map(() => 1);
  let mu = 0, sd = 1;

  const LAMBDA_A = 1; // prior a ~ N(1, 1)
  const NU0 = 3; // prior noise: σ² ~ 0.25 worth 3 observations
  const S0 = 0.25;

  // A result's run level, estimated from the other models in that run, and that estimate's
  // variance. Alone in its run, a result says nothing about its model (infinite variance).
  const resid = keys.map(() => 0);
  const runLevel = (o: { m: number; k: number; y: number }) => {
    const n = byKey[o.k].length;
    if (n < 2) return { d: d[o.k], vd: Infinity };
    return { d: (resid[o.k] - (o.y - a[o.k] * theta[o.m])) / (n - 1), vd: s2[o.k] / (n - 1) };
  };

  for (let it = 0; it < iters; it++) {
    // Tests: one slope shared by all runs of a test, each run with its own level (ridge prior on a).
    const mean = byKey.map((os) => [os.reduce((s, o) => s + theta[o.m], 0) / os.length, os.reduce((s, o) => s + o.y, 0) / os.length]);
    keysOf.forEach((ks, t) => {
      const sbar2 = ks.reduce((s, k) => s + byKey[k].length, 0) / ks.reduce((s, k) => s + byKey[k].length / s2[k], 0);
      let num = LAMBDA_A / sbar2, den = LAMBDA_A / sbar2;
      for (const k of ks) for (const o of byKey[k]) {
        const ct = theta[o.m] - mean[k][0];
        num += (ct * (o.y - mean[k][1])) / s2[k];
        den += (ct * ct) / s2[k];
      }
      aT[t] = Math.max(0.05, num / den);
    });
    byKey.forEach((os, k) => {
      a[k] = aT[testOf[k]];
      d[k] = mean[k][1] - a[k] * mean[k][0];
      const ssr = os.reduce((s, o) => s + (o.y - a[k] * theta[o.m] - d[k]) ** 2, 0);
      s2[k] = (ssr + NU0 * S0) / (os.length + NU0);
      resid[k] = os.reduce((s, o) => s + (o.y - a[k] * theta[o.m]), 0);
    });
    // Models: posterior mean of θ under a N(0, 1) prior.
    const next = byModel.map((os, m) => {
      let prec = 1, num = 0;
      for (const o of os) {
        const { d: level, vd } = runLevel(o);
        prec += (a[o.k] * a[o.k]) / (s2[o.k] + vd);
        num += (a[o.k] * (o.y - level)) / (s2[o.k] + vd);
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
    const parts = byModel[m].map((o) => {
      const { d: level, vd } = runLevel(o);
      return { cell: cells[obs.indexOf(o)], d: level, g: toG((o.y - level) / a[o.k]), w: (a[o.k] * a[o.k]) / (s2[o.k] + vd) };
    });
    const total = 1 + parts.reduce((s, p) => s + p.w, 0);
    return {
      prior: { g: toG(0), share: 1 / total },
      parts: parts.map((p) => ({ cell: p.cell, g: Number.isFinite(p.g) ? p.g : toG(0), share: p.w / total, d: p.d })).sort((x, y) => y.share - x.share),
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
    shift += p.share * (f.toG((y - p.d) / k.a) - p.g);
    weight += p.share;
  }
  return weight ? s.g + (shift / weight) * (1 - e.prior.share) : s.g;
}
