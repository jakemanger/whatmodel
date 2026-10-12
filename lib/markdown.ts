// The whatmodel.sh pages as GitHub markdown, rendered from the same views the site uses
// (lib/views.ts). scripts/pages.ts writes them into README.md and pages/.
import { posix } from "node:path";
import { CATEGORIES, CATEGORY_IDS, catOf, priceOf } from "./categories.ts";
import { chartsFor, chartToText, scatter, usd } from "./chart.ts";
import { results, updatedLabel } from "./data.ts";
import { hasScore } from "./fit.ts";
import { contextLabel, curlFor, detect, displayName, price, speedLabel, whereLabel } from "./format.ts";
import { sourceName, sourceOf } from "./sources.ts";
import type { Category, Model, Variant } from "./types.ts";
import { benchName, boardView, methodView, modelView, pageModels, resultLabel, type BoardView, type ModelView } from "./views.ts";
import { strengths, type Strengths, type TestRow } from "./strengths.ts";
import { primary, runGuide, versionLabel } from "./runtimes.ts";
import { benchCatalogue } from "./bench-catalogue.ts";

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

// Short API host for the table: "docs.anthropic.com" -> "anthropic.com".
const apiHost = (url: string) => hostOf(url).replace(/^(platform|docs|developers|api-docs|console|cloud|build|ai)\./, "");
function boardTable(from: string, cat: Category, rows: BoardView["shown"]) {
  return pre(
    [{ head: "#", right: true }, { head: "model", max: 26 }, { head: "score", right: true }, { head: "where", max: 18 }, { head: "speed", right: true },
      { head: "RAM", right: true }, { head: "context", right: true }, { head: "get it", max: 16 }],
    rows.map((r) => [
      String(r.rank ?? "—"),
      { text: displayName(r), href: rel(from, files.model(r.id)) },
      hasScore(r) ? `${Math.round(r.score)}±${Math.round(r.pm)}${(r.thin ? "*" : "") + (r.maker_only ? "†" : "") || " "}` : r.evidence === "none" ? "no reviewed results" : r.evidence === "raw" ? "not scored yet" : "not yet calibrated",
      whereLabel(r),
      speedLabel(r.speed),
      r.mem_gb !== null ? `~${r.mem_gb < 10 ? r.mem_gb : Math.round(r.mem_gb)}GB` : "",
      cat === "llm" ? contextLabel(r.context_k) : "",
      // Local rows link to the model page's run instructions; API rows to the API's docs.
      !r.cmd ? "" : r.cmd.startsWith("http") ? { text: `${apiHost(r.cmd)} ↗`, href: r.cmd }
        : { text: `${primary({ cmd: r.cmd } as Variant).runtime.id === "other" ? "how to run" : primary({ cmd: r.cmd } as Variant).runtime.name} ›`, href: `${rel(from, files.model(r.id))}#run-it-on-your-own-machine` },
    ]));
}

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
    out.push(`<details><summary>Extra: filter models and choose a score scale</summary>\n\n[All sets](${SITE}${path}) · ${sets.join(" · ")}\n\nFiltering keeps overall scores. On the site, choose **within selected set** to use only that set’s evaluations. Models without a shared score scale are marked **not yet calibrated**.\n\n</details>`);
  }

  const auto = detect("whatmodel.sh", path);
  out.push(`Run ${code(auto.mac)} to see what your Mac can run, or ${code(curlFor("whatmodel.sh", path, new URLSearchParams()))} for this list in your terminal.`);
  out.push(`<details><summary>Linux, Windows and common machines</summary>\n\n` +
    ["```sh", `${auto.linux}   # Linux`, `${auto.windows}   # Windows`, "```"].join("\n") +
    `\n\n${MACHINES.map(([label, q]) => `[${label}](${SITE}${path}?${q})`).join(" · ")}\n\n</details>`);

  if (!v.rows.length) out.push(`No verified run options in this comparison set yet.${v.comparison ? ` ${modelLinks(from, v.models.filter((m) => v.comparison!.models.includes(m.id)))}` : ""}`);
  else {
    // A short preview of the price chart, as on the site, with the full charts one click away.
    const priced = v.shown.flatMap((r) => (r.score !== null && r.price ? [{ id: r.id, label: r.name, x: r.price, y: r.score, group: r.open_weights ? "open" as const : "closed" as const }] : []));
    const preview = scatter(priced, { xTick: usd, log: true, better: "low", width: 92, height: 5, labelLimit: 3 });
    if (preview) out.push(chartBlock("score vs API price", preview));
    const charts = chartsFor(v.shown, cat, 92);
    if (charts.length) out.push(`<details><summary>Full charts: score vs price and memory</summary>\n\n` +
      charts.map(({ title, chart }) => chartBlock(title, chart)).join("\n\n") + `\n\n</details>`);

    out.push(boardTable(from, cat, v.shown));
    if (v.hidden > 0) out.push(`\\+ ${v.hidden} more don't fit your machine or budget · [show them](${SITE}${path}?all=1)`);
  }

  // Comparison-only models with a score are in the table above; the rest are listed below.
  const { unscored, withoutResults } = v.outside;
  out.push(`\\* new or thinly tested: ranked on too few benchmark results · † only the maker's own numbers so far · ~RAM is estimated; full context may need more memory · ${v.rows.length} of ${v.models.length} catalogue models listed here · [sources and licences](${rel(from, files.method)}#sources)`);
  if (unscored.length || withoutResults.length) {
    const parts = [
      unscored.length && `Raw results, insufficient overlap for an overall score: ${modelLinks(from, unscored)}`,
      withoutResults.length && `No reviewed benchmark results yet: ${withoutResults.map((m) => text(m.name)).join(" · ")}`,
    ].filter(Boolean);
    out.push(`<details><summary>Models without a score (${unscored.length + withoutResults.length})</summary>\n\n${parts.join("\n\n")}\n\n</details>`);
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


// A model's results by task (lib/strengths.ts): a summary table, then each task's tests.
const SPARK = " ▁▂▃▄▅▆▇█";
const sparkText = (t: { spread: number[]; at: number }) => { const top = Math.max(...t.spread, 1); return t.spread.map((n, i) => (i === t.at ? "●" : n ? SPARK[Math.max(1, Math.round((n / top) * 8))] : "·")).join(""); };
const sharePct = (x: number) => `${x >= 0.095 ? Math.round(x * 100) : (x * 100).toFixed(1)}%`;
const WHY: Record<TestRow["why"][number], string> = { sharp: "sharp", blunt: "blunt", level: "at its level", maxed: "maxed out", floor: "too hard for it", noisy: "noisy", small: "small run", runs: "several runs", typical: "typical" };
const testTable = (tests: TestRow[]) => pre(
  [{ head: "test", max: 34 }, { head: "result", right: true }, { head: "vs the others in its run" }, { head: "difficulty", max: 24 }, { head: "counts", right: true }, { head: "why", max: 40 }],
  tests.map((t) => [
    { text: `${benchName(t.bench)}${t.result.by === "lab" ? " (lab)" : ""}`, href: t.result.source }, resultLabel(t.result),
    t.tested > 1 ? `${sparkText(t)} beats ${t.beaten}/${t.tested - 1}` : "no other model yet",
    [t.hard, t.typical && `avg ${t.typical}`].filter(Boolean).join(" · "),
    t.share !== null ? sharePct(t.share) : "—",
    t.unused ?? t.why.map((w) => WHY[w]).join(" · "),
  ]));
function strengthsMarkdown(from: string, s: Strengths, name: string): string[] {
  if (!s.tasks.length && !s.other.length) return [];
  const out = [`## What it's good at`, `<sub>● marks ${text(name)} among every model on that task or test, worst to best.</sub>`];
  out.push(pre([{ head: "task", max: 22 }, { head: "vs the others" }, { head: "rank", right: true }, { head: "counts", right: true }, { head: "tests", right: true }],
    s.tasks.map((t) => [t.label, t.rank !== null ? sparkText(t) : "", t.rank !== null ? `#${t.rank} of ${t.total}${t.n < 3 ? "*" : ""}` : "not ranked yet", t.share ? sharePct(t.share) : "—", String(t.tests.length)])));
  for (const t of s.tasks) {
    const peers = (list: { id: string; name: string }[]) => list.map((p) => `[${text(p.name)}](${rel(from, files.model(p.id))})`).join(", ");
    const lines = [
      t.beats.length ? `Beats ${peers(t.beats)} here, though they rank higher overall.` : "",
      t.trails.length ? `Trails ${peers(t.trails)} here, though they rank lower overall.` : "",
    ].filter(Boolean).join(" ");
    out.push(`<details><summary>${html(t.label)}${t.rank !== null ? ` · #${t.rank} of ${t.total}` : ""} · ${sharePct(t.share)} of its score</summary>\n\n${lines ? lines + "\n\n" : ""}${testTable(t.tests)}\n\n</details>`);
  }
  if (s.other.length) out.push(`<details><summary>other tests (${s.other.length})</summary>\n\n${testTable(s.other)}\n\n</details>`);
  return out;
}


// How to run a model, laid out like the site's model page: an API line, then one section per runtime with
// numbered steps (lib/runtimes.ts runGuide decides the sections, versions and the one to start on).
const fence = (lines: string[]) => ["```sh", ...lines, "```"].join("\n");
const indent = (text: string) => text.split("\n").join("\n   ");
const capital = (s: string) => s[0].toUpperCase() + s.slice(1);
const repoLabel = (url?: string) => { if (!url) return ""; const u = new URL(url); const org = u.pathname.split("/").filter(Boolean)[0]; return `[${u.hostname.replace(/^www\./, "")}${org && u.hostname !== "ollama.com" ? `/${org}` : ""}](${url})`; };
const needsLabel = (x: Variant) => `${x.gb_estimated ? "~" : ""}${x.gb} GB${x.platform && x.platform !== "any" ? `, ${x.platform === "mac" ? "Mac" : "NVIDIA"} only` : ""}`;
function runMarkdown(m: Model, cat: Category): string[] {
  const out = [`## How to run it`];
  if (m.api) out.push(`### Through an API`, ...howToRun(m, cat));
  const guide = runGuide(m.local?.variants ?? []);
  guide.forEach((sec, n) => {
    const rt = sec.runtime, main = sec.versions[sec.preferred];
    out.push(`### ${rt.id === "other" ? "Other ways to run it" : rt.name}${n === 0 && rt.id !== "other" ? " (recommended)" : ""}`);
    const steps: string[] = [];
    if (rt.install.length) {
      const cmds = rt.install.filter((i) => i.cmd), links = rt.install.filter((i) => i.href);
      steps.push(`Install ${rt.name}.${rt.note ? ` ${rt.note}` : ""}` +
        (links.length ? ` ${links.map((l) => `[${l.label === "other ways" ? "Other ways to install" : `Download it (${l.label})`}](${l.href})`).join(" · ")}` : "") +
        (cmds.length ? `\n\n${fence(cmds.flatMap((i) => [`# ${i.label}`, i.cmd!]))}` : ""));
    }
    const shown = main.steps.filter((x) => !x.href); // app links don't work on GitHub; the command does the same
    const [first, ...more] = shown;
    steps.push(`${rt.id === "other" ? "Run it as published" : `Run ${text(m.name)}`} (${versionLabel(main.v)}, needs ${needsLabel(main.v)}${main.v.source ? `, from ${repoLabel(main.v.source)}` : ""})` +
      (first?.cmd ? `\n\n${fence([first.cmd])}` : ""));
    for (const st of more) steps.push(st.cmd ? `${capital(st.label)}\n\n${fence([st.cmd])}` : capital(st.label));
    out.push(steps.map((x, i) => `${i + 1}. ${indent(x)}`).join("\n\n"));
    const others = sec.versions.filter((_, i) => i !== sec.preferred);
    if (others.length) out.push(`Other versions: ${others.map((x) => `${versionLabel(x.v)} (${needsLabel(x.v)}) \`${x.steps.find((st) => st.cmd)?.cmd}\``).join(" · ")}`);
  });
  if (!m.api && !guide.length) out.push("No verified API or local download yet.");
  if (m.model_repo) out.push(`Official weights and documentation: ${repoLabel(m.model_repo)}`);
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
    out.push(`${text(m.provider)}${m.released ? ` · released ${m.released}` : ""}`);
    if (m.identity_note) out.push(text(m.identity_note));
    if (m.model_repo) out.push(`[Model and usage documentation](${m.model_repo})`);
    if (m.source) out.push(`[Catalogue source](${m.source})`);
    out.push(v.raw.length ? `Published measurements are available, but there is not enough shared evaluation data to calculate a comparable overall score yet.` : `No reviewed benchmark results yet. This catalogue entry has no score or rank.`);
    if (v.raw.length) out.push(pre([{ head: "test", max: 34 }, { head: "result", right: true }, { head: "reported by" }, { head: "source", max: 30 }],
      v.raw.map((r) => [benchName(r.bench), resultLabel(r), (r.by === "lab" ? "lab" : "independent") + (r.invalid ? " · failed run, not counted" : ""), { text: shortName(sourceName(r.source)), href: r.source }])));
    out.push(licences(from, v.raw.map((r) => r.source)));
    out.push(...runMarkdown(m, cat));
    out.push(`[Sources and licences](${rel(from, files.method)}#sources) · [raw data](${rel(from, "data/results.json")}) · [interactive version](${SITE}/model/${m.id})`);
    return out.filter(Boolean).join("\n\n") + "\n";
  }

  const { score: s, explain: e } = v;
  out.push(`# ${text(m.name)}`);
  const facts = [text(m.provider), m.released && `released ${m.released}`,
    m.params_b && `${m.params_b}B params${m.active_b && m.active_b !== m.params_b ? ` (${m.active_b}B active)` : ""}`,
    m.license ? text(m.license) : !m.open_weights && "closed weights"].filter(Boolean);
  out.push(facts.join(" · "));
  out.push(`**score ${s.g.toFixed(1)}** ±${s.pm.toFixed(1)} · ${v.place ? `#${v.place} of ${v.total}` : "comparison only: no current run option verified"} · from ${pl(s.n, "benchmark result")} across ${pl(v.sources.length, "source")}${s.n < 3 ? " · \\* thinly tested, treat the rank as provisional" : ""}${s.n > 0 && s.lab === s.n ? " · † every result so far was reported by its maker" : ""}`);
  if (v.set) out.push(`Score within the [${text(v.set.label)}](${SITE}${CATEGORIES[cat].path}?set=${encodeURIComponent(v.set.id)}&score=set) comparison set only.`);

  const st = strengths(m.id);
  if (st) out.push(...strengthsMarkdown(from, st, m.name));

  out.push(`## How the score was worked out`);
  out.push(`Each result implies a score on its own, after adjusting for how hard that test is and who ran it. The model's score is their weighted average, with a small pull toward the middle for thinly tested models. Each test's weight is its *counts* column above; here it is added up by who ran the tests. [Method](${rel(from, files.method)})`);
  const rows: Cell[][] = v.groups.map((grp) => [
    { text: shortName(sourceName(grp.rows[0].r.source)) + (grp.rows.every((x) => x.r.by === "lab") ? " (lab)" : ""), href: grp.rows[0].r.source, anchor: grp.id },
    String(grp.rows.length), bar(grp.share),
  ]);
  rows.push(["prior: pull toward the middle", "", bar(e.prior.share)]);
  rows.push(["weighted average", "", `= ${s.g.toFixed(1)}`]);
  out.push(pre([{ head: "source", max: 40 }, { head: "results", right: true }, { head: "share of the score" }], rows));
  out.push(licences(from, v.groups.flatMap((g) => g.rows.map((x) => x.r.source))));
  if (v.unused.length) {
    const why = { untracked: "not a tracked benchmark", "other-source": "only model in this source's run", sparse: "too few models have it yet", failed: "failed run" };
    out.push(`<details><summary>Not counted (${v.unused.length})</summary>\n\n` + pre([{ head: "source", max: 22 }, { head: "test", max: 30 }, { head: "score", right: true }, { head: "why" }],
      v.unused.map(({ r, reason }) => [shortName(sourceName(r.source)), { text: benchName(r.bench), href: r.source }, resultLabel(r), reason === "failed" ? `failed run: ${r.invalid}` : why[reason]])) + `\n\n</details>`);
  }

  out.push(...runMarkdown(m, cat));

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
  const { categories, examples, frontiermath, results, sources } = methodView();
  const llm = categories.find((c) => c.cat === "llm")!;
  const pct = (x: number) => `${x >= 0.095 ? Math.round(x * 100) : (x * 100).toFixed(1)}%`;
  const name = (id: string) => categories.flatMap((c) => c.rows).find((r) => r.id === id)?.benchmark?.name ?? id;
  const out: string[] = [`[whatmodel.sh](${rel(from, files.board("llm"))}) / method`, `# How the score is calculated`];
  out.push(`Every benchmark is a different ruler. A model can score 90% on an easy quiz and 30% on research-level maths, so averaging percentages says little. Instead we line every test up on one shared scale and read off where each model sits. This is **item response theory**, the method exam boards use to put different exam papers on the same scale:`);
  out.push("```text\nresult[model, run] ≈ a[test] · score[model] + d[run]\n```");
  out.push([
    "**a** is a test's sharpness: how many points of result one step of ability is worth. Every run of the same test shares it, learned from all of them together. Saturated tests get a small a and count for less.",
    `**d** is the level of one evaluator's run of a test. Runs of the same test scatter around a common level by an amount fitted from the data (about ${Math.round(llm.spread)} points for text models), so an evaluator whose setup runs hot or cold can't move anyone's score, while a small run, such as a lab comparing its new model only with its previous one, is also read against everyone else's runs of that test. A result is read against the other models in its run, so a run needs at least two models and a test at least three across its runs. Sparser results stay visible as raw evidence. Lab-reported results are labelled.`,
    "Percentages are fit as proportions after removing the guessing rate (25% on four-option multiple choice), on a log-odds scale. A result near 0% or 100% says little about how far beyond that edge a model is, so it counts for less. Error ratios use −log(error + 0.005), preserving errors above 100% caused by insertions. Ratings use a linear transformation. Stored raw values are unchanged.",
    "A failed run, such as one flagged by its source or one far below random guessing because the answers couldn't be parsed, stays visible on the model page but doesn't count.",
    "Models with few results are pulled toward the middle and get a wider **±**; \\* marks scores from fewer than three results, and † scores where every result so far was reported by the model's own maker. Makers' numbers are used like anyone else's, read against the other runs of the same test; the mark only says no one else has checked them yet.",
    "Task filters recalculate scores using only that task’s reviewed evaluations. Models need task evidence to appear. Compare within the same task and connected set, not against overall scores. Agent measurements depend on the evaluated harness, tools and reasoning effort.",
    "Arena Agent’s signed IPS effects retain their raw units and are divided by a fixed 0.1 for the latent fit. They are not Elo or success rates. The aggregate is counted once, without duplicate component signals.",
    "All model sets are listed together by default. Overall scores use the largest connected set; models without a shared scale are not yet calibrated. Under Extra, filter to a set without changing scores, or choose scores within that set. Each scale has mean 50, sd 15; scores from different scales are not comparable. Scores shift as new models arrive.",
    "± is uncertainty within this statistical model, not a guarantee of real-world performance or a validated confidence interval.",
  ].map((l) => `- ${l}`).join("\n"));
  out.push(`## Where each score comes from`);
  out.push(`A score is a weighted average of what each result says on its own. A result's weight is **a² ÷ σ²**: how sharply its test separates models, divided by how noisy the test is. The rest is the prior, a pull toward the middle that matters only for models with few results. Each line splits one text model's score by test:`);
  out.push(examples.map((e) => {
    const parts = e.parts.slice(0, 5).map((p) => `${text(name(p.bench))} ${pct(p.share)}`);
    const rest = e.parts.slice(5).reduce((t, p) => t + p.share, 0);
    return `- [${text(e.name)}](${rel(from, files.model(e.id))}) (${e.why}, ${Math.round(e.g)} ±${Math.round(e.pm)}${e.n < 3 ? "\\*" : ""} from ${e.n} result${e.n === 1 ? "" : "s"}): ${[...parts, ...(rest > 0.005 ? [`other tests ${pct(rest)}`] : []), `prior ${pct(e.prior)}`].join(" · ")}`;
  }).join("\n"));
  out.push(`**Can one hard test dominate?** For the models at the very top, partly. FrontierMath supplies ${pct(frontiermath.top20)} of the evidence behind the top 20 text models' scores, because it is one of the few tests that still separates them, and with little noise. Across all ${llm.models} text models it supplies ${pct(frontiermath.all)}. Overlapping tests count separately: thirteen monthly MathArena sets are thirteen results. We tested a model that learns which tests overlap and discounts them; it ranked models worse on tests it hadn't seen, so we don't use it.`);
  out.push(`## Prior art`);
  out.push([
    "Epoch AI's Capabilities Index fits the same kind of model to AI benchmarks: each benchmark has a difficulty and a slope, and each model one capability ([“A Rosetta Stone for AI Benchmarks”](https://arxiv.org/abs/2512.00193)). We differ in giving each evaluator's run its own level, pooled toward the test's other runs, and in reading every result against the other models in its run.",
    "LMArena ranks models from head-to-head human votes with a Bradley–Terry model ([Chatbot Arena paper](https://arxiv.org/abs/2403.04132)). We use its ratings as tests among many.",
    "HELM reports head-to-head win rates: the share of comparisons, across all scenarios, where a model beats another ([HELM paper](https://arxiv.org/abs/2211.09110)).",
    "How we chose (7 October 2026): we hid whole tests and checked whether each method put models in the same order as the hidden test. This method got about 85% of text-model pairs right; an average win rate got about 77%, and a Bayesian model with extra hidden skills about 82%. On 8 October we pooled run levels: scoring 181 text models from their makers' own numbers alone, pooled levels landed closer to their full-data scores (typical error 2.3 points against 2.7), at a small cost in predicting results within the same run.",
  ].map((l) => `- ${l}`).join("\n"));
  out.push(`## Running models locally`);
  out.push(`RAM is a rough estimate from parameter count, precision and runtime headroom, not a measured peak. Actual use depends on the engine, batch size, context and KV cache. A listed context window is the provider ceiling; the RAM estimate does not promise that the full window fits on your machine.`);
  out.push(`Scores describe the published model evaluation. A quantized download may perform differently; we currently apply no numeric quantization penalty. Unknown prices and speeds are left blank or marked unknown. Unknown prices never pass a finite budget filter. API prices use base token rates blended three input tokens to one output token; check the provider for tiers and surcharges.`);
  out.push(`Model pages include sourced reference speed measurements with their hardware, engine, precision and workload. They are not automatically assigned to another download or machine. The main speed column stays blank when no matching measurement is verified; bandwidth predictions remain disabled.`);
  out.push(`API speeds are our own measurements: we stream a fixed prompt to each model three times, pinned to the provider whose price we list, and publish the raw runs in [api-speed.json](${rel(from, "data/api-speed.json")}). You can add local speeds for your own machine with the [bench script](${rel(from, "bench.sh")}); submissions are checked and reviewed before they appear.`);
  out.push(`## Benchmarks`);
  out.push(`${results} results, each with a source link. Download the [raw results](${rel(from, "data/results.json")}), [benchmark definitions](${rel(from, "data/benchmarks.json")}), or [rankings as JSON](${SITE}/api?format=json&all=1).`);
  out.push(`**Share of evidence** is how much of all the weight behind a category's scores comes from that run, averaged over its scored models.`);
  for (const c of categories) {
    out.push(`### ${c.title[0].toUpperCase()}${c.title.slice(1)} (${c.models} scored models, prior ${pct(c.prior)})`);
    out.push(pre([{ head: "test (evaluator)", max: 56 }, { head: "models", right: true }, { head: "a", right: true }, { head: "σ", right: true }, { head: "weight", right: true }, { head: "share", right: true }],
      c.rows.map((r) => [
        { text: `${r.benchmark?.name ?? r.id}${r.evaluator ? ` (${r.evaluator})` : ""}`, href: r.benchmark?.url ?? "" },
        String(r.n), r.a.toFixed(2), r.sigma.toFixed(2), r.info.toFixed(1), pct(r.influence),
      ])));
  }
  out.push(`<a name="sources"></a>\n\n## Sources`);
  out.push(`Benchmark results and API prices use the licensed datasets listed below, plus scores and prices that model makers publish for their own models, recorded by hand as facts and labelled lab-reported. Missing coverage is withheld. Sources do not endorse this site. Scores and rankings are our calculations, not the sources' own figures.`);
  out.push(`Our contributions to the numerical data compilation, adaptations and derived scores are [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Source-specific licences and notices remain in force. Changes include model-name mapping, unit conversion, selection of settings and the calculation of relative scores. The [source register](${rel(from, "data/sources.json")}) includes attribution and licence notices. Share-alike extracts in [data/extracts](${rel(from, "data/extracts")}) retain those terms.`);
  out.push(sources.map((x) => `- **${text(x.name)}** · ${text(x.kind)} · ${x.license_url ? `[${text(x.license)}](${href(from, x.license_url)})` : text(x.license)} · [terms](${x.terms_url})${x.checked ? ` · checked ${x.checked}` : ""}${x.attribution ? `  \n  <sub>${text(x.attribution)}</sub>` : ""}`).join("\n"));
  out.push(`[interactive version](${SITE}/method)`);
  return out.join("\n\n") + "\n";
}

export const generatedNote = `<!-- Generated by \`npm run pages\` from data/ and lib/. Edit scripts/pages.ts or lib/markdown.ts, not this file. -->`;

// Every page, keyed by its path in the repo. `about` is appended to README.md.
export function renderPages(about: string, bench = { page: "", details: "" }): Map<string, string> {
  // README: a screenshot of the site in the reader's colour scheme, then what this is in one line.
  const shot = (name: string, alt: string) => `<picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/${name}-dark.png"><img alt="${alt}" src="docs/images/${name}-light.png"></picture>`;
  const intro = `<a href="${SITE}">${shot("board", "The whatmodel.sh leaderboard: AI models ranked by score, with price, memory and the command to run each")}</a>\n\n` +
    `**The open AI model leaderboard.** Every model is ranked by one score built from ${results.length.toLocaleString("en-US")} published benchmark results, with its price, the memory it needs and the command to run it. ` +
    `Filter by your computer or budget at [whatmodel.sh](${SITE}), or read the same leaderboard below. [About this repo](#about-this-repo)`;
  const pages = new Map<string, string>();
  for (const c of CATEGORY_IDS) {
    const md = boardMarkdown(boardView(c, new URLSearchParams()), c === "llm" ? intro : "");
    pages.set(files.board(c), `${generatedNote}\n\n${md}${c === "llm" ? `\n${about}` : ""}`);
  }
  pages.set(files.method, `${generatedNote}\n\n${methodMarkdown()}`);
  // BENCHMARKING.md: the site's /bench page (content/site/bench.md), then the technical details.
  if (bench.page) pages.set("BENCHMARKING.md", `${generatedNote.replace("scripts/pages.ts or lib/markdown.ts", "content/site/bench.md or scripts/benchmarking-details.md")}\n\n# Benchmark your machine\n\n${bench.page.trim()}\n\n${bench.details.trim()}\n`);
  // The bench script's model list (one compact line per model, so diffs stay readable).
  pages.set("pages/bench-models.json", `[\n${benchCatalogue().map((m) => JSON.stringify(m)).join(",\n")}\n]\n`);
  for (const x of pageModels()) pages.set(files.model(x.id), `${generatedNote}\n\n${modelMarkdown(modelView(x.id)!)}`);
  return pages;
}
