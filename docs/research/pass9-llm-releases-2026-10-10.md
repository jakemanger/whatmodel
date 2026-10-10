# Pass 9: LLM releases not reached in pass 8, and popular local models (2026-10-10)

Candidates only; nothing in `data/` was edited. JSON: `docs/research/pass9-llm-releases-2026-10-10.json`:
**90 models, 926 results (580 lab / 346 independent), 39 ledger actions (20 new entries, 19 add_match), 2 new benchmark ids**.

How it was done:
- **Part 2 (popular local models).** All 245 ollama.com/library families were fetched (tags pages) and every size tag was
  matched to `data/models.json` by digest/tag prefix; the Hugging Face top-500 text-generation and image-text-to-text repos
  (by downloads) were matched by repo. Missing chat models were then looked up in the pinned data files of ledger
  leaderboards (EuroEval English, Open PT-LLM, LiveBench 2024-07-26, AlpacaEval 1/2, Vectara HHEM, BFCL v3 archive,
  Aider, SpeakLeash CPTUB / Polish EQ-Bench, Inception AraGen, BRIDGE, Miðeind, LMSYS MT-Bench) and in maker cards/reports
  that print catalogued sibling sizes.
- **Part 1 (releases).** Each model in pass 8's "not reached" list plus an org scan of ~50 labs (HF repos created
  2026-09-10..10-10) was checked for allowed, text-printed results that land in multi-model runs.
- Run options: ollama tags were verified on each tag page (digest, arch, parameter count, quantisation), HF GGUF/safetensors
  sizes from the HF API tree at a pinned sha; every variant is `gb_estimated: true`.
- Rule-(b) vendor rows from non-open documents (Qwen2.5-Coder / Qwen2-VL / Qwen2.5-Math reports, EXAONE 3.5 / Deep cards,
  Hermes 3 report, Nemotron-Labs Puzzle card) were typed by hand from the printed tables (no scripted extraction).
- Validation: `scratchpad/p9-llm/scripts/merge.py` (ids/names/model_repo vs data/models.json and other pass-9 files,
  ledger coverage of every result/context URL, no duplicate rows) and the owner's flow in a scratch copy
  (`apply-pass2.mjs` -> `npm run import` -> `node scripts/check.ts --validate-only`): +90 models, +926 results, 0 skipped,
  "Validated 1830 models, 18067 results, 845 benchmarks, 826 sources" with no errors (only the usual provider-logo warning).

## Models proposed (rows / rows in counted runs / lab rows / main sources / first run option)

