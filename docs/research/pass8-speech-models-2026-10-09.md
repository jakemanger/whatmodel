# New TTS and STT models, pass 8, 2026-10-09

The machine-readable output is `pass8-speech-models-2026-10-09.json`. It has `models`, `results`, `benchmarks`,
`ledger`, `gaps`, `checked` and `held_for_owner`. Nothing in `data/` was edited.

## How the work was done

- **Split.** The pass ran as four forks plus the lead:
  - A: independent TTS sources already in the ledger.
  - B: independent STT sources already in the ledger.
  - C: new open-weights releases.
  - D: new API releases.
  - Lead: new arXiv papers and the Open ASR Leaderboard check.
- **Interruption.** A usage limit stopped the forks part-way.
  - B had generated its transcribe.cpp entries but never wrote them out. The lead checked them, finished B's verli
    work and wrote B's part.
  - C left about 15 candidate cards unread. The lead triaged them and added Moondream and GigaAM.
  - D's ledger additions for two price pages were missing. The lead added them.
- **Validation in a scratch copy of the repo:**
  - Every model, result, benchmark and ledger change applies with no duplicate against `data/`. Duplicates were checked
    on model id and name, on model + benchmark + URL, and on model + benchmark + ledger id.
  - `node scripts/check.ts --validate-only` passes: 1,362 models, 14,776 results, 829 benchmarks, 776 sources.
  - It also passes on a copy of the working tree as of 2026-10-10, which other passes had already extended: 1,429
    models, 16,451 results, 795 sources. None of the 46 ids collide with what those passes added.
  - Every result URL resolves to the ledger id given in its `source_id`.
  - `npm test` gives the same result before and after the merge. One test fails in both because the scratch copy has no
    `pages/` folder.
- **Counts.** Counts below come from `toCells` in `lib/score.ts` on that copy. Each count is the number of counted
  cells, before → after.

## Outcome

**The pass proposes 46 new models (10 TTS, 36 STT), 243 result rows (179 independent, 64 lab), 5 new benchmarks and 16
ledger changes.** Every new model ends with at least one counted cell. Existing models also gain counted cells:

| Model | Before → after |
|---|---|
| voxcpm2 | 16 → 27 |
| moss-tts-v1-5 | 7 → 15 |
| dots-tts-soar | 9 → 16 |
| qwen3-tts-12hz-1-7b-base | 30 → 38 |
| fish-audio-s2-pro | 19 → 25 |
| vibevoice-asr-hf | 1 → 6 |
| parakeet-tdt-0-6b-v3 | 18 → 23 |
| voxtral-mini-4b-realtime | 9 → 14 |

### New models and the runs they score in

| Model | Kind | Run(s) that count |
|---|---|---|
| parakeet-ultra, orukeet, parakeet-unified-en-0-6b, nemotron-speech-streaming-en-0-6b, multitalker-parakeet-streaming-0-6b-v1, parakeet-tdt-ctc-1-1b, granite-speech-4-1-2b-nar, granite-speech-4-1-2b-plus, granite-speech-5-0-470m-turboctc-nc, moss-transcribe-diarize, fun-asr-nano-2512, fun-asr-mlt-nano-2512, sensevoice-small, breeze-asr-25, medasr, parakeet-primeline | open STT | transcribe.cpp: LibriSpeech test-clean (full precision) and FLEURS en (Q8_0), both runs of 41 or more models; FLEURS zh CER is new for this source (16 rows). Local command: transcribe.cpp GGUF. |
| parakeet-redux | open STT | Moondream cards (Open ASR 7-set mean, FLEURS-25 mean, TED-LIUM long-form). Run with parakeet-ultra and parakeet-tdt-0.6b-v3. |
| gigaam-multilingual-ctc, gigaam-multilingual-large-ctc | open STT | GigaAM card, English FLEURS and Common Voice. The two siblings form a 2-model lab run. |
| vibevoice-asr-streaming-7b, vibevoice-asr-bitnet | open STT | VibeVoice-ASR-Streaming report (CC BY) and VibeVoice-ASR-BitNet card: LibriSpeech, GigaSpeech, FLEURS, VoxPopuli, with Microsoft siblings. |
| fish-audio-transcribe-1, inworld-stt-1 | API STT | verli: LibriSpeech, Earnings-22 and SPGISpeech runs of 10 or more models. |
| cartesia-ink-whisper | API STT | verli and pipecat. |
| grok-voice-transcribe-1-0 | retired API STT, comparison-only | verli `grok-stt`, run 2026-07-16..18. Grok 2.0 only shipped in September, so July runs were 1.0. |
| muse-voice-transcribe-1-0, assemblyai-universal-3-6-pro-realtime, assemblyai-universal-streaming-english, cartesia-ink-2, elevenlabs-scribe-v2-realtime, gemini-3-5-transcribe-live, gpt-realtime-whisper, soniox-v5-realtime, soniox-v4-realtime (comparison-only), speechmatics-linden-1, smallest-pulse | API STT | Pipecat STT benchmark pooled semantic WER (README @94f5672). |
| longcat-audiodit-3-5b, longcat-audiodit-1b | open TTS | LongCat card Seed-TTS (siblings). 3.5B also gets the Qwen-Audio-3.0-TTS report's own-run ERes2Net SIM and CV3 hard rows. |
| dots-tts-mf | open TTS | dots.tts report: Seed-TTS and CV3 rows, with the Base and SOAR siblings. |
| gepard-1-0 | open TTS, comparison-only | Gepard card and report: Seed-TTS en WER, SIM and UTMOS, with the authors' own runs of VoxCPM2, Fish S2 Pro and OmniVoice. |
| glm-tts | open TTS | UltraEval-Audio CV3-Eval and Seed-TTS replication tables. |
| lemas-tts-multilingual-grl, lemas-tts-multilingual-prosody | open TTS | Make the lone `lemas-eval-9lang-wer` run count. The 9-language mean is derived (see held items). |
| fasih-tts-v1, silma-tts-v1, nabra-82m-v0-1 | open Arabic TTS | Arabic TTS Arena, pinned 2026-09-24 snapshot. |

