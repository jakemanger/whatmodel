import { test } from "node:test";
import assert from "node:assert/strict";
import { bitsLabel, bitsOf, bitsPerWeight, precisionOf } from "../lib/quant.ts";
import type { Variant } from "../lib/types.ts";

const v = (quant: string): Variant => ({ quant, gb: 1, cmd: "x" });

test("reads the bit width from GGUF and MLX quant names", () => {
  assert.equal(bitsOf(v("q4_k_m")), 4);
  assert.equal(bitsOf(v("ud-q2_k_xl")), 2);
  assert.equal(bitsOf(v("ud-iq1_s")), 1);
  assert.equal(bitsOf(v("q8_0")), 8);
  assert.equal(bitsOf(v("bf16")), 16);
  assert.equal(bitsOf(v("mlx-3bit")), 3);
  assert.equal(bitsOf(v("mlx-8bit")), 8);
  assert.equal(bitsOf(v("mlx-8bit (mlx-audio)")), 8);
  assert.equal(bitsOf(v("mlx-4bit-dwq")), 4);
  assert.equal(bitsOf(v("8bit")), 8);
  assert.equal(bitsOf(v("mlx-mxfp4")), "mxfp4");
  assert.equal(bitsLabel(bitsOf(v("mlx-6bit"))), "6-bit");
});

test("full-precision, 8-bit float and 4-bit float names aren't read as 4-bit", () => {
  for (const [q, b] of [
    ["fp32", 32], ["onnx-fp32", 32], ["fp16", 16], ["mlx-fp16", 16], ["mlx-bf16", 16], ["f16", 16],
    ["fp8", 8], ["mlx-mxfp8", 8], ["int8", 8], ["gguf-q8_0", 8], ["Q8_0", 8],
    ["nvfp4", 4], ["mlx-nvfp4", 4], ["nvfp4-mlx", 4], ["nf4", 4], ["gguf-q4_k_m", 4], ["UD-IQ4_XS", 4], ["q4_k_xl", 4],
    ["IQ3_XXS", 3], ["Q3_K_M", 3], ["Q2_0", 2], ["UD-IQ2_XXS", 2], ["ud-iq1_m", 1],
    ["int4 (bitsandbytes at load)", 4], ["bf16 weights, experts_int8 at load", 8], ["bf16 weights, DeepSpeed fp8 at load", 8],
    ["fp8 + fp4 experts", 4], ["fp4 + fp8 mixed", 4],
  ] as const) assert.equal(precisionOf(q), b, q);
  assert.equal(bitsLabel(bitsOf(v("fp32"))), "32-bit");
});

test("an unknown precision name is null, not a guess", () => {
  for (const q of ["onnx", "gguf", "awq-something", "default"]) assert.equal(precisionOf(q), null, q);
});

test("bits per weight on disk follow the format, not just the bit width", () => {
  assert.equal(bitsPerWeight("bf16"), 16);
  assert.equal(bitsPerWeight("fp8"), 8);
  assert.equal(bitsPerWeight("mlx-4bit"), 4.5);
  assert.ok(bitsPerWeight("ud-iq1_s")! > 2, "dynamic 1-bit GGUFs keep some tensors at higher precision");
  assert.ok(bitsPerWeight("q4_k_m")! > 4.5);
  assert.equal(bitsPerWeight("mystery"), null);
});
