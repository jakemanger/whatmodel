# Thin image/video results, 2026-10-07

Candidate rows for thin image/video models (scored with `*`, fewer than 3 counted results, or unscored). Data: `thin-visual-results-2026-10-07.json`
(`results`, `benchmarks`, `ledger`, `gaps`, `checked`). Nothing is imported yet; no file in `data/` was edited.

## Effect (replicating `toCells` in lib/score.ts on results.json plus these rows)

models reaching >=3: 48 of 186 ; improved: 68

Thin models whose counted results change:

```
  0 gpt-image-2-5-sunburst                   2 -> 4
  1 gpt-image-2-5-flare                      2 -> 3
  2 flux-3-video                             2 -> 7
  3 grok-imagine-image-2                     2 -> 3
  4 happyhorse-1-1                           2 -> 5
  5 reve-2-1                                 2 -> 4
  6 muse-image                               2 -> 3
  7 seedream-5-0-pro                         2 -> 4
 11 nano-banana-2-lite                       2 -> 3
 14 kling-3-0                                1 -> 3
 15 ideogram-4                               1 -> 3
 16 uni-1-1-max                              2 -> 3
 19 vidu-q3-pro                              2 -> 5
 20 hunyuanimage-3-0-instruct                1 -> 2
 21 grok-imagine-image                       2 -> 3
 22 qwen-image-2-0-pro                       2 -> 5
 23 grok-imagine-image-pro                   2 -> 3
 24 recraft-v4-1-utility-pro                 1 -> 2
 25 kling-o3-pro                             1 -> 2
 26 cosmos3-super-text2image                 1 -> 2
 28 flux-2-flex                              2 -> 3
 29 wan-2-6-t2i                              1 -> 2
 31 imagen-4                                 2 -> 3
 36 wan-2-7-image-pro                        2 -> 4
 38 hidream-o1-image                         2 -> 4
 39 krea-2-large                             1 -> 2
 42 runway-gen-4-5                           2 -> 3
 44 gpt-image-1-mini                         2 -> 4
 45 qwen-image-edit-2509                     1 -> 3
 47 hailuo-2-3                               2 -> 3
 48 flux-1-kontext-max                       2 -> 3
 50 seedance-1-0-pro                         2 -> 3
 52 longcat-image-edit                       2 -> 5
 53 hunyuanimage-2-1                         1 -> 2
 55 ideogram-3                               1 -> 2
 63 luma-photon                              1 -> 2
 65 p-image                                  1 -> 2
 66 recraft-v3                               1 -> 2
 70 longcat-video                            2 -> 4
 71 wan-2-2-5b                               2 -> 5
 72 flux-1-1-pro                             2 -> 3
 73 flux-1-krea-dev                          1 -> 2
 75 hidream-i1-full                          2 -> 3
 83 flux-1-schnell                           2 -> 5
 85 sdxl-lightning-4-step                    1 -> 2
 86 sd-3-5-medium                            2 -> 3
 90 cogvideox-5b-i2v                         1 -> 4
 96 lcm-sdxl                                 1 -> 3
 97 deepfloyd-if-l                           1 -> 3
 98 dreamlike-photoreal-2-0                  1 -> 3
100 deepfloyd-if-m                           1 -> 3
105 ltx-2-3                                  2 -> 4
106 dall-e-mega-min-dalle                    2 -> 3
113 ltx-2-5                                  0 -> 1
122 mai-image-2-5                            2 -> 4
123 ideogram-4-5                             1 -> 2
124 sora-2-pro                               1 -> 2
125 veo-3                                    2 -> 3
135 seedream-3-0                             1 -> 2
139 step1x-edit-v1-2                         2 -> 4
143 cosmos3-nano                             2 -> 4
145 runway-gen-4                             1 -> 2
148 step1x-edit-v1-1                         1 -> 2
170 versatile-diffusion                      1 -> 3
171 cogview2                                 1 -> 4
172 sd-2-0                                   2 -> 3
173 dall-e-2                                 2 -> 4
180 lumina-dimoo                             1 -> 2
```

## Sources (rows per ledger entry)

