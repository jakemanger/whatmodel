# Data completion — 6 October 2026

Five research lanes looked for missing results and model facts. Only rows read directly from a pinned,
openly licensed source (or a maker's own facts) were imported; anything with an unclear licence,
copied baselines or an uncertain checkpoint was held back.

## Added

- **350 benchmark results**, which calibrate 9 more models on their category's main scale:
  - LLMs (577 → 584): LongCat 2.0, Falcon-H1R 7B, Nemotron Cascade 2 30B-A3B and LFM2 24B-A2B, from
    model cards and CC BY reports whose authors evaluated their baselines in-house; EXAONE 4.0 32B,
    Nemotron Nano 9B v2 and LFM2.5 1.2B Thinking from the EuroEval leaderboards (MIT).
  - Video: CogVideo 9B (FETV human video-quality ratings, CC BY 4.0).
  - Speech-to-text: Grok Voice Transcribe 2 (Pipecat STT benchmark, BSD-2-Clause).
  - Maya1 gets its first result (TTS deepfake-detection study, CC BY 4.0); it cannot calibrate yet.
- **176 LLM context windows** from the makers' own model cards, reports and docs. Older base models
  record their training sequence length, as the makers state it.
- **101 model facts** for image, video, speech and LLM entries: release months, weight licences and
  parameter counts, with a note where a count covers only part of the system.
- New benchmarks: LiveCodeBench Pro 2025Q2 (Easy, Medium), EuroEval English Life in the UK and
  HellaSwag (test and validation kept apart), Pipecat semantic WER, FETV video quality, DailyDialog
  TTS WER.

Leave-one-out fit after the import: LLM r 0.926 → 0.921 (median error 3.8 → 3.9 points), mostly from
scoring the new EuroEval cells themselves; other categories unchanged. Top 5 in every category is
unchanged.

## Held back

- Rows whose evidence was flagged for review: Apriel 1.6 and Nemotron Nano 9B v2 card baselines
  (claims of in-house runs contradicted by matching public numbers), 15 context windows (native vs
  extended context conventions, endpoint-specific limits), 53 model facts (archived pages, preview vs
  GA months, inferred checkpoints or licences).
- EuroEval rows for GPT-2 and Llama 2 base models: they would merge the historical set into the main
  scale with implausible placements (GPT-3 davinci above GPT-4). Near-chance EuroEval rows.
- Mage-Flow: its only bridge to the main image scale is a single baseline model.
- K-Sort Arena: its MIT card conflicts with "research and educational purposes only" terms.
- Rejected outright: EXAONE (NC licence), ERNIE 4.5 and Ling 3.0 Flash (copied baseline numbers),
  Devstral Small 2 (publicly reported competitor values), LFM2.5 and Nemotron 3 Nano 4B (custom
  licences), the Open LLM Leaderboard (no data licence) and tts-bench (code-only licence).

Still uncalibrated: 61 LLMs (mostly historical base models), 13 TTS, 13 STT and 6 image models. Run
`node docs/research/completeness-audit.ts` for the remaining field gaps.
