# No-data and at-random models, 2026-10-08

Research for the 40 models in the no-data list: 31 TTS, 5 LLM (including GPT-1 and TinyLlama 1.1B Chat), 3 video and 2 STT. The data is in [no-data-results-2026-10-08.json](no-data-results-2026-10-08.json), with the keys `results`, `benchmarks`, `ledger`, `gaps`, `checked` and `conditional_results`. Nothing was imported, and no file in `data/` or any other existing repo file was changed.

## Outcome

| Part | Count |
|---|---|
| `results` | 8 rows: 5 for PROST (GPT-1 plus GPT-2 S/M/L/XL) and 3 vendor-reported rows for Command A+ |
| `benchmarks` | 1 new: `prost-zero-shot-macro` (chance 0.25, 5 models in one run) |
| `ledger` | 2 new: `acl-2021-findings-acl-404-prost` (CC BY 4.0, ACL Anthology) and `first-party-cohere-scores` (vendor-reported) |
| `gaps` | 40 entries: one per model, including partial notes for `gpt-1` and `command-a-plus` |

I ran the `lib/score.ts` counting rule (a run needs at least 2 models and a benchmark at least 3). Only **GPT-1 goes from 1 to 2 counted results**. The GPT-2 models also gain one each. All rows resolve to known models and benchmarks and to allowed ledger entries, and none duplicates a row in `results.json`.

## Results

- **GPT-1, PROST** ([Findings of ACL-IJCNLP 2021](https://aclanthology.org/2021.findings-acl.404.pdf), Table 5, "Macro Average"). The authors ran the Hugging Face checkpoints zero-shot. The scores are GPT 0.261, GPT-2 B 0.236, M 0.268, L 0.264 and XL 0.301. The T5 and UnifiedQA rows were left out because they average 9 concepts, not 10, and UnifiedQA is fine-tuned. The BERT, RoBERTa and ALBERT rows were left out because those models are not in the catalogue. **Caveat:** GPT-1 is only 1.1 points above the 25% chance level, so this is a second result near chance, not strong evidence.
- **Command A+, vendor-reported** ([Cohere post, 2026-05-20](https://cohere.com/blog/command-a-plus)). All three figures come from the post's body text: `tau2-telecom` 0.85, `terminalbench-hard-gemma4` 0.25 and `charxiv-rq` 0.527. The post credits the AA Intelligence Index to Artificial Analysis, so it was not recorded. MMMU, MMMU-Pro and MathVista were not recorded because the post gives no split. **These rows do not count yet.** The post's only comparators are Command A Reasoning (08-2025) and Command A Vision (07-2025), and neither is in the catalogue. `conditional_results` has their printed values (0.37, 0.03 and 0.469) and proposed model entries.

## Decisions for the owner

1. **Add Command A Reasoning and Command A Vision** as comparison-only models. Both are open weights under CC BY-NC. Adding them makes the Command A+ runs count.
2. **Terminal-Bench Hard mapping.** Cohere ran Terminal-Bench Hard with the Terminus-2 harness, following AA's method. I mapped it to `terminalbench-hard-gemma4`, the only TB-Hard id, which the Gemma 4 report does not define in detail. Please confirm it is the same subset.
3. **Coval TTS/STT board.** Its code is Apache-2.0, but the results sit in a database behind benchmarks.coval.ai with no data licence. The board appears to cover Eleven v3 Conversational and other recent commercial TTS models. Asking Coval for permission is the most promising route for the commercial TTS gaps.

## Why the rest are gaps

- **Commercial TTS** (Sonic 3.6, Gemini 3.8 Flash and Flash-Lite TTS, Eleven v3 Conversational, MiniMax 2.6 HD, Lightning v3.1 Pro, Octave 2, Azure HD 2.5, Polly Generative, Breeze TTS 2):
  - No licensed leaderboard names these versions. I checked the live Vapi API and the latest heads of EmergentTTS, Rime, ZTTS1, the Arabic arena, Amharic and CN-NewsTTS.
  - Vendors cite Artificial Analysis, which is not allowed, or their own non-catalogue tests against competitors.
  - Gradium's CC BY dataset is prompts only.
- **STT** (MAI-Transcribe-2, Solaria-3): the MAI model card prints FLEURS only as an image. Gladia's page compares only against competitors, and Gladia has no second catalogue model.
- **Grok Build 0.1**: no xAI page carries a score, and Terminal-Bench has only Grok 4.5 and 4.6 running inside the Grok Build harness.
- **TinyLlama Chat v1.0**:
  - The leaderboards that list it have no data licence.
  - The Hallucinations Leaderboard has only Chat v0.3 and v0.6, and TinyLlama's EVAL.md stops at v0.4.
  - The OSQ leaderboard (CC BY) does not name which TinyLlama checkpoint it ran.
  - Stable LM 2's MT-Bench table mixes in values copied from LMSYS.
- **Video** (SVD, SVD-XT, AnimateDiff v2):
  - The Physics-IQ and VideoPhy SVD rows never name the checkpoint, and VideoPhy's row is an SDXL+SVD pipeline.
  - The SVD paper (CC BY) shows its result only as a preference bar chart.
  - VBench data has no licence, and the AnimateDiff v2 evaluations are all in arXiv papers with no open licence.
- **Open and older TTS** (12 Coqui releases, SpeechBrain FastSpeech2, LightSpeech, PriorGrad, Piper lessac, Kitten Mini 0.8 and KittenTTS 2, Pocket TTS, Dia 0626, Chatterbox Turbo):
  - No score tables in the cards.
  - The architecture papers are arXiv papers with no open licence and evaluate other trained weights.
  - Pocket TTS's catalogue weights are the 2026-09 release, and no evaluation of them exists.
  - The new CC BY Piper study used other voices.

Each per-model reason is in `gaps`, and the sources checked this session are in `checked`.
