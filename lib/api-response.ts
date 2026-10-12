import { usable } from "./fit.ts";
import { DISCLOSURE, sponsor, toText } from "./format.ts";
import { chartsFor, chartToText } from "./chart.ts";
import { boardFromData, type BoardData } from "./board.ts";

export type Attribution = { name: string; source: string; license: string; license_url: string; attribution?: string };

// The leaderboard as text or JSON. `cat` comes from the path (/api/image) or ?cat=.
export function leaderboardResponse(req: Request, data: BoardData, attributions: Attribution[]) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const { cat, updated, updatedLabel, models } = data;
  const { task, specs, max, comparison, scoreMode, scoreSet, sets, rows, all, benches, retiredCount, thin, thinCount } = boardFromData(data, q);
  const alternatives = sets.map(({ id, label, models }) => ({ id, label, models: models.length }));
  const limit = Number(q.get("n")) || 40;

  if (q.get("format") === "json" || req.headers.get("accept")?.includes("application/json")) {
    return Response.json({
      category: cat,
      task: task?.id ?? null,
      tasks: data.tasks?.map(({ id, label, description }) => ({ id, label, description })) ?? [],
      task_note: task ? "Scores use only reviewed evaluations for this task. Compare within this task and comparison set; missing task evidence is not a capability claim." : null,
      comparison_set: comparison?.id ?? null,
      score_mode: scoreMode,
      score_set: scoreSet?.id ?? null,
      comparison_sets: alternatives,
      comparison_models: comparison?.models.map((id) => ({ id, details: `${url.origin}/model/${id}` })) ?? [],
      comparison_note: scoreMode === "set"
        ? "Scores and ranks use only the selected set's evaluations and compare models within that set."
        : "All sets are listed by default. ?set=<id> filters models without changing the score scale; add &score=set for scores within that set. Uncalibrated scores and ranks are null.",
      specs: specs && { ...specs, hw: specs.hw?.id ?? null, usable_gb: usable(specs) },
      max_price: max,
      thinly_tested: { listed: thin, count: thinCount, note: "Text models with fewer than 3 results are left off unless ?thin=1." },
      updated,
      coverage: rows.length ? "reviewed subset; incomplete coverage" : "no reviewed rankings available",
      data_license: {
        name: "CC BY-SA 4.0",
        url: "https://creativecommons.org/licenses/by-sa/4.0/",
        scope: "whatmodel.sh contributions to the numerical compilation, adaptations and derived scores; underlying source licences and notices also apply",
        attribution: "whatmodel.sh, Merlinsbeard Pty Ltd; source-specific credits below. No endorsement. Provided as-is.",
      },
      attributions: attributions.map((s) => ({ ...s, license_url: new URL(s.license_url, url.origin).href })),
      models: rows
        .filter((r) => all || r.where !== "none")
        .slice(0, limit)
        .map((r) => ({ ...r, memory_estimated: r.mem_gb !== null,
          price_source: models.find((m) => m.id === r.id)?.api?.price_source ?? null,
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
    benches,
    comparison: alternatives.length > 1 ? { selected: comparison?.id, scoreMode, sets: alternatives } : undefined,
    updated: updatedLabel,
    retiredCount,
    thin,
    thinCount,
  });
  // ?chart=1 draws the plots under the title line.
  const lines = text.split("\n");
  if (task) lines.splice(2, 0, `Task: ${task.label}. Scores compare within this task only.`, '');
  if (q.has("chart")) lines.splice(3, 0, ...chartsFor(rows.filter((r) => all || r.where !== "none"), cat).flatMap(({ title, chart }) => [...chartToText(title, chart, q.get("color") === "1"), ""]));
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
