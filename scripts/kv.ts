// Imports each model's KV cache size from Local Model Explorer's snapshot of GGUF headers
// (huggingface.co/spaces/codelion/local-model-explorer, MIT) into data/kv.json, which lib/fit.ts
// uses for the memory a download needs.
//   npm run kv          the snapshot at REVISION; change it to pick up a newer one
// A model matches by its model_repo, or by a GGUF repo in its llama.cpp commands. Per model it keeps
// the f16 KV bytes per token summed over full-attention layers, the same summed per sliding window,
// and the vocabulary size (for llama.cpp's logits buffer).
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import type { Kv, Model } from "../lib/types.ts";

const REVISION = "405c793036543e306be10de31b8187d067cdc149";
const FILE = "data/geometry_snapshot.json.gz";
const SPACE = "https://huggingface.co/spaces/codelion/local-model-explorer";
type Geometry = { kv_layers?: [number, number | null][]; n_vocab?: number; notes?: string[]; _from?: string };

const res = await fetch(`${SPACE}/resolve/${REVISION}/${FILE}`);
if (!res.ok) throw new Error(`${res.status} fetching the geometry snapshot`);
const geometry = JSON.parse(gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8")) as Record<string, Geometry>;

const byRepo = new Map(Object.keys(geometry).map((k) => [k.toLowerCase(), k]));
const byGguf = new Map<string, string>();
for (const [k, g] of Object.entries(geometry)) {
  const repo = g._from?.split("/").slice(0, 2).join("/").toLowerCase();
  if (repo && !byGguf.has(repo)) byGguf.set(repo, k);
}
const repoOf = (url?: string) => url?.replace(/^https:\/\/huggingface\.co\//, "").split("/tree/")[0].replace(/\/$/, "").toLowerCase();
const ggufRepos = (m: Model) => (m.local?.variants ?? []).flatMap((v) => /-hf ([\w.-]+\/[\w.-]+?)(?::|\s|$)/.exec(v.cmd)?.[1].toLowerCase() ?? []);

const models = JSON.parse(readFileSync(new URL("../data/models.json", import.meta.url), "utf8")) as Model[];
const out: Record<string, Kv & { from: string }> = {};
const skipped: string[] = [];
for (const m of models) {
  if ((m.category ?? "llm") !== "llm" || !m.local?.variants.length) continue;
  const key = byRepo.get(repoOf(m.model_repo) ?? "") ?? ggufRepos(m).map((r) => byGguf.get(r)).find(Boolean);
  if (!key) continue;
  const g = geometry[key];
  // Rough geometries the Space guessed from a parameter count, or headers it couldn't read, aren't used.
  if (!g.kv_layers?.length || g.notes?.some((n) => /estimated/.test(n))) { skipped.push(`${m.id} (${key})`); continue; }
  const windows = new Map<number, number>();
  let full = 0;
  for (const [bytes, window] of g.kv_layers) {
    if (window) windows.set(window, (windows.get(window) ?? 0) + bytes);
    else full += bytes;
  }
  out[m.id] = {
    full: Math.round(full),
    ...(windows.size ? { swa: [...windows].map(([w, b]): [number, number] => [Math.round(b), w]) } : {}),
    ...(g.n_vocab ? { vocab: g.n_vocab } : {}),
    from: key,
  };
}

const ids = Object.keys(out).sort();
writeFileSync(new URL("../data/kv.json", import.meta.url), `{\n  "source": "${SPACE}/blob/${REVISION}/${FILE}",\n  "models": {\n${ids.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(out[id])}`).join(",\n")}\n  }\n}\n`);
console.log(`KV cache geometry for ${ids.length} models${skipped.length ? `; skipped ${skipped.length} without a usable header: ${skipped.join(", ")}` : ""}.`);
