// Public snapshots of the reviewed data, written to --out (default dist/data). The site
// runs this before a build to serve them at /data. Research drafts, cached pages and
// private filesystem paths are never exported.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sourceOf } from "../lib/sources.ts";
import { csvTables } from "../lib/csv.ts";

const files = ["models", "results", "benchmarks", "sources", "speeds", "quant", "provenance", "meta", "api-speed", "bench"];
const load = (name: string) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
const data = Object.fromEntries(files.map((name) => [name, load(name)]));
const requireSource = (url: string | undefined) => {
  if (!url || sourceOf(url)?.verdict !== "allowed") throw new Error(`Unreviewed numeric source: ${url ?? "missing"}`);
};
for (const row of [...data.results, ...data.speeds, ...data.quant.findings, ...data.quant.memory]) requireSource(row.source);
for (const model of data.models) {
  if (model.api && [model.api.price, model.api.price_in, model.api.price_out].some((v) => v !== undefined)) requireSource(model.api.price_source);
  if (model.context_k !== undefined) requireSource(model.context_source);
}

const outArg = process.argv.indexOf("--out");
const publicPath = outArg > 0 ? pathToFileURL(resolve(process.argv[outArg + 1]) + "/") : new URL("../dist/data/", import.meta.url);
const extractsPath = new URL("../data/extracts/", import.meta.url);
mkdirSync(publicPath, { recursive: true });
const clean = (value: unknown): unknown => {
  if (typeof value === "string" && /^\/(?:private|tmp|Users)\//.test(value)) return undefined;
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).flatMap(([k, v]) => {
    const c = clean(v); return c === undefined ? [] : [[k, c]];
  }));
  return value;
};
const extra = readdirSync(extractsPath).filter((f) => f.endsWith(".json") && !files.includes(f.slice(0, -5)));
for (const file of extra) data[file.slice(0, -5)] = JSON.parse(readFileSync(new URL(file, extractsPath), "utf8"));
const exported = [...files, ...extra.map((f) => f.slice(0, -5))];
const write = (file: string, text: string) => {
  writeFileSync(new URL(file, publicPath), text);
  return { file, bytes: Buffer.byteLength(text), sha256: createHash("sha256").update(text).digest("hex") };
};
const csv = Object.entries(csvTables(data.bench));
const manifest = [
  ...exported.map((name) => write(`${name}.json`, JSON.stringify(clean(data[name]), null, 2) + "\n")),
  ...csv.map(([file, text]) => write(file, text)),
];
writeFileSync(new URL("manifest.json", publicPath), JSON.stringify({
  updated: data.meta.updated,
  license: "CC-BY-SA-4.0",
  license_url: "https://creativecommons.org/licenses/by-sa/4.0/",
  attribution: "whatmodel.sh / Merlinsbeard Pty Ltd. Underlying source licences and full notices in sources.json also apply. No endorsement; provided as-is.",
  changes: "Selected model configurations, identifier mapping, transcription, unit conversions and documented aggregations. Derived leaderboard scores are calculated separately.",
  files: manifest,
}, null, 2) + "\n");
console.log(`Exported ${exported.length} reviewed data files, ${csv.length} CSV tables and manifest.`);
