# Terminal-Bench Hard: other models next to Command A+, pass 6, 2026-10-09

Machine-readable output: `pass6-tbhard-2026-10-09.json` (`results`, `benchmarks`, `ledger`, `models`, `gaps`,
`checked`, `held_for_owner`). Nothing in `data/` was edited. Merge order: ledger entries first (strip
`action`/`evidence_url`/`scope`/`note`; `add_match` entries only extend an existing entry), then `models`, then
`results` through `scripts/import.ts`. No new benchmark id. `held_for_owner` sits outside those keys.

## Why this matters for Command A+

Command A+ had one Terminal-Bench Hard figure, Cohere's own 25% (vs Command A Reasoning 3%). The useful find is
the **Solar Open 2 Technical Report** (Upstage, arXiv 2607.20062v2, CC BY 4.0). Its Table 3 says "All numbers are
measured with our internal evaluation harness", and it measures Command A+ next to Mistral Medium 3.5, MiMo-V2.5
and DeepSeek-V4-Flash on 15 tests:

| Upstage Table 3 | Command A+ | Mistral Medium 3.5 (high) | MiMo-V2.5 | DeepSeek-V4-Flash (max) |
|---|---:|---:|---:|---:|
| Terminal Bench Hard | 25.0 | 33.3 | 41.7 | 34.1 |
| SWE-Bench Verified | 14.4 | 69.6 | 73.0 | 73.8 |
| HLE (no tools) | 11.4 | 12.8 | 24.3 | 32.3 |
| MCP-Atlas | 27.2 | 30.7 | 63.9 | 58.2 |
| APEX-Agents | 1.6 | 6.1 | 13.4 | 13.2 |

The DeepSeek column is the April preview weights (the report predates the 0731 release), so it maps to
`deepseek-v4-flash-preview`. Upstage's 25.0 for Command A+ equals Cohere's own figure exactly. Upstage says it ran
everything itself, so the row is recorded as independent, with the coincidence flagged.

Scratch simulation (current tree copied, ledger, model and results merged, `scripts/check.ts --validate-only`
passes with 1,312 models and 14,048 results; every row resolves to its intended ledger id):

| Command A+ | score | rank (LLM main board) | cells |
|---|---:|---:|---:|
| now | 66.8 ± 2.2 | 91 / 700 | 7 |
| + the 16 TB-Hard rows only | 65.4 ± 1.9 | 113 / 701 | 8 |
| + everything here (TB-Hard + 48 Solar rows on 12 other tests) | 61.6 ± 1.1 | 178 / 701 | 20 |

Other models move by about a point at most: Command A Reasoning 53.5 to 52.3, MiMo-V2.5 67.0 to 65.9,
EXAONE 4.0 32B 58.5 to 57.5, Nemotron 3 Super 61.6 to 62.1.

## Is Cohere's TB-Hard the same test as Gemma's?

Yes as far as anyone can tell, so no new id is proposed. "Terminal-Bench Hard" is the hard-task subset of the
original (pre-2.0) Terminal-Bench, terminal-bench-core at commit 74221fb, run with the Terminus 2 agent, as in the
Artificial Analysis Intelligence Index. Sources that define it:

- Falcon-H1R: 47 tasks, Terminus 2, 100 episodes, 24 h timeout.
- HyperCLOVA X: "47 challenging tasks from the artificial analysis split".
- NVIDIA NeMo Evaluator `terminal_bench_hard.py` (Apache-2.0, pinned): lists the 47 task names plus a 44-task "AA split".
- NVIDIA's Nemotron 3 Super report: "48 tasks".

Cohere states its run used "Terminus-2 harness following the methodology of Artificial Analysis". The Gemma 4 report
(v1 and v2) prints only the row name, in thinking mode. It gives no task count, harness or footnote, and its only
Terminal-Bench citation is the TB 2.0 paper inside a bulk citation list. Solar Open 2 cites the same paper for the
same row name. Nothing marks Gemma's row as a different test.

TB-Hard is not any version of `terminal-bench-2`, `-2.1`, `-3`, `-4`, `-pre-2` or `-1-terminus1`, and none of its rows
went to those ids. Some papers use a different 100-task "Terminal-Bench Hard (TBH)" (Li et al. 2026a: T1,
Recursive Synthesis, Scaling Trajectories). Those were not used. `held_for_owner.benchmark_description_proposal`
adds a name, description and URL to `terminalbench-hard-gemma4` without renaming it.

