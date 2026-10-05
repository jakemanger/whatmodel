# Filling thin hardware pages, 5 October 2026

This batch adds documented local run options so that more of the pre-rendered hardware pages have enough models. It touches **113 catalogue models**:

- 15 video, 34 image and 55 existing text-to-speech models gain new or corrected run options. There are 179 new or corrected run variants in all.
- 9 new locally runnable TTS models are added.
- 8 new published benchmark observations come from one new and one existing openly licensed source.

No remote repository, workflow or deployment was changed. The [machine-readable manifest](thin-pages-2026-10-05.json) lists every added variant, model, observation, source and held-back item.

Baseline: whatmodel commit `3f99658` (local). Commits in this batch:

- `247e901` stable-diffusion.cpp image and video
- `0d0c5d3` Mac and CPU video/image extras
- `962039a` TTS, new models and scores
- `c44448d` more TTS run options
- the final commit with this report

## Thin pages before and after

The measurement counts the rows each of the 328 pre-rendered filter pages shows, and how many of those rows have a score.

**Pages with fewer than 10 rows fell from 36 to 14. Pages with fewer than 5 rows fell from 25 to 9.**

| Page | Before rows / scored | After rows / scored |
| --- | ---: | ---: |
| image 8 GB RAM, local | 1 / 1 | 9 / 9 |
| image 8 GB Apple Silicon, local | 2 / 2 | 16 / 16 |
| image 16 GB RAM, local | 3 / 3 | 20 / 18 |
| image 24–256 GB RAM, local (8 pages) | 5 / 5 | 29–39 / 26–35 |
| video 8 GB Apple Silicon, local | 0 / 0 | 0 / 0 |
| video 16 GB Apple Silicon, local | 1 / 1 | 4 / 3 |
| video 24 GB Apple Silicon, local | 1 / 1 | 4 / 3 |
| video 32 GB Apple Silicon, local | 1 / 1 | 6 / 5 |
| video 48 GB Apple Silicon, local | 2 / 1 | 13 / 11 |
| video 64 GB Apple Silicon, local | 3 / 2 | 15 / 13 |
| video 96–256 GB Apple Silicon, local (4 pages) | 4 / 3 | 16 / 14 |
| video 8 GB RAM, local | 0 / 0 | 0 / 0 |
| video 16 GB RAM, local | 0 / 0 | 2 / 1 |
| video 24 GB RAM, local | 0 / 0 | 3 / 2 |
| video 32 GB RAM, local | 0 / 0 | 4 / 3 |
| video 48 GB RAM, local | 0 / 0 | 9 / 8 |
| video 64 GB RAM, local | 0 / 0 | 10 / 8 |
| video 96–256 GB RAM, local (4 pages) | 0 / 0 | 11 / 9 |
| TTS 8 GB RAM, local | 6 / 5 | 32 / 26 |
| image set cvtg-2k | 0 / 0 | 3 / 0 |
| TTS set vits2021-ljspeech-mos | 0 / 0 | 0 / 0 |
| LLM set bbh | 5 / 0 | 5 / 0 |
| LLM set arc-challenge | 39 / 0 | 39 / 0 |
| STT set librispeech-test-clean (ESPnet) | 6 / 0 | 6 / 0 |

No page that met the target before falls below it now.

### Pages that cannot reach the target with documented paths

These pages stay thin because no documented paths exist. The reasons:

- **Video, 8 GB (Mac and CPU).** No documented video pipeline fits in about 5.4 GB of unified memory or 3.2 GB of CPU RAM. The smallest is Wan 2.1 1.3B through stable-diffusion.cpp, which needs about 8.6 GB with a 4-bit text encoder.
- **Video, 16–32 GB CPU-only (2–4 rows).** Only stable-diffusion.cpp (Wan 2.1/2.2, AnimateDiff) and OpenVINO GenAI (LTX-Video 0.9) document CPU video generation.
  - The CPU research also checked OpenVINO notebooks and every official repo. CogVideoX, Mochi, Hotshot-XL, NOVA and AnimateDiff hard-code CUDA. ModelScope T2V says "only supports inference on the GPU". Pyramid Flow's MPS PR was reverted.
  - The only official CPU memory figure found is OpenVINO's ZeroScope notebook: at least 24 GB for a 432×240, 16-frame clip and more than 100 GB at native size.
  - No vendor publishes a CPU generation time. CPU video is impractical in any case.
