# Pass 12: GGUF and MLX downloads for open-weight LLMs (2026-10-11)

Data file: `pass12-downloads-2026-10-11.json` (same folder). It has `downloads` (one row per model × format × quant, with `repo`, `sha`, `quant`, `files`, `gb`, `mmproj`, `source`, `identity`, `downloads_count`, plus `tier`, `identity_basis`, `bytes`, `split`, `arch` / `model_type` / `mlx_runtime`, `last_modified`, and `size_flag` / `runtime_note` where they apply) and `not_found` (`{model, model_repo, format, why}`). Nothing under `data/` was edited. Scope and the "already has it" tests were checked against `data/models.json` at `c7534d5e`.

## Coverage

| | Models |
|---|---|
| In scope (llm, open weights, `model_repo` on huggingface.co, missing GGUF or MLX) | 860 |
| Needing a GGUF (no variant cmd with ` -hf `) | 706 |
| Needing an MLX build (no mlx-lm/mlx-vlm variant; Ollama `-mlx` tags don't count) | 858 |
| With neither (searched first) | 704 |
| **GGUF found** | **575 of 706** |
| **MLX found** | **436 of 858** |
| At least one found | 701 (310 got both) |
| Nothing found | 159 |

The 704 models with neither format break down as: 310 got both, 264 GGUF only, 10 MLX only, 120 nothing. Of the 156 that already had a GGUF, 116 got an MLX build.

Rows: 1,146 GGUF (Q4_K_M 568, Q8_0 516, low-bit for ≥65B models 60, other 4-bit 2) and 733 MLX (4bit 392, 8bit 316, and a single fallback quant for 25 models that have neither: 6bit, 5bit, mxfp4, fp16/bf16, 3bit, 4bit-dwq).

## How picks were made

- **Candidates.** Hugging Face API `filter=base_model:<canonical repo>` with the `gguf`/`mlx` tag, every GGUF/MLX repo in the maker's org, and a name search limited to the maker and preferred publishers when those gave nothing usable.
- **Identity** (`identity_basis`). There are four kinds:
  - `base_model` (534 GGUF and 334 MLX models): the candidate's `cardData.base_model` equals the catalogue repo. 31 models matched through a former repo name that Hugging Face redirects, mostly org renames (CohereForAI→CohereLabs, Meta-Llama-3.1→Llama-3.1, THUDM→zai-org, PLLuM's `-2412` rename); `identity` says so.
  - `maker` (19 GGUF, 7 MLX): the maker's own org, with the base name plus a GGUF/MLX suffix.
  - `readme` (21 GGUF, 95 MLX): a maker or preferred-publisher repo with no `base_model` field whose README says "converted to MLX/GGUF format from `<repo>`" or "Original model: `<repo>`". This covers mlx-community's older conversions.
  - `self` (1): the model repo itself holds GGUF files.

  In every case the repo name must be the base name plus only format and quant suffixes. That excludes fine-tunes, merges, abliterated/uncensored builds, distills, QAT builds, `-128K`/`-text` variants and other sizes. Gated or private repos, multi-base merges, an explicit finetune/merge/adapter relation, and licences that contradict the base are also skipped.
- **Publisher order** (`tier`):
  - GGUF: maker, ggml-org, lmstudio-community, unsloth, bartowski, then the most downloaded. The GGUF repo is the first in that order that has Q4_K_M. Without one, it falls back to the first with another 4-bit quant, then Q8_0, then (≥65B only) a low-bit quant, then Q5/Q6.
  - MLX: maker, lmstudio-community, unsloth, mlx-community, then the most downloaded.
  - Models per GGUF tier: other 283, lmstudio-community 117, maker 88, bartowski 60, ggml-org 14, unsloth 13.
  - Models per MLX tier: mlx-community 240, other 104, lmstudio-community 75, maker 17.
