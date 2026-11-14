// Measures what each local LLM command downloads, from the host's own file listing, so the memory the
// board shows is the real file size rather than parameters × bytes per weight.
//   npm run sizes                  report only: .research/sizes/report.json and a summary
//   npm run sizes -- --write       also record measured sizes in data/models.json
//   npm run sizes -- --only <id>   one model (repeatable)
//   npm run sizes -- --refresh     fetch listings again instead of using .research/sizes/cache
// Hugging Face: /api/models/<repo>/revision/<sha>?blobs=true lists every file with its size, and for GGUF
// and safetensors repos the parameter count and precision. Ollama: the registry manifest lists each layer
// of a tag with its size, and the tag's config states its precision (file_type) and size (model_type).
// The size recorded is the sum of the files the command fetches:
//   llama.cpp -hf repo:TAG   the GGUF file(s) for TAG (every part of a split file), plus the vision
//                            projector llama.cpp downloads with it when the repo has one
//   ollama run name:tag      every layer of the tag (weights, projector, template)
//   MLX, vLLM, SGLang, transformers   the repo's weight files (safetensors, else .bin/.pt/.npz)
// Commands that quantize at load time (bitsandbytes, vLLM --quantization) download more than they hold
// in memory, so they're reported but not written.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadTimeQuant } from "../lib/memory.ts";
import { bitsPerWeight, precisionOf } from "../lib/quant.ts";
import type { Model, Variant } from "../lib/types.ts";

const root = new URL("../", import.meta.url);
const CACHE = new URL(".research/sizes/cache/", root);
const OUT = new URL(".research/sizes/", root);
mkdirSync(CACHE, { recursive: true });
const args = process.argv.slice(2);
const WRITE = args.includes("--write"), REFRESH = args.includes("--refresh");
const ONLY = args.flatMap((a, i) => (args[i - 1] === "--only" ? [a] : []));
const UA = "whatmodel-sizes/1.0 (+https://github.com/jakemanger/whatmodel)";

// One request at a time, a few a second, waiting out rate limits. Listings are cached on disk.
let last = 0;
async function get(url: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string; headers: Headers }> {
  const key = new URL(encodeURIComponent(url).slice(0, 240).replace(/%/g, "_") + ".json", CACHE);
  if (!REFRESH && existsSync(key)) return JSON.parse(readFileSync(key, "utf8"));
  for (let attempt = 0; ; attempt++) {
    const slot = Math.max(Date.now(), last + 300);
    last = slot;
    if (slot > Date.now()) await new Promise((r) => setTimeout(r, slot - Date.now()));
    let res: Response;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, redirect: "follow", signal: AbortSignal.timeout(30_000) });
    } catch (e) {
      if (attempt < 4) { await new Promise((r) => setTimeout(r, 5000 * (attempt + 1))); continue; }
      return { status: 0, body: String(e), headers: new Headers() };
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const after = Number(res.headers.get("retry-after")) || 30 * (attempt + 1);
      console.error(`  ${res.status} from ${new URL(url).host}, waiting ${after}s`);
      await new Promise((r) => setTimeout(r, after * 1000));
      continue;
    }
    const out = { status: res.status, body: await res.text(), headers: res.headers };
    const saved: Record<string, string> = {};
    res.headers.forEach((value, name) => { saved[name] = value; });
    if (res.status === 200 || res.status === 404 || res.status === 401) writeFileSync(key, JSON.stringify({ ...out, headers: saved }));
    return out;
  }
}

type File = { name: string; size: number };
type HfRepo = { sha: string; files: File[]; params?: number; dtypes?: Record<string, number>; gated?: unknown };
const hfRepos = new Map<string, Promise<HfRepo | string>>();
function hfRepo(repo: string, rev = "main"): Promise<HfRepo | string> {
  const key = `${repo}@${rev}`;
  if (!hfRepos.has(key)) hfRepos.set(key, (async () => {
    const r = await get(`https://huggingface.co/api/models/${repo}/revision/${rev}?blobs=true`);
    if (r.status !== 200) return `Hugging Face ${r.status} for ${repo}`;
    const j = JSON.parse(r.body);
    return {
      sha: j.sha,
      files: (j.siblings ?? []).map((s: { rfilename: string; size?: number; lfs?: { size: number } }) => ({ name: s.rfilename, size: s.lfs?.size ?? s.size ?? 0 })),
      params: j.gguf?.total ?? j.safetensors?.total,
      dtypes: j.safetensors?.parameters,
      gated: j.gated,
    };
  })());
  return hfRepos.get(key)!;
}

