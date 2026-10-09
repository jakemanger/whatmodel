# Pass 6: τ²-bench Telecom (2026-10-09)

Data: [pass6-tau2telecom-2026-10-09.json](pass6-tau2telecom-2026-10-09.json). Nothing in `data/` was changed.

Command A+ has one τ²-bench Telecom result: Cohere's own 0.85, in a two-model run with Command A Reasoning's 0.37. This pass looks for other models measured on the same test, so the owner can judge that 0.85 against them.

## Counts

| Part | Count |
|---|---|
| `results` | 68 rows: 67 `tau2-telecom` and 1 `tau3-telecom`. 40 rows are independent and 28 are lab. |
| Runs | 20 runs. 17 have two or more catalogue models. 3 have one model: DeepSeek V3.2, Arcee and Mistral (τ³). |
| `ledger` | 10 new entries and 7 `add_match` entries on existing first-party ledgers. |
| `models` | 1 comparison-only entry, `qwen3-max-2026-01-23`, so the Qwen leaderboard run counts. |
| `benchmarks` | None. |

## Runs

| Run (`source_id`) | Kind | Models | Rows |
|---|---|---|---|
| `card-moonshotai-kimi-k2-instruct` | card (Modified MIT, flagged) | 7 | Kimi K2 0.658 (lab); DeepSeek-V3-0324, Qwen3-235B-A22B NT, Claude Sonnet 4, Claude Opus 4 (no extended thinking), GPT-4.1, Gemini 2.5 Flash 05-20 |
| `card-meituan-longcat-flash-chat` | card (MIT) | 6 | DeepSeek V3.1 NT, Qwen3-235B-Instruct-2507, Kimi K2, GPT-4.1, Claude Sonnet 4 NT, Gemini 2.5 Flash NT |
| `paper-2508.18669v1-mua-rl` | paper (CC BY), GPT-4.1 user | 6 | GPT-4o-1120, GPT-4.1, DeepSeek-V3-0324, Qwen3-8B/14B/32B NT |
| `card-meituan-longcat-flash-thinking` | card (MIT) | 5 | DeepSeek V3.1 thinking, Qwen3-235B-Thinking-2507, GLM-4.5, o3, Gemini 2.5 Pro |
| `card-liquidai-lfm2-5-8b-a1b` (existing) | card | +4 | Qwen3.5-4B 0.877, Qwen3-30B-Thinking-2507, Gemma 4 E2B/E4B (joins the existing 2 LFM rows) |
| `paper-2606.03892v2-synthesize-and-reward` | paper (CC BY, IBM) | 4 | Qwen3-4B-Instruct-2507, Qwen3-8B, Qwen2.5-7B, Granite 4.1 8B (lab) |
| `report-2601.03286v1` | report (CC BY, flagged), GPT-4.1 user | 3 | EXAONE 4.0 32B, GPT-5.1 (medium), Qwen3-235B-A22B |
| `paper-2606.28715v2-seataubench` | paper (CC BY) | 3 | GPT-5 mini, Qwen3-235B-Instruct-2507, Kimi K2.5 0.997 |
| `report-2601.07022v1` | report (CC BY) | 2 | gpt-oss-120b (high) 0.577, GLM-4.5-Air 0.281 |
| `paper-2602.22697v1-interactcs-rl` | paper (CC BY) | 2 | Qwen2.5-7B, Qwen2.5-14B |
| `first-party-openai-scores` | lab | +8 | GPT-5 developer post: GPT-5 0.967, GPT-5 mini/nano, o3, o4-mini, GPT-4.1, GPT-4.1 mini/nano (join GPT-5.5/5.4) |
| `first-party-anthropic-scores` | lab | 4 | Opus 4.5 0.982, Opus 4.1 0.715, Opus 4.6 0.9925, Sonnet 4.6 0.979 |
| `first-party-nvidia-scores` | lab | 3 | Nemotron 3 Nano 30B 0.422, Super 0.644, Nano 4B 0.33 |
| `tau2-bench-leaderboard-qwen` | leaderboard (MIT) | 2 | Qwen3-Max-Thinking 0.982 (needs the new model), Qwen3-Max 0.842 |
| `first-party-google-scores` | lab | 2 | Gemini 3 Pro 0.98, Gemini 3.1 Pro 0.993 |
| `first-party-lgai-scores` | lab | 2 | EXAONE 4.5 33B 0.73, EXAONE 4.0 32B 0.237 |
| `card-qwen--qwen3-4b-instruct-2507` (existing) | card | +2 | Qwen3-30B-A3B NT 0.184, Qwen3-4B NT 0.175 (makes the card run count) |
| `card2-deepseek-ai-deepseek-v3-2` (existing) | report PDF in MIT repo | 1 | DeepSeek V3.2 0.962 (V3.2 as its own user) |
| `first-party-arcee-scores` | lab | 1 | Trinity-Large-Thinking 0.947 |
| `first-party-mistral-scores` | lab | 1 | Mistral Medium 3.5, **τ³**-Telecom 0.914 (`tau3-telecom`) |