- **Quant tags and sizes.**
  - `quant` is the tag in the file name, as `llama-server -hf repo:TAG` takes it (matching is case-insensitive).
  - A 40-row random sample was resolved through Hugging Face's llama.cpp manifest endpoint, with 0 mismatches.
  - Where a tag has both a merged file and split parts (Qwen's own Qwen2.5-Coder repos), the file set is the one the manifest resolves.
  - `gb` sums every file of the quant at the pinned sha, split parts included and mmproj excluded. It has 1 decimal, or 2 when 1 would round to 0.0; `bytes` is exact.
  - For MLX, only top-level `model*.safetensors` are counted, because that is all mlx-lm downloads and loads. That rule drops mlx-community's early `weights.00.safetensors` conversions, and repos holding two shard sets are skipped.
- **Runtime check.**
  - Every GGUF's `general.architecture` was compared with llama.cpp master's `src/llama-arch.cpp`.
  - Every MLX `config.json` `model_type` was compared with mlx-lm and mlx-vlm main.
  - The READMEs of all picked repos were scanned for "does not run upstream / requires PR / fork" warnings, and the PRs they cite were checked on GitHub.

## Moved to not_found after review (15)

- **Architecture not in llama.cpp master:**
  - `deepseek-v4-1-flash` (deepseek41; the repo itself says it doesn't run upstream, llama.cpp#28696 is open)
  - `llama-3-2-11b-vision` (mllama)
  - `solar-open-2` (solar-open2, needs a patched build)
  - `hyperclova-x-seed-32b-think` (greenland)
  - `diffusiongemma-26b-a4b` (diffusion-gemma, llama.cpp#24423 open)
  - `gigachat-3-5-ultra-instruct` (gigachat35)
  - `ax-k2` (axk2)
- **model_type in neither mlx-lm nor mlx-vlm:**
  - `hy3`, `hy3-preview` (hy_v3)
  - `longcat-2-0` (longcat2, mlx-lm#1464 open)
  - `solar-open-2` (solar_open2)
  - `qwen2-5-omni-7b` (qwen2_5_omni)
- **Wrong checkpoint:** `phi-3-mini-128k-instruct` (GGUF + MLX) and `phi-3-mini-4k-instruct` (MLX) are the April 2024 rows. Microsoft replaced those weights in place on 2024-07-01, and the candidate repos re-converted afterwards, on 2024-07-04 (mlx-community) and 2024-07-09/29 (second-state). The April MLX conversions survive only at old revisions, which the JSON names. The `phi-3-mini-4k-instruct-june-2024` MLX rows were kept, and their `identity` records the re-conversion date.

## Caveats for building commands (`runtime_note`, `size_flag`)

- **Unlisted publishers.** `tier: other` covers 283 GGUF and 104 MLX models: mostly TheBloke, mradermacher, MaziyarPanahi and gguf-my-repo uploads for older or niche models. Identity is as strict as for the listed publishers, but 22 GGUF and 86 MLX picks have under 100 downloads in the last 30 days.
- **Old GGUFs.** 110 models' GGUFs (mostly TheBloke) predate 2024-05-01, which is before llama.cpp stored the BPE pre-tokenizer type. BPE-vocab models (Qwen1.5, StarCoder2, StableLM, Command-R, DeepSeek-Coder…) load with a "missing pre-tokenizer type" warning; Llama 2 and Mistral SentencePiece vocabs are fine. Each of these rows has a `runtime_note` saying so.
- **Split GGUFs.** 91 GGUF rows (52 models) are `split: true`. llama.cpp and LM Studio fetch every part, but Hugging Face refuses `ollama run hf.co/...` for sharded tags, so these need a single-file quant or a manual merge for Ollama.
- **mmproj.** 53 models' GGUF repos also hold an `mmproj` vision projector. `llama-server -hf` downloads it on top of `gb`.
- **mlx-vlm only.** 19 models (29 repos) have `mlx_runtime: "mlx-vlm"`: Llama 3.2 Vision, Phi-3/3.5-vision, Aya Vision, GLM-4.6V, DeepSeek-V4-Flash, GLM-5.3-Flash, MiMo-V2.6, Step-3.7-Flash, K2-Horizon, Qwen3.8-Flash-Next, Hy4-preview, Inkling and others. Their model_type is in mlx-vlm but not mlx-lm, so use `mlx_vlm.generate`; LM Studio loads them through mlx-vlm.
- **T5 family.** 8 models (t5-*, flan-t5-*, fastchat-t5) are encoder-decoder. llama.cpp runs them with llama-cli/llama-completion, but llama-server, LM Studio and Ollama don't serve them.
- **Recently merged support.** For Laguna 2.1, Muse Glimmer, Hy4-preview and Nemotron-Labs-3-Puzzle, the READMEs ask for llama.cpp PRs that have since merged. Laguna-XS-2.1 and GLM-5.2 MLX need an mlx-lm newer than the v0.31.3 release. Each has a `runtime_note`.
- **Size flags.** 18 rows have a `size_flag`, where gb is outside 0.7–1.45× of catalogue params × bits. All are tiny models dominated by unquantized embeddings, or VLMs whose vision tower stays at 16 bit, so they are informational.
- **Not run.** Nothing was run. Identity and file lists come from the Hugging Face API at the pinned sha; runtime support comes from the architecture lists and READMEs above.

## Not found (553 model × format rows; 159 models with nothing)

| Reason | GGUF | MLX |
|---|---|---|
| No repo declares this base_model (and none in the maker's org or found by README) | 92 | 360 |
| Repos tagged with the base all failed identity (fine-tunes, other sizes, i1/text/QAT variants, copied `finetune` relation) | 21 | 30 |
| Identity-checked repos have no usable quant (only Q3_K_S/IQ1/odd tags) or unusable files (old `weights.NN` format, wrong size, two shard sets) | 10 | 25 |
| Runtime unsupported (above) | 7 | 5 |
| Wrong checkpoint (Phi-3 April rows) | 1 | 2 |

Examples with nothing found: `deepseek-v3-2-exp`, `deepseek-v4-pro` (0813), `command-a-vision-07-2025`, `falcon-180b-chat` (only an i1 imatrix repo), `chatglm-6b`/`chatglm2-6b`, `gpt-j-6b`, and many Arena-era chat fine-tunes. mlx-community's EXAONE-Deep conversions declare an explicit `base_model_relation: finetune` copied from the original card, so they were rejected under the strict rule.
