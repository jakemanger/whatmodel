// Add bench.py reports that people post as GitHub issues ("Bench results: <machine>") to the dataset.
// Every result for a whatmodel.sh model becomes a CC0 row in data/bench.json; local runs of a download
// this catalogue lists also become speeds in data/speeds.json. The "bench results to a pull request"
// workflow runs it when the maintainer comments /accept on an issue, and the pull request is the review.
//
//   node scripts/bench-import.ts 12 15                                 those issues (needs gh signed in)
//   node scripts/bench-import.ts --file report.json --issue 12 --date 2026-10-08
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LOCAL_ENGINES, median, reportFromText, validateReport, type Report, type ReportResult } from "../lib/bench.ts";
import type { Hardware, Model, Variant } from "../lib/types.ts";

const REPO = "jakemanger/whatmodel";
const dataFile = (name: string) => new URL(`../data/${name}.json`, import.meta.url);
export const load = <T>(name: string): T => JSON.parse(readFileSync(dataFile(name), "utf8"));
const save = (name: string, v: unknown) => writeFileSync(dataFile(name), JSON.stringify(v, null, 2) + "\n");

export function hardwareFor(h: Report["hardware"], hardware: Hardware[]): Hardware | undefined {
  for (const name of [h.gpu, h.chip]) {
    const n = name?.toLowerCase();
    const hw = n && hardware.find((x) => x.name.toLowerCase() === n || (x.smi_name && n.includes(x.smi_name.toLowerCase())));
    if (hw) return hw;
  }
}

// The ollama download a digest belongs to: the registry manifest of one of the model's listed tags.
export type Download = { variant: Variant; label: string; bytes: number | null };
async function manifest(tag: string): Promise<{ sha: string; bytes: number } | null> {
  const [name, version = "latest"] = tag.split(":");
  const path = name.includes("/") ? name : `library/${name}`;
  const res = await fetch(`https://registry.ollama.ai/v2/${path}/manifests/${version}`, {
    headers: { Accept: "application/vnd.docker.distribution.manifest.v2+json" },
  }).catch(() => null);
  if (!res?.ok) return null;
  const body = Buffer.from(await res.arrayBuffer());
  const layers: { mediaType: string; size: number }[] = JSON.parse(body.toString("utf8")).layers ?? [];
  return { sha: createHash("sha256").update(body).digest("hex"), bytes: layers.filter((l) => l.mediaType.endsWith(".model")).reduce((s, l) => s + l.size, 0) };
}
export type Lookup = (tag: string) => Promise<{ sha: string; bytes: number } | null>;

// Which listed download a local result ran, or why it can't be told.
export async function downloadFor(r: ReportResult, m: Model | undefined, lookup: Lookup = manifest): Promise<Download | string> {
  if (!m) return `${r.model} is not a whatmodel.sh model id`;
  const variants = m.local?.variants ?? [];
  if (r.engine === "ollama") {
    if (!r.digest) return "no digest, so the exact download can't be confirmed";
    for (const v of variants) {
      const tag = /^ollama run (\S+)$/.exec(v.cmd)?.[1];
      const got = tag ? await lookup(tag) : null;
      if (got && got.sha === r.digest) return { variant: v, label: `ollama ${tag}`, bytes: got.bytes || null };
    }
    return `digest matches none of the ollama downloads listed for ${m.id} (another tag, a local build or a modified model)`;
  }
  if (r.engine === "llama.cpp" || r.engine === "lm-studio") { // LM Studio runs the same GGUF files
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const file = norm(r.file ?? "");
    for (const v of variants) {
      const hf = /-hf\s+([\w.-]+)\/([\w.-]+?)(?::([\w.-]+))?(\s|$)/.exec(v.cmd);
      if (hf && file.includes(norm(hf[2].replace(/-GGUF$/i, ""))) && hf[3] && file.includes(norm(hf[3]))) return { variant: v, label: r.file!, bytes: v.gb > 0 ? v.gb * 1e9 : null };
    }
    return `file ${r.file ?? "(none)"} matches none of the GGUF downloads listed for ${m.id}`;
  }
  if (r.engine === "mlx-lm") {
    // The report names the Hugging Face repo with "/" written as "--".
    const repo = (r.file ?? "").replace("--", "/").toLowerCase();
    for (const v of variants) {
      const mlx = /mlx_lm[._](?:chat|generate|server)\b.*?--model\s+([\w.-]+\/[\w.-]+)/.exec(v.cmd);
      if (mlx && mlx[1].toLowerCase() === repo) return { variant: v, label: r.file!, bytes: v.gb > 0 ? v.gb * 1e9 : null };
    }
    return `repo ${r.file ?? "(none)"} matches none of the MLX downloads listed for ${m.id}`;
  }
  return "not a local download";
}

