# Source replacement audit

Reviewed 2026-09-25T10:46:32Z. This is the completed local replacement pass, prepared for the owner’s relaunch review. Nothing was pushed or deployed by this pass.

The dataset now contains **2,001 source-backed results for 367 model identities**, compared with 1,688 results for 340 identities in the original catalogue. It recovers measured evidence for **310/340 original models** and adds evidence for 57 distinct comparison identities. All 340 original catalogue entries remain; a missing measurement is not replaced with another model’s result.

The larger row count is not a claim of uniformly better coverage or predictive accuracy. Speech coverage, prices and current speed matches remain below the original. Dimensions from one experiment, correlated tasks, and new evaluation settings are not independent studies.

## Coverage against the actual original dataset

Baseline: commit `60c5632`, before Artificial Analysis removal. Counts from the intermediate, already-pruned snapshot would overstate recovery.

| Category | Original results | Reviewed results | Original models with evidence | All models with evidence | Models with a calibrated score |
|---|---:|---:|---:|---:|---:|
| llm | 1,426 | 1,642 | 203/206 | 208 | 177 |
| image | 102 | 98 | 38/38 | 50 | 45 |
| video | 61 | 106 | 29/30 | 47 | 44 |
| tts | 52 | 72 | 18/36 | 39 | 35 |
| stt | 47 | 83 | 22/30 | 23 | 22 |

The catalogue contains 397 entries; 367 have reviewed raw results and 323 have enough connected evidence for a score. Scored comparison-only models can lack a verified current API/download; the runnable table therefore lists fewer models. Both comparison-only and unscored measurements are linked from the category pages. Full counts and exact IDs: [coverage.json](coverage.json).

| Other field | Original | Reviewed now | Interpretation |
|---|---:|---:|---|
| Priced models | 271 | 181 | Exact served provider, currency, unit and source retained; unknown never means free. |
| Models with context metadata | 206 | 183 | Provider/input/model ceiling and native/extended settings documented. Not a guarantee that the window fits the estimated RAM. |
| Local speed references | 152 | 76 | 16 model IDs; settings-specific references, not current download predictions. |
| Quantization findings | 111 | 25 | Different benchmark/precision/setup conditions are retained, not pooled into a universal penalty. |
| Memory findings | — | 5 | Scoped measurements; not automatically assigned to every variant. |

The final price pass added 12 prices, 17 official API/run links without invented prices, and 36 context values. There are no verified replacements for current API throughput in this pass. The old 98-row calibration is disabled rather than being refit on incompatible measurements. The technical catalogue’s hardware specifications and every execution command were not independently revalidated by this benchmark-source project.

## Second pass, 25 September 2026 (evening)

The owner set three policies. Vendors' own list prices and context windows may be recorded by hand as first-party
facts. API speed is measured by us. Local speeds can also come from reviewed community runs submitted through `/bench`.
Against the original catalogue (commit `60c5632`):

| Measure | Original | After first pass | Now (26 Sep) |
|---|---:|---:|---:|
| Benchmark results | 1,688 | 2,001 | 3,462 |
| LLM / image / video / TTS / STT results | 1,426 / 102 / 61 / 52 / 47 | 1,642 / 98 / 106 / 72 / 83 | 2,578 / 336 / 207 / 210 / 131 |
| Scored LLM / image / video models | — | 177 / 45 / 44 | 210 / 125 / 78 |
| Original TTS / STT models with evidence | 36/36, 30/30 | 18/36, 22/30 | 24/36, 26/30 |
| Priced models (whole catalogue) | 271 | 181 | 321 |
| Models with context window | 206 | 183 | 219 |
| Local speed rows | 152 | 76 | 304 (incl. reviewed /bench runs) |
| Quantization findings | 111 | 25 | 1,051 |
| API speed (tok/s etc.) | 173 | 0 | 0; script and 117 provider-pinned targets ready, needs an API key |

- **Prices and context:** 40 `first-party-<vendor>` ledger entries, 102 prices, 23 context windows and 5 corrections
  to prices from older catalogue snapshots. Private evidence snippets are in `.research/prices-first-party/`. Eight
  already-priced rows use DeepInfra endpoints that DeepInfra marks deprecated (listed in `proposed_updates.json`
  there) and need another route.
