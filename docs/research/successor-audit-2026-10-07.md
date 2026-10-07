# Successor-pair audit (2026-10-07)

Why do newer models sometimes rank below their predecessors on the LLM board? This audit covers the main LLM comparison set (`comparisonSets.llm[0]`, 671 models). The full per-pair data is in `successor-audit-2026-10-07.json`: ids, g, ±, rank, shared tests, head-to-head (h2h), causes, key results with source URLs, counterfactual refits and a suggested fix.

How it was done:
- **Pairs.** 307 successor pairs were generated from provider, name stem and size/tier, then pruned by hand. By kind: 187 successors, 57 dated snapshots, 15 GA-vs-preview, 24 near-size and 24 base-vs-chat.
- **Inversions.** A pair is inverted when the newer model's g is lower. It is significant when the gap is larger than √(pm₁²+pm₂²).
- **Head-to-head.** Compared per shared series key (same bench@evaluator).
- **Counterfactuals.** Full refits with `toCells` → `connectedCells` → `fit` and one change at a time.

## Headline

| | pairs | inverted | significant |
|---|---|---|---|
| all | 307 | 53 | 21 |
| excluding base-vs-chat | 283 | 41 | 9 |
| base-vs-chat (special case) | 24 | 12 | 12 |

- **Most inversions are noise.** 32 of the 53 are within ±. Of the 41 inversions outside base-vs-chat, the newer model wins the shared tests in 18 and loses them in 16.
- **The 9 significant cases outside base-vs-chat split 4 to 5.**
  - 4 are genuine: GPT-4o 11-20, GPT-3.5 1106, GPT-5.1, GPT-5.3 Chat.
  - 5 are artefacts: Gemini 2.5 Pro GA, Granite 4.2 8B, Llama 2 70B, DeepSeek V3.2-Exp and GPT-4o 08-06.

## Counts by cause (all 53 inversions diagnosed; several causes per pair allowed)

| code | cause | pairs | of the 21 significant | primary cause |
|---|---|---|---|---|
| b | different test mix / no bridge | 33 | 17 | 18 |
| c | thin evidence | 31 | 8 | 4 |
| f | genuine | 23 | 10 | 19 |
| e | method artefact | 15 | 5 | 6 |
| d | self-report vs independent | 12 | 7 | 5 |
| a | data error | 1 | 0 | 1 |

Method sub-types: single-provider small series 6, floor clamp 4, arena top compression 3, preview/GA split 3, WebDev range 2, thinking-mode mismatch 2.

## Confirmed data errors

Source checks found no wrong numbers:
- **Arena:** all 630 arena values (text, vision, WebDev) match the pinned October parquets.
- **Epoch:** 963 of 964 Epoch results match `benchmark_data.zip` (downloaded 2026-10-07), checked by run id and the published "Best score" column.
- **EQ-Bench v1:** all 8 values match arXiv 2312.06281v2 Table 1.

Low outliers such as Epoch GPQA for Gemini 2.5 Pro Preview 05-06 (0.667) and R1-0528-Qwen3-8B (0.093) are real at the source. These are the confirmed problems:

1. **DE1: stale value (fixes an inversion).** `results.json` gpt-6-luna / epoch-furniture.
   - **Stored:** 0.28333, run `maAaPFjfW4D8XxpX97JdmA`.
   - **Found:** Epoch `furniture_assembly.csv` now has only run `GVtcaKADdbkuPoydqpKm3E` (started 2026-09-28) for `gpt-6-luna_max`, at **0.44167**.
   - **Effect:** GPT-6 Luna goes from 72.6 to 73.32, against GPT-5.6 Luna at 73.30, so the inversion goes away.
