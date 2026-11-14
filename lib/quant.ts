// Quantized weights score lower than the full-precision model the benchmarks ran on.
// data/quant.json holds sourced retention factors: the fraction of benchmark accuracy kept
// at each bit width, by model size. score.ts turns that into a g for each local variant.

import type { Variant } from "./types.ts";

export type Bits = number | "qat" | "mxfp4";
export type QuantRow = { bits: number | string; small: number | null; medium: number | null; large: number | null; basis: string };
export type QuantFinding = {
  quant: string; model: string; params_b: number; metric: string; full: number; quant_score: number; retention: number; source: string; note?: string;
  model_id?: string | null; // set only when the tested checkpoint is exactly this catalogue model
  baseline_quant?: string;
  study?: string; // findings sharing a study come from one table, so they're correlated
};

// The precision a download holds its weights in, from its name: "q4_k_m" → 4, "ud-q2_k_xl" → 2,
// "ud-iq1_m" → 1, "q8_0" → 8, "fp8" → 8, "nvfp4" → 4, "bf16" → 16, "fp32" → 32, "mlx-3bit" → 3.
// QAT (trained for 4-bit) and MXFP4 (gpt-oss ships in it) are kept separate. Weights converted when they're
// loaded ("int4 (bitsandbytes at load)") count at the precision they're held in. A mix of fp8 and fp4
// experts counts as 4: the experts are most of the weights. null: a name we don't know. npm run check
// fails on those rather than guess.
export function precisionOf(quant: string): Bits | null {
  const q = quant.toLowerCase();
  if (q.includes("qat")) return "qat";
  if (/(^|[^a-z])mxfp4/.test(q)) return "mxfp4";
  if (/at load/.test(q)) return /int4|nf4|fp4|4.?bit/.test(q) ? 4 : /int8|fp8|8.?bit/.test(q) ? 8 : null;
  if (/(^|[^a-z0-9])(nv|mx)?fp4|(^|[^a-z0-9])(nf4|int4)/.test(q)) return 4;
  if (/(^|[^a-z0-9])(fp32|f32)/.test(q)) return 32;
  if (/(^|[^a-z0-9])(bf16|fp16|f16)/.test(q)) return 16;
  if (/(^|[^a-z0-9])(mx)?(fp8|int8)/.test(q)) return 8;
  const m = q.match(/(?:^|[^a-z])i?q(\d)(?![0-9])/) ?? q.match(/(?:^|[^a-z0-9])(\d{1,2})-?bit(?![a-z])/);
  return m ? Number(m[1]) : null;
}
export const bitsOf = (v: Variant): Bits => precisionOf(v.quant) ?? 16;

export const bitsLabel = (b: Bits) => (typeof b === "number" ? `${b}-bit` : b === "qat" ? "4-bit QAT" : "MXFP4");

// Bits per weight a download of this precision takes on disk, measured across the catalogue's downloads
// (npm run sizes; median per precision): quantized formats also store scales, and GGUF "k" and dynamic
// quants keep some tensors at higher precision, so a "1-bit" dynamic GGUF averages over 2 bits a weight.
// Used to estimate a download no listing gave a size for, and by npm run check to flag sizes that can't
// be right for their precision.
export function bitsPerWeight(quant: string): number | null {
  const q = quant.toLowerCase();
  const b = precisionOf(quant);
  if (b === null) return null;
  if (b === "qat") return BPW.qat;
  if (b === "mxfp4") return BPW.mxfp4;
  if (/(^|[^a-z0-9])mlx/.test(q) && typeof b === "number" && b <= 8) return BPW[`mlx${b}`] ?? b + 0.5;
  if (/(^|[^a-z0-9])(nv)?fp4|nf4|int4|fp8|int8|bf16|fp16|f16|fp32|f32/.test(q)) return typeof b === "number" ? b : null;
  const gguf = /iq\d/.test(q) ? `iq${b}` : /q(\d)_0/.test(q) ? `q${b}_0` : `q${b}`;
  return BPW[gguf] ?? BPW[`q${b}`] ?? (typeof b === "number" ? b + 0.8 : null);
}
const BPW: Record<string, number> = {
  q8_0: 8.5, q8: 8.5, q6: 6.6, q5: 5.7, q4_0: 4.6, q4: 4.9, q3: 3.9, q2: 3, q1: 2.2, iq4: 4.4, iq3: 3.4, iq2: 2.4, iq1: 2.2,
  mlx8: 8.5, mlx6: 6.5, mlx5: 5.5, mlx4: 4.5, mlx3: 3.5, mlx2: 2.5, qat: 4.6, mxfp4: 4.3,
};

// Fraction of accuracy kept. Bigger models tolerate quantization better.
export function retention(table: QuantRow[], b: Bits, paramsB: number | undefined): number {
  if (b === 16) return 1;
  const key = b === "mxfp4" ? "mxfp4-native" : String(b);
  const row = table.find((r) => String(r.bits) === key);
  if (!row) return 1;
  const p = paramsB ?? 30;
  const cell = p < 15 ? row.small : p <= 100 ? row.medium : row.large;
  return cell ?? row.medium ?? row.small ?? row.large ?? 1; // no evidence at this size: nearest size's number
}
