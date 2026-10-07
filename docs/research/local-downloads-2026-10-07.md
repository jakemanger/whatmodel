# Local downloads for open-weights models without one (2026-10-07)

Data file: `local-downloads-2026-10-07.json` (same folder). It holds `patches` (`{id, variants}`, each variant in the `lib/types.ts` Variant shape plus the catalogue's optional `gb_source` and `note`), `skipped` (`{id, why}`) and `reviewed` (counts plus per-model notes for the earlier, unreviewed partial patches). Nothing under `data/` was edited.

## Coverage

| Category | Models in scope | Patched | Skipped |
|---|---|---|---|
| LLM | 102 | 89 | 13 |
| Image | 44 | 34 | 10 |
| Video | 13 | 13 | 0 |
| TTS | 20 | 10 | 10 |
| STT | 11 | 9 | 2 |
| **Total** | 190 | 155 | 35 |

LLM variants by route: llama-server GGUF 56, vllm serve 23, transformers pipeline (uv run) 23, model-card / official repo script 13, ollama 6, sglang 2.

## Review of the earlier partial patches

102 partial patches (53 LLM from `built.json`, 19 speech from `parts/A–E`, 30 visual from `vl/parts`): **80 kept, 22 fixed, 0 dropped**.

- Every GGUF variant was re-resolved through the Hugging Face llama.cpp manifest (`/v2/<repo>/manifests/<tag>`) and re-sized from the tree at the cited commit; all sizes matched (gb includes the mmproj file that `llama-server -hf` also fetches). Identity was checked against each repo's `base_model` and, where versions differ in place, commit history (Phi-3 mini April vs June 2024, DeepSeek V4 Flash April vs 0731, DeepSeek-Coder-V2 0614 vs 0724).
- **MiMo-V2.6-Pro → `ggml-org/MiMo-V2.6-Pro-RL-GGUF`: kept.** The catalogue row itself identifies the rated model as the launch checkpoint XiaomiMiMo/MiMo-V2.6-Pro-RL (its `model_repo` and `identity_note`), and the GGUF's `base_model` is that repo.
- **19 LLM patches used TheBloke or mradermacher GGUFs**, which are outside the accepted publishers (official, unsloth, bartowski, ggml-org) and not used anywhere in the catalogue. None of the accepted publishers has a GGUF of these checkpoints, so they were replaced: Xwin-LM 70B keeps only its verified ollama tag; WizardLM 70B moves to `ollama run wizardlm:70b-llama2-*` (the library page links WizardLM-70B-V1.0); 14 move to the catalogue's transformers-pipeline convention from the official repo; Ring-flash-2.0, Jamba 1.5 Mini and ChatGLM3-6B move to `vllm serve` (architectures in vLLM's supported-models list); Qwen-14B-Chat uses its card's quickstart.
- **Dia2 2B: fixed.** The command said `--cfg 2.0`; the README at the cited commit says `--cfg 6.0`.
- Speech and visual patches were spot-checked: quoted card/README text found at the pinned commits, transformers/PyPI versions exist, file sizes match the trees, and `gb = 1.2 × weights + 0.5` recomputes. Their 12 + 2 earlier skips were spot-checked and kept.

## New routes (models with no partial patch)

53 models received new variants. Highlights:

- **DeepSeek V4.1 Flash**: DeepSeek's own `inference/` reference runtime (convert to TP8, `torchrun generate.py`); no GGUF or vLLM support exists yet.
- **Hy4 preview / Hy3 preview / DeepSeek V3.2 Exp / Step 3 / Laguna M.1 / Pixtral Large / Jamba 1.5 Large**: the cards' own vLLM, SGLang or Docker commands (some via the maker's own FP8/NVFP4 release of the same model), plus `vllm serve` where vLLM lists the architecture.
- **LongCat 2.0**: the only verified recipe from the SGLang cookbook the card links (FP8, B300, TP8/EP8).
- **DeepSeek V4 Pro (April preview)**: `vllm serve deepseek-ai/DeepSeek-V4-Pro`; the repo still holds the April weights (0813 is a separate repo).
- **Phi-3-mini-128k (Apr 2024)**: transformers pinned to the last revision before Microsoft replaced the weights in place (`bb5bf1e`, LFS hashes compared).
- Older LLMs: official transformers pipeline, model-card commands (OLMo, ChatGLM-6B, Aya Vision, Snowflake Arctic, Phi-3-small, MiniMax-M1, CogVLM2) or `vllm serve` for listed architectures (Molmo, InternVL2, Phi-3/3.5-vision, ChatGLM2, LLaVA-OneVision via the llava-hf conversion of the same checkpoint).
- Visual: diffusers or official-repo commands for HiDream-I1, Lumina-Image 2.0, ChronoEdit, Playground v2.5, OmniGen2, BAGEL, Show-o2, BLIP3-o 8B, VILA-U, OneCAT, Lumina-DiMOO, CogView2, ZeroScope v2 XL, VideoCrafter1, Show-1 and the original CogVideo. Where the README gives a GPU-memory figure (ChronoEdit 34 GB, OmniGen2 17 GB, BAGEL 32/12 GB, Lumina-DiMOO 38.9 GB, ZeroScope XL 15.3 GB) gb uses it and says so; otherwise gb uses the catalogue rule `1.2 × weights loaded + 0.5`.

## Skipped (35)

- **No single documented / verifiable command** (18): `nemotron-4-340b-instruct`, `llama2-70b-steerlm-chat`, `stripedhyena-nous-7b`, `koala-13b`, `blip3o-next-grpo-text-3b`, `fusedream-biggan-512`, `lafite-hps2023`, `glide-filtered`, `x-lxmert`, `attngan-coco`, `raon-opentts-1b`, `raon-opentts-0-3b`, `zipformer-transducer-xl-290m`, `mgm-omni-tts-2b-0927`, `ultravox-v0-6-llama-3-1-8b`, `vokan`, `simple-tts`, `fastpitch-1-0-waveglow`
- **No official download** (10): `llama-65b`, `llama-33b`, `llama-13b`, `mpt-7b`, `llama-7b`, `mpt-30b-chat`, `mpt-7b-chat`, `dolly-v2-12b`, `sd-2-0`, `sd-2-1`
- **Exact checkpoint cannot be pinned** (6): `rwkv-4-raven-14b`, `uniworld-v1`, `glow-tts-hifigan-ft-ljspeech`, `tacotron2-hifigan-ft-ljspeech`, `glow-tts-hifigan-ljspeech`, `tacotron2-hifigan-ljspeech`
- **No released weights** (1): `metaquery-xl`

Each skip's full reason is in the JSON.

## Caveats

- No command was executed. Commands follow the cited card/README; where a doc needed a concrete value (a local path, a model id in place of `/path/to/...`, a hard-coded `SAT_HOME`, current diffusers' `.frames[0]`), the change is stated in the variant's `note`.
- All `gb` values carry `gb_estimated: true`, as the catalogue does for Hugging Face-sourced sizes (`unreviewed-hf` is not an allowed measurement source in `data/sources.json`). For LLMs gb is the download size; for image, video and speech it is memory needed.
- Several new LLM routes are server-class (multi-GPU vLLM/SGLang, hundreds of GB to 2 TB); they are real local routes but will only match the largest hardware profiles.
- Version-sensitive routes pin what the docs pin (e.g. transformers 4.32.0 for Qwen-14B-Chat, 4.27.1 for ChatGLM-6B, 4.40.2 for Phi-3-small).
