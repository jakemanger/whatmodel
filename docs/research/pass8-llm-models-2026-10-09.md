# Pass 8: new LLM models (2026-10-09/10)

Candidates only; nothing in `data/` was edited. JSON: `docs/research/pass8-llm-models-2026-10-09.json` (46 models, 1198 results: 715 lab / 483 independent, 18 ledger actions, no new benchmark ids).

How it was done: Hugging Face org scans (repos created since 2026-06-15), ollama.com/library newest, release logs (discovery only), then each candidate pinned (repo sha or vendor API id) and scored only from allowed sources. Five forks did groups A-E; they were stopped by a usage limit, so the coordinator finished group C (Western/other open models and several gap models) and merged everything. Validation (scratchpad `pass8-llm/scripts/merge.py`): every model id is new (no id/name/model_repo clash), every row resolves to an existing or proposed ledger id whose match covers its URL, no duplicates against `data/results.json` or between parts, all bench ids exist. 202 runs that previously held fewer than 2 catalogue models would count.

## Models proposed (rows / rows in counted runs / benchmarks)

| id | rows | counted | why it scores |
|---|---|---|---|
| `claude-haiku-5-5` | 7 | 7 | Haiku 5.5 system card, own + Haiku 4.5 columns on existing Anthropic runs (HLE, SWE-bench Pro/Multilingual, TB 4.0 ...) |
| `claude-mythos-preview` | 12 | 12 | limited preview (gemini-4-argon precedent); Anthropic system-card cells on existing Anthropic runs |
| `qwen3-8-omni-flash` | 8 | 8 | qwen.ai post with same-lab Qwen3.8-27B / Qwen3.7-Plus columns |
| `kat-coder-v2-5-dev` | 5 | 5 | Apache card, all columns re-run in-house -> 8-model runs |
| `deepseek-v4-flash-vision-exp` | 7 | 7 | MIT card with DeepSeek V4 Flash 0731 sibling column |
| `mimo-v2-6-flash` | 12 | 12 | LMArena text/vision/webdev + MIT card with MiMo-V2.6-Pro / V2.5-Pro siblings |
| `mimo-v2-6-distill-qwen-9b` | 5 | 0 | own card rows only (lone); counts if the held Qwen3.5-9B column is accepted |
| `north-small-translate-1-0` | 3 | 3 | Cohere CC BY paper Table 1 (11-model translation runs) |
| `command-a-translate-08-2025` | 3 | 3 | same paper Table 1 |
| `north-micro-vision-instruct` | 13 | 13 | own column of the card whose comparators are already recorded |
| `ornith-1-0-35b` | 17 | 17 | Kwaipilot's in-house column (independent) + Ornith 1.5 card sibling column |
| `ornith-1-5-35b-a3b` | 12 | 12 | MIT card, own + Ornith 1.0 sibling column |
| `laguna-s-2-1` | 4 | 2 | Poolside card (rule b), pools with XS 2.1 / XS.2 rows |
| `laguna-xs-2-1` | 4 | 4 | Poolside card (rule b) with catalogued Laguna XS.2 row |
| `longcat-flash-chat` | 23 | 23 | MIT card own column + Meituan's unstarred runs of 6 catalogued models; LMArena text |
| `longcat-flash-thinking` | 18 | 18 | MIT card own column + Meituan's unstarred runs of 5 catalogued models |
| `magistral-medium-2509` | 4 | 4 | Magistral-Small-2509 card same-lab row |
| `magistral-medium-2507` | 4 | 4 | same card |
| `magistral-small-2507` | 4 | 4 | same card |
| `minicpm5-2b` | 20 | 20 | Apache card, unmarked cells 'reproduced internally' (AA † cells excluded) -> 9-model runs |
| `lfm2-5-2-6b` | 20 | 20 | independent column in the MiniCPM5-2B card |
| `qwen2-5-vl-7b` | 13 | 13 | Qwen2.5-VL report own columns, pooled in first-party-qwen-scores |
| `qwen2-5-vl-3b` | 13 | 13 | same |
| `solar-open-2` | 13 | 13 | Solar Open 2 CC BY report Table 3 (run with 4 catalogue models) |
| `solar-open-100b` | 14 | 14 | same table + Solar Open 1 report tau2 |
| `k-exaone-236b-a23b` | 24 | 24 | LG cards (rule b and Apache K-EXAONE 2.0 card) with EXAONE 4.0 32B siblings |
| `k-exaone-2-0` | 11 | 11 | Apache card with K-EXAONE 236B sibling |
| `hyperclova-x-seed-32b-think` | 7 | 7 | CC BY report, authors ran all models with Omni-Evaluator |
| `nemotron-cascade-8b` | 12 | 12 | NVIDIA CC BY report Tables 1/9 |
| `nemotron-cascade-8b-thinking` | 3 | 3 | same report Table 9 |
| `nemotron-cascade-14b-thinking` | 12 | 12 | same report |
| `openreasoning-nemotron-32b` | 3 | 3 | same report Table 9 |
| `acereason-nemotron-14b` | 3 | 3 | same |
| `acereason-nemotron-1-1-7b` | 3 | 3 | same |
| `qwen3-vl-32b-instruct` | 25 | 25 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-30b-a3b-instruct` | 25 | 25 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-30b-a3b-thinking` | 26 | 26 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-8b-instruct` | 25 | 25 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-8b-thinking` | 25 | 25 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-4b-instruct` | 25 | 25 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-4b-thinking` | 25 | 25 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-2b-instruct` | 38 | 38 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `qwen3-vl-2b-thinking` | 25 | 25 | Qwen3-VL report own columns (rule b), pooled with catalogued Qwen3-VL runs; 2B-Instruct also in the North Micro Vision card |
| `jamba2-mini` | 1 | 1 | Vectara README (one test, ~180-model run) |
| `jamba-large-1-7` | 1 | 1 | Vectara README (one test) |
| `jamba-mini-1-7` | 1 | 1 | Vectara README (one test) |

Notes: the three Jamba entries rest on one test each (Vectara factual consistency) and `laguna-s-2-1` on two counted runs; `mimo-v2-6-distill-qwen-9b` has only lone rows unless the held Qwen3.5-9B column is accepted. New makers: DeepReinforce (Ornith), NAVER Cloud (HyperCLOVA X); they need icons.

## Rows by source

| source_id | rows |
|---|---|
| `first-party-qwen-scores` | 363 |
| `card3-openbmb-minicpm5-2b` | 179 |
| `card-meituan-longcat-flash-chat` | 140 |
| `card-meituan-longcat-flash-thinking` | 100 |
| `card2-coherelabs-north-micro-vision-instruct` | 74 |
| `report-2512.13607v2` | 46 |
| `card3-kwaipilot-kat-coder-v2-5-dev` | 40 |
| `card3-lgai-exaone-k-exaone-2-0-750b-a37b` | 28 |
| `first-party-anthropic-scores` | 27 |
| `card3-xiaomimimo-mimo-v2-6-flash-rl` | 26 |
| `paper-2607.20062v2-solar-open-2` | 26 |
| `card-qwen--qwen3.5-397b-a17b` | 25 |
| `card3-ornith-ai-ornith-1-5-35b-a3b` | 24 |
| `paper-2601.03286v1-hyperclova-x-32b-think` | 22 |
| `first-party-lgai-scores` | 21 |
| `card3-deepseek-ai-deepseek-v4-flash-vision-exp` | 14 |
| `first-party-poolside-scores` | 12 |
| `card2-mistralai-magistral-small-2509` | 12 |
| `paper-2609.13916v1-north-small-translate` | 6 |
| `card3-xiaomimimo-mimo-v2-6-distill-qwen-9b` | 5 |
| `lmarena-dataset` | 4 |
| `vectara-hallucination-leaderboard-apache` | 3 |
| `report-2601.07022v1` | 1 |

New ledger entries: `card3-kwaipilot-kat-coder-v2-5-dev`, `card3-deepseek-ai-deepseek-v4-flash-vision-exp`, `card3-xiaomimimo-mimo-v2-6-flash-rl`, `card3-xiaomimimo-mimo-v2-6-distill-qwen-9b`, `card3-ornith-ai-ornith-1-5-35b-a3b`, `card3-openbmb-minicpm5-2b`, `card3-lgai-exaone-k-exaone-2-0-750b-a37b` (open-licence cards) and `first-party-poolside-scores` (OpenMDW cards under rule b, as `first-party-arcee-scores`). add_match: first-party-anthropic-scores / -models, first-party-alibaba-cloud, first-party-xiaomi, lmarena-dataset (webdev ff77a17). Scope notes extend card-meituan-longcat-flash-chat / -thinking, card3-kwaipilot (Ornith column), first-party-qwen-scores and card2-coherelabs-north-micro-vision-instruct.

## Held for the owner

- https://qwen.ai/blog?id=qwen3.8-omni-flash: Column 'Qwen3.8-Flash' in the Qwen3.8-Omni-Flash post is probably the open-weight Qwen3.8-Flash-Next (catalogue qwen3-8-flash-next): footnote 1 under the same table says 'notably, Qwen3.8-Flash-Next performs best on mini-SWE-agent', and its CharXiv (RQ) cell '84.6 / 90.6' equals the Qwen3.8-Flash-Next card. Not mapped because the header omits '-Next' and Alibaba also sells an API 'qwen3.8-flash'. Cells: DeepSWE 1.1 5...
- https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Distill-Qwen-9B/blob/2367e865d009c13ac81713a2878291d33ab28177/README.md: Qwen3.5-9B column (catalogue qwen3-5-9b) of the MiMo-V2.6-Distill-Qwen-9B card / report Table 6: SWE-bench Verified avg@3 60.0; SWE-bench Pro avg@3 32.0; Terminal Bench 2.1 avg@1 27.0; Toolathlon-Verified avg@1 25.9; AutomationBench v1.0.6 avg@1 5.0. No explicit 'we evaluated the baselines' sentence, but the same column carries cells on Xiaomi's internal sets (MiMo Code Bench (mini) 19.5, MiMo Cyber Bench (mini) 5.7,...
- https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-RL/blob/5711b268169967567844e1e560e8a3966da959b1/README.md: Competitor columns (Claude Opus 5, GPT-5.6 Sol, Claude Fable 5) of the MiMo-V2.6 table not used: report §5.2 says 'All baseline models with configurable reasoning effort are evaluated at the highest supported setting (max)', but several cells equal the vendors' own published values, so they look copied. No action needed unless the owner reads §5.2 as an own-evaluation statement.
- https://huggingface.co/LiquidAI/LFM2.5-2.6B/blob/654f9463ce32b05d0429d76fe1f580b27d4c1ac0/README.md: LFM2.5-2.6B own card table ('We compared LFM2.5-2.6B with relevant sub-10B models'): own column plus gemma-4-E2B-it, gemma-4-E4B-it, Qwen3.5-4B, Qwen3.5-9B columns (two-decimal values that look like Liquid's own runs, e.g. AIME25 51.87 / 26.33 / 34.27 / 49.33 / 56.07; BFCLv4 56.88 / 36.98 / 46.39 / 50.56 / 60.13; IFBench 59.17 / 34.08 / 39.24 / 48.40 / 56.47), but the card never says Liquid evaluated the comparators,...
- https://huggingface.co/LGAI-EXAONE/K-EXAONE-2.0-750B-A37B/blob/fec0c8dd25fdd20ffd09869d5af5277966d5523d/README.md: The 6 independent comparator cells (GLM-5.1, DeepSeek V4 Pro preview, Qwen3.5) are identified as LG's own runs only through the asterisk marking in the CC BY-NC-ND technical report (arXiv 2608.04505v1 Table 6); the Apache-2.0 card that is the licensed copy prints the same numbers without asterisks. Drop those 6 rows if the owner does not accept evidence from the NC-ND report for which cells are own-measured; the 22 l...
- https://arxiv.org/pdf/2511.21631v2: Volume: 308 rule-(b) figures from one vendor report (hand-typed one by one, cross-checked). If the owner prefers a smaller vendor-reported footprint, keep the 9 new models' CharXiv RQ/DQ, MMMU, MMMU-Pro, MathVista, Video-MME and the 8 text rows (about 140 rows) and drop the rest; every run would still hold >= 10 models.
- https://ollama.com/library/qwen3-vl/tags: Existing catalogue entry qwen3-vl-32b-thinking has local: null, but ollama lists qwen3-vl:32b-thinking (21GB, q4_K_M default, digest ff2e46876908) and qwen3-vl:32b-thinking-q8_0 (36GB); Alibaba Cloud lists API model qwen3-vl-32b-thinking at $0.16/$0.64 (Singapore). Not edited here (existing entry).
- https://huggingface.co/Qwen/Qwen3.5-397B-A17B/blob/8472618112abcbd45acbcdc58436aff4233c23f7/README.md: Qwen3-VL-235B-A22B column pinned to the Thinking checkpoint cell by cell (exact match with the report's Thinking column, discriminating from Instruct). If the owner prefers to require an explicit label, drop these rows (source_id card-qwen--qwen3.5-397b-a17b, model qwen3-vl-235b-a22b-thinking) and restore the 235B-Thinking rows in first-party-qwen-scores for: mmmu, mmmu-pro, math-vision, mathvista-mini, we-math, dyna...
- https://docs.mistral.ai/models/mistral-large-4: Mistral Large 4 ready-to-add catalogue entry (no counted results yet): id mistral-large-4, name 'Mistral Large 4 (public preview)', provider Mistral, released 2026-10, open_weights false until the promised end-of-October weight release (then true), params_b 1050 / active_b 52 ('52B active parameters and 1.05T total parameters, and a 1.6B vision encoder'), api {url https://docs.mistral.ai/models/mistral-large-4, provi...

## Gaps / not reached

- Ornith-1.0-35B (ornith-ai/Ornith-1.0-35B): not catalogued (Ornith family is another fork's scope)
- Ornith 1.5 9B / Ornith 1.0 9B (ornith-ai, MIT; ollama ornith:9b, ornith-1.5:9b) and Ornith 1.5 397B / Ornith 1.0 397B: Each 1.5 card prints its own and its 1.0 sibling's column (lab), but no other allowed source runs any of these four checkpoints, so each pair would form an unanchored two-model island; comparator columns (Qwen3.5-9B, Qwen3.6-35B-A3B, Gemma-4-31B; DeepSeek V4 Flash, GLM-5.2, Claude Opus 4.8, Kimi K3) carry no own-measurement statement. Very popular locally (Ornith-1.5-9B-GGUF 5.2M downloads), so wo
- Jamba2 3B (ai21labs/AI21-Jamba2-3B, Apache-2.0, 2026-01): No allowed result found (card scores are images only; not on Vectara/LMArena). Not proposed.
- Finix S1 32B (Vectara row 'antgroup/finix_s1_32b', 98.2%): No Hugging Face repo or Ant Group model page found to pin the checkpoint; not proposed.
- Mistral Large 4 (mistral-large-4, public preview): No counted run yet (see held_for_owner); revisit when weights and Mistral's promised 'additional benchmarks' are published at end of October.
- North Mini Code 1.0 (CohereLabs, 30B-A3B, Apache-2.0; ollama north-mini-code-1.0): No text-printed own scores in an allowed source that join a counted run (see checked).
- Not reached in this pass (forks stopped by the usage limit): inclusionAI Ling-3.0-tiny / Ling-3.0-flash-VL / Ling-3.1-flash / LLaDA2.2; Z.ai GLM-5.3 Prime/Fast/FlashX; MiniMax M3.1 Flash Preview; Qwen-AgentWorld-35B-A3B; Qwen3.5-Omni Plus/Flash; InternVL3/3.5 sizes; internlm Intern-S2-397B; MiniCPM-V 4.5/4.6; SKT A.X-K2; Motif-3; kakao kanana-2; HyperCLOVA X SEED Think 14B; GigaChat3.5; Spark-X2.5; llm-jp-4; Nemotron-Labs-3-Puzzle-75B-A9B; Apertus 1.5; Aleph Alpha Kolibri-1; JetBrains Mellum2.1; diffusiongemma-26B-A4B; Liquid LFM2.5-VL-3B / d1; Upstage Solar Mini 4; Microsoft MAI-Code-1.1-Flash; Apple LensVLM-9B: Identified as candidates (HF/ollama scans, release logs) but not researched for allowed results before the pass was stopped; next pass.
- K2 Horizon family (IFM: 375B-A23B, 32B, 3.7B, 0.9B, MoVA-36B-A4B): Not added: the catalogued k2-horizon-7b rows come from the pre-FTPO checkpoint (pass 4 note: IFM promoted the FTPO checkpoint to main on 2026-10-01), so sibling identities in the card need re-pinning first; pass 4's comparison-only k2-horizon-3-7b proposal still pending.
- Mistral Large 2 in the Command A report (arXiv 2504.00698v2): Not re-examined; still ambiguous between mistral-large-2407 and mistral-large-2 (2411).
- ByteDance Seed 2.0 Pro/Lite/Mini, Seed 2.1 Pro/Turbo: Seed2.0 Model Card (arXiv 2607.00248v1, CC BY 4.0) gives own-model cells, but competitor cells are 'max of official and own' (unusable) and no catalogued Seed model is pinned to these checkpoints (dola-seed-2-0-pro is an Arena identity), so the Seed rows would form an unanchored island.
