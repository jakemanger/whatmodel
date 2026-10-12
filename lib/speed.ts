// Local generation speed. Generating a token reads every active weight once, so
// tok/s ≈ efficiency × bandwidth / bytes read per token.
//
// MoE models only read their active experts plus the weights every token uses (attention,
// embeddings, shared experts). When they don't fit in VRAM, llama.cpp keeps those shared
// weights on the GPU and moves experts to system RAM (--n-cpu-moe), so only the active
// experts that live in RAM are read slowly. Dense models split by layer instead.
//
// The constants are fit to measured speeds: npm run calibrate (data/speed-calibration.json).

import type { Model, Specs, Variant } from "./types.ts";

// Fit by npm run calibrate on 97 measured runs: median 11% off (dense 7%, MoE 18%, CPU 23%).
export const K = {
  denseEff: 0.875, // share of peak GPU / unified bandwidth a dense model reaches
  moeEff: 0.625, // MoE reaches less: routing and many small matmuls
  cpuEff: 0.7, // share of system RAM bandwidth reached on the CPU
  moeShared: 0, // share of an MoE's active weights pinned to the GPU when experts are offloaded
  // Fixed seconds per token (kernel launches, routing, sync), which dominates when few bytes are
  // read. It differs by platform: Apple's Metal path has more of it than CUDA, CPUs the most.
  overheadGpu: 0.0015,
  overheadApple: 0.0055,
  overheadCpu: 0.0145,
};

export const SLOW_TPS = 8; // below this, a paid API is the better experience

// A machine as the estimate sees it. fastGb = 0 means CPU only.
export type Machine = { fastGb: number; fastBw: number; cpuBw: number; kind: "gpu" | "apple" | "cpu" };

export function estimateTps(fileGb: number, paramsB: number, activeB: number, mc: Machine, k = K): number {
  const moe = activeB < paramsB * 0.9;
  const active = fileGb * Math.min(1, activeB / paramsB);
  const room = Math.max(0, mc.fastGb - (fileGb * 0.05 + 1.5)); // VRAM left after KV cache and runtime (as fit.ts)
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  let gpu: number, cpu: number;
  if (moe && room > active * k.moeShared) {
    const shared = active * k.moeShared;
    const onFast = clamp((room - shared) / (fileGb - shared)); // share of experts that fit on the GPU
    gpu = shared + (active - shared) * onFast;
    cpu = (active - shared) * (1 - onFast);
  } else {
    const onFast = clamp(room / fileGb); // share of layers on the GPU
    gpu = active * onFast;
    cpu = active * (1 - onFast);
  }
  const eff = moe ? k.moeEff : k.denseEff;
  const overhead = mc.kind === "apple" ? k.overheadApple : mc.kind === "gpu" ? k.overheadGpu : k.overheadCpu;
  return 1 / (gpu / (mc.fastBw * eff) + cpu / (mc.cpuBw * k.cpuEff) + overhead);
}

// We only know memory size, so bandwidth is the typical machine at that size (GB/s):
// Macs by unified memory (base / Pro / Max / Ultra chips), graphics cards by VRAM (24GB → 3090/4090).
const APPLE_BW: [number, number][] = [[16, 100], [32, 120], [64, 273], [128, 400], [Infinity, 800]];
const CARD_BW: [number, number][] = [[8, 350], [12, 450], [16, 500], [24, 950], [32, 1790], [48, 900], [96, 2000], [Infinity, 3000]];
export const CPU_BW = 80; // dual-channel DDR5
const UNIFIED_BW = 256; // 256-bit LPDDR5x: Ryzen AI Max 256, DGX Spark 273
const tier = (t: [number, number][], gb: number) => t.find(([max]) => gb <= max)![1];

// Bandwidth of the user's fast memory: their exact chip / card if we know it, else the typical one.
export function fastBandwidth(s: Specs): number {
  if (s.hw && (s.gpu === "apple" ? s.hw.kind === "apple" : s.hw.kind !== "apple")) return s.hw.bandwidth_gbs;
  if (s.gpu === "apple") return tier(APPLE_BW, s.ram);
  if (s.gpu === "unified") return UNIFIED_BW;
  if (s.vram > 0) return tier(CARD_BW, s.vram);
  return CPU_BW;
}

export function machineFor(s: Specs, fastGb: number): Machine {
  if (s.gpu === "apple") return { fastGb: Infinity, fastBw: fastBandwidth(s), cpuBw: CPU_BW, kind: "apple" };
  if (s.gpu === "unified") return { fastGb: Infinity, fastBw: fastBandwidth(s), cpuBw: CPU_BW, kind: "gpu" };
  if (s.vram > 0) return { fastGb, fastBw: fastBandwidth(s), cpuBw: CPU_BW, kind: "gpu" };
  return { fastGb: 0, fastBw: CPU_BW, cpuBw: CPU_BW, kind: "cpu" };
}

export function tokPerSec(v: Variant, m: Model, s: Specs, fastGb: number): number {
  const params = m.params_b ?? 1;
  return estimateTps(v.gb, params, m.active_b ?? params, machineFor(s, fastGb));
}
