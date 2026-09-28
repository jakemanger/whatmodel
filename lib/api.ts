import { benchesUsed, comparisonFor, comparisonSets, gFor, hardware, modelsIn, speedFor, updated, updatedLabel } from "./data.ts";
import { isCategory } from "./categories.ts";
import { parseMax, parseSort, parseSpecs, rank, sortRows, usable } from "./fit.ts";
import { DISCLOSURE, sponsor, toText } from "./format.ts";
import { chartsFor, chartToText } from "./chart.ts";
import { SOURCES } from "./sources.ts";
import { retiredCount } from "./views.ts";

// The leaderboard as text or JSON. `cat` comes from the path (/api/image) or ?cat=.
export function leaderboard(req: Request, c: string | null) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const cat = isCategory(c) ? c : "llm";
  const specs = parseSpecs(q, hardware);
  const max = parseMax(q);
  const comparison = comparisonFor(cat, q.get("set"));
  const alternatives = comparisonSets[cat].map(({ id, label, models }) => ({ id, label, models: models.length }));
  const ranked = rank(modelsIn(cat), comparison?.fit.scores ?? new Map(), { specs, max, gFor, speedFor, thinBelow: 3, retired: q.has("retired") });
  const { sort, dir } = parseSort(q, ranked);
  const rows = sortRows(ranked, sort, dir);
  const all = q.has("all");
  const limit = Number(q.get("n")) || 40;

  if (q.get("format") === "json" || req.headers.get("accept")?.includes("application/json")) {
    return Response.json({
      category: cat,
      comparison_set: comparison?.id ?? null,
      comparison_sets: alternatives,
      comparison_models: comparison?.models.map((id) => ({ id, details: `${url.origin}/model/${id}` })) ?? [],
      comparison_note: "Scores and ranks compare models within one connected comparison set only. Select another with ?set=<id>.",
      specs: specs && { ...specs, hw: specs.hw?.id ?? null, usable_gb: usable(specs) },
      max_price: max,
      updated,
      coverage: rows.length ? "reviewed subset; incomplete coverage" : "no reviewed rankings available",
      data_license: {
        name: "CC BY-SA 4.0",
        url: "https://creativecommons.org/licenses/by-sa/4.0/",
        scope: "whatmodel.sh contributions to the numerical compilation, adaptations and derived scores; underlying source licences and notices also apply",
        attribution: "whatmodel.sh, Merlinsbeard Pty Ltd; source-specific credits below. No endorsement. Provided as-is.",
      },
      attributions: SOURCES.filter((s) => s.verdict === "allowed").map((s) => ({
        name: s.name, source: s.terms_url, license: s.license,
        license_url: new URL(s.license_url ?? s.terms_url, url.origin).href,
        attribution: s.attribution,
      })),
      models: rows
        .filter((r) => all || r.where !== "none")
        .slice(0, limit)
        .map((r) => ({ ...r, memory_estimated: r.mem_gb !== null,
          price_source: modelsIn(cat).find((m) => m.id === r.id)?.api?.price_source ?? null,
          details: `${url.origin}/model/${r.id}` })),
      method: `${url.origin}/method`,
      raw_data: `${url.origin}/data/manifest.json`,
      disclosure: DISCLOSURE,
      terms: `${url.origin}/terms`,
      sponsor,
    });
  }

  const text = toText(rows, specs, max, {
    cat,
    color: q.get("color") === "1",
    base: url.origin,
    limit,
    all,
    benches: benchesUsed(cat, comparison?.id),
    comparison: alternatives.length > 1 ? { selected: comparison?.id, sets: alternatives } : undefined,
    updated: updatedLabel,
    retiredCount: retiredCount(modelsIn(cat), comparison?.fit.scores),
  });
  // ?chart=1 draws the plots under the title line.
  const lines = text.split("\n");
  if (q.has("chart")) lines.splice(3, 0, ...chartsFor(rows.filter((r) => all || r.where !== "none"), cat).flatMap(({ title, chart }) => [...chartToText(title, chart, q.get("color") === "1"), ""]));
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
