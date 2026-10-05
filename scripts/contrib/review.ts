// Local proposal builder. It never modifies the checkout, executes submitted commands,
// approves a licence, contacts GitHub write APIs or applies a proposal.
import { createHash } from 'node:crypto';
import { sourceIn } from '../../lib/sources.ts';
import type { Model, Result, Benchmark, Category, Variant } from '../../lib/types.ts';
import type { Repo } from './repo.ts';
import { CATEGORIES, BY, type Kind } from './forms.ts';
import { detectKind, readForm, str, keyValues, resultLines, MAX_BODY, type Problem } from './parse.ts';
import { parseNumber, parseContext, parseParams, parseSize, normLicence, yesNo, slug, norm, toScore } from './values.ts';
import { aggregator, inScope, modelScopes } from './domains.ts';
import { checkUrl, type Net, type Fetched } from './net.ts';

export type Issue = { body: string; labels?: (string | { name: string })[]; number?: number; title?: string };
export type Change = { file: 'models.json' | 'results.json' | 'benchmarks.json'; id: string; before: unknown; after: unknown; reason: string };
export type Evidence = { source: string; fetched?: Fetched; sha256?: string; ledger?: string; problem?: string };
export type Review = { status: 'invalid' | 'needs-review' | 'no-change'; kind?: Kind; problems: Problem[]; warnings: string[]; changes: Change[]; evidence: Evidence[]; sourceProposals: { url: string; claimedLicence: string; licenceUrl: string; verdict: 'unclear' }[] };
const cats: Category[] = ['llm', 'image', 'video', 'tts', 'stt'];
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export async function review(issue: Issue, repo: Repo, net?: Net): Promise<Review> {
  const out: Review = { status: 'invalid', problems: [], warnings: [], changes: [], evidence: [], sourceProposals: [] };
  if (typeof issue.body !== 'string' || issue.body.length > MAX_BODY) {
    out.problems.push({ message: `Issue body must be text no longer than ${MAX_BODY} characters.` }); return out;
  }
  const labels = (issue.labels ?? []).map((x) => typeof x === 'string' ? x : x.name);
  const kind = detectKind(labels, issue.body); out.kind = kind;
  if (!kind) { out.problems.push({ message: 'Cannot identify the form. Supply one supported form label and its headings.' }); return out; }
  const { fields: f, problems } = readForm(kind, issue.body); out.problems.push(...problems);
  if (problems.length) return out;
  const source = str(f.source) || str(f.link) || str(f.links);
  try { checkUrl(source); } catch { out.problems.push({ field: 'source', message: 'Use one complete public HTTP(S) source URL.' }); return out; }
  if (aggregator(source)) { out.problems.push({ field: 'source', message: 'This source is excluded by the repository source policy.' }); return out; }
  const ledger = sourceIn(repo.sources, source);
  const ev: Evidence = { source, ledger: ledger?.id }; out.evidence.push(ev);
  if (net) {
    try {
      ev.fetched = await net.get(source); ev.sha256 = digest(ev.fetched.text);
      if (!ev.fetched.ok || ev.fetched.truncated) ev.problem = `Source returned ${ev.fetched.status}${ev.fetched.truncated ? ' and was truncated' : ''}.`;
      if (aggregator(ev.fetched.url)) ev.problem = 'Redirected to an excluded source.';
    } catch (e) { ev.problem = e instanceof Error ? e.message : String(e); }
  } else ev.problem = 'Not fetched (offline review).';
  if (ev.problem) out.warnings.push(ev.problem);
  out.warnings.push('All changes require human review of exact checkpoint, source ownership, units, table row, protocol and licence scope. Text matches are not verification.');
  const propose = (file: Change['file'], id: string, before: unknown, after: unknown, reason: string) => {
    if (!same(before, after)) out.changes.push({ file, id, before, after, reason });
  };
  const model = repo.models.find((m) => m.id === str(f.model));
  const problem = (message: string, field?: string) => out.problems.push({ message, field });
  const pairs = (text: string) => {
    const parsed = keyValues(text, 'Details'); out.problems.push(...parsed.problems);
    const seen = new Set<string>();
    for (const p of parsed.pairs) { if (seen.has(p.key) || ['__proto__', 'prototype', 'constructor'].includes(p.key)) problem(`Duplicate or forbidden field: ${p.key}`); seen.add(p.key); }
    return parsed.pairs;
  };
  const sourceReview = () => {
    if (!ledger || ledger.verdict !== 'allowed') {
      out.sourceProposals.push({ url: source, claimedLicence: str(f.licence), licenceUrl: str(f.licence_link), verdict: 'unclear' });
      out.warnings.push('The source is not approved. No benchmark results or ledger approvals are proposed.');
      return false;
    }
    // First-party factual permissions never cover evaluation scores.
    if (/first-party publication|vendor.?facts/i.test(ledger.license)) { out.warnings.push('The ledger allows vendor facts only, not benchmark results.'); return false; }
    return true;
  };
  const addResult = (id: string, benchId: string, raw: string, note: string, by: Result['by'], correcting = false) => {
    const m = repo.models.find((x) => x.id === id);
    const b = repo.benchmarks.find((x) => x.id === benchId);
    if (!m || !b) { problem(`Unknown ${!m ? 'model '+id : 'benchmark '+benchId}. Use its exact catalogue id.`); return; }
    if ((m.category ?? 'llm') !== (b.category ?? 'llm')) { problem('Model and benchmark categories differ.'); return; }
    const parsed = toScore(raw, b);
    if (parsed.error) { problem(parsed.error); return; }
    if (parsed.warning) out.warnings.push(parsed.warning);
    if (!sourceReview()) return;
    const matches = repo.results.filter((r) => r.model === id && r.bench === benchId && r.source === source);
    if (matches.length > 1) { problem('Several result rows match: a maintainer must select the exact evaluation.'); return; }
    const existing = matches[0];
    if (existing && !correcting) {
      if (existing.score !== parsed.score) problem('This source already has a different score. Use Wrong number and identify the correction.');
      return;
    }
    if (correcting && !existing) { problem('No existing result matches this exact model, benchmark and source URL.'); return; }
    const result: Result = { ...(existing ?? {}), model: id, bench: benchId, score: parsed.score!, source, source_id: ledger!.id, by: existing?.by ?? by, note: note || existing?.note || '' };
    propose('results.json', `${id}|${benchId}|${source}`, existing ?? null, result, correcting ? 'Correct an existing measurement' : 'Add a reported measurement');
  };
  const update = (original: Model, text: string): Model => {
    const m = structuredClone(original);
    const scopes = modelScopes(original, repo.models, repo.icons);
    const ownership = inScope(source, [...scopes.maker, ...scopes.serving]);
    if (!ownership) out.warnings.push('Source ownership is not established from the catalogue; verify the maker or serving provider.');
    for (const p of pairs(text)) {
      let value: unknown;
      switch (p.key) {
        case 'name': case 'maker':
          if (p.value.length > 160 || /[<>\x00-\x1f]/.test(p.value)) { problem('Name/maker is invalid.'); break; }
          m[p.key === 'maker' ? 'provider' : 'name'] = p.value; break;
        case 'released':
          if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.value)) problem('Release must be YYYY-MM.');
          else { m.released = p.value; m.released_source = source; } break;
        case 'licence': case 'license':
          value = normLicence(p.value); if (!value) problem('Invalid licence id.');
          else { m.license = String(value); m.license_source = source; } break;
        case 'params': case 'params_b': case 'active':
          value = parseParams(p.value); if (!value) problem('Parameters must be positive, e.g. 8B.');
          else if (p.key === 'active') m.active_b = value as number;
          else { m.params_b = value as number; m.params_b_source = source; } break;
        case 'context':
          value = parseContext(p.value); if (!value || (m.category ?? 'llm') !== 'llm') problem('Context must be a positive LLM token count, e.g. 128k.');
          else { m.context_k = value as number; m.context_source = source; } break;
        case 'open_weights':
          value = yesNo(p.value); if (value === undefined) problem('open_weights must be yes or no.'); else m.open_weights = value as boolean; break;
        case 'price_in': case 'price_out': case 'price': {
          if (!m.api) { problem('No API exists on this model; use Add a place to run it.'); break; }
          const n = parseNumber(p.value);
          if (!n || n.percent || n.value < 0) { problem('Price must be a nonnegative USD number; use the category price unit.'); break; }
          if ((p.key === 'price') === ((m.category ?? 'llm') === 'llm')) { problem('LLMs use price_in and price_out; other categories use price.'); break; }
          m.api[p.key] = n.value; m.api.price_source = source; break;
        }
        default: problem(`Unsupported field: ${p.key}`);
      }
    }
    if (m.active_b && m.params_b && m.active_b > m.params_b) problem('Active parameters cannot exceed total parameters.');
    return m;
  };

  if (kind === 'paper-results') {
    const lines = resultLines(str(f.results));
    if (lines.length > 50) problem('Limit one contribution to 50 results.');
    else for (const { cells } of lines) {
      if (cells.length < 3 || cells.length > 4) { problem('Result format: model-id | benchmark-id | score | optional note'); continue; }
      addResult(cells[0], cells[1], cells[2], [str(f.location), cells[3], str(f.setup)].filter(Boolean).join('; '), str(f.by) === BY[1] ? 'lab' : 'independent');
    }
  } else if (kind === 'update-model' || kind === 'wrong-number') {
    if (!model) problem('Unknown model id.');
    else {
      const text = kind === 'wrong-number' ? str(f.field) : str(f.change);
      const correction = /^([^:=\n]+)\s*[:=]\s*([^\n]+)$/.exec(text.trim());
      const benchmark = correction && repo.benchmarks.find((b) => b.id === correction[1].trim());
      if (kind === 'wrong-number' && benchmark && correction) {
        addResult(model.id, benchmark.id, correction[2].trim(), str(f.notes), 'independent', true);
      } else propose('models.json', model.id, model, update(model, text), 'Update model facts; verify the source supports this exact model');
    }
  } else if (kind === 'missing-model') {
    const name = str(f.model), id = slug(name);
    if (!id || repo.models.some((m) => m.id === id || norm(m.name) === norm(name))) problem('A model with this id/name already exists, or the id is empty.');
    const cat = cats[CATEGORIES.indexOf(str(f.category))];
    const details = pairs(str(f.details));
    if (!details.some((p) => p.key === 'maker') || !details.some((p) => p.key === 'open_weights')) problem('Details must include maker and open_weights: yes/no.');
    const m = update({ id, name, provider: '', category: cat, open_weights: false, source }, str(f.details));
    propose('models.json', id, null, m, 'New model identity requires maker confirmation');
    if (str(f.results)) out.warnings.push('Add the new model first, then submit its results with the assigned model id. No results for an unknown model are imported.');
  } else if (kind === 'new-provider') {
    if (!model) problem('Unknown model id.');
    else {
      const details = Object.fromEntries(pairs(str(f.details)).map((p) => [p.key, p.value]));
      if (str(f.kind).startsWith('API') || str(f.kind) === 'Hosted service') {
        out.warnings.push('The catalogue supports one primary API per model. This proposal replaces that slot; a maintainer must choose whether to do so.');
        if (!details.provider) problem('API details need provider: name.');
        const m = structuredClone(model); m.api = { url: source, provider: details.provider };
        const pricing = Object.entries(details).filter(([k]) => k !== 'provider').map(([k, v]) => `${k}: ${v}`).join('\n');
        const changed = update(m, pricing);
        if ((model.category ?? 'llm') !== 'llm' && changed.api) changed.api.unit = ({image:'image', video:'video-second',tts:'1M-chars',stt:'audio-minute'} as const)[model.category as Exclude<Category, 'llm'>];
        propose('models.json', model.id, model, changed, 'Propose a primary API; do not discard a current option without review');
      } else {
        const gb = parseSize(details.size ?? '');
        if (!gb || !details.quant || !details.command || Object.keys(details).some((k) => !['command','quant','size'].includes(k))) problem('Local details need only command, quant and positive size.');
        const selected = typeof f.platforms === 'object' && !Array.isArray(f.platforms) ? f.platforms : {};
        const platforms = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
        let platform: Variant['platform'];
        if (platforms.length === 1 && platforms[0] === 'Apple Silicon') platform = 'mac';
        else if (platforms.length === 1 && platforms[0] === 'NVIDIA') platform = 'nvidia';
        else if (platforms.length === 3 && ['Apple Silicon','NVIDIA','CPU only'].every((p) => platforms.includes(p))) platform = 'any';
        else problem('The current schema can represent Mac, NVIDIA, or all Mac/NVIDIA/CPU. Other platform combinations need a schema review.');
        if (gb && platform && details.quant && details.command) {
          const m = structuredClone(model); m.local ??= { variants: [] };
          if (!m.local.variants.some((v) => v.cmd === details.command)) m.local.variants.push({ quant: details.quant, gb, cmd: details.command, platform, source });
          propose('models.json', m.id, model, m, 'Review runtime, complete loaded memory and each claimed platform; command has NOT been executed');
        }
      }
    }
  } else if (kind === 'new-benchmark') {
    const id = slug(str(f.name));
    if (!id || repo.benchmarks.some((b) => b.id === id)) problem('Benchmark id is empty or already exists.');
    const scale = str(f.scale);
    const b: Benchmark = { id, name: str(f.name), category: cats[CATEGORIES.indexOf(str(f.category))], kind: scale.startsWith('Error') ? 'err' : scale.startsWith('Elo') ? 'elo' : 'acc', url: source };
    propose('benchmarks.json', id, null, b, 'Review benchmark protocol and raw scale before importing results'); sourceReview();
  }
  // Detect duplicate/conflicting proposed result keys within the same issue.
  const keys = new Set<string>();
  for (const c of out.changes) { const key = `${c.file}|${c.id}`; if (keys.has(key)) problem(`Duplicate proposed change: ${c.id}`); keys.add(key); }
  if (out.problems.length) out.changes = []; // No partial output from malformed forms.
  out.status = out.problems.length ? 'invalid' : out.changes.length || out.sourceProposals.length ? 'needs-review' : 'no-change';
  return out;
}

export function reportText(r: Review): string {
  const safe = (s: string) => s.replace(/[<>]/g, '').replace(/@/g, '＠');
  return [`# Contribution review: ${r.status}`, '', 'Local draft only. No repository files or GitHub state were changed.', '',
    ...r.problems.map((p) => `- Fix: ${safe(p.message)}`), ...r.warnings.map((w) => `- Review: ${safe(w)}`), '',
    ...r.changes.map((c) => `- Proposed ${c.file}: ${safe(c.id)} — ${safe(c.reason)}`), '',
    ...r.evidence.map((e) => `- Source: ${safe(e.source)}; ledger: ${e.ledger ?? 'unreviewed'}; ${e.sha256 ? `SHA-256 ${e.sha256}` : 'not fetched'}`), '',
  ].join('\n');
}
