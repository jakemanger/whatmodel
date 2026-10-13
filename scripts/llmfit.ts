// Imports llmfit's community benchmarks (github.com/AlexsJones/llmfit, MIT) into data/speeds.json.
//   git clone --depth 1 https://github.com/AlexsJones/llmfit /tmp/llmfit
//   npm run llmfit -- /tmp/llmfit
// Only Ollama runs are used: llmfit times those from Ollama's eval_count / eval_duration (generation
// only, after a warm-up), like our own bench; its other engines divide by wall-clock time, prompt
// included. A run is kept when its Ollama tag is one we list (or that tag with a standard quant
// suffix) and it isn't faster than the GPU's memory bandwidth allows. It counts as measured with our
// exact download, for the board's speed column, only with the listed tag on a GPU we know by name,
// with the whole model in GPU memory. Re-running replaces every earlier llmfit row.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import type { Hardware, Model, Speed } from "../lib/types.ts";

const checkout = process.argv[2];
if (!checkout) throw new Error("Usage: npm run llmfit -- <path to an llmfit checkout>");
const sha = execFileSync("git", ["-C", checkout, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const dir = `${checkout}/llmfit-core/data/community`;
const BLOB = `https://github.com/AlexsJones/llmfit/blob/${sha}/llmfit-core/data/community`;
const SOURCE_ID = "speed-llmfit-community";

type Submission = {
  submittedAtUnix: number; tool: { version: string };
  hardware: { hwClass: string; hardwareName?: string | null; vramGb?: number | null; gpuCount: number; unifiedMemory: boolean; cpu: string; ramGb: number; os: string };
  results: { model: string; provider: string; numRuns: number; avgTps: number; minTps: number; maxTps: number; avgOutputTokens: number }[];
};
const data = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const models = data("models.json") as Model[];
const hardware = data("hardware.json") as Hardware[];

// Our Ollama tags, and the download each names.
const tags = new Map<string, { model: Model; gb: number; quant: string }>();
for (const m of models) for (const v of m.local?.variants ?? []) {
  const t = /^ollama run (\S+)$/.exec(v.cmd)?.[1];
  if (t) tags.set(t, { model: m, gb: v.gb, quant: v.quant });
}
const QUANT = /^(q[2-8](_[0-9a-z]+)*|iq[1-4]\w*|fp16|bf16|f16|mxfp4)$/i;
function resolve(tag: string): { model: Model; quant: string; gb?: number; exact: boolean } | string {
  const t = tag.replace(/:latest$/, "");
  const hit = tags.get(tag) ?? tags.get(t);
  if (hit) return { model: hit.model, quant: hit.quant, gb: hit.gb, exact: true };
  const dash = t.lastIndexOf("-");
  const base = dash > 0 ? tags.get(t.slice(0, dash)) : undefined;
  if (base && QUANT.test(t.slice(dash + 1))) {
    const quant = t.slice(dash + 1);
    return { model: base.model, quant, ...(quant.toLowerCase() === base.quant.toLowerCase() ? { gb: base.gb } : {}), exact: false };
  }
  return "Ollama tag isn't a download we list";
}

// GPUs by the name llmfit reports, compared without vendor prefixes or our "(32-core GPU)"-style
// suffixes. Chips sold in more than one version are told apart by memory size: the VRAM it reports,
// or the RAM on Apple and other unified-memory chips (a 36 GB M4 Max is the 32-core one).
const norm = (s: string) => s.toLowerCase().replace(/\s*\(.*\)$/, "").replace(/^(nvidia |amd |apple |intel )/, "").replace(/^(geforce |radeon )/, "").replace(/\s+/g, " ").trim();
function gpu(name: string | null | undefined, memory: number | null | undefined): Hardware | undefined {
  if (!name) return undefined;
  const n = norm(name);
  const hits = hardware.filter((h) => [h.name, h.smi_name].some((x) => x && norm(x) === n));
  if (hits.length <= 1) return hits[0];
  const bySize = hits.filter((h) => memory && h.memory_gb?.some((g) => Math.abs(g - memory) < 1.5));
  return bySize.length === 1 ? bySize[0] : undefined;
}
const kindOf = (name: string): Speed["kind"] => (/nvidia|geforce|rtx|gtx|tesla/i.test(name) ? "nvidia" : /apple/i.test(name) ? "apple" : /amd|radeon/i.test(name) ? "amd" : /intel|arc/i.test(name) ? "intel" : "cpu");

const files: string[] = [];
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = `${d}/${f}`; if (statSync(p).isDirectory()) walk(p); else if (p.endsWith(".json") && !p.endsWith("schema.json")) files.push(p); } };
walk(dir);

