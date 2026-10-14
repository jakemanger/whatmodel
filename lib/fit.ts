// Which models can this machine run, and how? Pure function: specs + models → rows.

import { catOf, priceOf } from "./categories.ts";
import { findHardware } from "./hardware.ts";
import { bitsOf } from "./quant.ts";
import type { Measured } from "./measured.ts";
import { SLOW_TPS } from "./speed.ts";
import type { Category, Hardware, Kv, Model, Scored, Specs, SpeedUnit, Variant } from "./types.ts";

// Text models with fewer results than this, across every text test, are left off the leaderboards unless
// asked for (?thin=1): one narrow test, such as a chat judge, translation or tool calls, says little about
// overall ability. Image, video and speech are ranked mostly by arenas, where one or two results are normal.
export const LISTED_FROM = 3;
export const listedByDefault = (cat: Category, n: number | undefined) => cat !== "llm" || n === undefined || n >= LISTED_FROM;

// CUDA-only commands need an NVIDIA card (or one whose make we don't know).
const isNvidia = (s: Specs) => (s.gpu === "card" || s.gpu === "unified") && (!s.hw || s.hw.kind === "nvidia");

export type Where = "local" | "local-slow" | "api" | "preview" | "app" | "none" | "retired" | "research";

// Limited previews belong on the current leaderboard even before a public run route exists. Research models
// that were never released are listed with retired ones.
export const catalogueOnly = (m: Model) => !m.api && !m.local?.variants.length && (!m.availability || m.availability === "research");

// measured: on this exact hardware (or an API's measured speed). scaled: measured on other
// hardware of the same kind, scaled by memory bandwidth. estimated: from the calibrated formula.
// elsewhere: measured on other hardware and not scalable (image/video/audio are compute-bound).
export type RowSpeed = { value: number; unit: SpeedUnit; how: "measured" | "scaled" | "elsewhere" | "estimated"; on?: string };

export type Row = {
  rank: number | null;
  id: string;
  name: string;
  provider: string;
  category: Category;
  score: number | null; // null when not calibrated on the selected scale
  score_full: number | null; // the model as benchmarked
  pm: number | null;
  n: number;
  evidence?: "none" | "raw" | "comparison";
  thin: boolean; // too few results to trust the rank much
  maker_only: boolean; // every counted result was reported by the model's own maker
  where: Where;
  app?: string | null; // the app an app-only model is offered in
  cmd: string | null; // the one thing to paste
  quant: string | null; // local variant, e.g. "2-bit"
  speed: RowSpeed | null;
  need_gb: number | null; // memory the smallest local variant needs
  mem_gb: number | null; // memory the variant shown needs; for API rows, what a local download needs (null if none)
  price: number | null; // USD per the category's unit (LLMs: per 1M tokens, 3:1 input:output)
  over_budget: boolean; // has an API, but it costs more than the max price
  also_local: boolean; // listed by its API, but a download also runs locally (on these specs, if given)
  open_weights: boolean;
  params_b: number | null;
  context_k: number | null; // context window, thousands of tokens (LLMs)
};

export type ScoredRow = Row & { rank: number; score: number; score_full: number; pm: number };
export const hasScore = (r: Row): r is ScoredRow => r.score !== null;

// Memory a variant needs. LLM sizes are downloads, so add the KV cache for an 8k-token conversation
// and llama.cpp's scratch buffers; other categories list the memory needed to run directly.
export const CONTEXT_TOKENS = 8192;
// With the model's KV cache size from its GGUF header (data/kv.json), as Local Model Explorer sizes it:
// full-attention layers hold every token; sliding-window layers hold llama-server's 4 slots' windows
// plus a 512-token batch, padded to 256 (n_swa * n_seq_max + n_ubatch); scratch is the logits for a
// 512-token batch plus 0.3 GB and 4 kB per token.
export const kvGb = (kv: Kv, ctx = CONTEXT_TOKENS) =>
  (kv.full * ctx + (kv.swa ?? []).reduce((t, [bytes, w]) => t + bytes * Math.min(ctx, Math.ceil((w * 4 + 512) / 256) * 256), 0)) / 1e9;
const scratchGb = (kv: Kv, ctx = CONTEXT_TOKENS) => (512 * (kv.vocab ?? 152_064) * 4 + 0.3e9 + ctx * 4000) / 1e9;
// Without one, a flat allowance.
export const llmOverheadGb = (gb: number) => gb * 0.05 + 1.5;
export const needGb = (v: Variant, cat: Category = "llm", kv?: Kv) =>
  cat !== "llm" ? v.gb : kv ? v.gb + kvGb(kv) + scratchGb(kv) : v.gb + llmOverheadGb(v.gb);

