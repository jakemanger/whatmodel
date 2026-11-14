import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { models as catalogue } from "../lib/data.ts";
import { needGb, usable } from "../lib/fit.ts";
import { findHardware } from "../lib/hardware.ts";
import { memoryProblems } from "../lib/memory.ts";
import { precisionOf } from "../lib/quant.ts";
import type { Hardware, Model, Specs, Speed, Variant } from "../lib/types.ts";

const model = (params_b: number, variants: Partial<Variant>[]): Model =>
  ({ id: "m", name: "M", provider: "P", params_b, local: { variants: variants.map((v) => ({ quant: "q4_k_m", gb: 1, cmd: "x", ...v })) } }) as Model;

test("a 1-bit estimate that puts a trillion-parameter model in 150 GB is flagged", () => {
  const [p] = memoryProblems(model(1000, [{ quant: "ud-iq1_s", gb: 150.5, gb_estimated: true }]));
  assert.match(p, /1\.2 bits per weight for 1000B parameters/);
});

test("a measured size that matches its precision passes", () => {
  assert.deepEqual(memoryProblems(model(358, [{ quant: "ud-iq1_s", gb: 97.2 }, { quant: "ud-q4_k_xl", gb: 204.6 }, { quant: "mlx-4bit", gb: 198.6 }])), []);
  assert.deepEqual(memoryProblems(model(9, [{ quant: "q4_k_m", gb: 6.6 }, { quant: "Q8_0", gb: 10.4 }, { quant: "mlx-8bit", gb: 10.4 }])), []);
});

test("an 8-bit download labelled bf16 is flagged", () => {
  assert.equal(memoryProblems(model(684.5, [{ quant: "bf16", gb: 688.6 }])).length, 1);
});

test("an unknown precision name is flagged rather than read as 4-bit", () => {
  assert.match(memoryProblems(model(7, [{ quant: "mystery", gb: 4 }]))[0], /names no precision/);
});

test("a split download's GPU memory and RAM must hold most of it", () => {
  const [p] = memoryProblems(model(125, [{ quant: "IQ2_XS", gb: 68, needs: [{ vram_gb: 8, ram_gb: 16 }] }]));
  assert.match(p, /under half/);
  assert.deepEqual(memoryProblems(model(125, [{ quant: "IQ2_XS", gb: 68, needs: [{ vram_gb: 24, ram_gb: 32 }] }])), []);
});

test("every catalogue download passes the memory checks", () => {
  const models = JSON.parse(readFileSync(new URL("../data/models.json", import.meta.url), "utf8")) as Model[];
  assert.deepEqual(models.flatMap(memoryProblems), []);
});

// Real runs: a download measured running entirely on a graphics card has to fit in that card's memory.
// If our size says it can't, the size is wrong.
test("downloads measured running fully on a GPU fit that GPU", () => {
  const load = <T>(f: string): T => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
  const models = new Map(load<Model[]>("models.json").map((m) => [m.id, m]));
  const hardware = load<Hardware[]>("hardware.json");
  const wrong: string[] = [];
  let checked = 0;
  for (const s of load<Speed[]>("speeds.json")) {
    if (s.offload !== "none" || !["nvidia", "amd", "intel"].includes(s.kind) || !s.quant) continue;
    const h = findHardware(hardware, s.hardware), m = models.get(s.model);
    if (!h?.memory_gb?.length || !m?.local) continue;
    const same = m.local.variants.filter((v) => v.quant.toLowerCase() === s.quant!.toLowerCase() && !v.gb_estimated && !v.needs);
    if (!same.length || precisionOf(s.quant) === null) continue;
    const gb = Math.min(...same.map((v) => v.gb));
    const card = Math.max(...h.memory_gb) * 1.0737; // cards are sold in GiB; downloads are in GB
    checked++;
    if (gb > card) wrong.push(`${m.id} ${s.quant}: ${gb} GB download, but it ran fully on a ${s.hardware} (${Math.max(...h.memory_gb)} GB) in ${s.source}`);
  }
  assert.ok(checked > 50, `only ${checked} runs could be compared`);
  assert.deepEqual(wrong, []);
});

