# Frozen original-model gap bundle

`prices-gap-ready.json`: **12 price additions, 17 URL-only recoveries and 36 context additions**, affecting 57 original models. 1079 validation checks passed. No shared data/app edits, pushes or workflows.

Prices: Mistral Small 4 and Ministral 3 (3B/8B/14B); Ling 3.0 Flash and Granite 4.2 (3B/30B) on DeepInfra; Qwen3-30B-A3B-Instruct-2507 FP8 on Nebius; FLUX.1 dev/schnell, Inworld Realtime TTS 2 and HappyHorse 1.0 on Replicate.

Run/API links recovered for speech (Kokoro, Qwen3-ASR, Parakeet v3), images (Seedream 4/5 Pro, Wan 2.6 T2I, GPT Image Sunburst/Flare, Qwen Image/2512, SD3.5, SDXL, HunyuanImage 3, Z-Image) and video (Mochi via Replicate, HunyuanVideo, CogVideoX). Unknown prices stay absent. Optimized serving variants are labelled.

## Integration

Match exact model id. For each API patch, require all prices absent and the entire existing API object equal `expected_api`; then merge only supplied `api` fields. Legacy unpriced provider/aggregator URL changes are explicit in `url_change`. Skip on any conflict. For context, require both `context_k` and `context_source` absent, then merge only `context_k`, `context_source`, `context_note`. Preserve all other fields. No existing priced API or known context changes in the dry run.

Retain `api.price_note` with the rate: units, currency, settings, exclusions and attribution are there because the UI reads API fields. URL-only notes are also in evidence; the present UI hides `price_note` when no `price_source` exists, so do not fabricate a price source. Keep licence/provenance alongside integration.

## Reuse and evidence

Full notices: `prices-gap-NOTICE.txt`. Per-source pins and SHA-256 evidence: `prices-gap-ready.json`; selected reusable catalogue cells: `prices-gap-selected-evidence.json`. `prices-gap-manifest.json` pins artifact and evidence files. Raw provider HTML is private audit evidence, not permission to republish those pages. The dataset uses source-specific MIT / Apache-2.0 / CC-BY-4.0; no uniform MIT claim and no new Cloudflare tranche.

LiteLLM prices use exact dated provider identifiers and independent provider corroboration. Bertrande's explicit CC BY 4.0 export grant covers only selected direct-provider observations, retaining observation dates, upstream URLs and hashes. No AA/OpenRouter observations or performance data included. Repository model-card/config context includes native/default/YaRN distinctions. Google docs provide their own CC BY 4.0 grant. Model-weight licences are not assumed to cover unrelated web pages.

## Audit and remaining gaps

Before: {'original_models': 340, 'original_priced': 169, 'original_with_context': 147, 'context_present_in_original_context_subset': 144, 'original_context_subset_size': 206, 'original_without_api_url': 95}. After conditional application: {'original_models': 340, 'original_priced': 181, 'original_with_context': 183, 'context_present_in_original_context_subset': 180, 'original_context_subset_size': 206, 'original_without_api_url': 74}.

Full lists: `prices-gap-current-gaps.json`. Wan 3 price held because current provider billing and README conflict. Retired fal Mochi/LTX-2 endpoints are excluded; Mochi has a separate verified Replicate route. Wan 2.1 14B is held because the inspected endpoint does not prove model size. Speech provider tariffs without an accepted exact licensed rate record remain unpriced. No token/character or GPU-time/output conversion.

`prices-gap-validation.json` records read-only integration simulation and source-hash checks. These are documentation/catalogue checks, not paid inference or uptime tests.
