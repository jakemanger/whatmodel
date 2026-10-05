# Data completion recovery — 5 October 2026

Recovered the interrupted research and re-fetched its 179 distinct source URLs (175 returned successfully).
Added **210 fields across 137 models**: 97 release months, 57 weights licences and 56 parameter counts.
The prior completion commit `adb2df9` already added 435 official repository links; it is not included in these counts.

Every accepted field has a source URL on the model. The accompanying JSON records evidence, retrieval date and a SHA-256 of the fetched source. Quotes with ellipses were checked as separate excerpts, not treated as continuous text. Parameter-count notes preserve whether the number covers the generator, backbone, or whole system; these appear under Model information sources on the website. These are model metadata facts, not new benchmark results or approval to reuse benchmark data under a weights licence.

## Remaining research

32 recovered proposals were not imported. They include private repository creation dates that do not establish a public release, ambiguous checkpoint identities, backbone-only figures, and evidence that still needs reconciliation with its cited page. The JSON records each proposed value and reason so another pass can continue without repeating the research. No unsupported dates, scores, CPU support or prices were filled to make the audit look complete.

The wider catalogue is **not complete**. Counts below are missing fields, not necessarily publicly available facts:

| Category | Release | Weights licence | Parameters | LLM context | API price | Official repo | Local option |
|---|---:|---:|---:|---:|---:|---:|---:|
| llm | 7 | 1 | 0 | 243 | 13 | 10 | 93 |
| image | 31 | 12 | 44 | 0 | 3 | 4 | 44 |
| video | 31 | 7 | 18 | 0 | 9 | 0 | 13 |
| tts | 21 | 12 | 52 | 0 | 4 | 0 | 19 |
| stt | 9 | 1 | 10 | 0 | 4 | 2 | 11 |

Run `node docs/research/completeness-audit.ts --list` for exact model ids. The saved earlier context-window and local-option drafts have not been imported: configuration limits are not necessarily supported context, and weight availability does not prove a working command/platform.

The user's decisions remain in force: retain all hardware pages, retain the OpenVoice official mirrors, and do not restore the Higgs V2 or dots.tts CPU options. The tts-bench score licence remains unresolved; its code licence alone does not approve score reuse.
