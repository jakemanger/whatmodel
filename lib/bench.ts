// Reports from bench.py (schema whatmodel-bench-v3). The script prints the exact report and the
// contributor posts it as a GitHub issue; the maintainer's review script reads it back with this
// schema. Strings are limited to plain characters, so a report can't carry markup.

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
const num = (maximum: number): Schema => ({ type: ["number", "null"], minimum: 0, maximum });
const hex64 = text("^[a-f0-9]{64}$", 64);
const label = (maxLength: number) => text("^[A-Za-z0-9 ._()@+:,/-]*$", maxLength);

// bench.py ENGINES, plus the agent CLIs it can time (HARNESSES).
export const ENGINES = ["ollama", "openai-compatible", "lm-studio", "llama.cpp", "mlx-lm", "claude-code", "codex-cli", "gemini-cli", "qwen", "opencode", "goose"] as const;
// Engines that run the weights on the contributor's machine; only these can become local speeds.
export const LOCAL_ENGINES: readonly string[] = ["ollama", "llama.cpp", "mlx-lm", "lm-studio"];

const sample: Schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    elapsed_s: num(3600), output_tokens: int(0, 1e5), reasoning_tokens: int(0, 1e5), gen_tok_s: num(1e5),
    prompt_tok_s: num(1e6), load_s: num(3600), ttft_s: num(3600), e2e_tok_s: num(1e5), cost_usd: num(100),
    cpu_busy: num(1), // share of the CPU other programs used in the pause before the call (0-1)
  },
};

const result: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["model", "engine", "samples"],
  properties: {
    model: { type: "string", pattern: "^[a-z0-9][a-z0-9.-]{0,79}$", maxLength: 80 },
    engine: { enum: [...ENGINES] },
    engine_version: label(40),
    samples: { type: "array", minItems: 1, maxItems: 20, items: sample },
    quant: text("^[A-Za-z0-9_.-]*$", 20),
    params: text("^[A-Za-z0-9.]*$", 12),
    digest: hex64,
    file: text("^[A-Za-z0-9._+-]*$", 120),
    settings: text("^[A-Za-z0-9_.=-]*$", 60),
  },
};

export const REPORT_SCHEMA: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["schema", "script_version", "protocol", "hardware", "results"],
  properties: {
    schema: { enum: ["whatmodel-bench-v3"] },
    script_version: { type: "string", pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$", maxLength: 20 },
    protocol: {
      type: "object",
      additionalProperties: false,
      required: ["prompt_sha256", "max_output_tokens", "runs", "warmups"],
      properties: {
        prompt_sha256: hex64, agent_prompt_sha256: hex64, max_output_tokens: { type: "integer", minimum: 1, maximum: 8192 },
        runs: { type: "integer", minimum: 1, maximum: 20 }, warmups: { type: "integer", minimum: 0, maximum: 5 },
        order_seed: int(0, 1e9), note: text("^[A-Za-z0-9 ;,.()-]*$", 200),
      },
    },
    hardware: {
      type: "object",
      additionalProperties: false,
      properties: {
        os: { enum: ["Darwin", "Linux", "Windows", "Other"] }, arch: { enum: ["arm64", "aarch64", "x86_64", "AMD64", "Other"] },
        chip: label(60), ram_gb: int(0, 8192), gpu: label(60), vram_gb: int(0, 8192), gpus: int(0, 64), gpu_cores: int(0, 1000),
      },
    },
    results: { type: "array", minItems: 1, maxItems: 40, items: result },
  },
};

export const REPORT_MAX_BYTES = 32768;

export type Sample = Partial<Record<"elapsed_s" | "output_tokens" | "reasoning_tokens" | "gen_tok_s" | "prompt_tok_s" | "load_s" | "ttft_s" | "e2e_tok_s" | "cost_usd" | "cpu_busy", number | null>>;
export type ReportResult = {
  model: string; engine: (typeof ENGINES)[number]; engine_version?: string | null; samples: Sample[];
  quant?: string | null; params?: string | null; digest?: string | null; file?: string | null; settings?: string | null;
};
export type Report = {
  schema: "whatmodel-bench-v3"; script_version: string;
  protocol: { prompt_sha256: string; agent_prompt_sha256?: string; max_output_tokens: number; runs: number; warmups: number; order_seed?: number | null; note?: string | null };
  hardware: { os?: string; arch?: string; chip?: string | null; ram_gb?: number | null; gpu?: string | null; vram_gb?: number | null; gpus?: number | null; gpu_cores?: number | null };
  results: ReportResult[];
};

const typeOf = (v: unknown) =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" ? (Number.isInteger(v) ? "integer" : "number") : typeof v;

// The subset of JSON Schema used above.
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

export function validateReport(v: unknown): { ok: true; report: Report } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (JSON.stringify(v ?? null).length > REPORT_MAX_BYTES) errors.push("report is too large");
  else check(v, REPORT_SCHEMA, "report", errors);
  return errors.length ? { ok: false, errors: errors.slice(0, 8) } : { ok: true, report: v as Report };
}

// The report from an issue body (its ```json block) or from the saved JSON file itself.
export function reportFromText(input: string): unknown {
  if (input.length > REPORT_MAX_BYTES * 2) throw new Error("too long to be a bench report");
  const block = /```json\s*\n([\s\S]*?)\n```/.exec(input)?.[1] ?? input;
  try {
    return JSON.parse(block.trim());
  } catch {
    throw new Error("no bench report found: expected the ```json block bench.py writes, or its saved JSON file");
  }
}

export function median(xs: (number | null | undefined)[] | undefined): number | null {
  const v = (xs ?? []).filter((x): x is number => typeof x === "number").sort((a, b) => a - b);
  return v.length ? v[(v.length - 1) >> 1] : null;
}
