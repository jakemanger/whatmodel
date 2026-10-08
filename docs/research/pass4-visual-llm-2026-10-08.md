# Thin image, video and LLM models, fourth pass, 2026-10-08

Machine-readable output: `pass4-visual-llm-2026-10-08.json` (`results`, `benchmarks`, `ledger`, `models`,
`gaps`, `checked`, plus `held_for_owner`). Nothing in `data/` was edited. Merge order: ledger entries first
(strip `action`/`evidence_url`/`scope`; entries with `add_match` only extend an existing entry), then `models`,
then `benchmarks` (drop `suggested_tasks`, add each id to its task in `data/tasks.json`), then `results` through
`scripts/import.ts`. `held_for_owner` is deliberately outside those keys.

Input: the 115 runnable models in `pass4-visual-llm-input.json`. Pass 3's 53 sources and the listed dead ends were
skipped.

## Outcome

- 471 result rows (412 independent, 59 lab) in 18 evaluator entries (17 new, 1 existing), 21 new benchmarks, 7 proposed comparison-only
  models, 18 ledger items (17 new, 1 scope extension).
- Merged into a scratch copy (import, ledger, tasks), `scripts/check.ts --validate-only` passes: 1,310 models,
  13,281 results, 822 benchmarks, 749 sources. The full `check.ts` was not run. The live tree changed under me
  during the session (other lanes edit `data/`), and every merge re-copied it.
- `toCells` on that copy: **15 thin models reach 3+ counted results** and 3 more gain (before to after):
  - LLM: eurus-2-7b-prime 1 to 4, llama-3-1-nemotron-51b 1 to 6, k2-horizon-7b 0 to 12, falcon-180b-chat 1 to 3,
    qwq-plus 1 to 3, aya-vision-32b 1 to 3, exaone-3-5-2-4b 2 to 6, stablelm-tuned-alpha-7b 2 to 3,
    qwen3-max-preview 2 to 3 (snowflake-arctic-instruct 4 to 7, already above 3).
  - Image: show-o2-7b 1 to 4, blip3o-8b 2 to 3, cosmos3-super-text2image 2 to 5.
  - Video: cosmos-1-0-diffusion-7b-text2world 1 to 3, wan-2-1-1-3b 2 to 3, t2v-turbo-vc2 2 to 3.
  - Gained but still below 3: bloom 1 to 2, ling-flash-2-0 1 to 2.
- 96 of the 115 stay below 3. `gaps` gives the reason for each. Mage-Flow, Mage-Flow-Base and Mage-Flow-Turbo
  already count 9; they are an input-listing artefact.

## Rows per source (evaluator id)

| Source | Basis | Rows |
|---|---|---:|
| `paper-2503.16167v2-codereviewqa` (CodeReviewQA, 4 benchmarks, 48 models) | CC BY 4.0 | 192 |
| `vectara-hhem-readme-apache` (3 README snapshots, 3 benchmarks) | Apache-2.0 | 97 |
| `paper-2605.01417v1-medmarks` (Medmarks-V win rate) | CC BY 4.0 | 31 |
| `paper-2404.16164v1-factrecall` (Premium2k EM, 0- and 10-shot) | CC BY 4.0 | 28 |
| `first-party-ifm-k2-horizon-scores` (K2-Horizon 3.7B and 7B, released checkpoint) | vendor card | 24 |
| `visual-cosmos3-report` (existing entry, 3 more columns of Table 11) | CC BY 4.0 | 18 |
| `paper-2505.22113v1-thinkbench` | CC BY 4.0 | 16 |
| `paper-2411.19146v5-puzzle` (Nemotron-51B vs Llama-3.1-70B-Instruct) | CC BY 4.0 | 10 |
| `paper-2410.14897v1-gencopa` (COPA 4-shot) | CC BY 4.0 | 9 |
| `paper-2508.13680v5-vmmu`, `paper-2501.03575v3-cosmos` | CC BY 4.0 | 8 + 8 |
| `first-party-prime-rl-scores` (Eurus-2-7B-PRIME card) | vendor card | 6 |
| `paper-2504.07072v2-kaleidoscope` | CC BY 4.0 | 6 |
| `paper-2604.25072v1-xtcbench`, `paper-2306.02561v3-llmblender` | CC BY 4.0 | 5 + 5 |
| `first-party-showlab-show-o2-paper`, `first-party-alibaba-wan-paper` | vendor-reported (default arXiv licence) | 4 + 2 |
| `paper-2405.18750v2-t2vturbo` | CC BY 4.0 | 2 |

