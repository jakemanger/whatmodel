# Frontier gap check: 7 October 2026

Machine-readable results: [`frontier-gap-2026-10-07.json`](frontier-gap-2026-10-07.json). It has 104 candidates, 25 `not_usable` entries and 51 `checked` entries. Nothing in `data/` was changed.

## Summary

The new data does not show Opus 5.5 as clearly better. Epoch has now published Claude Opus 5.5 on the tests that lift GPT-6 Astra: GPQA Diamond, FrontierMath (tiers 1–3 and 4), OTIS Mock AIME, SimpleQA Verified, MirrorCode and Mystery Game Puzzles. Opus 5.5 loses five of those seven to Astra, ties one and wins one. All 15 tests the two now share are below:

- Opus 5.5 wins 7.
- Astra wins 6.
- 2 are ties.

Most margins are within the published uncertainty. The clearer ones are:

- **Opus 5.5:** LMArena text (the 95% intervals do not overlap) and MirrorCode.
- **Astra:** GPQA Diamond, Mystery Game Puzzles and SimpleQA Verified.

An in-memory re-fit (no repo files written) used `lib/score.ts` with these candidates added. The gap widens rather than closes:

| Re-fit | GPT-6 Astra | Claude Opus 5.5 | Gap |
| --- | ---: | ---: | ---: |
| Current data | 83.6 | 83.2 | 0.4 |
| Candidates on existing benchmarks only | 83.6 | 82.7 | 0.9 |
| All candidates, new benchmarks stubbed as `acc` | 84.2 | 82.9 | 1.3 |

GPT-6.1 Sol rises to third (82.2–82.3) once its Epoch rows are added. These figures are rough: new sources and revisions are not yet in the ledger, so their evaluator keys are provisional.

### Candidates by source

| Source | Candidates | What |
| --- | ---: | --- |
| Epoch internal (`epoch-internal`, CC BY 4.0) | 48 | 43 new rows in approved files: 7 for Opus 5.5, plus GPT-6.1 Sol, Sonnet 5.5, GPT-6 Sol, GPT-6 Luna and Grok 4.7. 1 changed score (GPT-6 Luna Furniture 0.283 → 0.442, a new run replaced the old one). 4 rows from a new internal file, `frontiermath_erdos.csv`. |
| Terminal-Bench 4.0 official leaderboard (NEW source, Apache-2.0) | 18 | Maintainer-run submissions for 18 target models, including Opus 5.5 (0.6485, Claude Code, max). There is no GPT-6 Astra submission. |
| MathArena outputs (`matharena-arxiv-outputs-bysa`, CC BY-SA 4.0) | 17 | ArXivMath and BrokenArXiv August 2026, ArXivLean June 2026. All three are new benchmarks. |
| Roblox LLM Leaderboard (MIT) | 12 | Opus 5.5, Sonnet 5.5, GPT-6 Astra, Luna, Sol and 6.1 Sol, each on RobloxQA MC and Luau Leetcode. All at "Medium", the only setting listed. |
| Zapier AutomationBench README (NEW source, MIT) | 5 | Public 600-task set: Opus 5, Kimi K3, Fable 5, GPT-5.6 Sol and Terra. No Opus 5.5 or Astra. |
| LMArena dataset (CC BY 4.0) | 2 | Refreshes Fable 5 text and vision, still pinned to an older revision under an entry that has since been renamed. |
| Miðeind Icelandic (CC BY 4.0) | 2 | GPT-6.1 Sol and Sonnet 5.5. |

Sixteen GitHub-hosted ledger sources and fourteen other Hugging Face sources had nothing new. Each is listed in `checked`.

## Opus 5.5 vs GPT-6 Astra, every shared test

Rows marked "candidate" come from this pass; the rest are already in `results.json`.

| Test | Opus 5.5 | GPT-6 Astra | Winner | Status |
| --- | ---: | ---: | --- | --- |
| LMArena text (Elo) | 1503.7 (1494.6–1512.8) | 1477.1 (1470.2–1484.0) | Opus | existing |
| LMArena webdev (Elo) | 1815.4 (1799.3–1831.4) | 1787.7 (1777.4–1798.0) | Opus | existing |
| Arena agent IPS | 0.138 (0.116–0.160) | 0.123 (0.100–0.145) | Opus | existing |
| Epoch Furniture Assembly | 0.833 ± 0.047 | 0.800 ± 0.049 | Opus | existing |
| Miðeind Icelandic average | 0.709 | 0.703 | Opus | existing |
| Epoch EBR-bench | 0.714 ± 0.071 | 0.762 ± 0.084 | Astra | existing |
| GPQA Diamond (Epoch) | 0.906 ± 0.019 | 0.958 ± 0.014 | Astra | candidate |
| FrontierMath tiers 1–3 v2 (Epoch) | 0.912 ± 0.017 | 0.937 ± 0.014 | Astra | candidate |
| FrontierMath tier 4 v2 (Epoch) | 0.950 ± 0.041 | 0.976 ± 0.024 | Astra | candidate |
| SimpleQA Verified (Epoch) | 0.722 ± 0.014 | 0.756 ± 0.014 | Astra | candidate |
| Mystery Game Puzzles (Epoch) | 0.710 ± 0.046 | 0.840 ± 0.037 | Astra | candidate |
| MirrorCode (Epoch) | 0.774 ± 0.083 (max) | 0.467 ± 0.119 (high, the only Astra run) | Opus | candidate |
| OTIS Mock AIME (Epoch) | 1.000 | 1.000 | tie | candidate |
| RobloxQA v2 multiple choice | 0.9857 (2957/3000) | 0.9850 (2955/3000) | Opus (2 questions) | candidate |
| Luau Leetcode full pass | 0.870 (181/208) | 0.870 (181/208) | tie | candidate |