- **Video, 16–32 GB Apple Silicon (4–6 rows).** The only small scored video models with a documented Mac path are:
  - Wan 2.1 1.3B and Wan 2.2 5B (stable-diffusion.cpp Metal, Rapid-MLX)
  - T2V-Turbo (official MPS instruction)
  - AnimateDiff v2 (stable-diffusion.cpp, unscored)
  - Wan 2.1 14B at 32 GB
  - LTX-Video 0.9's official MPS route loads a 19 GB fp32 T5, so it only fits 48 GB or more.
- **Video, 48 GB CPU (9 rows, 8 scored).** This page is one model short. MiniMax-H3 (51.9 GB) and LTX-2.5 (47.7 GB) need 64–96 GB at the documented quantisations, and lower-bit files were not added just to fill it. The 64 GB CPU page reaches 10 rows.
- **Image, 8 GB CPU (9 rows).** These all fit in the 3.2 GB budget:
  - SD 1.1–1.5, Dreamlike Photoreal 2.0 and Openjourney via sd.cpp q8_0
  - Z-Image-Turbo q3
  - LCM Dreamshaper v7 (OpenVINO int8)

  SSD-1B q8_0 needs an estimated 3.3 GB and misses by 0.1 GB. SD 2.x is held back (see below).
- **Comparison-set pages** (image cvtg-2k, TTS vits2021-ljspeech-mos, LLM bbh and arc-challenge, STT ESPnet LibriSpeech) show overall-scale scores, and their members are not connected to the main fit. They can't show scored rows unless a shared benchmark links the sets.
  - The cvtg-2k page now has 3 rows because the three Mage-Flow models gained run options.
  - These pages probably should not be pre-rendered.

## Run options added

Every command comes from the model's official repository or model card, or from a runtime's official documentation that names the model. Sources are pinned to commits; each variant's `source` and `note` give the pinned page, the files it loads and any adaptation. Weights were not downloaded or executed.

### Memory estimates

- **Image and video:** the catalogue's existing rule (`lib/data.ts`) is 1.2 × bytes of weights + 0.5 GB. This batch applies it to **every file the command loads**: the diffusion model, text encoders and VAE. Earlier stable-diffusion.cpp entries counted only the diffusion transformer.
  - Where stable-diffusion.cpp's own quantisation doc states a figure (SD 1.x q8_0, "~2.1G" at 512×512), that figure is used.
  - Sizes come from the Hugging Face API at pinned revisions. `--type q8_0` conversions are estimated at 0.53 × the 16-bit file size (8.5 bits per weight).
- **TTS:** as in existing TTS entries, `gb` is the sum of the checkpoint files the command loads, and notes say runtime memory is higher.
- All new estimates are labelled `gb_estimated`.

### Image (34 models, 51 variants)

