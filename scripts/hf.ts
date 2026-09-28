// Prepares the Hugging Face dataset mirror in dist/hf: the exported data and CSVs, the licence
// notices and a dataset card. It doesn't upload anything. To publish:
//   hf upload <user>/whatmodel dist/hf . --repo-type dataset
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const out = new URL("dist/hf/", root);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
execFileSync(process.execPath, [fileURLToPath(new URL("scripts/export-data.ts", root)), "--out", fileURLToPath(new URL("data", out))], { stdio: "inherit" });
cpSync(new URL("licenses", root), new URL("licenses", out), { recursive: true });
cpSync(new URL("DATA-LICENSE.md", root), new URL("DATA-LICENSE.md", out));

const manifest = JSON.parse(readFileSync(new URL("data/manifest.json", out), "utf8"));
const rows = (file: string) => readFileSync(new URL(`data/${file}`, out), "utf8").trimEnd().split("\n").length - 1;
const tables: [string, string, string][] = [
  ["scores", "scores.csv", "One score per model and comparison set: rank, score (50 = average model), uncertainty and how many results it used"],
  ["models", "models.csv", "Every model in the catalogue: provider, category, size, licence, context window, API price and link"],
  ["results", "results.csv", "Every benchmark result, as normalised and as published, with who reported it, when, and a link to the source"],
  ["speeds", "speeds.csv", "Published speed measurements with the hardware, precision, engine, settings and source"],
  ["bench_runs", "bench-runs.csv", "Reviewed community runs of the whatmodel.sh bench script"],
];
const GITHUB = "https://github.com/jakemanger/whatmodel";

const card = `---
license: cc-by-sa-4.0
pretty_name: whatmodel.sh leaderboard data
language:
  - en
tags:
  - leaderboard
  - benchmark
  - llm
  - local-llm
  - text-to-image
  - text-to-video
  - text-to-speech
  - speech-to-text
size_categories:
  - 1K<n<10K
configs:
${tables.map(([name, file], i) => `  - config_name: ${name}\n    data_files: data/${file}${i === 0 ? "\n    default: true" : ""}`).join("\n")}
---

# whatmodel.sh leaderboard data

Scores, benchmark results, prices and measured speeds for AI models (LLMs, image, video, text-to-speech and
speech-to-text) from [whatmodel.sh](https://whatmodel.sh). Every result links to its source. This is a mirror
of [${GITHUB.replace("https://", "")}](${GITHUB}), where the data is maintained and where corrections go.

Data updated ${manifest.updated}.

## Tables

| Config | Rows | Contents |
|---|---:|---|
${tables.map(([name, file, what]) => `| \`${name}\` | ${rows(file)} | ${what} |`).join("\n")}

\`data/\` also has the full JSON files these tables come from, and \`data/manifest.json\` lists every file with
its SHA-256.

## How scores are calculated

Each category's score comes from a one-factor latent model fitted to the benchmark results, within sets of
models that share enough benchmarks to be compared. Scores in different comparison sets can't be compared.
The method is explained in [pages/method.md](${GITHUB}/blob/main/pages/method.md) and implemented in
[lib/score.ts](${GITHUB}/blob/main/lib/score.ts).

## Licence and attribution

Our contributions to the compilation, adaptations and derived scores are licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/): credit whatmodel.sh and share adaptations
under the same licence. Each source's own licence also applies. \`data/sources.json\` lists the sources with
their attribution, and \`licenses/\` has the full notices. See [DATA-LICENSE.md](DATA-LICENSE.md).
Community bench runs are released under CC0 1.0. Sources don't endorse whatmodel.sh, and the data is
provided as-is.
`;
writeFileSync(new URL("README.md", out), card);
console.log(`Prepared dist/hf (${tables.length} tables). Nothing was uploaded.`);