## Proposed comparison-only models

eurus-2-7b-sft, t2v-turbo-ms, show-o2-1-5b, k2-horizon-3-7b, and three NVIDIA Cosmos siblings
(cosmos-1-0-diffusion-7b-video2world, cosmos-1-0-autoregressive-4b, cosmos-1-0-autoregressive-5b-video2world).
Each has Hugging Face sha, licence and an identity quote in `models`.

## Open decisions

1. **Vendor reports with arXiv's default licence.** The Show-o2 paper (4 rows) and the Wan report (2 rows) are
   recorded as the maker's own figures for its own models under the vendor-reported rule. If only cards and
   announcements count, drop `first-party-showlab-show-o2-paper` and `first-party-alibaba-wan-paper`. That costs
   show-o2-7b 4 to 2 and wan-2-1-1-3b 3 to 2.
2. **K2-Horizon-7B checkpoint changed.** IFM promoted an anti-doom-loop (FTPO) checkpoint to main on 2026-10-01.
   The existing rows (pinned @036114c) match the card's "7B before" column, not the released checkpoint. The new
   rows use the "after" columns at @3b6ae39. Consider dropping the old rows.
3. **Held, not in `results`: Polyrating** (arXiv 2409.00696v3, CC BY, 82 mapped rows). It is a bias-aware re-fit of
   the same Arena votes as `lmarena-text`. It would lift dolphin-2-2-1-mistral-7b, gpt4all-13b-snoozy and
   fastchat-t5-3b to 3. The same argument kept Arena-Hard's style-control table out in pass 3.
4. **Rapidata sub-leaderboards not added.** Alignment, Preference and Coherence Elo columns would take
   ideogram-4, p-image and recraft-v4-1-utility-pro above 3. The existing benchmark definition says not to import
   them, so I left them out.
5. **Cosmos3-Nano** is catalogued as a video model, so its text-to-image rows from Table 11 were rejected by the
   image/video check and omitted.
6. **Scales.** `medmarks-v-mean-win-rate` (linear, latent_scale 0.08 = SD of the 71 published win rates) and
   `llm-blender-mixinstruct-gpt-rank` (mean rank, lower better) are pool-relative. `cosmos-3d-sampson-error` and
   `hpsv3-cosmos3` are linear raw units. Please review these `latent_scale` choices.
7. **Identity limits.** HHEM mappings use exact Hugging Face repos or API ids. Medmarks omits quantised rows, reasoning
   efforts other than "med" and Qwen3 rows without a stated 2507 revision. The Show-o2 paper's 1.5B is the base
   checkpoint, not the HQ one.

## Sources checked and not used

See `checked` in the JSON for each outcome. Main dead ends:

- Krea 2 technical report and card (no numbers).
- Kandinsky 5 README (timings only).
- LTX-2 and LTX-Video papers (the human survey needs Pyramid Flow and Open-Sora Plan checkpoints that are not
  stated).
- VC-Bench (models adapted by the authors).
- VideoASMR-Bench (detector fooling, not quality).
- MultiBind (per-dimension rates only).
- Qwen-Image-2.0 report (VAE tables only).
- HRMCR (Korean multi-step reasoning, near-zero for small models).
- Nova 2 technical report (404).
- Can-AI-Code (raw per-model files).
- GitHub code search for Arena copies.
- Semantic Scholar snippet search (rate-limited).

Scan coverage: about 2,400 and 1,700 CC BY/BY-SA cs.CV papers (2025-09 to 2026-10-07, and 2023-06 to 2025-08),
and about 4,500 cs.CL papers (2024-03 onwards, filtered by abstract), licences read from arXiv's OAI metadata,
tables matched to catalogue names exactly.
