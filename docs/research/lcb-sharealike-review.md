# LiveCodeBench share-alike handback — frozen

Ready: **13 numerical results, 13 original-catalogue models, two exact date windows, two pinned releases of one independent benchmark source.** Validation passed. The integrated independent154 payload/reports remain unchanged.

## Integration files

- `lcb-sharealike.json`: separately licensed adapted tranche, source allowlists, benchmark definitions and rows. Retain the top-level `licensing` object and row `licensing`, `settings`, `source_id` and `evidence` alongside API provenance.
- `lcb-sharealike-provenance.json`: original metadata, raw per-problem percentages/IDs/source array indices, exact filters, settings limitations and exclusions.
- `lcb-sharealike-NOTICE.txt`: all creators, source links, adaptation notice, disclaimer, adapter licence, and complete unmodified CC BY-SA 4.0 text.
- `lcb-sharealike-LICENSE.txt`: complete official CC BY-SA 4.0 legal text, copied verbatim.
- `lcb-sharealike-validation.json` and `lcb-sharealike-evidence-manifest.json`: numerical verification and pinned evidence hashes.
- `lcb-research/pinned/`: verbatim upstream numerical releases, source licence declarations and aggregation/window code.

Publish the adapted tranche, provenance and notices together. Keep its CC BY-SA 4.0 licence visible with displayed/API results; do not replace it with a blanket permissive licence. This tranche explicitly supersedes the prior frozen report's permissive-only exclusion of LiveCodeBench. CC BY-SA permits commercial reuse under its conditions; no separate approval is needed. The licence's database-adaptation provisions remain applicable; separation alone does not waive them.

## Exact windows and scoring

| Rows | Source commit | UTC bounds (both inclusive) | Problems per model |
|---:|---|---|---:|
| 10 | `aa37a9f8317713b146ff5ada8ab8b2513bb20b70` | 2024-01-01 00:00:00 through 2024-11-01 00:00:00 | 387 |
| 3 | `f186ab5041d6b768733b8ae8145151c867942134` | 2024-08-01 00:00:00 through 2025-05-01 00:00:00 | 454 |

These reproduce each release's default website slider bounds. They are **not** an entire month of November/May. Use the supplied precise benchmark IDs; do not merge into vaguely named v3/v5/v6 or full-month-window scores. The older release's selected records actually end October 6, 2024; the newer release's records end April 7, 2025. The source dataset and question sets are fixed by commit.

Only code-generation overall pass@1 is exported. Each score exactly reproduces the website's `Number(mean(per_problem_percentages).toFixed(1)) / 100`. All models within a window have identical unique problem sets. No difficulty components, repair aggregates, full-history totals or additional effort variants are added. Exactly one window per model, with no existing LiveCodeBench result for any of these models in the 1,837-row integration snapshot checked.

## Models and settings

| Model | Source configuration | Window problems | Pass@1 (%) |
|---|---|---:|---:|
| deepseek-v3 | `deepseek-chat` | 387 | 48.9 |
| llama-3-1-405b | `meta-llama/Meta-Llama-3.1-405B-Instruct-FP8` | 387 | 37.3 |
| llama-3-1-70b | `meta-llama/Meta-Llama-3.1-70B-Instruct` | 387 | 26.3 |
| llama-3-1-8b | `meta-llama/Meta-Llama-3.1-8B-Instruct` | 387 | 16.1 |
| llama-3-3-70b | `meta-llama/Llama-3.3-70B-Instruct` | 387 | 31.8 |
| qwen2-5-32b | `Qwen/Qwen2.5-32B-Instruct` | 387 | 40.1 |
| qwen2-5-72b | `Qwen/Qwen2.5-72B-Instruct` | 387 | 41.7 |
| qwen2-5-7b | `Qwen/Qwen2.5-7B-Instruct` | 387 | 25.3 |
| qwen2-5-coder-32b | `Qwen/Qwen2.5-Coder-32B-Instruct` | 387 | 41.6 |
| qwen2-5-coder-7b | `Qwen/Qwen2.5-Coder-7B-Instruct` | 387 | 26.2 |
| o3 | `o3__high` | 454 | 75.8 |
| o4-mini | `o4-mini__high` | 454 | 80.2 |
| qwen3-235b-a22b | `Qwen/Qwen3-235B-A22B` | 454 | 65.9 |

High effort for o3/o4-mini is explicit in the published configuration and chosen in advance, not by best-score selection. Their published endpoint labels lack dated API snapshots; none is invented. Qwen3 is the original April 2025 hybrid 235B-A22B checkpoint; thinking mode and budget are not disclosed. Llama 3.1 405B is specifically the FP8 Instruct release. Llama 3.3's upstream hyperlink incorrectly targets 3.1; both `model_name` and `model_repr` correctly identify 3.3 and are retained. DeepSeek-V3 uses the December 26, 2024 release before V3-0324 existed, resolving the floating endpoint temporally.

Actual per-run temperature, top_p, sample counts, maximum tokens, execution dates, harness revision and weight digests are not supplied in these website records. They remain explicitly unknown, rather than borrowing generic harness defaults. Result `date` records publication date. The website's misleading `release_date` field is an estimated contamination cutoff, not an evaluation date or verified checkpoint release date. No contamination-free guarantee is asserted.

## Own-evaluation review and exclusions

These are author-maintained numerical releases committed by LiveCodeBench author Naman Jain; they contain per-problem scores, not model-card comparisons. Individual execution operators/logs are not documented for the retained rows. Known vendor submissions were checked and excluded:

- DeepSeek-R1-0528: [submission #7](https://github.com/LiveCodeBench/submissions/pull/7) explicitly says the DeepSeek team evaluated on its internal platform.
- EXAONE 4.0: [submission #10](https://github.com/LiveCodeBench/submissions/pull/10) comes from LG AI Research.
- OpenCodeReasoning/OpenReasoning Nemotron: submissions #8/#9; vendor submissions and different checkpoints from the original catalogue.
- Nemotron Ultra 253B: website score exists, but own-run origin was not established; withheld.
- `build/v5.json` DeepSeek-V3: mixes two 880-problem runs under the same display label with two metadata entries (DeepSeek API and TogetherAI). The unambiguous earlier release is used instead.
- Gemini previews and floating Mistral/Codestral aliases: not silently mapped to stable catalogue checkpoints.
- Test-output prediction and execution: no exact original-catalogue matches in those releases. Repair overlaps the retained generation family and was not imported.

## Validation and frozen state

All 13 scores were independently re-extracted and checked by executing the actual published website aggregation helpers. Commit bytes, SHA256 hashes, row metadata, array indices, problem sets, score scale, exact source allowlists, complete licences and the original independent154 freeze hashes passed. The current shared-data duplicate check passed. No shared app/data files, pushes or workflows were changed.

The shared dataset is changing concurrently: at integration, retain one code-generation window per model and skip newly conflicting rows. A pre-integration read-only verifier is available as `python3 /tmp/whatmodel-expansion/lcb-research/validate_lcb.py`; its duplicate gate will intentionally flag these rows after they are integrated. Do not rerun the builder on a frozen tranche.

Payload SHA256: `8baea3ef80838448675a33eacf4616bf9c367cfaa6aaeac8e78e75f3877617fe`.