2. **DE2: preview arena on a GA id.** `qwen3-7-max` lmarena-text 1474.9 is the parquet entry `qwen3.7-max-preview`; there is no GA text entry. Its WebDev row does use the GA `qwen3.7-max-20260517`. The other Qwen Max previews have their own ids. g moves by 0.1.
3. **DE3: preview arena and date on a GA id.** `gemini-2-5-flash-lite` text 1374.9 and vision 1188.4 are `gemini-2.5-flash-lite-preview-06-17-thinking`. `released` is stored as 2025-06, but the Gemini API changelog dates the GA to July 22, 2025. Without these rows the GA would be 57.4 ± 3.1.
4. **DE4: GA release month.** `models.json` gemini-2-5-flash has `released` 2025-05. The changelog says June 17, 2025 ("our first stable 2.5 Flash model"). As stored, the GA sorts before or level with its 05-20 preview.
5. **DE5: mixed arena snapshots.** `claude-fable-5` text 1505.7 and vision 1309.5 come from commit `6931a5ef` (2026-09-13). The other 515 text and vision rows use `46919c46`, which lists `claude-fable-5-high` at 1504.3 and 1308.75. The g effect is nil.
6. **DE6: chance levels missing (fix already researched).** `benchmarks.json` has no chance level for piqa, winogrande or boolq (should be 0.5), hellaswag, openbookqa or mmlu (0.25), social-iqa (1/3), and others; see `chance-levels-2026-10-07.json`.
   - Applying all 42 corrections raises every base model by **4.4 to 6.1** (Llama 2 7B +4.9, LLaMA 65B +5.7).
   - Chat and frontier models move by 0.5 or less.
   - It **widens** base-vs-chat inversions by about 5 (Llama 2 7B: −9.5 → −14.9).
7. **DE7: metadata.**
   - The same lab appears under several provider names: Ai2 / Allen Institute for AI, Mistral / Mistral AI, three Zhipu/Z.ai labels, Cohere / Cohere For AI.
   - Some arena-only ids have no `released`: gpt-5-3-chat-latest-20261002, gpt-5-chat-20261002, amazon-nova-experimental-*.

## Methodological patterns

**P1. Weak bridges between test clusters (b, 33 pairs).** Each era and type of model is scored mostly on its own family of tests:
- base models on zero-shot paper tables;
- chat models on arena and modern evals;
- previews on 2025 suites, and GAs on 2026 agentic and math suites.

Only a few series link these clusters, so the offset between them floats:
- Dropping the single Tulu-2 paper widens Llama 2 7B base vs chat from −9.5 to −18.7.
- The chance fix moves the whole base cluster by about +5.
- Gemini 2.5 Pro GA sits 4.1 **below** its 06-05 preview (significant), yet it wins their only shared test (GPQA 0.853 vs 0.848).
  - The preview rests on Aider 0.831 (40% of its weight).
  - The GA carries WebDev 1227 (implied g 60.0, 15%) and FrontierMath T4 0/41 (58.5, 11%).
  - Merging the three preview ids into the GA gives 65.6.

**P2. Lab-only small series (d + e).** 251 of the 299 non-primary series with n ≤ 5 contain models from **one provider**: model-card and tech-report tables.
- **Why they mislead.** At n = 3–5 the series' a and d cannot be estimated, so a stays near 1. A one-logit gap then counts as 15 g, about three times what a frontier series with a ≈ 3 gives. These series still add weight and shrink ±.
- **Reach.** 35 models get over 30% of their weight from them (LLaMA 65B 99%, Qwen3.5 0.8B 85%, Granite 4.2 77%, DeepSeek V3.1 41%).
- **DeepSeek V3.1.** Its own card lifts it from 63.5 to 66.5 and alone causes the V3.1 → Terminus, V3.2-Exp and V3.2 inversions. V3.2 wins all 3 shared tests with V3.1.
- **Mixtral and Mistral 7B.** Without Mistral's own papers, the base-vs-instruct gaps go from −6.0 to +0.3 (Mixtral) and from −12.8 to −3.3 (Mistral 7B). Mixtral Instruct wins both shared tests.
- **LLaMA 65B.** It is scored only through the LLaMA paper's n = 4 LLaMA-only series.

**P3. Floor clamp at 0.005 (e).** There are 99 clamped cells.
- **Same score for every floored model.** All models at the floor get one implied g per test: FrontierMath T4 58.5, FrontierMath 47.4, chess 43.3, GPQA 26.6.
- **GPT-4o 08-06.** It wins **14 of 20** shared tests against 05-13, yet ranks 1.0 lower (significant). The cause is one FrontierMath result of 1/285 (0.0035, below the clamp) carrying 10% of its weight. Without it the two tie (56.34 vs 56.39).
- **One item matters.** Moving Gemini 2.5 Pro's FrontierMath T4 from 0/41 to 1/41 adds +0.6 g.

