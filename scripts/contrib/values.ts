// Number, date and unit parsing for contributions, and the SEED.md score rules: accuracy and
// error rates are stored as 0–1 fractions, Elo as the rating, 1–5 style ratings rescaled with the
// benchmark's raw_scale_min/max.

import type { Benchmark } from "../../lib/types.ts";

export type Parsed = { value: number; percent: boolean; raw: string };

// "48.3", "48.3%", "$0.40", "1,234.5", "−2" (unicode minus). Undefined if it isn't one number.
export function parseNumber(s: string): Parsed | undefined {
  const t = s.trim().replace(/[−–]/g, "-").replace(/^\$\s*/, "").replace(/\s*(usd|us\$)$/i, "");
  const m = /^(-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|-?\.\d+)\s*(%?)$/.exec(t);
  if (!m) return undefined;
  const value = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(value) ? { value, percent: m[2] === "%", raw: s.trim() } : undefined;
}

const tidy = (x: number) => Number(x.toPrecision(12));

export type Score = { score?: number; error?: string; warning?: string; candidates: number[] };

// The stored score for a value as printed in the source, plus the printed forms to look for.
export function toScore(given: string, b: Benchmark): Score {
  const n = parseNumber(given);
  if (!n) return { error: `"${given}" isn't a number.`, candidates: [] };
  const x = n.value;
  if (b.kind === "linear") {
    if (n.percent) return { error: `${b.name} uses ${b.unit ?? "raw units"}; write the published value without %.`, candidates: [] };
    return { score: x, candidates: [x] };
  }
  if (b.kind === "elo") {
    if (n.percent) return { error: `${b.name} is an Elo rating: write the rating itself, without %.`, candidates: [] };
    if (!(x > 500 && x < 3000)) return { error: `${x} isn't a plausible Elo rating (500–3000).`, candidates: [] };
    return { score: x, candidates: [x] };
  }
  if (b.raw_scale_min !== undefined && b.raw_scale_max !== undefined) {
    const [lo, hi] = [b.raw_scale_min, b.raw_scale_max];
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return { error: "Benchmark raw scale is invalid.", candidates: [] };
    if (n.percent || x < lo || x > hi) return { error: `${b.name} is reported on a ${lo}–${hi} scale: write the value as printed, e.g. ${tidy((lo + hi) / 2)}.`, candidates: [] };
    return { score: tidy((x - lo) / (hi - lo)), candidates: [x] };
  }
  let score: number, warning: string | undefined;
  if (!n.percent && b.kind === "acc" && x > 1) return { error: `Write ${x}% explicitly, or configure this benchmark’s raw scale before importing.`, candidates: [] };
  if (n.percent) {
    if (b.kind === "acc" && x > 100) return { error: `${given} is more than 100%.`, candidates: [] };
    score = tidy(x / 100);
  } else {
    score = x;
    if (x > 0 && x < 0.1 && b.kind === "acc") warning = `${given} was read as a fraction (${tidy(x * 100)}%). If the source prints ${given}%, add the % sign.`;
    else if (x > 0 && b.kind === "err") warning = `${given} was read as a fraction (${tidy(x * 100)}% error). If the source prints ${given}%, add the % sign.`;
  }
  if (score < 0) return { error: `${given} is negative.`, candidates: [] };
  return { score, warning, candidates: [...new Set([x, tidy(x / 100), tidy(x * 100)])] };
}

// Context windows in thousands of tokens, as data/models.json stores them: "256k" → 256,
// "1M" → 1000, "262144" or "262,144 tokens" → 262.144.
export function parseContext(s: string): number | undefined {
  const m = /^([\d.,]+)\s*([kKmM]?)\s*(tokens?)?$/.exec(s.trim());
  if (!m) return undefined;
  const x = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(x) || x <= 0) return undefined;
  const k = m[2].toLowerCase() === "m" ? x * 1000 : m[2] ? x : x >= 1000 ? x / 1000 : undefined;
  return k === undefined ? undefined : tidy(k);
}

// Parameters in billions: "30.5B", "350M", "1T", "8.19".
export function parseParams(s: string): number | undefined {
  const m = /^([\d.]+)\s*([bmtBMT]?)\s*(parameters|params)?$/.exec(s.trim());
  if (!m) return undefined;
  const x = Number(m[1]), u = m[2].toLowerCase();
  if (!Number.isFinite(x) || x <= 0) return undefined;
  return tidy(u === "m" ? x / 1000 : u === "t" ? x * 1000 : x);
}

// Download or memory size in GB: "5.2 GB", "870MB", "4.7 GiB".
export function parseSize(s: string): number | undefined {
  const m = /^([\d.,]+)\s*(gb|gib|mb|mib|tb)?$/i.exec(s.trim());
  if (!m) return undefined;
  const x = Number(m[1].replace(/,/g, "")), u = (m[2] ?? "gb").toLowerCase();
  const gb = u === "mb" ? x / 1000 : u === "mib" ? (x * 1.048576) / 1000 : u === "gib" ? x * 1.073741824 : u === "tb" ? x * 1000 : x;
  return Number.isFinite(gb) && gb > 0 ? Math.round(gb * 100) / 100 : undefined;
}