| id | provider | rows | counted | lab | sources | run option |
|---|---|---|---|---|---|---|
| `eurollm-1-7b-instruct` | UTTER (EuroLLM) | 3 | 3 | 0 | euroeval-leaderboards (1), open-pt-llm-leaderboard (1), speakleash-cptub (1) | `llama-server -hf mradermacher/EuroLLM-1.7B-Instruct-GGUF:Q4_K_M; vllm serve utter-project/` |
| `eurollm-9b-instruct` | UTTER (EuroLLM) | 4 | 4 | 0 | euroeval-leaderboards (1), open-pt-llm-leaderboard (1), speakleash-cptub (1), speakleash-polish-eq-bench (1) | `llama-server -hf bartowski/EuroLLM-9B-Instruct-GGUF:Q4_K_M; vllm serve utter-project/EuroL` |
| `eurollm-22b-instruct-2512` | UTTER (EuroLLM) | 2 | 2 | 0 | euroeval-leaderboards (2) | `vllm serve utter-project/EuroLLM-22B-Instruct-2512` |
| `apertus-8b-instruct-2509` | Swiss AI | 3 | 3 | 0 | euroeval-leaderboards (2), mideind-icelandic-llm-leaderboard (1) | `vllm serve swiss-ai/Apertus-8B-Instruct-2509; uvx --from mlx-lm mlx_lm.chat --model mlx-co` |
| `apertus-70b-instruct-2509` | Swiss AI | 2 | 2 | 0 | euroeval-leaderboards (2) | `vllm serve swiss-ai/Apertus-70B-Instruct-2509` |
| `apertus-1-5-8b` | Swiss AI | 1 | 1 | 0 | mideind-icelandic-llm-leaderboard (1) | `vllm serve swiss-ai/Apertus-v1.5-8B --chat-template-content-format string --max-model-len ` |
| `apertus-1-5-70b` | Swiss AI | 1 | 1 | 0 | mideind-icelandic-llm-leaderboard (1) | `vllm serve swiss-ai/Apertus-v1.5-70B --chat-template-content-format string --tensor-parall` |
| `granite-4-0-h-micro` | IBM | 24 | 24 | 21 | card2-ibm-granite-granite-4-0-h-small (21), euroeval-leaderboards (2), vectara-hallucination-leaderboard-apache (1) | `ollama run granite4:micro-h; llama-server -hf ibm-granite/granite-4.0-h-micro-GGUF:Q4_K_M` |
| `granite-4-0-h-tiny` | IBM | 24 | 24 | 21 | card2-ibm-granite-granite-4-0-h-small (21), euroeval-leaderboards (2), vectara-hallucination-leaderboard-apache (1) | `ollama run granite4:tiny-h; llama-server -hf ibm-granite/granite-4.0-h-tiny-GGUF:Q4_K_M` |
| `granite-4-0-h-1b` | IBM | 29 | 29 | 21 | card3-ibm-granite-granite-4-0-h-1b (21), card-liquidai-lfm2-5-1-2b-thinking (8) | `ollama run granite4:1b-h; llama-server -hf ibm-granite/granite-4.0-h-1b-GGUF:Q4_K_M` |
| `granite-4-0-h-350m` | IBM | 21 | 21 | 21 | card3-ibm-granite-granite-4-0-h-1b (21) | `ollama run granite4:350m-h; llama-server -hf ibm-granite/granite-4.0-h-350m-GGUF:Q4_K_M` |
| `granite-3-1-3b-a800m` | IBM | 6 | 6 | 6 | card3-ibm-granite-granite-3-1-3b-a800m-instruct (6) | `ollama run granite3.1-moe:3b` |
| `granite-3-1-1b-a400m` | IBM | 6 | 6 | 6 | card3-ibm-granite-granite-3-1-3b-a800m-instruct (6) | `ollama run granite3.1-moe:1b` |
| `granite-3-0-3b-a800m` | IBM | 16 | 16 | 15 | granite-3-0-paper-github (15), euroeval-leaderboards (1) | `ollama run granite3-moe:3b` |
| `granite-3-0-1b-a400m` | IBM | 16 | 16 | 15 | granite-3-0-paper-github (15), euroeval-leaderboards (1) | `ollama run granite3-moe:1b` |
| `exaone-3-5-7-8b` | LG AI Research | 2 | 2 | 2 | first-party-lgai-scores (2) | `ollama run exaone3.5:7.8b; llama-server -hf LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct-GGUF:Q4_K` |
| `exaone-3-5-32b` | LG AI Research | 2 | 2 | 2 | first-party-lgai-scores (2) | `ollama run exaone3.5:32b; llama-server -hf LGAI-EXAONE/EXAONE-3.5-32B-Instruct-GGUF:Q4_K_M` |
| `exaone-deep-2-4b` | LG AI Research | 5 | 5 | 5 | first-party-lgai-scores (5) | `ollama run exaone-deep:2.4b; llama-server -hf LGAI-EXAONE/EXAONE-Deep-2.4B-GGUF:Q4_K_M` |
| `exaone-deep-7-8b` | LG AI Research | 5 | 5 | 5 | first-party-lgai-scores (5) | `ollama run exaone-deep:7.8b; llama-server -hf LGAI-EXAONE/EXAONE-Deep-7.8B-GGUF:Q4_K_M` |
| `exaone-deep-32b` | LG AI Research | 5 | 5 | 5 | first-party-lgai-scores (5) | `ollama run exaone-deep:32b; llama-server -hf LGAI-EXAONE/EXAONE-Deep-32B-GGUF:Q4_K_M` |
| `falcon-7b-instruct` | TII | 3 | 3 | 0 | alpaca-eval-leaderboard-apache (2), vectara-hallucination-leaderboard-apache (1) | `ollama run falcon:7b` |
| `falcon-40b-instruct` | TII | 3 | 3 | 0 | alpaca-eval-leaderboard-apache (2), lmsys-arena-space-mtbench (1) | `ollama run falcon:40b` |
| `falcon2-11b` | TII | 2 | 2 | 0 | euroeval-leaderboards (1), open-pt-llm-leaderboard (1) | `ollama run falcon2:11b` |
| `medgemma-4b-it` | Google | 2 | 2 | 0 | bridge-medical-leaderboard (1), open-pt-llm-leaderboard (1) | `ollama run medgemma:4b` |
| `medgemma-27b-it` | Google | 2 | 2 | 0 | bridge-medical-leaderboard (1), open-pt-llm-leaderboard (1) | `ollama run medgemma:27b` |
| `medgemma-27b-text-it` | Google | 2 | 2 | 0 | bridge-medical-leaderboard (1), open-pt-llm-leaderboard (1) | `llama-server -hf unsloth/medgemma-27b-text-it-GGUF:Q4_K_M` |
| `nexusraven-v2-13b` | Nexusflow | 1 | 1 | 0 | bfcl-result-archive-v4 (1) | `ollama run nexusraven:13b` |
| `firefunction-v2` | Fireworks AI | 1 | 1 | 0 | bfcl-result-archive-v4 (1) | `ollama run firefunction-v2:70b` |
| `sky-t1-32b-preview` | NovaSky (UC Berkeley) | 3 | 3 | 0 | euroeval-leaderboards (2), bfcl-result-archive-v4 (1) | `llama-server -hf bartowski/Sky-T1-32B-Preview-GGUF:Q4_K_M` |
| `reka-flash-3` | Reka AI | 2 | 2 | 0 | euroeval-leaderboards (2) | `llama-server -hf bartowski/RekaAI_reka-flash-3-GGUF:Q4_K_M` |
| `reka-flash-3-1` | Reka AI | 2 | 2 | 0 | euroeval-leaderboards (2) | `llama-server -hf bartowski/RekaAI_reka-flash-3.1-GGUF:Q4_K_M` |
| `afm-4-5b` | Arcee AI | 2 | 2 | 0 | euroeval-leaderboards (2) | `llama-server -hf arcee-ai/AFM-4.5B-GGUF:Q4_K_M` |
| `trinity-mini` | Arcee AI | 2 | 2 | 0 | euroeval-leaderboards (2) | `llama-server -hf arcee-ai/Trinity-Mini-GGUF:Q4_K_M` |
| `mistral-nemo-minitron-8b-instruct` | NVIDIA | 1 | 1 | 0 | euroeval-leaderboards (1) | `llama-server -hf bartowski/Mistral-NeMo-Minitron-8B-Instruct-GGUF:Q4_K_M` |
| `stablelm-2-1-6b-chat` | Stability AI | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run stablelm2:1.6b` |
| `stablelm-2-zephyr-1-6b` | Stability AI | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run stablelm2:zephyr` |
| `stablelm-2-12b-chat` | Stability AI | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run stablelm2:12b` |
| `stablelm-zephyr-3b` | Stability AI | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run stablelm-zephyr:3b` |
| `internlm2-5-1-8b-chat` | Shanghai AI Laboratory (InternLM) | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run internlm2:1.8b` |
| `nous-hermes-2-solar-10-7b` | Nous Research | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run nous-hermes2:10.7b` |
| `nous-hermes-2-yi-34b` | Nous Research | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run nous-hermes2:34b` |
| `notus-7b-v1` | Argilla | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run notus:7b` |
| `solar-pro-preview` | Upstage | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `ollama run solar-pro:22b` |
| `nous-hermes-2-mistral-7b-dpo` | Nous Research | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `llama-server -hf NousResearch/Nous-Hermes-2-Mistral-7B-DPO-GGUF:Q4_K_M` |
| `jan-v1-4b` | Jan (Menlo Research) | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `llama-server -hf janhq/Jan-v1-4B-GGUF:Q4_K_M` |
| `command-r7b-arabic-02-2025` | Cohere | 1 | 1 | 0 | inception-leaderboards-space (1) | `ollama run command-r7b-arabic:7b` |
| `fanar-1-9b-instruct` | QCRI | 1 | 1 | 0 | inception-leaderboards-space (1) | `vllm serve QCRI/Fanar-1-9B-Instruct` |
| `diffusiongemma-26b-a4b` | Google | 12 | 12 | 12 | card3-google-diffusiongemma-26b-a4b-it (12) | `comparison-only` |
| `spark-x2-5-4b` | iFLYTEK (SparkLLM) | 17 | 17 | 17 | card3-xhtoken-spark-x2-5-4b (17) | `ollama run SparkLLM/Spark-X2.5-4B; llama-server -hf XHToken/Spark-X2.5-4B-GGUF:Q4_K_M` |
| `spark-x2-5-1-7b` | iFLYTEK (SparkLLM) | 17 | 17 | 17 | card3-xhtoken-spark-x2-5-4b (17) | `ollama run SparkLLM/Spark-X2.5-1.7B; llama-server -hf XHToken/Spark-X2.5-1.7B-GGUF:Q4_K_M` |
| `gigachat-3-5-ultra-reasoning` | Sber | 10 | 10 | 10 | card3-ai-sage-gigachat3-5-432b-a28b-reasoning (10) | `vllm serve ai-sage/GigaChat3.5-432B-A28B-Reasoning --tensor-parallel-size 8` |
| `gigachat-3-5-ultra-instruct` | Sber | 10 | 10 | 10 | card3-ai-sage-gigachat3-5-432b-a28b-reasoning (10) | `vllm serve ai-sage/GigaChat3.5-432B-A28B --tensor-parallel-size 8` |
| `ax-k2` | SK Telecom | 7 | 7 | 7 | paper-2608.30181v1-ax-k2 (7) | `vllm serve skt/A.X-K2 --tensor-parallel-size 8` |
| `ax-k1` | SK Telecom | 7 | 7 | 7 | paper-2608.30181v1-ax-k2 (7) | `vllm serve skt/A.X-K1 --tensor-parallel-size 8` |
| `qwen-agentworld-35b-a3b` | Alibaba | 1 | 1 | 1 | card3-qwen-qwen-agentworld-35b-a3b (1) | `llama-server -hf unsloth/Qwen-AgentWorld-35B-A3B-GGUF:UD-Q4_K_XL; vllm serve Qwen/Qwen-Age` |
| `nemotron-labs-3-puzzle-75b-a9b` | NVIDIA | 13 | 13 | 13 | first-party-nvidia-scores (13) | `vllm serve nvidia/NVIDIA-Nemotron-Labs-3-Puzzle-75B-A9B-BF16 --tensor-parallel-size 2` |
| `mellum2-12b-a2-5b-instruct` | JetBrains | 8 | 8 | 8 | card3-jetbrains-mellum2-12b-a2-5b-instruct (8) | `vllm serve JetBrains/Mellum2-12B-A2.5B-Instruct` |
| `mellum2-12b-a2-5b-thinking` | JetBrains | 18 | 18 | 18 | card3-jetbrains-mellum2-1-12b-a2-5b-thinking (11), card3-jetbrains-mellum2-12b-a2-5b-thinking (7) | `vllm serve JetBrains/Mellum2-12B-A2.5B-Thinking` |
| `mellum2-1-12b-a2-5b-thinking` | JetBrains | 11 | 11 | 11 | card3-jetbrains-mellum2-1-12b-a2-5b-thinking (11) | `vllm serve JetBrains/Mellum2.1-12B-A2.5B-Thinking` |
| `translategemma-4b` | Google | 1 | 1 | 1 | paper-2601.09012v2-translategemma (1) | `ollama run translategemma:4b` |
| `translategemma-12b` | Google | 1 | 1 | 1 | paper-2601.09012v2-translategemma (1) | `ollama run translategemma:12b` |
| `translategemma-27b` | Google | 1 | 1 | 1 | paper-2601.09012v2-translategemma (1) | `ollama run translategemma:27b` |
| `qwen2-5-coder-0-5b` | Alibaba | 9 | 9 | 8 | first-party-qwen-scores (8), aider-code-editing-runs (1) | `ollama run qwen2.5-coder:0.5b; llama-server -hf Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF:Q4_K` |
| `qwen2-5-coder-3b` | Alibaba | 9 | 9 | 8 | first-party-qwen-scores (8), aider-code-editing-runs (1) | `ollama run qwen2.5-coder:3b; llama-server -hf Qwen/Qwen2.5-Coder-3B-Instruct-GGUF:Q4_K_M` |
| `qwen2-vl-2b` | Alibaba | 16 | 16 | 15 | first-party-qwen-scores (15), vectara-hallucination-leaderboard-apache (1) | `llama-server -hf ggml-org/Qwen2-VL-2B-Instruct-GGUF:Q4_K_M` |
| `qwen1-5-0-5b-chat` | Alibaba | 3 | 3 | 0 | livebench-model-judgment-apache (1), open-pt-llm-leaderboard (1), euroeval-leaderboards (1) | `ollama run qwen:0.5b; llama-server -hf Qwen/Qwen1.5-0.5B-Chat-GGUF:Q4_K_M` |
| `qwen1-5-1-8b-chat` | Alibaba | 4 | 4 | 0 | livebench-model-judgment-apache (1), open-pt-llm-leaderboard (1), euroeval-leaderboards (1), alpaca-eval-leaderboard-apache (1) | `ollama run qwen:1.8b; llama-server -hf Qwen/Qwen1.5-1.8B-Chat-GGUF:Q4_K_M` |
| `qwen1-5-moe-a2-7b-chat` | Alibaba | 1 | 1 | 0 | open-pt-llm-leaderboard (1) | `vllm serve Qwen/Qwen1.5-MoE-A2.7B-Chat` |
| `qwen2-math-1-5b` | Alibaba | 3 | 3 | 3 | first-party-qwen-scores (3) | `ollama run qwen2-math:1.5b` |
| `qwen2-math-7b` | Alibaba | 3 | 3 | 3 | first-party-qwen-scores (3) | `ollama run qwen2-math:7b` |
| `qwen2-math-72b` | Alibaba | 4 | 4 | 3 | first-party-qwen-scores (3), livebench-model-judgment-apache (1) | `ollama run qwen2-math:72b` |
| `qwen2-5-math-1-5b` | Alibaba | 3 | 3 | 3 | first-party-qwen-scores (3) | `llama-server -hf bartowski/Qwen2.5-Math-1.5B-Instruct-GGUF:Q4_K_M` |
| `qwen2-5-math-7b` | Alibaba | 3 | 3 | 3 | first-party-qwen-scores (3) | `llama-server -hf bartowski/Qwen2.5-Math-7B-Instruct-GGUF:Q4_K_M` |
| `qwen2-5-math-72b` | Alibaba | 3 | 3 | 3 | first-party-qwen-scores (3) | `llama-server -hf bartowski/Qwen2.5-Math-72B-Instruct-GGUF:Q4_K_M` |
| `openthinker-7b` | Open Thoughts | 9 | 9 | 9 | card3-open-thoughts-openthinker2-7b (5), card3-open-thoughts-openthinker-7b (4) | `ollama run openthinker:7b` |
| `openthinker-32b` | Open Thoughts | 8 | 8 | 8 | card3-open-thoughts-openthinker2-32b (4), card3-open-thoughts-openthinker-32b (4) | `ollama run openthinker:32b` |
| `openthinker2-7b` | Open Thoughts | 5 | 5 | 5 | card3-open-thoughts-openthinker2-7b (5) | `llama-server -hf bartowski/open-thoughts_OpenThinker2-7B-GGUF:Q4_K_M` |
| `hermes-3-llama-3-1-70b` | Nous Research | 14 | 14 | 13 | first-party-nous-research-scores (13), livebench-model-judgment-apache (1) | `ollama run hermes3:70b; llama-server -hf NousResearch/Hermes-3-Llama-3.1-70B-GGUF:Q4_K_M` |
| `hermes-3-llama-3-1-405b` | Nous Research | 14 | 14 | 13 | first-party-nous-research-scores (13), aider-code-editing-runs (1) | `ollama run hermes3:405b` |
| `cogito-v1-preview-qwen-14b` | Deep Cogito | 2 | 2 | 0 | euroeval-leaderboards (2) | `ollama run cogito:14b` |
| `cogito-v1-preview-qwen-32b` | Deep Cogito | 2 | 2 | 0 | euroeval-leaderboards (2) | `ollama run cogito:32b` |
| `cogito-v1-preview-llama-70b` | Deep Cogito | 2 | 2 | 0 | euroeval-leaderboards (2) | `ollama run cogito:70b` |
| `cogito-v2-preview-llama-70b` | Deep Cogito | 2 | 2 | 0 | euroeval-leaderboards (2) | `vllm serve deepcogito/cogito-v2-preview-llama-70B --tensor-parallel-size 4` |
| `smollm2-360m` | Hugging Face | 6 | 6 | 5 | card3-huggingfacetb-smollm2-360m-instruct (5), euroeval-leaderboards (1) | `ollama run smollm2:360m; llama-server -hf HuggingFaceTB/SmolLM2-360M-Instruct-GGUF:Q8_0` |
| `smollm2-135m` | Hugging Face | 1 | 1 | 0 | euroeval-leaderboards (1) | `ollama run smollm2:135m` |
| `lfm2-350m` | Liquid AI | 9 | 9 | 7 | card3-liquidai-lfm2-1-2b (7), euroeval-leaderboards (2) | `llama-server -hf LiquidAI/LFM2-350M-GGUF:Q4_K_M` |
| `lfm2-700m` | Liquid AI | 9 | 9 | 7 | card3-liquidai-lfm2-1-2b (7), euroeval-leaderboards (2) | `llama-server -hf LiquidAI/LFM2-700M-GGUF:Q4_K_M` |
| `lfm2-1-2b` | Liquid AI | 9 | 9 | 7 | card3-liquidai-lfm2-1-2b (7), euroeval-leaderboards (2) | `llama-server -hf LiquidAI/LFM2-1.2B-GGUF:Q4_K_M` |
| `lfm2-2-6b` | Liquid AI | 2 | 2 | 0 | euroeval-leaderboards (2) | `llama-server -hf LiquidAI/LFM2-2.6B-GGUF:Q4_K_M` |
| `lfm2-5-1-2b-instruct` | Liquid AI | 10 | 10 | 8 | card-liquidai-lfm2-5-1-2b-thinking (8), euroeval-leaderboards (2) | `llama-server -hf LiquidAI/LFM2.5-1.2B-Instruct-GGUF:Q4_K_M` |

