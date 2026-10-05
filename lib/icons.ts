// Maker logos. data/icons.json records each logo's official source: the image URL as its owner
// publishes it and the owner's page that links it. npm run icons turns each entry into
// icons/providers/<id>.png (64×64). A model shows its family's mark when the entry lists it under
// `models` for the model's provider, and its provider's mark otherwise. Logos are trademarks of
// their owners, shown only to identify the maker, and are not covered by the data licence.

import list from "../data/icons.json" with { type: "json" };
import type { Model } from "./types.ts";

export type MakerIcon = {
  id: string; // icons/providers/<id>.png
  name: string; // whose mark it is, for alt text and credits
  providers: string[]; // Model.provider values that show it
  models?: Record<string, string[]>; // family marks: provider -> model ids, or id prefixes ending in *
  url: string; // the image, as published by its owner
  page: string; // the owner's page that links or shows it
  retrieved: string; // YYYY-MM-DD
  note?: string;
};

export const ICONS = list as MakerIcon[];
export const ICON_SIZE = 64;

export const matchesId = (pattern: string, id: string) =>
  pattern.endsWith("*") ? id.startsWith(pattern.slice(0, -1)) : id === pattern;

// A lookup over a list of entries. For a model, an exact family id beats the longest matching
// prefix, which beats the provider's own mark. Family marks only apply within their provider, so
// a community fine-tune of Gemma keeps its own maker's logo.
export function iconResolver(entries: MakerIcon[]) {
  const byProvider = new Map(entries.flatMap((e) => e.providers.map((p) => [p, e] as const)));
  const families = entries.flatMap((e) =>
    Object.entries(e.models ?? {}).flatMap(([provider, ids]) => ids.map((id) => ({ provider, id, e }))));
  return {
    provider: (provider: string) => byProvider.get(provider),
    model(m: Pick<Model, "id" | "provider">) {
      let best: MakerIcon | undefined, rank = -1;
      for (const f of families) {
        if (f.provider !== m.provider || !matchesId(f.id, m.id)) continue;
        const r = f.id.endsWith("*") ? f.id.length : Infinity;
        if (r > rank) [best, rank] = [f.e, r];
      }
      return best ?? byProvider.get(m.provider);
    },
  };
}

const resolver = iconResolver(ICONS);

// The full entry, for alt text (name) or a credit link (page).
export const iconEntry = (m: Pick<Model, "id" | "provider">) => resolver.model(m);

// Paths under icons/ without the extension, like sourceIcon: render `/icons/${icon}.png`.
export const iconPath = (e: MakerIcon) => `providers/${e.id}`;
export function modelIcon(m: Pick<Model, "id" | "provider">): string | undefined {
  const e = resolver.model(m);
  return e && iconPath(e);
}
export function providerIcon(provider: string): string | undefined {
  const e = resolver.provider(provider);
  return e && iconPath(e);
}

// Width and height from a PNG header, or undefined if it isn't a PNG.
export function pngSize(b: Uint8Array): { width: number; height: number } | undefined {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 24 || sig.some((x, i) => b[i] !== x)) return undefined;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: v.getUint32(16), height: v.getUint32(20) };
}
