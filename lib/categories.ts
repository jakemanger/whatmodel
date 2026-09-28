// Each category is its own leaderboard with its own benchmarks, price unit and speed unit.

import type { Api, Category, Model, SpeedUnit } from "./types.ts";

type Cat = {
  id: Category;
  path: string;
  title: string; // "find the best ___ you can run"
  priceUnit: string; // shown after "$x/"
  speedUnit: SpeedUnit;
};

export const CATEGORIES: Record<Category, Cat> = {
  llm: { id: "llm", path: "/", title: "AI models", priceUnit: "M", speedUnit: "tok/s" },
  image: { id: "image", path: "/image", title: "image models", priceUnit: "image", speedUnit: "s/image" },
  video: { id: "video", path: "/video", title: "video models", priceUnit: "sec", speedUnit: "s/video" },
  tts: { id: "tts", path: "/tts", title: "text-to-speech models", priceUnit: "M chars", speedUnit: "x-realtime" },
  stt: { id: "stt", path: "/stt", title: "speech-to-text models", priceUnit: "audio min", speedUnit: "x-realtime" },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as Category[];
export const isCategory = (s: string | null | undefined): s is Category => !!s && s in CATEGORIES;
export const catOf = (m: Model): Category => m.category ?? "llm";

// Price in the category's unit. LLMs blend input and output 3:1, like most chat traffic.
export function priceOf(api: Api | null | undefined): number | null {
  if (!api) return null;
  if (api.price_in !== undefined && api.price_out !== undefined) return (3 * api.price_in + api.price_out) / 4;
  return api.price ?? null;
}

// Budget steps for the price picker: round numbers spanning the category's prices.
export function priceSteps(prices: number[]): { steps: number[]; top: number } {
  const nice = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200];
  const sorted = prices.filter((p) => p > 0).sort((a, b) => a - b);
  if (!sorted.length) return { steps: [0], top: 0 };
  const lo = sorted[0];
  const top = nice.find((n) => n >= sorted.at(-1)!) ?? Math.ceil(sorted.at(-1)!);
  const inside = nice.filter((n) => n >= lo && n < top);
  const every = Math.max(1, Math.ceil(inside.length / 6));
  return { steps: [0, ...inside.filter((_, i) => i % every === 0)], top };
}
