# Catalogue coverage follow-up

Reviewed 2026-09-26. Coverage means the current catalogue, not all AI models in existence. No benchmark scores or scoring thresholds changed.

Five already-scored LLMs now have verified run options: Ministral 3 Reasoning 3B, 8B and 14B (official Q4_K_M GGUF downloads); Laguna XS.2 (official BF16/vLLM instructions); Laguna M.1 (official Poolside API, price unknown). Commands were verified against published instructions, not run locally: no weights downloaded, API calls purchased, or throughput claimed.

## llm

205/228 catalogue models have a score and a run option across all comparison sets.

| Model | Results | Remaining gap |
|---|---:|---|
| LongCat 2.0 (1.6T-A48B) (longcat-2-0) | 10 | Insufficient same-evaluator benchmark overlap for a score |
| Grok Build 0.1 (grok-build-0-1) | 0 | No reviewed exact-model result |
| Command A+ (05-2026) (command-a-plus) | 0 | No reviewed exact-model result |
| ERNIE 4.5 300B-A47B (ernie-4-5-300b-a47b) | 18 | Insufficient same-evaluator benchmark overlap for a score |
| Ling 3.0 Flash (124B-A5B) (ling-3-0-flash) | 15 | Insufficient same-evaluator benchmark overlap for a score |
| Devstral Small 2 24B (devstral-small-2) | 3 | Insufficient same-evaluator benchmark overlap for a score |
| EXAONE 4.0 32B (exaone-4-0-32b) | 3 | Insufficient same-evaluator benchmark overlap for a score |
| EXAONE 4.0 1.2B (exaone-4-0-1-2b) | 1 | Insufficient same-evaluator benchmark overlap for a score |
| EXAONE 4.5 33B (exaone-4-5-33b) | 0 | No reviewed exact-model result |
| Nemotron Nano 9B v2 (nemotron-nano-9b-v2) | 7 | Insufficient same-evaluator benchmark overlap for a score |
| Nemotron 3 Nano 4B (nemotron-3-nano-4b) | 6 | Insufficient same-evaluator benchmark overlap for a score |
| Nemotron Cascade 2 30B-A3B (nemotron-cascade-2-30b-a3b) | 19 | Insufficient same-evaluator benchmark overlap for a score |
| LFM2 24B-A2B (lfm2-24b-a2b) | 11 | Insufficient same-evaluator benchmark overlap for a score |
| LFM2.5 8B-A1B (lfm2-5-8b-a1b) | 7 | Insufficient same-evaluator benchmark overlap for a score |
| LFM2.5 1.2B Thinking (lfm2-5-1-2b-thinking) | 8 | Insufficient same-evaluator benchmark overlap for a score |
| Apriel 1.6 15B Thinker (apriel-1-6-15b-thinker) | 5 | Insufficient same-evaluator benchmark overlap for a score |
| Falcon-H1R 7B (falcon-h1r-7b) | 10 | Insufficient same-evaluator benchmark overlap for a score |
| K2 Horizon 7B (k2-horizon-7b) | 7 | Insufficient same-evaluator benchmark overlap for a score |
| GPT-5.5 Instant (gpt-5-5-instant) | 8 | No verified current run option |
| ERNIE 5.1 (ernie-5-1) | 2 | No verified current run option |
| MiMo-V2-Omni (mimo-v2-omni) | 2 | No verified current run option |
| Muse Spark (muse-spark) | 5 | No verified current run option |
| Gemini 3 Pro (Preview) (gemini-3-pro-preview) | 3 | No verified current run option |

## image

87/128 catalogue models have a score and a run option across all comparison sets.

