# Pass 8: refresh existing licensed LLM sources (2026-10-09/10)

Candidates are in `pass8-refresh-2026-10-09.json`. `data/` was not edited.

The file holds 237 result rows, 11 proposed models, 1 new benchmark (`math-l5-zeroeval`), 6 ledger changes (5 `add_match` and 1 new `card3-*` entry), 57 gaps and 20 held-for-owner items. Every row resolves to its stated ledger id, with the proposed `add_match`/new entries applied (`lib/sources.ts` `sourceIn`). No row duplicates a model + bench + source already in `data/results.json`. No row or model id collides with `pass8-llm-models-2026-10-09.json` or `pass8-visual-models-2026-10-09.json`. The Vectara Jamba rows are theirs, so they are not repeated here.

## Snapshot status

Almost nothing upstream has moved. The only content change in a ledger-scoped file is Epoch's zip.

| Source | Pinned | Latest upstream (2026-10-09) | Content change |
|---|---|---|---|
| epoch-internal | zip of 2026-10-08 | zip re-fetched 2026-10-09, sha256 a2381ce3… | `frontiermath_erdos.csv` +2 rows (Opus 5.5, Sonnet 5.5). All 1011 recorded rows were re-verified, and none changed. |
| bfcl-result-archive-v4 | cadd76a | cadd76a | none. The last result folder is still 2025-12-16. |
| terminal-bench-leaderboard-submissions | 8d0eb80 | 209679e | none. The 11 newer commits do not touch `leaderboard/`. |
| tau2-bench-leaderboard-* | 4ce7c03 | 4ce7c03 | none |
| matharena-arxiv-outputs-bysa | 16 revisions | same | none. No new CC BY-SA `_outputs` set: arxivcs-0826 and arxivphys-0826 have no outputs yet, and the training splits are not tests. |
| arcprize-model-baseline-outputs | 3e9c9d1 / 026789c | same | none. There is no `arc_agi_v3` dataset. |
| vectara (main / old-dataset branch) | af0e320 / 9ceb782 | same | none |
| aider (polyglot, code-editing) | 5dc9490 | same | none |
| eqbench3, judgemark-v2, arena-hard-auto, wildbench, scicode, livecodebench site, evalplus, zeroeval, alpaca_eval | pinned | same | none |
| galileo, vector-inspect, browsergym, webapp1k, roblox (HF Spaces) | pinned | same | none. Roblox 676755c vs 3fcd299: the new entries were already recorded. |

No value changed anywhere, so no row re-adds an old value and nothing is held for a changed value.

## Rows by source (237)

- **evalplus-published-runs (59):** 21 entries the earlier link-based mapping missed. These are base Code Llama, GPT-J and GPT-Neo checkpoints, Mistral-7B-v0.1, and dated API entries (Claude 3 family, o1-preview and o1-mini, GPT-4 Turbo, Gemini 1.5 002, Mistral Large 2402), plus 1 EvalPerf row (Magicoder-S-DS-6.7B).
- **bfcl-result-archive-v4 (58):**
  - bfcl-v3 @2025-06-14: 30 catalogue models the first import skipped.
  - bfcl-v3 from the 2025-04-25 / 2025-04-13 folders: 22 rows (see owner checks below).
  - bfcl-v4 @2025-12-16: DeepSeek-V3.2-Exp, plus rows for the proposed Grok 4.1 Fast Non-Reasoning, Bielik, MiniCPM3 and Palmyra.
- **zeroeval-published-results (50):**
  - 14 rows from aliases resolved by commit date and Cohere's alias docs (gemini-1.5-pro/-flash to -001, command-r to 03-2024, command-r-plus to 04-2024).
  - 36 rows on the new benchmark `math-l5-zeroeval`: ZeroEval's 721-problem AIMO MATH Level 5 set. This is not Epoch's `math-level-5`. There are 35 catalogue models in one run.
- **card3-open-thoughts-openthinker2-32b (12, new ledger entry, Apache-2.0 card @0aefafe):** the card says every number was "evaluated with our open-source tool Evalchemy". It covers OpenThinker2-32B (by: lab), and DeepSeek-R1-Distill-Qwen-32B and s1.1-32B (independent).
- **epoch-internal (9):**
  - FrontierMath-Erdős: Sonnet 5.5 0.029 and Opus 5.5 0.0294 (both new in the zip), and GPT-5.5 0.0 (an old row the first pass skipped). This makes a 7-model run.
  - deepseek-v4-pro-preview: 6 max-effort runs from 2026-06-16..18, before the 0813 release took over the API id.