**Tally: Opus 7, Astra 6, ties 2.** Before this pass the tally was Opus 5, Astra 1.

Settings:

- Epoch: both models at `_max`, except Astra MirrorCode, which is `_high`.
- LMArena: Opus is `high` on text and agent and `max` on webdev; Astra is `max`.
- Miðeind: both at `high`.
- Roblox: both at `Medium`.

## Tests only one of them has

**Only GPT-6 Astra:**

- **Epoch Chess Puzzles:** Epoch has not run Opus 5.5. There is no `claude-opus-5-5_*` row in `chess_puzzles.csv`.
- **LMArena vision:** no Opus 5.5 entry in `vision_style_control`, although that split was published 2026-10-02. It has probably not reached the vote threshold yet.
- **LMArena document:** the split was last published 2026-09-13, before Opus 5.5 was released on 2026-09-22.
- **MathArena ArXivMath (April, May, June 2026) and BrokenArXiv April 2026:** existing rows.
- **Candidate new benchmarks:**
  - MathArena ArXivMath August 2026 (Astra 0.886).
  - BrokenArXiv August 2026 (0.819).
  - ArXivLean June 2026 (0.652).
  - Epoch FrontierMath-Erdos (0.029). Epoch ran it on only five models, all before Opus 5.5 existed.
  - MathArena's newest data is dated 2026-09-15, and its repo (`b89f2f0ad64c`, 2026-09-15) has no Opus 5.5 config.

**Only Claude Opus 5.5:**

- **Terminal-Bench 4.0 official leaderboard:** candidate, 0.6485 ± 0.031 (Claude Code, max). The leaderboard has no GPT-6 Astra submission and no pull request adding one.

## Missing because the source has not run Opus 5.5 yet

| Source | Missing for Opus 5.5 | Has Astra? |
| --- | --- | --- |
| Epoch internal | Chess Puzzles, FrontierMath-Erdos | yes |
| LMArena | vision, document and search splits (document last published 2026-09-13, search 2026-08-24) | vision and document |
| MathArena | everything: ArXivMath, BrokenArXiv and ArXivLean | yes |
| Zapier AutomationBench README | public-set table, last changed 2026-08-04 | no |

## Exists but not usable

These benchmarks have Opus 5.5 and/or Astra results, but not in a source we may use. Details are in `not_usable`.

- **Vendor material.** Anthropic's Opus 5.5 announcement and system card cover Terminal-Bench 4.0, FrontierCode, CursorBench, GDPval-AA, AutomationBench, HLE, Terminal-Bench-Science, OSWorld 2.1, Chartography and WANDR. OpenAI's Astra announcement covers FrontierMath Tier 4, GPQA, Terminal-Bench-Science, Terminal-Bench 4.0, OSWorld 2.0, ScreenSpot-Pro, DeepSWE and ExploitBench. Neither is open-licensed, so no numbers were recorded.
- **Artificial Analysis.** Both model pages list the same 17 evaluations, including AA-run SciCode, HLE, CritPt, GDP.pdf, MMMU-Pro, AA-LCR and AA-Omniscience. None has an open-licensed primary source with Opus 5.5 or Astra:
  - CritPt and the MMMU site repo have no licence.
  - HLE results are on lastexam.ai or under Scale's terms.
  - GDP.pdf (Surge), FrontierCode (Cognition) and CursorBench are vendor sites.
  - Terminal-Bench-Science's leaderboard is not in its Apache-2.0 repo.
- **Epoch `*_external.csv`.** These include APEX-Agents, ARC-AGI-2, CritPt, Vending-Bench 2, ProofBench, WeirdML v3 and others with both models. They keep upstream terms and the ledger excludes them.
- **MathArena AIME / HMMT / USAMO 2026 outputs.** Licensed CC BY-NC-SA 4.0 (non-commercial).

## Before importing

- **Ledger updates:**
  - Add `frontiermath_erdos.csv` to the `epoch-internal` fragments.
  - Add the new revisions to the `match` lists: Roblox `676755cd…`, Miðeind `7b12ee67…`, and MathArena `arxivmath-0826_outputs`, `brokenarxiv-0826_outputs` and `arxivlean-0626_outputs`.
  - Add two new entries: `terminal-bench-leaderboard-submissions` (harbor-framework/terminal-bench, Apache-2.0, commit `8d0eb80a…`) and `zapier-automationbench-readme` (zapier/AutomationBench, MIT, commit `4a8e1061…`).
- **New benchmarks:** `matharena-arxivmath-2026-08`, `matharena-brokenarxiv-2026-08`, `matharena-arxivlean-2026-06`, `frontiermath-erdos` and `automationbench-public-zapier`.
  - The August MathArena sets use a new protocol: agent harness with shell, Python and Sage, an LLM answer judge, and a Gemini 3.8 Flash BrokenArXiv judge. The existing "plain prompt, no tools" family description does not fit them.
  - Fable 5.1 ran these sets with the `high` config only.
  - The ArXivLean Opus 5 and Fable 5 configs (`*_max_128`) are not in the public MathArena repo, so their identity rests on the published model name.
- **Terminal-Bench 4.0** rows are independent, maintainer-run results on the existing `terminal-bench-4` benchmark. The current rows there are DeepSeek lab numbers. The agent harness differs by model (Claude Code, Codex, mini-SWE-agent and others), as the benchmark description already allows.
- **FrontierMath-Erdos** is nearly all zeros (5 models) and adds little. It is included only for completeness.
