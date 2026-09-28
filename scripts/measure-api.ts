// Measures API speed ourselves, so the numbers are ours to publish. For each target in
// data/api-targets.json it streams a fixed prompt three times through OpenRouter, pinned to the
// provider whose price we list, and records time to first token and output tokens per second.
//
//   node --env-file=.env.local scripts/measure-api.ts [--only id,id] [--runs 3] [--dry]
//
// Needs OPENROUTER_API_KEY. Results go to data/api-speed.json (raw runs, with dates) and, when
// the serving provider matches the listed price's provider, to models.json api.tps.
import { readFileSync, writeFileSync } from "node:fs";
import type { Model } from "../lib/types.ts";

type Target = { model: string; slug: string; provider: string; reasoning?: "none" | "low" | "medium" };
type Run = { ttft_s: number; tps: number; out_tokens: number; hidden_reasoning: number; provider: string | null; at: string };
type Entry = { model: string; slug: string; provider: string; setting: string; runs: Run[]; ttft_s: number; tps: number; measured: string };

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const RUNS = Number(opt("--runs") ?? 3), ONLY = opt("--only")?.split(","), DRY = args.includes("--dry");
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY && !DRY) throw new Error("set OPENROUTER_API_KEY in .env.local (run with --env-file=.env.local)");

const file = (name: string) => new URL(`../data/${name}.json`, import.meta.url);
const load = <T>(name: string, fallback?: T): T => {
  try { return JSON.parse(readFileSync(file(name), "utf8")); } catch (e) { if (fallback !== undefined) return fallback; throw e; }
};
const save = (name: string, v: unknown) => writeFileSync(file(name), JSON.stringify(v, null, 2) + "\n");

// About 1,000 input tokens, asking for a long answer, so each run streams a few hundred tokens.
const NOTES = "The gardener has a small backyard, about four hours of free time each week, a modest budget, clay soil that drains slowly, a mild climate with a dry summer, curious children who want to help, a compost bin that has never been used, and neighbours who grow tomatoes, beans and pumpkins with mixed success. ";
const PROMPT = `Write a detailed, practical guide of about 600 words for someone setting up their first home vegetable garden. Use short sections with plain headings.\n\nBackground notes, repeated from several conversations:\n${NOTES.repeat(14)}`;
const MAX_TOKENS = 1200;

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[(xs.length - 1) >> 1];

async function once(t: Target): Promise<Run> {
  const started = performance.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "whatmodel.sh speed measurement" },
    body: JSON.stringify({
      model: t.slug,
      messages: [{ role: "user", content: PROMPT }],
      max_tokens: MAX_TOKENS,
      temperature: 0,
      stream: true,
      usage: { include: true },
      provider: { order: [t.provider], allow_fallbacks: false },
      ...(t.reasoning ? { reasoning: { effort: t.reasoning } } : {}),
    }),
  });
  if (!res.ok || !res.body) throw new Error(`${t.model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);

  let first: number | null = null, last = started, buf = "", provider: string | null = null;
  let usage: { completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } } | null = null;
  let streamedReasoning = false;
  const reader = res.body.getReader(), dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line.startsWith("data:") || line === "data: [DONE]") continue;
      const chunk = JSON.parse(line.slice(5));
      if (chunk.error) throw new Error(`${t.model}: ${JSON.stringify(chunk.error).slice(0, 200)}`);
      provider ??= chunk.provider ?? null;
      const delta = chunk.choices?.[0]?.delta ?? {};
      const text = (delta.content ?? "") + (delta.reasoning ?? "");
      if (delta.reasoning) streamedReasoning = true;
      if (text) { const now = performance.now(); first ??= now; last = now; }
      if (chunk.usage) usage = chunk.usage;
    }
  }
  if (first === null || !usage?.completion_tokens) throw new Error(`${t.model}: no streamed tokens or usage`);
  // Reasoning a provider hides arrives before the first visible token, so it isn't part of the streaming window.
  const hidden = streamedReasoning ? 0 : usage.completion_tokens_details?.reasoning_tokens ?? 0;
  const visible = usage.completion_tokens - hidden, window = (last - first) / 1000;
  if (visible < 50 || window <= 0) throw new Error(`${t.model}: too little streamed output to time (${visible} tokens)`);
  return { ttft_s: (first - started) / 1000, tps: visible / window, out_tokens: usage.completion_tokens, hidden_reasoning: hidden, provider, at: new Date().toISOString() };
}

const targets = load<Target[]>("api-targets").filter((t) => !ONLY || ONLY.includes(t.model));
const models = load<Model[]>("models"), byId = new Map(models.map((m) => [m.id, m]));
const out = load<Entry[]>("api-speed", []);
const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

for (const t of targets) {
  if (!byId.has(t.model)) { console.log(`skip ${t.model}: not in models.json`); continue; }
  if (DRY) { console.log(`would measure ${t.model} via ${t.slug} @ ${t.provider}`); continue; }
  const runs: Run[] = [];
  for (let i = 0; i < RUNS; i++) {
    try { runs.push(await once(t)); } catch (e) { console.log(`  ${e instanceof Error ? e.message : e}`); }
  }
  const served = runs.filter((r) => norm(r.provider).startsWith(norm(t.provider).slice(0, 6)));
  if (served.length < Math.min(2, RUNS)) { console.log(`✗ ${t.model}: ${runs.length} runs, ${served.length} served by ${t.provider}`); continue; }
  const e: Entry = {
    model: t.model, slug: t.slug, provider: t.provider,
    setting: `OpenRouter pinned to ${t.provider}, no fallbacks; ~1,000-token prompt, max ${MAX_TOKENS} output tokens, temperature 0${t.reasoning ? `, reasoning effort ${t.reasoning}` : ""}; streamed; median of ${served.length} runs`,
    runs: served, ttft_s: +median(served.map((r) => r.ttft_s)).toFixed(2), tps: +median(served.map((r) => r.tps)).toFixed(1), measured: served[0].at.slice(0, 10),
  };
  const i = out.findIndex((x) => x.model === t.model);
  if (i >= 0) out[i] = e; else out.push(e);
  // Only attach the speed when it was measured on the provider whose price we show.
  const m = byId.get(t.model)!;
  if (m.api && norm(m.api.provider).startsWith(norm(t.provider).slice(0, 6))) {
    m.api.tps = e.tps;
    m.api.tps_source = `https://whatmodel.sh/data/api-speed.json#${t.model}`;
  }
  console.log(`✓ ${t.model.padEnd(32)} ${String(e.tps).padStart(7)} tok/s   first token ${e.ttft_s}s   (${t.provider})`);
  save("api-speed", out);
  save("models", models);
}