// The GGUF files llama.cpp fetches for a tag: Hugging Face's manifest endpoint names the file (and the
// projector) the way llama.cpp asks for them; a split file's other parts follow its name.
const SHARD = /-(\d{5})-of-(\d{5})\.gguf$/i;
async function ggufFiles(repo: string, tag: string | undefined, info: HfRepo, exact?: string): Promise<{ files: File[]; projector?: File } | string> {
  const ggufs = info.files.filter((f) => f.name.toLowerCase().endsWith(".gguf"));
  const weights = ggufs.filter((f) => !/mmproj/i.test(f.name));
  const projectors = ggufs.filter((f) => /mmproj/i.test(f.name));
  let first: string | undefined, projector: string | undefined;
  // -hff names the file itself; llama.cpp then fetches only that file (and the rest of a split one).
  if (exact) first = weights.find((f) => f.name === exact)?.name;
  if (exact && !first) return `${exact} isn't in the listing of ${repo}`;
  const r = exact ? { status: 0, body: "" } : await get(`https://huggingface.co/v2/${repo}/manifests/${tag ?? "latest"}`, { "User-Agent": "llama-cpp", Accept: "application/json" });
  if (r.status === 200) {
    const j = JSON.parse(r.body);
    first = j.ggufFile?.rfilename;
    projector = j.mmprojFile?.rfilename;
  }
  if (!first && tag) {
    // Fall back to matching the tag in file and folder names, as llama.cpp's own resolver does.
    const t = tag.toLowerCase();
    const hits = weights.filter((f) => {
      const n = f.name.toLowerCase().replace(SHARD, ".gguf");
      const base = n.split("/").pop()!.replace(/\.gguf$/, "");
      return base === t || base.endsWith(`-${t}`) || base.endsWith(`.${t}`) || base.endsWith(`_${t}`) || n.split("/").slice(0, -1).includes(t);
    });
    const stems = [...new Set(hits.map((f) => f.name.replace(SHARD, "")))];
    if (stems.length === 1) first = hits[0].name;
    else if (stems.length > 1) return `tag ${tag} matches ${stems.length} files in ${repo}: ${stems.slice(0, 3).join(", ")}`;
  }
  if (!first) return `no GGUF for tag ${tag ?? "(default)"} in ${repo}`;
  const shard = SHARD.exec(first);
  const files = shard
    ? weights.filter((f) => f.name.replace(SHARD, "") === first!.replace(SHARD, "") && SHARD.exec(f.name)?.[2] === shard[2])
    : weights.filter((f) => f.name === first);
  if (!files.length) return `manifest names ${first}, which isn't in the listing of ${repo}`;
  if (shard && files.length !== Number(shard[2])) return `${first}: ${files.length} of ${Number(shard[2])} parts listed`;
  return { files, projector: projector ? projectors.find((f) => f.name === projector) : undefined };
}

// The weight files a Python runtime downloads from a repo: safetensors at the top level (without the
// consolidated copy Mistral repos also carry), else PyTorch or NumPy weights.
function weightFiles(info: HfRepo, folder = ""): File[] {
  const top = info.files.filter((f) => f.name.startsWith(folder) && !f.name.slice(folder.length).includes("/"));
  const st = top.filter((f) => f.name.endsWith(".safetensors"));
  if (st.length) {
    const sharded = st.filter((f) => !/consolidated/.test(f.name));
    return sharded.length ? sharded : st;
  }
  const pt = top.filter((f) => /\.(bin|pt|pth|npz)$/.test(f.name) && !/training_args|optimizer|scheduler|rng_state/.test(f.name));
  return pt;
}

type Ollama = { files: File[]; fileType?: string; modelType?: string; manifest: string };
async function ollama(ref: string): Promise<Ollama | string> {
  const [path, tag = "latest"] = ref.split(":");
  const name = path.includes("/") ? path : `library/${path}`;
  const manifest = `https://registry.ollama.ai/v2/${name}/manifests/${tag}`;
  const r = await get(manifest, { Accept: "application/vnd.docker.distribution.manifest.v2+json" });
  if (r.status !== 200) return `Ollama registry ${r.status} for ${ref}`;
  const j = JSON.parse(r.body);
  const files = (j.layers ?? []).map((l: { mediaType: string; size: number }) => ({ name: l.mediaType.replace("application/vnd.ollama.image.", ""), size: l.size }));
  const c = await get(`https://registry.ollama.ai/v2/${name}/blobs/${j.config.digest}`);
  const config = c.status === 200 ? JSON.parse(c.body) : {};
  return { files, fileType: config.file_type, modelType: config.model_type, manifest };
}

