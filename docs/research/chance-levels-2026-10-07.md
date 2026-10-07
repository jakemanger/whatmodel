# Chance levels for accuracy benchmarks (2026-10-07)

Companion to `chance-levels-2026-10-07.json`, which lists only the "set" decisions, each with a primary source URL and a quote. `data/benchmarks.json` has not been changed.

## Rule

`chance = 1/k` only when every item is multiple choice with the same number of options k, and the reported metric is plain accuracy on that format. Everything else stays at 0. That covers generative tests, mixed formats or mixed k, averages of suites, non-accuracy metrics (MC2, F1, chrF, judge or rubric scores, win rates), and TTS, STT, image and video metrics. Sources used: arXiv papers, official repos, HF dataset cards, and the HF dataset viewer for counting options per item.

Two near-uniform exceptions are set and flagged:
- `arc-challenge`: items have 3 to 5 options (mean 4.0), but the paper measures its own guess-all baseline at 25.02%.
- `mmstar`: 1,499 of 1,500 items have 4 options, giving an expected rate of 0.25006.

## Counts (403 `acc` benchmarks with no `chance`)

| Decision | n |
|---|---|
| set | 39 |
| left: generative / agentic / free-form | 221 |
| left: mixed or uncertain multiple choice | 40 |
| left: other (83 TTS/STT/image/video + 20 LLM win-rate, F1, chrF, judge/rubric scores and averages) | 103 |

There are also 3 corrections to explicit `chance: 0` values: `copen-csj…`, `copen-cpj…` and `kobalt-700-kim`. They are in the JSON too, giving 42 entries in total.

## Set

- **k=4 (0.25):** mmlu, simple-evals-mmlu, mmlu-redux, mmmlu, mmmlu-marco, mmmlu-liquid-seven-language, global-mmlu, global-mmlu-marco, global-mmlu-lite, arc-challenge*, hellaswag, openbookqa, gpqa-unspecified, gpqa-main, gpqa-diamond-google-relaxed, gpqa-unspecified-with-tools, simple-evals-gpqa-diamond, longbench-v2, c-eval, cmmlu, include (BASE/LITE are 4-option by construction), mmstar*, ai2d-test, videomme-with-sub, videomme-without-sub, lvbench, hr-bench-4k (accuracy averaged over cyclic option rotations), dailyomni, thunder-konubench-symbol-zero-shot
- **k=2 (0.5):** piqa, winogrande, boolq (the majority class scores 62%), cluewsc (binary co-reference), global-piqa, flenqa-3k (True/False)
- **k=3 (0.3333):** social-iqa
- **k=5 (0.2):** medxpertqa-mm (all 2,000 MM test items have A–E), kcl-mcqa-vanilla
- **k=6 (0.1667):** videoholmes (all 1,837 test items have A–F)
- **Corrections:** copen-csj-zero-shot-full-prompt 0 → 0.0476 (21 candidates; paper's random baseline 4.8%), copen-cpj-zero-shot-full-prompt 0 → 0.5 (binary), kobalt-700-kim 0 → 0.1 (all 700 items have A–J)

## Left as mixed or uncertain (stay 0)

- **Mixed k (option counts measured):**
  - mmlu-prox / mmlu-prox-lite / mmlu-prox-lite-marco: 3–10 options, only 83.6% have 10; E[1/k] ≈ 0.110.
  - supergpqa: averages 9.67 options per item.
  - mmmu-pro, mmmu-pro-standard-lmms-exaone45, mmmu-pro-vision-lmms-exaone45: only about 70% of items have 10 options (2–12 overall); E[1/k] ≈ 0.127.
  - mvbench: 3–5 options; the paper's random baseline is 27.3%.
  - mmau: option count varies by item.
  - superchem: up to 26 options.
  - vstar-with-python: subsets with 4 and 2 options.
  - mmbench-en-dev-v1-1: 2–4 options, scored with CircularEval.
- **Mixed format:**
  - agieval-en / agieval-marco-unspecified / agieval-gemma-en, bbh, bbeh-micro: suites mixing cloze items and items with different option counts.
  - musr: 2 options, a varying number, and 3 options across its three tasks.
  - hle-gemma4-report, hle-with-tools: mostly exact-answer, some multiple choice.
  - mmmu, math-vision, mathvista-mini, dynamath, we-math, videommmu, mmvu, slake, realworldqa, mixeval-hard: mix multiple choice with free-form answers.
  - nova-63: multiple-choice items (some with multi-letter answers) plus QA items.
- **Not plain accuracy:**
  - truthfulqa-mc2: normalised probability mass.
  - hallusionbench: the reported score usually blends question-, figure- and pair-level accuracy.
- **Uncertain:**
  - mlvu: 4 options on dev, 6 on test, and sources don't say which split they used.
  - pmc-vqa: has both a 4-option Choice task and an open Blanking task, and the source doesn't say which it reports.
  - multilingual-mmlu: the Phi card doesn't identify the dataset. It is likely 4-option.
  - erqa: the README says answers are "a single letter (A, B, C, D)", but the option count per item isn't stated.
  - embspatialbench: the option count isn't stated in the paper.
  - babyvision-with-tools, chartography-with-tools: format not verified.

## Existing values to review

- **`mmlu-pro`, `vector-inspect-mmlu-pro` = 0.1:** the paper says "83% have ten options, 17% have fewer, and the average options count per question is 9.47". The HF viewer shows a minimum of 3 options. The true guess rate is E[1/k] ≈ 0.111. Under the strict rule MMLU-Pro is mixed. 0.1 is a slight underestimate, and 0.111 would be exact.
- **`copen-cic-zero-shot-full-prompt` = 0:** the number of candidates varies by item. The paper's own random baseline is 27.7%, so a random guesser is far above 0, but the rule keeps it at 0.
- **`sciclaimeval-t1-pair-dev` = 0:** a pair of binary claims gives about 0.25 under random guessing, but the metric is not plain accuracy. Not verified.
- **Checked and fine at 0 (mixed k):**
  - haerae-korean-kim
  - click-korean-kim: the paper normalises "considering varying numbers of total options".
  - kmmlu-pro-kim: "The number of options is adjusted for each problems".
  - musr-ko-kim
- **Checked and plausible:** the other non-zero values (pubmedqa 1/3, mathqa and commonsenseqa 0.2, copa and storycloze 0.5, sciq and arc-easy 0.25, and the 1–5 rating floors of 0.2).

## Side effect to watch

Some results score below the new chance values: 15 on arc-challenge (Pythia 70m–1b, GPT-3 ada, BLOOM-560m), 13 on openbookqa, both gemma-3n gpqa-diamond-google-relaxed rows (0.237 and 0.248), and 6 of 8 copen-cpj rows. `toLatent` clamps them to 0.005, so they all land on the same floor and their order relative to each other is lost.