**P4. Text arena compresses at the top (e).** Compare the g implied by `lmarena-text` with each model's other evidence:
- below 75, the difference stays within ±1.8;
- at 75–80 it is −3.9 (n = 10), and above 80 it is −8.8 (n = 3);
- GPQA shows the same at 75+ (−4.8).

New frontier releases have arena plus 3–5 other tests, so arena carries 16–19% of their weight. GPT-6 Sol's text arena implies 70.5, against 78.6–81.6 from its other tests. Removing text arena flips GPT-6 Sol (79.95 vs 78.94) and Grok 4.7 (74.73 vs 74.57).

**P5. WebDev range and thinking modes (e).** The WebDev series has no weak models (its minimum is 1075.8), so any low rating implies about 58–62.
- **Granite 4.1 8B:** WebDev 1190.3 implies 58.5, against 52.1 from its own text arena, and carries 62% of its weight. Without it, 52.05 < 52.81.
- **Grok 4.1:** WebDev 1213.8 (961 votes) implies 59.5, against 71.4 from text arena. Without it, 70.8 > 64.7.
- **DeepSeek V3.2-Exp:** it has only a non-thinking WebDev entry (1271.8), while V3.2 uses its thinking entry (1361.7; its non-thinking entry is 1324.8).

**P6. Thin evidence (c).** 21 inversions involve a model with n ≤ 2, often arena-only (ERNIE previews, Grok 3 Preview, Qwen3-Max-Preview, V3.1 Terminus). Outside base-vs-chat, only 2 of them are significant.

No single global change removes many inversions. Dropping floors, lab rows, small series, text arena or WebDev each fixes 3–6 inversions and creates 3–8 others. Most of the remaining gaps are within noise.

## Genuine cases (f is the main cause)

| pair | evidence on shared tests |
|---|---|
| GPT-4o 08-06 → 11-20 (sig) | W2–L8; OpenAI's own simple-evals show GPQA .531→.46 and MMLU .887→.857 |
| GPT-3.5 0613 → 1106 (sig) | Arena-Hard .248→.189 |
| GPT-5.2 Chat → 5.3 Chat (sig) | text arena 1475.7 → 1450.0, CIs don't overlap |
| GPT-5 → GPT-5.1 (sig) | W4–L8 (SWE-bench V .736→.680, OTIS, τ², WebDev); still inverted without GPT-5's FrontierMath |
| Grok 4.20 → 4.3 | W3–L6 (text arena −30, FrontierMath, WebDev) |
| Qwen3.8 Max → 0902 snapshot | Epoch FrontierMath .747→.656, T4 .463→.341 |
| Qwen3-Max preview → GA | text arena 1434.4 vs 1422.9 |
| Trinity preview → Thinking | text arena 1379 → 1367 |
| Gemma 7B / 2B IT vs base | IT loses every shared code test |
| Llama 2 chat vs base (7B, 13B, 70B) | W1–L3, W2–L3, W1–L5 on Tulu-2 few-shot tests (alignment tax) |

These are genuine near-ties: Claude Opus 4.6 → 4.7 (W12–L11 on 25 shared tests), Gemini 3.5 → 3.6 Flash, Phi-3.5-mini → Phi-4-mini, and CodeLlama 34B → Instruct.

## The 25 largest inversions

