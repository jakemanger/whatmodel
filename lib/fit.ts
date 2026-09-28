// Which models can this machine run, and how? Pure function: specs + models → rows.

import { catOf, priceOf } from "./categories.ts";
import { findHardware } from "./hardware.ts";
import { bitsOf } from "./quant.ts";
import { SLOW_TPS } from "./speed.ts";
import type { Category, Hardware, Model, Scored, Specs, SpeedUnit, Variant } from "./types.ts";

// CUDA-only commands need an NVIDIA card (or one whose make we don't know).
const isNvidia = (s: Specs) => s.gpu === "card" && (!s.hw || s.hw.kind === "nvidia");

export type Where = "local" | "local-slow" | "api" | "none" | "retired";

// measured: on this exact hardware (or an API's measured speed). scaled: measured on other
// hardware of the same kind, scaled by memory bandwidth. estimated: from the calibrated formula.
// elsewhere: measured on other hardware and not scalable (image/video/audio are compute-bound).
export type RowSpeed = { value: number; unit: SpeedUnit; how: "measured" | "scaled" | "elsewhere" | "estimated"; on?: string };

export type Row = {
  rank: number;
  id: string;
  name: string;
  provider: string;
  category: Category;
  score: number; // published-model score; quantization penalties are currently disabled
  score_full: number; // the model as benchmarked
  pm: number;
  n: number;
  thin: boolean; // too few results to trust the rank much
  where: Where;
  cmd: string | null; // the one thing to paste
  quant: string | null; // local variant, e.g. "2-bit"
  speed: RowSpeed | null;
  need_gb: number | null; // memory the smallest local variant needs
  mem_gb: number | null; // memory the variant shown needs (null when it runs in the cloud)
  price: number | null; // USD per the category's unit (LLMs: per 1M tokens, 3:1 input:output)
  over_budget: boolean; // has an API, but it costs more than the max price
  open_weights: boolean;
  params_b: number | null;
  context_k: number | null; // context window, thousands of tokens (LLMs)
};

// Memory a variant needs. LLM sizes are downloads, so add room for the KV cache at a modest
// context and the runtime; other categories list the memory needed to run directly.
export const llmOverheadGb = (gb: number) => gb * 0.05 + 1.5;
export const needGb = (v: Variant, cat: Category = "llm") => (cat === "llm" ? v.gb + llmOverheadGb(v.gb) : v.gb);

// Memory available to a model, split into "fast" (GPU / unified) and total (with CPU offload).
export function usable(s: Specs): { fast: number; total: number } {
  if (s.gpu === "apple") {
    // macOS lets the GPU wire ~2/3 of RAM up to 36GB, ~3/4 above that.
    const fast = s.ram * (s.ram <= 36 ? 0.67 : 0.75);
    return { fast, total: fast };
  }
  const sys = Math.max(0, s.ram - 4) * 0.8;
  if (s.vram > 0) return { fast: s.vram - 0.5, total: s.vram - 0.5 + sys };
  return { fast: 0, total: sys };
}

const runsOn = (v: Variant, s: Specs | null) =>
  !s || !v.platform || v.platform === "any" || (v.platform === "mac" ? s.gpu === "apple" : isNvidia(s));

type Opts = {
  specs: Specs | null;
  max?: number | null; // highest price in the category's unit; local runs are free, so 0 = local only
  gFor?: (m: Model, v: Variant) => { g: number; label: string }; // score of a quantized variant
  speedFor?: (m: Model, v: Variant, s: Specs, fastGb: number) => RowSpeed | null;
  thinBelow?: number; // results needed to not be "thin": 3, or fewer in categories with fewer benchmarks
  retired?: boolean; // also list models with no API or weights left, for history
};

