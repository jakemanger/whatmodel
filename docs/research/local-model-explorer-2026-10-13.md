# Local Model Explorer data (2026-10-13)

Suggested in [#6](https://github.com/jakemanger/whatmodel/issues/6): the community data behind the
Hugging Face Space [Local Model Explorer](https://huggingface.co/spaces/LocalLLaMA/local-model-explorer).

Data file: `local-model-explorer-2026-10-13.json` (same folder). It lists every `llama_bench` row in the
dataset at revision `3054602af21aa2a797a89f6455c879924a109581`, whether it was used and why not, and the
speed records added to `data/speeds.json`.

## The dataset: llama-bench runs (used)

[`LocalLLaMA/local-model-explorer-data`](https://huggingface.co/datasets/LocalLLaMA/local-model-explorer-data)
is CC BY 4.0 (card front matter and its License section). Visitors to the Space paste `llama-bench`
output; the Space parses the numbers and settings, adds the model and GPU, and flags rows that fail its
checks (`implausible_tps`, `unknown_model`, …). It is the visitors' own measurements, so it fits the
policy for community runs, like our own bench submissions.

At this revision the dataset has 3,912 rows: 3,880 visit summaries, 2 "have you run this?" reports and
30 llama-bench runs. **15 runs were added** (`source_id: speed-local-model-explorer`):

| Model | Quant | Hardware | tok/s |
|---|---|---|---|
| Qwen3.8 27B | UD-IQ4_XS (unsloth) | RX 9070 XT, Vulkan | 16.4 |
| Spark-X2.5 1.7B | Q8_0 (XHToken) | RTX 3090 · RTX 2080 · Radeon 890M | 314 · 166 · 28.9 |
| Spark-X2.5 4B | GSQ-RCO 3bit / 3.5bit (pfeifferj) | H200, RTX 3090, RTX 2080, Radeon 890M (×2) | 16–308 |
| DeepSeek V4.1 Flash | GSQ-RCO 3bit-CPU-Engram (pfeifferj) | 2× H200, 768 GB RAM | 12.1 |

- Each repo's `base_model` on Hugging Face names the model it is attributed to. The GSQ-RCO files are a
  third party's quants, labelled as such; none is a download listed on this site, so all 15 are
  reference measurements on model pages (`selected_download_eligible: false`) and never board speeds.
- `hardware_id` is set only for single, named GPUs (H200, RTX 3090, RTX 2080, and the RX 9070 XT the
  visitor chose in the Space, as the pasted output didn't name it). The Radeon 890M ships in more than
  one Ryzen AI 300 chip and the row doesn't say which, so it has no id; the two-H200 run has none either.
- Every value is below the GPU's memory-bandwidth ceiling for the file size (for example 314 tok/s
  for a 1.8 GB file on a 936 GB/s RTX 3090).

**Not used (15):** 13 rows the Space itself flags (`implausible_tps`, or a model and repo it doesn't
know, e.g. VibeThinker 3B, which isn't on whatmodel.sh either), and 2 CPU-only runs that don't say which
CPU. Visit summaries and reports aren't measurements and weren't used.

Source links pin each row's parquet file at the revision above (`#row-N` is the row in that file). The
Space compacts `data/incoming/` into monthly files, so later revisions move these rows; re-import from
the new files rather than editing the links.

## The Space's snapshots: KV cache sizes (used)

The Space's app, [`codelion/local-model-explorer`](https://huggingface.co/spaces/codelion/local-model-explorer)
(MIT, revision `405c793036543e306be10de31b8187d067cdc149`), bundles three snapshots read from Hugging Face:
GGUF repos with their base model (`catalogue`), every quant's file size (`files`, 1,979 repos) and each
model's geometry from its GGUF header (`geometry`, 1,126 models: layers, KV cache bytes per token per
layer with sliding windows, MoE expert sizes).

- **File sizes:** nothing to gain. Our download sizes already come from the Hugging Face file listings
  at the pinned commits; they carry `gb_estimated` because those listings aren't a registered
  measurement source.
- **KV cache:** used. `npm run kv` (`scripts/kv.ts`) reads the geometry snapshot and writes
  `data/kv.json`: per model, f16 KV bytes per token summed over full-attention layers and per sliding
  window, and the vocabulary size. 229 of our open models with a download match an entry (by
  `model_repo`, or a GGUF repo in a llama.cpp command); 212 are kept. The other 17 (DeepSeek V4 Pro and
  Flash, Kimi K2.6 and K3, GLM 5.2 and 5.3, Qwen3.8 Flash Next and others) only have a geometry the Space
  estimated from the parameter count, so they keep the flat allowance.
- **MoE experts:** `expert_bytes` would allow an "experts in system RAM" placement (`--n-cpu-moe`). Not
  used.

`lib/fit.ts` now sizes the memory a download needs as the download, plus the KV cache for an 8k-token
conversation as llama.cpp sizes it (sliding-window layers hold llama-server's 4 slots' windows plus a
512-token batch), plus llama.cpp's scratch buffers (logits for a 512-token batch, 0.3 GB, 4 kB per
token), following the Space's own `fit.py`. Models without a geometry keep `5% of the download + 1.5 GB`.
Against that allowance, real KV cache plus about 0.5 GB of buffers for the 4-bit downloads of the matched
models differs by a median of −0.8 GB at 8k (more than 2 GB short for 12 models, e.g. Command R: 10.7 GB
of KV, allowed 2.6) and +1.3 GB at 32k (more than 2 GB short for 99).
