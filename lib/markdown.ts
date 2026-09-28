// The whatmodel.sh pages as GitHub markdown, rendered from the same views the site uses
// (lib/views.ts). scripts/pages.ts writes them into README.md and pages/.
import { posix } from "node:path";
import { CATEGORIES, CATEGORY_IDS, catOf, priceOf } from "./categories.ts";
import { chartsFor, chartToText } from "./chart.ts";
import { sourcesFor, updated, updatedLabel, type SourceSummary } from "./data.ts";
import type { Row } from "./fit.ts";
import { contextLabel, curlFor, detect, price, speedLabel, whereLabel } from "./format.ts";
import { sourceIcon, sourceName, sourceOf } from "./sources.ts";
import type { Category, Model } from "./types.ts";
import { benchName, boardView, methodView, modelView, pageModels, resultLabel, shareBar, type BoardView, type ModelView } from "./views.ts";

const SITE = "https://whatmodel.sh";

// Where each page lives in the repo. README.md is the LLM leaderboard, like the site's home page.
export const files = {
  board: (c: Category) => (c === "llm" ? "README.md" : `pages/${c}.md`),
  model: (id: string) => `pages/model/${id}.md`,
  method: "pages/method.md",
};
const rel = (from: string, to: string) => posix.relative(posix.dirname(from), to) || posix.basename(to);