// Which download a command fetches.
type Target =
  | { kind: "gguf"; repo: string; tag?: string; file?: string }
  | { kind: "ollama"; ref: string }
  | { kind: "repo"; repo: string; rev?: string }
  | { kind: "none"; why: string };
const REPO = String.raw`([A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*)`;
export function targetOf(v: Variant): Target {
  const c = v.cmd;
  let m = new RegExp(String.raw`(?:^|\s)-hf\s+${REPO}(?::([\w.-]+))?`).exec(c);
  if (m) return { kind: "gguf", repo: m[1], tag: m[2], file: /(?:^|\s)-hff\s+(\S+\.gguf)/.exec(c)?.[1] };
  m = /ollama (?:run|pull) hf\.co\/([\w.-]+\/[\w.-]+)(?::([\w.-]+))?/.exec(c);
  if (m) return { kind: "gguf", repo: m[1], tag: m[2] };
  m = /ollama (?:run|pull) (\S+)/.exec(c);
  if (m) return { kind: "ollama", ref: m[1] };
  if (/git clone/.test(c) && !/hf download|huggingface-cli download|snapshot_download/.test(c)) return { kind: "none", why: "installer fetches its own files" };
  for (const re of [
    new RegExp(String.raw`(?:mlx_lm[.\w]*|mlx_vlm[.\w]*|mlx-lm)\b[^&|;]*?--model\s+${REPO}`),
    new RegExp(String.raw`vllm serve\s+(?:--model\s+)?${REPO}`),
    new RegExp(String.raw`--model(?:-path)?[ =]${REPO}`),
    new RegExp(String.raw`(?:hf|huggingface-cli) download\s+${REPO}`),
    new RegExp(String.raw`snapshot_download\(\s*(?:repo_id=)?['"]${REPO}['"]`),
    new RegExp(String.raw`from_pretrained\(\s*['"]${REPO}['"]`),
    new RegExp(String.raw`model\s*=\s*['"]${REPO}['"]`),
    new RegExp(String.raw`\b[a-z_]\w*\s*=\s*['"]${REPO}['"]`),
  ]) {
    m = re.exec(c);
    if (m && !/^(https?|git|github\.com)/.test(m[1])) return { kind: "repo", repo: m[1], rev: /revision[ =]['"]?([\w.-]+)/.exec(c)?.[1] };
  }
  return { kind: "none", why: "no download named in the command" };
}


type Row = {
  model: string; quant: string; cmd: string; target: string; recorded: number; estimated: boolean;
  measured?: number; projector_gb?: number; ratio?: number; params_b?: number; bpw?: number;
  listing_params_b?: number; file_type?: string; model_type?: string; dtypes?: Record<string, number>;
  files?: string[]; size_source?: string; load_time_quant?: boolean; error?: string;
};

const models = JSON.parse(readFileSync(new URL("data/models.json", root), "utf8")) as Model[];
const rows: Row[] = [];
const gb = (bytes: number) => (bytes < 1e10 ? Math.round(bytes / 1e7) / 100 : Math.round(bytes / 1e8) / 10);
let done = 0;
const todo = models.filter((m) => (m.category ?? "llm") === "llm" && m.local?.variants.length && (!ONLY.length || ONLY.includes(m.id)));
const total = todo.reduce((t, m) => t + m.local!.variants.length, 0);
// Four downloads at a time; get() still spaces requests out.
const jobs = todo.flatMap((m) => m.local!.variants.map((v) => ({ m, v })));
const rowsByJob = new Map<number, Row>();
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < jobs.length) {
    const i = next++;
    const row = await measure(jobs[i].m, jobs[i].v);
    rowsByJob.set(i, row);
    if (++done % 100 === 0) console.error(`${done}/${total}`);
  }
}));
rows.push(...jobs.map((_, i) => rowsByJob.get(i)!));