export const UNITS = { image: "image", video_second: "video-second", "1m_chars": "1M-chars", audio_minute: "audio-minute" } as const;
const UNIT_WORDS: [RegExp, (typeof UNITS)[keyof typeof UNITS]][] = [
  [/^(image|images|img)$/, "image"],
  [/^(video[ -]?)?(second|seconds|sec|s)( of video)?$/, "video-second"],
  [/^(1m|1 ?million|million)[ -]?(chars?|characters?)$/, "1M-chars"],
  [/^(audio[ -]?)?(minute|minutes|min)( of audio)?$/, "audio-minute"],
];

// "0.04 per image", "$0.10/second", "15 per 1M characters", "0.006 per minute".
export function parseUnitPrice(s: string): { price: number; unit: string } | undefined {
  const m = /^\$?\s*([\d.,]+)\s*(?:usd)?\s*(?:per|\/)\s*(.+)$/i.exec(s.trim());
  if (!m) return undefined;
  const price = Number(m[1].replace(/,/g, ""));
  const unit = UNIT_WORDS.find(([re]) => re.test(m[2].trim().toLowerCase()))?.[1];
  return unit && Number.isFinite(price) && price >= 0 ? { price, unit } : undefined;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Release month as YYYY-MM: "2026-03", "2026-03-15", "March 2026", "Mar 2026".
export function parseMonth(s: string, now = new Date()): string | undefined {
  const t = s.trim().toLowerCase();
  let y: number, mo: number;
  const iso = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(t);
  const named = /^([a-z]{3})[a-z]*\.?,?\s+(\d{4})$/.exec(t);
  if (iso) [y, mo] = [Number(iso[1]), Number(iso[2])];
  else if (named && MONTHS.includes(named[1])) [y, mo] = [Number(named[2]), MONTHS.indexOf(named[1]) + 1];
  else return undefined;
  if (mo < 1 || mo > 12 || y < 1990 || y > now.getUTCFullYear() + 1) return undefined;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

// Forms a release month may be printed in, for checking it against the source.
export function monthForms(ym: string): string[] {
  const [y, m] = ym.split("-");
  const name = new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleString("en", { month: "long", timeZone: "UTC" });
  return [ym, `${y}/${m}`, `${name} ${y}`, `${name.slice(0, 3)} ${y}`];
}

// Licence ids as data/models.json writes them: lowercase SPDX-like ("apache-2.0", "cc-by-4.0").
export function normLicence(s: string): string | undefined {
  const t = s.trim().toLowerCase().replace(/licen[cs]e$/, "").trim();
  const known: [RegExp, string][] = [
    [/^apache[ -]?(licen[cs]e[ ,]*)?(v(ersion)?\s*)?2(\.0)?$/, "apache-2.0"], [/^mit$/, "mit"],
    [/^cc[ -]?by[ -]?4(\.0)?$/, "cc-by-4.0"], [/^cc[ -]?by[ -]?sa[ -]?4(\.0)?$/, "cc-by-sa-4.0"],
    [/^cc[ -]?by[ -]?nc[ -]?4(\.0)?$/, "cc-by-nc-4.0"], [/^cc0([ -]?1(\.0)?)?$/, "cc0-1.0"], [/^(proprietary|closed)$/, "proprietary"],
  ];
  const hit = known.find(([re]) => re.test(t));
  if (hit) return hit[1];
  const id = t.replace(/\s+/g, "-");
  return /^[a-z0-9][a-z0-9.+-]{0,59}$/.test(id) ? id : undefined;
}

export const yesNo = (s: string) => (/^(yes|y|true|open)$/i.test(s.trim()) ? true : /^(no|n|false|closed)$/i.test(s.trim()) ? false : undefined);

// ids like data/models.json: "Qwen3.5 9B" → "qwen3-5-9b".
export const slug = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ""); // the same as scripts/import.ts

// Up to three known ids that look like `wanted`, for "did you mean" hints.
export function closest(wanted: string, items: { id: string; name: string }[]): string[] {
  const w = norm(wanted), tokens = wanted.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
  const scored = items.map((x) => {
    const n = norm(x.name), i = norm(x.id);
    let s = 0;
    if (n === w || i === w) s += 100;
    if (i.startsWith(w) || n.startsWith(w)) s += 20;
    if (w.length > 3 && (i.includes(w) || n.includes(w))) s += 10;
    for (const t of tokens) if (x.id.includes(t) || x.name.toLowerCase().includes(t)) s += t.length;
    return { id: x.id, s };
  }).filter((x) => x.s > 2).sort((a, b) => b.s - a.s || a.id.length - b.id.length);
  return scored.slice(0, 3).map((x) => x.id);
}

// Every number written in a text ("262,144", "48.3", "0.483"), to check claimed values against.
export function numbersIn(text: string): number[] {
  return [...text.matchAll(/(?<![\w.])-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|(?<![\w\d])\.\d+/g)].map((m) => Number(m[0].replace(/,/g, ""))).filter(Number.isFinite);
}

export function findNumber(numbers: number[], candidates: number[]): number | undefined {
  for (const c of candidates) {
    const hit = numbers.find((n) => Math.abs(n - c) <= Math.max(1e-9, Math.abs(c) * 1e-9));
    if (hit !== undefined) return c;
  }
  return undefined;
}
