# Pass 9: more image, video, TTS and STT models (2026-10-10)

The candidates are in `pass9-media-models-2026-10-10.json`. Nothing in `data/` was edited.

## Validation

The file was validated on a scratch copy of the 2026-10-10 working tree (1,432 models), using the owner's merge path:

- `apply-pass2.mjs`
- `node scripts/import.ts`
- `node scripts/check.ts --validate-only`

The merge applies cleanly: +45 models, +99 results, +4 benchmarks, 5 new ledger entries and 1 `add_match`. Every new model ends up in the main comparison set of its category (checked with `score-coverage`).

Three catalogue TTS models that had no score now have one:

- `gemini-3-8-flash-tts`
- `gemini-3-8-flash-lite-tts`
- `coqui-tr-common-voice-glow-tts`

No ids, names, repos, results or ledger ids collide with the other pass-9 files (arena, livebench-0831, llm-releases).

## How the candidates were found

1. **Existing image/video sources.** I re-extracted every table in the 110 image/video documents already in the ledger and listed each row label that is not a catalogue model. Most of these rows had been held back only because the model was not catalogued. I added a model only when the authors' own run names a public checkpoint or API id without ambiguity.
2. **New CC BY papers.** I table-scanned 295 more openly licensed cs.CV papers from 2026-05 to 2026-10 (pass 8 had not scanned them). Three are usable new benchmarks.
3. **New TTS model cards.** I scanned Hugging Face TTS cards created since 2026-06-15 with open licences. Two Apache-2.0 cards each ran Freya-TR-Eval themselves.
4. **Speech sources.** I compared all 53 pinned speech ledger sources with their current HEAD. Nothing new can be used.

## New models (45)

### Video (14)

