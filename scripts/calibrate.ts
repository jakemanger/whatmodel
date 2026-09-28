// npm run calibrate — fits the speed constants in lib/speed.ts (K) to measured decode speeds in
// data/speed-calibration.json, using each measurement's real bandwidth, and reports prediction error.
// Paste the printed K into lib/speed.ts when it improves.

import { readFileSync } from "node:fs";
import { estimateTps, K, type Machine } from "../lib/speed.ts";

type M = {
  model: string; params_b: number; active_b: number; file_gb: number; hardware: string;
  kind: "nvidia" | "apple" | "cpu"; bandwidth_gbs: number; vram_gb: number | null;
  offload: "none" | "layers" | "experts"; cpu_bandwidth_gbs: number | null; tg_tps: number;
};

const all: M[] = JSON.parse(readFileSync(new URL("../data/speed-calibration.json", import.meta.url), "utf8")).measurements;
if (!all.length) {
  console.error("No reviewed calibration measurements. Speed estimates are disabled; add licensed evidence before calibrating.");
  process.exit(1);
}
// Skip runs that forced offload on a model that fits in VRAM: not a setup we'd recommend.
const forced = (m: M) => m.offload !== "none" && m.vram_gb !== null && m.file_gb * 1.05 + 1.5 <= m.vram_gb;
const ms = all.filter((m) => m.params_b > 0 && m.active_b > 0 && m.file_gb > 0 && m.bandwidth_gbs > 0 && m.tg_tps > 0 && !forced(m));

const machine = (m: M): Machine => {
  if (m.kind === "cpu") return { fastGb: 0, fastBw: m.bandwidth_gbs, cpuBw: m.bandwidth_gbs, kind: "cpu" };
  const kind = m.kind === "apple" ? "apple" : "gpu";
  if (m.offload === "none") return { fastGb: Infinity, fastBw: m.bandwidth_gbs, cpuBw: m.bandwidth_gbs, kind };
  return { fastGb: m.vram_gb ?? 0, fastBw: m.bandwidth_gbs, cpuBw: m.cpu_bandwidth_gbs ?? 80, kind };
};
// Layer-split MoE runs have no shared weights pinned to the GPU.
const predict = (m: M, k: typeof K) =>
  estimateTps(m.file_gb, m.params_b, m.active_b, machine(m), m.offload === "layers" ? { ...k, moeShared: 0 } : k);
const loss = (k: typeof K) => ms.reduce((s, m) => s + Math.log(predict(m, k) / m.tg_tps) ** 2, 0) / ms.length;

// Coordinate descent: sweep one constant at a time over its range, keep the best, repeat.
const RANGES: Record<keyof typeof K, [number, number, number]> = {
  denseEff: [0.3, 1.3, 0.025],
  moeEff: [0.1, 1.3, 0.025],
  cpuEff: [0.2, 1.3, 0.025],
  moeShared: [0, 0.7, 0.05],
  overheadGpu: [0, 0.02, 0.0005],
  overheadApple: [0, 0.02, 0.0005],
  overheadCpu: [0, 0.03, 0.0005],
};
let best = { ...K }, bestLoss = loss(K);
for (let pass = 0; pass < 8; pass++)
  for (const [key, [lo, hi, step]] of Object.entries(RANGES) as [keyof typeof K, [number, number, number]][])
    for (let v = lo; v <= hi + 1e-9; v += step) {
      const k = { ...best, [key]: v };
      const l = loss(k);
      if (l < bestLoss) [best, bestLoss] = [k, l];
    }

const report = (label: string, k: typeof K) => {
  const errs = ms.map((m) => ({ m, r: predict(m, k) / m.tg_tps }));
  const pct = (xs: number[]) => {
    const s = xs.map((r) => Math.abs(r - 1) * 100).sort((a, b) => a - b);
    return s.length ? `median ${s[s.length >> 1].toFixed(0)}% off, p90 ${s[Math.floor(s.length * 0.9)].toFixed(0)}% (n=${s.length})` : "n=0";
  };
  console.log(`\n${label}: ${JSON.stringify(Object.fromEntries(Object.entries(k).map(([a, b]) => [a, +b.toFixed(4)])))}`);
  console.log(`  all            ${pct(errs.map((e) => e.r))}`);
  const groups: Record<string, (e: { m: M }) => boolean> = {
    "dense gpu/mac": (e) => e.m.active_b >= e.m.params_b * 0.9 && e.m.kind !== "cpu" && e.m.offload === "none",
    "moe gpu/mac": (e) => e.m.active_b < e.m.params_b * 0.9 && e.m.kind !== "cpu" && e.m.offload === "none",
    "cpu only": (e) => e.m.kind === "cpu",
    "offload experts": (e) => e.m.offload === "experts",
    "offload layers": (e) => e.m.offload === "layers",
  };
  for (const [g, f] of Object.entries(groups)) console.log(`  ${g.padEnd(15)}${pct(errs.filter(f).map((e) => e.r))}`);
  return errs;
};

console.log(`${ms.length} usable measurements (of ${all.length})`);
report("current K", K);
const errs = report("best fit", best);
console.log("\nworst 8 with best fit (predicted / measured):");
for (const { m, r } of errs.sort((a, b) => Math.abs(Math.log(b.r)) - Math.abs(Math.log(a.r))).slice(0, 8))
  console.log(`  ${r.toFixed(2)}x  ${m.model} ${m.file_gb}GB on ${m.hardware} (${m.offload}): measured ${m.tg_tps}, predicted ${(r * m.tg_tps).toFixed(1)}`);