51 existing catalogue models also gain rows (sibling/comparator cells), e.g. qwen2-5-coder-1-5b/7b/14b/32b, codeqwen1-5-7b-chat,
qwen2-vl-7b/72b, qwen2-7b/72b/1-5b, granite-4-0-1b/350m, granite-3-1-2b/8b, llama-3-2-1b, hermes-3-llama-3-1-8b, qwen3-5-2b/4b/9b,
gemma-4-e2b/e4b/12b/26b-a4b, gemma-3-4b/12b/27b, glm-5-1, kimi-k2-6, minimax-m2-7, qwen3-5-397b-a17b, nemotron-3-ultra-550b-a55b,
olmo-3-7b-instruct/think, ministral-3-14b(-reasoning), deepseek-v4-flash-preview, deepseek-r1-distill-qwen-7b/32b, s1-1-32b,
gpt-4o-2024-05-13, o1-mini, Claude Opus 4.6/4.8, Sonnet 4.6, GPT-5.4, Gemini 3.1 Pro, Qwen3.6 Plus, exaone-3-5-2-4b.

New makers needing icons: UTTER (EuroLLM), Swiss AI, iFLYTEK (SparkLLM), SK Telecom, Sber (exists), Jan (Menlo Research),
QCRI, Fireworks AI, NovaSky (UC Berkeley), Argilla, JetBrains.