| Model id | Where it scores |
|---|---|
| cosmos-predict2-5-2b | PAI-Bench overall and human Elo, Cosmos 3 HUE T2V/I2V (lab), PhyGround, CRONOS |
| cosmos-predict2-5-14b | Cosmos 3 HUE T2V/I2V (lab), PhyGround, CRONOS |
| magi-1-24b | PAI-Bench overall and Elo |
| magi-1-4-5b | PAI-Bench, CRONOS |
| cosmos-predict2-2b-video2world, cosmos-predict2-14b-video2world | PAI-Bench |
| wan-2-1-i2v-14b-720p | PAI-Bench overall and Elo |
| dynamicrafter-1024 | PAI-Bench overall and Elo |
| wan-2-1-vace-14b | WROP human Elo |
| hy-omniweaving | WROP, PhyGround, VideoArgus T2V and TI2V |
| stepvideo-t2v | VideoArgus T2V |
| stepvideo-ti2v | VideoArgus TI2V |
| univideo | WorldReasonBench human Elo |
| minimax-h3-max | Rapidata relative-camera and I2V-realism (API model MiniMax-H3-Max, priced on MiniMax's own page) |

### Image (22)

| Model id | Where it scores |
|---|---|
| magicbrush | EdiVal (weights pinned in the paper's appendix) |
| anyedit | EdiVal, Edit-Compass, WEAVE (lab: WEAVE's first author is an AnyEdit author) |
| ultraedit-sd3 | EdiVal |
| ovis-u1-3b | WEAVE, ViGoR |
| skywork-unipic-1-5b | WEAVE |
| unipic2-sd3-5m-kontext-2b | WEAVE |
| unipic2-metaquery-9b | WEAVE, ViGoR |
| nextstep-1-large-edit | Edit-Compass, UnicBench, WEAVE (mapping flagged under "Held for the owner") |
| deepgen-1-0 | Edit-Compass, ChartSync, WISE v4 Table 11 |
| unipic3 | Edit-Compass |
| joyai-image-edit | Edit-Compass |
| flux-2-klein-base-9b | ChartSync |
| firered-image-edit-1-0 | ChartSync |
| firered-image-edit-1-1 | ChartSync, MultiTextEdit |
| hidream-e1-1 | ViGoR |
| cogview4-6b | MMMG, HPSv3 |
| janusflow-1-3b | MMMG |
| infinity-8b | MMMG |
| boogu-image-0-1-base | UltraText |
| hidream-o1-image-dev | UltraText |
| imagen-4-fast | Rapidata 6M and Face |
| minimax-image-01 | Rapidata Face |

### TTS (9)

The new models are `elevenlabs-v4`, `elevenlabs-v4-turbo`, `ema-lightning`, `trendyol-tts`, `antalia-2-mini`, `antalia-1`, `freyatts-small`, `mms-tts-tur` and `piper-tr-tr-dfki-medium`.

All of them score on the new `freya-tr-eval-wer` benchmark. Local commands are included for Piper, MMS and EMA Lightning, following documented card and CLI patterns.

Eleven v4 and v4 Turbo come with list prices from ElevenLabs' pricing page: $80 and $40 per 1M characters, with a launch promotion running until 12 October.

### Existing models with new rows

- omnigen-v1: WEAVE
- longcat-image and hunyuanimage-3-0: WISE Table 11
- Several existing models are in the three new benchmarks:
  - MultiTextEdit: 8 models
  - What-If World: 6 models
  - CRONOS: wan-2-2-i2v-a14b

## New benchmarks (4)

| Benchmark id | Source | Models |
|---|---|---|
| `freya-tr-eval-wer` (TTS) | EMA Lightning card and Patientdesk.ai's re-run printed on the Antalia-2 Mini card | 18 rows in 2 runs |
| `multitextedit-semavg` (image) | arXiv 2605.08163v2 | 9 models |
| `whatif-world-apeo-pavg` (video) | arXiv 2605.27589v1 | 6 models |
| `cronos-i2v-success-rate` (video) | arXiv 2605.23699v1 | 4 models |

`freya-tr-eval-wer` measures Turkish TTS intelligibility (WER).

## Ledger changes

**New entries:**

- `card3-canberkkkkkk-ema-lightning`: Apache-2.0, pinned at 7a6ba1a
- `card3-cloud0day3-antalia-mini`: Apache-2.0, pinned at 1e8166a
- `visual-multitextedit-ccby`
- `visual-whatif-world-ccby`
- `visual-cronos-ccby`

**Added matches:**

- `first-party-elevenlabs` gains its model docs and changelog pages.

## Held for the owner

These are also in `held_for_owner` in the JSON.

**NextStep-1 mapping.** Three editing benchmarks report "NextStep-1" without naming a checkpoint. I mapped these rows to NextStep-1-Large-Edit, the only NextStep-1 checkpoint fine-tuned for editing. Drop them if you want an explicit checkpoint name.

**Unmapped rows that need a checkpoint decision:**

- MagicBrush: Edit-Compass and UnicBench
- UltraEdit: Edit-Compass and WEAVE (w_mask or freeform)
- HiDream-E1: Edit-Compass (E1-Full or E1.1)
- Boogu-Image-0.1-Turbo: UltraText (original or hotfix weights)
- EMU3.5: Edit-Compass
- MAGI-1 24B: WROP (MAGI-1.1 24B weights were uploaded to the same repo in June 2026)
- Kling v3 Omni: VideoArgus (catalogue has only kling-o3-pro)

**Freya-TR-Eval caveat.** Both evaluators also build Turkish TTS models. Their own rows are marked `by: "lab"`.

**Missing logos** for the new providers.

**Price drift.** ElevenLabs' pricing page now lists Eleven v3 Conversational at $0.04 per 1K characters. The catalogue entry says $0.05.

## Not proposed

These are listed in `gaps` in the JSON.

**Yume 1.5.** Its identity is clear, but all of its Rapidata ratings are below the Elo floor of 500 that `check.ts` enforces.

**Other Rapidata world models** (Sana WM, Alaya World, Dream X World). The checkpoint is not stated for any of them.

**No pinned public checkpoint:**

- InternVL-U
- UniReason1.0
- UniWorld-V2

**Two or more possible checkpoints:**

- VAREdit-8B (512 and 1024 versions)
- SANA-Video 2B (480p and 720p)
- LTX-Video 2B/13B (several versions)

**Still no allowed result.** I found no allowed result for the remaining unscored commercial and open TTS models. That includes Pocket TTS: its card is gated and its paper's licence does not allow reuse (CC BY-NC-SA). It also includes MAI-Voice-2, IndexTTS-2.5, Gepard 1.1, MAI-Transcribe-2 and Solaria-3.

**Moved speech sources.** Several pinned speech sources have newer commits, but none adds a usable row: open_asr, transcribe.cpp, raven.eval, Persian Triple Threat and the Arabic TTS Arena.