const out: Record<string, unknown>[] = [];
const skipped = new Map<string, number>();
const skip = (why: string) => skipped.set(why, (skipped.get(why) ?? 0) + 1);
for (const file of files.sort()) {
  const rel = file.slice(dir.length + 1), text = readFileSync(file, "utf8");
  const s = JSON.parse(text) as Submission, h = s.hardware;
  for (const r of s.results) {
    if (r.provider !== "ollama") { skip(`${r.provider}: timed by wall clock, prompt included`); continue; }
    const m = resolve(r.model);
    if (typeof m === "string") { skip(m); continue; }
    if (h.gpuCount > 1) { skip("more than one GPU"); continue; }
    if (h.hwClass !== "CPU_ONLY" && /^(amd\/ati|amd gpu|nvidia gpu|gpu)?$/i.test((h.hardwareName ?? "").trim())) { skip("GPU not named"); continue; }
    const cpuOnly = h.hwClass === "CPU_ONLY";
    const hw = cpuOnly ? undefined : gpu(h.hardwareName, h.unifiedMemory || h.hwClass === "UNIFIED" ? h.ramGb : h.vramGb);
    const unified = h.unifiedMemory || h.hwClass === "UNIFIED" || !!hw?.unified || hw?.kind === "apple";
    // Faster than reading the active weights once per token from memory is a bad row.
    const active = m.model.active_b && m.model.params_b ? m.model.active_b / m.model.params_b : 1;
    if (hw && m.gb && r.avgTps > (1.3 * hw.bandwidth_gbs) / (m.gb * active)) { skip("faster than the GPU's memory bandwidth allows"); continue; }
    const offload: Speed["offload"] | undefined = cpuOnly || unified ? "none" : m.gb && h.vramGb ? (m.gb <= h.vramGb * 0.9 ? "none" : "layers") : undefined;
    const ram = `${Math.round(h.ramGb)} GB RAM`;
    const label = cpuOnly ? `${h.cpu} (CPU only), ${ram}` : hw ? `${hw.name}${unified ? `, ${Math.round(h.ramGb)} GB` : ""}` : `${h.hardwareName ?? "Unnamed GPU"}, ${ram}`;
    const eligible = m.exact && !!hw && offload === "none";
    const line = text.split("\n").findIndex((l) => l.includes(`"model": ${JSON.stringify(r.model)}`)) + 1;
    const date = new Date(s.submittedAtUnix * 1000).toISOString().slice(0, 10);
    out.push({
      model: m.model.id, quant: m.quant, hardware: label, ...(hw ? { hardware_id: hw.id } : {}), kind: cpuOnly ? "cpu" : hw?.kind ?? kindOf(h.hardwareName ?? ""),
      ...(offload ? { offload } : {}), value: Math.round(r.avgTps * 100) / 100, unit: "tok/s", engine: "ollama (version not recorded)",
      settings: `llmfit bench ${s.tool.version} via Ollama: a warm-up, then ${r.numRuns} run${r.numRuns === 1 ? "" : "s"} of up to 300 generated tokens (${Math.round(r.avgOutputTokens)} on average); eval_count ÷ eval_duration, generation only`,
      source: `${BLOB}/${rel}${line ? `#L${line}` : ""}`, source_id: SOURCE_ID,
      note: `Community submission to llmfit on ${date} (${h.cpu}, ${ram}, ${h.os}); ${r.minTps}–${r.maxTps} tok/s across runs.${offload === "layers" ? " The download is larger than the GPU's memory, so Ollama ran part of it on the CPU." : ""}`,
      raw_value: String(r.avgTps), generation_tokens: Math.round(r.avgOutputTokens), upstream_model: `ollama ${r.model}`,
      applicability: {
        display_as: eligible ? "measured with the exact download listed on this site" : "community llmfit run with the hardware and Ollama tag it reported",
        selected_download_eligible: eligible, artifact_reference_as_reported: `ollama ${r.model.replace(/:latest$/, "")}`,
      },
    });
  }
}

const speeds = (data("speeds.json") as { source_id?: string }[]).filter((x) => x.source_id !== SOURCE_ID);
writeFileSync(new URL("../data/speeds.json", import.meta.url), JSON.stringify([...speeds, ...out], null, 2) + "\n");
const board = out.filter((x) => (x.applicability as { selected_download_eligible: boolean }).selected_download_eligible).length;
console.log(`llmfit ${sha.slice(0, 8)}: ${out.length} runs added (${board} count for the board), from ${files.length} submissions.`);
for (const [why, n] of [...skipped].sort((a, b) => b[1] - a[1])) console.log(`  skipped ${n}: ${why}`);
