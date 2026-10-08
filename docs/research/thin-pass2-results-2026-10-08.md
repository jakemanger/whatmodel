# Thin-score models, second pass, 2026-10-08

Machine-readable output: `thin-pass2-results-2026-10-08.json` (`results`, `benchmarks`, `ledger`, `gaps`, `checked`).
Nothing in `data/` was edited. Merge results with `npm run import`, and merge benchmarks and ledger entries by hand.
The `suggested_tasks` field on new benchmarks is a proposal for `data/tasks.json`, not a benchmark field.

Input: the 221 runnable models with a thin score (`thin-runnable-2.json`: 55 LLM, 63 image, 32 video, 37 STT
and 34 TTS). This pass avoided the first pass's dead ends and looked for sources it had not used.

## Outcome

- 394 result rows (236 independent, 158 lab) for 124 models. None duplicates `data/results.json` or another row
  with the same model, benchmark and evaluator.
- **28 thin models now reach 3+ counted results, and 35 gain at least one.** The count comes from running
  `toCells` from `lib/score.ts` on `results.json` plus these rows, with the proposed ledger entries resolving
  the evaluators.
- Merged into a scratch copy of the repo, `node scripts/check.ts --validate-only` passes: 1,289 models,
  12,096 results, 777 benchmarks and 708 sources. The only warnings are the existing missing-logo ones.
  The full `scripts/check.ts`, which also refits scores, was stopped after 37 minutes without finishing, so
  top-5 and leave-one-out movements are not yet known. During this session another process changed
  `lib/score.ts` and `data/*.json` in the working tree. All counts above were rerun on that current state, and
  baseline counts for the 221 models still match the input file.

| Category | Thin models | Now 3+ | Gained |
|---|---:|---:|---:|
| LLM | 55 | 21 | 25 |
| Image | 63 | 3 | 3 |
| Video | 32 | 0 | 3 |
| STT | 37 | 4 | 4 |
| TTS | 34 | 0 | 0 |

Models reaching 3+ (counted before → after):

- **LLM:** molmo-7b-d 1→20, molmo-72b 1→17, molmo-2-8b 2→15, jamba-1-5-large 2→12, jamba-1-5-mini 1→11,
  qwen2-vl-7b 1→10, pixtral-12b 1→10, intellect-3 1→8, llama-3-3-nemotron-super-49b-v1 1→7,
  phi-3-5-vision-instruct 1→7, internvl2-4b 1→6, phi-3-vision-128k-instruct 1→6, olmo-7b-instruct 1→6,
  pixtral-large 1→4, granite-8b-code-instruct-4k 2→4, deepseek-v2-5-1210 2→3, wizardcoder-python-13b-v1-0 2→3,
  vicuna-13b-v1-5 2→3, vicuna-7b-v1-5 2→3, chatglm2-6b 2→3, chatglm3-6b 2→3.
- **Image:** llada-image 2→5, llada-image-turbo 2→5, janus-1-3b 1→3.
- **STT:** data2vec-audio-base-960h, data2vec-audio-large-960h, wav2vec2-conformer-rope-large-960h-ft and
  wav2vec2-conformer-rel-pos-large-960h-ft, each 1→3.

Models that gained but are still below 3: guanaco-33b, gpt4all-13b-snoozy, fastchat-t5-3b and
stablelm-tuned-alpha-7b (1→2, from MT-Bench); t2v-turbo-vc2 and t2v-turbo-v2 (1→2, from VBench); and
wan-2-1-1-3b (1→2). Its existing VBench row now counts because `vbench-t2v-total` reaches 4 models.

## Rows per source (evaluator id)

