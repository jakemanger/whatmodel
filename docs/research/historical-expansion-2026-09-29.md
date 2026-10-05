# Historical and cross-domain catalogue expansion, 29 September 2026

This local research batch adds **55 catalogue entries and 76 published benchmark observations**. The catalogue now contains **1,242 models and 9,078 observations**. There are seven new registered numerical sources and nine new benchmark definitions. No remote repository, workflow or deployment was changed.

Counts are relative to the local snapshot taken at `2026-09-29T13:31:30.729Z`, rather than the older provenance report's unavailable Git baseline. The [machine-readable manifest](historical-expansion-2026-09-29.json) records every new model ID and observation key, source registrations, evidence hashes and before/after counts.

| Domain | Added models | Added observations | Catalogue total | Observation total |
| --- | ---: | ---: | ---: | ---: |
| Text | 0 | 0 | 659 | 6,937 |
| Image | 8 | 6 | 171 | 478 |
| Video | 9 | 32 | 119 | 341 |
| Text to speech | 25 | 12 | 150 | 644 |
| Speech recognition | 13 | 26 | 143 | 678 |
| **Total** | **55** | **76** | **1,242** | **9,078** |

## Early models and visibility

GPT-1 was already in the catalogue but lacked reviewed comparable benchmark observations. Previously that could exclude it from both the list and generated model pages. All catalogue entries now have model pages; runnable entries without benchmark evidence appear in the list with an explicit “no reviewed results” label and no numerical score or rank. Entries without a verified run option remain accessible through the catalogue-only control and model links. Selecting a comparison set still filters to that set's actual members.

