// Completeness audit for data/models.json (research helper, not part of lib/).
//
//   node docs/research/completeness-audit.ts            per-category counts
//   node docs/research/completeness-audit.ts --list     plus every gap, highest priority first
//   node docs/research/completeness-audit.ts --json f   write counts and gap lists to f
//
// A gap is a field the catalogue leaves empty:
//   released     no release month
//   license      open-weights model with no licence label (closed models show "closed weights")
//   params_b     open-weights model with no parameter count
//   context_k    LLM that can be used (API or local) with no sourced context window
//   price        API listed with no price ("price unknown")
//   model_repo   open-weights model with no link to its official weights
//   local        open-weights model with no local run option
// Priority: scored models first by score within their comparison set, then newest release.
import { readFileSync, writeFileSync } from "node:fs";
import { comparisonSets, models } from "../../lib/data.ts";
import { CATEGORY_IDS, catOf } from "../../lib/categories.ts";
import type { Category, Model } from "../../lib/types.ts";

const raw = JSON.parse(readFileSync(new URL("../../data/models.json", import.meta.url), "utf8")) as Model[];
const FIELDS = ["released", "license", "params_b", "context_k", "price", "model_repo", "local"] as const;
type Field = (typeof FIELDS)[number];

const score = new Map<string, { g: number; rank: number; main: boolean }>();
for (const c of CATEGORY_IDS)
  comparisonSets[c].forEach((set, i) => {
    [...set.fit.scores.values()].sort((a, b) => b.g - a.g).forEach((s, r) => score.set(s.id, { g: s.g, rank: r + 1, main: i === 0 }));
  });

const usable = (m: Model) => !!m.api || !!m.local?.variants.length;
const hasPrice = (m: Model) => m.api?.price !== undefined || (m.api?.price_in !== undefined && m.api?.price_out !== undefined);

export function gaps(m: Model): Field[] {
  const out: Field[] = [];
  if (!m.released) out.push("released");
  if (m.open_weights && !m.license) out.push("license");
  if (m.open_weights && !m.params_b) out.push("params_b");
  if (catOf(m) === "llm" && usable(m) && !m.context_k) out.push("context_k");
  if (m.api && !hasPrice(m)) out.push("price");
  if (m.open_weights && !m.model_repo) out.push("model_repo");
  if (m.open_weights && !m.local?.variants.length) out.push("local");
  return out;
}

const priority = (m: Model) => {
  const s = score.get(m.id);
  // Main-set scored models by rank, then other scored models, then unscored by recency.
  const tier = s ? (s.main ? 0 : 1) : 2;
  return [tier, s ? s.rank : 0, -(Number((m.released ?? "0000-00").replace("-", "")) || 0)];
};
const cmp = (a: Model, b: Model) => {
  const pa = priority(a), pb = priority(b);
  for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return a.id.localeCompare(b.id);
};

const counts: Record<string, Record<string, number>> = {};
const lists: Record<string, Record<string, string[]>> = {};
for (const c of CATEGORY_IDS) {
  const ms = raw.filter((m) => catOf(m) === c).sort(cmp);
  counts[c] = { models: ms.length, open_weights: ms.filter((m) => m.open_weights).length, scored: ms.filter((m) => score.has(m.id)).length };
  lists[c] = {};
  for (const f of FIELDS) {
    const hit = ms.filter((m) => gaps(m).includes(f));
    counts[c][f] = hit.length;
    counts[c][`${f}_scored`] = hit.filter((m) => score.has(m.id)).length;
    lists[c][f] = hit.map((m) => m.id);
  }
}

const table = [["category", "models", "open", "scored", ...FIELDS.map((f) => `${f} (scored)`)]];
for (const c of CATEGORY_IDS) table.push([c, `${counts[c].models}`, `${counts[c].open_weights}`, `${counts[c].scored}`, ...FIELDS.map((f) => `${counts[c][f]} (${counts[c][`${f}_scored`]})`)]);
const widths = table[0].map((_, i) => Math.max(...table.map((r) => r[i].length)));
console.log(table.map((r) => r.map((x, i) => x.padStart(widths[i])).join("  ")).join("\n"));

if (process.argv.includes("--list"))
  for (const c of CATEGORY_IDS as Category[])
    for (const f of FIELDS)
      if (lists[c][f].length) console.log(`\n${c} ${f} (${lists[c][f].length}): ${lists[c][f].map((id) => { const s = score.get(id); return s ? `${id}#${s.main ? "" : "set:"}${s.rank}` : id; }).join(", ")}`);

const j = process.argv.indexOf("--json");
if (j > 0) writeFileSync(process.argv[j + 1], JSON.stringify({ counts, lists }, null, 1) + "\n");
void models;
