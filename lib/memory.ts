// Memory figures that can't be right. npm run check fails on any of these, so a wrong size, a precision
// name that doesn't match its file, or a parameter count that's off can't put a model on machines it
// won't run on.
import { catOf } from "./categories.ts";
import { bitsLabel, bitsPerWeight, precisionOf } from "./quant.ts";
import type { Model, Variant } from "./types.ts";

// Weights converted as they load are downloaded at full size and held smaller, so the download size
// says nothing about the precision they run at.
export const loadTimeQuant = (v: Variant) => /bitsandbytes|load_in_[48]bit|at load|--quantization[ =]|--expert-dtype/i.test(`${v.cmd} ${v.quant}`);

// How far a download may sit from its precision's usual size, in GB: below, a little for formats that keep
// fewer tensors at high precision; above, room for a vision encoder or multi-token-prediction layers that
// params_b doesn't count, and a gigabyte for the embeddings that dominate the smallest models.
export const SIZE_BAND = {
  low: (params: number, exp: number) => (params * (exp * 0.75 - 0.3)) / 8,
  high: (params: number, exp: number) => (params * exp * 1.45) / 8 + 1,
};

export function memoryProblems(m: Model): string[] {
  if (catOf(m) !== "llm") return [];
  const out: string[] = [];
  for (const v of m.local?.variants ?? []) {
    const where = `${m.id} ${v.quant}`;
    const b = precisionOf(v.quant);
    if (b === null) { out.push(`${where}: "${v.quant}" names no precision we know; use a GGUF type (q4_k_m), MLX (mlx-4bit) or a dtype (bf16, fp8)`); continue; }
    for (const n of v.needs ?? []) {
      if (!(n.vram_gb >= 0 && n.ram_gb > 0)) out.push(`${where}: a needs pair must give GPU memory and RAM in GB`);
      else if (n.vram_gb + n.ram_gb < v.gb * 0.5) out.push(`${where}: ${n.vram_gb} GB GPU + ${n.ram_gb} GB RAM holds under half of the ${v.gb} GB download`);
    }
    if (v.size_note && !v.size_source) out.push(`${where}: a size_note explains a measured size, so it needs the size_source it was measured from`);
    // A measured size outside the usual range stands only with a written reason (size_note).
    if (v.needs || loadTimeQuant(v) || !m.params_b || !(v.gb > 0) || (v.size_note && v.size_source)) continue;
    const exp = bitsPerWeight(v.quant)!;
    const bpw = (v.gb * 8) / m.params_b;
    if (v.gb < SIZE_BAND.low(m.params_b, exp) || v.gb > SIZE_BAND.high(m.params_b, exp))
      out.push(`${where}: ${v.gb} GB${v.gb_estimated ? " (estimated)" : ""} is ${bpw.toFixed(1)} bits per weight for ${m.params_b}B parameters, ` +
        `but ${bitsLabel(b)} downloads take about ${exp}. Measure it (npm run sizes), or fix the precision name or params_b`);
  }
  return out;
}
