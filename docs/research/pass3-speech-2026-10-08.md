# Speech models, third pass, 2026-10-08

Machine-readable output: `pass3-speech-2026-10-08.json` (`results`, `benchmarks`, `ledger`, `models`, `gaps`, `checked`).
Nothing in `data/` was edited.

The input was 104 runnable TTS and STT models that are thin, have no results, or sit in a disconnected comparison set.
This pass skipped the earlier passes' dead ends and tried two things they had not:

- Re-mining sources already in the ledger for rows or columns they left out.
- Proposing a comparison-only model where it is the only thing stopping a real run from counting.

## Outcome

- **23 result rows, 4 new benchmarks, 4 ledger changes (3 new entries, 1 `add_match`) and 5 proposed comparison-only
  models.**
- I merged everything into a scratch copy and ran `node scripts/check.ts --validate-only`. It passes: 1,294 models,
  12,120 results, 781 benchmarks and 711 sources. The only warnings are the existing missing logos, plus KittenML.
- Counts come from `toCells` (lib/score.ts) on that copy.

### Rows per source

| Ledger entry | Status | Rows | What |
|---|---|---:|---|
| `speech-paradee-report-ccby` | new, CC BY 4.0 | 6 | Paradee (arXiv:2610.06817v1) Table 3: UTMOS and Whisper-base WER for Kokoro-82M, Piper lessac medium and KittenTTS nano 0.8 |
| `first-party-speechbrain-asr-cards` | new, Apache-2.0 cards, vendor rule | 6 | SpeechBrain's own LibriSpeech and VoxPopuli WER on three pinned cards, pooled like `first-party-meta-asr-cards` |
| `speech-carun-tts-bench-apache` | new, Apache-2.0 | 3 | carun/tts-bench: Whisper-large-v3 WER for Kokoro-82M, Magpie 357M and Qwen3-TTS 0.6B CustomVoice |
| `speech-wayu-thai-tts-ccby` | existing | 3 | Same Table 8 as the recorded Thai rows: English CER on 500 held-out LibriTTS lines |
| `speech-vits-icml2021` | existing | 2 | VITS Table 3 (VCTK) study baselines, so the existing `vits-vctk` VCTK row counts |
| `speech-espnet-librispeech-20260929` | existing + `add_match` | 2 | ESPnet's own Whisper-medium LibriSpeech run from the OWSM v3.1 README, at the same pinned commit |
| `speech-arabic-tts-arena-apache` | existing | 1 | The retired "Fish Speech S1-mini" row of the 2026-09-24 snapshot |

### Islands

- **ESPnet LibriSpeech (11 STT models): linked.** It is linked through the two `whisper-medium` rows. The STT
  comparison graph is now one component of 140 models. Each ESPnet model still has 2 counted results, because no
  independent evaluator runs these recipe checkpoints.
- **VITS 2021 LJ Speech (5) and Grad-TTS 2021 (4): not linked.** Linking either needs a licensed run that includes the
  official `pretrained_ljs.pth` or the 10-step Grad-TTS checkpoint together with a main-scale model. None exists:
  - Guided-TTS (PMLR, CC BY) runs Grad-TTS at 50 steps.
  - Matcha-TTS, OverFlow and Neural HMM carry the default arXiv licence, and StyleTTS 2 is CC BY-NC-SA.
  - The deepfake corpora report no quality score per system.

### Models reaching 3+ (counted before → after)

- `vits-vctk` 2 → 3
- `openaudio-s1-mini` 2 → 3
- `wayu-paxa-tts-edge` 2 → 3
- `speechbrain-asr-wav2vec2-librispeech` 1 → 3

Models that gained but stay below 3:

- `piper-en-us-lessac-medium`: 0 → 2. It was a no-results model.
- `magpie-tts-multilingual-357m`: 0 → 1. It was raw-only before.
- `speechbrain-asr-conformer-largescaleasr`: 1 → 2.

Models outside the input list also gain:

- Kokoro-82M: +3.
- OmniVoice: +1.
- Gemini 3.1 Flash TTS preview: +1.
- Whisper medium: +2.
- The five proposed models.

## Decisions for the owner