// Published reports of one download on one machine, and how it went: entirely on the GPU, partly in system
// RAM, or not at all. The board's rule (download + an 8k-token conversation, against the card, then the
// card plus all but 8 GB of RAM) has to reach the same verdict. Collected 14 November 2026.
const card = (vram: number, ram: number): Specs => ({ gpu: "card", vram, ram, hw: null }) as Specs;
const mac = (ram: number): Specs => ({ gpu: "apple", vram: 0, ram, hw: null }) as Specs;
const REPORTS: [model: string, cmd: string, on: Specs, ran: "gpu" | "ram" | "no", source: string][] = [
  ["llama-3-1-8b", "ollama run llama3.1:8b", card(8, 64), "gpu", "https://www.databasemart.com/blog/ollama-gpu-benchmark-rtx4060"],
  ["llama-2-13b", "ollama run llama2:13b", card(8, 64), "ram", "https://www.databasemart.com/blog/ollama-gpu-benchmark-rtx4060"],
  ["qwen3-8b", "ollama run qwen3:8b", card(8, 64), "gpu", "https://www.databasemart.com/blog/ollama-gpu-benchmark-rtx5060"],
  ["gpt-oss-20b", "ollama run gpt-oss:20b", card(16, 64), "gpu", "https://glukhov.org/llm-performance/benchmarks/choosing-best-llm-for-ollama-on-16gb-vram-gpu/"],
  ["qwen3-coder-30b-a3b", "ollama run qwen3-coder:30b", card(16, 64), "ram", "https://glukhov.org/llm-performance/benchmarks/choosing-best-llm-for-ollama-on-16gb-vram-gpu/"],
  ["gpt-oss-120b", "ollama run gpt-oss:120b", card(16, 64), "ram", "https://glukhov.org/llm-performance/benchmarks/choosing-best-llm-for-ollama-on-16gb-vram-gpu/"],
  ["qwen3-30b-a3b", "ollama run qwen3:30b-a3b-q4_K_M", card(24, 64), "gpu", "https://github.com/ollama/ollama/issues/10458"],
  ["qwen2-5-32b", "ollama run qwen2.5:32b", card(24, 256), "gpu", "https://www.databasemart.com/blog/ollama-gpu-benchmark-rtx4090"],
  ["qwq-32b", "ollama run qwq:32b", card(24, 256), "gpu", "https://www.databasemart.com/blog/ollama-gpu-benchmark-rtx4090"],
  ["deepseek-r1", "DeepSeek-R1-GGUF:UD-IQ1_S", card(24, 64), "no", "https://huggingface.co/unsloth/DeepSeek-R1-GGUF/discussions/46"],
  ["gpt-oss-20b", "ollama run gpt-oss:20b", mac(64), "gpu", "https://github.com/ggml-org/llama.cpp/discussions/15396"],
  ["gpt-oss-120b", "ollama run gpt-oss:120b", mac(128), "gpu", "https://zenn.dev/robustonian/articles/gpt_oss_bench"],
];

test("published runs on real machines come out the way they did", () => {
  const wrong: string[] = [];
  for (const [id, cmd, on, ran, source] of REPORTS) {
    const m = catalogue.find((x) => x.id === id);
    const v = m?.local?.variants.find((x) => x.cmd.includes(cmd));
    assert.ok(m && v, `${id}: no download whose command has ${cmd}`);
    const need = needGb(v, "llm", m.kv), u = usable(on);
    const verdict = need <= u.fast ? "gpu" : need <= u.total ? "ram" : "no";
    if (verdict !== ran) wrong.push(`${id} (${v.gb} GB, needs ${need.toFixed(1)}) on ${on.gpu === "apple" ? `a ${on.ram} GB Mac` : `${on.vram} GB + ${on.ram} GB RAM`}: we say ${verdict}, ${source} says ${ran}`);
  }
  assert.deepEqual(wrong, []);
});
