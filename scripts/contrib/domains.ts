// Which pages count as a maker's or provider's own, for first-party facts (price, context window,
// release date, licence, size). Owner policy 2026-09-25: a vendor's own published facts about its
// own model or endpoint, never an aggregator, and never benchmark scores.

import type { MakerIcon } from "../../lib/icons.ts";
import type { Model } from "../../lib/types.ts";

// Never usable, whatever the page says (UPDATING.md, CONTRIBUTING.md).
export const AGGREGATORS = ["artificialanalysis.ai", "openrouter.ai", "arena.ai", "lmarena.ai", "llm-stats.com", "pricepertoken.com",
  "llmpricecheck.com", "helicone.ai", "klu.ai", "vellum.ai", "docsbot.ai", "aimodels.fyi", "huggingface.co/spaces/lmarena-ai"];

// Hosts shared by many owners: only a path under the owner's account counts there.
const SHARED = new Set(["huggingface.co", "github.com", "gitlab.com", "modelscope.cn"]);
// Hosts that never prove ownership (CDNs, social media, blogs anyone can post to).
const NEVER = /(^|\.)(githubusercontent\.com|hf\.co|cdn-avatars\.huggingface\.co|medium\.com|substack\.com|x\.com|twitter\.com|linkedin\.com|reddit\.com|youtube\.com|wikipedia\.org|wikimedia\.org|arxiv\.org)$/;
// Second-level suffixes where the registrable domain has three labels.
const SLD = /\.(co|com|net|org|ac|gov|edu)\.[a-z]{2}$/;

export const hostOf = (url: string) => { try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } };
export const registrable = (host: string) => host.split(".").slice(SLD.test(host) ? -3 : -2).join(".");

export function aggregator(url: string): string | undefined {
  const host = hostOf(url);
  if (!host) return undefined;
  const at = `${host}${new URL(url).pathname.toLowerCase()}`;
  return AGGREGATORS.find((a) => (a.includes("/") ? at === a || at.startsWith(`${a}/`) : host === a || host.endsWith(`.${a}`)));
}

// A scope is a registrable domain ("anthropic.com") or an account on a shared host
// ("huggingface.co/Qwen", "github.com/QwenLM").
export type Scope = { scope: string; why: string };

function scopeOf(url: string | undefined, why: string): Scope | undefined {
  if (!url) return undefined;
  let u: URL;
  try { u = new URL(url); } catch { return undefined; }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (NEVER.test(host)) return undefined;
  if (SHARED.has(host)) {
    const parts = u.pathname.split("/").filter(Boolean);
    const owner = parts[0] === "datasets" || parts[0] === "spaces" ? parts[1] : parts[0];
    return owner ? { scope: `${host}/${owner.toLowerCase()}`, why } : undefined;
  }
  return { scope: host, why };
}

export function inScope(url: string, scopes: Scope[]): Scope | undefined {
  const s = scopeOf(url, "");
  return s && scopes.find((x) => x.scope === s.scope || (!x.scope.includes("/") && s.scope.endsWith(`.${x.scope}`)));
}

const add = (out: Scope[], s: Scope | undefined) => { if (s && !out.some((x) => x.scope === s.scope || (!x.scope.includes("/") && s.scope.endsWith(`.${x.scope}`)))) out.push(s); };

// The maker's own pages: its logo entry's official page, its models' Hugging Face or GitHub
// accounts, and API pages it serves itself.
export function makerScopes(provider: string, models: Model[], icons: MakerIcon[]): Scope[] {
  const out: Scope[] = [];
  const icon = icons.find((e) => e.providers.includes(provider));
  add(out, scopeOf(icon?.page, `${provider}'s official page in data/icons.json`));
  for (const m of models.filter((x) => x.provider === provider)) {
    add(out, scopeOf(m.model_repo, `${provider}'s model repository (${m.id})`));
    if (m.api && m.api.provider === provider) add(out, scopeOf(m.api.url, `${provider}'s own API page (${m.id})`));
  }
  return out;
}

// The serving provider's own pages, for a price: hosts of its API links across the catalogue.
export function servingScopes(apiProvider: string, models: Model[], icons: MakerIcon[]): Scope[] {
  const out: Scope[] = [];
  for (const m of models) if (m.api?.provider === apiProvider) add(out, scopeOf(m.api.url, `${apiProvider}'s API page (${m.id})`));
  if (!out.length) for (const s of makerScopes(apiProvider, models, icons)) add(out, s);
  return out;
}

export function modelScopes(model: Model, models: Model[], icons: MakerIcon[]) {
  const maker = makerScopes(model.provider, models, icons);
  add(maker, scopeOf(model.model_repo, `${model.id}'s model repository`));
  const serving = model.api?.provider ? servingScopes(model.api.provider, models, icons) : [];
  add(serving, scopeOf(model.api?.url, `${model.id}'s API page`));
  return { maker, serving };
}

export const describeScopes = (scopes: Scope[]) => scopes.map((s) => s.scope).slice(0, 6).join(", ") || "none known yet";
