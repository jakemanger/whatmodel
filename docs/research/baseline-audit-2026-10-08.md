# Random-baseline and failed-run audit (2026-10-08)

Companion to `baseline-audit-2026-10-08.json`. That file has every quote and URL, the effect of each change, a floor scan of all 597 `acc` benchmarks, and the benchmarks that were checked but have no published baseline. `data/*.json` is unchanged.

**What prompted this:** GPT-1's failed 1.96% run on `open-pt-llm-avg9`, which has now been fixed with `chance: 0.3264`.

**Rule:** a chance level is proposed only when the source states a random baseline, or when the source lists a baseline for each part and defines the score as their mean. The 2026-10-07 "set" decisions were not revisited.

## Proposed `chance` values (10)

| id | chance | source | effect on g |
|---|---|---|---|
| bbh | 0.257 | BBH paper Table 3, "Random … All Tasks (avg) 25.7" | 7 models move ≥1; largest is gemma-3-270m, 5.0 → 0.2 |
| copen-cic-zero-shot-full-prompt | 0.277 | COPEN Table 2, "Random" CiC ZP 27.7 | large, see below |
| mvbench | 0.273 | MVBench Table 2, "Random … 27.3" | none (max 0.02) |
| mmmu | 0.221 | MMMU, "Random Choice 22.1" (val) | none |
| mmmu-pro | 0.126 | MMMU-Pro Table 1: 12.8 (10 options) and 12.4 (vision); "overall … is calculated as the average" of the two | none (max 0.1) |
| mmmu-pro-standard / -vision-lmms-exaone45 | 0.128 / 0.124 | same table | none (single results) |
| mathvista-mini | 0.179 | MathVista Table 2, "Random chance 17.9" | none |
| math-vision | 0.0717 | MATH-V, "random chance (7.17% overall)" | none |
| videommmu | 0.14 | Video-MMMU, "Random Choice 14.00" | none |

`copen-cic`, `mvbench`, `mmmu`, `mmmu-pro`, `mathvista-mini`, `math-vision`, `videommmu` and `bbh` were left at 0 on 2026-10-07 under the strict 1/k rule. They are reopened only because the source publishes a random baseline.

The vision and video changes are correct but cosmetic, because every result is far above the baseline. Only `bbh` and `copen-cic` change any scores.

## Checked, not proposed

- **truthfulqa-mc2:** the Open LLM Leaderboard v1 lists 25.0, but that is wrong for MC2. A uniform-probability model scores 0.448 (computed from the dataset), and many real models score below that.
- **hallusionbench:** the paper lists qAcc 15.6, fAcc 18.2 and aAcc 46.0, but our sources don't say which metric they report.
- **mlvu:** the random baseline is 25 on dev and 16.7 on test, and our sources don't say which split they used.
- **No published baseline found:** open-persian-llm-v2-avg21, bridge-clinical-zeroshot-avg, mideind-icelandic-average, agieval-*, supergpqa, mmlu-prox*, sciclaimeval, erqa, mmvu, dynamath, embspatialbench, mmbench.
- **F1 benchmarks:** all of them (drop, tydiqa, widesearch) are generative, so chance 0 is right.
- **Polish, Persian, Icelandic and Portuguese leaderboard averages:** only the Portuguese one publishes a baseline. No Korean, Japanese or Arabic leaderboard averages are in the catalogue.

## Likely failed runs (none proposed for deletion)

| model · bench | score | evidence | does the source flag it? |
|---|---|---|---|
| zephyr-7b-beta · bbh / gsm8k (OpenChat 3.5 card) | 0.16 / 0.051 | Tulu 2 paper has 0.449 / 0.28 for the same model; card: "Zephyr-β often fails to follow few-shot CoT instructions" | yes |
| deepseek-r1-0528-qwen3-8b · gpqa-diamond (Epoch) | 0.093 | below 25% guessing; 0.611 and 0.614 in two other sources | no |
| llama-3-1-nemotron-ultra-253b · bfcl-v4 | 0.10 | 0% in every category except Irrelevance 100%, so it never made a call | no (visible in the CSV) |
| ministral-8b-2410 · bfcl-v4 | 0.111 | same all-zero pattern | no |
| qwen3-5-0-8b · gpqa-unspecified (Qwen card) | 0.119 | below guessing in thinking mode | partly: the loop warning names the 2B, not the 0.8B |
| yi-34b-chat, mistral-7b-instruct-v0-3, granite-4-0-350m · gpqa-diamond (Epoch); llama-3-2-1b (Liquid card) | 0.11–0.17 | below 25% guessing; Epoch measures llama-3-2-1b at 0.239 | no |
| granite-4-2-3b · mmlu-prox-lite (IBM card) | 0.278 | 6 points behind its 8B sibling on MMLU-Pro but 33 behind on MMLU-ProX-Lite | no (moderate evidence) |

The GPQA rows are already floored by chance 0.25, so each one now implies about g 27.5. Leaving the result out would raise its model by at most 4.6 (granite-4-0-350m, where it carries 37% of the weight).

`bfcl-v4` and `gsm8k` have chance 0, so no floor applies there. Nemotron Ultra currently loses 2.7 points from its run.

## Side effect to know about

`toLatent` puts every score at or below chance on the same floor, logit(0.005) = −5.29, and scores just above chance get almost as low.

- **The open-pt fix you already applied** moved GPT-1 from −39.1 to −6.9. It also pulled `tinyllama-1-1b-chat` from 13.2 to −6.9, because that model's only result is 0.282, just under the 0.3264 baseline. `phi-1` and `gemma-3-270m` (0.275 and 0.282) now share that floor too.
- **Under copen-cic 0.277:**
  - gpt-neo-125m (0.288, just above chance) drops from 22.2 to 7.9.
  - t5-small (0.401) rises from 22.5 to 36.2.

  Both models have only three COPEN results, so this one test decides their scores.

These are not data errors. The 0.005 floor decides how far below the field an at-chance result lands.
