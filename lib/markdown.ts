// The whatmodel.sh pages as GitHub markdown, rendered from the same views the site uses
// (lib/views.ts). scripts/pages.ts writes them into README.md and pages/.
import { posix } from "node:path";
import { CATEGORIES, CATEGORY_IDS, catOf, priceOf } from "./categories.ts";
import { chartsFor, chartToText, scatter, usd } from "./chart.ts";
import { updatedLabel } from "./data.ts";
import { contextLabel, curlFor, detect, displayName, price, speedLabel, whereLabel } from "./format.ts";
import { sourceName, sourceOf } from "./sources.ts";
import type { Category, Model } from "./types.ts";
import { benchName, boardView, methodView, modelView, pageModels, resultLabel, type BoardView, type ModelView } from "./views.ts";

const SITE = "https://whatmodel.sh";

// Where each page lives in the repo. README.md is the LLM leaderboard, like the site's home page.
export const files = {
  board: (c: Category) => (c === "llm" ? "README.md" : `pages/${c}.md`),
  model: (id: string) => `pages/model/${id}.md`,
  method: "pages/method.md",
};
const rel = (from: string, to: string) => posix.relative(posix.dirname(from), to) || posix.basename(to);

// Markdown text, HTML text and HTML attributes each need their own escaping.
const text = (s: string | null | undefined) => (s ?? "").replace(/([\\`*_[\]<>|])/g, "\\$1");
const html = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s: string) => html(s).replace(/"/g, "&quot;");
const code = (s: string) => (s.includes("`") ? `\`\` ${s} \`\`` : `\`${s}\``);
const shortName = (name: string) => name.split(/ — |, | \(/)[0];
// Site paths such as /licenses/x.txt become repo paths; other URLs stay as they are.
const href = (from: string, url: string) => (url.startsWith("/") ? rel(from, url.slice(1)) : url);
const pl = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// Tables are drawn like the site's: monospace, one line per row, columns sized to their contents and long
// text clipped. GitHub keeps links inside <pre>, so names still go to their pages. Columns that are empty
// in every row are left out, and bars go last so a wide glyph can't push other columns out of line.
type Cell = string | { text: string; href?: string; anchor?: string };
type Col = { head: string; right?: boolean; max?: number };
const chars = (s: string) => [...s].length;
const clip = (s: string, max?: number) => (max && chars(s) > max ? [...s].slice(0, max - 1).join("") + "…" : s);
function pre(cols: Col[], rows: Cell[][]) {
  const txt = (c: Cell | undefined) => (c === undefined ? "" : typeof c === "string" ? c : c.text);
  const keep = cols.map((_, i) => rows.some((r) => txt(r[i]).trim() !== ""));
  const width = cols.map((c, i) => Math.max(chars(c.head), ...rows.map((r) => chars(clip(txt(r[i]), c.max)))));
  const line = (cells: Cell[]) => cols.flatMap((c, i) => {
    if (!keep[i]) return [];
    const cell = cells[i] ?? "";
    const t = clip(txt(cell), c.max);
    const pad = " ".repeat(width[i] - chars(t));
    let body = html(t);
    if (typeof cell !== "string" && cell.href) body = `<a href="${attr(cell.href)}">${body}</a>`;
    if (typeof cell !== "string" && cell.anchor) body = `<a name="${attr(cell.anchor)}"></a>${body}`;
    return [c.right ? pad + body : body + pad];
  }).join("  ").trimEnd();
  return `<pre>\n${[line(cols.map((c) => c.head)), ...rows.map(line)].join("\n")}\n</pre>`;
}
const bar = (share: number) => `${String(Math.round(share * 100)).padStart(3)}% ${"▇".repeat(Math.max(1, Math.round(share * 12)))}`;
// A terminal chart as a text block, with its legend moved under the title to keep lines short.
const chartBlock = (title: string, chart: Parameters<typeof chartToText>[1]) => {
  const [head, ...rows] = chartToText(title, chart, false);
  const [name, ...legend] = head.split(/ {3,}/);
  return ["```text", name, ...(legend.length ? [`  ${legend.join("  ")}`] : []), ...rows, "```"].join("\n");
};

const nav = (from: string, cat: Category) =>
  CATEGORY_IDS.map((c) => (c === cat ? `**${c}**` : `[${c}](${rel(from, files.board(c))})`)).join(" · ");
const modelLinks = (from: string, list: Model[]) => list.map((m) => `[${text(m.name)}](${rel(from, files.model(m.id))})`).join(" · ");

// Common machines, for the interactive per-machine lists on the site.
const MACHINES: [string, string][] = [
  ["16GB Mac", "ram=16&gpu=apple"],
  ["32GB Mac", "ram=32&gpu=apple"],
  ["64GB Mac", "ram=64&gpu=apple"],
  ["128GB Mac", "ram=128&gpu=apple"],
  ["12GB graphics card", "ram=32&gpu=card&vram=12"],
  ["24GB graphics card", "ram=64&gpu=card&vram=24"],
  ["16GB, no graphics card", "ram=16&gpu=none"],
];

export function boardMarkdown(v: BoardView, intro = ""): string {
  const { cat } = v;
  const from = files.board(cat);
  const path = CATEGORIES[cat].path;
  const out: string[] = [`# whatmodel.sh · find the best ${CATEGORIES[cat].title} you can run`];
  if (intro) out.push(intro);
  out.push(nav(from, cat));
  out.push(`updated ${updatedLabel} · ${pl(v.rows.length, "model")} · scores combine ${v.benches} benchmarks · [how it works](${rel(from, files.method)}) · [benchmark your machine](${SITE}/bench) · [interactive version](${SITE}${path})`);
  if (v.sets.length > 1) {
    const sets = v.sets.map((s) => (s.id === v.comparison?.id ? `**${text(s.label)} · ${s.models.length} models**` : `[${text(s.label)} · ${s.models.length} models](${SITE}${path}?set=${encodeURIComponent(s.id)})`));
    out.push(`These studies cover separate model sets. Scores compare models within the selected set only: ${sets.join(" · ")}`);
  }

  const auto = detect("whatmodel.sh", path);
  out.push(`Run ${code(auto.mac)} to see what your Mac can run, or ${code(curlFor("whatmodel.sh", path, new URLSearchParams()))} for this list in your terminal.`);
  out.push(`<details><summary>Linux, Windows and common machines</summary>\n\n` +
    ["```sh", `${auto.linux}   # Linux`, `${auto.windows}   # Windows`, "```"].join("\n") +
    `\n\n${MACHINES.map(([label, q]) => `[${label}](${SITE}${path}?${q})`).join(" · ")}\n\n</details>`);

  if (!v.rows.length) out.push(`No verified run options in this comparison set yet.${v.comparison ? ` ${modelLinks(from, v.models.filter((m) => v.comparison!.models.includes(m.id)))}` : ""}`);
  else {
    // A short preview of the price chart, as on the site, with the full charts one click away.
    const priced = v.shown.flatMap((r) => (r.price ? [{ id: r.id, label: r.name, x: r.price, y: r.score, group: r.open_weights ? "open" as const : "closed" as const }] : []));
    const preview = scatter(priced, { xTick: usd, log: true, better: "low", width: 92, height: 5, labelLimit: 3 });
    if (preview) out.push(chartBlock("score vs API price", preview));
    const charts = chartsFor(v.shown, cat, 92);
    if (charts.length) out.push(`<details><summary>Full charts: score vs price and memory</summary>\n\n` +
      charts.map(({ title, chart }) => chartBlock(title, chart)).join("\n\n") + `\n\n</details>`);

    out.push(pre(
      [{ head: "#", right: true }, { head: "model", max: 26 }, { head: "score", right: true }, { head: "where", max: 21 }, { head: "speed", right: true },
        { head: "RAM", right: true }, { head: "context", right: true }, { head: "get it", max: 20 }],
      v.shown.map((r) => [
        String(r.rank),
        { text: displayName(r), href: rel(from, files.model(r.id)) },
        `${Math.round(r.score)}±${Math.round(r.pm)}${r.thin ? "*" : " "}`,
        whereLabel(r),
        speedLabel(r.speed),
        r.mem_gb !== null ? `~${r.mem_gb < 10 ? r.mem_gb : Math.round(r.mem_gb)}GB` : "",
        cat === "llm" ? contextLabel(r.context_k) : "",
        !r.cmd ? "" : r.cmd.startsWith("http") ? { text: hostOf(r.cmd), href: r.cmd } : r.cmd,
      ])));
    if (v.hidden > 0) out.push(`\\+ ${v.hidden} more don't fit your machine or budget · [show them](${SITE}${path}?all=1)`);
  }

  const { comparisonOnly, unscored, withoutResults } = v.outside;
  out.push(`\\* new or thinly tested: ranked on too few benchmark results · ~RAM is estimated; full context may need more memory · ${v.rows.length} of ${v.models.length} catalogue models ranked here · [sources and licences](${rel(from, files.method)}#sources)`);
  if (comparisonOnly.length || unscored.length || withoutResults.length) {
    const parts = [
      comparisonOnly.length && `No current run option verified: ${modelLinks(from, comparisonOnly)}`,
      unscored.length && `Raw results, insufficient overlap for an overall score: ${modelLinks(from, unscored)}`,
      withoutResults.length && `No reviewed benchmark results yet: ${withoutResults.map((m) => text(m.name)).join(" · ")}`,
    ].filter(Boolean);
    out.push(`<details><summary>Models outside this leaderboard (${comparisonOnly.length + unscored.length + withoutResults.length} models)</summary>\n\n${parts.join("\n\n")}\n\n</details>`);
  }
  return out.join("\n\n") + "\n";
}

function howToRun(m: Model, cat: Category) {
  const out: string[] = [];
  if (m.api) {
    const p = priceOf(m.api);
    let line = `api ${m.api.provider ? `(${text(m.api.provider)})` : ""} · ${p === null ? "price unknown" : price(p, cat)}`;
    if (m.api.price_in !== undefined) line += ` blended · $${m.api.price_in} in / $${m.api.price_out} out per 1M tokens`;
    if (m.api.tps) line += ` · ${m.api.tps} tok/s`;
    if (m.api.speed) line += ` · ${m.api.speed} ${m.api.speed_unit}`;
    out.push(`${line} · [${hostOf(m.api.url)}](${m.api.url})`);
  }
  const notes = [
    m.api?.price_note && (m.api.price_source ? `[price source](${m.api.price_source}): ${text(m.api.price_note)}` : text(m.api.price_note)),
    m.context_source && `[context source](${m.context_source})${m.context_note ? `: ${text(m.context_note)}` : ""}`,
  ].filter(Boolean);
  if (notes.length) out.push(`<sub>${notes.join(" · ")}</sub>`);
  return out;
}

// Licences of the sources on a page, once each, as markdown links.
function licences(from: string, urls: string[]) {
  const seen = new Map<string, string>();
  for (const u of urls) {
    const s = sourceOf(u);
    if (s?.license_url && !seen.has(s.id)) seen.set(s.id, `${text(shortName(s.name))} ([${text(s.license)}](${href(from, s.license_url)}))`);
  }
  return seen.size ? `<sub>Licences: ${[...seen.values()].join(" · ")}</sub>` : "";
}

export function modelMarkdown(v: ModelView): string {
  const m = v.model;
  const from = files.model(m.id);
  const cat = catOf(m);
  const crumbs = `[whatmodel.sh](${rel(from, files.board("llm"))})${cat !== "llm" ? ` / [${cat}](${rel(from, files.board(cat))})` : ""} / ${text(m.name)}`;
  const out: string[] = [crumbs];

  if (v.kind === "raw") {
    out.push(`# ${text(m.name)}`);
    out.push(`Published measurements are available, but there is not enough shared evaluation data to calculate a comparable overall score yet.`);
    out.push(pre([{ head: "test", max: 34 }, { head: "result", right: true }, { head: "reported by" }, { head: "source", max: 30 }],
      v.raw.map((r) => [benchName(r.bench), resultLabel(r), r.by === "lab" ? "lab" : "independent", { text: shortName(sourceName(r.source)), href: r.source }])));
    out.push(licences(from, v.raw.map((r) => r.source)));
    if (m.api || m.local?.variants.length) {
      out.push(`## How to run it`);
      out.push(...howToRun(m, cat));
      if (m.local?.variants.length) out.push(["```sh", ...m.local.variants.map((x) => x.cmd), "```"].join("\n"));
    }
    out.push(`[Sources and licences](${rel(from, files.method)}#sources) · [raw data](${rel(from, "data/results.json")}) · [interactive version](${SITE}/model/${m.id})`);
    return out.filter(Boolean).join("\n\n") + "\n";
  }

  const { score: s, explain: e } = v;
  out.push(`# ${text(m.name)}`);
  const facts = [text(m.provider), m.released && `released ${m.released}`,
    m.params_b && `${m.params_b}B params${m.active_b && m.active_b !== m.params_b ? ` (${m.active_b}B active)` : ""}`,
    m.license ? text(m.license) : !m.open_weights && "closed weights"].filter(Boolean);
  out.push(facts.join(" · "));
  out.push(`**score ${s.g.toFixed(1)}** ±${s.pm.toFixed(1)} · ${v.place ? `#${v.place} of ${v.total}` : "comparison only: no current run option verified"} · from ${pl(s.n, "benchmark result")} across ${pl(v.sources.length, "source")}${s.n < 3 ? " · \\* thinly tested, treat the rank as provisional" : ""}`);
  if (v.set) out.push(`Score within the [${text(v.set.label)}](${SITE}${CATEGORIES[cat].path}?set=${encodeURIComponent(v.set.id)}) comparison set only.`);

  out.push(`## How the score was worked out`);
  out.push(`Each result below implies a score on its own, after adjusting for how hard that test is and who ran it. The model's score is their weighted average. Tests that separate models cleanly and agree with the other tests weigh more. A small pull toward the middle keeps thinly tested models from swinging too far. [Method](${rel(from, files.method)})`);
  const rows: Cell[][] = v.groups.flatMap((grp) => grp.rows.map(({ r, g, share, avg }, i) => [
    i === 0 ? { text: shortName(sourceName(r.source)), anchor: grp.id } : "",
    { text: `${benchName(r.bench)}${r.by === "lab" ? " (lab)" : ""}`, href: r.source },
    resultLabel(r), `${g.toFixed(1)}${avg > 1 ? "~" : " "}`, r.date ?? "", bar(share),
  ]));
  rows.push(["prior", "pull toward the middle", "", `${e.prior.g.toFixed(1)} `, "", bar(e.prior.share)]);
  rows.push(["", "weighted average", "", `= ${s.g.toFixed(1)} `, "", ""]);
  out.push(pre([{ head: "source", max: 22 }, { head: "test", max: 30 }, { head: "score", right: true }, { head: "implies", right: true }, { head: "date" }, { head: "weight" }], rows));
  out.push(`<sub>~ averaged with other results for the same test</sub>\n\n${licences(from, v.groups.flatMap((g) => g.rows.map((x) => x.r.source)))}`);
  if (v.unused.length) {
    const why = { untracked: "not a tracked benchmark", "other-source": "another source's result is used", sparse: "too few models have it yet" };
    out.push(`<details><summary>Not counted (${v.unused.length})</summary>\n\n` + pre([{ head: "source", max: 22 }, { head: "test", max: 30 }, { head: "score", right: true }, { head: "why" }],
      v.unused.map(({ r, reason }) => [shortName(sourceName(r.source)), { text: benchName(r.bench), href: r.source }, resultLabel(r), why[reason]])) + `\n\n</details>`);
  }

  out.push(`## How to run it`);
  out.push(...howToRun(m, cat));
  if (v.variants.length) {
    const name = (x: (typeof v.variants)[number]) => `${x.label}${x.label !== x.v.quant ? ` ${x.v.quant}` : ""}${x.v.platform && x.v.platform !== "any" ? ` · ${x.v.platform} only` : ""}`;
    out.push(pre([{ head: cat === "llm" ? "download" : "version", max: 40 }, { head: cat === "llm" ? "size" : "needs", right: true }, { head: "score", right: true }],
      v.variants.map((x) => [name(x), `${x.v.gb_estimated ? "~" : ""}${x.v.gb}GB`, x.g.toFixed(1)])));
    out.push(["```sh", ...v.variants.flatMap((x) => [`# ${name(x)}`, x.v.cmd]), "```"].join("\n"));
    out.push(`<sub>The score is the published model's; quantized downloads haven't been evaluated separately.</sub>`);
  } else out.push(m.api ? "no verified local download listed" : "no current API or local download verified");

  if (v.measured.length) {
    out.push(`## Published speed measurements`);
    out.push(`Reference results for the hardware, engine and settings below. These are not verified speeds of the downloads above or predictions for your machine.`);
    out.push(pre([{ head: "hardware", max: 28 }, { head: "precision", max: 16 }, { head: "speed", right: true }, { head: "engine and settings", max: 34 }],
      v.measured.map((x) => [
        x.hardware.replace(/ \(.*host.*\)$/, ""), `${x.quant}${x.offload && x.offload !== "none" ? ` · ${x.offload} offloaded` : ""}`,
        { text: `${x.value} ${x.unit}`, href: x.source }, `${x.engine}${x.settings ? ` · ${x.settings}` : ""}`,
      ])));
    out.push(`<sub>Each speed links to its source, which has the full settings.</sub>`);
  }

  if (v.quant.length) {
    out.push(`## Quantization evidence`);
    out.push(`How much of the full-precision result a quantized version kept, measured within one study. Rows from the same study share a table and aren't independent. They don't describe every download of that precision.`);
    out.push(pre([{ head: "precision", max: 30 }, { head: "test", max: 34 }, { head: "full → quantized", right: true }, { head: "kept", right: true }],
      v.quant.slice(0, 60).map((f) => [
        f.quant ?? "", f.metric ?? "", `${+f.full.toPrecision(3)} → ${+f.quant_score.toPrecision(3)}`, { text: `${(f.retention * 100).toFixed(1)}%`, href: f.source },
      ])));
    out.push(`<sub>Each kept value links to its source.</sub>`);
    if (v.quant.length > 60) out.push(`${v.quant.length - 60} more in [quant.json](${rel(from, "data/quant.json")})`);
  }

  out.push(`[interactive version](${SITE}/model/${m.id}) · [JSON](${SITE}/api?format=json&all=1)`);
  return out.filter(Boolean).join("\n\n") + "\n";
}

export function methodMarkdown(): string {
  const from = files.method;
  const { params, results, sources } = methodView();
  const out: string[] = [`[whatmodel.sh](${rel(from, files.board("llm"))}) / method`, `# How the score is calculated`];
  out.push(`Every model with enough reviewed data gets one number, its **score**. It is fit across every benchmark result we have, the way psychometrics fits one general ability from many tests:`);
  out.push("```text\nresult[model, test] ≈ a[test] · score[model] + d[test]\n```");
  out.push([
    "Bounded scores use a logit scale after removing any stated chance rate. Error ratios use −log(error + 0.005), preserving errors above 100% caused by insertions. Ratings use a linear transformation. Stored raw values are unchanged.",
    "**d** is how hard a benchmark is. This adjustment is approximate and depends on overlap between models.",
    "**a** is how well a benchmark separates strong models from weak ones. Saturated benchmarks count for less.",
    "Each source's version of a benchmark gets its own a and d when at least three models were tested. Sparser series remain visible as raw evidence and do not enter the overall score. Lab-reported results are labelled.",
    "Models with few results are pulled toward the middle and get a wider **±**.",
    "Scores are scaled to mean 50, sd 15 within a connected comparison set. Disconnected studies cannot establish a common ranking, so their sets are selectable separately. It's a relative score, so it shifts as new models arrive.",
    "± is uncertainty within this statistical model, not a guarantee of real-world performance or a validated confidence interval.",
    "Related benchmarks can share tasks or biases. A high held-out correlation does not establish independent validation.",
  ].map((l) => `- ${l}`).join("\n"));
  out.push(`## Running models locally`);
  out.push(`RAM is a rough estimate from parameter count, precision and runtime headroom, not a measured peak. Actual use depends on the engine, batch size, context and KV cache. A listed context window is the provider ceiling; the RAM estimate does not promise that the full window fits on your machine.`);
  out.push(`Scores describe the published model evaluation. A quantized download may perform differently; we currently apply no numeric quantization penalty. Unknown prices and speeds are left blank or marked unknown. Unknown prices never pass a finite budget filter. API prices use base token rates blended three input tokens to one output token; check the provider for tiers and surcharges.`);
  out.push(`Model pages include sourced reference speed measurements with their hardware, engine, precision and workload. They are not automatically assigned to another download or machine. The main speed column stays blank when no matching measurement is verified; bandwidth predictions remain disabled.`);
  out.push(`API speeds are our own measurements: we stream a fixed prompt to each model three times, pinned to the provider whose price we list, and publish the raw runs in [api-speed.json](${rel(from, "data/api-speed.json")}). You can add local speeds for your own machine with the [bench script](${rel(from, "bench.sh")}); submissions are checked and reviewed before they appear.`);
  out.push(`## Benchmarks`);
  out.push(`${results} results, each with a source link. Download the [raw results](${rel(from, "data/results.json")}), [benchmark definitions](${rel(from, "data/benchmarks.json")}), or [rankings as JSON](${SITE}/api?format=json&all=1).`);
  out.push(pre([{ head: "benchmark", max: 56 }, { head: "results", right: true }, { head: "weight (a)", right: true }, { head: "noise", right: true }],
    params.map((p) => [
      { text: `${p.benchmark?.name ?? p.id}${p.evaluator ? ` (${p.evaluator === "lab" ? "lab-reported" : p.evaluator})` : ""}`, href: p.benchmark?.url ?? "" },
      String(p.n), p.a.toFixed(2), p.sigma.toFixed(2),
    ])));
  out.push(`<a name="sources"></a>\n\n## Sources`);
  out.push(`Benchmark results and API prices use the licensed datasets listed below. Missing coverage is withheld. Sources do not endorse this site. Scores and rankings are our calculations, not the sources' own figures.`);
  out.push(`Our contributions to the numerical data compilation, adaptations and derived scores are [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Source-specific licences and notices remain in force. Changes include model-name mapping, unit conversion, selection of settings and the calculation of relative scores. The [source register](${rel(from, "data/sources.json")}) includes attribution and licence notices. Share-alike extracts in [data/extracts](${rel(from, "data/extracts")}) retain those terms.`);
  out.push(sources.map((x) => `- **${text(x.name)}** · ${text(x.kind)} · ${x.license_url ? `[${text(x.license)}](${href(from, x.license_url)})` : text(x.license)} · [terms](${x.terms_url})${x.checked ? ` · checked ${x.checked}` : ""}${x.attribution ? `  \n  <sub>${text(x.attribution)}</sub>` : ""}`).join("\n"));
  out.push(`[interactive version](${SITE}/method)`);
  return out.join("\n\n") + "\n";
}

export const generatedNote = `<!-- Generated by \`npm run pages\` from data/ and lib/. Edit scripts/pages.ts or lib/markdown.ts, not this file. -->`;

// Every page, keyed by its path in the repo. `about` is appended to README.md.
export function renderPages(about: string): Map<string, string> {
  const intro = "The open data, scoring code and bench script behind [whatmodel.sh](https://whatmodel.sh). " +
    "This README is the leaderboard itself, generated from `data/`. [About this repo](#about-this-repo) is below the table.";
  const pages = new Map<string, string>();
  for (const c of CATEGORY_IDS) {
    const md = boardMarkdown(boardView(c, new URLSearchParams()), c === "llm" ? intro : "");
    pages.set(files.board(c), `${generatedNote}\n\n${md}${c === "llm" ? `\n${about}` : ""}`);
  }
  pages.set(files.method, `${generatedNote}\n\n${methodMarkdown()}`);
  for (const x of pageModels()) pages.set(files.model(x.id), `${generatedNote}\n\n${modelMarkdown(modelView(x.id)!)}`);
  return pages;
}
