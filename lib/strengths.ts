// A model's results grouped by task, for its page: where it ranks on each kind of task, which models
// it beats or trails there, and for each test how it compares with the other models in the same
// run, how hard the test is, and why the test counts as much as it does toward the overall score.
import { benchmarkById, comparisonForModel, models, modelsIn, results } from "./data.ts";
import { boardData } from "./board-data.ts";
import { catOf } from "./categories.ts";
import { catalogueOnly, rank } from "./fit.ts";
import { aboveChance, fromLatent, toLatent, type Fit } from "./score.ts";
import { sourceId, sourceName } from "./sources.ts";
import { TASKS } from "./tasks.ts";
import type { Category, Result, Scored } from "./types.ts";

export type Peer = { id: string; name: string };
export type TestRow = {
  bench: string;
  result: Result; // the result shown (the one that counts most, or the first)
  more: number; // further results for the same test (other runs)
  run: string; // who ran the comparison below
  tested: number; // models with a result in that run
  beaten: number; // of those, how many this model beats
  above: Peer[]; // the models just above it in that run
  below: Peer[]; // the models just below it in that run
  spread: number[]; // the run's results in 12 bins from worst to best (counts)
  at: number; // this model's bin
  typical: string | null; // what an average model (score 50) gets on this test
  expected: string | null; // what a model with this score is expected to get
  hard: "very hard" | "hard" | "medium" | "easy" | "very easy" | null;
  share: number | null; // share of the overall score from this test (null: not counted)
  implies: number | null; // the score this test's result implies on its own
  why: Reason[]; // why it counts as much as it does (empty when it doesn't count)
  unused: string | null; // why it doesn't count
};
export type TaskRow = {
  id: string; label: string; title: string;
  rank: number | null; total: number; g: number | null; pm: number | null; n: number;
  ahead: Peer[]; behind: Peer[]; // the models just below / just above it on this task
  beats: Peer[]; // models ranked above it overall that it beats on this task
  trails: Peer[]; // models ranked below it overall that beat it on this task
  share: number; // share of the overall score from this task's tests
  spread: number[]; at: number; // every ranked model's task score in 12 bins, and this model's bin
  tests: TestRow[];
};
export type Strengths = { tasks: TaskRow[]; other: TestRow[]; best: TaskRow | null; worst: TaskRow | null; overall: { rank: number; total: number } | null };

const byId = new Map(models.map((m) => [m.id, m]));
const peer = (id: string): Peer => ({ id, name: byId.get(id)?.name ?? id });
// Rankings are the same for every model page, so compute each once.
const rankCache = new Map<string, ReturnType<typeof rank>>();
const ranked = (key: string, cat: Category, scores: Map<string, Scored>, retired: boolean) => {
  const k = `${cat}|${key}|${retired}`;
  if (!rankCache.has(k)) rankCache.set(k, rank(modelsIn(cat), scores, { specs: null, retired }));
  return rankCache.get(k)!;
};
// Values in 12 bins from worst to best, and the bin of one of them.
export function bins(values: number[], mine: number | undefined) {
  const lo = Math.min(...values), hi = Math.max(...values);
  const bin = (y: number) => (hi > lo ? Math.min(11, Math.floor(((y - lo) / (hi - lo)) * 12)) : 6);
  const spread = Array(12).fill(0);
  for (const y of values) spread[bin(y)]++;
  return { spread, at: mine === undefined ? -1 : bin(mine) };
}
const LEVELS: [number, TestRow["hard"]][] = [[0.15, "very hard"], [0.35, "hard"], [0.65, "medium"], [0.85, "easy"], [Infinity, "very easy"]];

// One result per model in each evaluator's run of a test, on a higher-is-better scale.
type Entry = { model: string; y: number; r: Result };
const runCache = new Map<string, Map<string, Entry[]>>();
function runsOf(bench: string) {
  let runs = runCache.get(bench);
  if (runs) return runs;
  const b = benchmarkById.get(bench)!;
  const grouped = new Map<string, Map<string, Entry[]>>();
  for (const r of results) {
    if (r.bench !== bench || r.invalid) continue;
    const run = grouped.get(sourceId(r.source)) ?? new Map<string, Entry[]>();
    run.set(r.model, [...(run.get(r.model) ?? []), { model: r.model, y: toLatent(r.score, b), r }]);
    grouped.set(sourceId(r.source), run);
  }
  runs = new Map([...grouped].map(([k, run]) => [k, [...run.values()].map((es) => ({ ...es[0], y: es.reduce((s, e) => s + e.y, 0) / es.length })).sort((x, y) => y.y - x.y)]));
  runCache.set(bench, runs);
  return runs;
}