## New benchmark ids
- `livecodebench-v2` (LiveCodeBench release_v2 pass@1, 'LCBv2' in Open Thoughts' Evalchemy tables; 7 catalogue models across
  three Open Thoughts cards; suggested task: coding).
- `agentworldbench-overall` (Qwen-AgentWorld environment-simulation rubric, 12 catalogue models; no task suggested; see held).

## Rows by source

| source_id | rows | ledger |
|---|---|---|
| `first-party-qwen-scores` | 122 | existing |
| `card3-xhtoken-spark-x2-5-4b` | 95 | new |
| `card3-ibm-granite-granite-4-0-h-1b` | 84 | new |
| `paper-2608.30181v1-ax-k2` | 49 | new |
| `euroeval-leaderboards` | 48 | existing |
| `granite-3-0-paper-github` | 45 | existing |
| `card3-jetbrains-mellum2-1-12b-a2-5b-thinking` | 44 | new |
| `card2-ibm-granite-granite-4-0-h-small` | 42 | existing |
| `card3-jetbrains-mellum2-12b-a2-5b-instruct` | 40 | new |
| `first-party-nous-research-scores` | 39 | new |
| `card3-jetbrains-mellum2-12b-a2-5b-thinking` | 33 | new |
| `card3-ai-sage-gigachat3-5-432b-a28b-reasoning` | 30 | new |
| `card3-ibm-granite-granite-3-1-3b-a800m-instruct` | 24 | new |
| `card3-google-diffusiongemma-26b-a4b-it` | 24 | new |
| `first-party-nvidia-scores` | 24 | existing |
| `card3-liquidai-lfm2-1-2b` | 21 | new |
| `open-pt-llm-leaderboard` | 20 | existing |
| `first-party-lgai-scores` | 20 | existing |
| `card3-open-thoughts-openthinker-7b` | 16 | new |
| `card-liquidai-lfm2-5-1-2b-thinking` | 16 | existing |
| `card3-open-thoughts-openthinker2-7b` | 15 | new |
| `card3-qwen-qwen-agentworld-35b-a3b` | 12 | new |
| `card3-open-thoughts-openthinker-32b` | 12 | new |
| `card3-huggingfacetb-smollm2-360m-instruct` | 10 | new |
| `paper-2601.09012v2-translategemma` | 6 | new |
| `alpaca-eval-leaderboard-apache` | 5 | existing |
| `vectara-hallucination-leaderboard-apache` | 4 | existing |
| `livebench-model-judgment-apache` | 4 | existing |
| `card3-open-thoughts-openthinker2-32b` | 4 | existing |
| `mideind-icelandic-llm-leaderboard` | 3 | existing |
| `bridge-medical-leaderboard` | 3 | existing |
| `bfcl-result-archive-v4` | 3 | existing |
| `aider-code-editing-runs` | 3 | existing |
| `speakleash-cptub` | 2 | existing |
| `inception-leaderboards-space` | 2 | existing |
| `speakleash-polish-eq-bench` | 1 | existing |
| `lmsys-arena-space-mtbench` | 1 | existing |