| older → newer | gap (se) | h2h | causes | driver |
|---|---|---|---|---|
| GPT-3 davinci → text-davinci-001 | −23.7 (4.3) | none shared | b c | IT has 1 result (EQ-Bench v1 15.19, verified) |
| StableLM base α 7B → tuned | −14.1 (2.9) | none | b c d | tuned is arena-only (953) |
| MPT-7B → chat | −13.4 (2.8) | none | b c | chat is arena-only |
| Mistral 7B base → Instruct v0.1 | −12.8 (1.4) | none | b d | base on Mistral's papers; −3.3 without them |
| OLMo 7B → Instruct | −11.7 (3.0) | none | b c d | instruct is arena-only |
| Llama 2 7B → chat | −9.5 (1.2) | 1–3 | f b | alignment tax + base-only tables |
| Llama 2 13B → chat | −8.2 (1.3) | 2–3 | f b | same |
| Llama 2 70B → chat | −7.2 (1.3) | 1–5 | f b | same |
| Mixtral base → Instruct | −6.0 (1.3) | **2–0** | d b | lab Mixtral-paper rows; +0.3 without |
| Gemma 7B base → IT | −4.5 (1.4) | 0–4 | f | genuine |
| Gemini 2.5 Pro Preview 06-05 → GA | −4.1 (1.7) | **1–0** | b e c | preview on 2025 suites; GA hit by WebDev and FM-T4 floor |
| GPT-5.2 Chat → 5.3 Chat | −3.6 (3.3) | 0–1 | f c | arena |
| GPT-3.5 0613 → 1106 | −3.4 (1.8) | 0–1 | f b | Arena-Hard |
| ERNIE 5.0 Preview 1203 → 1220 | −3.4 (4.0) | none | b c | text arena vs vision arena |
| Granite 4.1 8B → 4.2 8B | −3.2 (2.1) | 0–1 | e c d | 4.1's WebDev bottom (P5); 4.2 on IBM card series |
| Gemma 2B base → IT | −3.0 (1.9) | 0–1 | f b c | genuine |
| Grok 3 Preview → Grok 3 Beta | −2.8 (3.0) | none | b c | arena-only vs Epoch/Aider |
| Gemini 2.5 Pro Exp 03-25 → GA | −2.7 (3.1) | **1–0** | b c e | as 06-05 |
| LLaMA 65B → Llama 2 70B | −2.6 (1.7) | none | e d b | LLaMA-only n=4 paper series |
| Qwen2.5 0.5B → Qwen3 0.6B | −2.5 (2.6) | 1–2 | b c f | mixed multilingual |
| Qwen3-Max-Preview → GA | −2.1 (2.9) | 0–1 | f b c | arena |
| GPT-4o 08-06 → 11-20 | −2.1 (1.2) | 2–8 | f | genuine |
| DeepSeek V3.1 → V3.2-Exp | −2.0 (1.9) | **1–0** | d e b | V3.1 own card (+3.0); V3.2-Exp non-thinking WebDev |
| Kimi K2 → K2-0905 | −1.7 (2.5) | 1–0 | b c | arena tie; 0905 n=3 |
| OLMo 1B (base) → OLMo 2 1B Instruct | −1.7 (2.0) | none | b d | base vs instruct, lab papers |

The JSON also covers a sample of 28 smaller inversions; each has a counterfactual where one was useful. In 4 of them the newer model wins the shared tests and one non-shared result decides the ranking:
- **GPT-4o 05-13 → 08-06:** the FrontierMath floor (P3).
- **Grok 4 → 4.1:** WebDev (P5).
- **GPT-5.3 Chat → 5.5 Instant:** FrontierMath; without it 70.1 > 69.0.
- **GPT-5.6 Sol → GPT-6 Sol:** text arena (P4).

## Recommendations

1. **Fix DE1–DE5 and DE7.** For DE2 and DE3, either split the preview arena rows into preview ids or record the alias in an `identity_note`. At each Epoch refresh, re-check that every stored run id still exists in the source.
2. **Treat floor results as censored.** For example, use a continuity correction of (k+0.5)/(N+1) with the item count N per benchmark, instead of the 0.005 clamp. This removes the GPT-4o 08-06 inversion and softens FrontierMath T4 for every model.
3. **Stop single-provider small series from adding weight.** Either require at least two providers in a non-primary series, or fix its a at the bare series' value and cap its weight. This removes 3 DeepSeek inversions and the LLaMA 65B case, and stops ± from shrinking for Qwen3.5 and Granite.
4. **Give arena a ceiling at the top, or report a provisional flag.** Flag any model with n ≤ 6 whose text arena share is over 15%. This affects GPT-6 Sol, GPT-6 Luna and Grok 4.7.
5. **Handle WebDev's range and thinking modes.**
   - Down-weight WebDev entries below the series' 10th percentile or with fewer than 2,000 votes.
   - Choose arena rows with the same thinking mode within a family (V3.2 vs V3.2-Exp).
6. **Link previews and GAs.** Where the vendor says the GA is the same model, pool the evidence. Otherwise show a "preview scored on different tests" note (Gemini 2.5 Pro).
7. **Base models.** Show them on a separate board or with a flag. Apply the documented chance levels knowing they will widen base-vs-chat gaps by about 5.
8. **Add this pair list as a regression fixture.** Fail when a significant inversion has a newer model that wins the shared tests.
