// Plain-text leaderboard for curl and agents, plus labels shared with the web page.

import { CATEGORIES } from "./categories.ts";
import { hasScore, usable, type Row, type RowSpeed } from "./fit.ts";
import type { Category, Specs } from "./types.ts";

export const sponsor: { text: string; url: string } | null = null;

export const DISCLOSURE =
  "Scores, speeds, prices and memory figures are estimates from the public sources linked on each model's page. " +
  "They can be incomplete, out of date or wrong. Review any command before you run it.";

// One command per OS: reads RAM and graphics card memory (nvidia-smi, or AMD's sysfs file on Linux) and sends the
// raw numbers; the server converts units (see ramGb). Nothing is downloaded or executed.
// `curl.exe` sidesteps Windows PowerShell's `curl` alias.
const SMI = "nvidia-smi -i 0 --query-gpu=memory.total --format=csv,noheader,nounits";
export const detect = (host: string, path = "/") => ({
  mac: `curl "${host}${path}?mac=$(sysctl -n hw.memsize)"`,
  linux: `curl "${host}${path}?ram=$(awk '/MemT/{print $2}' /proc/meminfo)&vram=$(${SMI} 2>/dev/null || cat /sys/class/drm/card*/device/mem_info_vram_total 2>/dev/null | sort -n | tail -1)"`,
  windows: `curl.exe "${host}${path}?ram=$((gcim Win32_ComputerSystem).TotalPhysicalMemory)&vram=$(${SMI} 2>$null)"`,
});
export type OS = keyof ReturnType<typeof detect>;

// Same, but also sends the chip / GPU name so speeds can come from measurements on that exact hardware.
const SMI_NAME = "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader";
// These default to max=0: what that machine can run locally.
export const detectExact = (host: string, path = "/") => ({
  mac: `curl -G ${host}${path} -d max=0 --data-urlencode "mac=$(sysctl -n hw.memsize machdep.cpu.brand_string)"`,
  linux: `curl -G ${host}${path} -d max=0 --data-urlencode "ram=$(awk '/MemT/{print $2}' /proc/meminfo)" --data-urlencode "nv=$(${SMI_NAME} 2>/dev/null)"`,
  windows: `curl.exe -G ${host}${path} -d max=0 --data-urlencode "ram=$((gcim Win32_ComputerSystem).TotalPhysicalMemory)" --data-urlencode "nv=$(${SMI_NAME} 2>$null)"`,
});

// The curl command for a set of picks, keeping only params the API understands.
export function curlFor(host: string, path: string, q: URLSearchParams) {
  const keep = new URLSearchParams();
  for (const k of ["mac", "ram", "gpu", "vram", "hw", "max", "sort", "dir", "all", "retired", "set", "score", "chart"]) {
    const v = q.get(k);
    if (v) keep.set(k, v);
  }
  return keep.size ? `curl "${host}${path}?${keep}"` : `curl ${host}${path === "/" ? "" : path}`;
}

const money = (p: number) => (p >= 1 ? p.toFixed(2) : p >= 0.1 ? p.toFixed(2) : p >= 0.01 ? p.toFixed(3) : p.toFixed(4));
export const price = (p: number | null, cat: Category = "llm") => (p === null ? "" : `$${money(p)}/${CATEGORIES[cat].priceUnit}`);

// Local rows name the selected download; the score describes the published model evaluation.
export const displayName = (r: Row) => (r.quant ? `${r.name} · ${r.quant}` : r.name);

export function whereLabel(r: Row) {
  if (r.where === "local") return "local";
  if (r.where === "local-slow") return "local (slow)";
  if (r.where === "api") return `api ${r.price === null ? "price unknown" : price(r.price, r.category)}${r.also_local ? " +local" : ""}`;
  if (r.where === "retired") return "comparison only";
  if (r.where === "preview") return "limited preview";
  const why = [r.need_gb !== null && `needs ${r.need_gb}GB`, r.over_budget && (r.price === null ? "price unknown" : price(r.price, r.category))].filter(Boolean);
  return `✗ ${why.join(" or ")}`;
}