- `visual-rapid-i2v-realism` - Rapidata/image-to-video-realism published dataset-card rankings, CC-BY-4.0: 12 rows.
- `visual-rapid-relative-camera` - Rapidata/relative-camera-movement-human-preference-900k published dataset-card rankings, CC-BY-4.0: 12 rows.
- `visual-rapid-camera` (add_match): 1 rows. UPDATE of the existing ledger entry visual-rapid-camera: add the 6206acf revision URL to `match`. That revision (dataset renamed to camera-movement-human-preference-324k) adds one participant, Flux 3 (BFL, commercial I2V, 720p, 598/600 prompts) at ELO 619.2; every other row in the Overall ranking is
- `visual-heim` - HEIM: Holistic Evaluation of Text-to-Image Models (arXiv 2311.04287v1), CC-BY-4.0: 10 rows.
- `visual-imagereward` - ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation (arXiv 2304.05977v4), CC-BY-4.0: 7 rows.
- `visual-vvrbench` - Verifiable Visual Rewards Transfer from Synthetic Scenes to Natural Prompts (VVRBench), arXiv:2609.35641v1, CC-BY-4.0: 18 rows.
- `visual-chartsync` - ChartSync: A Benchmark for Visuo-Logical Cascading Chart Editing (arXiv:2607.10301v1), CC-BY-4.0: 9 rows.
- `visual-infoedit` - InfoEdit: Probing Global Layout Reasoning in Infographic Editing (arXiv:2609.33286v1), CC-BY-4.0: 7 rows.
- `visual-paintbench` - PaintBench: Deterministic Evaluation of Precise Visual Editing (arXiv:2606.00188v1), CC-BY-4.0: 10 rows.
- `visual-mechverse` - MechVerse: Evaluating Physical Motion Consistency in Video Generation Models (arXiv:2605.14843v1), CC-BY-4.0: 6 rows.
- `visual-rapid-benchai-image` - Rapidata/text-to-image-human-preference-6M (Benchmark.ai Image Benchmark) published dataset-card rankings, CC-BY-4.0: 34 rows.
- `visual-rapid-face` - Rapidata/Face_Generation_Benchmark (Human Face Generation Alignment) published dataset-card leaderboard, CDLA-Permissive-2.0: 7 rows.
- `visual-videoargus` - VideoArgus: Agentic Rubric-Grounded Unified Evaluation for Video Generation and Editing (arXiv:2608.05485v1), CC-BY-4.0: 12 rows.
- `visual-datapoint-image-bench` - Datapoint Image Bench leaderboard (datapointai/text-2-image-human-preferences-2m dataset card), CC-BY-4.0: 21 rows.
- `visual-datapoint-video-bench` - Datapoint Video Bench leaderboard (datapointai/text-to-video-human-preferences-326k dataset card), CC-BY-4.0: 10 rows.
- `visual-evalalign` - EvalAlign: Supervised Fine-Tuning Multimodal LLMs with Human-Aligned Data for Evaluating Text-to-Image Models (arXiv:2406.16562v3), CC-BY-4.0: 12 rows.
- `visual-sdxl-lightning` - SDXL-Lightning: Progressive Adversarial Diffusion Distillation (arXiv:2402.13929v3), CC-BY-4.0: 4 rows.
- `visual-cosmos3-report` - Cosmos 3: Omnimodal World Models for Physical AI (arXiv:2606.02800v4), CC-BY-4.0: 6 rows.
- `visual-mindworldbench` - MindWorldBench: Evaluating Mental-State-to-Behavior Reasoning in Image-to-Video Generation (arXiv:2609.39147v1), CC-BY-4.0: 10 rows.
- `visual-vigor-bench` - ViGoR-Bench: How Far Are Visual Generative Models From Zero-Shot Visual Reasoners? (arXiv:2603.25823v1), CC-BY-4.0: 16 rows.
- `visual-phyground` - PhyGround: Benchmarking Physical Reasoning in Generative World Models (arXiv:2605.10806v1), CC-BY-4.0: 5 rows.
- `visual-edival` - EdiVal-Agent: An Object-Centric Framework for Automated, Fine-Grained Evaluation of Multi-Turn Editing (arXiv:2509.13399v3), CC-BY-4.0: 10 rows.
- `visual-weavebench` - WEAVE: Unleashing and Benchmarking the In-context Interleaved Comprehension and Generation (arXiv:2511.11434v1), CC-BY-4.0: 6 rows.
- `visual-knowledge-visualization` - Knowledge Visualization: A Benchmark and Method for Knowledge-Intensive Text-to-Image Generation (arXiv:2604.22302v1), CC-BY-4.0: 10 rows.
- `visual-hp-edit` - HP-Edit: A Human-Preference Post-Training Framework for Image Editing (arXiv:2604.19406v1), CC-BY-4.0: 6 rows.
- `visual-switch-bench` - SWITCH: Benchmarking Modeling and Handling of Tangible Interfaces in Long-horizon Embodied Scenarios (arXiv:2511.17649v5), CC-BY-SA-4.0: 5 rows.
- `visual-wrop-object-permanence` - Training Object Permanence in World Models (WROP exam; arXiv:2609.28654v1), CC-BY-4.0: 4 rows.
- `lmarena-dataset` (existing, pinned 46919c4; image_to_video split identical at latest c60d8c8): 1 row.

## New benchmarks

