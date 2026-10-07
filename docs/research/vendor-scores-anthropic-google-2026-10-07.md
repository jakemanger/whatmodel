# Vendor-reported scores: Anthropic and Google (seed, 2026-10-07)

Seed file: [vendor-scores-anthropic-google-2026-10-07.json](vendor-scores-anthropic-google-2026-10-07.json). Rules
are in [vendor-terms-2026-10-07.md](vendor-terms-2026-10-07.md): rule (b) covers a vendor's own scores for its own
models, and rule (a) covers CC BY pages. Nothing in `data/` was changed.

**133 results** (`by: "lab"`), **171 unmatched**, **53 skipped groups**, and **3 proposed ledger entries**.

- **first-party-anthropic-scores** (rule b): 107 rows.
- **first-party-google-scores** (rule b): 18 rows.
- **google-cloud-gemini-guides** (rule a, CC BY 4.0): 8 rows.

Every row passes these checks:

- Model and benchmark ids exist.
- No row repeats `model|bench|source` in `data/results.json`.
- Scores are fractions.
- Each source resolves through `lib/sources.ts` `sourceIn()` to its proposed entry, and the new entries move no existing row.
- Each typed value appears on the cited page or PDF page.

To import:

1. Add the three `ledger` entries to `data/sources.json` first. Import stamps `source_id` from the ledger.
2. Run `npm run import -- docs/research/vendor-scores-anthropic-google-2026-10-07.json`. Only `results` is read.
3. Run `npm run check`.

## Method

- Each page or PDF was fetched once (curl), rendered to text, and read by hand.
- Values were typed into JSON by hand. A script then checked each typed value against the cited page text.
- Only own-model cells were used. Other labs' columns, Mythos cells (no model id) and image or chart values are skipped.
- Cells the vendor credits to a third party are also skipped:
  - Cognition: FrontierCode.
  - Cursor: CursorBench.
  - Proximal: FrontierSWE.
  - Artificial Analysis: GDPval-AA, AA-Briefcase, Harvey LAB held-out.
  - Zapier: AutomationBench.
  - Vals AI, Surge leaderboards, ARC Prize and LMArena.
- **One measurement, one row.** 70 repeats of an identical figure across pages were collapsed. The copy kept is the model's own system or model card, or for Google the CC BY Cloud guide. Repeats with a different value are kept as separate rows; see the conflicts below.
- **PDF anchors.** `#page=N` is the physical PDF page.

## Counts per model (results / unmatched)

| Model | Results | Unmatched |
|---|---|---|
| claude-sonnet-5 | 18 | 14 |
| claude-fable-5 | 16 | 15 |
| claude-opus-5 | 15 | 30 |
| claude-opus-4-8 | 15 | 23 |
| claude-fable-5-1 | 12 | 23 |
| claude-opus-5-5 | 10 | 14 |
| claude-sonnet-5-5 | 10 | 12 |
| gemini-3-7-flash | 10 | 13 |
| claude-sonnet-4-6 | 8 | 0 |
| gemini-3-8-flash | 7 | 10 |
| gemini-3-6-flash | 6 | 10 |
| gemini-4-argon | 3 | 7 |
| claude-opus-4-7 | 2 | 0 |
| claude-opus-4-6 | 1 | 0 |

These 2026 Google models have nothing on the pages reviewed:

- gemini-3-1-pro, gemini-3-5-flash, gemini-3-5-flash-lite, gemini-3-1-flash-lite
- Gemma 4 (all sizes)
- Omni, Nano Banana, the TTS models, gemini-3-5-transcribe

Their own pages were not fetched in this pass. Gemma 4 already has CC BY report rows.

## Counts per source

| Source | Rows |
|---|---|
| Claude Opus 5 System Card (2026-07-24) | 23 |
| Claude Fable 5.1 & Mythos 5.1 System Card (2026-09-01) | 21 |
| Claude Sonnet 5 System Card (2026-06-30) | 19 |
| Claude Fable 5 & Mythos 5 System Card (2026-06-09) | 17 |
| Claude Opus 5.5 System Card (2026-09-22) | 14 |
| Claude Sonnet 5.5 System Card (2026-09-28) | 12 |
| anthropic.com/claude-sonnet-5-5 (Sonnet 5 Terminal-Bench 4.0 10.3%, only here) | 1 |
| deepmind.google Gemini 3.7 Flash model card (2026-08-13) | 11 |
| deepmind.google Gemini 3.8 Flash model card (2026-09-02) | 4 |
| deepmind.google/models/gemini/ (Argon table, undated) | 3 |
| Cloud guide, Gemini 3.8 Flash (CC BY, updated 2026-10-06) | 6 |
| Cloud guide, Gemini 3.7 Flash (CC BY, updated 2026-10-06) | 2 |