### Rows by source

| Ledger entry | Change | Rows |
|---|---|---:|
| speech-ultraeval-audio-apache | `add_match` GLM-TTS.md at the same commit | 52 |
| speech-stt-transcribecpp-mit | `add_match` 16 catalog files at 18947cf | 50 |
| speech-qwen-audio3-tts-report | scope note only | 18 |
| speech-dots-tts-report | existing | 13 |
| card3-nineninesix-gepard-1-0 | new, Apache-2.0 card + CC BY report | 12 |
| speech-stt-pipecat-bsd2 | existing pin | 12 |
| speech-stt-iberian-bench-ccby | new, arXiv:2609.36920v1 CC BY | 11 |
| speech-rvcbench-ccby | `add_match` arXiv v3 | 10 |
| speech-stt-verli-mit | existing pin | 10 |
| card3-microsoft-vibevoice-asr-bitnet | new, MIT card | 10 |
| speech-vibevoice-asr-streaming-report-ccby | new, arXiv:2609.02812v2 CC BY | 9 |
| card3-moondream-parakeet-cards | new, CC BY cards | 9 |
| card3-meituan-longcat-longcat-audiodit-3-5b | new, MIT card | 8 |
| speech-stt-cose-e-ccby | new, arXiv:2609.35645v1 CC BY | 6 (1 invalid) |
| speech-stt-mu-bench-ccby | new, arXiv:2609.32082v1 CC BY | 4 |
| card3-ai-sage-gigaam-multilingual | new, MIT card | 4 |
| speech-arabic-tts-arena-apache | existing pin | 3 |
| speech-lemas-report-bysa | existing | 2 |

Ledger changes that carry price facts only:

- `first-party-inworld`: new entry.
- `first-party-meta` and `first-party-smallest`: `add_match`.

### New benchmarks

- `cose-e-eu4-mean-wer`: enterprise code-switching, mean of four European pairs. 5 valid models.
- `iberian-asr-7lang-macro-wer`: Telefónica/UAM, 11 models, all catalogued.
- `mu-bench-batch-uer`: voice-agent telephony, LLM-judged UER. 4 models.
- `cv3-eval-zh-cer`: from fork A.
- `minimax-ml21-ultraeval-macro-err`: from fork A, the 21-language intersection.

Each new benchmark carries a `suggested_tasks` proposal.

### Open ASR Leaderboard

- **GitHub CSVs.** The `scripts/data` CSVs are byte-identical at HEAD 67e8bd6 (2026-10-02) to the pinned files, and
  every row is already imported. The one exception is long-form `assembly/best`, which is a tier with no model identity.
- **Live board.** The newer entries (Phonon-2, thewhisper, sprag, ABR, Meta MUSE) appear only on the live Space. The
  Space reads `hf-audio/*` result datasets that have no licence, so they were not used.

## Held for the owner

1. **RVCBench v3 changed the CosyVoice2 LibriTTS cells.** v2 printed 0.60 / 0.17; v3 prints 0.58 / 0.05. The owner
   may replace the two v2 rows with the v3 values. Separately, the `rvcbench-*` caveat should now say that the StyleTTS2
   row is imported.
2. **Arabic arena snapshot.** Ratings drifted at the 2026-10-09 snapshot, but it has no new models, so no new snapshot
   is proposed.
3. **Pipecat product-default rows.** AWS, Azure, Google `latest_long`, Gradium `default` and Speechmatics N/A would
   count, but each needs a product-level catalogue entry.
4. **verli engines with an unpinned model.** Gladia, Soniox `stt-async-preview`, Azure and Apple SpeechAnalyzer.
5. **Comparator columns with no statement that the authors ran them:**
   - the GigaAM card (Omnilingual 1B, SeamlessM4T v2, Whisper large-v3);
   - the VibeVoice-ASR-BitNet card;
   - Confucius4-TTS.
6. **LEMAS-TTS printed averages.** The printed Avg disagrees with the per-language cells, so the rows use the derived
   9-language mean.
7. **Qwen3-TTS 0.6B CV3-en outlier.** UltraEval prints 33.91 ± 13.06; the row was not used.
8. **Sources that need permission or an owner call:**
   - VoiceHub Arena: 33 models, but no licence.
   - SGLang-Omni cookbook: per-model protocols.
   - nsanku Ghanaian TTS benchmark.
9. **Missing logos for new providers.** Moondream, Oruk AI, Sber, LEMAS Project, MediaTek Research, primeLine,
   nineninesix.ai, SILMA AI, NightPrince and oddadmix have no logo yet.
10. **Benchmark name.** `granite5-report-oasr-public7-wer` now also holds Moondream's run of the same 7-set mean. The
    owner may rename it to something source-neutral.

## Not proposed (see `gaps`)

- **No result from an allowed source:**
  - Eleven v4 and v4 Turbo.
  - MAI-Voice-2.
  - IndexTTS-2.5: the card has no table, and its report uses the default arXiv licence.
  - Gepard 1.1.
- **Not released:** Qwen3-TTS 25 Hz.
- **Numbers credited to a third party:** ARK-ASR's card table is credited to the Open ASR Leaderboard.
- **Comparators not shown to be the authors' own runs:** JoyAI-Voice 2.0 and Confucius4-TTS.
- **Model identity unclear:** AfriSwitch, Vimarsha, the accent paper and FFASR.
- **Fewer than 3 models on the test:** the raven.eval Grok 1.0 rows.