// Category-wide reference points: the median sharpness and noise of a test.
const medianCache = new Map<Fit, { a: number; sigma: number }>();
function medians(f: Fit) {
  let m = medianCache.get(f);
  if (!m) {
    const ps = [...f.params.values()], mid = (xs: number[]) => xs.sort((p, q) => p - q)[Math.floor(xs.length / 2)] ?? 1;
    m = { a: mid(ps.map((p) => p.a)), sigma: mid(ps.map((p) => p.sigma)) };
    medianCache.set(f, m);
  }
  return m;
}

const fmt = (score: number, bench: string) => {
  const b = benchmarkById.get(bench)!;
  if (b.kind === "elo") return score.toFixed(0);
  if (b.kind === "linear") return `${score.toFixed(3)}${b.unit ? ` ${b.unit}` : ""}`;
  if (b.raw_scale_min !== undefined && b.raw_scale_max !== undefined) return `${(b.raw_scale_min + score * (b.raw_scale_max - b.raw_scale_min)).toFixed(2)} / ${b.raw_scale_max}`;
  return `${(score * 100).toFixed(score < 0.1 ? 1 : 0)}%`;
};

function testRow(id: string, bench: string, mine: Result[], f: Fit | undefined, shares: Map<string, number>, why: Map<string, Reason[]>, own?: string[], implies?: number): TestRow {
  const runs = runsOf(bench);
  // Compare within the biggest run this model is in. When that run is small and other evaluators
  // ran many more models, compare across every run instead (each model's best result).
  const byRun = mine.filter((r) => !r.invalid).map((r) => ({ r, run: runs.get(sourceId(r.source)) ?? [] })).sort((x, y) => y.run.length - x.run.length);
  const pick = byRun[0];
  let list = pick?.run ?? [], run = pick ? sourceName(pick.r.source) : "";
  if (list.length < 6) {
    const best = new Map<string, Entry>();
    for (const es of runs.values()) for (const e of es) if (!best.has(e.model) || best.get(e.model)!.y < e.y) best.set(e.model, e);
    if (best.size >= Math.max(3, list.length * 2)) { list = [...best.values()].sort((x, y) => y.y - x.y); run = "all evaluators"; }
  }
  const at = list.findIndex((e) => e.model === id);
  const { spread, at: atBin } = bins(list.map((e) => e.y), at >= 0 ? list[at].y : undefined);

  const b = benchmarkById.get(bench)!;
  const key = own?.[0] ?? (f?.params.has(bench) ? bench : undefined);
  const p = key ? f!.params.get(key) : undefined;
  const typical = p ? fromLatent(p.d, b) : undefined;
  const pred = key && f ? f.predict(id, key) : undefined;
  const q = typical !== undefined && b.kind === "acc" ? aboveChance(typical, b)! : undefined;
  const shown = (pick?.r ?? mine[0]);
  return {
    bench, result: shown, more: mine.length - 1, run, tested: list.length,
    beaten: at >= 0 ? list.length - 1 - at : 0,
    above: at > 0 ? list.slice(Math.max(0, at - 2), at).map((e) => peer(e.model)) : [],
    below: at >= 0 ? list.slice(at + 1, at + 3).map((e) => peer(e.model)) : [],
    spread, at: atBin,
    typical: typical !== undefined ? fmt(typical, bench) : null,
    expected: pred !== undefined ? fmt(fromLatent(pred, b), bench) : null,
    hard: q !== undefined ? LEVELS.find(([t]) => q < t)![1] : null,
    share: shares.get(bench) ?? null,
    implies: implies ?? null,
    why: why.get(bench) ?? [],
    unused: why.has(bench) ? null : mine.every((r) => r.invalid) ? `failed run: ${mine[0].invalid}` : "not counted yet: no other model in the same run to compare it with",
  };
}

// Why a counted test carries the weight it does: short labels, each with a plain sentence.
export const REASONS = {
  sharp: "separates strong and weak models sharply",
  blunt: "separates models only weakly",
  level: "pitched at this model's level, where a test measures most precisely",
  maxed: "this model nearly maxes it out, so it can't show how much better it is",
  floor: "too hard to tell this model apart from others at its level",
  noisy: "results are noisy",
  small: "few models in this run, so its level is uncertain",
  runs: "it counts once for each evaluator that ran it",
  typical: "a typical test",
} as const;
export type Reason = keyof typeof REASONS;

function reasons(id: string, bench: string, keys: string[], f: Fit): Reason[] {
  const b = benchmarkById.get(bench)!, med = medians(f), out: Reason[] = [];
  const p = f.params.get(keys[0])!;
  if (p.a > med.a * 1.3) out.push("sharp");
  else if (p.a < med.a * 0.7) out.push("blunt");
  if (b.kind === "acc") {
    const s = 1 / (1 + Math.exp(-(f.predict(id, keys[0]) ?? 0)));
    if (s > 0.92) out.push("maxed");
    else if (s < 0.08) out.push("floor");
    else if (s > 0.25 && s < 0.75) out.push("level");
  }
  if (p.sigma > med.sigma * 1.4) out.push("noisy");
  if (p.n <= 3) out.push("small");
  if (keys.length > 1) out.push("runs");
  return out.length ? out : ["typical"];
}