These pages were fetched, but every value was a duplicate, chart-only or third-party:

- The Opus 5.5, Fable 5.1, Opus 5, Sonnet 5 and Fable 5 announcements. Sonnet 5 and Fable 5 show their tables as images.
- platform.claude.com model pages, which have no scores.
- The blog.google Argon and 3.8 Flash posts.
- The Argon, 3.8 and 3.7 Flash evaluation PDFs and the model-card PDFs. Their tables are images, so they were used only for provenance and settings.

## Mapping decisions to review

- **SWE-bench Pro** goes to `swe-bench-pro-split-unspecified`, because no vendor states public or commercial.
- **HLE** maps to `hle` (no tools) and `hle-with-tools`. Anthropic runs the full 2,500-question set.
- **Chartography with tools** maps to `chartography-with-tools`. Anthropic changed its grader to Gemini 3.5 Flash in the Opus 5.5 card, so its values differ slightly from earlier cards.
- **Gemini 3.7/3.6 Flash "GDM-MRCR v2 (8-needle) 128k (average)"** maps to `mrcr-v2-8needle-128k`. This assumes the Gemma-report entry uses Google's same 128k-average metric.
- **BrowseComp** for Opus 4.8 and Fable 5 in the Opus 5 card maps to `browsecomp-context-managed`. The card states compaction for Opus 5; that the comparison runs used it too is inferred from the setup.
- **Moved to unmatched:**
  - Agent's Last Exam: Google's "ALE-Claw" harness could be either `agents-last-exam` or `ale-openclaw-overall-pass`.
  - MCP Atlas: Anthropic states neither the task set nor who ran it.
- **Ledger quirk:** `first-party-google-scores` uses `exact: false`. `sourceIn()` never matches an `exact` entry against a URL whose path ends in `/`, and the canonical deepmind.google URLs do. A one-line fix in `lib/sources.ts` would allow `exact: true`.

## Conflicts between pages (both kept, each with its own source)

- **Gemini Terminal-bench 2.1:**

  | Model | Values |
  |---|---|
  | 3.8 Flash | 90.8 (Cloud guide) vs 89.4 (card) |
  | 3.7 Flash | 85.8 (cards) vs 85.1 (3.7 guide) vs 81.6 (3.8 guide) |
  | 3.6 Flash | 78.0 (card) vs 73.0 (guide) |

- **Claude HLE:** later cards print slightly different values for earlier models after re-runs or grader changes.

  | Model | Earlier value | Later value |
  |---|---|---|
  | Opus 5, with tools | 64.7 | 63.6 |
  | Sonnet 5, with tools | 57.4 | 54.9 |
  | Fable 5.1, with tools | 65.0 | 65.6 |

- **Other small differences:** Sonnet 5 Global MMLU (89.0 vs 89.2) and Chartography re-grades.

## Notable unmatched benchmarks

These were vendor-run on public benchmarks, but the catalogue has no exact id. Each entry has a proposed definition.

- **OSWorld 2.0 / 2.1** (partial and strict, per task release): 22. The highest-value addition. Anthropic re-ran it on Sept 10, 2026 task files, and the Sonnet 5.5 page calls the same run "2.1".
- **BenchCAD Vision2Code** (1,000-file subset, voxel IoU, with or without tools): 15.
- **GDP.pdf** (Surge): 11.
- **Chartography without tools**: 9.
- **HealthBench Professional** (raw): 8.
- **ArXivMath** (vendor harness): 13.
  - August 2026 with tools is a near-match to `matharena-arxivmath-2026-08`, but uses a different harness and judge.
  - Opus 5's June set has 49 problems against the catalogue's 48.
- **ProgramBench** (pass rate; the catalogue only has Almost@1): 8.
- **OfficeQA / OfficeQA Pro**: 10.
- **Harvey Legal Agent Benchmark**, public set, Anthropic reimplementation: 5.
- **MILU**: 6.
- **SWE-bench Multimodal**: 7.
- **Terminal-Bench-Science 0.1**: 6.
- **HLE-Verified** (Google, full 1,811 items): 3.
- **LAB-Bench 2**: 4.
- **GraphWalks**: 6.
- **Google Cloud guide rows without settings:** "HLE" with no tool setting stated; "SWE-Atlas"; "CharXiv (Multimodal)", whose values equal the cards' CharXiv Reasoning, already recorded.