| Source | Licence / basis | Rows |
|---|---|---:|
| `paper-2405.04324v1` Granite Code paper, Tables 10–11 (existing entry) | CC BY 4.0 | 72 |
| `paper-2410.07073v2-pixtral` Pixtral 12B paper, Tables 2–3 (new) | CC BY 4.0 | 62 |
| `paper-2601.10611v4-molmo2` Molmo2 report, Tables 2 and 6 (new) | CC BY 4.0 | 51 |
| `primeintellect-intellect3-card-eval` INTELLECT-3 card evaluation table (new) | MIT | 41 |
| `paper-2408.12570v1-jamba15` Jamba-1.5 paper, Tables 2–3 (new) | CC BY-SA 4.0 | 29 |
| `lmsys-arena-space-mtbench` LMSYS arena-leaderboard Space, MT-Bench column (new) | Apache-2.0 | 28 |
| `microsoft-phi35-vision-card-benchmarks` Phi-3.5-vision card (new) | MIT | 25 |
| `first-party-meta-asr-cards` nine facebook/* ASR cards (new) | Apache-2.0, maker's own WER | 16 |
| `paper-2404.14219v3-phi3` Phi-3 report v3, Table 2 (new) | CC BY 4.0 | 15 |
| `paper-2402.00838v4` OLMo paper, Tables 4 and 8 (existing entry) | CC BY 4.0 | 11 |
| `molmo-card-human-elo` Molmo-72B card, human preference Elo (new) | Apache-2.0 | 9 |
| `report-2505.00949v5` Llama-Nemotron report, LN-Super column (existing entry) | CC BY 4.0 | 8 |
| `first-party-mistral-scores` Pixtral Large and Mistral Small 3.1 own rows (add_match) | vendor rule | 6 |
| `paper-2406.12793v2-chatglm` ChatGLM family report, Table 7 BFCL (new) | CC BY 4.0 | 6 |
| `visual-llada-image` LLaDA-Image report, Tables 5–6 (existing entry) | CC BY-SA 4.0 | 6 |
| `first-party-wizardlm-scores` WizardCoder card, HumanEval column (new) | vendor rule | 3 |
| `first-party-deepseek-scores` DeepSeek-V2.5-1210 card, MATH-500 sentence (new) | vendor rule | 2 |
| `report-2501.17811v1` Janus-Pro report, Janus 1.3B rows (existing entry) | CC BY 4.0 | 2 |
| `paper-2410.05677v3-t2vturbo2` T2V-Turbo-v2 paper, Table 1 (new) | CC BY 4.0 | 2 |

Competitor rows are recorded only when the source says its authors ran them. The evidence for each source:

- Pixtral Table 2: "We re-evaluate all models with the same prompt and evaluation metric".
- Phi-3 v3 Table 2: "All the reported numbers are produced with the exact same pipeline".
- Phi-3.5-vision card: "using our internal benchmark platform".
- Jamba-1.5: only cells marked "† evaluation run by us".
- ChatGLM: "we carry out evaluations on Berkeley Function Call Leaderboard".
- INTELLECT-3 technical report: "All the models above were evaluated using our public, reproducible
  Environments Hub implementations".
- Molmo and Molmo2: Ai2's own human preference studies, plus Molmo2's new Ai2 benchmarks.
- LMSYS: rows first published in the 2023 tables. FastChat states that "The MT-bench scores … are computed by
  fastchat.llm_judge".

## New benchmarks (8)

- `mt-bench-gpt4-single`: MT-Bench with GPT-4 single-answer grading (LMSYS runs). It is linear, with
  `latent_scale` 1.
- `mm-mt-bench`: MM-MT-Bench, Mistral's benchmark judged by GPT-4o on a 1–10 scale. It is linear, with
  `latent_scale` 1. It has 10 models.
- `molmo-human-pref-elo-2409`: Ai2's Molmo human preference Elo from September 2024. It has 9 models.
- `molmo2-human-pref-elo`: Ai2's Molmo2 human preference Elo from 2026. It has 7 models.
- `molmo2-captest-f1`: Molmo2-CapTest video captioning F1. It has 7 models.
- `molmo2-videocount-acc`: Molmo2-VideoCount accuracy. It has 7 models.
- `humanevalexplain` and `humanevalfix`: HumanEvalPack explain and fix tasks, as 6-language averages. Each has
  36 models from IBM's harness.

## Review flags

- **LMSYS Space.** The source is the Hugging Face Space git repository (README `license: apache-2.0`), not the
  arena.ai website. Model identity notes already cite it. Later rows whose values equal vendor claims were left
  out: Zephyr α/β, Mixtral, Mistral 7B Instruct, Qwen1.5/2, OpenChat, Starling, Tulu 2 DPO, SOLAR and
  WizardLM 70B. zephyr-7b-alpha (6.88) is therefore not recorded.
- **INTELLECT-3.**
  - GLM-4.5's MMLU-Pro (83.5) is excluded because the report marks it "Reported by AA Index".
  - "DeepSeek v3.2" is mapped to `deepseek-v3-2-exp`. The card (27 Nov 2025) and report (30 Nov 2025)
    predate V3.2's 1 Dec release, and the report used the official deepseek-reasoner API.
  - GPT-OSS-120B ran at high effort on TogetherAI.
- **Molmo card Elo.** The provenance (Ai2 ran the human study) is stated in the Molmo paper, which has the
  default arXiv licence. The values come from the Apache-2.0 card.
- **Meta ASR cards.** Nine single-checkpoint cards are pooled into one evaluator, as the existing vendor
  entries are. wav2vec2-conformer-rel-pos test-other prints 3.82 in the evaluation section and 3.83 in the
  model-index metadata; 3.82 is recorded.
- **Mappings.** These are documented in the notes:
  - Pixtral's Claude-3.5 Sonnet → 20240620, because the paper is dated 9–10 Oct 2024.
  - T2V-Turbo (VC2) at 16 steps (80.51; the same table gives 81.01 at 4 steps).
  - LN-Super is kept on `ifeval-unspecified` to match the existing LN-Ultra row. Both could move to
    `ifeval-instruction-strict`.
  - OLMo-7B-Instruct MMLU uses Table 8's 46.1 (Table 4 prints 46.2).
- **Vendor-rule rows.** These were hand-recorded figures for each vendor's own models:
  - Mistral: Pixtral Large and Small 3.1.
  - DeepSeek: V2.5 and V2.5-1210.
  - WizardLM: the HumanEval column only, because its other columns may repeat EvalPlus figures.

## Notes for the owner

- Picovoice's speech-to-text benchmark has a newer revision (aea7914, 2026-10-07) than the ledger's 43e7689.
  It adds Moonshine, Nemotron 3.5 ASR Streaming and Korean/Japanese sets. No thin model gains from it.
- Datapoint Audio Bench (CC BY 4.0, 2026-09-01) would score Simba 3.2, Grok TTS, Inworld TTS 1.5 Max and
  others. However, its Elo appears only as a chart without printed values, and the vote files are gated.
  Datapoint could be asked for a text table.
- The VBench leaderboard Space is MIT-licensed, but its results sit in a private dataset.

## Gaps

193 thin models stay below 3: 60 image, 34 TTS, 34 LLM, 33 STT and 32 video. Each has an entry in `gaps` that
gives its model-specific reason, where one was found, and what this pass searched for its category.

Most of the remainder are API-only commercial image, video, TTS and STT models. For these, the only openly
licensed evaluators remain LMArena, Rapidata, Datapoint and Vapi. Family reports for many open models carry the
default arXiv licence. The `checked` list records every source examined.
