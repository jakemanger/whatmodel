# Maker-only models, pass 5, 2026-10-08

Machine-readable output: `pass5-maker-only-2026-10-08.json`. Nothing in `data/` was edited.

## Outcome

No independent rows found for any of the 79 maker-only models. `results`, `benchmarks`, `ledger` and `models` are empty.

Tooling was limited: web search, arXiv API (abstract-level only) and the HF API. There was no full-text paper search, so independent papers that merely report a model in a table were not discoverable. Work went top-rank first; coverage thins below rank 10.

## Top cases

- **Command A+ (#51 LLM):** nothing outside Cohere's launch post. No arXiv paper, open repo or licensed leaderboard includes it. Only banned aggregators list it.
- **Voxtral TTS (#3 TTS):** only Mistral's paper (2603.25551). No paper that runs it was found.
- **OpenAudio S1 (#10 TTS):** only Fish Audio's numbers. Independent CC BY audit 2608.00545 covers Fish-Speech-S2, not S1.

## Dead ends added

Cerebras-GPT 2304.03208 (non-exclusive licence), SWE-rebench dataset (tasks only), TontaubeV1 2609.08703 (default arXiv licence, no Voxtral/S1), TTS-Arena-V2 (no licence).

## Open decisions

- Whether to try a full-text search route (e.g. Semantic Scholar or Google Scholar citations of 2603.25551) for papers that rerun Voxtral TTS.
- Whether the owner wants a down-weight for maker-only models in `lib/score.ts` since sourcing cannot fix them now.
