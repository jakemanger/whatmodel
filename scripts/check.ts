// npm run check — validates data/*.json and measures how well g predicts held-out results.
// CI runs this on every PR from the update agent; a non-zero exit blocks the merge.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { CATEGORY_IDS, catOf } from "../lib/categories.ts";
import { ICONS, ICON_SIZE, matchesId, pngSize } from "../lib/icons.ts";
import { fit, fromLatent, toCells } from "../lib/score.ts";
import { connectedCells, heldOutPrediction } from "../lib/comparisons.ts";
import { SOURCES, sourceIcon, sourceOf } from "../lib/sources.ts";
import type { Benchmark, Model, Result, Speed } from "../lib/types.ts";
import { TASKS } from "../lib/tasks.ts";
import { catalogueOnly } from "../lib/fit.ts";

const load = <T>(f: string): T => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const models = load<Model[]>("models.json");
const results = load<Result[]>("results.json");
const benches = load<Benchmark[]>("benchmarks.json");
const meta = load<{ updated: string }>("meta.json");
const speeds = load<Speed[]>("speeds.json");
const quant = load<{ findings: { source: string }[]; memory?: { source: string }[] }>("quant.json");
const calibration = load<{ measurements: { source: string }[] }>("speed-calibration.json");
const UNITS = ["image", "video-second", "1M-chars", "audio-minute"];

