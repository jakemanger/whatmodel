// The contribution issue forms. This file is the source of truth: the parser reads the field
// labels from here, and .github/ISSUE_TEMPLATE/<kind>.yml is generated from it.
//   node scripts/contrib/forms.ts           rewrite the YAML forms
//   node scripts/contrib/forms.ts --check   exit 1 if they're out of date (npm test checks this too)
// Field ids are stable: the website pre-fills them through URL parameters.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const KINDS = ["paper-results", "wrong-number", "update-model", "new-provider", "missing-model", "new-benchmark"] as const;
export type Kind = (typeof KINDS)[number];

export type Field = {
  id: string;
  type: "input" | "textarea" | "dropdown" | "checkboxes";
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  multiple?: boolean;
  options?: string[];
  requiredOptions?: boolean; // checkboxes: every box must be ticked
};
export type Form = { kind: Kind; name: string; description: string; labels: string[]; intro: string; fields: Field[] };

export const REPO = "https://github.com/jakemanger/whatmodel";
const BENCHMARKS = `${REPO}/blob/main/data/benchmarks.json`;
const MODELS = `${REPO}/blob/main/data/models.json`;
const BOT = "A maintainer can run the local contribution reviewer to prepare a report and proposed data changes. Nothing is merged automatically. Include exact source links so the measurements and licence can be reviewed.";
const MODEL_ID = `The model id is the end of its whatmodel.sh address, e.g. \`qwen3-8b\` for whatmodel.sh/model/qwen3-8b ([all ids](${MODELS})).`;

export const LICENCES = ["CC BY", "CC BY-SA", "CC0", "Apache-2.0", "MIT", "Other or not sure"];
export const CATEGORIES = ["Text (LLM)", "Image", "Video", "Text-to-speech", "Speech-to-text"];
export const BY = ["The source's authors, on models they didn't make", "The model's own makers"];
export const WHAT = ["Release date", "Licence", "Parameters", "Context window", "Price", "Name or maker", "Description", "Something else"];
export const PROVIDER_KINDS = ["API provider", "Download (official or quantised weights)", "Runtime or app (llama.cpp, Ollama, MLX, stable-diffusion.cpp…)", "Hosted service"];
export const PLATFORMS = ["Apple Silicon", "NVIDIA", "AMD", "CPU only"];
export const SCALES = ["Accuracy or percentage (higher is better)", "Error rate (lower is better)", "Elo or arena rating"];
export const CONFIRM = "These are the source's own measurements, not numbers copied from another paper or leaderboard";

const FIELD_LINES = "One `field: value` per line.";

