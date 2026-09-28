# Seed file format

whatmodel.sh ranks AI models by a composite ability score fit across many benchmarks, filtered to what
runs on the user's hardware or budget, with a one-line command to run each.

## Hard rules
- Only use sources listed as "allowed" in data/sources.json. For a new source, read its terms or licence
  first and propose a ledger entry (see UPDATING.md). Never use artificialanalysis.ai, and never scrape a
  site whose terms forbid it (LMArena scores come from its CC BY 4.0 Hugging Face dataset, not arena.ai).
- Fetch and inspect the primary source. NEVER record a benchmark number from memory or estimate one. If you can't find it on a
  page, omit it. Every number needs the URL of the page it came from.
- Existing models are in data/models.json. Do not duplicate
  them (check ids AND names); reuse their exact `id` if you add results or speeds for them.
- ids: lowercase kebab-case, e.g. "qwen3-30b-a3b", "flux-1-dev", "whisper-large-v3-turbo".
- Validate your output JSON parses with node before finishing. Keep your scratch downloads small.

## Output file shape
{
  "models": [Model...],
  "results": [Result...],
  "speeds": [Speed...]          // optional, measured speeds you came across
}

### Model
{
  "id": "flux-1-dev", "name": "FLUX.1 [dev]", "provider": "Black Forest Labs",
  "category": "llm" | "image" | "video" | "tts" | "stt",
  "released": "YYYY-MM", "open_weights": true, "license": "flux-dev-nc",
  "params_b": 12, "active_b": 12,                     // LLMs: both (MoE: total and active). Others: if known
  "context_k": 128,                                   // LLMs only
  "api": {                                            // or null
    // LLMs:   "price_in": 0.5, "price_out": 1.5  (USD per 1M tokens)
    // others: "price": 0.025, "unit": "image" | "video-second" | "1M-chars" | "audio-minute"
    "url": "https://provider page for this model or its pricing",
    "tps": 85,                                        // LLMs: measured output tokens/sec, from a source the ledger allows
    "speed": 4.2, "speed_unit": "s/image" | "s/video" | "x-realtime",   // others, measured
    "speed_source": "https://..."
  },
  "local": { "variants": [                            // or null if it can't run locally
    { "quant": "q4_k_m" | "fp8" | "bf16" | "gguf-q8" | ...,
      "gb": 20,             // LLMs: download size. Others: memory (VRAM / unified) it needs to run, as stated by a source
      "cmd": "ollama run qwen3:32b",   // the simplest real command that runs it; must be copy-pasteable
      "platform": "any" | "mac" | "nvidia",           // omit for any
      "source": "https://page showing the size/requirement and command" } ] }
}

### Result (one benchmark number)
{ "model": "<id>", "bench": "<benchmark id below>", "score": 0.873, "source": "https://exact page",
  "by": "independent" | "lab", "date": "YYYY-MM-DD", "note": "optional: setting, subset, etc." }
- Accuracy-type scores are fractions 0-1 (0.873, not 87.3). Elo-type scores are the rating number.
  Error rates (WER) are fractions 0-1 (0.052 for 5.2%).
- by: "independent" if a third party ran it (e.g. the LMArena CC BY dataset, open-licensed leaderboards,
  papers not by the model's makers); "lab" if the model's makers report it.
- Record both independent and lab numbers when both are original evaluations. One verified result is
  acceptable; seek broader overlapping evidence, but never invent results or substitute another checkpoint.
  Mark evaluator, protocol, source version and exact model settings. Copied comparison-table rows need
  permission from their actual measurement source; the enclosing paper's licence is not enough.

### Benchmark ids by category
- llm: mmlu-pro, gpqa-diamond, hle, livecodebench, aime-2025, aime-2026, swe-bench-verified, swe-bench-pro,
       lmarena-text (Elo). If a precisely defined benchmark is missing, you may use a new id
       and describe it in your final reply (name, url, accuracy or Elo).
- image: lmarena-image (Elo, LMArena CC BY dataset, text-to-image),
       geneval (0-1), dpg-bench (0-1, i.e. divide the 0-100 score by 100)
- video: lmarena-video (Elo, LMArena CC BY dataset), vbench (0-1)
- tts:  tts-arena (Elo, Hugging Face TTS Arena v2)
- stt:  open-asr-wer (average WER fraction,
       Hugging Face Open ASR Leaderboard)

### Speed (measured, local or API)
{ "model": "<id>", "quant": "q4_k_m", "hardware": "RTX 4090" | "M4 Max (128GB)" | "Ryzen 9 7950X DDR5-6000",
  "kind": "nvidia" | "apple" | "cpu", "offload": "none" | "layers" | "experts",
  "value": 142.3, "unit": "tok/s" | "s/image" | "s/video" | "x-realtime",
  "engine": "llama.cpp b6000 / ollama 0.12 / mlx / diffusers / ComfyUI ...", "settings": "tg128 / 1024x1024 28 steps / 5s 480p ...",
  "source": "https://...", "note": "" }

## Evidence requirements

Numeric API prices require `api.price_source` matching a reviewed licence scope; `api.url` only links
to the provider. `api.provider` names the serving provider and `api.price_note` records rate assumptions.
Unknown prices are omitted, never zero. `context_k` requires `context_source`.
Use `gb_estimated: true` for calculated variant memory. Benchmark input is checked against
`data/sources.json`; seed files cannot approve their own sources. See `docs/SOURCE-AUDIT.md`.
