import { test } from "node:test";
import assert from "node:assert/strict";
import { artifactOf, primary, stepsFor } from "../lib/runtimes.ts";
import { models } from "../lib/data.ts";
import type { Variant } from "../lib/types.ts";

const v = (cmd: string): Variant => ({ quant: "q4", gb: 1, cmd });

test("reads the file a recorded command points at", () => {
  assert.deepEqual(artifactOf(v("llama-server -hf unsloth/Qwen3.8-Flash-Next-GGUF:UD-Q2_K_XL")), { kind: "gguf", repo: "unsloth/Qwen3.8-Flash-Next-GGUF", quant: "UD-Q2_K_XL" });
  assert.deepEqual(artifactOf(v("llama-cli -hf ggml-org/gemma-3-1b-it-GGUF")), { kind: "gguf", repo: "ggml-org/gemma-3-1b-it-GGUF", quant: null });
  assert.deepEqual(artifactOf(v("ollama run hf.co/bartowski/X-GGUF:Q4_K_M")), { kind: "gguf", repo: "bartowski/X-GGUF", quant: "Q4_K_M" });
  assert.deepEqual(artifactOf(v("ollama run qwen3.5:4b")), { kind: "ollama", tag: "qwen3.5:4b" });
  assert.deepEqual(artifactOf(v("uvx --from mlx-lm mlx_lm.chat --model mlx-community/Apertus-8B-Instruct-2509-4bit")), { kind: "mlx", repo: "mlx-community/Apertus-8B-Instruct-2509-4bit" });
  assert.deepEqual(artifactOf(v("vllm serve allenai/Llama-3.1-Tulu-3-70B-DPO")), { kind: "other" });
});

test("a GGUF runs in llama.cpp first, and every runtime gets a command", () => {
  const gguf = v("llama-server -hf unsloth/X-GGUF:Q4_K_M");
  assert.equal(primary(gguf).runtime.id, "llamacpp");
  assert.deepEqual(stepsFor(gguf).map((x) => x.runtime), ["llamacpp", "lmstudio", "ollama"]);
  assert.deepEqual(stepsFor({ ...gguf, gb: 120 }).map((x) => x.runtime), ["llamacpp", "lmstudio"]);
  assert.ok(stepsFor(gguf).every((x) => x.steps.some((s) => s.cmd?.includes("unsloth/X-GGUF"))));
  assert.equal(primary(v("ollama run qwen3.5:4b")).runtime.id, "ollama");
  assert.equal(primary(v("vllm serve a/b")).cmd, "vllm serve a/b");
});

test("every catalogue download parses to a runtime with a command", () => {
  for (const m of models) for (const x of m.local?.variants ?? []) {
    const steps = stepsFor(x);
    assert.ok(steps.length > 0 && steps.every((s) => s.steps.some((st) => st.cmd || st.href)), `${m.id}: ${x.cmd}`);
  }
});
