# Thin text-model results, 2026-10-07

Machine-readable output: `thin-llm-results-2026-10-07.json` (`results`, `benchmarks`, `ledger`, `gaps`, `checked`).
Nothing in `data/` was edited; the JSON is input for a merge (`npm run import` for results, hand-merge for
benchmarks and ledger entries).

## Outcome

- 846 new result rows, none duplicating `data/results.json`.
- Of the 85 listed (runnable) thin models, 55 now reach 3+ counted results. Across all 206 thin models, 72 do.
  These figures come from simulating the `lib/score.ts` run rules: a run needs at least 2 models and a
  benchmark at least 3 models.
- The simulation reports no problems: no unknown ids, no unresolved or colliding sources, and no duplicates.

## Rows per source (evaluator id)

| Source | Rows |
|---|---|
| EvalPlus published runs (existing entry; results.json @87418456) | 127 |
| Granite 3.0 paper, GitHub copy (Table 10, IBM-run baselines) | 75 |
| Aider code-editing runs (new benchmark) | 48 |
| Olmo 3 report, arXiv 2512.13961v2 | 42 |
| WildBench v2 leaderboard data (new benchmark) | 39 |
| MiniCPM paper, arXiv 2404.06395v3 (Table 3, UltraEval runs) | 35 |
| LFM2.5-1.2B-Thinking card (Liquid-run comparisons) | 32 |
| BFCL v3 result archive 2025-06-14 (existing bfcl-result-archive-v4 entry) | 31 |
| Hy3 card (Hy3-preview) / Hy4-preview card appendix | 27 / 26 |
| Tülu 3 paper, arXiv 2411.15124v5 (Table 5) | 27 |
| Qwen3-VL-235B Instruct / Thinking cards (text tables) | 36 / 28 |
| Qwen2.5-VL-32B card | 24 |
| Orca 2 paper, arXiv 2311.11045v2 (author-run baselines) | 24 |
| InternLM GitHub model cards / InstructEval README | 23 / 23 |
| LG AI (EXAONE) vendor-reported | 23 |
| DeepSeek-V3.1-Terminus card | 20 |
| Amazon (Nova Premier report) vendor-reported | 14 |
| GLM-V GitHub benchmark image | 14 |
| Mistral vendor-reported | 13 |
| OpenChat 3.5 card | 12 |
| NVIDIA vendor-reported / Qwen2-0.5B card | 10 / 10 |
| Ministral 3 8B Reasoning card / OpenAI vendor-reported | 8 / 8 |
| Qwen3-Coder-30B card (480B column) | 7 |
| Arcee vendor-reported / Zephyr ORPO card / Open PT leaderboard / DSEffi paper | 6 each |
| EuroEval / Flan-T5 paper (MGSM) | 5 / 5 |
| Devstral Small 2 card | 3 |
| Nemotron-Cascade report | 2 |
| MMLU-Pro author runs | 1 |

Vendor-reported rows (`by: "lab"`) were recorded by hand under `first-party-<vendor>-scores` entries, and
cover only each vendor's own models on existing benchmarks. All other rows come from openly licensed sources
(CC BY 4.0, CC BY-SA 4.0, MIT or Apache-2.0); each ledger entry quotes its licence.

## New benchmarks (2)

- `aider-code-editing`: Aider's 133 Exercism Python exercises with two attempts (`pass_rate_2`). The
  existing Aider entry covers only polyglot.
- `wildbench-v2-wb-score-macro`: WildBench v2 WB-Score (`task_macro`). It is linear, with `latent_scale` 10.

## Ledger (26 entries)

There are 22 new entries: 17 papers, cards or repos and 5 first-party vendor-score entries (LG AI, Amazon, Arcee, Mistral and NVIDIA). URL fragments
separate them from the existing price and context entries that match the same README. Four existing
entries gain `add_match` patterns: `bfcl-result-archive-v4`, `evalplus-published-runs`,
`mmlu-pro-author-runs` and `first-party-openai-scores`.

## Remaining gaps (30 listed models still below 3)

- Two counted results: hunyuan-vision-1-5-thinking, granite-4-1-8b, wizardcoder-python-13b-v1-0, vicuna-7b/13b-v1-5,
  zephyr-7b-alpha, exaone-3-5-2-4b, deepseek-v2-lite-chat.
- One or none: qwen3-max-preview, nova-2-omni, kat-coder-pro-v1, qwq-plus, minimax-m1, eurus-2-7b-prime, bloom,
  aya-vision-32b, hermes-3-llama-3-2-3b, llava-v1-6-34b, minicpm-v-2-6, falcon-180b-chat, dolphin-2-2-1-mistral-7b,
  tinyllama-1-1b-chat-v1-0, gpt-1, olmo-7b-twin-2t, grok-build-0-1, command-a-plus, ernie-4-5-300b-a47b,
  ling-3-0-flash, lfm2-5-8b-a1b, k2-horizon-7b.

Main blockers:

- Technical reports under arXiv's default licence: Nova, Qwen2/Qwen2.5-VL/Qwen3-VL, MiniMax-M1, EXAONE and
  LLaVA-OneVision.
- Leaderboards with no licence: LiveBench and SWE-bench experiments.
- Vendor tables whose competitor columns have no statement that the vendor ran them. Rule (b) excludes these.
- A missing Nova 2 report: HTTP 404 with no archived copy.
- Granite 4.1 siblings that are not in the catalogue.

The `checked` list in the JSON records every source looked at, including those rejected and the reasons.
