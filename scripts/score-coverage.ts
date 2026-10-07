// Audit every catalogue identity without substituting estimated benchmark scores.
// npm run score-coverage -- [--json path]
import { writeFileSync } from 'node:fs';
import { CATEGORY_IDS, catOf } from '../lib/categories.ts';
import { comparisonSets, models, results, updated } from '../lib/data.ts';

const resultCounts = new Map<string, number>();
for (const r of results) resultCounts.set(r.model, (resultCounts.get(r.model) ?? 0) + 1);
const entries = models.map((m) => {
  const category = catOf(m);
  const sets = comparisonSets[category];
  const set = sets.find((s) => s.fit.scores.has(m.id));
  const score = set?.fit.scores.get(m.id);
  const observations = resultCounts.get(m.id) ?? 0;
  const status = set === sets[0] && score ? 'main' : score ? 'separate-comparison' : observations ? 'raw-only' : 'no-results';
  return {
    id: m.id, category, provider: m.provider, status, observations,
    ...(score ? { score: score.g, uncertainty: score.pm, cells: score.n, comparison: set!.id } : {}),
    ...(status === 'raw-only' ? { reason: 'Published measurements exist, but no evaluator/benchmark series contains at least three matched models.' } : {}),
    ...(status === 'no-results' ? { reason: 'No reviewed exact-model benchmark measurement is recorded.' } : {}),
    ...(status === 'separate-comparison' ? { reason: 'Scored within a disconnected comparison group; not comparable to the category main scale.' } : {}),
  };
});
const categories = Object.fromEntries(CATEGORY_IDS.map((cat) => {
  const rows = entries.filter((e) => e.category === cat);
  return [cat, {
    total: rows.length,
    main: rows.filter((e) => e.status === 'main').length,
    separate: rows.filter((e) => e.status === 'separate-comparison').length,
    rawOnly: rows.filter((e) => e.status === 'raw-only').length,
    noResults: rows.filter((e) => e.status === 'no-results').length,
  }];
}));
console.table(categories);
const unscored = entries.filter((e) => e.status === 'raw-only' || e.status === 'no-results');
console.log(`${entries.length - unscored.length}/${entries.length} models scored; ${unscored.length} need evidence. Separate comparison scores cannot be ranked against the main scale.`);
const json = process.argv.indexOf('--json');
if (json !== -1) {
  const path = process.argv[json + 1];
  if (!path || path.startsWith('--')) throw new Error('--json needs an output path');
  writeFileSync(path, JSON.stringify({ updated, categories, entries }, null, 2) + '\n');
}