export const FORMS: Form[] = [
  {
    kind: "paper-results",
    name: "Results from a paper",
    description: "Benchmark results published in an openly licensed paper, model card or repository.",
    labels: ["data", "paper-results"],
    intro: `${BOT}

**Format:** one result per line, \`model-id | benchmark-id | score | optional note\`

\`\`\`
qwen3-8b | mmlu-pro | 48.3% | 5-shot CoT
llama-3-1-8b-instruct | gpqa-diamond | 30.4%
\`\`\`

- ${MODEL_ID} Not listed yet? Use the **Missing model** form first.
- Benchmark ids are in [data/benchmarks.json](${BENCHMARKS}). Not listed? Use **Propose a benchmark**.
- Write scores as printed: \`48.3%\` or \`0.483\`, Elo ratings as the number, 1–5 ratings as printed.`,
    fields: [
      { id: "source", type: "input", label: "Source link", required: true, placeholder: "https://arxiv.org/abs/2501.12345v2",
        description: "An arXiv paper, a Hugging Face model card or dataset file, or a GitHub file. Its licence must be CC BY, CC BY-SA, CC0, MIT or Apache-2.0. arXiv's default licence can't be used." },
      { id: "licence", type: "dropdown", label: "Licence of the source", options: LICENCES,
        description: "Optional: name the licence covering the results, not only the code." },
      { id: "location", type: "input", label: "Table or figure", required: true, placeholder: "Table 3" },
      { id: "results", type: "textarea", label: "Results", required: true,
        description: "One per line: model-id | benchmark-id | score | optional note",
        placeholder: "qwen3-8b | mmlu-pro | 48.3% | 5-shot CoT" },
      { id: "by", type: "dropdown", label: "Who ran the evaluations?", required: true, options: BY },
      { id: "setup", type: "textarea", label: "Evaluation setup",
        description: "Optional: shots, prompting, reasoning setting or judge model. It's added to each result's note." },
      { id: "confirm", type: "checkboxes", label: "Original results", options: [CONFIRM], requiredOptions: true },
    ],
  },
  {
    kind: "wrong-number",
    name: "Wrong number",
    description: "A score, price, context window, size or date doesn't match its source.",
    labels: ["data", "wrong-number"],
    intro: `${BOT}

**Format:** \`what = correct value\`, for example \`gpqa-diamond = 71.2%\`, \`price_in = 0.40\` or \`context = 256k\`.

- For a test result, \`what\` is the benchmark id from [data/benchmarks.json](${BENCHMARKS}).
- Otherwise one of \`price_in\`, \`price_out\` (USD per 1M tokens), \`price\` (e.g. \`0.04\`), \`context\`, \`params\`, \`active\`, \`released\` or \`licence\`.
- ${MODEL_ID}`,
    fields: [
      { id: "model", type: "input", label: "Model", required: true, placeholder: "qwen3-8b" },
      { id: "field", type: "input", label: "Correct value", required: true, placeholder: "gpqa-diamond = 71.2%" },
      { id: "source", type: "input", label: "Source URL", required: true,
        description: "Where the correct number is published: the source we cite for that result, or the vendor's own page for prices and specs." },
      { id: "notes", type: "textarea", label: "Anything else" },
    ],
  },
  {
    kind: "update-model",
    name: "Update model information",
    description: "A model's release date, licence, size, context window, price or name is missing or out of date.",
    labels: ["data", "update-model"],
    intro: `${BOT}

**Format:** ${FIELD_LINES}

\`\`\`
released: 2026-03
context: 256k
price_in: 0.40
price_out: 1.60
\`\`\`

Fields: \`released\` (YYYY-MM), \`licence\` (e.g. apache-2.0), \`params\` and \`active\` (billions, e.g. 30.5B), \`context\` (e.g. 256k), \`price_in\` and \`price_out\` (USD per 1M tokens), \`price\` (e.g. \`0.04\`), \`name\`, \`maker\`, \`open_weights\` (yes or no). ${MODEL_ID}`,
    fields: [
      { id: "model", type: "input", label: "Model", required: true, placeholder: "qwen3-8b" },
      { id: "what", type: "dropdown", label: "What should change", required: true, multiple: true, options: WHAT },
      { id: "change", type: "textarea", label: "The correct information", required: true, description: FIELD_LINES, placeholder: "context: 256k" },
      { id: "source", type: "input", label: "Source URL", required: true,
        description: "The maker's own page (model card, docs or pricing page). A price must come from the provider that serves it." },
    ],
  },
  {
    kind: "new-provider",
    name: "Add a place to run a model",
    description: "An API provider, download, runtime or app that runs a model we list.",
    labels: ["data", "new-provider"],
    intro: `${BOT}

**Details format:** ${FIELD_LINES}

\`\`\`
command: ollama run qwen3:8b
quant: q4_k_m
size: 5.2 GB
\`\`\`

- Downloads and runtimes: \`command\` (the exact command from the official docs), \`quant\` and \`size\`.
- APIs: \`provider\` (its name) and \`price_in\`/\`price_out\` (USD per 1M tokens) or \`price\` (e.g. \`0.04\`).
- ${MODEL_ID}`,
    fields: [
      { id: "model", type: "input", label: "Model", required: true, placeholder: "qwen3-8b" },
      { id: "kind", type: "dropdown", label: "What it is", required: true, options: PROVIDER_KINDS },
      { id: "link", type: "input", label: "Official page", required: true,
        description: "The provider's own model or pricing page, or the runtime's page for this model." },
      { id: "platforms", type: "checkboxes", label: "Where it runs (for downloads and runtimes)", options: PLATFORMS },
      { id: "details", type: "textarea", label: "Details", required: true, description: FIELD_LINES, placeholder: "command: ollama run qwen3:8b" },
      { id: "notes", type: "textarea", label: "Anything else" },
    ],
  },
  {
    kind: "missing-model",
    name: "Missing model",
    description: "A model that should be on the leaderboard isn't.",
    labels: ["data", "missing-model"],
    intro: `${BOT}

Give the maker's Hugging Face page if there is one. Add **Details**, one \`field: value\` per line: \`maker\`, \`released\` (YYYY-MM), \`licence\`, \`params\`, \`active\`, \`open_weights\` (yes or no).

**Results** are optional, from the official model card above, one per line: \`benchmark-id | score | optional note\` ([benchmark ids](${BENCHMARKS})). For results from a paper, use **Results from a paper** once the model is added.`,
    fields: [
      { id: "model", type: "input", label: "Model name", required: true, placeholder: "Qwen3.5 9B" },
      { id: "links", type: "input", label: "Official page", required: true, placeholder: "https://huggingface.co/Qwen/Qwen3.5-9B",
        description: "The maker's Hugging Face model page, or its own model page or API docs." },
      { id: "category", type: "dropdown", label: "Category", required: true, options: CATEGORIES },
      { id: "details", type: "textarea", label: "Details", description: `Include maker and open_weights (yes/no). ${FIELD_LINES}`, placeholder: "maker: Qwen" },
      { id: "results", type: "textarea", label: "Results from the model card", description: "Optional. One per line: benchmark-id | score | optional note", placeholder: "mmlu-pro | 71.2%" },
      { id: "notes", type: "textarea", label: "Anything else" },
    ],
  },
  {
    kind: "new-benchmark",
    name: "Propose a benchmark or results source",
    description: "A benchmark, leaderboard or dataset whose results we could add.",
    labels: ["data", "source", "new-benchmark"],
    intro: `${BOT} A new source is never approved automatically; its licence must be reviewed before any results are imported.

The licence has to cover the results themselves, not just the code. Leaderboard aggregators (Artificial Analysis, OpenRouter, the arena.ai website) can't be used.`,
    fields: [
      { id: "name", type: "input", label: "Benchmark or source name", required: true },
      { id: "link", type: "input", label: "Link to the results", required: true,
        description: "The paper, dataset or results file itself, e.g. https://arxiv.org/abs/2501.12345v2 or a Hugging Face dataset." },
      { id: "licence", type: "dropdown", label: "Licence of the results", required: true, options: LICENCES,
        description: "The licence has to cover the numbers themselves, not just the code." },
      { id: "licence_link", type: "input", label: "Link to the licence or terms" },
      { id: "category", type: "dropdown", label: "Category", required: true, options: CATEGORIES },
      { id: "scale", type: "dropdown", label: "Score type", required: true, options: SCALES },
      { id: "measures", type: "textarea", label: "What it measures and which models it covers", required: true },
    ],
  },
];