| Model | Results | Remaining gap |
|---|---:|---|
| MAI-Image-2.6 (mai-image-2-6) | 2 | No verified current run option |
| ERNIE-Image-Turbo (ernie-image-turbo) | 5 | Insufficient same-evaluator benchmark overlap for a score |
| Mage-Flow-Base (mage-flow-base) | 9 | No verified current run option |
| Mage-Flow (mage-flow) | 9 | No verified current run option |
| Mage-Flow-Turbo (mage-flow-turbo) | 9 | No verified current run option |
| Stable Diffusion v1.5 (sd-1-5) | 2 | No verified current run option |
| Stable Diffusion v2.1 (sd-2-1) | 2 | No verified current run option |
| IF-XL (deepfloyd-if-xl) | 1 | No verified current run option |
| LLaDA-Image (llada-image) | 2 | Insufficient same-evaluator benchmark overlap for a score |
| LLaDA-Image-Turbo (llada-image-turbo) | 2 | Insufficient same-evaluator benchmark overlap for a score |
| MAI-Image-2.5 (mai-image-2-5) | 2 | No verified current run option |
| Qwen-Image-2.1 (qwen-image-2-1) | 2 | No verified current run option |
| SeedEdit 3.0 (seededit-3-0) | 2 | No verified current run option |
| Gemini 2.0 Flash Image Generation (preview) (gemini-2-0-flash-image) | 2 | No verified current run option |
| Reve V1.1 (reve-v1-1) | 1 | No verified current run option |
| Reve V1 (reve-v1) | 1 | No verified current run option |
| Reve V1.1 Fast (reve-v1-1-fast) | 1 | No verified current run option |
| Reve Edit Fast (reve-edit-fast) | 1 | No verified current run option |
| MAI-Image-2 (mai-image-2) | 1 | No verified current run option |
| MAI-Image-1 (mai-image-1) | 1 | No verified current run option |
| Reve V1.5 (reve-v1-5) | 1 | No verified current run option |
| Seedream 3.0 (seedream-3-0) | 1 | No verified current run option |
| Imagen 3 (imagen-3.0-generate-002) (imagen-3) | 1 | No verified current run option |
| DALL·E 3 (dall-e-3) | 3 | No verified current run option |
| Show-o2 7B (show-o2-7b) | 1 | No verified current run option |
| Show-o2 1.5B-HQ (show-o2-1-5b-hq) | 1 | No verified current run option |
| BLIP3o-NEXT-GRPO-Text-3B (blip3o-next-grpo-text-3b) | 1 | No verified current run option |
| BLIP3-o 8B (blip3o-8b) | 2 | No verified current run option |
| Emu3 (emu3) | 5 | No verified current run option |
| Playground v2.5 (playground-v2-5) | 2 | No verified current run option |
| Show-o (show-o-demo-512) (show-o-demo-512) | 1 | No verified current run option |
| Emu3.5 (emu3-5) | 1 | No verified current run option |
| Emu3.5-Image (emu3-5-image) | 1 | No verified current run option |
| Midjourney V7 (midjourney-v7) | 2 | No verified current run option |
| PixArt-α (PixArt-XL-2-1024-MS) (pixart-alpha) | 1 | No verified current run option |
| Janus-1.3B (janus-1-3b) | 2 | No verified current run option |
| VILA-U 7B (256px) (vila-u-7b-256) | 1 | No verified current run option |
| UniWorld-V1 (uniworld-v1) | 4 | No verified current run option |
| MetaQuery-XL (metaquery-xl) | 1 | No verified current run option |
| Step1X-Edit v1.1 (step1x-edit-v1-1) | 1 | No verified current run option |
| Step1X-Edit v1.2 (step1x-edit-v1-2) | 4 | No verified current run option |

## video

54/79 catalogue models have a score and a run option across all comparison sets.

| Model | Results | Remaining gap |
|---|---:|---|
| Veo 3 (veo-3) | 2 | No verified current run option |
| Sora 2 (sora-2) | 7 | No verified current run option |
| Sora 2 Pro (sora-2-pro) | 1 | No verified current run option |
| Ray 3 (luma-ray-3) | 3 | No verified current run option |
| LTX-2.5 (ltx-2-5) | 0 | No reviewed exact-model result |
| Vidu Q3 (vidu-q3) | 1 | No verified current run option |
| Cosmos3-Nano (cosmos3-nano) | 2 | No verified current run option |
| Muse Video (muse-video) | 1 | No verified current run option |
| HiDream-O1-Video 1.0 (hidream-o1-video-1-0) | 1 | No verified current run option |
| Veo 3 Fast (veo-3-fast) | 2 | No verified current run option |
| Seedance 1.0 Lite (seedance-1-0-lite) | 3 | No verified current run option |
| Kandinsky 5.0 T2V Lite (kandinsky-5-0-t2v-lite) | 1 | No verified current run option |
| Veo 2 (veo-2) | 2 | No verified current run option |
| Sora (original, 2024) (sora) | 2 | No verified current run option |
| Ray 2 (luma-ray-2) | 3 | No verified current run option |
| Vidu Q2 Pro (vidu-q2-pro) | 1 | No verified current run option |
| Runway Aleph (runway-aleph) | 1 | No verified current run option |
| CogVideoX1.5-5B (cogvideox-1-5-5b) | 2 | No verified current run option |
| Runway Gen-3 Alpha (runway-gen-3-alpha) | 1 | No verified current run option |
| Kling 1.6 (Standard mode) (kling-1-6-std) | 1 | No verified current run option |
| Open-Sora 2.0 (open-sora-2-0) | 1 | No verified current run option |
| HunyuanVideo-I2V (hunyuanvideo-i2v) | 1 | No verified current run option |
| Kling 1.6 (Pro mode) (kling-1-6-pro) | 1 | No verified current run option |
| Runway Gen-4 (runway-gen-4) | 1 | No verified current run option |
| Cosmos-1.0-Diffusion-7B-Text2World (cosmos-1-0-diffusion-7b-text2world) | 1 | No verified current run option |

