# llmfit and Strata (2026-10-13)

Prompted by r/LocalLLaMA feedback: a reader runs Qwen3.8-Flash-Next fast with Strata while whatmodel.sh
marked it slow, and asked what [llmfit](https://github.com/AlexsJones/llmfit) uses for speed and quality.

## llmfit (`AlexsJones/llmfit` @ `e897fa5062e0eddff1a136e57483d467c6658617`, MIT)

| Data | What it is | Used? |
|---|---|---|
| `llmfit-core/data/community/` | 920 community runs from `llmfit bench --share` (465 files, about 51 contributors), MIT under CONTRIBUTING.md | **Yes, 92 Ollama runs** |
| `llmfit-core/data/benchmark_cache.json` | 1,286 rows scraped weekly from localmaxxing.com, whose terms keep ownership with its users | No: no open licence, and an aggregator |
| `llmfit-core/data/hf_models.json` | 16,849 models; RAM/VRAM are `weights × bytes × 1.2` (or × 2.0, × 1.1) | No: estimates; parameter and config facts come from Hugging Face directly |
| Speed in `llmfit-core/src/fit.rs` | `bandwidth ÷ (params × bytes) × 0.55 × mode`, MoE and offload variants | No: a formula (its own test reports 20–30% median error) |
| Quality in `fit.rs` and `data/use_case_benchmarks.json` | Parameter-count tiers, family and recency bonuses, 20 uncited family scores | No: editorial estimates |

`npm run llmfit -- <llmfit checkout>` (`scripts/llmfit.ts`) imports the community runs, replacing earlier
ones. Only Ollama runs are used: llmfit times them from Ollama's `eval_count ÷ eval_duration` after a warm-up,
generation only, like our own bench. Its llama.cpp, MLX and vLLM runs divide by wall-clock time with the
prompt included, so they aren't comparable. A run is kept when its Ollama tag is one we list (or that tag
with a standard quant suffix), on one GPU with a name (not "AMD/ATI"), and no faster than the GPU's memory
bandwidth allows. GPUs are matched by name; cards and chips sold in more than one version are told apart by
memory size (VRAM, or RAM on Apple chips: a 48 GB M5 Max is the 40-core one). Unmatched GPUs keep their name
as a label. 61 runs use our exact download on a named GPU with the whole model in GPU memory, so they fill
the board's speed column for that chip; the rest are reference measurements on model pages.

Skipped at this commit: 435 llama.cpp, 43 MLX and 7 vLLM runs (timing), 329 Ollama runs with tags we don't
list (mostly custom local tags), 10 multi-GPU, 3 unnamed GPUs, 1 faster than bandwidth allows.

## Strata (`Niko1221/Strata` @ `a0116b2782a5b82622358c04a06496485d12b2d6`, MIT)

An inference engine for Qwen3.8-Flash-Next only. It keeps the dense weights, the MTP draft layer, the KV cache
and the most-used experts on the graphics card, all routed experts in system RAM (the CPU computes misses),
and the 28.8 GB n-gram table on the SSD. CUDA and HIP (NVIDIA RTX 20–50, AMD RDNA2–4), Windows or Linux, an
AVX2 CPU; no Mac. DeepSeek is not supported (issue #479).

**Downloads added** to `qwen3-8-flash-next`, one per size, from `setup.py` L204–L233 (`download_gb`,
`ram_gb`): Q2_0 66.4 GB, IQ2_XS 68.0, IQ3_XXS 75.8, IQ3_S 83.6, UD-IQ4_XS 93.7. Each has `needs`, the GPU
memory and RAM pairs the docs give:

- 12 GB of VRAM (README L58) with `ram_gb` of RAM, the setup's fit threshold, which is at least the experts
  plus about 10 GB (docs/MODELS.md L70–L77);
- Q2_0 and IQ2_XS also run with 24 GB of VRAM and 32 GB of RAM in the low-RAM mode (MODELS.md L79–L85);
- 8 GB of VRAM "runs, slowly" (docs/DETAILS.md L417), marked `slow`;
- UD-IQ4_XS reads part of its 59.5 GB of experts from the SSD below about 80 GB of RAM (setup.py L224–L228),
  so it runs at full speed from 80 GB and slowly from 48 GB.

`platform: "gpu"` limits them to NVIDIA or AMD graphics cards; `lib/fit.ts` uses a download's `needs`
instead of its size, and shows the RAM of the pair the machine meets.

**Speeds added (36)**, all reference measurements on the model page, not the board's speed column, because
Strata's speed depends on RAM and CPU as well as the GPU (the RTX 3060/DDR4 machine runs at about half the
RTX 5070/DDR5 one's speed):

- the author's 0.1.26 matrix (`bench/results/2026-09-29-speed-0126/matrix.json`): RTX 5070 12 GB, Ryzen 5
  7600, 64 GB DDR5-5200; four sizes × 1K/4K/32K/64K/128K prompts, one run each (52–93 tok/s at 4K); the
  pruned Coder model's rows are left out;
- a community 0.1.41 run (`bench/results/2026-10-09-community-rtx-3060-0141/README.md`): RTX 3060 12 GB,
  i7-12700, 64 GB DDR4-3200; four sizes × 1K/4K/32K/128K prompts, medians of 3 (20–46 tok/s at 4K); its IQ3
  rows used a non-default 20 GiB resident expert pool and say so.

The repo's history was rewritten once (2026-10-06), so each row keeps its source line and the file's SHA-256.

Not used: the README's RX 9070 XT table and "94 / 2,650" figures (no raw file), the "other GPUs
(estimated)" table, multi-GPU, forked or experimental community runs.

## Related

llama.cpp merged MTP for this architecture in
[#29761](https://github.com/ggml-org/llama.cpp/pull/29761) (v0.6.0; it needs a separate draft-head file) and a
GPU cache for experts kept in RAM in [#29887](https://github.com/ggml-org/llama.cpp/pull/29887). Ollama can't
load the GSQ-RCO files yet. Strata's own comparison on an RTX 3060 (same IQ3_XXS file) measured 41.6 tok/s
against 9.1 for tuned llama.cpp 0.6.0, before #29887.