- **matharena-arxiv-outputs-bysa (8):**
  - ArXivLean June 2026: Opus 4.8, Gemini 3.1 Pro, GLM-5.2, Step 3.7 Flash (0.0) and GPT-5.6 Sol. The first import took only its target models.
  - QED-Nano: ArXivMath Dec, Jan and Feb (proposed model).
- **servicenow-browsergym-leaderboard (8):** GenericAgent-GPT-4o maps to `gpt-4o-2024-08-06`, and GenericAgent-Claude-3.5-Sonnet to `claude-3-5-sonnet-20241022`, each on 4 tasks. The checkpoints come from the BrowserGym paper; the numbers come from the Space.
- **vectara-hallucination-leaderboard-apache (5):**
  - mistral-large-2 (`mistral-large-2411`, 0.955).
  - gemini-3-1-flash-lite (`-preview`, 0.918).
  - deepseek-v4-pro-preview (`deepseek-ai/DeepSeek-V4-Pro`, added 2026-05-11, 0.914).
  - minimax-m2-1 (`m2p1`, 0.882).
  - grok-4-1-fast-non-reasoning (0.822).
- **arena-hard-auto-readme-v2 (4):** OpenThinker2-32B and s1.1-32B, on hard prompts and creative writing.
- **vector-inspect-evals-leaderboard (4):** 'gpt-4o' maps to `gpt-4o-2024-08-06`, using the `output.model` recorded in its Inspect logs.
- **webapp1k-leaderboard (4):** Gemini 1.5 Pro/Flash 001 (first published 2024-07-22), plus duo rows for gemini-2.5-pro-preview-03-25 (published before the 05-06 repoint) and gpt-5-codex.
- **tau2-bench-leaderboard-qwen (4, by: lab):** retail and airline for Qwen's two submissions. Telecom had been the only domain imported. Qwen3-Max-Thinking retail 0.7939 and airline 0.69 were recomputed from the 70e700c trajectories (agent `qwen3-max-2026-01-23`). Qwen3-Max 2025-09-23 retail 0.722 and airline 0.595 carry the same "unverified" caution as its telecom row. This adds two 2-model Qwen runs.
- **terminal-bench-leaderboard-submissions (3):** claude-opus-4-8 0.2364, claude-sonnet-5 0.1242 and glm-5-3-flash 0.3576. With these, all 21 TB4 submissions are covered.
- **galileo-agent-leaderboard (3):** gemini-2.5-pro-preview-03-25 0.941, gemini-2.0-flash-lite-001 0.933 and palmyra-x-004 0.886.
- **One row each:**
  - wildbench: reka-flash-21b-20240226.
  - scicode: deepseek-coder-v2.
  - aider-code-editing: Qwen2.5-Coder-1.5B.
  - aider-polyglot: Gemini 2.5 Pro Preview 03-25, 0.729, run 2025-04-12.
- **Nothing new:** alpaca-eval (every unrecorded entry is a dev/verbose variant, fine-tune, alias or Turbo), livecodebench site, eqbench3, judgemark, roblox, and terminal-bench beyond the 3 rows above.

## Proposed models (11)

Each one lands in existing multi-model runs. Run sizes below include the new rows.

| id | type | runs it joins |
|---|---|---|
| `gemini-2-5-pro-preview-03-25` | comparison-only (shut down) | aider-polyglot (44), galileo v1 (31), webapp1k-duo (45) |
| `palmyra-x-004` | comparison-only, new provider "Writer" (needs a logo) | bfcl-v3 (84), bfcl-v4 (59), galileo v1 (31) |
| `grok-4-1-fast-non-reasoning` | full entry (Azure route, price, context) | bfcl-v4 (59), vectara (96) |
| `gemini-2-0-flash-lite-001` | comparison-only (shut down 2026-06-01) | bfcl-v3 (84), galileo v1 (31) |
| `bielik-11b-v2-3-instruct` | local (official GGUF) | bfcl-v3, bfcl-v4 |
| `minicpm3-4b` | local (official GGUF; MiniCPM licence) | bfcl-v3, bfcl-v4 |
| `qed-nano` | local (vLLM, bf16) | ArXivMath Dec/Jan/Feb (19–25 models) |
| `openthinker2-32b` | local (vLLM, bf16 65.5 GB) | arena-hard ×2 (23), plus its own card ×4 (3) |
| `s1-1-32b` | local (vLLM, fp32 131 GB); new provider "Simple Scaling" (needs a logo) | arena-hard ×2, plus the OpenThinker2 card ×4 |
| `qwen2-5-coder-1-5b` | local (Ollama tags) | aider-code-editing (49), one result only |
| `gpt-5-codex` | comparison-only | webapp1k-duo (45), one result only |