## Held for the owner
- https://ollama.com/library/granite4.1/tags: Existing catalogue entries granite-4-1-3b and granite-4-1-30b have local: null, but ollama lists granite4.1:3b (2.1GB) and granite4.1:30b (17GB); not edited here (existing entries).
- https://huggingface.co/ai-sage/GigaChat3.5-432B-A28B-Reasoning/blob/02f55379ac0b20abd9378791bffd6254725e6f5c/README.md: DeepSeek V4 Flash Preview Reasoning column (10 cells, by: independent) is used on the strength of the card's shared methodology notes and the token-count comparison of both models' generations; the card never says 'we evaluated DeepSeek'. Drop the deepseek-v4-flash-preview rows of card3-ai-sage-gigachat3-5-432b-a28b-reasoning if that is not enough.
- https://huggingface.co/Qwen/Qwen-AgentWorld-35B-A3B/blob/60d2b0434a53d2e62a7c00a489586815d94ebffb/README.md: New benchmark 'agentworldbench-overall' (12 catalogue models) measures environment-simulation fidelity rather than task success; proposed with no task membership. Drop the benchmark and its 12 rows if it should not enter the general LLM fit (Qwen-AgentWorld-35B-A3B would then have no rows).
- https://huggingface.co/JetBrains/Mellum2-12B-A2.5B-Instruct/blob/273d9c1c6882ac8e1562e5b7e043857d35a787b6/README.md: Comparator columns of both Mellum2 cards rely on 'All values self-reported by JetBrains' (read as JetBrains' own runs of every column, as the values differ from Qwen's/Ai2's/Mistral's published ones). Drop the independent rows of card3-jetbrains-mellum2-* if the owner reads it otherwise.
- https://huggingface.co/LiquidAI/LFM2-2.6B/blob/36ed799f7024ef169ba92ffe184821835e15cc66/README.md: LFM2-2.6B card prints Llama-3.2-3B-Instruct, SmolLM3-3B, gemma-3-4b-it and Qwen3-4B-Instruct-2507 rows next to LFM2-2.6B with only 'We only report scores using instruct variants and non-thinking modes for consistency' (no statement that Liquid ran them); LFM2-1.2B card similarly prints Qwen3-0.6B/1.7B, Llama-3.2-1B-Instruct and gemma-3-1b-it rows with no statement. Not used; if the owner accepts the LFM2.5-1.2B-Thinking precedent (methodology sentence = own runs), these would add 4 + 4 comparator cells per benchmark.
- https://ollama.com/library/phi4-reasoning/tags: Existing entry phi-4-reasoning-plus: Phi-4-reasoning-plus has no local variant; ollama phi4-reasoning:plus (digest f0ad3edce8e4, 11GB, Q4_K_M, 14.7B). Suggested variant cmd 'ollama run phi4-reasoning:plus' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/llava/tags: Existing entry llava-v1-6-vicuna-13b: LLaVA-v1.6-Vicuna-13B has no local variant; ollama llava:13b = llava:13b-v1.6 (digest 0d0eb4d7f485, 8.0GB, Q4_0, text+image). Suggested variant cmd 'ollama run llava:13b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/deepseek-llm/tags: Existing entry deepseek-llm-7b-chat: DeepSeek-LLM 7B Chat has no local variant; ollama deepseek-llm:7b = 7b-chat (digest 9aab369a853b, 4.0GB, Q4_0). Suggested variant cmd 'ollama run deepseek-llm:7b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/starcoder/tags: Existing entry starcoderbase-1b: StarCoderBase-1B only has a transformers snippet; ollama starcoder:1b = 1b-base (digest 77e6c46054d9, 726MB, Q4_0, 8K). Suggested variant cmd 'ollama run starcoder:1b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/starcoder/tags: Existing entry starcoderbase-3b: ollama starcoder:3b = 3b-base (digest 847e5a7aa26f, 1.8GB, Q4_0). Suggested variant cmd 'ollama run starcoder:3b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/starcoder/tags: Existing entry starcoderbase-7b: ollama starcoder:7b = 7b-base (digest 53fdbc3a2006, 4.3GB, Q4_0). Suggested variant cmd 'ollama run starcoder:7b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/starcoder/tags: Existing entry starcoder: StarCoder 15.5B: ollama starcoder:15b (digest fc59c84e00c5, 9.0GB, Q4_0); starcoderbase = starcoder:15b-base (d7484a05d753). Suggested variant cmd 'ollama run starcoder:15b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/starcoder2/tags: Existing entry starcoder2-15b-instruct-v0-1: StarCoder2-15B-Instruct-v0.1 only has a transformers snippet; ollama starcoder2:15b-instruct (digest 432973cfbc4c, 9.1GB, Q4_0). Suggested variant cmd 'ollama run starcoder2:15b-instruct' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/granite-code/tags: Existing entry granite-20b-code-instruct-8k: ollama granite-code:20b = 20b-instruct (digest 59db7b531bb4, 12GB, Q4_0, 8K context matches the 8k checkpoint). granite-code:3b/8b show a 125K window, i.e. the 128k checkpoints, which are not the catalogued 2k/4k entries. Suggested variant cmd 'ollama run granite-code:20b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/granite-code/tags: Existing entry granite-34b-code-instruct-8k: ollama granite-code:34b = 34b-instruct (digest 4ce00960ca84, 19GB, Q4_0, 8K). Suggested variant cmd 'ollama run granite-code:34b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/laguna-xs.2/tags: Existing entry laguna-xs-2: Laguna XS.2 only has a vLLM command; ollama laguna-xs.2:latest (digest ba9ecde43b0e, 23GB, Q4_K_M, 33.4B). Suggested variant cmd 'ollama run laguna-xs.2:latest' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/granite4.1/tags: Existing entry granite-4-1-3b: Granite 4.1 3B has local: null; ollama granite4.1:3b (digest 6fd349357287, 2.1GB, Q4_K_M). Suggested variant cmd 'ollama run granite4.1:3b' (gb_estimated). Not edited here (existing entries).
- https://ollama.com/library/granite4.1/tags: Existing entry granite-4-1-30b: Granite 4.1 30B has local: null; ollama granite4.1:30b (digest 3f3e5df8a021, 17GB, Q4_K_M). Suggested variant cmd 'ollama run granite4.1:30b' (gb_estimated). Not edited here (existing entries).

