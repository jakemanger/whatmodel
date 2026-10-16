import { test } from "node:test";
import assert from "node:assert/strict";
import { bitsLabel, bitsOf } from "../lib/quant.ts";
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