- **Speech:** 14 new open-licensed sources, 186 results, 31 benchmarks and 24 comparison models. Three sources are CC
  BY-SA and are also exported separately in `data/extracts/speech-bysa-2.json`. Held back: the Open Danish ASR
  leaderboard (MIT). Its only gpt-transcribe row comes from an unversioned Azure deployment, and it lowers STT
  leave-one-out correlation from 0.53 to 0.06.
- **Quantization and local speed:** 151 new sources, mostly Red Hat quantized-model cards (the licence is declared in
  the card header, as with the earlier Ling precedent), plus intel/auto-round docs, llama.cpp, mlx-lm, and CC BY
  papers. Findings sharing a `study` key come from one table and are correlated. All speed rows keep
  `selected_download_eligible: false`.

26 September additions: 57 unmapped rows from the pinned Arena and Epoch revisions (both still the newest), 314
image and video results from 20 licensed benchmarks (image leave-one-out r 0.74 → 0.90), 875 LLM results from 35
openly licensed evaluators (MathArena output datasets, EQ-Bench 3, ARC-AGI baselines, Arena-Hard-Auto, 14 Hugging
Face Space leaderboards with committed licensed results, CC BY papers), and a second first-party price pass. The
coverage table is regenerated by `npm run provenance`; working notes are in `.research/`.

## Replacement sources and reuse basis

| Source family | What was used | Reuse route and restrictions |
|---|---|---|
| Arena dataset | 404 ratings across text, vision, documents, search, web development, image and video | Publisher’s CC BY 4.0 Hugging Face dataset at a pinned revision; not the arena.ai website. Distinct tasks and settings retained. |
| Epoch AI | 621 measurements | Internal CSV members from its CC BY 4.0 downloadable archive. Externally sourced CSV members are expressly excluded from the approval scope. |
| Open ASR | 39 measurements | Apache-2.0 published result CSVs; short/long/multilingual configurations kept separate. |
| Independent LLM evaluators | EvalPlus/EvalPerf, Aider, BFCL, ZeroEval, MMLU-Pro author runs and Korean evaluations | Reviewed, pinned result artifacts with their own grants. Test code licences alone are not treated as licences for unrelated live rankings. |
| LiveCodeBench | 13 exact-model results, two release windows | CC BY-SA 4.0; window, problem count and settings preserved. Separate adapted export and full notices published. |
| Publisher model cards and papers | Own-model benchmark cells and independently rerun baselines | Explicit Apache/MIT/CC grants for the actual document or dataset. Reasoning/Instruct, PT/IT, model generations and report versions remain distinct. Liquid card material retains its conditional licence; eligibility must be reassessed when circumstances change. |
| Visual studies | Original measurements from CC/MIT papers and publisher artifacts, including GenEval, video dimensions and task-specific evaluations | No copied comparison tables promoted merely because a wrapper has a licence. LLaDA and Jenga share-alike tranches are separately exported. Five AMD VBench dimensions are one experiment, not five independent studies. |
| Speech studies | Emergent, TTSDS, Chinese-news, Voxtral, Fish/dots, GigaSpeech, Russian ASR, VibeVoice, Addis AI and Vapi | Numerical grants checked separately from audio/model licences. No voice recordings or benchmark audio imported. Exact versions and language/voice limitations recorded. |
| Prices and context | models.dev, LiteLLM selected direct-provider rows, Bertrande own observations and explicitly licensed provider/card documents | Pinned catalogue evidence plus provider corroboration. No AA/OpenRouter-derived rows selected. Units, tiers and source-specific notices retained. Cloudflare extract remains share-alike. |

The exhaustive, executable register is [data/sources.json](../data/sources.json); every allowed entry is limited to reviewed paths rather than a whole domain. The public `/method#sources` page and JSON responses retain attribution and link full notices. `allowed` means the documented licence/scope review supports the selected use, not that a court or rights holder has given a bespoke legal opinion.

## What changed to keep the data meaningful

