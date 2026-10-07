# Thin speech results, 2026-10-07

Candidate rows for STT/TTS models with a thin (<3 counted results) or missing score. Data: `thin-speech-results-2026-10-07.json` (`results`, `benchmarks`, `ledger`, `gaps`, `checked`). Nothing has been imported into `data/` yet.

- 174 result rows, 7 new benchmarks, 7 ledger additions, 139 documented gaps.
- Simulated with the `lib/score.ts` counting rule (run >= 2 models, benchmark >= 3 models): thin models gaining: 40 | reaching >=3: 37 | total counted gain 66.

## Rows by source

| source_id | rows |
|---|---:|
| speech-stt-transcribecpp-mit | 41 |
| speech-omniasr-paper-bysa | 22 |
| speech-ultraeval-audio-apache | 20 |
| speech-stt-srb-report | 17 |
| speech-omnivoice-report-ccby | 16 |
| speech-rvcbench-ccby | 11 |
| speech-nemo-asr-scores-apache | 10 |
| speech-stt-liteasr-report-ccby | 8 |
| speech-glm-asr-readme-apache | 8 |
| first-party-espnet-owsm-v4-report | 6 |
| speech-versa-toolkit-ccby | 6 |
| speech-distil-whisper-readme-mit | 5 |
| first-party-alphacephei-vosk-models | 4 |

## New benchmarks

- `omniasr-paper-fleurs81-test-cer`: Omnilingual ASR paper · FLEURS-81 test mean CER (Whisper-covered languages)
- `omniasr-paper-cv22-76-test-cer`: Omnilingual ASR paper · Common Voice 22 (76 languages) test mean CER
- `distil-whisper-ood4-shortform-wer`: Distil-Whisper · 4-set out-of-distribution short-form mean WER
- `mls-fr-wer`: Multilingual LibriSpeech French test WER
- `mls-de-wer`: Multilingual LibriSpeech German test WER
- `rvcbench-libritts-whisper-medium-wer`: RVCBench LibriTTS clean voice cloning · Whisper-medium WER
- `versa-librispeech-test-clean-whisper-wer`: VERSA TTS demo · LibriSpeech test-clean Whisper WER

## Ledger additions

- `speech-nemo-asr-scores-apache` (first-party, Apache-2.0): NVIDIA NeMo docs: ASR scores tables (English Conformer / FastConformer)
- `speech-omniasr-paper-bysa` (paper, CC BY-SA 4.0): Omnilingual ASR: Open-Source Multilingual Speech Recognition for 1600+ Languages (arXiv:2511.09690v1)
- `speech-distil-whisper-readme-mit` (dataset, MIT): huggingface/distil-whisper README (Distil-Whisper headline WER table)
- `first-party-alphacephei-vosk-models` (first-party, Factual vendor-reported score (not licensed content)): Alpha Cephei Vosk models page (vendor-reported WER for its own Vosk models)
- `first-party-espnet-owsm-v4-report` (first-party, Factual vendor-reported score (not licensed content)): OWSM v4 technical report (ESPnet / CMU WAVLab, arXiv:2506.00338v1): own OWSM-CTC scores
- `speech-glm-asr-readme-apache` (dataset, Apache-2.0): zai-org/GLM-ASR README benchmark table (GLM-ASR-Nano vs open/closed ASR)
- `speech-omnivoice-report-ccby` (paper, CC BY 4.0): OmniVoice: Towards Omnilingual Zero-Shot Text-to-Speech with Diffusion Language Models (arXiv:2604.00688v3)

## Thin models that gain counted results (rank in thin list, before -> after)

