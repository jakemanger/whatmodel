# Pass 12: Vals AI's openly licensed papers (2026-10-11)

Vals AI is an independent evaluator that runs its own tests. Earlier briefs wrongly listed it as an aggregator. To
find papers by Vals AI people, I searched arXiv by author, by affiliation text and by title, and checked every arXiv
link on the vals.ai benchmark pages. I read those pages only to find papers and took no numbers from them. This
turned up four papers, all CC BY 4.0. Legal Research Bench was already imported in pass 11. The other three add 44
rows to three new benchmarks. In every row the authors ran the model themselves, and none of the rows duplicates an
existing one.

| Paper | Licence | Benchmark id | Rows | Not imported |
|---|---|---|---|---|
| Finance Agent Benchmark, arXiv:2508.00828v1 (May 2025) | CC BY 4.0 | `finance-agent-benchmark-v1-class-balanced` | 18 | Claude 3.7 Sonnet without thinking and Grok 3 Mini Fast low (lower settings of printed models); Gemini 2.5 Pro Preview (gap); Grok 3 Mini Fast high (held) |
| Vibe Code Bench, arXiv:2603.04601v3 (May 2026; v1 and v2 are also CC BY, with the same Table 4) | CC BY 4.0 | `vibe-code-bench-test` | 15 | plain "Claude Opus 4.6" (a lower setting than "Opus 4.6 Thinking") |
| FormalProofBench, arXiv:2603.26996v1 (Mar 2026; Vals' "ProofBench") | CC BY 4.0 | `formalproofbench` | 11 | DeepSeek V3.2 Nonthinking (lower setting); GPT 5.1 Codex Max (not catalogued) |
| Legal Research Bench, arXiv:2610.00609v1 | CC BY 4.0 | (pass 11) | 0 | already in data |

## Choices

- **Finance Agent Benchmark**: Table 2 class-balanced accuracy on all 537 questions. The paper calls this its
  headline metric. Naive accuracy scores the same answers with different averaging, so it is not imported. I took
  model ids and thinking settings from the authors' harness at `vals-ai/finance-agent@ac07b92` (2025-05-16, four days
  before submission). The harness confirms that the Claude 3.7 Sonnet thinking run used a 13,384-token budget, and
  that the o-series runs sent no `reasoning_effort`. These files are used as identity evidence only. This is the
  paper's v1 test with 537 questions. The later Finance Agent v1.1 and v2 boards exist only on vals.ai, which is
  all rights reserved.
- **Vibe Code Bench**: Table 4 accuracy on the 50-app test split. Model ids and reasoning effort come from Table 15.
  The paper prints two Opus 4.6 rows. Following the highest-reasoning rule, I used "Claude Opus 4.6 Thinking" (53.50).
  The plain row scored higher (57.57), and the paper notes that Opus's adaptive thinking makes its effort setting
  matter little.
- **FormalProofBench**: Table 2 accuracy on 200 Lean 4 problems. All models ran with provider-default settings
  through each maker's own API. The paper prints two DeepSeek V3.2 rows. The thinking row (3.0) is used, not the
  nonthinking one (8.0).

## Gaps and held

- **Gap: Gemini 2.5 Pro Preview** (FAB, 28.4). The harness id is `gemini-2.5-pro-preview-03-25`. On 2025-05-06 that
  id began pointing to the 05-06 checkpoint, and the paper does not date its runs.
- **Gap: GPT-5.1-Codex-Max** (FormalProofBench, 12.0). Not in the catalogue.
- **Held: Grok 3 Mini Fast Beta, high reasoning** (FAB, 30.9). The proposed mapping is `grok-3-mini-beta`. The only
  same-model statement I found is on Oracle Cloud's page for the GA `grok-3-mini` / `grok-3-mini-fast` ids. I could
  not retrieve xAI's own 2025 docs.
- **No open paper** for CorpFin, CaseLaw, TaxEval, MedCode, MedScribe, SAGE, EMB, SRE Bench, RSI Index and Vals'
  other website-only benchmarks.

Validation: I ran the import in a scratch copy (`apply-pass2.mjs`, `npm run import`, `node scripts/check.ts
--validate-only`). It reports 0 skipped and passes. The only warnings are icon warnings, and the 19 providers they
list are unrelated to this pass.
