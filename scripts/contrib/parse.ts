// Reads a GitHub issue-form body ("### Label" sections, "_No response_", "- [X] option" lists)
// into the form's field ids. Untrusted input: nothing here is executed or interpolated.

import { FORMS, KINDS, formFor, type Kind } from "./forms.ts";

export type Problem = { field?: string; line?: string; message: string; expected?: string };
export type Value = string | string[] | Record<string, boolean>;
export type Fields = Record<string, Value>;

export const MAX_BODY = 20_000;

// Labels used by the forms before the bot existed, so older issues still parse.
const LEGACY: Record<string, Record<string, string>> = {
  "paper-results": { "Paper or source link": "source", "Models and scores": "results" },
  "wrong-number": { "What's wrong": "field" },
  "new-provider": { "Price, size and command": "details" },
  "missing-model": { "Official page, weights or API docs": "links", "Published benchmark results": "results" },
};

export function sections(body: string): Map<string, string> {
  const out = new Map<string, string>();
  let label: string | undefined, lines: string[] = [];
  const flush = () => { if (label !== undefined && !out.has(label)) out.set(label, clean(lines.join("\n"))); };
  for (const line of body.replace(/\r\n?/g, "\n").split("\n")) {
    const h = /^###\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) { flush(); label = h[1].trim(); lines = []; } else lines.push(line);
  }
  flush();
  return out;
}

// Strips the code fence GitHub adds around `render:` textareas and the empty-answer marker.
function clean(s: string) {
  let t = s.trim();
  const fence = /^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n?\1\s*$/.exec(t);
  if (fence) t = fence[2].trim();
  return t === "_No response_" ? "" : t;
}

const labelsOf = (kind: Kind) => new Map([
  ...formFor(kind).fields.map((f) => [f.label, f.id] as const),
  ...Object.entries(LEGACY[kind] ?? {}),
]);

// The form an issue came from: its kind label, or else the form whose headings it has.
export function detectKind(labels: string[], body: string): Kind | undefined {
  const byLabel = KINDS.filter((k) => labels.includes(k));
  if (byLabel.length === 1) return byLabel[0];
  if (byLabel.length > 1) return undefined;
  const heads = [...sections(body).keys()];
  let best: Kind | undefined, score = 0;
  for (const f of FORMS) {
    const known = labelsOf(f.kind);
    const required = f.fields.filter((x) => x.required).map((x) => x.id);
    const ids = new Set(heads.map((h) => known.get(h)).filter(Boolean));
    if (!required.every((id) => ids.has(id))) continue;
    if (ids.size > score) [best, score] = [f.kind, ids.size];
  }
  return best;
}

export function readForm(kind: Kind, body: string): { fields: Fields; problems: Problem[] } {
  const problems: Problem[] = [];
  const fields: Fields = {};
  const known = labelsOf(kind);
  const got = new Map<string, string>();
  const seen = new Set<string>();
  for (const match of body.matchAll(/^###\s+(.+?)\s*#*\s*$/gm)) {
    const id = known.get(match[1].trim());
    if (id && seen.has(id)) problems.push({ field: match[1], message: "Duplicate form section; keep exactly one answer per field." });
    if (id) seen.add(id);
  }
  for (const [label, text] of sections(body)) {
    const id = known.get(label);
    if (id && !got.has(id)) got.set(id, text);
  }
  for (const f of formFor(kind).fields) {
    const text = got.get(f.id);
    if (text === undefined) {
      if (f.required) problems.push({ field: f.label, message: `The "${f.label}" section is missing. Please keep the form's headings when you edit the issue.`, expected: `### ${f.label}` });
      fields[f.id] = f.type === "checkboxes" ? {} : f.multiple ? [] : "";
      continue;
    }
    if (f.type === "checkboxes") {
      const ticks: Record<string, boolean> = {};
      for (const m of text.matchAll(/^\s*[-*]\s*\[([ xX])\]\s*(.+?)\s*$/gm)) ticks[m[2]] = m[1] !== " ";
      fields[f.id] = ticks;
      if (f.requiredOptions && f.options!.some((o) => !ticks[o])) problems.push({ field: f.label, message: `Please tick "${f.options![0]}".` });
    } else if (f.type === "dropdown") {
      const picked = f.multiple ? splitOptions(text, f.options!) : text ? [text] : [];
      const bad = picked.filter((p) => !f.options!.includes(p));
      if (bad.length) problems.push({ field: f.label, line: bad.join(", "), message: `"${f.label}" must be one of the listed options.`, expected: f.options!.join(" / ") });
      fields[f.id] = f.multiple ? picked : picked[0] ?? "";
    } else fields[f.id] = text;
    if (f.required && isEmpty(fields[f.id]) && f.type !== "checkboxes")
      problems.push({ field: f.label, message: `"${f.label}" is required.` });
  }
  return { fields, problems };
}

const isEmpty = (v: Value) => (typeof v === "string" ? !v.trim() : Array.isArray(v) ? !v.length : !Object.keys(v).length);

// A multiple-choice dropdown answer is "A, B": options can contain commas, so match whole options.
function splitOptions(text: string, options: string[]) {
  const out: string[] = [];
  let rest = text.trim();
  while (rest) {
    const hit = [...options].sort((a, b) => b.length - a.length).find((o) => rest === o || rest.startsWith(`${o},`));
    const next = hit ?? rest.split(",")[0].trim();
    out.push(next);
    rest = rest.slice((hit ?? rest.split(",")[0]).length).replace(/^\s*,\s*/, "");
  }
  return out;
}

export const str = (v: Value | undefined) => (typeof v === "string" ? v.trim() : "");

// "key: value" lines (also "key = value", optional "- " bullets). Keys are lowercased with
// spaces and dashes as underscores.
export function keyValues(text: string, field: string): { pairs: { key: string; value: string; line: string }[]; problems: Problem[] } {
  const pairs: { key: string; value: string; line: string }[] = [], problems: Problem[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim().replace(/^[-*]\s+/, "");
    if (!line) continue;
    const m = /^([A-Za-z][A-Za-z _-]{0,30}?)\s*[:=]\s*(.+)$/.exec(line);
    if (!m) { problems.push({ field, line, message: "This line isn't in `field: value` form.", expected: "context: 256k" }); continue; }
    pairs.push({ key: m[1].trim().toLowerCase().replace(/[\s-]+/g, "_"), value: m[2].trim(), line });
  }
  return { pairs, problems };
}

// Result lines: cells split on "|", a tab or " · " (the old format). Blank lines are skipped.
export function resultLines(text: string): { cells: string[]; line: string }[] {
  return text.split("\n").map((l) => l.trim().replace(/^[-*]\s+/, "")).filter((l) => l && !/^(```|~~~)/.test(l))
    .map((line) => ({ line, cells: line.split(/\s*\|\s*|\t+|\s+·\s+/).map((c) => c.trim()).filter((c, i, a) => c || (i > 0 && i < a.length - 1)) }));
}