// "85 tok/s" measured, "~34 tok/s" scaled or estimated. "×" for realtime factors.
export function speedLabel(s: RowSpeed | null) {
  if (!s) return "";
  const n = s.unit === "x-realtime" ? `${s.value}×` : `${s.value} ${s.unit}`;
  return s.how === "measured" ? n : `~${n}`;
}
export const contextLabel = (k: number | null) => (k === null ? "" : k >= 1000 ? `${Math.round(k / 100) / 10}M` : `${Math.round(k)}k`);

export function speedNote(s: RowSpeed | null) {
  if (!s) return "";
  if (s.how === "measured") return s.on ? `measured on ${s.on}` : "measured API speed";
  if (s.how === "scaled") return `measured on ${s.on}, scaled to your memory bandwidth`;
  if (s.how === "elsewhere") return `measured on ${s.on}; yours may differ`;
  return "estimated from your memory bandwidth (no measurement for this model yet)";
}

export const describeMax = (max: number, cat: Category = "llm") => (max === 0 ? "local only" : `up to ${price(max, cat)}`);

export function describeSpecs(s: Specs) {
  const gpu = s.hw ? s.hw.name : s.gpu === "apple" ? "Apple Silicon" : s.gpu === "card" ? `${s.vram}GB graphics card` : "no GPU";
  const u = usable(s);
  const avail = s.gpu === "none" ? `~${Math.round(u.total)}GB for models (CPU, slow)` : `~${Math.round(u.fast)}GB fast`;
  return `${s.ram ? `${s.ram}GB RAM · ` : ""}${gpu} → ${avail}`;
}

type Opts = { color: boolean; base: string; limit: number; all: boolean; benches: number; updated: string; cat: Category;
  comparison?: { selected?: string; scoreMode: "overall" | "set"; sets: { id: string; label: string; models: number }[] };
  retiredCount?: number; // scored models with no verified API or download, listed unless ?retired=0
};

