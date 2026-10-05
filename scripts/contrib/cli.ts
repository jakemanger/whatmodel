import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadRepo } from './repo.ts';
import { review, reportText, type Issue } from './review.ts';
import { webNet } from './net.ts';
import { preserve } from './jsonfmt.ts';

const args = process.argv.slice(2);
const option = (name: string) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const issueFile = option('--issue'), outDir = option('--out');
if (!issueFile || !outDir || args.some((a) => a.startsWith('--') && !['--issue', '--out', '--repo', '--fetch'].includes(a))) {
  console.error('Usage: node scripts/contrib/cli.ts --issue issue.json --out NEW_DIRECTORY [--repo CHECKOUT] [--fetch]'); process.exit(2);
}
try {
  const root = resolve(option('--repo') ?? fileURLToPath(new URL('../../', import.meta.url)));
  const input = readFileSync(issueFile, 'utf8');
  if (input.length > 30000) throw new Error('Issue JSON exceeds 30,000 characters.');
  const issue = JSON.parse(input) as Issue;
  if (!issue || typeof issue.body !== 'string' || (issue.labels !== undefined && (!Array.isArray(issue.labels) || issue.labels.some((x) => typeof x !== 'string' && (!x || typeof x.name !== 'string'))))) throw new Error('Expected {body: string, labels?: string[]}.');
  const result = await review(issue, loadRepo(root), args.includes('--fetch') ? webNet() : undefined);
  // Refuse existing output directories; never overwrite a user's files or the checkout.
  const output = resolve(outDir); mkdirSync(output);
  writeFileSync(join(output, 'report.json'), JSON.stringify(result, null, 2) + '\n');
  writeFileSync(join(output, 'report.md'), reportText(result));
  const baseline: Record<string, string> = {};
  if (result.changes.length) {
    const proposed = join(output, 'proposed-data'); mkdirSync(proposed);
    for (const file of new Set(result.changes.map((c) => c.file))) {
      const original = readFileSync(join(root, 'data', file), 'utf8');
      baseline[file] = createHash('sha256').update(original).digest('hex');
      const rows: unknown[] = JSON.parse(original);
      for (const change of result.changes.filter((c) => c.file === file)) {
        if (change.before === null) rows.push(change.after);
        else {
          const index = rows.findIndex((r) => JSON.stringify(r) === JSON.stringify(change.before));
          if (index < 0) throw new Error('Catalogue changed during review; rerun against its new state.');
          rows[index] = change.after;
        }
      }
      writeFileSync(join(proposed, file), preserve(original, rows));
    }
  }
  writeFileSync(join(output, 'baseline-sha256.json'), JSON.stringify(baseline, null, 2) + '\n');
  console.log(`${result.status}: ${result.changes.length} proposed changes. Review ${join(output, 'report.md')}`);
  process.exitCode = result.status === 'invalid' ? 2 : 0;
} catch (e) { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 2; }
