// Where numbers come from, and whether we're allowed to use them. data/sources.json is the
// ledger: each entry matches URLs by prefix (host + optional path), records the licence or terms
// we checked, and how to credit it. npm run check fails on any number from an unlisted or
// not-allowed source. Icons live in icons/<icon>.png (npm run icons).

import ledger from "../data/sources.json" with { type: "json" };

export type Source = {
  id: string;
  match: string[]; // URL prefixes without scheme or www, e.g. "huggingface.co/datasets/lmarena-ai/"
  exact?: boolean; // restrict to the listed files, not descendants
  fragments?: string[]; // archive members reviewed separately from the rest of an archive
  name: string;
  kind: "leaderboard" | "dataset" | "first-party" | "paper" | "community" | "spec";
  license: string; // e.g. "CC BY 4.0", or "first-party publication"
  license_url?: string;
  terms_url: string;
  quote?: string; // the clause the verdict rests on
  verdict: "allowed" | "not-allowed" | "unclear";
  attribution?: string; // credit line a licence asks for
  icon?: string; // icons/<icon>.png
  checked: string; // YYYY-MM-DD
};

export const SOURCES = ledger as Source[];

export const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// The ledger entry for a URL: the longest matching prefix wins, so a dataset on
// huggingface.co isn't mistaken for a model card.
export const sourceOf = (url: string): Source | undefined => sourceIn(SOURCES, url);

// The same lookup in any ledger, e.g. one with a proposed entry added (scripts/contrib).
export function sourceIn(sources: Source[], url: string): Source | undefined {
  let u: URL;
  try { u = new URL(url); } catch { return undefined; }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return undefined;
  let best: Source | undefined, len = -1;
  for (const s of sources) {
    if (s.fragments && !s.fragments.includes(u.hash.slice(1))) continue;
    for (const m of s.match) {
      const scope = new URL(`https://${m}`);
      if (scope.hash && scope.hash !== u.hash) continue;
      const path = scope.pathname.replace(/\/$/, "");
      if (u.hostname.replace(/^www\./, "") === scope.hostname.replace(/^www\./, "") &&
          (u.pathname === path || (!s.exact && u.pathname.startsWith(`${path}/`))) && m.length > len)
        [best, len] = [s, m.length];
    }
  }
  return best;
}

export const sourceId = (url: string) => sourceOf(url)?.id ?? host(url);
export const sourceName = (url: string) => sourceOf(url)?.name ?? host(url);
export const sourceIcon = (url: string) => sourceOf(url)?.icon ?? host(url);
