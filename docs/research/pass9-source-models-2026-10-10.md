# Pass 9: models our licensed LLM sources measure but the catalogue lacked (2026-10-10)

Candidates only; nothing in `data/` was edited. JSON: `docs/research/pass9-source-models-2026-10-10.json` (264 models, 574 results: 522 independent / 52 lab, 15 ledger add_match actions, no new benchmark ids).

**Method.** Every pinned file of the in-scope ledger sources (all except LMArena) was re-read; each printed label was checked against the notes of that source's existing rows, and unmatched labels were resolved to an exact Hugging Face repo (HF API: canonical id after redirects, pinned sha, createdAt, licence tag, safetensors parameter count, weight-file sizes) or to a dated / fixed vendor API id. For each model, all of its rows across these sources were built with the existing note conventions of each source (same bench ids, same picking rules: BFCL FC-first and newest v3 snapshot, Aider best full run, Open PT hub/main/bf16, BRIDGE Thinking row, Epoch highest effort, etc.).

**Run options.** Open-weight entries get one verified transformers command for the exact repo (gb = the repo's weight files, `gb_estimated: true`; `trust_remote_code=True` when the config has an auto_map; gated repos say so), plus the ggml-org GGUF for Qwen2-VL 2B. No ollama tags were added. Context windows only where the maker's pinned config.json falls under an existing `first-party-<vendor>` facts entry (31 models; add_match actions below); others leave context unset. Retired API snapshots are comparison-only (15). Seven open models are comparison-only because no command could be verified (OpenELM, Hulu-Med x3, Jais 2 x2, SkillMix with no weights in the repo).

**Validation.** Copied the repo, ran `apply-pass2.mjs` + `npm run import` + `node scripts/check.ts --validate-only`: passes (264 models, 574 results imported; only icon warnings). `npm run score-coverage` in the copy: all 264 proposed models land on the main llm scale.

**Overlap with other pass-9 files.** 23 models I found were also proposed in `pass9-llm-releases-2026-10-10.json` (Hermes 3 70B/405B, Qwen1.5 0.5B/1.8B Chat, Qwen2-Math 72B, EuroLLM 1.7B/9B, Apertus x3, Granite 4.0 H Tiny/Micro, Qwen2-VL 2B, MedGemma x3, Fanar-1-9B, Command R7B Arabic, Falcon 7B/40B Instruct, Sky-T1, FireFunction v2, NexusRaven V2). Those entries are dropped here; all 34 of my rows for them were exact duplicates of rows in that file and were dropped too. Re-run `p9scripts/assemble.py` before merging if the other files change.

## Models proposed

### Function-calling (BFCL) (33)

| id | rows | sources |
|---|---|---|
| `llama-xlam-2-70b-fc-r` | 2 | BFCL 2 |
| `xlam-2-32b-fc-r` | 2 | BFCL 2 |
| `llama-xlam-2-8b-fc-r` | 2 | BFCL 2 |
| `xlam-2-3b-fc-r` | 2 | BFCL 2 |
| `xlam-2-1b-fc-r` | 2 | BFCL 2 |
| `watt-tool-70b` | 1 | BFCL |
| `watt-tool-8b` | 1 | BFCL |
| `toolace-2-llama-3-1-8b` | 2 | BFCL 2 |
| `toolace-8b` | 1 | BFCL |
| `bitagent-8b` | 1 | BFCL |
| `bitagent-bounty-8b` | 1 | BFCL |
| `coalm-405b` | 1 | BFCL |
| `coalm-70b` | 2 | BFCL 2 |
| `coalm-8b` | 2 | BFCL 2 |
| `functionary-medium-v3-1` | 1 | BFCL |
| `functionary-small-v3-1` | 1 | BFCL |
| `hammer2-1-7b` | 2 | BFCL 2 |
| `hammer2-1-3b` | 2 | BFCL 2 |
| `hammer2-1-1-5b` | 2 | BFCL 2 |
| `hammer2-1-0-5b` | 2 | BFCL 2 |
| `haha-7b` | 1 | BFCL |
| `deepseek-coder-v2-0724` | 6 | BFCL, ZeroEval 4, Aider edit |
| `firefunction-v1` | 1 | BFCL |
| `granite-20b-functioncalling` | 2 | BFCL 2 |
| `hermes-2-pro-llama-3-8b` | 2 | BFCL, Open PT |
| `hermes-2-pro-mistral-7b` | 1 | BFCL |
| `thinkagent-1b` | 1 | BFCL |
| `ling-lite-1-5` | 1 | BFCL |
| `nanbeige4-3b-thinking-2511` | 2 | BFCL, EQ-Bench 3 |
| `arch-agent-32b` | 1 | BFCL |
| `arch-agent-3b` | 1 | BFCL |
| `arch-agent-1-5b` | 1 | BFCL |
| `rzn-t` | 1 | BFCL |

### Coding (EvalPlus / BigCodeBench) (36)

| id | rows | sources |
|---|---|---|
| `opencoder-8b-instruct` | 4 | EvalPlus 4 |
| `artigenz-coder-ds-6-7b` | 3 | EvalPlus 3 |
| `ajibawa-code-13b` | 2 | EvalPlus 2 |
| `code-290k-6-7b-instruct` | 2 | EvalPlus 2 |
| `ajibawa-code-33b` | 2 | EvalPlus 2 |
| `python-code-13b` | 2 | EvalPlus 2 |
| `openhermes-2-5-code-290k-13b` | 3 | EvalPlus 3 |
| `codeqwen1-5-7b` | 4 | EvalPlus 3, BigCodeBench |
| `llama-3-8b-base` | 5 | EvalPlus 3, Persian, BigCodeBench |
| `llama-3-70b-base` | 2 | Open PT, BigCodeBench |
| `wavecoder-ultra-6-7b` | 3 | EvalPlus 3 |
| `magicoder-s-cl-7b` | 3 | EvalPlus 3 |
| `mistral-7b-codealpaca-lora` | 2 | EvalPlus 2 |
| `mistralhermes-codepro-7b-v1` | 3 | EvalPlus 3 |
| `opencodeinterpreter-ds-33b` | 3 | EvalPlus 3 |
| `opencodeinterpreter-ds-6-7b` | 3 | EvalPlus 3 |
| `starchat2-15b-v0-1` | 3 | EvalPlus 3 |
| `starcoder2-15b-instruct-v0-1` | 5 | EvalPlus 3, BigCodeBench 2 |
| `starcoderbase-1b` | 2 | EvalPlus 2 |
| `whiterabbitneo-33b-v1` | 3 | EvalPlus 3 |
| `wizardcoder-15b-v1-0` | 3 | EvalPlus 3 |
| `xwincoder-34b` | 3 | EvalPlus 3 |
| `code-millenials-34b` | 3 | EvalPlus 3 |
| `dolphin-2-6-mixtral-8x7b` | 3 | EvalPlus 3 |
| `speechless-code-mistral-7b-v1-0` | 4 | EvalPlus 3, Open PT |
| `speechless-codellama-34b-v2-0` | 3 | EvalPlus 3 |
| `speechless-coder-ds-6-7b` | 3 | EvalPlus 3 |
| `speechless-coding-7b-16k-tora` | 3 | EvalPlus 3 |
| `speechless-starcoder2-15b` | 3 | EvalPlus 3 |
| `speechless-starcoder2-7b` | 3 | EvalPlus 3 |
| `xdan-l1-chat-rl-v1` | 3 | EvalPlus 3 |
| `zyte-1b` | 3 | EvalPlus 3 |
| `yi-1-5-34b-base` | 2 | Open PT, BigCodeBench |
| `yi-1-5-9b-base` | 2 | Open PT, BigCodeBench |
| `yi-1-5-6b-base` | 2 | Open PT, BigCodeBench |
| `mixtral-8x22b-v0-1` | 1 | BigCodeBench |

### Persian (7)

| id | rows | sources |
|---|---|---|
| `llama-3-1-8b-base` | 1 | Persian |
| `qwen2-57b-a14b-instruct` | 2 | Open PT, Persian |
| `hormoz-8b` | 1 | Persian |
| `dorna2-llama3-1-8b-instruct` | 1 | Persian |
| `dorna-llama3-8b-instruct` | 1 | Persian |
| `persianmind-v1-0` | 1 | Persian |
| `maral-7b-alpha-1` | 1 | Persian |

### Chat fine-tunes (WildBench / ZeroEval / AlpacaEval / Arena-Hard) (66)

| id | rows | sources |
|---|---|---|
| `llama-3-instruct-8b-simpo-v0-2` | 4 | Open PT, ZeroEval 2, WildBench |
| `llama-3-instruct-8b-simpo` | 3 | AlpacaEval, Open PT, WildBench |
| `gemma-2-9b-it-dpo` | 3 | AlpacaEval, Open PT, WildBench |
| `deepseek-v2-chat-0628` | 6 | ZeroEval 4, WildBench, Aider edit |
| `snorkel-mistral-pairrm-dpo` | 2 | AlpacaEval, Arena-Hard v0.1 |
| `hermes-2-theta-llama-3-8b` | 2 | Open PT, WildBench |
| `llama-3-8b-magpie-align-v0-1` | 1 | WildBench |
| `llama-3-instruct-8b-simpo-expo` | 3 | AlpacaEval, Open PT, WildBench |
| `starling-lm-7b-beta-expo` | 2 | AlpacaEval, WildBench |
| `neo-7b-instruct-v0-1` | 1 | WildBench |
| `neo-7b-instruct-v0-1-expo` | 1 | WildBench |
| `gemma-2-9b-it-wpo-hb` | 1 | AlpacaEval |
| `llama3-instruct-8b-wpo-hb-v2` | 1 | AlpacaEval |
| `fusechat-gemma-2-9b-instruct` | 1 | AlpacaEval |
| `fusechat-llama-3-1-8b-instruct` | 1 | AlpacaEval |
| `fusechat-qwen-2-5-7b-instruct` | 1 | AlpacaEval |
| `fusechat-llama-3-2-3b-instruct` | 1 | AlpacaEval |
| `fusechat-llama-3-2-1b-instruct` | 1 | AlpacaEval |
| `llama3-pbm-nova-70b` | 1 | AlpacaEval |
| `storm-7b` | 1 | AlpacaEval |
| `gemma-2-9b-it-sppo-iter3` | 2 | AlpacaEval, Open PT |
| `llama-3-instruct-8b-sppo-iter3` | 2 | AlpacaEval, Open PT |
| `mistral7b-pairrm-sppo` | 2 | AlpacaEval, Open PT |
| `llama-3-8b-instruct-rainbowpo` | 1 | AlpacaEval |
| `rebel-llama-3-armo-iter-1` | 1 | AlpacaEval |
| `rebel-llama-3` | 1 | AlpacaEval |
| `infinity-instruct-7m-gen-llama3-1-70b` | 1 | AlpacaEval |
| `infinity-instruct-7m-gen-llama3-1-8b` | 2 | AlpacaEval, Open PT |
| `infinity-instruct-7m-gen-mistral-7b` | 1 | AlpacaEval |
| `infinity-instruct-3m-0625-llama3-70b` | 1 | AlpacaEval |
| `infinity-instruct-3m-0625-llama3-8b` | 2 | AlpacaEval, Open PT |
| `infinity-instruct-3m-0625-mistral-7b` | 2 | AlpacaEval, Open PT |
| `infinity-instruct-3m-0625-qwen2-7b` | 2 | AlpacaEval, Open PT |
| `infinity-instruct-3m-0625-yi-1-5-9b` | 2 | AlpacaEval, Open PT |
| `infinity-instruct-3m-0613-llama3-70b` | 1 | AlpacaEval |
| `infinity-instruct-3m-0613-mistral-7b` | 2 | AlpacaEval, Open PT |
| `llama-3-8b-instruct-skillmix` | 1 | AlpacaEval |
| `gpo-llama-3-8b-instruct-gpm-2b` | 1 | AlpacaEval |
| `sppo-llama-3-8b-instruct-gpm-2b` | 1 | AlpacaEval |
| `fsfairx-zephyr-chat-v0-1` | 1 | AlpacaEval |
| `mistral7b-pairrm-sppo-expo` | 2 | AlpacaEval, Open PT |
| `internlm2-chat-20b-expo` | 1 | AlpacaEval |
| `internlm2-chat-7b-expo` | 1 | AlpacaEval |
| `tulu-2-dpo-70b-expo` | 1 | AlpacaEval |
| `tulu-2-dpo-13b-expo` | 1 | AlpacaEval |
| `tulu-2-dpo-7b-expo` | 1 | AlpacaEval |
| `starling-lm-7b-alpha-expo` | 1 | AlpacaEval |
| `zephyr-7b-alpha-expo` | 1 | AlpacaEval |
| `zephyr-7b-beta-expo` | 1 | AlpacaEval |
| `contextual-kto-mistral-pairrm` | 1 | AlpacaEval |
| `lmcocktail-10-7b-v1` | 2 | AlpacaEval 2 |
| `deita-7b-v1-0` | 3 | AlpacaEval 2, Open PT |
| `causallm-14b` | 2 | AlpacaEval 2 |
| `mistral-orpo-beta` | 1 | AlpacaEval |
| `minotaur-13b-fixed` | 2 | AlpacaEval 2 |
| `vicuna-13b-v1-3` | 2 | AlpacaEval 2 |
| `vicuna-7b-v1-3` | 2 | AlpacaEval 2 |
| `platolm-7b` | 2 | AlpacaEval 2 |
| `nous-hermes-13b` | 3 | AlpacaEval 2, Open PT |
| `minichat-1-5-3b` | 3 | AlpacaEval 2, Open PT |
| `minichat-3b` | 3 | AlpacaEval 2, Open PT |
| `baize-v2-13b` | 2 | AlpacaEval 2 |
| `baize-v2-7b` | 2 | AlpacaEval 2 |
| `ghost-7b-alpha` | 2 | AlpacaEval 2 |
| `oasst-pythia-12b-sft-v8-7k-steps` | 2 | AlpacaEval 2 |
| `baichuan-13b-chat` | 2 | AlpacaEval 2 |

### Other (Vectara / Aider / EQ-Bench / LiveBench) (12)

| id | rows | sources |
|---|---|---|
| `vicuna-7b-v1-5-16k` | 1 | LiveBench |
| `yi-6b-chat` | 2 | Open PT, LiveBench |
| `openhands-lm-32b-v0-1` | 1 | Aider polyglot |
| `dracarys2-72b-instruct` | 1 | Aider edit |
| `hivemind-32b-preview` | 1 | EQ-Bench 3 |
| `orca-2-13b` | 1 | Vectara |
| `neural-chat-7b-v3-3` | 2 | Open PT, Vectara |
| `internlm3-8b-instruct` | 1 | Vectara |
| `openelm-3b-instruct` | 1 | Vectara |
| `deepseek-tng-r1t2-chimera` | 1 | Vectara |
| `jamba-1-6-large` | 1 | Vectara |
| `jamba-1-6-mini` | 1 | Vectara |

### Polish (CPTUB) (28)

| id | rows | sources |
|---|---|---|
| `internlm2-chat-20b` | 4 | AlpacaEval, Open PT, CPTUB, Arena-Hard v0.1 |
| `bielik-11b-v2-0-instruct` | 2 | Open PT, CPTUB |
| `bielik-11b-v2-1-instruct` | 2 | Open PT, CPTUB |
| `bielik-11b-v2-2-instruct` | 2 | Open PT, CPTUB |
| `bielik-11b-v2-5-instruct` | 1 | CPTUB |
| `bielik-11b-v2-6-instruct` | 1 | CPTUB |
| `bielik-11b-v3-0-instruct` | 1 | CPTUB |
| `bielik-4-5b-v3-0-instruct` | 1 | CPTUB |
| `bielik-1-5b-v3-0-instruct` | 1 | CPTUB |
| `bielik-minitron-7b-v3-0-instruct` | 1 | CPTUB |
| `bielik-7b-instruct-v0-1` | 1 | CPTUB |
| `llama-pllum-70b-chat-2412` | 1 | CPTUB |
| `llama-pllum-70b-instruct-2412` | 1 | CPTUB |
| `llama-pllum-8b-chat-2412` | 1 | CPTUB |
| `llama-pllum-8b-instruct-2412` | 1 | CPTUB |
| `pllum-12b-chat-2412` | 1 | CPTUB |
| `pllum-12b-instruct-2412` | 1 | CPTUB |
| `pllum-12b-nc-chat-2412` | 1 | CPTUB |
| `pllum-12b-nc-instruct-2412` | 1 | CPTUB |
| `pllum-8x7b-chat-2412` | 1 | CPTUB |
| `pllum-8x7b-instruct-2412` | 1 | CPTUB |
| `pllum-8x7b-nc-chat-2412` | 1 | CPTUB |
| `pllum-8x7b-nc-instruct-2412` | 1 | CPTUB |
| `pllum-12b-nc-chat-2507` | 1 | CPTUB |
| `pllum-12b-nc-instruct-2507` | 1 | CPTUB |
| `openchat-3-5-0106-gemma` | 2 | Open PT, CPTUB |
| `trurl-2-13b-academic` | 1 | CPTUB |
| `h2o-danube2-1-8b-chat` | 2 | Open PT, CPTUB |

### Long-context (RULER) (9)

| id | rows | sources |
|---|---|---|
| `glm-4-9b-chat-1m` | 3 | Open PT, RULER 2 |
| `llama-3-8b-prolong-512k-instruct` | 3 | Open PT, RULER 2 |
| `megabeam-mistral-7b-512k` | 3 | Open PT, RULER 2 |
| `llama-3-70b-instruct-gradient-1048k` | 2 | RULER 2 |
| `llama-3-8b-instruct-gradient-1048k` | 2 | RULER 2 |
| `yi-34b-200k` | 3 | Open PT, RULER 2 |
| `internlm2-5-7b-chat-1m` | 3 | Open PT, RULER 2 |
| `chatglm3-6b-128k` | 3 | Open PT, RULER 2 |
| `lwm-text-chat-1m` | 2 | RULER 2 |

### Medical (BRIDGE) (24)

| id | rows | sources |
|---|---|---|
| `baichuan-m1-14b-instruct` | 1 | BRIDGE |
| `baichuan-m2-32b` | 1 | BRIDGE |
| `k2-think` | 1 | BRIDGE |
| `meditron-7b` | 1 | BRIDGE |
| `meditron-70b` | 1 | BRIDGE |
| `llama3-openbiollm-8b` | 1 | BRIDGE |
| `llama3-openbiollm-70b` | 1 | BRIDGE |
| `mmed-llama-3-8b` | 1 | BRIDGE |
| `llama-3-1-8b-ultramedical` | 1 | BRIDGE |
| `llama-3-70b-ultramedical` | 1 | BRIDGE |
| `biomistral-7b` | 1 | BRIDGE |
| `hulu-med-7b` | 1 | BRIDGE |
| `hulu-med-14b` | 1 | BRIDGE |
| `hulu-med-32b` | 1 | BRIDGE |
| `biomni-r0-32b-preview` | 1 | BRIDGE |
| `antangelmed` | 1 | BRIDGE |
| `qwenlong-l1-32b` | 1 | BRIDGE |
| `yi-1-5-9b-chat-16k` | 2 | Open PT, BRIDGE |
| `yi-1-5-34b-chat-16k` | 2 | Open PT, BRIDGE |
| `huatuogpt-o1-7b` | 1 | BRIDGE |
| `huatuogpt-o1-8b` | 1 | BRIDGE |
| `huatuogpt-o1-70b` | 1 | BRIDGE |
| `huatuogpt-o1-72b` | 1 | BRIDGE |
| `medreason-8b` | 1 | BRIDGE |

### Arabic / Hindi (Inception) (26)

| id | rows | sources |
|---|---|---|
| `falcon-h1-34b-instruct` | 3 | Open PT, Inception 2 |
| `falcon-h1-7b-instruct` | 3 | Open PT, Inception 2 |
| `falcon-h1-3b-instruct` | 3 | Open PT, Inception 2 |
| `falcon-h1-1-5b-instruct` | 3 | Open PT, Inception 2 |
| `jais-family-590m-chat` | 1 | Inception |
| `jais-family-1p3b-chat` | 1 | Inception |
| `jais-family-2p7b-chat` | 1 | Inception |
| `jais-family-6p7b-chat` | 2 | Inception 2 |
| `jais-family-13b-chat` | 2 | Inception 2 |
| `jais-family-30b-8k-chat` | 2 | Inception 2 |
| `jais-family-30b-16k-chat` | 2 | Inception 2 |
| `jais-adapted-7b-chat` | 1 | Inception |
| `jais-adapted-13b-chat` | 1 | Inception |
| `jais-adapted-70b-chat` | 1 | Inception |
| `jais-2-70b-chat` | 1 | Inception |
| `jais-2-8b-chat` | 1 | Inception |
| `acegpt-13b-chat` | 2 | Inception 2 |
| `acegpt-7b-chat` | 2 | Inception 2 |
| `acegpt-v2-8b-chat` | 1 | Inception |
| `silma-9b-instruct-v1-0` | 2 | Inception 2 |
| `calme-2-1-qwen2-5-72b` | 1 | Inception |
| `calme-2-2-qwen2-5-72b` | 1 | Inception |
| `sarvam-m` | 1 | Inception |
| `airavata` | 1 | Inception |
| `llama-3-nanda-10b-chat` | 1 | Inception |
| `krutrim-2-instruct` | 1 | Inception |

### Base models (StableLM eval files) (8)

| id | rows | sources |
|---|---|---|
| `qwen-7b-base` | 11 | Open PT, StableLM evals 10 |
| `qwen-7b-chat` | 11 | Open PT, StableLM evals 10 |
| `baichuan2-7b-base` | 11 | Open PT, StableLM evals 10 |
| `pythia-2-8b-deduped` | 12 | Open PT, StableLM evals 11 |
| `open-llama-3b-v2` | 12 | Open PT, StableLM evals 11 |
| `open-llama-7b-v2` | 12 | Open PT, StableLM evals 11 |
| `stablelm-base-alpha-3b-v2` | 12 | Open PT, StableLM evals 11 |
| `stablelm-base-alpha-7b-v2` | 12 | Open PT, StableLM evals 11 |

### Retired API snapshots (comparison-only) (15)

| id | rows | sources |
|---|---|---|
| `gemini-1-5-pro-exp-0801` | 5 | ZeroEval 4, LiveBench |
| `gemini-1-5-pro-exp-0827` | 6 | ZeroEval 4, LiveBench, Aider edit |
| `gemini-1-5-flash-exp-0827` | 6 | ZeroEval 4, LiveBench, Aider edit |
| `gemini-1-5-flash-8b-exp-0827` | 2 | LiveBench, Aider edit |
| `gemini-1-5-flash-8b-exp-0924` | 1 | Aider edit |
| `gemini-exp-1114` | 1 | Aider edit |
| `gemini-exp-1121` | 1 | Aider edit |
| `gemini-exp-1206` | 2 | Aider polyglot, Aider edit |
| `gemini-2-0-flash-exp` | 2 | Aider polyglot, Aider edit |
| `mistral-small-2402` | 4 | LiveBench, BFCL, BigCodeBench 2 |
| `codestral-2501` | 1 | Aider polyglot |
| `reka-core-20240501` | 6 | ZeroEval 5, WildBench |
| `gpt-3-5-turbo-16k-0613` | 2 | AlpacaEval 2 |
| `claude-instant-1-2` | 1 | AlpacaEval |
| `codex-mini-latest` | 1 | WebApp1K |

## Rows for catalogued models (23)

Labels these sources print for models that are already catalogued but were never mapped: Epoch (claude-haiku-5-5 x7 and deepseek-v4-1-flash x6, both catalogued after the last Epoch import; mistral-large-4 via its API alias mistral-large-4-0), BigCodeBench (Granite Code 34B/3B instruct and base, catalogued since the BigCodeBench import), CPTUB / Open PT (bielik-11b-v2-3-instruct; CPTUB by: lab), Open Persian / CPTUB (gemini-2.0-flash-lite-001). The Persian gpt-3.5-turbo-0125 row turned out to exist already and was dropped.

## Rows by source

| source_id | rows |
|---|---|
| `evalplus-published-runs` | 88 |
| `stablelm-original-eval-json` | 85 |
| `alpaca-eval-leaderboard-apache` | 79 |
| `open-pt-llm-leaderboard` | 55 |
| `bfcl-result-archive-v4` | 47 |
| `inception-leaderboards-space` | 37 |
| `speakleash-cptub` | 30 |
| `zeroeval-published-results` | 27 |
| `bridge-medical-leaderboard` | 24 |
| `nvidia-ruler-readme-results` | 18 |
| `paper-2406.15877v4-bigcodebench` | 16 |
| `epoch-internal` | 14 |
| `aider-code-editing-runs` | 11 |
| `wildbench-leaderboard-data` | 11 |
| `open-persian-llm-leaderboard` | 9 |
| `livebench-model-judgment-apache` | 7 |
| `vectara-hallucination-leaderboard-apache` | 7 |
| `aider-polyglot-runs` | 4 |
| `eqbench3-canonical-results` | 2 |
| `arena-hard-auto-readme-v0-1` | 2 |
| `webapp1k-leaderboard` | 1 |

## Ledger actions

- `first-party-01ai` add_match 7: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 7 file(s) for models proposed in this pass.
- `first-party-bigcode` add_match 1: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 1 file(s) for models proposed in this pass.
- `first-party-eleutherai` add_match 1: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 1 file(s) for models proposed in this pass.
- `first-party-huggingface` add_match 1: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 1 file(s) for models proposed in this pass.
- `first-party-lmsys` add_match 2: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 2 file(s) for models proposed in this pass.
- `first-party-microsoft` add_match 1: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 1 file(s) for models proposed in this pass.
- `first-party-mistral` add_match 1: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 1 file(s) for models proposed in this pass.
- `first-party-nous-research` add_match 4: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 4 file(s) for models proposed in this pass.
- `first-party-openchat` add_match 1: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 1 file(s) for models proposed in this pass.
- `first-party-qwen` add_match 4: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 4 file(s) for models proposed in this pass.
- `first-party-stability` add_match 2: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 2 file(s) for models proposed in this pass.
- `first-party-tii` add_match 4: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 4 file(s) for models proposed in this pass.
- `first-party-zai` add_match 2: Maker's own pinned config.json (context window of its own model, owner policy 2026-09-25 as extended 2026-10-06): 2 file(s) for models proposed in this pass.
- `evalplus-published-runs` add_match 1: Same pinned repository and LICENSE as the existing EvalPerf run files; adds the OpenCoder-8B-Instruct run file (date 2024-11-08 20:59, 118 tasks, 100 samples, temperature 1.0; file sha256 c5208424f4ba6fa1f9071917cfdfe87705dbe823982b58273e8285d6cbd75553).
- `stablelm-original-eval-json` add_match 8: More committed evals/*.json output files from the same pinned StableLM commit and root Apache-2.0 LICENSE (the ledger scope is 'the committed evals/*.json output data'); each is a full lm-evaluation-harness results file with the model config recorded.

## Caveats for the owner

- 132 of 264 models rest on a single result, and 132 on a single benchmark. Specialists measured on one narrow test get scores driven by it: e.g. hivemind-32b-preview (one EQ-Bench 3 Elo, 1350.99, g about 73), watt-tool-70b / xLAM-2 / BitAgent (BFCL only, g about 61-66), AlpacaEval-tuned 8-9B fine-tunes (g about 59-65). The numbers are genuine, but the composite will overstate their general ability until other runs appear.
- Two Open PT rows (MiniChat-3B, MiniChat-1.5-3B: all nine task scores 0.0) are included with `invalid` set.
- About 100 new provider strings have no logo yet (check.ts warns only).
- Held for a decision (`held_for_owner`): yi-large / yi-large-preview (undated 01.AI ids, 9 rows ready), BigCodeBench Qwen2-57B-A14B row (Table 4 links the base repo), glm-4-0116, grok-beta (xAI calls it a provisional preview), EvalPlus claude-instant-1 / claude-2 alias rows, pre-release Qwen2.5-Coder 0.5B/3B Aider runs, Yehia-7B duplicate runs.
- Not in scope but noticed: 56 catalogued models (OPT, Pythia, BLOOM, GPT-Neo, Llama 2 base, Tulu 2, R1 distills, ...) have Open PT rows that were never imported.
- The disk holding the scratchpad was full during this pass (ENOSPC once); the MathArena parquet copies were deleted to free space. About 12 GB was free at the end.

Scripts: scratchpad `p9scripts/` (`inventory.py` lists unmapped labels per source, `cands.py` holds the curated identities, `build.py` builds entries and rows, `assemble.py` dedupes against data/ and other pass-9 files and writes the JSON).
