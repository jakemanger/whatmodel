// The bench script's model list: every language model on whatmodel.sh with its score and the
// downloads a bench can run (GGUF for llama.cpp / LM Studio, MLX, Ollama tags). Generated with the
// pages (pages/bench-models.json) and published at /data/bench-models.json, so bench.py can offer
// "models that fit this machine" and knows exactly which model and quantisation each test is.
import { fitFor, models } from "./data.ts";
import { catOf } from "./categories.ts";
import { artifactOf } from "./runtimes.ts";

export type BenchVariant = { rt: "gguf" | "mlx" | "ollama"; ref: string; quant: string; gb: number; split?: true };
export type BenchModel = { id: string; name: string; provider: string; score: number | null; n: number; params_b: number | null; variants: BenchVariant[] };

export function benchCatalogue(): BenchModel[] {
  return models.filter((m) => catOf(m) === "llm").map((m) => {
    const s = fitFor(m.id).scores.get(m.id);
    const variants = (m.local?.variants ?? []).flatMap((v): BenchVariant[] => {
      const a = artifactOf(v);
      if (a.kind === "gguf" && a.quant) return [{ rt: "gguf", ref: a.repo, quant: a.quant, gb: v.gb, ...(v.split ? { split: true as const } : {}) }];
      if (a.kind === "mlx") return [{ rt: "mlx", ref: a.repo, quant: v.quant.replace(/^mlx-/, ""), gb: v.gb }];
      if (a.kind === "ollama") return [{ rt: "ollama", ref: a.tag, quant: v.quant, gb: v.gb }];
      return [];
    });
    // n: how many benchmark results the score rests on, so the bench can suggest well-tested models first.
    return { id: m.id, name: m.name, provider: m.provider, score: s ? Math.round(s.g * 10) / 10 : null, n: s?.n ?? 0, params_b: m.params_b ?? null, variants };
  });
}
