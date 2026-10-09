# Pass 6: CharXiv (2026-10-09)

Goal: put more models on the CharXiv tests that Command A+ reports, so its vendor-reported reasoning score (0.527, Cohere blog) can be read against them. Candidates are in `pass6-charxiv-2026-10-09.json`. `data/` was not edited.

All rows use the validation set without tools. `charxiv-rq` is the reasoning questions and `charxiv-dq` is the descriptive questions. No new benchmark ids or models are needed.

## Result

There are **70 candidate rows covering 53 catalogue models**:

| Benchmark | Independent | Lab | Total |
|---|---|---|---|
| charxiv-rq | 12 | 30 | 42 |
| charxiv-dq | 15 | 13 | 28 |

Every row resolves to its ledger id once the proposed ledger changes are applied; the check uses a Python port of `sourceIn()`. All model and benchmark ids exist, there are no duplicates, and every touched run has at least 2 models.

| Run (ledger x bench) | Models | Kind |
|---|---|---|
| card-final-apriel-1-6-15b-thinker x rq / dq | 6 / 6 | ServiceNow's VLMEvalKit runs. Apriel 1.6 is the lab row. The other five are independent: GPT-5 high, Claude 3.7 Sonnet thinking, GLM-4.5V thinking, Gemini 2.5 Flash high and Grok 4 Fast thinking. |
| paper-2510.01141v1-apriel-1-5 (new, CC BY 4.0) x rq / dq | 3 / 3 | The same ServiceNow evaluation. Only the models missing from the card are taken: Llama 4 Maverick, Magistral Small 1.2 and Qwen2.5-VL-32B. |
| inspect-charxiv-meridianlabs (new, MIT) x rq / dq | 3 / 3 | Independent: GPT-6 Astra, Claude Fable 5 and GPT-4o (gpt-4o resolves to 2024-08-06). |
| card2-coherelabs-north-micro-vision-instruct (new, Apache-2.0) x dq | 4 | Cohere's own VLMEvalKit runs of other labs' small VLMs: Ministral 3 3B, Qwen3.5 2B (non-thinking), Gemma 4 E2B and Phi-3.5-vision. |
| speed-meta-muse-glimmer-30b x rq | +1 (now 2) | Meta's internal run of Gemma 4 31B (thinking), which joins the existing Muse Glimmer row. |
| first-party-google-scores x rq | +9 (now 12) | Gemini 2.5 Flash-Lite/Flash/Pro, 3 Flash, 3 Pro, 3.1 Flash-Lite, 3.1 Pro, 3.5 Flash and 3.5 Flash-Lite. |
| first-party-anthropic-scores x rq | +3 (now 6) | Opus 4.5, 4.6 and 4.7. |
| first-party-openai-scores x rq / dq | 2 / 7 | RQ: GPT-5.2 (xhigh) and GPT-5.1 (high), both labelled "no tools". DQ: the GPT-4.1 table (GPT-4.1, 4.1 mini, 4.1 nano, GPT-4o 2024-11-20, GPT-4o mini, o1 high, GPT-4.5). |
| first-party-qwen-scores (new) x rq / dq | 8 / 3 | Qwen3.8-Max, 3.8-Flash-Next, 3.7-Plus, 3.6-Plus, 3.5-397B, Qwen3-VL-235B Thinking and Instruct, and Qwen2.5-VL-72B. |
| card-qwen--qwen3.8-27b x rq | 2 | Qwen3.8-27B and Qwen3.7-Plus, both "Without CI". |
| first-party-moonshot-scores (new) x rq | 3 | Kimi K2.5, K2.6 and K3, all without tools. |
| first-party-xiaomi-scores (new) x rq | 2 | MiMo-V2-Omni and MiMo-V2.5. |
| first-party-amazon-scores x dq | 2 | Nova Premier and Nova Pro (the descriptive half of the cells already used for RQ). |

## Reading Command A+ against these

Command A+'s 0.527 is Cohere's own number. It sits with mid-2025 models:

| Model | Score | Source |
|---|---|---|
| Qwen2.5-VL-72B | 0.497 | Qwen |
| Magistral Small 1.2 | 0.529 | ServiceNow |
| Llama 4 Maverick | 0.550 | ServiceNow |
| Apriel 1.6 | 0.560 | ServiceNow |
| Gemini 2.5 Flash | 0.565 | ServiceNow |
| Gemini 2.5 Flash | 0.637 | Google |

Every other 2026 model with a CharXiv figure scores between 0.73 and 0.89.

Command A+ and Command A Vision are still only in Cohere's own two-model run. No independent CharXiv run contains a Cohere Command model. Cohere's North Micro card is a DQ run of small non-Cohere models only. So these rows pin the test's difficulty, but they cannot check Cohere's own number directly.