export function toText(rows: Row[], specs: Specs | null, max: number | null, o: Opts) {
  const c = (code: string, s: string) => (o.color ? `\x1b[${code}m${s}\x1b[0m` : s);
  const host = o.base.replace(/^https?:\/\//, "");
  const path = CATEGORIES[o.cat].path;
  const shown = rows.filter((r) => o.all || r.where !== "none").slice(0, o.limit);
  const hidden = rows.filter((r) => r.where === "none").length;

  const out: string[] = [""];
  out.push(`  ${c("1;32", "whatmodel.sh")}${o.cat === "llm" ? "" : c("1;32", path)} ${c("2", `· find the best ${CATEGORIES[o.cat].title} you can run · updated ${o.updated}`)}`);
  out.push("");
  if (o.comparison) {
    out.push(o.comparison.scoreMode === "set" ? "  Scores within the selected set only." : "  Overall scores; uncalibrated models have no score or rank.");
    out.push("  Extra: ?set=<id> filters models; add &score=set for scores within that set.");
    for (const set of o.comparison.sets) out.push(`  ${set.id === o.comparison.selected ? "*" : " "} ${set.label} (${set.models} models): ?set=${set.id}`);
    out.push("");
  }
  if (specs) {
    out.push(`  your machine: ${describeSpecs(specs)}${max !== null ? ` · ${describeMax(max, o.cat)}` : ""}`);
    if (max === null) out.push(c("2", `  add &max=0 for local only, or &max=${o.cat === "llm" ? "1" : "0.05"} to cap API price`));
  }
  else if (max !== null) out.push(`  ${describeMax(max, o.cat)}`);
  else {
    const ex = `curl "${host}${path}?ram=32&gpu=apple&max=0"`;
    out.push(`  showing reviewed models, best first. add params to see what you can run:`);
    out.push(`    ${c("33", "ram=32")}                  your RAM in GB`);
    out.push(`    ${c("33", "gpu=apple|card|none")}     Apple Silicon, a graphics card (add ${c("33", "vram=24")}, its memory in GB), or none`);
    out.push(`    ${c("33", "max=0")}                   local only. or ${c("33", `max=${o.cat === "llm" ? "1" : "0.05"}`)} to include APIs up to $${o.cat === "llm" ? "1" : "0.05"}/${CATEGORIES[o.cat].priceUnit}`);
    out.push(`    ${c("33", "sort=speed")}              or score, where, ram${o.cat === "llm" ? ", context" : ""}`);
    out.push(`    ${c("33", "chart=1")}                 plot score against price and memory`);
    out.push(`  e.g. run ${c("33", ex)}`);
    out.push("");
    out.push(`  or run the line for your system to fill in your machine:`);
    for (const [os, cmd] of Object.entries(detect(host, path))) out.push(`    ${os.padEnd(8)} ${c("33", cmd)}`);
  }
  out.push("");

  if (!rows.length) out.push("  No reviewed rankings available for this category yet.");
  const w = Math.min(34, Math.max(5, ...shown.map((r) => displayName(r).length)));
  const fit = (s: string) => (s.length > w ? s.slice(0, w - 1) + "…" : s.padEnd(w));
  out.push(c("2", `  ${"#".padStart(3)}  ${"MODEL".padEnd(w)}  ${"SCORE".padStart(7)}  ${"WHERE".padEnd(18)}  ${"SPEED".padStart(12)}  ${"RAM".padStart(5)}  ${o.cat === "llm" ? `${"CONTEXT".padStart(7)}  ` : ""}GET IT`));
  for (const r of shown) {
    const g = hasScore(r) ? `${Math.round(r.score)}±${Math.round(r.pm)}${(r.thin ? "*" : "") + (r.maker_only ? "†" : "") || " "}` : "—";
    const run = whereLabel(r).padEnd(18);
    const color = r.where === "local" ? "32" : r.where === "api" ? "36" : r.where === "local-slow" ? "33" : "2";
    const line = `  ${String(r.rank ?? "—").padStart(3)}  ${fit(displayName(r))}  ${g.padStart(7)}  ${c(color, run)}  ${speedLabel(r.speed).padStart(12)}  ${(r.mem_gb !== null ? `~${Math.round(r.mem_gb)}GB` : "").padStart(5)}  ${o.cat === "llm" ? `${contextLabel(r.context_k).padStart(7)}  ` : ""}${r.cmd ?? ""}`;
    out.push(r.where === "none" || r.where === "retired" ? c("2", line) : line);
  }
  out.push("");
  if (!o.all && hidden > 0) out.push(c("2", `  + ${hidden} more models don't fit your machine or budget (?all=1)`));
  if (o.retiredCount && max === null && !specs && !shown.some((r) => r.where === "retired")) out.push(c("2", `  + ${o.retiredCount} comparison-only models hidden (drop ?retired=0 to list them)`));
  if (shown.some((r) => r.thin)) out.push(c("2", `  * new or thinly tested: ranked on too few benchmark results`));
  if (shown.some((r) => r.maker_only)) out.push(c("2", `  † only the maker's own numbers so far`));
  if (shown.some((r) => r.score === null && r.evidence !== "none")) out.push(c("2", "  — not yet calibrated on the overall score scale; use ?set=<id>&score=set for set scores where available"));
  if (shown.some((r) => r.evidence === "none")) out.push(c("2", "  — catalogue entries without reviewed results have no score or rank"));
  if (shown.some((r) => r.speed && r.speed.how !== "measured")) out.push(c("2", `  ~speed: measured on other hardware, or estimated. send your chip/GPU name for exact matches: ${host}/method#speed`));
  out.push(c("2", `  RAM is estimated; listed context is a provider ceiling, not a promise that it fits.`));
  out.push(c("2", `  sources and licences: ${host}/method#sources`));
  out.push(c("2", `  score = one number combining ${o.benches} benchmarks (50 = average model, ± = uncertainty) · ${host}/method`));
  out.push(c("2", `  other lists: ${["/", "/image", "/video", "/tts", "/stt"].filter((p) => p !== path).map((p) => host + p).join("  ")}`));
  out.push(c("2", `  ?max=${o.cat === "llm" ? "1" : "0.05"} (max $/${CATEGORIES[o.cat].priceUnit}, 0 = local only)  ?sort=score|where|speed|ram|context  ?format=json  ?all=1  ?retired=0`));
  if (sponsor) out.push(`  ${c("35", "sponsor:")} ${sponsor.text} — ${sponsor.url}`);
  out.push(c("2", `  estimates from public sources; may be wrong or out of date. review commands before running. ${host}/terms`));
  out.push("");
  return out.join("\n");
}