```
  14 granite-speech-5-0-470m-turboctc                1 ->   2
  15 granite-4-0-1b-speech                           2 ->   3  (>=3)
  18 granite-speech-4-1-2b                           2 ->   3  (>=3)
  22 qwen3-tts-12hz-0-6b-base                        2 ->   4  (>=3)
  23 fireredtts3-base                                2 ->   4  (>=3)
  28 canary-180m-flash                               2 ->   3  (>=3)
  29 glm-asr-nano-2512                               1 ->   5  (>=3)
  30 lite-whisper-large-v3-acc                       2 ->   4  (>=3)
  31 distil-large-v3                                 2 ->   3  (>=3)
  32 lite-whisper-large-v3                           2 ->   4  (>=3)
  33 owsm-ctc-v4-1b                                  1 ->   3  (>=3)
  37 zipvoice                                        1 ->   6  (>=3)
  38 parakeet-tdt-ctc-110m                           2 ->   3  (>=3)
  40 lite-whisper-large-v3-fast                      2 ->   4  (>=3)
  46 owsm-ctc-v3-1-1b                                1 ->   3  (>=3)
  48 omniasr-ctc-7b                                  2 ->   4  (>=3)
  50 vosk-en-us-0-22                                 1 ->   3  (>=3)
  52 owsm-ctc-v3-2-ft-1b                             1 ->   3  (>=3)
  55 distil-large-v2                                 2 ->   3  (>=3)
  56 distil-small-en                                 1 ->   2
  58 omniasr-ctc-3b                                  2 ->   4  (>=3)
  60 vibevoice-1-5b                                  2 ->   3  (>=3)
  64 stt-en-fastconformer-ctc-large                  2 ->   4  (>=3)
  66 stt-en-conformer-transducer-large               1 ->   3  (>=3)
  67 stt-en-fastconformer-transducer-large           2 ->   4  (>=3)
  68 stt-en-conformer-transducer-small               2 ->   4  (>=3)
  70 omniasr-ctc-1b                                  2 ->   4  (>=3)
  71 distil-medium-en                                2 ->   3  (>=3)
  72 moonshine-base                                  2 ->   3  (>=3)
  75 stt-en-conformer-ctc-small                      2 ->   4  (>=3)
  76 vosk-small-en-us-0-15                           1 ->   3  (>=3)
  78 moonshine-tiny                                  2 ->   3  (>=3)
  79 melotts-english                                 2 ->   3  (>=3)
  81 parler-tts-mini-v1                              1 ->   2
  82 omniasr-ctc-300m                                2 ->   4  (>=3)
  89 hubert-large-ls960-ft                           2 ->   3  (>=3)
  94 wav2vec2-base-960h                              2 ->   3  (>=3)
 128 mms-1b-fl102                                    2 ->   3  (>=3)
 133 cohere-transcribe-arabic-07-2026                2 ->   3  (>=3)
 157 nemotron-3-5-asr-streaming-0-6b                 2 ->   3  (>=3)
```

## Judgement calls to review

- transcribe.cpp FLEURS English rows use the catalog's Q8_0 GGUF measurements (the only FLEURS tier); the existing LibriSpeech rows from the same files use full precision. LibriSpeech deltas F16 vs Q8_0 are <= 0.3 pp.
- Distil-Whisper short-form benchmark: the README does not restate the 4-set definition; it is taken from the paper (arXiv:2311.00430, default licence, used only for the definition) because the README's distil-medium.en / distil-large-v2 values equal the paper's averages.
- Omnilingual ASR paper rows map the paper's v1 checkpoints only (no _v2 numbers are published); only FLEURS-81 and CV22-76 test columns were taken.
- Vosk and OWSM-CTC rows are vendor-reported (owner rule b) and were hand-recorded; Vosk's page does not state the TED-LIUM release.
- RVCBench, VERSA and UltraEval additions add a second metric (WER or SIM) from runs already in results.json; the identity mapping is reused from the existing rows.
- GLM-ASR values were hand-read from a README table image (printed cells, Apache-2.0 repo), not a plotted chart.
- SRB LibriSpeech test-clean rows reuse the abbreviation-to-checkpoint mapping of the existing SRB TED-LIUM rows (cross-checked against results.json).
- OmniVoice report: only IndexTTS2, ZipVoice, MaskGCT and OmniVoice are mapped; CosyVoice3/VoxCPM/Qwen3-TTS/F5-TTS rows are left out because the printed sizes do not pin one catalogue checkpoint.
- New ledger entries give the upstream licence URL in `license_url`; the repo convention is an archived copy under `/licenses/`, which still needs to be saved on import.
- Not added, for the owner to decide: LibriSpeech dev-clean/dev-other benchmarks (would lift the six ESPnet models and add a NeMo run) and ClonEval's emotional-speech similarity (OuteTTS).


## Gaps

