Visual evidence handoff — 2026-09-25

The prior 310/326-row file was an unreviewed candidate set. It is superseded. Integrate only the two ready artifacts below; do not merge the old draft or quarantine.

| Artifact | Status | Content |
|---|---|---|
| `visual.json` | Ready seed | 113 results, 64 measured models, 28 proposed model additions, 15 benchmark tracks, 11 sources, 26 evaluator/protocol groups |
| `visual-cc-by-sa.json` | Ready separate adapted tranche | 4 LLaDA own-model results, 2 model additions, 2 evaluator/protocol groups; expressly licensed CC-BY-SA-4.0 |
| `visual-quarantine.json` | Do not integrate or publish as a licensed dataset | 210 candidate results with row-specific blockers; former `by` claims retracted |
| `visual-draft-unreviewed.json` | Superseded research input | Original 326 candidates; never an integration artifact |
| `visual-source-groups.json` | Integration metadata | 28 groups across both ready artifacts |
| `visual-NOTICES.txt`, `visual-cc-by-sa-NOTICES.txt` | Redistribution notices | Full licence text, attribution, source links and extraction/change notices |
| `visual-validation.json` | Validation summary | Counts, source/benchmark breakdowns and SHA-256 hashes |

There are 117 ready measurements in total. `by: lab` is used only for a model evaluated by its own authors. An author’s comparison table is not enough to establish rerunning, original ownership, or permission for copied baselines. No Artificial Analysis values or Arena-derived numbers are included in these ready artifacts.

Integration instructions

- Merge by model/source/benchmark ID without losing `source_id`, `source_group`, `evaluator`, `evidence`, date basis, licensing or setup details. Existing and proposed model identities must not be replaced by a nearby release/tier.
- Each `source_group` is one evaluator and protocol for one metric. Keep the group intact when comparing its retained models. Do not pool rows from different source groups as though they were one evaluation, choose best scores across sources, or split the Qwen group into unrelated studies merely because own-model rows have a different `by` label.
- The Qwen benchmark has 16 resolved models from its original 18-model study. Qwen’s 3 own models are `lab`; other providers are `independent` of the evaluated model’s author, all measured by the same Alibaba/Qwen evaluator. This does not assert institutional neutrality. Q-Judger is Qwen3.6-27B, original report v1; it is not a human preference ranking or the later EN/CN tracks.
- Language and short/long tracks share `benchmark_family`; do not count related tracks as separate independent studies. GenEval and DPG share a metric across sources but may have differing generation recipes.
- Publish the complete `visual-cc-by-sa.json` separately under CC-BY-SA-4.0 alongside `visual-cc-by-sa-NOTICES.txt`. Keep its attribution, upstream report/version, licence link and modification notice. API rows using that tranche should carry `data_license`, a **public** `licensed_artifact` URL, source and attribution. The methodology should link the public tranche and licence. The local filename currently in `licensed_artifact` must be replaced with that public URL during integration. Further adaptations of these rows must retain a compatible ShareAlike licence. These files prepare the compliant tranche; they do not claim the site's API/publication changes have already happened.
- Retain full applicable notices for the primary ready seed too. Repository licences are used only for measurements actually printed in their accompanying documentation and produced by those authors, not as permission for an external website database or third-party model media.

Provenance review

| Source | Ready rows | Decision |
|---|---:|---|
| Mage-Flow report v2, CC-BY-4.0 | 27 | Only Mage-Flow-Base, Mage-Flow and Mage-Flow-Turbo, which the authors explicitly evaluate. 198 baseline rows quarantined. |
| GenEval original repository, MIT | 4 | Benchmark creators’ original README evaluation of SD1.5, SD2.1, SDXL and IF-XL. |
| HiDream repository, MIT | 2 | HiDream-O1-Image own GenEval/DPG rows only; no external rankings. |
| GLM-Image repository, Apache-2.0 | 6 | GLM's own DPG/text-generation measurements. SDXL comparison quarantined; TIIF omitted because the split is not explicit. |
| ERNIE-Image model repository, Apache-2.0 | 4 | Own base/Turbo results without prompt enhancement; competing-model rows not imported. |
| Qwen-Image-Bench report v1, CC-BY-4.0 | 16 | Section 4.2 explicitly states images were generated for every model on all 1,000 prompts and evaluated by the same judge. |
| HumanScore report v1, CC-BY-4.0 | 12 | Original benchmark-author T2V motion evaluations. Unqualified Wan2.2 variant excluded. |
| Rapidata physics dataset card, CC-BY-4.0 | 20 | Original human judgments; pinned published **with-reference** Elo and CI, not blind ranking or external live leaderboard. |
| Rapidata camera dataset card, CC-BY-4.0 | 8 | Original human movement judgments; pinned published Elo, with generation exceptions. |
| Physics-IQ Verified report v1, CC-BY-4.0 | 6 | Original experiment; verified GT + verified metric + best-practice prompts; four runs, standard deviations retained. |
| VGI-Bench report v3, CC-BY-4.0 | 8 | Original I2V evaluation, fixed half-instance sample. Appendix explicitly resolves Wan2.2-I2V-A14B. MiniMax row quarantined for a conflicting deployment label. |
| LLaDA-Image report v1, CC-BY-SA-4.0 | 4, separate tranche | Only own base/Turbo GenEval/DPG rows. Two Qwen comparison rows remain quarantined for provenance, not because ShareAlike is disallowed. |

Remaining model/setup ambiguities

