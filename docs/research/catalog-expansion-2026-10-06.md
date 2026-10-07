# Catalogue expansion and task rankings — 6 October 2026

## Outcome

Resumed Claude session `0b476787-03f2-40f7-90d6-64a8940265a9` using `lsa show`. Reviewed its unfinished historical-model proposals rather than treating scratch output as accepted data. The owner selected verified measurements only; no benchmark scores were estimated.

The initial tranche grew the catalogue from 1,251 to 1,282 models. All 31 additions have a computed score. Results grew from 9,436 to 9,782 (346 net additions), with 872 existing Arena observations refreshed in place. That tranche produced 684 benchmark definitions and 613 source records. Nine additional model/task pairs and 47 Agent Arena observations were found in a second completeness pass.

The subsequent [missing-results follow-up](missing-results-followup-2026-10-06.md) added another 276 measurements and three exact comparison models. Current totals are **1,285 models, 10,058 results, 724 benchmark definitions and 620 sources**. **1,222 models have scores** within a connected comparison group; **63 remain unscored: 42 have no measurements and 21 have raw measurements that cannot yet be calibrated**. The initial tranche left 76 gaps (55 without measurements and 21 raw-only); the follow-up closed 13. Separate comparison groups must not be ranked against the main scale. See [the complete current per-model audit](score-coverage-2026-10-06.json).

The initial tranche grew the main LLM comparison group from 584 to 662 models: 30 new LLM identities plus 48 historical identities connected through the reviewed Mixtral, Mistral, Gemma and Tulu 2 evaluations. The follow-up increased it to 671 models. These bridges reduce disconnected coverage; they do not guarantee that sparsely overlapping generations are perfectly calibrated.

## Added models and refreshed evidence

- Recent frontier releases: Gemini 4 Argon (limited preview), GPT-6.1 Sol, Claude Sonnet 5.5.
- Additional Arena identities: Step 5 Preview, Dola Seed 2.0 Pro, GPT-5.3 Chat and GPT-5 Chat tied to the October 2 snapshot, Mercury, Mercury 2, GLM-4-Plus (0111), Hunyuan Turbo (0110), Step 2 16K Experimental (2024-12), Step 1o Turbo (2025-06), Step 1o Vision 32K High Resolution, Hunyuan Standard 256K, six dated Amazon Nova Experimental Chat entries, and Ideogram 4.5.
- Historical releases: Tulu 2 7B/13B/70B, Tulu 2 DPO 7B/13B, Code Tulu 2 7B/13B/34B, and Xwin-LM 70B v0.1.

Gemini 4 Argon is a comparison model with verified Arena measurements. Google's announcement still describes limited trusted-tester access, so no generally available API or local download was invented. Official API specifications and prices for GPT-6.1 Sol and Claude Sonnet 5.5 were reviewed separately under the existing first-party-facts policy. Other comparison-only identities retain unknown run options and unknown prices.

Arena dataset revision: `46919c467f7f93d9609b668a283bcd20d87c28bc`, CC BY 4.0. The exact selected model names, reasoning settings, publication dates, vote/session counts and published intervals are retained in result notes. Refreshes replace an earlier observation for the same model/task; snapshots are not averaged as independent experiments. Two old Fable 5 task entries absent under their earlier names were retained.

Paper evidence is limited to original experiments in openly licensed documents:

- [Mixtral of Experts, v1](https://arxiv.org/abs/2401.04088v1), Table 2: 72 measurements across six original base-model evaluations.
- [Mistral 7B, v1](https://arxiv.org/abs/2310.06825v1), Table 2: 12 Code Llama base measurements; existing source scope extended explicitly.
- [Gemma, v4](https://arxiv.org/abs/2403.08295v4), Table 6: 43 measurements from the authors' Gemma runs and explicitly starred Mistral reruns. Copied Llama and unstarred Mistral rows excluded.
- [Tulu 2, v2](https://arxiv.org/abs/2311.10702v2), Tables 1, 5 and 6: 130 original measurements on five precisely identified protocols. Repeated cells, QLoRA variants, external leaderboard copies and unsupported safety metrics excluded.

Exact source scopes, licence notices and transformations are in `data/sources.json`. The [import manifest](catalog-expansion-manifest-2026-10-06.json) records model IDs, evidence hashes and the explicit agent identity mapping.

## Historical leaderboard review

[Arena's downloadable dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) has both `full` and `latest` splits. The reviewed full text history starts on 2023-05-08; style-controlled history starts on 2024-08-28. Each contains 434 distinct overall-entry names in this revision. Twenty-one names are absent from the current style-controlled snapshot; many are earlier settings or mutable aliases of already catalogued models. Historical ratings also cross methodology changes. These are not 21 automatically missing model releases, nor independent extra measurements to stack onto current ratings.

[HELM](https://crfm.stanford.edu/2022/11/17/helm.html) and [AlpacaEval](https://github.com/tatsu-lab/alpaca_eval) are useful historical discovery sources. Their exact API versions, evaluation protocols and permissions for the numerical artifact must be checked. AlpacaEval's code is Apache 2.0, but its [hosted dataset](https://huggingface.co/datasets/tatsu-lab/alpaca_eval) declares CC BY-NC 4.0; the code licence does not establish commercial reuse permission for that data, so it was held. No claim is made that the remaining pre-Arena models were recovered merely by finding these archives.

## Fable 5.1 versus Opus 5.5

A completeness bug in the refresh approach was found: updating only existing model/task pairs omitted newly available pairs. This pass added Opus 5.5 text, GPT-6 Sol/Luna text, Grok 4.7 text, DeepSeek V4.1 Flash text, MiMo V2.6 Pro text/vision, and Gemini 3.7/3.8 Flash vision.

Arena Agent is a different measurement from Arena's chat or WebDev ratings. It reports signed inverse-propensity-weighted net improvement, not Elo or accuracy. The October 2 aggregate puts Fable 5.1 (Max) at 0.143104, 95% interval [0.124152, 0.162056], and Opus 5.5 (High) at 0.138170, interval [0.116455, 0.159885]. The intervals overlap substantially; this is not evidence of a decisive winner. Different published reasoning settings are visible in the source notes.

All 47 matched models' aggregate IPS measurements were imported once. The five constituent signals and lower-effort duplicates were excluded. Raw signed values are preserved with a new linear metric type; fitting converts a fixed 0.1 IPS into one latent unit. This does not mislabel negative effects as impossible accuracies or disguise them as Elo.

After both import tranches, overall scores are Opus 5.5 **83.19 ± 1.09** (6 cells) and Fable 5.1 **81.16 ± 0.68** (21 cells). The previous gap was 86.01 versus 80.82. The **agent task** ordering instead puts Fable 5.1 ahead, matching their shared Arena Agent evidence; both have only one calibrated agent observation and are marked thin. The overall ordering remains Opus above Fable when separately omitting Epoch, Arena, MathArena, or Miðeind. Varying the IPS unit conversion from 0.05 to 0.2 also preserves that ordering. These checks do not turn the model's ± into a validated confidence interval or make the two models' benchmark coverage equal.

Gemini 4 Argon's overall score is **78.28 ± 1.30**, based on three Arena tasks. GPT-6.1 Sol and Sonnet 5.5 have four Arena tasks each. Removing Arena leaves these three models without calibrated evidence. Additional independent exact-model measurements remain valuable; their ranking should not be presented as broadly corroborated.

See [the reproducible ranking audit output](frontier-ranking-audit-2026-10-06.json) for source contributions, task scores, matched raw observations, source omissions and IPS scale sensitivity. No weights or evidence were selected to force agreement with another leaderboard.

## Following public references

The owner supplied [Artificial Analysis's Argon page](https://artificialanalysis.ai/models/gemini-4-argon) as a reference-discovery route. No Artificial Analysis scores or prices were imported. Traced examples:

| Referenced evaluation | Primary document checked | Outcome |
| --- | --- | --- |
| Terminal-Bench 4.0 | [Terminal-Bench paper](https://arxiv.org/abs/2601.11868v1) | The linked paper evaluates Terminal-Bench 2.0, not AA's newer v4 runs. Its original neutral-harness rows are already imported. |
| SciCode | [Original paper](https://arxiv.org/abs/2407.13168v1) | CC BY 4.0, July 2024 experiments; cannot supply September 2026 Argon/Fable/Opus results. Official SciCode main-problem evidence is already represented in the catalogue. |
| Humanity's Last Exam | [v11 paper](https://arxiv.org/abs/2501.14249v11) | Explicit model-version table covers older models; does not establish the newest models' AA results. Text-only and multimodal protocols must remain distinct. |
| CritPt | [v4 paper](https://arxiv.org/abs/2509.26574v4) | arXiv non-exclusive-distribution licence, not an explicit open commercial-reuse licence for these numerical tables; held. |
| Gemini 4 Argon evaluations | [Google's evaluation report](https://deepmind.google/models/evals-methodology/gemini-4-argon) | Found the five-page primary report. It distinguishes Google's own runs from copied provider/leaderboard numbers and documents several materially different harnesses. No explicit open reuse licence established for the report, so its numerical table was not imported. |

This is a targeted frontier/reference audit, not a claim that every external page for all 1,285 models has been exhausted. An open benchmark definition does not establish an independent later result or license a different evaluator's run. The follow-up reviewed all 76 initially unscored identities. Future work should prioritize the 63 remaining explicit evidence gaps and additional independent Argon/Sol/Sonnet results.

## Task filters and search pages

Fourteen explicit tasks now cover agents, coding, chat/writing, math, vision/documents, web search, text-to-image, image-to-image/editing, text-to-video, image-to-video, video editing, voice cloning, long-form transcription and multilingual transcription. General text-to-speech and speech-to-text remain available as category-wide rankings.

`data/tasks.json` assigns reviewed benchmark protocols to tasks. Task scores are fitted only on those evaluations, with disconnected sets retained separately. Source icons use the task-specific fit. Hardware, price, sort, comparison-set and catalogue filters combine with task selection. Browser state, shared URLs and JSON/text APIs preserve the task.

There are 168 new finite task/search profiles, in addition to the 327 existing profiles. Example: `/image/for/text-to-image-16gb-apple-silicon-local`. These have pre-rendered filtered rows, task-specific titles/descriptions/canonicals and social images, plus sitemap and browse links. Empty combinations remain usable but are excluded from the sitemap and marked noindex. Other machine combinations work as URL filters without creating unlimited indexed pages.

Memory remains estimated and local commands are the catalogue's verified run options. A task measurement does not claim that every quantized local variant was itself benchmarked, or that full advertised context fits in the selected RAM.

## Validation

Local validation after both import tranches:

- All 49 unit tests passed, including task-only scoring, task/hardware combinations, shared URLs and APIs, signed linear-metric round trips, and lower-is-better raw distances.
- ESLint, TypeScript checks and data validation passed. The 17 existing missing-provider-logo notices are non-blocking; the three newly introduced makers have logos.
- The full leave-one-out data check completed successfully. Main-group latent correlations were 0.935 for LLMs, 0.934 for images, 0.933 for video and 0.813 for speech recognition. TTS has a known weak overall correlation (0.009; 0.656 excluding floor-weight series), so this check does not establish equally strong calibration across all categories.
- The production build generated 5,392 routes. Static checks verified exact model rows, canonical URLs, headings and sitemap entries for all 496 filter pages, plus three editable content pages.
- Browser verification covered the 16 GB Apple Silicon text-to-image page, switching to image editing while preserving hardware and local-only filters, and browser Back navigation.
- The agent page visibly includes Fable 5.1, Opus 5.5 and the catalogue-only Argon preview with task scores. No browser console errors were observed. Running `node scripts/audit-frontier.ts --json <output>` reproduced the saved frontier audit byte for byte.
- Follow-up browser checks verified the new Maya1 score and source, Kandinsky 2.1's original 8.21 FID units and lower-is-better direction, and the 16 GB Apple Silicon text-to-image page.

No push, PR, release or GitHub Actions run was triggered. These checks validate the implementation and internal consistency; they do not replace independent measurements for the remaining unscored models.