## Rows per run (TB-Hard unless noted)

| Run (ledger id) | Basis | Rows | By |
|---|---|---:|---|
| `paper-2607.20062v2-solar-open-2` (new): Command A+, Mistral Medium 3.5, MiMo-V2.5, DeepSeek-V4-Flash preview | CC BY 4.0 | 4 | independent |
| same source, 12 other existing ids (MMLU-Pro, GPQA Diamond, HLE, LCB v6 window-unspecified, HMMT Feb 2026, AIME 2026, MultiChallenge, IFBench-unspecified, SWE-bench Verified, APEX-Agents, MCP-Atlas, τ³ banking) × the same 4 models | CC BY 4.0 | 48 | independent |
| `report-2601.02346v1` (existing, Falcon-H1R): Falcon-H1R-7B, Qwen3-8B, DeepSeek-R1-0528-Qwen3-8B, Qwen3-32B | CC BY 4.0 | 4 | 1 lab, 3 independent |
| `paper-2601.03286v1-hyperclova-x-32b-think` (new): EXAONE 4.0 32B, Qwen3-VL-32B-Thinking | CC BY 4.0 | 2 | independent; counts only with the proposed comparison-only `qwen3-vl-32b-thinking` |
| `first-party-nvidia-scores` (add_match `#S3.T3`, `#S3.T5`): Nemotron 3 Nano 0.0851, Nemotron 3 Super 0.2578 (own-model cells only) | CC BY 4.0 reports | 2 | lab |
| `nvidia-modelopt-card-baselines` (new, pooled): Gemma 4 31B IT 0.2708, DeepSeek-V4-Pro-0813 0.5139 (NVIDIA's baseline runs on its NVFP4 cards) | Apache-2.0 / MIT | 2 | independent |
| `multiverse-hypernova-60b-2602-card` (new): gpt-oss-20b 0.09, gpt-oss-120b 0.22 (AA subset, harbor 0.1.43, terminus-2, high) | Apache-2.0 | 2 | independent |

Total: 64 rows, 16 of them TB-Hard (13 independent, 3 lab), 1 proposed comparison-only model. Three ledger entries are
new runs (Solar, HyperCLOVA X, Multiverse), one is a new pooled NVIDIA card entry, and two are `add_match` (NVIDIA
vendor, Qwen context source). After merging, `terminalbench-hard-gemma4` has 8 runs and 24 rows. Five of the runs come from independent
evaluators (Solar, Falcon-H1R, HyperCLOVA X, NVIDIA ModelOpt, Multiverse) and three are vendor self-reports
(Gemma, Cohere, NVIDIA Nemotron).

## Excluded or held

- **Comparator cells copied from Artificial Analysis**, excluded: the Nemotron 3 Nano report and card (5.0/10.0, 5.0/6.0;
  only `*` cells are NVIDIA-measured), the Nemotron 3 Super report and card (26.80/24.00; the source is "official, aggregator
  or own" without saying which), Falcon-H1R's starred Apriel/GPT-OSS-20B cells, KAT-Coder-V2, and the cards for
  Apriel 1.5/1.6, MiniMax-M2 and North Mini Code (chart only).
- **GLM-4.7 card** (GLM-4.7 33.3, GLM-4.6 23.6), held: the same row's comparator cells match MiMo-V2-Flash's card cell
  for cell, and the card never says Z.ai ran TB-Hard itself.
- **Owner decisions**: pooling the two NVIDIA ModelOpt cards into one run (recommended; otherwise both rows are
  single-model runs); routing the Nano and Super cells into the NVIDIA vendor run; the optional third HyperCLOVA X model;
  Solar's GDPval-AA Elo (probably Artificial Analysis's leaderboard Elo).
- **Leads for the τ² and other topics**: Falcon-H1R Table 5 τ²-Telecom, HyperCLOVA X Tau2 (two user simulators),
  the DeepSeek-V4-Pro-0813 NVFP4 card (τ²-Bench Telecom 96.49), Hypernova 2602 Tau2-bench Telecom, and Cohere's own
  North Small Translate paper (arXiv 2609.13916, CC BY 4.0). That paper evaluates Command A+ with 11 other open models on
  translation tests, but no matching benchmark ids exist.