## Gaps / not added
- Ling-3.0-tiny / Ling-3.0-flash-VL (inclusionAI, MIT): Card scores are images plus Artificial Analysis index figures; no text-printed allowed rows and no ledger leaderboard lists them.
- Ling-3.1-flash (inclusionAI): No Hugging Face repo found (org scan 2026-10-10); not released as open weights yet.
- LLaDA2.2-mini / LLaDA2.2-flash (inclusionAI, Apache-2.0): Card tables print only LLaDA2.0/2.1/2.2 (none catalogued) or Ling-2.6-flash cells copied from its report; the rows would form an unanchored island.
- GLM-5.3-FlashX / Prime / Fast (Z.ai): FlashX is an API tier of GLM-5.3-Flash ($0.37/$1.25 per 1M); no separate weights or benchmark rows; Prime/Fast not found on Z.ai docs.
- MiniMax M3.1 Flash Preview: Not found on MiniMax pages reachable without JavaScript; no HF repo; nothing to cite.
- Qwen3.5-Omni Plus / Flash: No open weights; no allowed source prints scores for these API models.
- InternVL3 / InternVL3.5 sizes, Intern-S2-397B (OpenGVLab/internlm): Performance tables are images (Intern-S2 says OpenCompass/VLMEvalKit were used for all models, but numbers are only in figs/intern-s2-397b.jpg); InternVL3/3.5 cards likewise use images.
- MiniCPM-V 4.5 / 4.6 (OpenBMB): Card scores are images, OpenCompass averages and Artificial Analysis index; ollama minicpm-v4.5:8b / minicpm-v4.6:1b exist and would be easy additions once a text source appears.
- Motif-3 (Motif Technologies, MIT): Comparator columns are 'taken from the corresponding benchmark leaderboards' (not own runs); own cells alone would be lone.
- kanana-2 (Kakao): Kanana licence is not an open licence (rule b would allow only Kakao cells) and no Kanana model is catalogued, so the rows would be an island; comparator cells marked * are Kakao runs but unusable under rule b.
- HyperCLOVA X SEED Think 14B (NAVER): Non-open HyperCLOVA X SEED licence: only NAVER cells usable, and the card has no catalogued NAVER sibling in its tables; lone.
- llm-jp-4 / llm-jp-4.1 (8B, 32B-A3B, 33B thinking): Only LLM-as-judge MT-Bench JA/EN with a gpt-5.4 judge (no matching benchmark id; existing MT-Bench id is GPT-4 single grading); would need a new id.
- Kolibri-1 (Aleph Alpha, Apache-2.0): Large comparator tables (GLM-4.7 Flash, Qwen3.5/3.6 35B-A3B, Gemma 4 26B-A4B, gpt-oss-120b ...) but no statement that Aleph Alpha ran them; own column alone is lone. Worth an owner look (one-decimal values that differ from the vendors' figures).
- LFM2.5-VL-3B / d1-3B / d1-omni-600M (Liquid AI): LFM2.5-VL-3B comparators (Gemma4 E2B/E4B, InternVL3.5, Qwen3.5 2B/4B) carry no own-evaluation statement; d1 is a decision/judging model scored on Liquid's Decision Index.
- Solar Mini 4 (Upstage): No HF repo or public model page found.
- MAI-Code-1.1-Flash (Microsoft AI): No HF repo or allowed source found.
- LensVLM-9B (Apple, apple-amlr research licence): No text-printed score tables in the card.
- MiMo-V2.6-Flash-MOPD / Pro-MOPD (Xiaomi, 2026-09-27): Cards have architecture tables only; no scores to anchor them.
- Devstral Small 1.0 (2505) / 1.1 (2507) (Mistral, Apache-2.0; ollama devstral:24b): Only SWE-bench Verified for the two own models (other rows are vendor-published comparators); a 2-model island with no other allowed source (Roblox lists only a Q4_K_M quantised run).
- DeepCoder-14B/1.5B-Preview, DeepScaleR-1.5B-Preview (Agentica, MIT; ollama deepcoder, deepscaler): No own-evaluation statement for comparator rows (some copied from vendors); own rows would be lone.
- Ornith 1.0/1.5 9B (ornith-ai; ollama ornith:9b, ornith-1.5:9b; 5M+ GGUF downloads): As in pass 8: only same-lab pair cells, unanchored island.
- LLaVA 1.6 Mistral 7B (ollama llava:7b), moondream2 (ollama moondream), SmolVLM, Kimi-VL-A3B, GLM-4.1V-9B-Thinking, Molmo2-4B, granite-vision: No allowed text source found in this pass (EuroEval lists GLM-4.1V-9B-Thinking but at a chance-level score that looks like a failed run).
- Dolphin 3.0 / dolphin-mistral / dolphin-mixtral / dolphin-llama3, orca-mini, wizard-vicuna-uncensored, llama2-uncensored, nous-hermes (llama2), codeup, everythinglm, megadolphin, goliath (ollama): Popular community fine-tunes with no rows in any ledger source (Open PT lists only Dolphin3.0-R1-Mistral-24B, a different model).
- Bielik 11B v2.x/v3.0, 4.5B, 1.5B (SpeakLeash): EuroEval/CPTUB/Polish EQ-Bench rows exist; not added in this pass (Polish-specific, no ollama library tag) - easy follow-up.
- Embedding / guard / OCR models in ollama (nomic-embed-text, mxbai-embed-large, bge-m3, embeddinggemma, all-minilm, llama-guard3, shieldgemma, granite3-guardian, gpt-oss-safeguard, glm-ocr, deepseek-ocr): Out of scope: not chat LLMs scored by this catalogue.