`palmyra-x-004` is tied to Palmyra X4 by Writer's own post. That post is the BFCL model link: "actions-with-palmyra-x-004", titled "Introducing actions with Palmyra X4". Writer's docs list the API id `palmyra-x4`, but they do not say it serves the evaluated `palmyra-x-004`, so I attached no run route or price.

## Owner checks inside the proposed rows

- **BFCL v3 rows from the April 2025 folders** (22 rows). These are taken only for models absent from the pinned 2025-06-14 file, following the lmarena "earlier rows retained only when absent" rule. Fork C showed the scoring is the same: 93 of 94 common entries (2025-04-25) and 74 of 76 (2025-04-13) are identical to 2025-06-14. Drop them if the owner wants bfcl-v3 to stay a single-snapshot run.
- **Alias rows resolved by date:**
  - EvalPlus "GPT-4 (May 2023)" maps to gpt-4-0314 and "GPT-3.5 (May 2023)" to gpt-3.5-turbo-0301.
  - ZeroEval gemini-1.5-* maps to -001 because the files were committed before -002.
  - ZeroEval command-r/-plus follow Cohere's alias docs.
- **BFCL modes:**
  - Llama-3.1-70B uses its Prompt entry (0.5357), to match the recorded Llama-3.1-8B v3 row. The FC entry is 0.2712.
  - DeepSeek-V3.2-Exp uses FC (0.5412). The "Prompt + Thinking" entry is 0.5673.

## Held for owner (20, details in JSON)

- **Epoch:**
  - grok-4-0709's two unlogged rows.
  - Two deepseek-v4-pro runs dated 2026-08-27, after the 0813 takeover.
- **ARC Prize:**
  - 19 complete runs of 10 catalogue models that have null correctness flags. Recording them would need grading against the official solutions, which extends the ledger transformation.
  - Runs under codename or alpha endpoints (galapagos-alpha for GPT-5.4, grok-4.20-beta, gpt-4.5 alpha).
  - Gemini 3 Flash v1, where the only complete run is at minimal effort.
- **MathArena:** DeepSeek-v4-Flash June runs. They were uploaded after the API id moved to the 0731 model.
- **BFCL:**
  - V4 entries that exist only in the 2025-08-26 / 11-03 snapshots. Those were re-scored, so they are not the same run.
  - The two mode choices above.
  - The LCB `build/v5.json` release file.
  - Whether to catalogue the non-reasoning Grok 4.1 Fast at all.
- **Aider:**
  - "DeepSeek Chat V2.5" via the deepseek-chat alias.
  - chatgpt-4o-latest runs, which would need mapping by date window.
  - command-a-03-2025-quality.
- **Others:**
  - SciCode "Gemini 1.5 Pro" (no API id).
  - EQ-Bench 4: BSD-3 with the Commons Clause, so not a clean open licence. Not proposed as a source.
  - Vector Institute gemini-1.5-pro (unversioned).
  - Galileo gemini-1.5-flash (alias).
  - Roblox quantised local runs.
  - Sierra's "Qwen 3.8 Max" τ³-banking run (0.5515). It was run on 2026-08-03 through `openrouter/qwen/qwen3.8-max` and labelled the July Preview, before the open weights existed. It would map to `qwen3-8-2-4t-a95b` if the preview is accepted as the same model.

## Not proposed (selected gaps)

- **Lone or unverifiable runs:**
  - o3's OpenAI-submitted τ²-bench retail and airline rows would be a lone run under a new evaluator.
  - Qwen3-Max-Thinking-Preview (`qwen3-max-2025-10-30`) is not a verified snapshot.
- **Vectara rows left out:**
  - mistral-medium-2508: the API section says `mistral-large-2508`, which conflicts.
  - grok-3: no id given.
  - Llama-3.3-70B Turbo: Together's own quantisation.
- **Epoch rows left out:**
  - gemini-2.5-pro-preview-03-25 on math_level_5: it ran 2025-05-07, after the repoint.
  - Aliases, pre-release checkpoints and agent systems.
- **BFCL, Galileo and ZeroEval:** fine-tunes and uncatalogued models (xLAM-2, ToolACE, Hammer, watt-tool and similar).