- Hosted results identify the named release/tier, not an undisclosed API snapshot. Model publication dates and dataset retrieval dates are not fabricated run timestamps. Full checkpoint hashes are usually unavailable.
- Physics-IQ Verified calls Sora 2 `v2025-10` in Section 4 while discussing April-2026 versus October-2025 performance. The main Table 4 score is preserved under generic Sora 2 with this ambiguity attached; no stable snapshot is inferred.
- HunyuanVideo 1.5 I2V remains distinct from T2V. Its 480p/720p **output resolution** does not prove a distinct checkpoint, so no resolution-derived model identity is invented.
- VGI MiniMax-H3 is grouped as commercial in the results but open source in the configuration appendix. That row is quarantined. VGI Wan2.2 is retained because Appendix B.1 explicitly says I2V-A14B; the earlier proposed exclusion of that row was corrected.
- Kling 3.0 and Kling 3.0 Pro are distinct; Vidu Q3 and Q3 Pro are distinct. Rapidata’s `Kling V3 Pro` and `Gemini Omni Flash 1.1` labels are normalized to those exact version/tier identities, not earlier releases.
- Qwen-Image-Bench's Nano Banana 2.0 and unspecified Seedream 5.0 tier were not silently mapped to nearby existing models. HiDream-O1 base is not Dev/Pro. FLUX base and distilled variants were never merged; their copied scores are now quarantined anyway.
- Rapidata camera: Veo3.1 uses 6 seconds; MiniMax H3 uses an upscaled 2K tier; Gemini Omni Flash1.1 crops/pads some stills. The general 1080p/5-second statement does not override those exceptions. Rapidata physics card has a comparison-count discrepancy with its dataset viewer; only pinned card scores are used.
- VGI primary results cover the full video task taxonomy on a **fixed half of instances**, not the entire instance pool; Gemini-3-Flash judges the outputs. I2V scores are never treated as T2V.
- HumanScore filters its motion set using candidate generators and does not fully report every model's resolution/sampler/API snapshot. Its 102 motion prompts measure biomechanics, not general video preference.
- HiDream/GLM/LLaDA do not fully specify prompt enhancement, CFG and seeds for every benchmark table. Usage-example defaults are not promoted to measured settings. ERNIE rows explicitly use no prompt enhancement.

Unfinished recovery and expansion

- **VBench recovery is not complete.** All 8 recovered candidates from ERNIE5, MobileWan and Turbo2K secondary comparison tables are quarantined. Their report licences alone cannot establish permission for the original VBench measurements. The HF Space's code licence does not license the separate private results database. None of these is in the ready seed.
- The original `wan-2-1-14b = 0.8622` row points to a Wan API (`wanx2.1-t2v-plus`), not verified open-weight T2V-14B. Do not restore that mapping. HunyuanVideo/Mochi secondary values were explicitly labelled VBench-Long; do not relabel them as standard VBench. LTX-Video is not LTX-2.
- Most archived GenEval/DPG rows remain unrecovered under the stricter direct-measurement requirement. Priority is original benchmark-author result files or provider-owned licensed own-model tables for SD3.5, HiDream-I1, FLUX1/2, Qwen, Seedream and other historical releases. FLUX.1 schnell 0.71 remains unsupported by a suitable verified primary licence/provenance chain.
- Additional useful own-model measurements exist in already licensed reports/cards (for example ERNIE Chinese/long-text and LLaDA's later bilingual tracks), but were not mixed into the frozen seed without a separate protocol check. Overall coverage is improved by new independent studies, but that does not mean every archived score has been recovered.

Validation and reproducibility

`visual-evidence/finalize_visual.py` deterministically produces both ready tranches and quarantine from the superseded candidate set. It verifies exact decimal conversions, uniqueness, group consistency, author-only lab classification and the complete partition. `build_visual.py` now writes only `visual-draft-unreviewed.json`, so rerunning candidate extraction cannot overwrite the reviewed seed.

Six pinned repository/dataset READMEs were re-fetched and matched byte-for-byte; see `visual-evidence/pinned-readme-verification.json`. Sources include full licence notices, observed licence URLs, pinned report versions or repository revisions, saved evidence paths, and original-measurement evidence. Original value strings/divisors remain on each row. No values were estimated or newly benchmarked.

Only files under `/tmp/whatmodel-expansion` were changed for this handoff. No shared data/app edits, pushes or workflows were performed. Public/API integration remains the main agent's responsibility.

Frozen import packaging

`visual-source-match-manifest.json` is the authoritative import map. All 12 source entries now set `exact: true`, use scheme-free normalized host + case-sensitive pinned file path, and have ledger-compatible `kind` values. All 117 result URLs match exactly one source after ignoring table fragments. No whole-host, repository-root, unversioned arXiv or descendant-path permission is granted.

Copy each file under `/tmp/whatmodel-expansion/visual-licenses/` to the manifest's `public/licenses/<source-id>.txt` destination. Each source already has the matching `/licenses/<source-id>.txt` value in `license_url`, plus its local `notice_copy` path. Copies include full legal text, attribution, upstream link, scope and changes; LLaDA includes the ShareAlike redistribution requirement. Main still publishes the adapted ShareAlike JSON separately and replaces its local `licensed_artifact` reference with a public URL.

Final SHA-256:

- `visual.json`: `915e7352feeab6f1539751518dbde72bb9999855b6d9d2e8812fe1a3a6b660f9`
- `visual-cc-by-sa.json`: `1920c9b20bdcc3de1b1cbd63d48ab715a2758de569ce7f4511953f63e3e41c52`

Both tranches are frozen for import. New model records contain identity fields and identity evidence only; no fabricated RAM, VRAM, commands or runtime options.