- `espnet-hubert-large-conformer-lm`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `espnet-wavlm-large-conformer-lm`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `speechify-simba-3-2`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `minimax-speech-2-8-turbo`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `soniox-v5-async`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `xai-grok-tts`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `gemini-3-5-transcribe`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `grok-voice-transcribe-2`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `fish-audio-s2-1-pro`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `inworld-tts-1-5-max`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `google-chirp-3-hd`: Only in a single licensed run (RW-Voice-EQ top-5 matrix, or CN-NewsTTS); the rest of RW-Voice-EQ's cells are not published; CN-NewsTTS has only the strict-accuracy headline (lenient variant would be a correlated duplicate).
- `elevenlabs-turbo-v2`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `elevenlabs-flash-v2`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `zoom-scribe-v1`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `granite-speech-5-0-470m-turboctc`: Granite 5.0 report tables are ablations of this one model; the HF card was not found to add a second catalogue model in one table. Gains FLEURS-en from transcribe.cpp (now 2).
- `wayu-paxa-tts-edge`: Wayu paper Table 7 also has ECAPA speaker similarity and English CER, but similarity is against each system's own voice centroid built from teacher outputs (not comparable across systems); left out.
- `gpt-transcribe`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `minimax-speech-02-turbo`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `mai-transcribe-1-5`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `granite-speech-3-3-8b`: Granite-speech paper (arXiv:2505.08699v2, CC BY 4.0) Table VI has granite-speech-3.3-8b/-2b rows, but the paper (14 May 2025) predates the catalogue's revision 3.3.2 (card release 19 June 2025), so the version cannot be matched; not used.
- `openaudio-s1`: Fish S2 report Long-Audio table has a third and fourth system ('Qwen3-TTS', 'VibeVoice') without size/version, so fish-long-tts-* cannot gain a third catalogue model; its EmergentTTS table uses 5 categories (not the 6-category benchmark); its MiniMax 24-language table cannot be mapped to the unpublished 23-language set of minimax-ml23-macro-err.
- `openai-tts-1-hd`: Only in a single licensed run (RW-Voice-EQ top-5 matrix, or CN-NewsTTS); the rest of RW-Voice-EQ's cells are not published; CN-NewsTTS has only the strict-accuracy headline (lenient variant would be a correlated duplicate).
- `cosyvoice-v3-plus`: Only in a single licensed run (RW-Voice-EQ top-5 matrix, or CN-NewsTTS); the rest of RW-Voice-EQ's cells are not published; CN-NewsTTS has only the strict-accuracy headline (lenient variant would be a correlated duplicate).
- `smallest-lightning-v3-1`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `omniasr-llm-7b-v2`: No published score for the Dec-2025 _v2 checkpoints outside Open ASR: the omnilingual-asr README (Apache-2.0) has no CER table (result_table.png only counts languages; the per-language CSV is v1 7B LLM only) and the paper covers only v1 checkpoints.
- `gradium-tts`: Commercial TTS only scored in Vapi Humanness (and for some the Arabic TTS Arena / RW-Voice-EQ top-5 matrix). Checked: EmergentTTS, Rime, CN-NewsTTS, TTSDS2, Arabic arena and Vapi repos are already at their latest commits; TTS Arena V2 (Apache-2.0 code) serves votes from a database with no data licence; a newer Vapi snapshot would duplicate the same evaluator. No open-licensed multi-model result found.
- `lite-whisper-large-v3-turbo-acc`: LiteASR Table 2 (MLS fr/de) covers only the large-v3 compressions; the efficient-speech cards repeat Table 1. No other evaluator.
- `vibevoice-asr-hf`: VibeVoice docs (MIT) only score VibeVoice-ASR itself (MLC-Challenge/AMI/AliMeeting table); comparisons with other models are charts (DER/cpWER images), not read.
- `omniasr-llm-3b-v2`: No published score for the Dec-2025 _v2 checkpoints outside Open ASR: the omnilingual-asr README (Apache-2.0) has no CER table (result_table.png only counts languages; the per-language CSV is v1 7B LLM only) and the paper covers only v1 checkpoints.
- `omniasr-llm-1b-v2`: No published score for the Dec-2025 _v2 checkpoints outside Open ASR: the omnilingual-asr README (Apache-2.0) has no CER table (result_table.png only counts languages; the per-language CSV is v1 7B LLM only) and the paper covers only v1 checkpoints.
- `supertonic-3`: Supertonic README (MIT for 'sample code'; model under OpenRAIL-M) has a MiniMax-MLS per-language WER table with VoxCPM2/OmniVoice measured by Supertone; licence scope for the README is unclear and only +1 would follow, so not used.
- `espnet-wav2vec2-large-conformer-lm`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `stt-en-conformer-ctc-large`: NeMo docs conformer_en.csv row prints 2.1/4.5 but the pinned HF card (v1.6.0) prints 2.2/4.3, so the docs row cannot be tied to the catalogue checkpoint.
- `omniasr-ctc-3b-v2`: No published score for the Dec-2025 _v2 checkpoints outside Open ASR: the omnilingual-asr README (Apache-2.0) has no CER table (result_table.png only counts languages; the per-language CSV is v1 7B LLM only) and the paper covers only v1 checkpoints.
- `chatterbox-multilingual-v3`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `openaudio-s1-mini`: LEMAS Table 4 has no other catalogue model; RVCBench's 'FishSpeech' row loads openaudio-s1-mini in its config but the paper describes FishSpeech 390M (excluded by the existing benchmark caveat).
- `espnet-conformer-s4-decoder`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `mms-tts-amh`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `distil-small-en`: Gains the Distil-Whisper short-form benchmark (now 2); not in transcribe.cpp or SRB.
- `speechbrain-asr-conformer-largescaleasr`: SpeechBrain PERFORMANCE.md (Apache-2.0) lists asr-wav2vec2-librispeech but no other catalogue SpeechBrain checkpoint in the same table, and the Loquacious/LargeScaleASR conformer is not listed; SRB's sb-* rows are not named checkpoints.
- `openvoice-v1`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `parler-tts-mini-v0-1`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `fish-speech-1-2`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `kyutai-tts-1-6b-en-fr`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `omniasr-ctc-7b-v2`: No published score for the Dec-2025 _v2 checkpoints outside Open ASR: the omnilingual-asr README (Apache-2.0) has no CER table (result_table.png only counts languages; the per-language CSV is v1 7B LLM only) and the paper covers only v1 checkpoints.
- `omniasr-llm-300m-v2`: No published score for the Dec-2025 _v2 checkpoints outside Open ASR: the omnilingual-asr README (Apache-2.0) has no CER table (result_table.png only counts languages; the per-language CSV is v1 7B LLM only) and the paper covers only v1 checkpoints.
- `amphion-valle-librilight-6k`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `amazon-polly-neural`: Only in a single licensed run (RW-Voice-EQ top-5 matrix, or CN-NewsTTS); the rest of RW-Voice-EQ's cells are not published; CN-NewsTTS has only the strict-accuracy headline (lenient variant would be a correlated duplicate).
- `neutts-air`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `omniasr-ctc-300m-v2`: No published score for the Dec-2025 _v2 checkpoints outside Open ASR: the omnilingual-asr README (Apache-2.0) has no CER table (result_table.png only counts languages; the per-language CSV is v1 7B LLM only) and the paper covers only v1 checkpoints.
- `parler-tts-mini-v1`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `maya1`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `outetts-0-2-500m`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `speechbrain-asr-wav2vec2-librispeech`: SpeechBrain PERFORMANCE.md (Apache-2.0) lists asr-wav2vec2-librispeech but no other catalogue SpeechBrain checkpoint in the same table, and the Loquacious/LargeScaleASR conformer is not listed; SRB's sb-* rows are not named checkpoints.
- `espnet-multiblank-transducer-8421`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `espnet-conformer-rnn-transducer`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `vits-vctk`: Each appears in one or two licensed runs (Arabic arena, Amharic, UncovAI, ClonEval, TTSDS v1, CodecMOS, Emergent, VERSA, VITS). Checked extra columns: UncovAI SIM has only 2 models; ClonEval's emotional datasets would add correlated SIM tests for the same 3 systems; TTSDS2 does not include these versions; Kyutai's DSM paper is CC BY-NC-SA (only its own TTS would qualify as vendor rows, a run of 1); VITS VCTK baselines are not catalogue models.
- `wav2vec2-conformer-rope-large-960h-ft`: Only single-model HF cards and Open ASR; fairseq READMEs have no WER tables; not in SRB Table 5.
- `wav2vec2-conformer-rel-pos-large-960h-ft`: Only single-model HF cards and Open ASR; fairseq READMEs have no WER tables; not in SRB Table 5.
- `data2vec-audio-large-960h`: Only single-model HF cards and Open ASR; fairseq READMEs have no WER tables; not in SRB Table 5.
- `data2vec-audio-base-960h`: Only single-model HF cards and Open ASR; fairseq READMEs have no WER tables; not in SRB Table 5.
- `cartesia-sonic-3-6`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `gemini-3-8-flash-tts`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `gemini-3-8-flash-lite-tts`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `elevenlabs-v3-conversational`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `elevenlabs-turbo-v2-5`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `minimax-speech-2-6-hd`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `smallest-lightning-v3-1-pro`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `hume-octave-2`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `azure-hd-2-5`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `amazon-polly-generative`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `magpie-tts-multilingual-357m`: Only NVIDIA's own held-out card evaluations (one model per run). carun/tts-bench (Apache-2.0) scores Magpie and Kokoro-82M (Whisper WER on 56 sentences), but its other two engines are not catalogue models, so a new benchmark would have only 2 models.
- `breeze-tts-2`: No licensed measurement of this exact version found (same sources as the Vapi-only group; previous research notes in speech-followup-report.md still hold). Vendor pages give no score on an existing benchmark.
- `mai-transcribe-2`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `gladia-solaria-3`: Commercial STT. Pipecat, OpenBench, verli, raven, koedesk, Bangla, Picovoice and Open ASR (GitHub) are at their latest commits with nothing new for these models; raven's Grok run has no second catalogue model; the newer Open ASR Space data (hf-audio/*) has no licence; avazibra/uzbek-stt-bench (Gemini 3.5 Transcribe) licenses code MIT and transcripts CC BY but not the results table, on 3 five-minute clips; vendor announcements (e.g. MAI-Transcribe-2 FLEURS-60 average) use benchmarks not in benchmarks.json.
- `coqui-en-ljspeech-tacotron2-ddc`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-en-ljspeech-glow-tts`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-en-ljspeech-speedy-speech`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-en-ljspeech-fast-pitch`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-en-ljspeech-overflow`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-en-ljspeech-neural-hmm`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-de-thorsten-vits`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-es-css10-vits`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-fr-css10-vits`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-pt-cv-vits`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-uk-mai-glow-tts`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `coqui-tr-common-voice-glow-tts`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `speechbrain-fastspeech2-ljspeech`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `piper-en-us-lessac-medium`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `kitten-tts-mini-0-8`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `kitten-tts-2`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `pocket-tts`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `dia-1-6b-0626`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `chatterbox-turbo`: No open-licensed multi-model quality evaluation found: Coqui/Piper/Kitten/Pocket/Chatterbox READMEs have no score tables; Picovoice's TTS benchmark (Apache-2.0) measures latency/memory only; GitHub search for licensed small-TTS WER/MOS benchmarks found none with >= 2 of these models.
- `seed-tts-2-0-standard`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `azure-neural-tts-xiaoxiao`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `sarvam-saarika-v2-5`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `vits-ljspeech`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `grad-tts-10-hifigan`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `qwen-audio-3-0-asr`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `cartesia-sonic-2`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `tencent-hy-asr-3-0-preview`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `aquavoice-avalon-v1-en`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `tacotron2-hifigan-gradtts-study`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `fun-asr-flash`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `glow-tts-hifigan-ft-ljspeech`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `zipformer-transducer-xl-290m`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `revai-fusion`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `espnet-e-branchformer`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `espnet-multiconvformer`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `neuphonic-neu-hq`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `tacotron2-hifigan-ft-ljspeech`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `elevenlabs-v3-alpha`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `google-chirp`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `azure-ameha-neural`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `addis-voice-2`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `azure-mekdes-neural`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `ultravox-v0-6-llama-3-1-8b`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `espnet-branchformer-18layer`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `glow-tts-hifigan-gradtts-study`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `mimo-v2-5-tts`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `vokan`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `glow-tts-hifigan-ljspeech`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `cartesia-sonic`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `abr-asr-19m-v2-en`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `espnet-conformer-2020-lm`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `dia2-2b`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `espnet-transformer-18layer-lm`: Only evaluator is the ESPnet egs2/librispeech README (test-clean + test-other, already counted). The same README also prints dev-clean/dev-other WER and CER/TER; not added because they are correlated splits/metrics of the same run (owner could approve generic librispeech-dev-*-wer benchmarks, which the NeMo score CSVs could also feed). No other evaluator runs these exact ESPnet recipe checkpoints.
- `voicecraft-830m-tts-enhanced`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `simple-tts`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `fastspeech-xcmyz-gradtts-study`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `tacotron2-hifigan-ljspeech`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `jasper-10x5-nvidia-dle`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `quartznet-15x5-nvidia-dle`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `nvidia-tacotron2-waveglow`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `fastpitch-1-0-waveglow`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `fastpitch-1-1-waveglow`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `lightspeech`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
- `priorgrad-acoustic`: Unlisted model (comparison-only or historical); kept its existing single-source evidence. Not researched further in this pass beyond the shared sources above.
