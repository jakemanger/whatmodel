# Metadata gaps, 2026-10-07

Proposed fills for the 270-model metadata-gap list: 286 missing fields across API price, context window, release month and parameter count. Listed models were done first. The data is in `metadata-gaps-2026-10-07.json` (`patches`, `ledger`, `skipped`). Nothing has been applied to `data/`.

| Field | Filled (listed / unlisted) | Skipped (listed / unlisted) |
| --- | --- | --- |
| price | 13 / 0 | 20 / 0 |
| context | 51 / 0 | 17 / 0 |
| params | 23 / 13 | 44 / 26 |
| released | 16 / 15 | 13 / 35 |

## Sources

- **Price.** Prices come from the vendor's or host's own pages: OpenAI pricing, Cohere pricing FAQ, Arcee pricing docs, Tencent Cloud TokenHub (international USD table), Alibaba Model Studio pricing, Replicate per-output billing and Rev AI pricing. The rest come from models.dev at revision `6b32416` (MIT, first-party provider TOMLs only).
- **Context.** The 50 patches from the interrupted run were re-checked against their cached fetches: each pinned sha matches `x-repo-commit` and each quoted value or text is present. They follow the existing "configured maximum" convention. Yi-Lightning was added (16K on 01.AI's own docs, with a note that the endpoint now routes to other models).
- **Params.** Parameter counts come from maker-stated figures or from HF safetensors metadata. Where possible we use the HF API `safetensors.total` at a pinned revision. Otherwise we count from range-read safetensors headers ("OUR COUNT"). For diffusion models we count the denoiser (UNet/DiT) only, as `qwen-image` and `sd-3-medium` do. Six rows already had a `params_note` but no value; they get the value the note describes, after we checked its source.
- **Released.** Release months come from vendor changelogs and announcements, press releases (Kuaishou via GLOBE NEWSWIRE and its HKEX results filings), Coqui GitHub release tags, arXiv v1 dates and HF `createdAt` (the precedent of `speechbrain-asr-wav2vec2-librispeech`).

## Ledger

- New `first-party-rev` (rev.ai/pricing).
- Nine new model-card entries for configured-context sources: PRIME-RL, Berkeley NEST, Nexusflow, Upstage, InternLM, LLaVA, Phind, WizardLM and Open Thoughts.
- `add_match` additions to existing entries: OpenAI, Cohere, Arcee, Tencent Cloud, Replicate, DeepSeek, Meta, LMSYS, Nous Research, AI2, EleutherAI, Together, 01.AI, Hugging Face, IBM, and models-dev at revision `6b32416`.
- With these applied, all 64 price and context sources resolve to allowed entries (checked with `sourceIn`).

## For the owner

- **Command A+ price skipped.** models.dev lists $2.50/$10, but Cohere's own page says the model is free until rate limits are reached, with production use through Model Vault.
- **Promotional zero prices skipped.** Laguna M.1 and KAT-Coder-Pro V1 are free promotions, not list prices.
- **Unit conversions not done.** Per-video fal prices, token-billed Gemini TTS, Zonos per-minute pricing and CNY-only prices (HY-Vision, Yi-Lightning) would each need our own conversion, so none were derived.
- **Kling.** Kling's release notes are client-rendered and ir.kuaishou.com returns 403. Months come from Kuaishou's press releases and HKEX results filings. O1, O3 and Image 2.1 are still undated.
- **Arena-only entries.** Experimental or comparison snapshots without a vendor date were skipped. Suffixes in model names (e.g. `-0111`, `-202506`) were not used as dates.