export function strengths(id: string): Strengths | null {
  const m = byId.get(id);
  if (!m) return null;
  const cat: Category = catOf(m);
  const set = comparisonForModel(id);
  const f = set?.fit;
  const e = f?.explain(id);
  const shares = new Map<string, number>(), keysOf = new Map<string, string[]>(), implied = new Map<string, number>();
  for (const p of e?.parts ?? []) {
    if (!implied.has(p.cell.bench)) implied.set(p.cell.bench, p.g); // parts come largest share first
    shares.set(p.cell.bench, (shares.get(p.cell.bench) ?? 0) + p.share);
    keysOf.set(p.cell.bench, [...(keysOf.get(p.cell.bench) ?? []), p.cell.key]);
  }
  const why = new Map([...keysOf].map(([bench, keys]) => [bench, reasons(id, bench, keys, f!)]));
  const mine = results.filter((r) => r.model === id && benchmarkById.has(r.bench));
  const byBench = new Map<string, Result[]>();
  for (const r of mine) byBench.set(r.bench, [...(byBench.get(r.bench) ?? []), r]);
  const rows = new Map([...byBench].map(([bench, rs]) => [bench, testRow(id, bench, rs, f, shares, why, keysOf.get(bench), implied.get(bench))]));
  const order = (a: TestRow, b: TestRow) => (b.share ?? -1) - (a.share ?? -1) || b.tested - a.tested;

  const retired = catalogueOnly(m);
  const overallRows = f && set ? ranked(`overall:${set.id}`, cat, f.scores, retired) : [];
  const overallRank = new Map(overallRows.map((r) => [r.id, r.rank!]));
  const me = overallRank.get(id);
  const current = (x: string) => { const mm = byId.get(x); return !!mm && !catalogueOnly(mm); };

  const tasks: TaskRow[] = TASKS.filter((t) => t.category === cat).flatMap((t) => {
    const tests = t.benchmarks.flatMap((bch) => (rows.has(bch) ? [rows.get(bch)!] : [])).sort(order);
    if (!tests.length) return [];
    const board = boardData(cat).tasks?.find((x) => x.id === t.id);
    const tset = board?.sets?.find((s) => s.models.includes(id));
    let rk: number | null = null, total = 0, g: number | null = null, pm: number | null = null, n = 0;
    let ahead: Peer[] = [], behind: Peer[] = [], beats: Peer[] = [], trails: Peer[] = [], spread: number[] = [], atBin = -1;
    if (tset) {
      const scores = new Map<string, Scored>(tset.scores.map((s) => [s.id, s]));
      const list = ranked(`task:${t.id}:${tset.id}`, cat, scores, retired);
      const i = list.findIndex((r) => r.id === id);
      total = list.length;
      ({ spread, at: atBin } = bins(list.map((r) => scores.get(r.id)!.g), i >= 0 ? scores.get(id)!.g : undefined));
      if (i >= 0) {
        rk = list[i].rank; g = scores.get(id)!.g; pm = scores.get(id)!.pm; n = scores.get(id)!.n;
        behind = list.slice(Math.max(0, i - 2), i).map((r) => peer(r.id));
        ahead = list.slice(i + 1, i + 3).map((r) => peer(r.id));
        if (me !== undefined) {
          beats = list.slice(i + 1).filter((r) => current(r.id) && (overallRank.get(r.id) ?? Infinity) < me)
            .sort((x, y) => overallRank.get(x.id)! - overallRank.get(y.id)!).slice(0, 3).map((r) => peer(r.id));
          trails = list.slice(0, i).filter((r) => current(r.id) && (overallRank.get(r.id) ?? -Infinity) > me)
            .sort((x, y) => overallRank.get(y.id)! - overallRank.get(x.id)!).slice(0, 3).map((r) => peer(r.id));
        }
      }
    }
    const share = tests.reduce((s, x) => s + (x.share ?? 0), 0);
    return [{ id: t.id, label: t.label, title: t.title, rank: rk, total, g, pm, n, ahead, behind, beats, trails, share, spread, at: atBin, tests }];
  });
  const inTask = new Set(tasks.flatMap((t) => t.tests.map((x) => x.bench)));
  const other = [...rows.values()].filter((x) => !inTask.has(x.bench)).sort(order);
  // Best and worst by position (rank as a share of the field), only where the task rank rests on 3+ results.
  const placed = tasks.filter((t) => t.rank !== null && t.n >= 3 && t.total >= 10);
  const pos = (t: TaskRow) => t.rank! / t.total;
  const best = placed.length >= 2 ? [...placed].sort((a, b) => pos(a) - pos(b))[0] : null;
  const worst = placed.length >= 2 ? [...placed].sort((a, b) => pos(b) - pos(a))[0] : null;
  return { tasks, other, best, worst: worst && worst !== best ? worst : null, overall: me !== undefined ? { rank: me, total: overallRows.length } : null };
}