// Memory available to a model, split into "fast" (GPU / unified) and total (with CPU offload).
export function usable(s: Specs): { fast: number; total: number } {
  if (s.gpu === "apple" || s.gpu === "unified") {
    // macOS lets the GPU wire ~2/3 of RAM up to 36GB, ~3/4 above that. Other unified-memory
    // machines are assumed to leave the GPU the same share.
    const fast = s.ram * (s.ram <= 36 ? 0.67 : 0.75);
    return { fast, total: fast };
  }
  const sys = Math.max(0, s.ram - 4) * 0.8;
  if (s.vram > 0) return { fast: s.vram - 0.5, total: s.vram - 0.5 + sys };
  return { fast: 0, total: sys };
}

const runsOn = (v: Variant, s: Specs | null) =>
  !s || !v.platform || v.platform === "any" || (v.platform === "mac" ? s.gpu === "apple"
    : v.platform === "gpu" ? s.gpu === "card" && (!s.hw || s.hw.kind === "nvidia" || s.hw.kind === "amd") : isNvidia(s));
// A split download runs when the machine has one of its stated GPU memory and RAM pairs: the first
// that runs it at full speed, else one that runs it slowly. Without a machine, the first (the maker's
// main requirement).
const pairFor = (v: Variant, s: Specs | null, slowOk = true) => {
  const ok = (n: NonNullable<Variant["needs"]>[number]) => !!s && s.vram >= n.vram_gb && s.ram >= n.ram_gb;
  return v.needs!.find((n) => !n.slow && ok(n)) ?? (slowOk ? v.needs!.find(ok) : undefined);
};

type Opts = {
  specs: Specs | null;
  max?: number | null; // highest price in the category's unit; local runs are free, so 0 = local only
  gFor?: (m: Model, v: Variant) => { g: number; label: string }; // score of a quantized variant
  // The measured speed to show for a model (lib/measured.ts), given the download this machine runs and
  // whether part of it runs from system RAM (null without a machine).
  speedFor?: (m: Model, v: Variant | null, s: Specs | null, offloaded: boolean | null) => Measured | null;
  thinBelow?: number; // results needed to not be "thin": 3, or fewer in categories with fewer benchmarks
  retired?: boolean; // also list models with no API or weights left, for history
  includeUnscored?: boolean; // keep models whose score is unavailable on this scale
};

