Final speech expansion — ready for import, 2026-09-25.

**98 numerical results, 24 benchmarks, 40 models, 10 licensed sources.** TTS: 55 results for 28 models, including 13 of the original 36 TTS models. STT: 43 results for 12 models, including four models absent at the initial audit (GPT-4o Transcribe, GPT-4o mini Transcribe, Deepgram Nova-3, Voxtral Mini Transcribe V2). Sixteen models are additions outside the original catalogue. No shared repository data/app files were edited; no push or workflow was triggered.

Original TTS models recovered: ElevenLabs v3, Multilingual v2, Flash v2.5; MiniMax Speech 2.8 HD and Speech-02 HD; Google Chirp 3 HD; OpenAudio S1; Kokoro 82M; Chatterbox; Fish Audio S2 Pro; Voxtral TTS; Zonos v0.1; XTTS v2.

| Numerical source | Results | Reuse evidence |
|---|---:|---|
| [TTSDS v1 published results](https://huggingface.co/datasets/ttsds/results/blob/111ccecaa50aec4ca1247c5f5d95c2058f6f2946/results.csv) | 4 | [MIT](https://huggingface.co/datasets/ttsds/results/blob/111ccecaa50aec4ca1247c5f5d95c2058f6f2946/README.md) |
| [EmergentTTS-Eval six-category leaderboard](https://github.com/boson-ai/EmergentTTS-Eval-public/blob/fe02c5d27f2d87751a66e32631aaa73a92d9cbbb/README.md) | 22 | [Apache-2.0](https://github.com/boson-ai/EmergentTTS-Eval-public/blob/fe02c5d27f2d87751a66e32631aaa73a92d9cbbb/LICENSE) |
| [Voxtral TTS](https://arxiv.org/html/2603.25551v2) | 12 | [CC BY 4.0](https://arxiv.org/abs/2603.25551v2) |
| [Fish Audio S2 Technical Report](https://arxiv.org/html/2603.08823v2) | 8 | [CC BY 4.0](https://arxiv.org/abs/2603.08823v2) |
| [dots.tts Technical Report](https://arxiv.org/html/2606.07080v2) | 2 | [CC BY 4.0](https://arxiv.org/abs/2606.07080v2) |
| [Voxtral Realtime](https://arxiv.org/html/2602.11298v1) | 14 | [CC BY 4.0](https://arxiv.org/abs/2602.11298v1) |
| [GigaSpeechBench: A Real-World Multilingual Speech-to-Text Benchmark](https://arxiv.org/html/2606.28884v1) | 16 | [CC BY 4.0](https://arxiv.org/abs/2606.28884v1) |
| [Russian STT benchmark by domain](https://github.com/vakovalskii/stt-ru-benchmark/blob/387548b8d9fdf51791a837b0c42059d2c2ebcaa9/README.md) | 9 | [MIT](https://github.com/vakovalskii/stt-ru-benchmark/blob/387548b8d9fdf51791a837b0c42059d2c2ebcaa9/LICENSE) |
| [Live voice-memo STT pilot](https://github.com/Smolevich/stt-benchmarks/blob/b6349a817a84cb0d74369b02ea951f1d6112f4f2/results/summary.csv) | 4 | [MIT; README findings CC BY 4.0](https://github.com/Smolevich/stt-benchmarks/blob/b6349a817a84cb0d74369b02ea951f1d6112f4f2/LICENSE) |
| [CN-NewsTTS Bench v0.1](https://github.com/Jayden-X-L/cn-news-tts-bench/blob/5cd2dcf0896f2391b877317221892a24066588bb/artifacts/scores/leaderboard.csv) | 7 | [CC BY 4.0](https://github.com/Jayden-X-L/cn-news-tts-bench/blob/5cd2dcf0896f2391b877317221892a24066588bb/LICENSE-DATA.md) |

Licences apply to the actual numerical result dataset, repository files, or report—not merely to model weights. CN-NewsTTS expressly grants CC BY 4.0 for leaderboard results. GigaSpeechBench numbers come only from the CC BY report; its repository/dataset did not provide a grant. MIT/Apache notices and source snapshots are preserved in `speech-evidence/`; source records include attribution and licence URLs. Retain these notices/attributions when integrating. `speech-evidence-manifest.json` records local snapshot hashes.

Integration details:

- Group evaluator curves by `source_id`; exact `source` URLs also match the source rules. `by=lab` only for the evaluator's own model. Mistral's OpenAI/Kyutai/ElevenLabs evaluations are `independent`; Boson's Higgs Audio v2 is `lab`. Independent here still includes competitors' evaluations, not necessarily a neutral organization.
- No benchmark has `chance`. Emergent preference rates below 50% are meaningful and must remain usable. Its current six-category table uses stable Gemini 2.5 Pro with thinking budget 256; the deprecated preview-judge and five-category variants are excluded.
- Percentage error/preference scores divide by 100. TTSDS is a distribution score and speaker similarity is cosine—not literal accuracy. CN-NewsTTS uses its original fractional target accuracy. Preserve `metric`, `setup`, `note`, `raw_value`, and transformation metadata so these differences remain visible.
- TTSDS v1 uses the original package 0.0.2 enum: mean each of general/prosody/speaker/intelligibility, then mean those four factors; environment excluded. Subcomponents retained solely as derivation evidence, not separate results.
- Mistral's Seed-TTS split is unspecified and its ASR is Voxtral Transcribe V2: it has separate benchmark IDs and is not relabelled test-en. Its multilingual STT averages mix Chinese/Japanese CER with other-language WER. GigaSpeech English accent label IDN-EN differs from repository IND-EN; preserve the report label and caveat.
- API aliases identify published versions but generally lack immutable backend build IDs. Weight commits, generation seeds, and some CN-NewsTTS voice IDs are unspecified. Report these limits rather than claiming exact reproducibility. Original model records are minimal identity metadata; no AA-derived pricing, speeds, or scores carried over. `recovered_original` means catalogue membership, not absence from the concurrently edited working data.

Both suggested STT repositories qualify. For vakovalskii, nine selected corpus WERs were independently recomputed from raw JSONL using its documented normalization and match the published values; all have source CIs. FLEURS n=775, audiobooks n=296 (Nova-2 n=295 successful), Podlodka n=20. The last is explicitly a pilot. Gateway Whisper routes with uncertain returned models and oracle corrections are excluded. For Smolevich, four Nova-2/Nova-3 full-set medians reproduce from raw run values: ten clips per language, three runs each, single speaker, private audio, smart_format=true. This is a small pilot median, not corpus WER or the README's clean-eight headline table.

Held out / remaining gaps:

- VibeVoice 1.5B and VoxCPM 2 baseline values copied in dots.tts are removed. Only dots.tts's own SOAR values retained. VibeVoice's original arXiv paper has no permissive reuse grant; its MIT repository contains an own-measurement MOS figure, but no verified Seed table. OpenReview licence metadata could not be retrieved. This is a follow-up lead, not imported evidence.
- TTSDS2 has an XTTS identity conflict (data key xtts_2 versus paper/site XTTSv1); no silent relabelling. Verified TTSDS v1 submission explicitly links XTTS-v2 and supplies the recovery.
- Emergent's Hume model version is unspecified; cannot assign Octave/Octave2. Gemini 2.5 Preview does not become Gemini 3.8; Higgs v2 does not become v3; Polly Neural does not become Generative; Azure Neural does not become HD; OpenAudio S1 does not become S1-mini.
- The Amharic candidate explicitly licenses numerical files CC BY-SA 4.0; omitted from this permissive-only payload rather than silently discard its share-alike obligations. Its commercial generated audio has separate terms.
- No verified licensed numbers for the other 23 original TTS models in this pass. They remain listed in `speech-gaps.json`. No AA, secondary republications of AA, guessed graph readings, generic model aliases, or duplicate aggregate/subcomponent results were imported.

Validation: all source/benchmark/model references resolve; no duplicate model–benchmark pairs; finite valid scores; raw Russian WER and memo median checks pass; CN-NewsTTS strict scores match integer numerator/denominator; licence evidence files exist; by-flags and omitted-chance/held-out-model assertions pass. Extraction is reproducible with `python3 /tmp/whatmodel-expansion/build_speech.py` using the archived files.

Payload SHA-256: `53e680bebc8054af692106a59ec458564f0c349a1d38375bd07d2370218e9828`.