const errors: string[] = [];
const retired: string[] = []; // no API or weights: kept to anchor the fit, not listed
const noPrice: string[] = []; // API with no published price: never passes a budget filter
const ids = new Set<string>();
for (const m of models) {
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(m.id)) errors.push(`model id not kebab-case: ${m.id}`);
  if (ids.has(m.id)) errors.push(`duplicate model: ${m.id}`);
  ids.add(m.id);
  if (catalogueOnly(m)) retired.push(m.id);
  if (m.availability !== undefined && (m.availability !== "preview" || !/^https?:\/\//.test(m.availability_source ?? "")))
    errors.push(`${m.id}: preview availability needs a reviewed announcement URL`);
  for (const v of m.local?.variants ?? []) {
    if (!v.cmd) errors.push(`${m.id}: variant without a command ${JSON.stringify(v)}`);
    if (!(v.gb > 0) && !m.params_b) errors.push(`${m.id}: variant ${v.quant} needs gb, or params_b on the model to estimate it`);
  }
  if (m.api?.tps !== undefined && (!(m.api.tps > 0) || !/^https?:\/\//.test(m.api.tps_source ?? ""))) errors.push(`${m.id}: api.tps needs a positive number and a tps_source url`);
  if (m.api && (m.api.price_in !== undefined || m.api.price_out !== undefined) &&
      !(Number.isFinite(m.api.price_in) && Number.isFinite(m.api.price_out) && m.api.price_in! >= 0 && m.api.price_out! >= 0))
    errors.push(`${m.id}: token prices must be a complete, finite, nonnegative pair`);
  if (m.api && [m.api.price, m.api.price_in, m.api.price_out].some((p) => p !== undefined) && !m.api.price_source)
    errors.push(`${m.id}: a price requires price_source (a provider link alone is not provenance)`);
  if (m.api?.price !== undefined && !(Number.isFinite(m.api.price) && m.api.price >= 0)) errors.push(`${m.id}: invalid price`);
  if (m.context_k !== undefined && (!m.context_source || !Number.isFinite(m.context_k) || m.context_k <= 0))
    errors.push(`${m.id}: context needs a positive value and reviewed context_source`);
  if (m.api && catOf(m) !== "llm" && m.api.price !== undefined && !UNITS.includes(m.api.unit ?? "")) errors.push(`${m.id}: api price needs a unit (${UNITS.join("|")})`);
  if (m.api && catOf(m) !== "llm" && m.api.price === undefined) noPrice.push(m.id);
  if (m.category && !CATEGORY_IDS.includes(m.category)) errors.push(`${m.id}: unknown category ${m.category}`);
}
for (const x of speeds) {
  if (!ids.has(x.model)) errors.push(`speed for unknown model ${x.model}`);
  if (!(x.value > 0) || !/^https?:\/\//.test(x.source ?? "")) errors.push(`speed ${x.model} on ${x.hardware}: needs a value and source url`);
}
const bench = new Map(benches.map((b) => [b.id, b]));
for (const b of benches) if (b.kind === 'linear' && !(Number.isFinite(b.latent_scale) && b.latent_scale! > 0)) errors.push(`${b.id}: linear metric needs a positive latent_scale`);
for (const b of benches) if (b.direction !== undefined && (b.kind !== 'linear' || !['higher', 'lower'].includes(b.direction))) errors.push(`${b.id}: direction must be higher/lower on a linear metric`);
const taskIds = new Set<string>();
for (const task of TASKS) {
  if (taskIds.has(task.id)) errors.push(`Duplicate task: ${task.id}`);
  taskIds.add(task.id);
  if (!task.benchmarks.length || new Set(task.benchmarks).size !== task.benchmarks.length) errors.push(`${task.id}: empty or duplicate benchmarks`);
  for (const id of task.benchmarks) if (!bench.has(id) || (bench.get(id)?.category ?? 'llm') !== task.category) errors.push(`${task.id}: unknown or wrong-category benchmark ${id}`);
}
for (const r of results) {
  const b = bench.get(r.bench);
  const where = `${r.model}/${r.bench}`;
  if (!ids.has(r.model)) errors.push(`${where}: unknown model`);
  if (!b) errors.push(`${where}: unknown benchmark`);
  if (!/^https?:\/\//.test(r.source ?? "")) errors.push(`${where}: missing source url`);
  if (r.by !== "independent" && r.by !== "lab") errors.push(`${where}: by must be independent|lab`);
  if (b?.kind === "acc" && !(r.score >= 0 && r.score <= 1)) errors.push(`${where}: acc score must be 0-1, got ${r.score}`);
  if (r.invalid !== undefined && !(typeof r.invalid === "string" && r.invalid.length >= 10)) errors.push(`${where}: invalid must explain why the run failed`);
  if (b?.kind === "elo" && !(r.score > 500 && r.score < 3000)) errors.push(`${where}: implausible elo ${r.score}`);
  if (b?.kind === "err" && !(Number.isFinite(r.score) && r.score >= 0)) errors.push(`${where}: error ratio must be finite and nonnegative, got ${r.score}`);
  if (b?.kind === "linear" && !Number.isFinite(r.score)) errors.push(`${where}: linear score must be finite`);
  const m = models.find((x) => x.id === r.model);
  if (b && m && (b.category ?? "llm") !== catOf(m)) errors.push(`${where}: benchmark is for ${b.category ?? "llm"}, model is ${catOf(m)}`);
}

if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(meta.updated)) errors.push(`meta.json: updated must be UTC ISO, e.g. 2026-09-25T05:12:00Z`);
const latest = results.reduce((d, r) => (r.date && r.date > d ? r.date : d), "");
if (meta.updated.slice(0, 10) < latest) errors.push(`meta.json: updated (${meta.updated}) is older than the newest result (${latest})`);
for (const icon of new Set(results.flatMap((r) => (/^https?:\/\//.test(r.source ?? "") ? [sourceIcon(r.source)] : []))))
  if (!existsSync(new URL(`../icons/${icon}.png`, import.meta.url))) errors.push(`no icon for ${icon}: run npm run icons`);

// Maker logos (data/icons.json, see UPDATING.md). A broken entry or missing file is an error; a
// provider without a logo is only a warning.
const iconWarnings: string[] = [];
const iconIds = new Set<string>();
const iconFor = new Map<string, string>(); // provider -> icon id
const AGGREGATORS = /clearbit\.com|google\.com\/s2\/favicons|gstatic\.com\/favicon|icon\.horse|logo\.dev|brandfetch|duckduckgo\.com\/ip3|favicone|faviconkit|flaticon\.com|seeklogo|worldvectorlogo|logos-world|logowik/i;
for (const e of ICONS) {
  const where = `icons.json ${e.id}`;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(e.id ?? "")) errors.push(`${where}: id must be kebab-case`);
  if (iconIds.has(e.id)) errors.push(`${where}: duplicate id`);
  iconIds.add(e.id);
  if (!e.name || !Array.isArray(e.providers)) errors.push(`${where}: needs name and providers`);
  if (!/^https:\/\//.test(e.url ?? "") || !/^https:\/\//.test(e.page ?? "")) errors.push(`${where}: needs an https url and page`);
  if (!/^\d{4}-\d\d-\d\d$/.test(e.retrieved ?? "")) errors.push(`${where}: retrieved must be YYYY-MM-DD`);
  if (AGGREGATORS.test(e.url ?? "")) errors.push(`${where}: ${e.url} is a third-party logo service; use the maker's own site, Hugging Face or GitHub`);
  if (/wikipedia\.org|wikimedia\.org/.test(e.url ?? "") && !e.note) errors.push(`${where}: a Wikipedia logo needs a note saying the maker has no web presence of its own`);
  const file = new URL(`../icons/providers/${e.id}.png`, import.meta.url);
  const size = existsSync(file) ? pngSize(readFileSync(file)) : undefined;
  if (!existsSync(file)) errors.push(`${where}: missing icons/providers/${e.id}.png, run npm run icons -- ${e.id}`);
  else if (size?.width !== ICON_SIZE || size.height !== ICON_SIZE) errors.push(`${where}: icons/providers/${e.id}.png must be a ${ICON_SIZE}x${ICON_SIZE} PNG`);
  for (const p of e.providers ?? []) {
    if (iconFor.has(p)) errors.push(`${where}: provider "${p}" already uses ${iconFor.get(p)}`);
    iconFor.set(p, e.id);
    if (!models.some((m) => m.provider === p)) iconWarnings.push(`${where}: no model has provider "${p}"`);
  }
  for (const [p, patterns] of Object.entries(e.models ?? {}))
    for (const pattern of patterns)
      if (!models.some((m) => m.provider === p && matchesId(pattern, m.id))) iconWarnings.push(`${where}: models["${p}"] "${pattern}" matches no model`);
}
for (const f of readdirSync(new URL("../icons/providers/", import.meta.url)))
  if (!iconIds.has(f.replace(/\.png$/, ""))) errors.push(`icons/providers/${f}: not in data/icons.json`);
const noIcon = [...new Set(models.map((m) => m.provider))].filter((p) => !iconFor.has(p)).sort();
if (noIcon.length) iconWarnings.push(`${noIcon.length} provider(s) without a logo in data/icons.json: ${noIcon.join("; ")}`);

// Reuse gate for benchmark/price/context evidence. Outbound provider and command links
// are not licences for measurements; review numerical sources separately.
for (const s of SOURCES) {
  if (!s.terms_url || !s.license || !s.checked || !s.match.length) errors.push(`sources.json ${s.id}: needs match, license, terms_url, checked`);
  if (s.license_url?.startsWith("/") && !existsSync(new URL(`..${s.license_url}`, import.meta.url)))
    errors.push(`sources.json ${s.id}: missing public licence notice ${s.license_url}`);
}
const cited: [string, string][] = [
  ...results.map((r): [string, string] => [r.source, `result ${r.model}/${r.bench}`]),
  ...speeds.map((x): [string, string] => [x.source, `speed ${x.model} on ${x.hardware}`]),
  ...quant.findings.map((x): [string, string] => [x.source, "quantization finding"]),
  ...(quant.memory ?? []).map((x): [string, string] => [x.source, "memory finding"]),
  ...calibration.measurements.map((x): [string, string] => [x.source, "speed calibration"]),
  ...models.flatMap((m) => [
    ...[m.api?.price_source, m.api?.tps_source, m.api?.speed_source, m.context_source].filter(Boolean).map((u): [string, string] => [u!, `metadata ${m.id}`]),
    ...(m.local?.variants ?? []).filter((v) => !v.gb_estimated).map((v): [string, string] => [v.source ?? "", `measured memory ${m.id}/${v.quant}`]),
  ]),
];
const bad = new Map<string, string[]>();
const resultKeys = new Set<string>();
for (const r of results) {
  const key = `${r.model}|${r.bench}|${r.source}`;
  if (resultKeys.has(key)) errors.push(`duplicate result: ${key}`);
  resultKeys.add(key);
  if (!Number.isFinite(r.score)) errors.push(`non-finite result: ${key}`);
}
for (const [url, what] of cited) {
  const s = /^https?:\/\//.test(url ?? "") ? sourceOf(url) : undefined;
  const why = !s ? `not in sources.json (${url})` : s.verdict !== "allowed" ? `${s.name} is ${s.verdict}: ${s.quote ?? s.terms_url}` : null;
  if (why) bad.set(why, [...(bad.get(why) ?? []), what]);
}
for (const [why, whats] of bad) errors.push(`${whats.length} item(s) from a source we can't use: ${why}\n      e.g. ${whats.slice(0, 3).join(", ")}`);

// Fast, complete schema/provenance gate for local data work. The default command
// still performs the exhaustive leave-one-out calibration evaluation below.
if (process.argv.includes("--validate-only")) {
  if (iconWarnings.length) console.log(`${iconWarnings.length} icon warning(s):\n  ${iconWarnings.join("\n  ")}`);
  if (errors.length) {
    console.error(`${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`Validated ${models.length} models, ${results.length} results, ${benches.length} benchmarks, ${SOURCES.length} sources and ${ICONS.length} maker logos. Calibration evaluation skipped (--validate-only).`);
  process.exit(0);
}

const warnings: string[] = [...iconWarnings];
const corr = (xy: [number, number][]) => {
  const n = xy.length, mx = xy.reduce((s, [x]) => s + x, 0) / n, my = xy.reduce((s, [, y]) => s + y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of xy) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  return sxy / Math.sqrt(sxx * syy);
};

// One fit per category, as the site does.
for (const cat of CATEGORY_IDS) {
  const ms = models.filter((m) => catOf(m) === cat);
  if (!ms.length) continue;
  const inCat = new Set(ms.map((m) => m.id));
  const groups = connectedCells(toCells(results.filter((r) => inCat.has(r.model)), benches.filter((b) => (b.category ?? "llm") === cat)));
  const fits = groups.map((cells) => fit(cells));
  for (const m of ms) if (!fits.some((f) => f.scores.has(m.id))) warnings.push(`${m.id}: no usable results, won't be ranked`);
  for (const [groupIndex, cells] of groups.entries()) {
    const f = fits[groupIndex];

    // Leave-one-out: hide each result, refit, predict it back.
    const errs = { acc: [] as number[], err: [] as number[], elo: [] as number[], linear: [] as number[] };
    const zs: [number, number][] = [];
    const zsWeighted: [number, number][] = []; // without series whose fitted a sits at the 0.05 floor
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const b = bench.get(c.bench)!;
      const rest = cells.filter((_, j) => j !== i);
      if (rest.filter((x) => x.model === c.model).length === 0) continue;
      const yhat = heldOutPrediction(rest, c.model, c.key);
      if (yhat === undefined) continue;
      const p = f.params.get(c.key)!;
      zs.push([(c.y - p.d) / p.a, (yhat - p.d) / p.a]);
      if (p.a > 0.05 + 1e-9) zsWeighted.push(zs[zs.length - 1]);
      errs[b.kind].push(Math.abs(fromLatent(yhat, b) - fromLatent(c.y, b)) * (b.kind === "elo" || b.kind === "linear" ? 1 : 100));
    }

    console.log(`\n== ${cat} set ${groupIndex + 1}/${groups.length}: ${f.scores.size} scored models, ${cells.length} cells across ${f.params.size} benchmark keys`);
    for (const [k, p] of [...f.params].sort((x, y) => y[1].a - x[1].a))
      console.log(`  ${k.padEnd(34)} n=${String(p.n).padStart(3)}  a=${p.a.toFixed(2).padStart(5)}  noise=${p.sigma.toFixed(2)}`);
    if (zs.length > 2) console.log(`  leave-one-out: r = ${corr(zs).toFixed(3)} (n=${zs.length})`);
    // Dividing by a floor-level a inflates those residuals ~20x, so one such series can swamp r.
    if (zsWeighted.length > 2 && zsWeighted.length < zs.length)
      console.log(`  leave-one-out without floor-weight series (a = 0.05): r = ${corr(zsWeighted).toFixed(3)} (n=${zsWeighted.length})`);
    for (const [kind, values] of Object.entries(errs)) {
      if (!values.length) continue;
      values.sort((a, b) => a - b);
      const digits = kind === 'linear' ? 4 : 1;
      console.log(`    ${kind}: median abs error ${values[values.length >> 1].toFixed(digits)}, p90 ${values[Math.floor(values.length * 0.9)].toFixed(digits)} ${kind === "elo" ? "Elo" : kind === "linear" ? "raw units" : "percentage points"} (n=${values.length})`);
    }
    console.log("  top 5: " + [...f.scores.values()].sort((a, b) => b.g - a.g).slice(0, 5).map((s) => `${s.id} ${s.g.toFixed(0)}`).join(", "));
  }
}

if (noPrice.length) console.log(`\napi without a price: ${noPrice.join(", ")}`);
if (retired.length) console.log(`\nretired (fit only, not listed): ${retired.join(", ")}`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  ` + warnings.join("\n  "));
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