export const formFor = (kind: Kind) => FORMS.find((f) => f.kind === kind)!;

// YAML for one form. Scalars are written as JSON strings, which YAML reads the same way.
export function formYaml(f: Form): string {
  const q = (s: string) => JSON.stringify(s);
  const out = [`name: ${q(f.name)}`, `description: ${q(f.description)}`, `labels: [${f.labels.map(q).join(", ")}]`, "body:",
    "  - type: markdown", "    attributes:", "      value: |", ...f.intro.split("\n").map((l) => (l ? `        ${l}` : ""))];
  for (const x of f.fields) {
    out.push(`  - type: ${x.type}`, `    id: ${x.id}`, "    attributes:", `      label: ${q(x.label)}`);
    if (x.description) out.push(`      description: ${q(x.description)}`);
    if (x.placeholder) out.push(`      placeholder: ${q(x.placeholder)}`);
    if (x.multiple) out.push("      multiple: true");
    if (x.options && x.type === "checkboxes") {
      out.push("      options:", ...x.options.flatMap((o) => [`        - label: ${q(o)}`, ...(x.requiredOptions ? ["          required: true"] : [])]));
    } else if (x.options) out.push("      options:", ...x.options.map((o) => `        - ${q(o)}`));
    if (x.required) out.push("    validations:", "      required: true");
  }
  return out.join("\n") + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stale: string[] = [];
  for (const f of FORMS) {
    const file = new URL(`../../.github/ISSUE_TEMPLATE/${f.kind}.yml`, import.meta.url);
    let current = "";
    try { current = readFileSync(file, "utf8"); } catch { /* new form */ }
    if (current === formYaml(f)) continue;
    stale.push(f.kind);
    if (!process.argv.includes("--check")) writeFileSync(file, formYaml(f));
  }
  if (process.argv.includes("--check") && stale.length) {
    console.error(`Out of date: ${stale.join(", ")}. Run: node scripts/contrib/forms.ts`);
    process.exit(1);
  }
  console.log(stale.length ? `${process.argv.includes("--check") ? "Stale" : "Wrote"}: ${stale.join(", ")}` : "Issue forms up to date.");
}