Stable Diffusion 1.5 now links to the available community mirror, clearly identified as unaffiliated with the original Runway team. Its documented CUDA and Apple Silicon options were added, along with Apple Silicon options for Stable Diffusion 1.1–1.4. The [official Diffusers MPS guide](https://huggingface.co/docs/diffusers/optimization/mps) uses this SD 1.5 mirror. This batch did not verify a replacement official SD 2.1 download.

New image entries cover AttnGAN, X-LXMERT, the DALL·E Mega checkpoint through min-dalle, FuseDream, LAFITE and Kandinsky 2.1, 2.2 and 3. Video additions include the original CogVideo, AnimateDiff's v1.5.2 motion adapter, Stable Video Diffusion and XT, VideoCrafter1, Show-1, ZeroScope XL, and dated historical Floor33 and PikaLab systems. Speech additions include VITS, Tacotron2, Glow-TTS, FastSpeech, FastPitch, Grad-TTS, LightSpeech, PriorGrad, Jasper, QuartzNet and specific ESPnet recipes, plus multilingual Coqui registry checkpoints and SpeechBrain FastSpeech2.

These entries distinguish model checkpoints, full acoustic-model/vocoder pipelines, adapter versions and evaluated training recipes. Their identities are not interchangeable with newer products or similarly named implementations.

## Numerical evidence

All imported numbers are published measurements, not measurements made on this machine. Source notices and scope rules are registered in `data/sources.json` and `licenses/`. Existing approved numerical sources were reused where applicable.

| Source | Observations added | Extraction and identity checks | Reuse basis |
| --- | ---: | --- | --- |
| [ESPnet LibriSpeech recipe README](https://github.com/espnet/espnet/blob/b90237261607e61f5e80b4bb8c362f80b209da3c/egs2/librispeech/asr1/README.md) | 22 | Test-clean and test-other word error rates for 11 exact configurations; LM/no-LM and training recipe distinctions retained. No character/token error rates or development-set rows mixed in. | Apache-2.0 repository documentation; full notice retained. |
| [NVIDIA Jasper](https://github.com/NVIDIA/DeepLearningExamples/blob/729963dd47e7c8bd462ad10bfac7a7b0b604e6dd/PyTorch/SpeechRecognition/Jasper/README.md) and [QuartzNet](https://github.com/NVIDIA/DeepLearningExamples/blob/729963dd47e7c8bd462ad10bfac7a7b0b604e6dd/PyTorch/SpeechRecognition/QuartzNet/README.md) | 4 | LibriSpeech test-clean/other, A100 mixed-precision training, greedy decoding. These exact evaluated runs are not claimed to be arbitrary NeMo downloads. | Each subdirectory's Apache-2.0 licence. |
| [VITS, ICML 2021](https://proceedings.mlr.press/v139/kim21f.html) | 6 | Table 1's five LJ Speech pipelines and Table 3's VCTK VITS row. Fine-tuned vocoders are separate from default vocoders. Confidence intervals and experimental conditions retained in notes. | PMLR publication agreement, CC BY 4.0. |
| [TIFA](https://arxiv.org/html/2303.11897v3) | 3 | Appendix Table 4's **Overall** column for AttnGAN, X-LXMERT and min-DALL·E; not an object-specific subscore. Appendix E identifies min-DALL·E's Mega checkpoint. | Existing approved CC BY 4.0 source. |
| [HPSv2 benchmark README](https://github.com/tgxs002/HPSv2/blob/866735ecaae999fa714bd9edfa05aa2672669ee3/README.md) | 3 | HPS v2 **Averaged** column for min-DALL·E, FuseDream and LAFITE. HPS v2.1 and style columns are not counted again. Author setup notes checked against the original benchmark appendix. | Existing approved Apache-2.0 documentation source. |
| [EvalCrafter](https://arxiv.org/html/2310.11440v3) | 32 | Table 2's four human-preference-aligned automatic composite scores for eight exact historical systems. These are not direct human MOS ratings. | CC BY 4.0 on this exact paper version. |
| [NVIDIA FastPitch README](https://github.com/NVIDIA/DeepLearningExamples/blob/729963dd47e7c8bd462ad10bfac7a7b0b604e6dd/PyTorch/SpeechSynthesis/FastPitch/README.md) | 4 | Two MOS observations from the 2020 study and two preference shares from the 2021 study. MOS and pairwise preference are separate benchmarks. | Subdirectory BSD-3-Clause licence; original author results. |
| [Grad-TTS, ICML 2021](https://proceedings.mlr.press/v139/popov21a.html) | 2 | Table 2's Grad-TTS with 10 inference iterations and the identified xcmyz FastSpeech implementation, each with the study's HiFi-GAN vocoder. | PMLR publication agreement, CC BY 4.0. |

The [PMLR publication agreement](https://proceedings.mlr.press/pmlr-license-agreement.html) supplies the reuse basis for the PMLR-hosted VITS and Grad-TTS papers. Their separate arXiv upload licences were not used to infer that permission. Both papers' relevant tables were also visually checked from the PDFs.

MOS values are stored using `(MOS - 1) / 4` with an explicit 1–5 raw scale, so model pages restore the published values. WER percentages are stored as fractions with lower-is-better semantics. EvalCrafter composites use their published 0–100 scale. Reported uncertainty is preserved in notes rather than silently substituted for the catalogue's fitted-score uncertainty.

Existing fitting rules continue to require at least three models per source/protocol series and sufficient overlap for calibration. For example, the two-model Grad-TTS study and two-model FastPitch comparisons retain their raw observations without manufacturing a shared overall score. Correlated EvalCrafter component metrics were not imported alongside their composite scores.

## Local run documentation

**25 of the newly added entries have documented local run options**: min-dalle, three Kandinsky pipelines, two Stable Video Diffusion pipelines, twelve Coqui checkpoints, SpeechBrain FastSpeech2 and six ESPnet checkpoints. The five existing Stable Diffusion entries also received run-option improvements.

Model cards, upstream inference examples and registry records were reviewed. The twelve Coqui archive URLs and relevant Hugging Face model repositories were checked for availability. The [maintained Coqui model registry](https://github.com/idiap/coqui-ai-TTS/blob/ca2cf5155bca892ea820ad384400efbfac41b178/TTS/.models.json) identifies the exact multilingual checkpoints and their model-specific licences. The Stable Video Diffusion recipes follow the [Diffusers documentation](https://huggingface.co/docs/diffusers/main/en/using-diffusers/svd), including its image input requirement.

Run commands were reviewed and their embedded Python syntax checked. Model weights were **not downloaded or executed**. New memory budgets are explicitly marked estimates, with no new measured throughput claims. A documented inference example does not imply that its default decoder reproduces a separately reported benchmark recipe; ESPnet notes make this distinction explicit. Model licences remain separate from the licences permitting reuse of numerical evaluation data.

## Deliberate gaps

- GPT-1 has no fabricated modern benchmark score. The catalogue can represent it before comparable evidence is available.
- No current SD 2.1 download was substituted without verification.
- A VBench leaderboard application's software licence did not establish a reusable licence for its separately stored numerical submissions; those data were not imported.
- Unclear checkpoint/version matches, including ambiguous community Stable Diffusion derivatives and some paper baselines, were held back.
- Historical PikaLab is dated September 2023, not relabelled Pika 1.0. Original CogVideo is distinct from CogVideoX; the AnimateDiff motion adapter does not inherit another pipeline's benchmark score.
- This is broader coverage of the site's five existing domains, not a claim that all early models, languages or AI domains are represented.

## Local validation

- All 23 tests passed, including catalogue visibility, comparison filtering, query preservation and internal link coverage.
- TypeScript and ESLint passed.
- The complete schema/source/duplicate/licence gate passed for 1,242 models, 9,078 results, 669 benchmark definitions and 583 sources using `npm run validate-data`.
- The production build generated 1,593 static pages, including all 1,242 model pages.
- `npm run test:static` verified all 328 static filter pages for exact model rows, canonical URLs, headings and sitemap inclusion, plus the three editable content pages.
- Generated Markdown pages were refreshed with `npm run pages` in the data repository.
- All 23 embedded Python command strings in the added or enhanced run options passed syntax parsing. This is not a runtime compatibility test.
- The local production server returned HTTP 200 for all 55 added model pages and eight representative existing/category/filter pages. In that local sample the median response time was 3.8 ms and the maximum was 59.5 ms; these are server response timings, not a browser rendering benchmark or a production performance guarantee.
- Browser checks confirmed GPT-1's unscored detail page, SD 1.5's Apple Silicon row, the compact Extra disclosure, comparison-set filtering, and explicitly selected within-set scoring.

The exhaustive leave-one-out calibration experiment was not rerun. Normal scoring and comparison-set generation ran during the tests, data preparation and production build. The new `--validate-only` option explicitly skips that expensive experiment; the default full check remains unchanged.

The older provenance comparison references Git object `60c5632`, which is absent from this checkout. Its historical coverage report was preserved, and a separate `current_coverage` section records this batch's audited counts rather than pretending the old baseline was recomputed. Source counts were refreshed from the current observation records.
