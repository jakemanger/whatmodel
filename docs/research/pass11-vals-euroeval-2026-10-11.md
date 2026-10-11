# Pass 11: Legal Research Bench and the held EuroEval rows (2026-10-11)

## Legal Research Bench (26 rows)

Legal Research Bench (arXiv:2610.00609v1, CC BY 4.0) was held in pass 10 because the agent briefs listed
vals.ai as an aggregator. That was wrong. Vals AI runs its own tests, and the owner never excluded it. The paper
is the authors' own run of 13 frontier models on 413 attorney-written legal research questions.

- `legal-research-bench-allpass`: Table 3 all-pass, with the agent harness (tasks: agents, search).
- `legal-research-bench-no-tools-allpass`: Table 4 all-pass, answered single-shot with no tools.

Weighted pass is a partial-credit metric on the same answers and is not imported. The paper does not state the
reasoning settings. "DeepSeek-V4-Pro" maps to the April 2026 preview, because the paper says every model was
released between February and June 2026. The live vals.ai leaderboard page is not covered by the paper's licence.

## EuroEval (16 rows)

These are the cells held at the 2026-10-06 import: GPT-2 small/medium/large, Llama 2 7B/13B base, Gemma 3 270M IT,
Gemma 2B (IT and base), Gemma 7B IT, Phi-4-reasoning-plus and DeepSeek-R1-Distill-Qwen-1.5B. They were held
because, under the engine of that day, they joined the historical models' separate scale to the main one and
placed GPT-3 davinci above GPT-4. That no longer happens: the historical models are already on the main scale,
and GPT-3 davinci sits at 33.3 against 52.3 for GPT-4 0314. Each value was re-read from the pinned
`english_all.csv` @1a77f1d. Llama 2 13B has no HellaSwag cell there.

Rank changes are small. Phi-4-reasoning-plus moves #307 → #319 because its HellaSwag cell sits at chance
(24.98%, MCC 0.57). This looks like unparsed answers, but it is at the baseline rather than far below it, so it
counts under the UPDATING.md invalid-run rule.
