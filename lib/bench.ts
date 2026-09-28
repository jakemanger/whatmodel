// Results from bench.sh. One schema serves three places: the /bench review page, the
// database's submit_bench() check (scripts/bench-sql.ts turns it into SQL), and the review script.
// Strings are limited to plain characters, so a submission can't carry markup.

type Schema = {
  type?: string | string[];
  enum?: unknown[];
  pattern?: string;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: false;
};

const text = (pattern: string, maxLength: number): Schema => ({ type: ["string", "null"], pattern, maxLength });
const int = (minimum: number, maximum: number): Schema => ({ type: ["integer", "null"], minimum, maximum });
const series = (item: Schema): Schema => ({ type: "array", maxItems: 10, items: item });

const run: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["model", "quant", "tg"],
  properties: {
    model: { type: "string", pattern: "^[A-Za-z0-9._:/-]+$", maxLength: 80 },
    digest: text("^[a-f0-9]{64}$", 64),
    quant: text("^[A-Za-z0-9_.-]*$", 20),
    params: text("^[A-Za-z0-9.]*$", 12),
    bytes: int(0, 2e12),
    gpu_pct: int(0, 100),
    ctx: int(0, 1e7),
    load_s: { type: ["number", "null"], minimum: 0, maximum: 3600 },
    prompt_tokens: series(int(0, 1e5)),
    pp: series({ type: ["number", "null"], minimum: 0, maximum: 1e6 }),
    gen_tokens: series(int(0, 1e5)),
    tg: series({ type: ["number", "null"], minimum: 0, maximum: 1e5 }),
    ms: series(int(0, 3.6e6)),
  },
};

export const BENCH_SCHEMA: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["v", "at", "nonce", "os", "engine", "engine_version", "tokens", "runs"],
  properties: {
    v: { enum: [1] },
    at: { type: "string", pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$", maxLength: 20 },
    nonce: text("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", 36),
    os: { enum: ["macos", "linux"] },
    os_version: text("^[A-Za-z0-9._+-]*$", 40),
    cpu: text("^[A-Za-z0-9 ._()@+-]*$", 80),
    gpu: text("^[A-Za-z0-9 ._()@+-]*$", 80),
    gpu_cores: int(0, 1000),
    gpus: int(0, 64),
    ram_gb: int(0, 4096),
    vram_gb: int(0, 4096),
    engine: { enum: ["ollama"] },
    engine_version: { type: "string", pattern: "^[A-Za-z0-9._+-]+$", maxLength: 40 },
    tokens: { type: "integer", minimum: 1, maximum: 4096 },
    runs: { type: "array", minItems: 1, maxItems: 20, items: run },
  },
};

export const BENCH_MAX_BYTES = 16384;

// Public by design (also in bench.sh): this key can only call bench_nonce() and submit_bench().
export const BENCH_DB = "https://bphtbupywucfbwjncoqb.supabase.co/rest/v1/rpc";
export const BENCH_DB_KEY = "sb_publishable_10R_ZENqtvIKgveIKJUyEw_q18CtwCQ";

export type BenchRun = {
  model: string; digest: string | null; quant: string | null; params: string | null; bytes: number | null;
  gpu_pct: number | null; ctx: number | null; load_s: number | null;
  prompt_tokens?: (number | null)[]; pp?: (number | null)[]; gen_tokens?: (number | null)[]; tg: (number | null)[]; ms?: (number | null)[];
};
export type Bench = {
  v: 1; at: string; nonce: string | null; os: "macos" | "linux"; os_version: string | null; cpu: string | null; gpu: string | null;
  gpu_cores: number | null; gpus: number | null; ram_gb: number | null; vram_gb: number | null;
  engine: "ollama"; engine_version: string; tokens: number; runs: BenchRun[];
};

const typeOf = (v: unknown) =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" ? (Number.isInteger(v) ? "integer" : "number") : typeof v;

// The subset of JSON Schema used above, so the page and the database agree on what's valid.
function check(v: unknown, s: Schema, path: string, errors: string[]) {
  if (s.enum && !s.enum.includes(v)) return void errors.push(`${path}: unexpected value`);
  if (s.type) {
    const t = typeOf(v), want = [s.type].flat();
    if (!want.includes(t) && !(t === "integer" && want.includes("number"))) return void errors.push(`${path}: expected ${want.join(" or ")}`);
  }
  if (typeof v === "string") {
    if (s.maxLength !== undefined && v.length > s.maxLength) errors.push(`${path}: too long`);
    if (s.pattern && !new RegExp(s.pattern).test(v)) errors.push(`${path}: unexpected characters`);
  }
  if (typeof v === "number") {
    if (s.minimum !== undefined && v < s.minimum) errors.push(`${path}: below ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) errors.push(`${path}: above ${s.maximum}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems) errors.push(`${path}: needs at least ${s.minItems}`);
    if (s.maxItems !== undefined && v.length > s.maxItems) errors.push(`${path}: more than ${s.maxItems}`);
    if (s.items) v.forEach((x, i) => check(x, s.items!, `${path}[${i}]`, errors));
  }
  if (v && typeof v === "object" && !Array.isArray(v) && s.properties) {
    const o = v as Record<string, unknown>;
    for (const k of s.required ?? []) if (!(k in o)) errors.push(`${path}.${k}: missing`);
    for (const [k, x] of Object.entries(o)) {
      if (s.properties[k]) check(x, s.properties[k], `${path}.${k}`, errors);
      else if (s.additionalProperties === false) errors.push(`${path}.${k}: not allowed`);
    }
  }
}

export function validateBench(v: unknown): { ok: true; bench: Bench } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (JSON.stringify(v ?? null).length > BENCH_MAX_BYTES) errors.push("result is too large");
  else check(v, BENCH_SCHEMA, "result", errors);
  return errors.length ? { ok: false, errors: errors.slice(0, 8) } : { ok: true, bench: v as Bench };
}

// Accepts the whole link the script printed, just its #r=… part, or the raw code.
export function decodeBench(input: string): unknown {
  const code = input.trim().replace(/^.*#/, "").replace(/^r=/, "");
  if (!/^[A-Za-z0-9_-]+$/.test(code) || code.length > BENCH_MAX_BYTES * 2) throw new Error("that doesn't look like a bench result");
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function median(xs: (number | null | undefined)[] | undefined): number | null {
  const v = (xs ?? []).filter((x): x is number => typeof x === "number").sort((a, b) => a - b);
  return v.length ? v[(v.length - 1) >> 1] : null;
}