## Decisions for the owner

1. **The CharXiv website leaderboard has no licence.** The data is `charxiv/charxiv.github.io@5a41705 data/val_result.csv`. The repo has no LICENSE file, and the footer only credits its page templates.
   - The Apache/CC BY-SA repo `princeton-nlp/CharXiv` is at HEAD 7ebe88f, the commit already pinned. Its README table and the HF dataset stop at the Aug 2024 models.
   - The website holds 20 rows (11 catalogue models) that are the authors' own runs: o1-2024-12-17, GPT-4o 2024-11-20, Llama 3.2 11B/90B Vision, Molmo 7B-D/72B, Phi-3.5-vision, Pixtral 12B, Qwen2-VL 7B/72B and Claude 3.7 Sonnet. These rows have sub-scores and match code the authors added.
   - It also holds 16 rows (8 catalogue models) that print only an Overall score and match the makers' own figures (GPT-4.1 family, GPT-4.5, o1/o3/o4-mini high, Qwen2.5-VL-72B). Those look like relayed vendor numbers, not independent runs.
   - All are held. Ask the CharXiv authors for permission, or for them to add the rows to the README.
2. **OpenAI's GPT-4.1 table, RQ cells (7 rows held).** OpenAI's later GPT-5-for-developers post relabels GPT-4.1's 56.7 / 56.8 / 40.5 as "python enabled". The DQ cells from the same table are in results. Merge the 7 RQ rows if you read the GPT-4.1 post as no-tools.
3. **GPT-5.5 Instant 0.816 (held).** It is a chart label, and the page states neither tools nor effort.
4. **Single-model runs (held).** EXAONE 4.5 0.717, ERNIE 5.0 0.671 / 0.8905 (mapped to ernie-5-0-0110 by timing) and InternVL2-4B. An earlier pass also left EXAONE's vision rows out for this reason.
5. **ERNIE 5.0 report competitor DQ cells (held).** These are GPT-5, Gemini 2.5 Pro and Gemini 3 Pro, from a CC BY paper. The table's RQ cells look copied from the makers, so cell-by-cell provenance is unclear.
6. **Test set.** The CharXiv paper v1 Table 4 has the authors' TEST-set scores for 7 catalogue models from 2024. They are not mixed with the validation rows. They would need new ids and add little.
7. **Flags on rows that are in results:**
   - **Qwen's corrected answer key.** Qwen's Aug 2026 tables say CharXiv RQ ground-truth errors were corrected. That covers Qwen3.8-27B, 3.8-Max, 3.8-Flash-Next and Qwen3.7-Plus 0.858; Qwen3.7-Plus is 0.844 on the original key in its own post.
   - **Anthropic grader.** Opus 4.5's 0.657 uses Anthropic's older Sonnet-4 grader. The other Anthropic rows use the Sonnet 4.6 grader.
   - **Repeated figures.** qwen3-5-397b-a17b 0.808 and mimo-v2-5 0.81 repeat existing rows that are alone in their runs, so this counts each figure once.
   - **MiMo values** are chart labels rendered from data in the page HTML. They were not read from bar heights.
   - **Gemini 2.5 Flash/Pro and Flash-Lite** are mapped to the GA ids because no snapshot is named.
   - **inspect_charxiv** asks one question per prompt, applies typo-corrected targets and grades with the gpt-4o alias.
   - **Muse Glimmer ledger.** `speed-meta-muse-glimmer-30b` still describes itself as a speed table. Widen its name or attribution if Gemma 4 31B is merged.
8. **Two runs from one evaluator.** ServiceNow's two runs are the same evaluator, split so that nothing is recorded twice. The alternative is to take all 9 models from the paper and leave Apriel 1.6 out.

## Checked, nothing usable

- **No text CharXiv figure:** Mistral, Meta Llama, Microsoft Phi, xAI Grok, Reka, IBM Granite, StepFun, Tencent, MiniMax, the GLM-V cards (images only), Cohere's Command and Aya pages, and the Nova 2 report.
- **Gaps (not in the catalogue):**
  - Claude Mythos 5 and Mythos Preview.
  - Seed 2.0 and 2.1, Seed1.5-VL.
  - The InternVL2.5, InternVL3 and InternVL3.5 series.
  - Qwen3-VL small sizes, Kimi-VL-2506, Apriel 1.5 and Doubao 1.5 Pro.
  - LLaVA-OV-72B -ov-chat, which is a different checkpoint from the catalogued ov-sft.
- **Open-licence papers screened that use subsets or copied numbers:** DatBench, Chartographer, Can't Find Waldo, Hard Vision, Vero (gpt-5-nano only), DeepInsight (Qwen3.6-27B only), OpenMMReasoner, OpenVLThinkerV2 and Sakana Fugu.