async function measure(m: Model, v: Variant): Promise<Row> {
    const t = targetOf(v);
    const row: Row = { model: m.id, quant: v.quant, cmd: v.cmd.slice(0, 160), target: t.kind === "none" ? `none: ${t.why}` : t.kind === "ollama" ? `ollama ${t.ref}` : `${t.kind} ${t.repo}${"tag" in t && t.tag ? `:${t.tag}` : ""}`, recorded: v.gb, estimated: !!v.gb_estimated, params_b: m.params_b ?? undefined };
    if (v.needs) { row.error = "split download: requirements come from its runtime"; return row; }
    if (t.kind === "none") { row.error = t.why; return row; }
    if (t.kind === "ollama") {
      const o = await ollama(t.ref);
      if (typeof o === "string") { row.error = o; return row; }
      const bytes = o.files.reduce((s, f) => s + f.size, 0);
      Object.assign(row, { measured: gb(bytes), projector_gb: gb(o.files.filter((f) => f.name === "projector").reduce((s, f) => s + f.size, 0)) || undefined, file_type: o.fileType, model_type: o.modelType, files: o.files.map((f) => `${f.name} ${gb(f.size)}`), size_source: o.manifest });
    } else {
      const info = await hfRepo(t.repo, t.kind === "repo" ? t.rev : undefined);
      if (typeof info === "string") { row.error = info; return row; }
      const listing = `https://huggingface.co/api/models/${t.repo}/revision/${info.sha}?blobs=true`;
      let files: File[], projector: File | undefined;
      if (t.kind === "gguf") {
        const g = await ggufFiles(t.repo, t.tag, info, t.file);
        if (typeof g === "string") { row.error = g; return row; }
        ({ files, projector } = g);
      } else {
        files = weightFiles(info);
        if (!files.length) { row.error = `no weight files at the top of ${t.repo}`; return row; }
      }
      const bytes = files.reduce((s, f) => s + f.size, 0) + (projector?.size ?? 0);
      Object.assign(row, {
        measured: gb(bytes), projector_gb: projector ? gb(projector.size) : undefined,
        listing_params_b: info.params ? Math.round(info.params / 1e8) / 10 : undefined, dtypes: info.dtypes,
        files: [...files, ...(projector ? [projector] : [])].map((f) => `${f.name} ${gb(f.size)}`), size_source: listing,
      });
    }
    if (loadTimeQuant(v)) row.load_time_quant = true;
    if (row.measured !== undefined) {
      row.ratio = Math.round((row.measured / v.gb) * 100) / 100;
      if (m.params_b) row.bpw = Math.round(((row.measured - (row.projector_gb ?? 0)) * 8 / m.params_b) * 100) / 100;
    }
    return row;
}

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL("report.json", OUT), JSON.stringify(rows, null, 1));
const ok = rows.filter((r) => r.measured !== undefined);
const off = ok.filter((r) => r.ratio! < 0.8 || r.ratio! > 1.25);
console.log(`${rows.length} downloads: ${ok.length} measured, ${rows.length - ok.length} not (${[...new Set(rows.filter((r) => r.measured === undefined).map((r) => r.error ?? "".replace(/ for .*| in .*|: .*/, "")))].join("; ")}).`);
console.log(`${off.length} recorded sizes are more than 20% off the measured download.`);
// Ollama states each tag's precision. A name that disagrees, when the file's size also sits nearer the
// precision Ollama states, is wrong (some older tags carry a stale file_type, so the size decides).
const nearer = (r: Row) => {
  const said = bitsPerWeight(r.file_type!), named = bitsPerWeight(r.quant);
  return r.bpw !== undefined && said !== null && named !== null && Math.abs(r.bpw - said) < Math.abs(r.bpw - named);
};
const misnamed = ok.filter((r) => r.file_type && precisionOf(r.file_type) !== null && precisionOf(r.quant) !== "qat" &&
  precisionOf(r.quant) !== precisionOf(r.file_type) && nearer(r));
if (misnamed.length) console.log(`${misnamed.length} Ollama tags hold a different precision than recorded:\n  ${misnamed.map((r) => `${r.model} ${r.quant} → ${r.file_type!.toLowerCase()} (${r.target})`).join("\n  ")}`);

if (WRITE) {
  const byKey = new Map(ok.filter((r) => !r.load_time_quant).map((r) => [`${r.model}|${r.quant}|${r.cmd}`, r]));
  let written = 0, estimated = 0;
  for (const m of models) for (const v of m.local?.variants ?? []) {
    if (ONLY.length && !ONLY.includes(m.id)) continue;
    const r = byKey.get(`${m.id}|${v.quant}|${v.cmd.slice(0, 160)}`);
    if (r) {
      v.gb = r.measured!;
      delete v.gb_estimated;
      v.size_source = r.size_source;
      written++;
    } else if ((m.category ?? "llm") === "llm" && v.gb_estimated && m.params_b && !v.needs) {
      // No listing: estimate again with the bits per weight downloads of this precision really take.
      const bpw = bitsPerWeight(v.quant);
      if (bpw) { v.gb = Math.round(m.params_b * bpw / 8 * 10) / 10; estimated++; }
    }
  }
  writeFileSync(new URL("data/models.json", root), JSON.stringify(models, null, 2) + "\n");
  console.log(`Wrote ${written} measured sizes and ${estimated} re-estimated ones to data/models.json.`);
}
