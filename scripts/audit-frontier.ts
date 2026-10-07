// Audit the October 2026 frontier additions. No ranking target is used.
// node scripts/audit-frontier.ts [--json output.json]
import { writeFileSync } from 'node:fs';
import { benchmarks, results, modelById, comparisonSets, sourcesFor, updated } from '../lib/data.ts';
import { boardData } from '../lib/board-data.ts';
import { boardFromData } from '../lib/board.ts';
import { fit, toCells } from '../lib/score.ts';
import { connectedCells } from '../lib/comparisons.ts';
import { sourceId } from '../lib/sources.ts';

const ids = ['claude-opus-5-5', 'claude-fable-5-1', 'gemini-4-argon', 'gpt-6-1-sol', 'claude-sonnet-5-5'];
const llmResults = results.filter((r) => (modelById.get(r.model)?.category ?? 'llm') === 'llm');
const llmBenchmarks = benchmarks.filter((b) => (b.category ?? 'llm') === 'llm');
const cells = toCells(llmResults, llmBenchmarks);
const scores = (f: ReturnType<typeof fit>) => Object.fromEntries(ids.map((id) => [id, f.scores.get(id) ?? null]));
const omittedSources = ['epoch-internal', 'lmarena-dataset', 'matharena-arxiv-outputs-bysa', 'mideind-icelandic-llm-leaderboard'];
const ablations = Object.fromEntries(omittedSources.map((source) => {
  const remaining = cells.filter((c) => !c.results.some((r) => sourceId(r.source) === source));
  return [source, scores(fit(connectedCells(remaining)[0]))];
}));
const linearSensitivity = Object.fromEntries([0.05, 0.1, 0.2].map((scale) => {
  const adjusted = llmBenchmarks.map((b) => b.kind === 'linear' ? { ...b, latent_scale: scale } : b);
  return [scale, scores(fit(connectedCells(toCells(llmResults, adjusted))[0]))];
}));
const data = boardData('llm');
const tasks = Object.fromEntries((data.tasks ?? []).map((task) => {
  const board = boardFromData(data, new URLSearchParams({ task: task.id, retired: '1' }));
  const frontier = board.ranked.filter((r) => ids.includes(r.id));
  return [task.id, Object.fromEntries(frontier.map((r) => [r.id, { score: r.score, uncertainty: r.pm, benchmarks: r.n }]))];
}));
const report = {
  updated,
  overall: scores(comparisonSets.llm[0].fit),
  sources: Object.fromEntries(ids.map((id) => [id, sourcesFor(id)])),
  tasks,
  leaveOneSourceOut: ablations,
  linearUnitSensitivity: linearSensitivity,
  sharedEvidence: results.filter((r) => ids.includes(r.model)),
};
const out = process.argv.indexOf('--json');
if (out !== -1) {
  const path = process.argv[out + 1];
  if (!path || path.startsWith('--')) throw new Error('--json needs an output path');
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({
  overall: report.overall, tasks, leaveOneSourceOut: ablations, linearUnitSensitivity: linearSensitivity,
}, null, 2));