## tts

36/76 catalogue models have a score and a run option across all comparison sets.

| Model | Results | Remaining gap |
|---|---:|---|
| Sonic 3.6 (cartesia-sonic-3-6) | 0 | No reviewed exact-model result |
| Gemini 3.8 Flash TTS (gemini-3-8-flash-tts) | 0 | No reviewed exact-model result |
| Gemini 3.8 Flash-Lite TTS (gemini-3-8-flash-lite-tts) | 0 | No reviewed exact-model result |
| Eleven v3 Conversational (elevenlabs-v3-conversational) | 0 | No reviewed exact-model result |
| Eleven Turbo v2.5 (elevenlabs-turbo-v2-5) | 1 | Insufficient same-evaluator benchmark overlap for a score |
| MiniMax Speech 2.6 HD (minimax-speech-2-6-hd) | 0 | No reviewed exact-model result |
| Lightning v3.1 Pro (smallest-lightning-v3-1-pro) | 0 | No reviewed exact-model result |
| Octave 2 (hume-octave-2) | 0 | No reviewed exact-model result |
| Azure HD 2.5 (azure-hd-2-5) | 0 | No reviewed exact-model result |
| Polly Generative (amazon-polly-generative) | 0 | No reviewed exact-model result |
| OpenAudio S1 (openaudio-s1) | 4 | Insufficient same-evaluator benchmark overlap for a score |
| XTTS v2 (xtts-v2) | 6 | No verified current run option |
| Magpie TTS Multilingual 357M (magpie-tts-multilingual-357m) | 0 | No reviewed exact-model result |
| Maya1 (maya1) | 0 | No reviewed exact-model result |
| Breeze TTS 2 (breeze-tts-2) | 0 | No reviewed exact-model result |
| OpenVoice V2 (openvoice-v2) | 1 | No verified current run option |
| MetaVoice 1B v0.1 (metavoice-1b-v0-1) | 6 | No verified current run option |
| Tortoise TTS v2 (tortoise-tts-v2) | 6 | No verified current run option |
| Gemini 2.5 Flash Preview TTS (gemini-2-5-flash-preview-tts) | 7 | No verified current run option |
| Gemini 2.5 Pro Preview TTS (gemini-2-5-pro-preview-tts) | 8 | No verified current run option |
| Higgs Audio V2 (higgs-audio-v2) | 5 | No verified current run option |
| GPT-4o mini TTS (gpt-4o-mini-tts) | 12 | No verified current run option |
| Kyutai TTS 1.6B en/fr (kyutai-tts-1-6b-en-fr) | 2 | No verified current run option |
| dots.tts SOAR 2B (dots-tts-soar) | 5 | No verified current run option |
| Seed TTS 2.0 Standard (seed-tts-2-0-standard) | 1 | No verified current run option |
| Azure Neural TTS Xiaoxiao (azure-neural-tts-xiaoxiao) | 1 | No verified current run option |
| MiMo v2.5 TTS (mimo-v2-5-tts) | 1 | No verified current run option |
| Addis Voice 2 (addis-voice-2) | 1 | No verified current run option |
| Azure Ameha Neural (azure-ameha-neural) | 1 | No verified current run option |
| Azure Mekdes Neural (azure-mekdes-neural) | 1 | No verified current run option |
| MMS TTS Amharic (mms-tts-amh) | 1 | No verified current run option |
| ElevenLabs v3 Alpha (elevenlabs-v3-alpha) | 1 | No verified current run option |
| Sonic 3.5 (cartesia-sonic-3-5) | 8 | No verified current run option |
| Qwen3-TTS 12Hz 1.7B Base (qwen3-tts-12hz-1-7b-base) | 13 | No verified current run option |
| VoxCPM2 (voxcpm2) | 9 | No verified current run option |
| ZONOS2 8B (zonos2-8b) | 7 | No verified current run option |
| IndexTTS-2 (indextts-2) | 9 | No verified current run option |
| Sonic 2 (cartesia-sonic-2) | 1 | No verified current run option |
| Sonic (1) (cartesia-sonic) | 1 | No verified current run option |
| Neuphonic neu_hq (neuphonic-neu-hq) | 1 | No verified current run option |