export function rank(models: Model[], scores: Map<string, Scored>, { specs, max = null, gFor, speedFor, thinBelow = 3, retired = false, includeUnscored = false }: Opts): Row[] {
  const mem = specs ? usable(specs) : null;
  const rows: Row[] = models.flatMap((m) => {
    const s = scores.get(m.id);
    // Callers choose whether historical models are listed; announced previews remain discoverable.
    const gone = !m.api && !m.local?.variants.length;
    if ((!s && !includeUnscored) || (catalogueOnly(m) && !retired)) return [];
    const cat = catOf(m);
    const all = [...(m.local?.variants ?? [])].sort((x, y) => y.gb - x.gb);
    const variants = all.filter((v) => runsOn(v, specs));
    const smallest = variants.at(-1);
    // A split download's memory is the RAM of the pair this machine runs it with.
    const need = (v: Variant) => (v.needs ? (pairFor(v, specs) ?? v.needs[0]).ram_gb : needGb(v, cat, m.kv));
    const fits = (v: Variant, limit: number, slowOk: boolean) => (v.needs ? !!pairFor(v, specs, slowOk) : need(v) <= limit);
    const price = priceOf(m.api);
    const api = m.api && max !== 0 && (max === null || (price !== null && price <= max)) ? m.api : null;

    // Best-quality variant that fits in fast memory. Otherwise part of it has to run from system
    // RAM, so for LLMs take the smallest variant that's still 4-bit or better: it offloads the least.
    const inFast = mem ? variants.find((v) => fits(v, mem.fast, false)) : undefined;
    const fitsTotal = mem ? variants.filter((v) => fits(v, mem.total, true)) : [];
    const b4 = (v: Variant) => { const b = bitsOf(v); return typeof b !== "number" || b >= 4; };
    const offload = cat === "llm" ? (fitsTotal.filter(b4).at(-1) ?? fitsTotal[0]) : fitsTotal[0];
    const pick = inFast ?? offload ?? null;
    const measured = speedFor ? speedFor(m, pick ?? smallest ?? all.at(-1) ?? null, specs, specs && pick ? !inFast : null) : null;
    // Slow when it doesn't fit in fast memory, unless measurements say otherwise: a run on this chip
    // decides either way; a run on a comparable machine can show it runs at a usable speed.
    const slow = cat !== "llm" ? !inFast
      : measured?.basis === "exact" ? measured.speed.value < SLOW_TPS
      : !inFast && !(measured?.basis === "comparable" && measured.speed.value >= SLOW_TPS);

    let run: Where = "none";
    let cmd: string | null = null;
    let chosen: Variant | null = null;
    // Free and private beats paid, but a slow local model loses to an API.
    if (pick && !slow) [run, cmd, chosen] = ["local", pick.cmd, pick];
    else if (api) [run, cmd] = ["api", api.url];
    else if (pick) [run, cmd, chosen] = ["local-slow", pick.cmd, pick];
    else if (!mem && smallest) [run, cmd] = ["local", smallest.cmd]; // no specs: show the model as benchmarked
    // Nothing to run: listed for comparison, but never as fitting a budget or a machine.
    if (gone) run = max !== null || (catalogueOnly(m) && specs) ? "none" : m.availability ?? "retired";
    // An app-only model links to where it's offered.
    if (run === "app") cmd = m.availability_source ?? null;

    const apiSpeed: RowSpeed | null =
      run !== "api" || !m.api ? null
      : m.api.tps ? { value: Math.round(m.api.tps), unit: "tok/s", how: "measured" }
      : m.api.speed && m.api.speed_unit
        ? { value: m.api.speed >= 10 ? Math.round(m.api.speed) : Math.round(m.api.speed * 10) / 10, unit: m.api.speed_unit, how: "measured" }
      : null;

    const q = s && chosen && gFor ? gFor(m, chosen) : null;
    const g = q?.g ?? s?.g;
    return [{
      rank: 0,
      id: m.id,
      name: m.name,
      provider: m.provider,
      category: cat,
      score: g === undefined ? null : Math.round(g * 10) / 10,
      score_full: s ? Math.round(s.g * 10) / 10 : null,
      pm: s ? Math.round(s.pm * 10) / 10 : null,
      n: s?.n ?? 0,
      thin: !!s && s.n < thinBelow,
      maker_only: !!s && s.n > 0 && s.lab === s.n,
      where: run,
      ...(run === "app" ? { app: m.app ?? null } : {}),
      cmd,
      quant: q?.label ?? chosen?.quant ?? null,
      // Whatever we have, whichever filters are on: the API's speed for an API row, else a measured run.
      speed: (run === "api" ? apiSpeed : null) ?? (measured && run === "api" ? { ...measured.speed, on: `${measured.speed.on}, run locally` } : measured?.speed ?? null),
      need_gb: (smallest ?? all.at(-1)) ? Math.round(need((smallest ?? all.at(-1))!)) : null,
      // The memory its download needs, for every model with one: the download this machine runs, else
      // the smallest (one that runs on this machine if there is one).
      mem_gb: (chosen ?? pick ?? smallest ?? all.at(-1)) ? Math.round(need((chosen ?? pick ?? smallest ?? all.at(-1))!) * 10) / 10 : null,
      price: price === null ? null : Math.round(price * 10000) / 10000,
      over_budget: !!m.api && !api,
      also_local: run === "api" && (mem ? !!pick : !!smallest),
      open_weights: m.open_weights,
      params_b: m.params_b ?? null,
      context_k: m.context_k ?? null,
    }];
  });
  rows.sort((x, y) => x.score === null || y.score === null
    ? x.score === y.score ? x.name.localeCompare(y.name) : x.score === null ? 1 : -1
    : y.score - x.score);
  rows.forEach((r, i) => (r.rank = r.score === null ? null : i + 1));
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
  const tie = (a: Row, b: Row) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name);
  // Rows without a value (no speed data, API-only memory, …) always go last.
  return [...rows].sort((a, b) => {
    const x = key(a), y = key(b);
    if (x === null || y === null) return x === y ? tie(a, b) : x === null ? 1 : -1;
    return x === y ? tie(a, b) : sign * (x - y);
  });
}

export function parseSort(q: URLSearchParams, rows: Row[]): { sort: Sort; dir: Dir } {
  const s = q.get("sort");
  const sort = (SORTS as readonly string[]).includes(s ?? "") ? (s as Sort) : "score";
  const d = q.get("dir");
  return { sort, dir: d === "asc" || d === "desc" ? d : defaultDir(sort, rows) };
}

// Highest price. Given a machine, the default is what runs on it (0, local only); max=any adds APIs.
export function parseMax(q: URLSearchParams, specs: Specs | null = null): number | null {
  const v = q.get("max");
  if (v === "any") return null;
  return v !== null && v !== "" && Number(v) >= 0 ? Number(v) : specs ? 0 : null;
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
//   ram, vram (GB or raw OS units), gpu=apple|card|unified|none (nvidia, amd, intel also mean card)
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
  const hw = findHardware(hardware, q.get("hw") ?? (chip.join(" ").trim() || gpus[0]?.[0]?.trim()), mac ? ram : vram);
  const gpu =
    g === "apple" || g === "none" || g === "unified" ? g
    : g === "card" || g === "nvidia" || g === "amd" || g === "intel" || g === "gpu" ? "card"
    : mac > 0 ? "apple" : hw?.unified ? "unified" : vram > 0 ? "card" : "none"; // a detected GB10 shares RAM, whatever VRAM it reports
  return { ram: Math.max(0, ram), vram: Math.max(0, vram), gpu, hw };
}