// One result with its model, download and machine worked out. `speed` says why it isn't a local speed, if it isn't.
export type Identified = { index: number; result: ReportResult; model?: Model; download?: Download; hardware?: Hardware; gen: number | null; speed: string | null };
export async function identify(report: Report, ctx: { models: Model[]; hardware: Hardware[]; lookup?: Lookup }): Promise<Identified[]> {
  const hw = hardwareFor(report.hardware, ctx.hardware), out: Identified[] = [];
  for (const [index, r] of report.results.entries()) {
    const model = ctx.models.find((x) => x.id === r.model);
    const gen = median(r.samples.map((s) => s.gen_tok_s ?? s.e2e_tok_s).filter((x): x is number => typeof x === "number" && x > 0));
    let download: Download | undefined, speed: string | null = null;
    if (!LOCAL_ENGINES.includes(r.engine)) speed = "an agent or API timing, kept as a run";
    else {
      const d = await downloadFor(r, model, ctx.lookup);
      if (typeof d === "string") speed = d; else download = d;
      if (!hw && !speed) speed = `${report.hardware.gpu || report.hardware.chip} is not in data/hardware.json`;
    }
    out.push({ index, result: r, model, download, hardware: hw, gen, speed });
  }
  return out;
}

export const describe = (h: Report["hardware"]) =>
  [h.chip, h.gpu && `${h.gpu}${h.vram_gb ? ` ${h.vram_gb} GB` : ""}${h.gpus && h.gpus > 1 ? ` ×${h.gpus}` : ""}`, h.ram_gb && `${h.ram_gb} GB RAM`, h.gpu_cores && `${h.gpu_cores} GPU cores`, h.os]
    .filter(Boolean).join(" · ");

export type Source = { label: string; issue: number | null; date: string; text: string };
type Issue = { number: number; title: string; body: string; createdAt: string; url: string; author?: { login: string } };
const gh = (args: string[]) => JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 32 << 20 }));
const fields = "number,title,body,createdAt,url,author";
export const sourceOf = (i: Issue): Source => ({ label: `#${i.number} ${i.createdAt.slice(0, 10)} by ${i.author?.login ?? "?"}  ${i.url}`, issue: i.number, date: i.createdAt.slice(0, 10), text: i.body });
export const issueSource = (n: number) => sourceOf(gh(["issue", "view", String(n), "-R", REPO, "--json", fields]));
// Bench issues are titled "Bench results: <machine>"; older ones "Benchmark measurements".
export const openSources = (): Source[] => ["Bench results", "Benchmark measurements"]
  .flatMap((t) => gh(["issue", "list", "-R", REPO, "--state", "open", "--search", `"${t}" in:title`, "--json", fields, "--limit", "200"]) as Issue[]).map(sourceOf);

// The report in an issue, or why there isn't a usable one.
export function parse(s: Source): Report | string {
  let parsed: unknown;
  try { parsed = reportFromText(s.text); } catch (e) { return (e as Error).message; }
  const v = validateReport(parsed);
  return v.ok ? v.report : `invalid report: ${v.errors.join("; ")}`;
}