// Markdown text, table cells and HTML attributes each need their own escaping.
const text = (s: string | null | undefined) => (s ?? "").replace(/([\\`*_[\]<>|])/g, "\\$1");
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const code = (s: string) => (s.includes("`") ? `\`\` ${s} \`\`` : `\`${s}\``);
const table = (head: string[], align: string[], rows: string[][]) =>
  [`| ${head.join(" | ")} |`, `|${align.map((a) => (a === "r" ? "---:" : "---")).join("|")}|`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
const shortName = (name: string) => name.split(/ — |, /)[0];
const icon = (from: string, file: string, alt: string, title = alt) =>
  `<img src="${rel(from, `icons/${file}.png`)}" width="14" alt="${attr(alt)}"${title !== alt ? ` title="${attr(title)}"` : ""}>`;
// Site paths such as /licenses/x.txt become repo paths; other URLs stay as they are.
const href = (from: string, url: string) => (url.startsWith("/") ? rel(from, url.slice(1)) : url);
const pl = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

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

// The sources with the most influence on a model's score, each linking to its rows on the model page.
function sourceIcons(from: string, id: string, sources: SourceSummary[], limit = 4) {
  const page = rel(from, files.model(id));
  const icons = sources.slice(0, limit).map((s) =>
    `<a href="${page}#${s.id}">${icon(from, s.icon, `${shortName(s.name)}${s.lab ? " (lab)" : ""} ${Math.round(s.share * 100)}%`)}</a>`);
  if (sources.length > limit) icons.push(`[+${sources.length - limit}](${page})`);
  return icons.join(" ");
}

function boardRow(from: string, r: Row, sources: SourceSummary[]) {
  const name = `[${text(r.name)}](${rel(from, files.model(r.id))})${r.quant ? ` · ${text(r.quant)}` : ""} <sub>${text(r.provider)}</sub>`;
  const score = `${Math.round(r.score)} ±${Math.round(r.pm)}${r.thin ? "\\*" : ""}`;
  const ram = r.mem_gb !== null ? `~${r.mem_gb < 10 ? r.mem_gb : Math.round(r.mem_gb)}GB` : "";
  const get = !r.cmd ? "" : r.cmd.startsWith("http") ? `[${new URL(r.cmd).hostname} ↗](${r.cmd})` : code(r.cmd);
  return [String(r.rank), name, score, whereLabel(r), speedLabel(r.speed), ram, ...(r.category === "llm" ? [contextLabel(r.context_k)] : []), get, sourceIcons(from, r.id, sources)];
}

export function boardMarkdown(v: BoardView, sourcesFor: (id: string) => SourceSummary[], intro = ""): string {
  const { cat } = v;
  const from = files.board(cat);
  const path = CATEGORIES[cat].path;
  const llm = cat === "llm";
  const out: string[] = [];
  out.push(`# whatmodel.sh · find the best ${CATEGORIES[cat].title} you can run`);
  if (intro) out.push(intro);
  out.push(nav(from, cat));
  out.push(`updated ${updatedLabel} · ${pl(v.rows.length, "model")} · scores combine ${v.benches} benchmarks · [how it works](${rel(from, files.method)}) · [benchmark your machine](${SITE}/bench) · [interactive version](${SITE}${path})`);
  if (v.sets.length > 1) {
    const sets = v.sets.map((s) => (s.id === v.comparison?.id ? `**${text(s.label)} · ${s.models.length} models**` : `[${text(s.label)} · ${s.models.length} models](${SITE}${path}?set=${encodeURIComponent(s.id)})`));
    out.push(`These studies cover separate model sets. Scores compare models within the selected set only: ${sets.join(" · ")}`);
  }

  out.push(`## For your machine`);
  out.push(`This list shows every model with a way to run it. To see what fits your machine, run the command for your OS, or pick one of the common machines below on the site.`);
  const auto = detect("whatmodel.sh", path);
  out.push(["```sh", `${auto.mac}   # Mac`, `${auto.linux}   # Linux`, `${auto.windows}   # Windows`, "```"].join("\n"));
  out.push(MACHINES.map(([label, q]) => `[${label}](${SITE}${path}?${q})`).join(" · "));
  out.push(`Run ${code(curlFor("whatmodel.sh", path, new URLSearchParams()))} to get this list in your terminal (add \`?format=json\` for agents).`);

  if (!v.rows.length) out.push(`No verified run options in this comparison set yet.${v.comparison ? ` ${modelLinks(from, v.models.filter((m) => v.comparison!.models.includes(m.id)))}` : ""}`);
  else {
    out.push(`## Leaderboard`);
    for (const { title, chart } of chartsFor(v.shown, cat)) {
      const [head, ...lines] = chartToText(title, chart, false);
      out.push(`<details><summary>${attr(head.trim().split("   ")[0])}</summary>\n\n\`\`\`text\n${[head, ...lines].join("\n")}\n\`\`\`\n\n</details>`);
    }
    const head = ["#", "model", "score", "where", "speed", "RAM", ...(llm ? ["context"] : []), "get it", "sources"];
    const align = ["r", "l", "r", "l", "r", "r", ...(llm ? ["r"] : []), "l", "l"];
    out.push(table(head, align, v.shown.map((r) => boardRow(from, r, sourcesFor(r.id)))));
    if (v.hidden > 0) out.push(`\\+ ${v.hidden} more don't fit your machine or budget · [show them](${SITE}${path}?all=1)`);
  }

  const { comparisonOnly, unscored, withoutResults } = v.outside;
  out.push(`${v.rows.length} of ${v.models.length} catalogue models ranked here · [sources and licences](${rel(from, files.method)}#sources)`);
  if (comparisonOnly.length || unscored.length || withoutResults.length) {
    const parts = [
      comparisonOnly.length && `No current run option verified: ${modelLinks(from, comparisonOnly)}`,
      unscored.length && `Raw results, insufficient overlap for an overall score: ${modelLinks(from, unscored)}`,
      withoutResults.length && `No reviewed benchmark results yet: ${withoutResults.map((m) => text(m.name)).join(" · ")}`,
    ].filter(Boolean);
    out.push(`<details><summary>Models outside this leaderboard (${comparisonOnly.length + unscored.length + withoutResults.length} models)</summary>\n\n${parts.join("\n\n")}\n\n</details>`);
  }
  out.push(`\\* new or thinly tested: ranked on too few benchmark results · ~RAM is estimated; full context may need more memory`);
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
    out.push(`${line} · [${new URL(m.api.url).hostname} ↗](${m.api.url})`);
  }
  if (m.api?.price_source) out.push(`[price source](${m.api.price_source}) · ${text(m.api.price_note ?? "")}`);
  if (m.api?.price_note && !m.api.price_source) out.push(text(m.api.price_note));
  if (m.context_source) out.push(`[context specification source](${m.context_source})${m.context_note ? ` · ${text(m.context_note)}` : ""}`);
  return out;
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
    out.push(table(["test", "result", "source and conditions"], ["l", "r", "l"], v.raw.map((r) => [
      benchName(r.bench), resultLabel(r), `[${text(sourceName(r.source))}](${r.source})${r.by === "lab" ? " · lab-reported" : " · independent"}${r.note ? ` · ${text(r.note)}` : ""}`,
    ])));
    if (m.api || m.local?.variants.length) {
      out.push(`## How to run it`);
      out.push(...howToRun(m, cat));
      if (m.local?.variants.length) out.push(["```sh", ...m.local.variants.map((x) => x.cmd), "```"].join("\n"));
    }
    out.push(`[Sources and licences](${rel(from, files.method)}#sources) · [raw data](${rel(from, "data/results.json")}) · [interactive version](${SITE}/model/${m.id})`);
    return out.join("\n\n") + "\n";
  }

  const { score: s, explain: e } = v;
  out.push(`# ${text(m.name)}`);
  const facts = [text(m.provider), m.released && `released ${m.released}`,
    m.params_b && `${m.params_b}B params${m.active_b && m.active_b !== m.params_b ? ` (${m.active_b}B active)` : ""}`,
    m.license ? text(m.license) : !m.open_weights && "closed weights"].filter(Boolean);
  out.push(facts.join(" · "));
  out.push(`**score ${s.g.toFixed(1)}** ±${s.pm.toFixed(1)}`);
  out.push(`${v.place ? `#${v.place} of ${v.total}` : "comparison only: no current run option verified"} · from ${pl(s.n, "benchmark result")} across ${pl(v.sources.length, "source")}${s.n < 3 ? " · \\* thinly tested, treat the rank as provisional" : ""}`);
  if (v.set) out.push(`Score within the [${text(v.set.label)}](${SITE}${CATEGORIES[cat].path}?set=${encodeURIComponent(v.set.id)}) comparison set only.`);

  out.push(`## How the score was worked out`);
  out.push(`Each result below implies a score on its own, after adjusting for how hard that test is and who ran it. The model's score is their weighted average. Tests that separate models cleanly and agree with the other tests weigh more. A small pull toward the middle keeps thinly tested models from swinging too far. [Method](${rel(from, files.method)})`);
  const rows: string[][] = [];
  for (const grp of v.groups) {
    grp.rows.forEach(({ r, g, share, avg }, i) => {
      const src = sourceOf(r.source);
      const who = i === 0
        ? `<a name="${grp.id}"></a>${icon(from, sourceIcon(r.source), sourceName(r.source))} ${text(sourceName(r.source))}${src?.license.startsWith("CC") && src.license_url ? ` ([${src.license}](${href(from, src.license_url)}))` : ""}`
        : "";
      rows.push([who, `[${text(benchName(r.bench))}](${r.source})${r.by === "lab" ? " lab-reported" : ""}`, resultLabel(r),
        `${g.toFixed(1)}${avg > 1 ? " ~" : ""}`, `${shareBar(share)} ${Math.round(share * 100)}%`, r.date ?? ""]);
    });
  }
  rows.push(["prior", "pull toward the middle", "", e.prior.g.toFixed(1), `${shareBar(e.prior.share)} ${Math.round(e.prior.share * 100)}%`, ""]);
  rows.push(["", "**weighted average**", "", `**= ${s.g.toFixed(1)}**`, "", ""]);
  out.push(table(["source", "test", "score", "implies", "weight", "date"], ["l", "l", "r", "r", "l", "l"], rows));
  out.push(`~ averaged with other results for the same test`);
  if (v.unused.length) {
    out.push(`### Not counted (${v.unused.length})`);
    out.push(table(["source", "test", "score", "why"], ["l", "l", "r", "l"], v.unused.map(({ r, why }) => [text(sourceName(r.source)), `[${text(benchName(r.bench))}](${r.source})`, resultLabel(r), why])));
  }

  out.push(`## How to run it`);
  out.push(...howToRun(m, cat));
  if (v.variants.length) {
    out.push(table([`local ${cat === "llm" ? "download" : "version"}`, cat === "llm" ? "size" : "needs", "score", "command"], ["l", "r", "r", "l"], v.variants.map(({ v: x, label, g }) => [
      `${text(label)}${label !== x.quant ? ` ${text(x.quant)}` : ""}${x.platform && x.platform !== "any" ? ` · ${x.platform} only` : ""}`,
      `${x.gb_estimated ? "~" : ""}${x.gb}GB`, g.toFixed(1), code(x.cmd),
    ])));
    out.push(`The score is the published model's; quantized downloads haven't been evaluated separately.`);
  } else out.push(m.api ? "no verified local download listed" : "no current API or local download verified");

  if (v.measured.length) {
    out.push(`## Published speed measurements`);
    out.push(`Reference results for the hardware, engine and settings below. These are not verified speeds of the downloads above or predictions for your machine.`);
    out.push(table(["hardware", "precision", "speed", "engine and settings", "source"], ["l", "l", "r", "l", "l"], v.measured.map((x) => [
      text(x.hardware), `${text(x.quant)}${x.offload && x.offload !== "none" ? ` · ${x.offload} offloaded` : ""}`, `${x.value} ${x.unit}`,
      `${text(x.engine)}${x.settings ? ` · ${text(x.settings)}` : ""}${x.note ? ` · ${text(x.note)}` : ""}`, `[source ↗](${x.source})`,
    ])));
  }

  if (v.quant.length) {
    out.push(`## Quantization evidence`);
    out.push(`How much of the full-precision result a quantized version kept, measured within one study. Rows from the same study share a table and aren't independent. They don't describe every download of that precision.`);
    out.push(table(["precision", "test", "full → quantized", "kept", "source"], ["l", "l", "r", "r", "l"], v.quant.slice(0, 60).map((f) => [
      text(f.quant), text(f.metric), `${+f.full.toPrecision(3)} → ${+f.quant_score.toPrecision(3)}`, `${(f.retention * 100).toFixed(1)}%`, `[source ↗](${f.source})`,
    ])));
    if (v.quant.length > 60) out.push(`${v.quant.length - 60} more in [quant.json](${rel(from, "data/quant.json")})`);
  }

  out.push(`data updated ${updatedLabel} · [interactive version](${SITE}/model/${m.id}) · [JSON](${SITE}/api?format=json&all=1)`);
  return out.join("\n\n") + "\n";
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
  out.push(table(["benchmark", "results", "weight (a)", "noise"], ["l", "r", "r", "r"], params.map((p) => [
    `${p.benchmark ? `[${text(p.benchmark.name)}](${p.benchmark.url})` : text(p.id)}${p.evaluator ? ` (${p.evaluator === "lab" ? "lab-reported" : text(p.evaluator)})` : ""}`,
    String(p.n), p.a.toFixed(2), p.sigma.toFixed(2),
  ])));
  out.push(`${results} results, each with a source link. Download the [raw results](${rel(from, "data/results.json")}), [benchmark definitions](${rel(from, "data/benchmarks.json")}), or [rankings as JSON](${SITE}/api?format=json&all=1).`);
  out.push(`<a name="sources"></a>\n\n## Sources`);
  out.push(`Benchmark results and API prices use the licensed datasets listed below. Missing coverage is withheld. Sources do not endorse this site. Scores and rankings are our calculations, not the sources' own figures.`);
  out.push(`Our contributions to the numerical data compilation, adaptations and derived scores are [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Source-specific licences and notices remain in force. Changes include model-name mapping, unit conversion, selection of settings and the calculation of relative scores. The [source register](${rel(from, "data/sources.json")}) includes attribution and licence notices. Share-alike extracts in [data/extracts](${rel(from, "data/extracts")}) retain those terms.`);
  out.push(table(["source", "used for", "licence / basis", "checked"], ["l", "l", "l", "l"], sources.map((x) => [
    text(x.name), text(x.kind),
    `${x.license_url ? `[${text(x.license)}](${href(from, x.license_url)})` : text(x.license)}${x.attribution ? ` · ${text(x.attribution)}` : ""} · [terms ↗](${x.terms_url})`,
    x.checked ?? "",
  ])));
  out.push(`data updated ${updatedLabel} · [interactive version](${SITE}/method)`);
  return out.join("\n\n") + "\n";
}

export const generatedNote = `<!-- Generated by \`npm run pages\` from data/ and lib/ (data updated ${updated}). Edit scripts/pages.ts or lib/markdown.ts, not this file. -->`;

// Every page, keyed by its path in the repo. `about` is appended to README.md.
export function renderPages(about: string): Map<string, string> {
  const intro = "The open data, scoring code and bench script behind [whatmodel.sh](https://whatmodel.sh). " +
    "This README is the leaderboard itself, generated from `data/`. [About this repo](#about-this-repo) is below the table.";
  const pages = new Map<string, string>();
  for (const c of CATEGORY_IDS) {
    const md = boardMarkdown(boardView(c, new URLSearchParams()), sourcesFor, c === "llm" ? intro : "");
    pages.set(files.board(c), `${generatedNote}\n\n${md}${c === "llm" ? `\n${about}` : ""}`);
  }
  pages.set(files.method, `${generatedNote}\n\n${methodMarkdown()}`);
  for (const x of pageModels()) pages.set(files.model(x.id), `${generatedNote}\n\n${modelMarkdown(modelView(x.id)!)}`);
  return pages;
}