export function rank(models: Model[], scores: Map<string, Scored>, { specs, max = null, gFor, speedFor, thinBelow = 3, retired = false }: Opts): Row[] {
  const mem = specs ? usable(specs) : null;
  const rows = models.flatMap((m) => {
    const s = scores.get(m.id);
    // Retired models (no API, no weights) still anchor the fit but can't be run, so they're listed only on request.
    const gone = !m.api && !m.local?.variants.length;
    if (!s || (gone && !retired)) return [];
    const cat = catOf(m);
    const variants = (m.local?.variants ?? []).filter((v) => runsOn(v, specs)).sort((x, y) => y.gb - x.gb);
    const smallest = variants.at(-1);
    const best = (limit: number) => variants.find((v) => needGb(v, cat) <= limit);
    const price = priceOf(m.api);
    const api = m.api && max !== 0 && (max === null || (price !== null && price <= max)) ? m.api : null;

    // Best-quality variant that fits in fast memory. Otherwise part of it has to run from system
    // RAM, so for LLMs take the smallest variant that's still 4-bit or better: it offloads the least.
    const inFast = mem ? best(mem.fast) : undefined;
    const fitsTotal = mem ? variants.filter((v) => needGb(v, cat) <= mem.total) : [];
    const b4 = (v: Variant) => { const b = bitsOf(v); return typeof b !== "number" || b >= 4; };
    const offload = cat === "llm" ? (fitsTotal.filter(b4).at(-1) ?? fitsTotal[0]) : fitsTotal[0];
    const pick = inFast ?? offload ?? null;
    const local = pick && specs && mem && speedFor ? speedFor(m, pick, specs, mem.fast) : null;
    const slow = cat === "llm" ? local ? local.value < SLOW_TPS : !inFast : !inFast;

    let run: Where = "none";
    let cmd: string | null = null;
    let chosen: Variant | null = null;
    // Free and private beats paid, but a slow local model loses to an API.
    if (pick && !slow) [run, cmd, chosen] = ["local", pick.cmd, pick];
    else if (api) [run, cmd] = ["api", api.url];
    else if (pick) [run, cmd, chosen] = ["local-slow", pick.cmd, pick];
    else if (!mem && smallest) [run, cmd] = ["local", smallest.cmd]; // no specs: show the model as benchmarked
    if (gone) run = "retired";

    const apiSpeed: RowSpeed | null =
      run !== "api" || !m.api ? null
      : m.api.tps ? { value: Math.round(m.api.tps), unit: "tok/s", how: "measured" }
      : m.api.speed && m.api.speed_unit
        ? { value: m.api.speed >= 10 ? Math.round(m.api.speed) : Math.round(m.api.speed * 10) / 10, unit: m.api.speed_unit, how: "measured" }
      : null;

    const q = chosen && gFor ? gFor(m, chosen) : null;
    const g = q?.g ?? s.g;
    return [{
      rank: 0,
      id: m.id,
      name: m.name,
      provider: m.provider,
      category: cat,
      score: Math.round(g * 10) / 10,
      score_full: Math.round(s.g * 10) / 10,
      pm: Math.round(s.pm * 10) / 10,
      n: s.n,
      thin: s.n < thinBelow,
      where: run,
      cmd,
      quant: q?.label ?? null,
      speed: chosen ? local : apiSpeed,
      need_gb: smallest ? Math.round(needGb(smallest, cat)) : null,
      mem_gb:
        chosen ? Math.round(needGb(chosen, cat) * 10) / 10
        : run === "none" || (run === "local" && smallest) ? (smallest ? Math.round(needGb(smallest, cat) * 10) / 10 : null)
        : null,
      price: price === null ? null : Math.round(price * 10000) / 10000,
      over_budget: !!m.api && !api,
      open_weights: m.open_weights,
      params_b: m.params_b ?? null,
      context_k: m.context_k ?? null,
    }];
  });
  rows.sort((x, y) => y.score - x.score);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

// Column sorting. `#` stays the score rank, so a re-sorted list still shows where each model stands.
export const SORTS = ["score", "where", "speed", "ram", "context"] as const;
export type Sort = (typeof SORTS)[number];
export type Dir = "asc" | "desc";

// The natural first direction for each column: best first.
export function defaultDir(sort: Sort, rows: Row[]): Dir {
  if (sort === "where" || sort === "ram") return "asc"; // free / small first
  if (sort === "speed") return rows.some((r) => r.speed?.unit.startsWith("s/")) ? "asc" : "desc"; // s/image: lower is faster
  return "desc";
}

export function sortRows(rows: Row[], sort: Sort, dir: Dir): Row[] {
  const key = (r: Row): number | null => {
    if (sort === "score") return r.score;
    if (sort === "where") return r.where === "local" ? 0 : r.where === "local-slow" ? 0.0001 : r.where === "api" ? r.price : null;
    if (sort === "speed") return r.speed?.value ?? null;
    if (sort === "ram") return r.mem_gb;
    return r.context_k;
  };
  const sign = dir === "asc" ? 1 : -1;
  // Rows without a value (no speed data, API-only memory, …) always go last.
  return [...rows].sort((a, b) => {
    const x = key(a), y = key(b);
    if (x === null || y === null) return x === y ? a.rank - b.rank : x === null ? 1 : -1;
    return x === y ? a.rank - b.rank : sign * (x - y);
  });
}

export function parseSort(q: URLSearchParams, rows: Row[]): { sort: Sort; dir: Dir } {
  const s = q.get("sort");
  const sort = (SORTS as readonly string[]).includes(s ?? "") ? (s as Sort) : "score";
  const d = q.get("dir");
  return { sort, dir: d === "asc" || d === "desc" ? d : defaultDir(sort, rows) };
}

export function parseMax(q: URLSearchParams): number | null {
  const v = q.get("max");
  return v !== null && v !== "" && Number(v) >= 0 ? Number(v) : null;
}

// Accept GB, or whatever number the OS reports so detect commands need no math:
// bytes (macOS sysctl, Windows), kB (/proc/meminfo), MiB (nvidia-smi). OS-reported
// memory is always a little under what's installed, so raw values round up.
export function ramGb(v: number) {
  if (v > 2 ** 32) return Math.ceil(v / 2 ** 30);
  if (v > 16384) return Math.ceil(v / 2 ** 20);
  return v;
}
// VRAM: GB, MiB (nvidia-smi) or bytes (Linux sysfs for AMD).
export const vramGb = (v: number) => (v > 1e8 ? Math.ceil(v / 2 ** 30) : v > 2048 ? Math.ceil(v / 1024) : v);

// Params:
//   ram, vram (GB or raw OS units), gpu=apple|card|none (nvidia, amd, intel also mean card)
//   mac=<bytes>[\n<chip name>]         from `sysctl -n hw.memsize machdep.cpu.brand_string`
//   nv=<name>, <MiB> MiB[\n...]         from `nvidia-smi --query-gpu=name,memory.total --format=csv,noheader`
//   hw=<hardware id or name>            exact chip / card, for bandwidth and measured speeds
export function parseSpecs(q: URLSearchParams, hardware: Hardware[] = []): Specs | null {
  const [macBytes, ...chip] = (q.get("mac") ?? "").split("\n");
  const mac = Number(macBytes) || 0;
  const gpus = (q.get("nv") ?? "").split("\n").map((l) => l.split(",")).filter((p) => p.length === 2);
  const nvVram = gpus.reduce((s, [, mib]) => s + vramGb(parseFloat(mib) || 0), 0);

  const ram = ramGb(mac || Number(q.get("ram") ?? 0));
  const vram = nvVram || vramGb(Number(q.get("vram") ?? 0));
  if (!(ram > 0) && !(vram > 0)) return null;
  const g = q.get("gpu");
  const gpu =
    g === "apple" || g === "none" ? g
    : g === "card" || g === "nvidia" || g === "amd" || g === "intel" || g === "gpu" ? "card"
    : mac > 0 ? "apple" : vram > 0 ? "card" : "none";
  const hw = findHardware(hardware, q.get("hw") ?? (chip.join(" ").trim() || gpus[0]?.[0]?.trim()), mac ? ram : vram);
  return { ram: Math.max(0, ram), vram: Math.max(0, vram), gpu, hw };
}
