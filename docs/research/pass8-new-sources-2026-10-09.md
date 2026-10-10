# Pass 8: new large sources (2026-10-09)

This pass reviewed large leaderboards that were not yet in the ledger. For each one we found the exact data files, read the licence (repo LICENSE at a pinned commit, the card's licence field, or the site terms) and recorded a verdict. Rows were drafted only where an open licence covers the data itself. Nothing in `data/` was edited. The full candidate list, with quotes, pinned URLs and notes, is in `pass8-new-sources-2026-10-09.json`.

**Result:** 205 candidate rows (188 independent, 17 lab) from 7 proposed ledger entries. 5 new benchmark ids are proposed and no new models. Every row's `source` was checked against its ledger entry's exact `match`. Model and benchmark ids were also checked against `data/` (or the new ids proposed here), and no row duplicates `data/results.json`.

## Verdicts

| Candidate | Verdict | Why (short) | Rows |
|---|---|---|---|
| Stanford CRFM HELM leaderboards (Capabilities, Lite, MMLU, Classic, Safety, AIR-Bench, VHELM, HEIM, AHELM, …) | not allowed | Results are in the public GCS bucket `crfm-helm-public`, which has no licence. The Apache-2.0 repo holds no results. The docs only say "freely accessible … for exploration and study" / "use … for your own research". | 0 |
| VHELM paper arXiv 2410.07112v2 | **allowed** (CC BY 4.0) | Table 4 holds the authors' own zero-shot runs | 20 |
| AHELM paper 2508.21376v2 | allowed, **held** | CC BY. The models are LLM-category audio models, so the owner needs to decide on category and benchmark ids | 0 |
| AIR-Bench 2024 2407.17436v2, HELM 2211.09110v2 | allowed, no usable rows | Results are only in figures | 0 |
| LiveBench (HF `livebench/model_judgment`) | **allowed, owner flag** | `docs/DATASHEET.md` @24364d6 says: "distributed under the Apache License 2.0", "There are no copyrights on the data", "no fees or restrictions". The HF cards have no licence field, and the repo LICENSE is only copied FastChat and LiveCodeBench licences. | 51 |
| BigCodeBench leaderboard (HF results datasets, website repo, Space) | not allowed | The results datasets and website repo have no licence. The apache-2.0 Space does not commit the scores. | 0 |
| BigCodeBench paper arXiv 2406.15877v4 | **allowed** (CC BY 4.0) | Tables 6–7 are the authors' own greedy pass@1 runs of 60 LLMs | 73 |
| TTS Arena V2 / V1, Pendrokar TTS Spaces Arena | not allowed | V2: Apache covers only the code; its provider agreement says "Vote records … belong to the arena". V1 has no licence. Pendrokar's votes sit in an unpublished database. | 0 |
| Open TTS Leaderboard (hf-audio) | not allowed | Scores are in the non-public dataset `hf-audio/tts_leaderboard_results`. The Space has no licence, and the GitHub repo (Apache-2.0) holds no results. | 0 |
| Danish ASR Leaderboard (RyeAI) | **allowed, owner flag** | MIT on the dataset, Space and harness. Outside contributors can add results by PR. | 17 |
| Dutch ASR Leaderboard (tvosch) | **allowed, owner flag** | apache-2.0 Space with committed `results/*.json`. It is a community-PR board. | 7 |
| Polish ASR Leaderboard V2 | not allowed | The README says "The license: mit field … covers the application code only". The data keeps CC BY-SA and CC BY-NC-ND terms. | 0 |
| QCRI AURA Arabic–English ASR | held | cc-by-4.0 TSV, but there is no method or provenance statement and some ids are ambiguous | 0 |
| Other licensed ASR/TTS Spaces with no committed scores, and unlicensed TTS arenas (KO, Hebrew, Turkish, Malay, zh-TW, …) | not allowed | Nothing licensed is committed, or there is no licence at all | 0 |
| OpenCompass Open VLM Leaderboard (Space) | not allowed | Scores are fetched from OpenCompass's server and not committed in the apache-2.0 Space | 0 |
| VLMEval/OpenVLMRecords (apache-2.0) | held | Licensed, but it holds raw predictions only, with no scores ("we only provide the evaluation records, not the score / metrics files") | 0 |
| OpenCompass CompassAcademic (committed `data/hf-academic-predictions.json`) | **allowed** | apache-2.0 Space. The committed file holds OpenCompass's own IFEval and DROP results. The main table, hosted remotely, is not covered. | 10 |
| NVIDIA RULER README | **allowed** (Apache-2.0) | NVIDIA's own rows. Asterisked rows that model authors reported, and the GradientAI rows, were excluded. | 27 |
| LongBench v2, HELMET, BABILong | not allowed | The website, Google Sheet or Space data has no licence. The papers use arXiv's non-exclusive licence. | 0 |
| SimpleBench | not allowed | The scores are only on the unlicensed website. The MIT repo has just the 10-question public set. | 0 |
| Scale SEAL | not allowed | Its terms say: "solely … for your own internal purposes … may not … make derivative works … Scale owns … compilation, information, data" | 0 |
| Kaggle Benchmarks | not allowed | No data licence was found. The Apache-2.0 library covers code only. | 0 |
| GAIA, Princeton HAL, KCORES arena, VBench leaderboard | not allowed | GAIA's results dataset has no licence and is self-submitted. HAL's repo has no licence. KCORES uses a custom licence with branding and copyleft conditions. The VBench submission dataset is token-gated. | 0 |
| hallucinations-leaderboard/results, openlifescienceai/results | allowed, **held** | apache-2.0. Each needs a dedicated pass (task selection and provenance) | 0 |
| Intel/ld_results | allowed, no usable rows | Only quantised checkpoints, which are not catalogue models | 0 |
| Open LLM Leaderboard forks (OALL, Ko, llm-jp, Thai, FR, PT, AI-Secure), RewardBench results, LMArena raw-vote sets | not allowed / not used | No licence. The one CC BY vote set duplicates the existing `lmarena-dataset` source. | 0 |

## Proposed ledger entries (all `action: "new"`)

| id | Source | Licence |
|---|---|---|
| `livebench-model-judgment-apache` | `livebench/model_judgment` @5896e3b (2024-10-22) and the six question sets at their 2024-10-22 revisions | Apache-2.0 per the datasheet (**owner flag**) |
| `paper-2406.15877v4-bigcodebench` | arXiv 2406.15877v4, Tables 6–7 | CC BY 4.0 |
| `paper-2410.07112v2-vhelm` | arXiv 2410.07112v2, Table 4 | CC BY 4.0 |
| `nvidia-ruler-readme-results` | NVIDIA/RULER README @c3f5e3b | Apache-2.0 |
| `opencompass-compassacademic-space-predictions` | CompassAcademic Full-Version Space @73af091f, predictions file | Apache-2.0 |
| `speech-stt-danish-asr-ryeai-mit` | `RyeAI/danish-asr-leaderboard` dataset @344e5a7, `data/results.parquet` | MIT (**owner flag**) |
| `speech-stt-dutch-asr-tvosch-apache` | tvosch/Dutch-ASR-Leaderboard @939431c, seven `results/*.json` | Apache-2.0 (**owner flag**) |

The CompassAcademic predictions file also contains third-party API keys in its `cfg` blocks. Only the `results` fields are used. Never copy the cfg contents.

## New benchmark ids

- `livebench-20240726`: LiveBench release 2024-07-26 overall average over 1,000 questions, computed exactly as LiveBench's `show_livebench_result.py` does. Like `livebench-20241125`, it is not in any task.
- `vhelm-mmmu-val-em`, `vhelm-mathvista-testmini-em`: HELM's own zero-shot exact-match aggregates. They are kept apart from `mmmu` and `mathvista-mini` because HELM macro-averages its sub-runs and filters MathVista by grade. Suggested task: `vision`.
- `danish-asr-5set-mean-wer`, `dutch-asr-3set-avg-wer` (stt, err): single-language STT boards, overall score only.

## Rows by source

| Source | Benchmark: rows |
|---|---|
| LiveBench | `livebench-20240726`: 51 |
| BigCodeBench paper | `bigcodebench-complete`: 44, `bigcodebench-instruct`: 29 (17 of these are `lab`: Qwen family via co-author Binyuan Hui, Magicoder via Jiawei Liu, StarCoder2 via BigCode) |
| RULER | `ruler-64k`: 14, `ruler-128k`: 13 |
| VHELM | `vhelm-mmmu-val-em`: 10, `vhelm-mathvista-testmini-em`: 10 |
| CompassAcademic | `ifeval-prompt-strict`: 7, `simple-evals-drop-f1`: 3 (the simple-evals DROP prompt and F1 evaluator, 3-shot) |
| Danish ASR | `danish-asr-5set-mean-wer`: 17 |
| Dutch ASR | `dutch-asr-3set-avg-wer`: 7 |

## Held for the owner

- **LiveBench licence:** confirm that the datasheet's Apache-2.0 statement covers the judgment files.
- **LiveBench release choice:** release 2024-08-31 was also computed (52 complete models). It would add o1-preview, o1-mini, Qwen2.5-72B, Gemini 1.5 Pro/Flash 002, Grok-2 and Nemotron-70B. Use one release, not both. 2024-11-25 and later releases cannot be computed: the newest judgment revision only has 3 of the 6 categories.
- **BigCodeBench, GPT-4-Turbo row:** not recorded. Table 4 maps it to gpt-4-0125-preview, but the results tables print 2024-04-09.
- **BigCodeBench, GPT-4o rows:** recorded, with a flag. Table 4 has an evident row shift.
- **Danish and Dutch ASR boards:** both accept PR submissions and have no submitter field. Only general-purpose catalogue models were imported, and the per-sample outputs are published.
- **Not drafted:** AHELM (category decision), hallucinations-leaderboard and openlifescienceai results (dedicated passes), QCRI AURA (provenance) and VLMEval/OpenVLMRecords (scores would have to be recomputed).

The earlier "no licence" note on LiveBench (2026-10-07) is superseded: that pass had not seen the datasheet clause.