- `rapidata-i2v-realism-overall` (video, elo): Rapidata image-to-video realism (overall Elo)
- `rapidata-relative-camera-i2v` (video, elo): Rapidata relative camera movement (I2V, alignment Elo)
- `heim-alignment-winrate` (image, acc): HEIM text-image alignment (aspect win rate, v1.1.0)
- `imagereward-human-wins` (image, linear): ImageReward human ranking of T2I models (#wins, real user prompts)
- `imagereward-coco30k-fid` (image, linear): MS-COCO 2014 zero-shot FID-30k at 256px ↓ (ImageReward protocol)
- `vvrbench-accuracy` (image, acc): VVRBench accuracy (10,000 verifiable synthetic-scene tasks)
- `vvrbench-challenge-accuracy` (image, acc): VVRBench-Challenge accuracy (720 harder verifiable tasks)
- `chartsync-overall` (image, acc): ChartSync chart editing (Overall)
- `infoedit-avg-sr` (image, acc): InfoEdit infographic editing (average success rate)
- `paintbench-miou` (image, acc): PaintBench precise editing (mIoU, 20-task average)
- `mechverse-wmb-sum` (video, acc): MechVerse mechanical-motion I2V (WorldModelBench-judge sum)
- `rapidata-benchai-image-overall` (image, elo): Rapidata Benchmark.ai image benchmark (overall Elo)
- `rapidata-face-alignment` (image, elo): Rapidata human-face generation alignment (Elo)
- `videoargus-t2v` (video, acc): VideoArgus-Bench T2V (rubric-grounded score)
- `videoargus-ti2v` (video, acc): VideoArgus-Bench TI2V (rubric-grounded score)
- `datapoint-image-bench-elo` (image, elo): Datapoint Image Bench (overall Elo)
- `datapoint-video-bench-elo` (video, elo): Datapoint Video Bench (overall Elo)
- `evalalign-human-alignment` (image, linear): EvalAlign human text-image alignment score
- `coco10k-fid-sdxl-lightning` (image, linear): MS-COCO 10K FID (whole image) ↓ (SDXL-Lightning protocol)
- `unigenbench-phys-all-cosmos3` (image, acc): UniGenBench + Physical-AI prompts, All 1,170 (Cosmos 3 report)
- `mindworldbench-intention-accuracy` (video, acc): MindWorldBench intention accuracy (I2V mental-state reasoning)
- `vigor-bench-result-avg-image` (image, acc): ViGoR-Bench zero-shot visual reasoning, image models (Result Avg)
- `vigor-bench-result-avg-video` (video, acc): ViGoR-Bench zero-shot visual reasoning, video generators (Result Avg)
- `phyground-human-overall` (video, acc): PhyGround physics human evaluation (Overall, TI2V)
- `edival-o-turn3` (image, acc): EdiVal multi-turn editing overall (EdiVal-O after turn 3)
- `weavebench-avg` (image, acc): WEAVEBench in-context multi-turn editing (Avg)
- `knowvis-brief-overall-en` (image, acc): Knowledge Visualization T2I (Brief Caption, English overall)
- `realpref-bench-human` (image, acc): RealPref-Bench image editing (human user-study score)
- `switch-i2v-vlm-overall` (video, acc): SWITCH interactive-interface I2V (VLM-judge overall)
- `wrop-object-permanence-human-elo` (video, elo): WROP object-permanence exam (human Elo)

## Review flags

- `datapoint-image-bench-elo` values are transcribed from the leaderboard chart image in the public card (the vote files are gated). Each row carries `evidence.transcribed_from_image: true`; drop the source if chart transcription is not acceptable.
- `rapidata-face-alignment` uses CDLA-Permissive-2.0 (open data licence; the agreement text must accompany shared data).
- Single-dimension headlines: where a paper has no overall score, only the benchmark's target metric is used (MindWorldBench intention accuracy; SWITCH VLM overall; EdiVal-O after turn 3; Knowledge Visualization English overall). Owner may prefer to drop these.
- Lab rows: SDXL-Lightning (ByteDance) and Cosmos3-Super-Text2Image (NVIDIA) are `by: lab`; ViGoR-Bench is co-authored by Meituan, so its LongCat-Image-Edit row is `lab`.
- Not imported but available: Rapidata Bananamark (CDLA-Permissive-2.0, 'which image has the better bananas', would lift ideogram-3 and recraft-v3); Datapoint T2V ranking set (tier-stratified sampling makes mean ranks incomparable).
- Rows from the earlier partial runs (LMArena flux-3-video i2v, Rapidata realism / relative camera / camera 324k, HEIM, ImageReward) were re-checked against freshly fetched pinned files before inclusion.

## Gaps

See `gaps` in the JSON for each thin model still below 3 counted results and what was searched.