- The removed numbers were used only as a coverage/sanity baseline. Replacement results were extracted afresh from identified sources; their scores do not need to reproduce the old rank.
- Source identity is distinct from the hosting domain. Separate papers and evaluators on Hugging Face/arXiv are not pooled as one source, and self-reported records remain labelled.
- Exact benchmark versions, task windows, shot settings, reasoning modes, output units and model checkpoints are recorded where published. Unknown settings remain unknown. Copied or ambiguous comparison rows were withheld.
- No arbitrary minimum raw-result count is imposed on a model. A single genuine measurement is retained. A series with fewer than three tested models cannot estimate its own difficulty/discrimination reliably, so it is shown without forcing it into another source’s calibration.
- Disconnected comparison graphs have separate selectable score scales (`?set=<id>`). Only an actually shared evaluated model can connect them. Removing a bridge during validation suppresses an unidentifiable held-out prediction.
- Error ratios above 100% are valid when insertions exceed reference length. Raw values are preserved; a monotone negative-log transform replaces the invalid assumption that 1−error is a probability. Published MOS scales are displayed as MOS, not recognition accuracy.
- Related dimensions and tasks can still share bias. The fitted score is an approximate summary; its ± interval is model uncertainty, not a validated real-world confidence interval.

## Remaining original-model gaps

These IDs have no reusable exact-model measured result verified in this completed search. They remain in the catalogue but are not ranked. This is not a claim that no eligible source could ever be found.

**llm (3):** `grok-build-0-1`, `command-a-plus`, `exaone-4-5-33b`.

**video (1):** `ltx-2-5`.

**tts (18):** `cartesia-sonic-3-6`, `gemini-3-8-flash-tts`, `gemini-3-8-flash-lite-tts`, `qwen-audio-3-0-tts-plus`, `elevenlabs-v3-conversational`, `minimax-speech-2-6-hd`, `smallest-lightning-v3-1-pro`, `openai-tts-1-hd`, `openai-tts-1`, `hume-octave-2`, `hume-octave`, `azure-hd-2-5`, `amazon-polly-generative`, `openaudio-s1-mini`, `higgs-audio-v3-tts`, `magpie-tts-multilingual-357m`, `maya1`, `breeze-tts-2`.

**stt (8):** `gpt-transcribe`, `assemblyai-universal-3-5-pro`, `mai-transcribe-2`, `gemini-3-5-transcribe`, `grok-voice-transcribe-2`, `gladia-solaria-3`, `soniox-v5-async`, `granite-speech-5-0-470m-turboctc`.

The three LLM gaps have concrete blockers: Command A+’s licensed card lacks the numerical blog results; EXAONE 4.5’s reviewed documentation/report is noncommercial; Grok Build 0.1 lacks defensible exact-model evidence. LTX-2.5’s accessible port/code material did not establish reuse rights for an exact original-model quality result. Speech gaps mostly involve newer or differently named variants that cannot be equated with licensed older evaluations.

Closure details: [model cards](research/cards-final-scope.md), [speech](research/speech-followup-report.md), [visual models](research/visual-gap-notes.md), [prices/context](research/README-prices-gap.md). These handbacks describe their own frozen batches; the tables above describe the final merged state.

## Reproducibility, publication and checks

- [data/provenance.json](../data/provenance.json) records baseline, pinned inputs, seed hashes, source counts, policy and remaining gaps. Research manifests in `docs/research/` record exact extraction evidence. Some captured source pages are private working evidence; selected numerical rows, methods, source locators and checksums are published.
- `npm run export` generates public reviewed JSON snapshots and a SHA-256 manifest. It strips private filesystem paths; no `.research` baseline or downloaded voice/media assets are served. Full source-specific notices are in `public/licenses/`.
- [DATA-LICENSE.md](../DATA-LICENSE.md) licenses our numerical compilation contributions and derived scores under CC BY-SA 4.0. It does not relicense model weights, trademarks, application code or third-party material under incompatible terms. Recipients must respect each source’s applicable conditions.
- Current-data validation checks duplicate identities/results, categories, units, numeric ranges, exact approved source scopes, notices, price/context provenance and unknown-price budget behavior. Local tests also cover disconnected studies and error ratios above 1. Type checking, lint, production build and route/UI checks are run locally; results are recorded in `docs/VALIDATION.md`.
- Historical Git commits still contain earlier data. No history rewrite was performed. Republishing a repository with that history is a separate owner decision; the current static exports contain only the reviewed replacement data.
- No push, PR, deployment or workflow trigger was performed. The owner retains the relaunch decision.