1. **ESPnet link (`add_match`).** The OWSM v3.1 README at the same commit prints "Whisper medium (769M)" LibriSpeech WER.
   ESPnet ran it itself: arXiv:2309.13876 says "we prepare all test data in ESPnet and evaluate Whisper in the same
   setup".
   - Adding the file to the existing ESPnet evaluator pools two ESPnet protocols under one run level. The recipe rows
     use beam search with an LM. The Whisper rows use greedy decoding with the Whisper normaliser.
   - The entry's scope sentence ("not third-party comparison numbers") would need a clause allowing ESPnet's own runs
     of public checkpoints.
   - Side effect: the ESPnet test-other run becomes the largest run with an independent row, so it takes the bare
     `librispeech-test-other-wer` key. This changes the label only, not any run level.
2. **Arabic TTS Arena retired rows.** The benchmark says retired models "keep frozen historical ratings". That is not
   what happens:
   - The backend's `elo.py` fits Bradley–Terry "to all votes".
   - S1-mini's rating moves between daily snapshots (965.5 on 05-10, 963.7 on 06-02, 940.6 on 07-30, 930.1 on 09-05,
     931.4 on 09-24) while its battle count stays at 506.

   If you agree, edit the setup and caveat and accept the S1-mini row. No other retired row maps to a catalogue model.
3. **Five comparison-only models.** Each one is the only thing missing for a real run or benchmark to count. Identity
   evidence is in `models`.

   | Model | Why it is needed |
   |---|---|
   | `kitten-tts-nano-0-8` | Its 56.8 MB fp32 file matches `kitten-tts-nano-0.8-fp32` byte for byte. Paradee itself would serve too. |
   | `qwen3-tts-12hz-0-6b-customvoice` | carun/tts-bench |
   | `speechbrain-asr-transformer-transformerlm-librispeech` | SpeechBrain cards pool |
   | `tacotron2-hifigan-vctk-vits-study`, `glow-tts-hifigan-vctk-vits-study` | Trained by the VITS authors and not released, like the existing Grad-TTS study models. |
4. **Four new benchmarks, each with exactly three models (proposals included):**
   - `paradee-wikitext200-utmos22`
   - `paradee-wikitext200-whisper-base-wer`
   - `carun-tts-bench56-whisper-v3-wer`
   - `wayu-libritts500-en-whisper-v3-cer`

   `suggested_tasks` is empty for all four, because no speech task in tasks.json fits.
5. **Leads that need you, not more searching.** These are the only places the commercial TTS models and the newer
   small open models (Pocket TTS, Kitten, Chatterbox Turbo, Dia, Coqui) are scored at scale:
   - **Datapoint (CC BY 4.0, gated).** `datapointai/tts-human-preferences-large` has an auto-approved gate. It holds
     votes between Eleven Turbo v2.5, Multilingual v2, Flash v2.5 and Monolingual v1. A Bradley–Terry fit would give
     Turbo v2.5 its first counted run. The 315k Audio Bench set (manual gate) covers 15 models, including Simba 3.2,
     Grok TTS and Inworld. Accepting a gate is an account action, so I did not do it.
   - **Hugging Face Open TTS Leaderboard (launched 2026-09-30).** It covers about 90 open models, including Pocket TTS
     and Supertonic 3. Its results dataset `hf-audio/tts_leaderboard_results` is private, with no licence. Ask HF to
     publish CSVs under Apache-2.0, as it did for the Open ASR Leaderboard.
   - **5uck1ess/tts-bench.** It has a very wide model list, but its MIT licence "applies ONLY to the bench code". Ask
     the maintainer for a data licence. The HeyNEO CPU benchmark repo has no licence at all.
6. **OpenRouter-gateway rows.** The Persian ASR board ran GPT Transcribe and others through OpenRouter. The existing
   benchmark excludes those rows. They are the board author's own measurements, not OpenRouter data. Allowing them
   would add one counted run for `gpt-transcribe`. MAI-Transcribe-1.5's row there is a failed run (113.8% WER).

## Gaps

`gaps` has one entry for each of the 104 models, with counts before and after and the specific reason.

- **Commercial TTS and STT:** no openly licensed source names these versions. The usable data is gated, private or
  unlicensed (item 5 above).
- **Coqui, LightSpeech, PriorGrad and SpeechBrain FastSpeech2:** no multi-model quality evaluation of these exact
  checkpoints exists.
- **omniASR v2:** every leaderboard outside Open ASR names v1 checkpoints.
- **VibeVoice-ASR-HF:** other boards run `microsoft/VibeVoice-ASR`. Its weights differ in size, so it is not the same
  checkpoint.
