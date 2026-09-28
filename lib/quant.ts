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

// "q4_k_m" → 4, "ud-q2_k_xl" → 2, "ud-iq1_m" → 1, "q8_0" → 8, "f16" → 16.
// QAT (trained for 4-bit) and MXFP4 (gpt-oss ships in it) are kept separate.
export function bitsOf(v: Variant): Bits {
  const q = v.quant.toLowerCase();
  if (q.includes("qat")) return "qat";
  if (q.includes("mxfp4")) return "mxfp4";
  if (/(^|[^a-z])b?f16/.test(q)) return 16;
  const m = q.match(/(?:^|[^a-z])i?q(\d)/);
  return m ? Number(m[1]) : 4;
}

export const bitsLabel = (b: Bits) => (typeof b === "number" ? `${b}-bit` : b === "qat" ? "4-bit QAT" : "MXFP4");

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