## stt

28/37 catalogue models have a score and a run option across all comparison sets.

| Model | Results | Remaining gap |
|---|---:|---|
| MAI-Transcribe-2 (mai-transcribe-2) | 0 | No reviewed exact-model result |
| Grok Voice Transcribe 2.0 (grok-voice-transcribe-2) | 1 | Insufficient same-evaluator benchmark overlap for a score |
| Solaria-3 (gladia-solaria-3) | 0 | No reviewed exact-model result |
| Granite Speech 5.0 470M TurboCTC (granite-speech-5-0-470m-turboctc) | 1 | Insufficient same-evaluator benchmark overlap for a score |
| Qwen-Audio-3.0-ASR (qwen-audio-3-0-asr) | 2 | No verified current run option |
| Fun-ASR-Flash (fun-asr-flash) | 2 | No verified current run option |
| Tencent Hy-ASR-3.0-preview (tencent-hy-asr-3-0-preview) | 2 | No verified current run option |
| Saarika v2.5 (sarvam-saarika-v2-5) | 1 | No verified current run option |
| Qwen3-ASR-0.6B (qwen3-asr-0-6b) | 2 | No verified current run option |

## Evidence for added routes

- **ministral-3-3b-reasoning**: [source](https://huggingface.co/mistralai/Ministral-3-3B-Reasoning-2512-GGUF/blob/b432f0a2c144af8a1937b06e2ea7f75ebb4d0b31/Ministral-3-3B-Reasoning-2512-Q4_K_M.gguf). Official reasoning GGUF. Decimal GB rounded up to 0.01 GB; download size, not measured total runtime memory. Text serving; no vision projector claimed.
- **ministral-3-8b-reasoning**: [source](https://huggingface.co/mistralai/Ministral-3-8B-Reasoning-2512-GGUF/blob/4413bc9b7b091ddad28101650d1395f5e045a328/Ministral-3-8B-Reasoning-2512-Q4_K_M.gguf). Official reasoning GGUF. Decimal GB rounded up to 0.01 GB; download size, not measured total runtime memory. Text serving; no vision projector claimed.
- **ministral-3-14b-reasoning**: [source](https://huggingface.co/mistralai/Ministral-3-14B-Reasoning-2512-GGUF/blob/fe3b038f30334729263d860d5dadbaa34e0f2a18/Ministral-3-14B-Reasoning-2512-Q4_K_M.gguf). Official reasoning GGUF. Decimal GB rounded up to 0.01 GB; download size, not measured total runtime memory. Text serving; no vision projector claimed.
- **laguna-xs-2**: [source](https://huggingface.co/poolside/Laguna-XS.2/tree/a397bde04501591d0ac3d74a5d9d0a4ec298ffb8). Official Apache-2.0 repository: sum of 14 BF16 safetensors shard sizes, decimal GB rounded up. vLLM 0.21.0+ command from pinned model card, NVIDIA route only. No speed claim.
- **laguna-m-1**: [source](https://huggingface.co/poolside/Laguna-M.1/blob/2bf8a4ab6d2e8e1e0d92a41318532a0fee1640d6/README.md). Official card describes Poolside signup through pool and direct inference.poolside.ai/v1 using poolside/laguna-m.1. No list price verified; remains unknown, excluded from finite price filters.

## Remaining evidence limits

The LLM no-result targets were searched again. EXAONE 4.5 publisher material still declares a custom non-commercial licence; this is not an approved numerical source. Command A+ search results include a Red Hat quantization evaluation, which requires a separate exact-baseline and licence review. No reviewed Grok Build 0.1 benchmark was established in this pass. Unranked evidence is retained; it is not pooled across unrelated evaluators just to fill the table. Older preview/retired model API availability cannot be inferred from a newer replacement.