// Results become CC0 rows in data/bench.json, and exact local downloads also become speeds. Ids come from
// the issue and the result's place in the report, so importing an issue again replaces its rows.
export function writeRows(items: { source: Source; report: Report; results: Identified[] }[]) {
  const bench = load<Record<string, unknown>[]>("bench"), speeds = load<Record<string, unknown>[]>("speeds");
  let runs = 0, measured = 0;
  for (const { source, report, results } of items) {
    const h = report.hardware, prefix = source.issue ? `gh${source.issue}` : `file-${source.date}`;
    for (const c of results) {
      if (!c.model) continue;
      const r = c.result, id = `${prefix}-${c.index}`, hw = c.hardware;
      const hwLabel = hw ? `${hw.name}${h.gpu_cores ? ` (${h.gpu_cores}-core GPU)` : ""}, ${h.ram_gb} GB${h.vram_gb ? `, ${h.vram_gb} GB VRAM` : ""}` : describe(h);
      const row = {
        id, issue: source.issue, submitted: source.date, schema: report.schema, script_version: report.script_version, hardware: hw?.id ?? null, hardware_label: hwLabel,
        gpus: h.gpus ?? null, os: [h.os, h.arch].filter(Boolean).join(" "), engine: `${r.engine} ${r.engine_version ?? ""}`.trim(), model: c.download?.label ?? null,
        model_id: r.model, digest: r.digest ?? null, quant: r.quant ?? null, bytes: c.download?.bytes ?? null, settings: r.settings ?? null,
        max_output_tokens: report.protocol.max_output_tokens, warmups: report.protocol.warmups, samples: r.samples, tg_median: c.gen,
        pp_median: median(r.samples.map((s) => s.prompt_tok_s)),
      };
      const at = bench.findIndex((b) => b.id === id);
      if (at >= 0) bench[at] = row; else bench.push(row);
      runs++;
      const source_url = `https://whatmodel.sh/data/bench.json#${id}`;
      for (let j = speeds.length - 1; j >= 0; j--) if (speeds[j].source === source_url) speeds.splice(j, 1);
      if (c.speed || !c.download || !hw) continue;
      const offload = hw.kind === "apple" || hw.kind === "cpu" || (c.download.bytes ?? Infinity) / 1e9 < (h.vram_gb ?? 0) * Math.max(1, h.gpus ?? 1) * 0.95 ? "none" : "layers";
      speeds.push({
        model: r.model, quant: c.download.variant.quant, hardware: hwLabel, hardware_id: hw.id, kind: hw.kind,
        offload, value: c.gen, unit: "tok/s", engine: row.engine,
        settings: `whatmodel bench.py ${report.script_version}: fixed prompt, up to ${report.protocol.max_output_tokens} generated tokens, temperature 0, median of ${r.samples.length} runs in shuffled order after ${report.protocol.warmups} discarded warm-up${report.protocol.warmups === 1 ? "" : "s"}`,
        source: source_url, source_id: "whatmodel-bench",
        note: `Community submission${source.issue ? ` (issue #${source.issue})` : ""}, reviewed ${new Date().toISOString().slice(0, 10)}.`,
        applicability: { display_as: "measured with the exact download listed on this site", selected_download_eligible: true, artifact_reference_as_reported: c.download.label, artifact_sha256: r.digest ?? null },
      });
      measured++;
    }
  }
  save("bench", bench);
  save("speeds", speeds);
  return { runs, measured };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flag = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const file = flag("--file"), fileIssue = flag("--issue"), date = flag("--date") ?? new Date().toISOString().slice(0, 10);
  const numbers = args.filter((a) => /^\d+$/.test(a)).map(Number);
  const sources = file ? [{ label: file, issue: fileIssue ? Number(fileIssue) : null, date, text: readFileSync(file, "utf8") }] : numbers.map(issueSource);
  if (!sources.length) { console.log("name the issues to import, e.g. node scripts/bench-import.ts 12 15"); process.exit(1); }
  const ctx = { models: load<Model[]>("models"), hardware: load<Hardware[]>("hardware") };
  const items = [];
  for (const source of sources) {
    const report = parse(source);
    if (typeof report === "string") { console.log(`${source.label}\n  ✗ ${report}`); continue; }
    const results = await identify(report, ctx);
    console.log(`${source.label}\n  ${describe(report.hardware)} · bench.py ${report.script_version}`);
    for (const c of results) {
      const r = c.result, what = `${r.model} · ${`${r.engine} ${r.engine_version ?? ""}`.trim()} · ${c.gen ?? "?"} tok/s`;
      console.log(!c.model ? `  ✗ ${what}: not a whatmodel.sh model id, skipped` : c.speed ? `  · ${what}: run only (${c.speed})` : `  ✓ ${what}: run and speed (${c.download!.label})`);
    }
    items.push({ source, report, results });
  }
  const { runs, measured } = writeRows(items);
  console.log(`\nadded ${runs} run${runs === 1 ? "" : "s"} and ${measured} local speed${measured === 1 ? "" : "s"}`);
}