- **stable-diffusion.cpp** at [3f8527a](https://github.com/leejet/stable-diffusion.cpp/tree/3f8527a46c54ecf4cb4ed6003da8e8982283c73c). Its README lists CPU, Metal, CUDA and Vulkan backends, so these variants carry no platform restriction. Models covered:
  - SD 1.1–1.5, Dreamlike Photoreal 2.0 and Openjourney (SD 1.x checkpoints)
  - SDXL 1.0 and 0.9, SDXL-Turbo, SDXL-Lightning 4-step, Playground v2 and SSD-1B
  - SD 3 Medium and SD 3.5 Large
  - FLUX.1 Kontext [dev], FLUX.2 [dev] and FLUX.2 [klein] 4B/9B
  - Qwen-Image, Qwen-Image-Edit, -2509 and -2511, and Qwen-Image-2.1
  - Z-Image (Base), Ovis-Image-7B, ERNIE-Image and ERNIE-Image-Turbo, LongCat-Image, Ideogram 4.0
  - Mage-Flow, Mage-Flow-Turbo and Mage-Flow-Base. Steps and guidance come from the official [Mage-Flow README](https://github.com/microsoft/Mage/blob/76bec2bb3818863f470de7e867c2dc7f1d0bfd83/mage_flow/README.md).
  - Turbo, Lightning and Playground settings come from each model card.
- **LCM Dreamshaper v7** uses Intel's OpenVINO conversions ([int8](https://huggingface.co/OpenVINO/LCM_Dreamshaper_v7-int8-ov/blob/340a03e5488f36f7f222e6efa29819850ad7e4be/README.md) and fp16) with OpenVINO GenAI on `device="CPU"`. OpenVINO GenAI's supported-model list names SimianLuo/LCM_Dreamshaper_v7.

### Video (15 models, 22 variants)

- **stable-diffusion.cpp** (CPU, Metal and CUDA) covers:
  - [Wan 2.1 T2V 1.3B and 14B, Wan 2.2 TI2V 5B, Wan 2.2 T2V and I2V A14B](https://github.com/leejet/stable-diffusion.cpp/blob/3f8527a46c54ecf4cb4ed6003da8e8982283c73c/docs/wan.md)
  - HunyuanVideo 1.5 (720p T2V)
  - LTX-2.3 and LTX-2.5
  - MiniMax H3
  - AnimateDiff's v2 SD 1.5 motion module

  Smaller-quantisation variants use other files from the repositories the doc links, and each one says so.
- **LTX-Video 0.9 (2B)** has two paths:
  - [OpenVINO GenAI 2026.4.1.0](https://github.com/openvinotoolkit/openvino.genai/blob/ab01d1771e4adaa0e1e08e9d630def170572506c/samples/python/video_generation/README.md) on CPU. Its supported-video table lists only LTX-Video, and the export reads the original 0.9 diffusers weights.
  - The official [LTX-Video repo at the commit that added MPS support](https://github.com/Lightricks/LTX-Video/blob/727f5d6c2c73e93e4bd004d62dafa46f8b9ce8d6/README.md), on Mac.
- **T2V-Turbo (VC2) and T2V-Turbo-v2** on Mac follow the [README instruction](https://github.com/Ji4chenLi/t2v-turbo/blob/eaae323f10d136796a33e8f5304ed50e40def570/README.md) "For MacOS users, need to set the device=\"mps\" in app.py".
- **HunyuanVideo and LTX-2 19B Distilled** on Mac use the Draw Things CLI. It installs with `brew install draw-things-cli`, and its [official SKILL.md](https://github.com/drawthingsai/draw-things-community/blob/e51089d5229b3147e13a21cfe0c379deff851715/.agents/skills/use-drawthings-cli/SKILL.md) documents the local video command. The model ids come from Draw Things' official model registry.

### Text to speech (55 existing and 9 new models, 106 variants)

- **CPU and Mac paths for scored open models.** Sources are each model's official repository or card, plus established runtimes whose docs name the exact checkpoint.
  - Runtimes used: the maintained Coqui TTS registry (XTTS v2, Tortoise v2, YourTTS) and mlx-audio at feb25a3.
  - zonos2.cpp and orpheus-cpp are each linked from the official repository.
  - Models covered include:
    - Qwen3-TTS 0.6B/1.7B Base, VoxCPM2 and VoxCPM 0.5B, ZONOS2, IndexTTS and IndexTTS-2
    - Orpheus, StyleTTS 2, Fish Speech 1.2 and 1.5, Higgs Audio V2, Kyutai TTS, dots.tts
    - MMS TTS Amharic, OpenVoice V1/V2, CosyVoice 1/2/3, Spark-TTS, GPT-SoVITS v2, SpeechT5
    - ZipVoice, VoiceCraft, VALL-E X, OuteTTS 0.2, Supertonic 3, MOSS-TTS v1.5, Wayu-Paxa
    - Amphion VALL-E, NaturalSpeech 2 and Vevo, HierSpeech++, FireRedTTS 1/3, Llasa-8B, DMOSpeech 2, VITS (VCTK)
  - CPU-capable variants also go to Chatterbox and Chatterbox Multilingual V3, Fish Audio S2 Pro, OpenAudio S1 Mini, VibeVoice 1.5B, Bark, Maya1, Kokoro and Magpie. Breeze TTS 2 gets Mac (MLX) variants only.
- **New models**, each with official CPU commands:
  - MeloTTS English
  - Piper (en_US lessac medium)
  - Kitten TTS Mini 0.8 and KittenTTS 2
  - Kyutai Pocket TTS
  - NeuTTS Air
  - Dia 1.6B (0626)
  - Chatterbox Turbo
  - Parler-TTS Mini v1
- **Corrections to existing entries:**
  - **Broken commands fixed:**
    - Chatterbox Multilingual V3: PyPI 0.1.7 can't load V3, so it now installs from source as the README shows.
    - Fish Audio S2 Pro: the codes and codec paths at commit 214da3c.
    - OpenAudio S1 Mini: pinned to the last commit with S1 docs, d3df505.
  - **Variants that relied on blogs or unlinked community ports replaced with official ones:** Kokoro's `nazdridoy/kokoro-tts` wrapper, Magpie's `mudler/magpie-tts.cpp`, and VibeVoice's community fork, which was sourced from a blog.
  - **Relabelled `any`:** Zonos v0.1 and Bark, whose READMEs say they run on CPU.

## Benchmark observations added

| Source | Observations | Extraction and identity checks | Reuse basis |
| --- | ---: | --- | --- |
| [VERSA, arXiv:2412.17667v2](https://arxiv.org/html/2412.17667v2), Appendix C.2 Table 6 | 6 | The UTMOS column for MeloTTS English, Parler-TTS Mini v1, CosyVoice-300M, Plachtaa VALL-E X, Amphion VALL-E (`amphion/valle`) and Amphion NaturalSpeech 2. Each mapping uses the checkpoint link the paper prints in Table 5. The authors generated LibriSpeech test-clean speech with each developer's pipeline and scored it with VERSA. New benchmark `versa-librispeech-test-clean-utmos`, stored as (MOS − 1) / 4. | CC BY 4.0 on the v2 arXiv abstract page; new ledger entry `speech-versa-toolkit-ccby` with a full notice in `licenses/`. |
| [CodecMOS-Accent, arXiv:2603.14328v1](https://arxiv.org/html/2603.14328v1), Table 1 | 2 | NeuTTS Air's S-NAT (4.060 ± 0.070) and S-SPK-SIM (3.271 ± 0.093) in the existing crowd-MOS series. The paper cites the neuphonic/neutts repository but does not say which backbone file it used. | Existing approved CC BY 4.0 source. |

Effect on the fit: TTS gains three scored models (111 → 114: MeloTTS English, Parler-TTS Mini v1 and NeuTTS Air). Leave-one-out r without floor-weight series is 0.652 before and 0.658 after. The error-metric p90 is 6.7 before and 6.8 after, and the top five are unchanged.

## Held back

- **Scores**
  - **VERSA Whisper-WER column.** It fitted poorly (series noise 0.72). With it, TTS leave-one-out r fell to 0.629 and the error p90 rose to 9.5 points. The Whisper model size is not stated. This follows the earlier HEIM precedent.
  - **sanoTTS (arXiv:2608.21378v1, CC BY 4.0) Piper amy and kristin rows.** None of its systems are catalogued, so they would form an isolated series.
  - **5uck1ess/tts-bench.** It has scores for nearly every unscored local TTS model (Piper, Kitten, Magpie, Maya1, Breeze, Pocket TTS, Dia, Chatterbox Turbo), but its licence covers only the code, not `scoring/scores.csv`.
  - **Papers and other sources that were not usable:**
    - About 15 papers that evaluate Dia, Pocket TTS, Chatterbox or Coqui models are under NC/ND or arXiv's default licence.
    - The Breeze TTS 2 and Chatterbox Turbo vendor pages carry no licence.
    - Papers that ran ESPnet or retrained checkpoints instead of the catalogued Coqui ones are identity mismatches.
  - **Still unscored:** Magpie, Maya1, Breeze TTS 2, the Coqui registry checkpoints, SpeechBrain FastSpeech2, Piper, Kitten, Pocket TTS, Dia and Chatterbox Turbo.
- **Image run options**
  - **SD 2.0/2.1.** Stability's official repositories return 401. stable-diffusion.cpp links a community mirror of 2.1-base, which is held back, consistent with the earlier batch.
  - **SD 3.5 Medium.** Not documented by stable-diffusion.cpp.
  - **FLUX.1 Krea [dev], Krea 2 Turbo and HiDream-O1-Image (full).** stable-diffusion.cpp has no command for these exact checkpoints; its examples cover FLUX.1 dev, Krea 2 Raw and HiDream-O1-Image-Dev.
  - **PixArt-α.** The documented single T5 file does not match the sharded checkpoint.
  - **Playground v2.5.** Uses an EDM schedule that stable-diffusion.cpp does not document.
  - **LLaDA-Image.** Needs a multi-step conversion.
  - **LCM-SDXL and LCM-SSD-1B.** Removed from FastSD CPU's documented list, and too large for small machines anyway.
  - **SDXL-Turbo through FastSD or OpenVINO.** FastSD's commands are assembled from flags, not documented.
- **Video run options**
  - **HunyuanVideo 1.5 I2V.** stable-diffusion.cpp documents only T2V.
  - **LTX-2 19B Distilled through stable-diffusion.cpp.** Not supported; only 2.3 and 2.5 are.
  - **CogVideoX.** Rapid-MLX serves CogVideoX-Fun, a different model.
  - **ZeroScope.** OpenVINO notebook only, needing 24 GB or more.
  - **Wan 2.1 1.3B and SVD-XT OpenVINO notebooks.** They fuse a CausVid LoRA or swap in AnimateLCM weights.
  - **mlx-video Wan commands.** The documented module paths are stale.
  - **Rapid-MLX LTX-2.3 q4.** A community quant with no model card, so dev versus distilled is unknown.
  - **Duplicate variants for models already covered.** Draw Things Wan files and MiniMax i4x.
  - **2- and 3-bit quants.** Not added to inflate small-machine pages.
- **TTS run options**
  - **No CPU path documented:** MetaVoice (README requires a GPU with 12 GB or more), MaskGCT, Sesame CSM (README requires a CUDA GPU, so it gets Mac MLX only), Kyutai TTS (Mac and NVIDIA), Higgs V3 and Voxtral (Mac only).
  - **No usable official command:**
    - WhisperSpeech v1.95 medium and Vokan: none exists.
    - MGM-Omni: the documented command references an undefined argument.
    - Raon-OpenTTS and Simple-TTS: their only inference is a dataset evaluation.
    - VoiceCraft 830M TTSEnhanced: notebook only, and the weight format can't be matched.
  - **VITS VCTK on CPU.** The candidate is `kakao-enterprise/vits-vctk`, whose org is unverified and is not linked by the official repo.

## Decisions for the owner

1. **Stop pre-rendering pages that can't be filled:**
   - 8 GB video (Mac and CPU)
   - probably CPU-only video at 32 GB and below
   - Mac video at 32 GB and below, if 4–6 rows is too thin
   - the comparison-set pages (image cvtg-2k, TTS vits2021, LLM bbh, LLM arc-challenge, STT ESPnet LibriSpeech)
2. **OpenVoice V1/V2:** the documented S3 checkpoint zips now return 404/403. The added commands download the same checkpoint trees from MyShell's official Hugging Face repositories, and the note says so. Keep or drop?
3. **Higgs Audio V2 and dots.tts CPU variants:**
   - Higgs Audio V2 relies on the official card's `device_map="auto"`.
   - dots.tts adds `--precision float32`, a documented flag that the runtime's own CPU error message asks for.

   Both are labelled; remove them if this is too permissive.

   **Decided 2026-10-05 (owner):** keep every pre-rendered page (item 1); keep the OpenVoice commands (item 2); remove both CPU variants (item 3). The Higgs Audio V2 transformers command is now listed for NVIDIA only, and the dots.tts float32 variant is removed; its default bf16 NVIDIA command remains.
4. **Existing entries to re-check (not changed here):**
   - **LTX-2 Mac (mlx-video):** the default `--model-repo Lightricks/LTX-2` downloads the whole repository (about 314 GB) and may load a different transformer than intended.
   - **Older stable-diffusion.cpp entries** (FLUX.1, Z-Image-Turbo, Qwen-Image-2512) count only the diffusion model's memory.
   - **Magpie:** the catalogue dates it 2026-02, but NeMo-Speech.cpp loads the v2607 checkpoint.
5. **tts-bench licence:** asking its author to license `scoring/scores.csv` under CC BY 4.0 or CC0 would give one series covering most unscored local TTS models.

## Validation

- `npm run validate-data`, `npm test` (24 passing) and `npm run typecheck` passed after every batch.
- The full `npm run check` (leave-one-out calibration) passed before and after the score import.
- `npm run pages` regenerated README.md and pages/.
- Embedded commands were syntax-checked by the research step (`bash -n` and Python `compile()` of `python -c` bodies). This is not a runtime test.
- The thin-page measurement used the site's `npm run sync-data` and the 328 profiles in `site/profiles.ts`.