## The τ²-bench leaderboard (task 1)

- **No new commit.** The latest commit on `main` is still `4ce7c03` (2026-10-06), the commit already imported. Every submission was read (see `checked`).
- **Original τ² telecom.** The only new usable entries are Qwen's two (Qwen3-Max-Thinking, which has trajectories, a GPT-4.1 user and agent `qwen3-max-2026-01-23`, and Qwen3-Max 09-23, which is unverified). DeepSeek V3.2 and Gemini 3 Pro are vendor figures that Sierra staff transcribed into the board, so they are taken from the vendors' own documents instead.
- **Skipped.**
  - ToolOrchestra: an orchestration system, not a model.
  - Qwen3-Max-Thinking-Preview: dropped from the manifest, and not catalogued.
  - The deleted Fireworks GLM-5.2 run: v1.0.0, with GLM-5.2 as its own user.
  - Voice entries.
- **τ³ telecom.** Nothing new. The 2026-05/08 Sierra runs report banking only. `gpt-5-2-none` is a lower reasoning setting of an imported model.
- **τ² vs τ³ telecom.** They are the same test material. The 114 telecom tasks, the policy, the manual and the DBs are byte-identical from v0.1.3 to v1.0.1, and the default user model is gpt-4.1 in every release. The τ³ task fixes touch airline, retail and banking only. Separate ids are still right, because Sierra's v1.0.1 runs use a gpt-5.2 user.

## Gemma 4 (task 4): recommend treating `tau2-telecom-gemma4` as `tau2-telecom`

- **What the report says.** The report's Table 5 rows are "Tau2 – airline/retail/telecom" and cite Barres et al. 2025. Their mean equals the cards' "Tau2 (average over 3)".
- **What it doesn't say.** It gives no harness, version or user simulator. Most `tau2-telecom` rows don't either.
- **Why it doesn't matter for telecom.** Telecom content is the same in every tau2-bench release, and runs keep their own level when merged.
- **What to keep separate.** Keep the airline and retail Gemma ids separate, because those tasks changed in v1.0.0.

## Held for the owner (in `held_for_owner`)

1. **Licence sign-off.**
   - The Kimi K2 card uses a Modified MIT licence: a display condition applies above 100M MAU or $20M monthly revenue.
   - The HyperCLOVA X report is CC BY on arXiv but also prints "All rights reserved".
   - Both sets of rows are in `results`. Drop them if the owner does not accept these licences.
2. **OpenAI GPT-5.1 (0.956) and GPT-5.2 (0.987) are not in `results`.** OpenAI ran both with an added telecom prompt. This matches the 2026-10-07 decision to keep `tau2-telecom` to the "original prompts" figures.
3. **MiniMax M2/M2.1 τ²-Bench Telecom is not in `results`.** It uses the Artificial Analysis methodology, and some cells appear to repeat AA figures.
4. **Not in `results`:**
   - Nemotron 3 Ultra report: a τ³ telecom table for 7 models. The ledger scope excludes the competitor columns.
   - Qwen3-VL report: one new catalogue datum, held because its anchors are reprints.
   - MiMo-V2-Pro: the value is in chart data only.
   - Seed2.0: no two-model run is possible.
5. **Qwen card reprints are mostly in `data/` already**, added since this pass started. Two cells remain un-added (listed in `held_for_owner`).
6. **Context for Command A+.**
   - Telecom is being trained on directly. NVIDIA cards list "Tau2 telecom trajectories" as training data.
   - Small 2026 models score above 0.85 in independent runs (Qwen3.5-4B 0.877, LFM2.5-8B-A1B 0.881).
   - Cohere's run is still the only measurement of Command A+ on this test. No source here measures Command A+ itself.

## Scoring effect

This was simulated on a scratch copy: the 2026-10-09 working-tree data plus these candidates, through `lib/data.ts`.

- **Command A+.** Its g goes from 66.8±2.2 to 65.7±2.0. Its τ² telecom result now implies g 67.7 instead of 74.0, but it carries 37.5% of the model's weight (was 21.7%), because the test's discrimination rises (a 1.92 → 2.53).
- **The Cohere run's level.** It sits about 1.2 logits above the test's common level, so the fit already treats Cohere's run as hot.
- **Command A Reasoning.** Unchanged, 53.5 → 53.6.
- **The real limit.** Lowering Command A+ further needs an independent measurement of Command A+ itself. None was found.

## Merge notes

- **Order.** Ledger first: strip `action`, `scope` and `evidence_url`, and extend the existing entries' `match` for `add_match`. Then the model, then `npm run import`.
- **New icons.** None; the ledger entries reuse the `arxiv.org`, `huggingface.co` and `github.com` icons.
- **Duplicates.** The duplicate check against the current working-tree `data/results.json` dropped two Qwen rows that another pass has since added.
