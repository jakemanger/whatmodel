# Muse Wonder and Muse Wonder Full (2026-10-14)

Meta released both on 2026-10-12 ([announcement](https://research.meta.ai/blog/muse-wonder),
[model card](https://research.meta.ai/static/muse-wonder-model-card)). Muse Wonder is on the Meta Model
API as `muse-wonder-1.0`; Muse Wonder Full is offered to Muse Code subscribers only.

## Facts

- **Price** (Muse Wonder): $4.00 input and $20.00 output per 1M tokens, Standard mode, from Meta's
  [pricing page](https://dev.meta.ai/docs/pricing-rate-limits), observed 2026-10-14. Cached input $0.20;
  Contributor mode isn't offered; no long-context premium.
- **Context**: 1,048,576 tokens for both, from models.dev at commit `b76390e1` (`muse-wonder-1.0.toml`,
  `muse-wonder-full.toml`), which records Meta API probes; the model card says "1M tokens at inference".
- Muse Wonder Full has `availability: "app"` (`app: "Muse Code"`), so the board says "Muse Code only"
  rather than listing it as a comparison-only model.

## Scores

The model card's scorecard (page 3) lists 14 rows. Its methodology says which party produced each result;
only Meta's own runs on benchmarks we already track are used, labelled lab-reported:

| Row | Result source per the card | Used |
|---|---|---|
| ProgramBench (≥95% of tests, mini-swe-agent) | Meta | **Yes**: `programbench-almost1`, Wonder 0.500, Wonder Full 0.590 |
| HealthBench Pro | Meta | No: a different set from `healthbench` (525 professional questions) |
| OSWorld V2.1 | Meta | No: a different version from `osworld-verified` |
| JobBench, MemoryBench, Personal Superintelligence Index | Meta | No benchmark here (MemoryBench and PSI are internal) |
| Harvey LAB-AA, AutomationBench-AA, Terminal-Bench 4.0, AA Intelligence Index | Artificial Analysis | No |
| Vals Finance Agent V2 | Vals AI | No: a copied cell |
| GDP.pdf | Surge | No: a copied cell |
| DeepSWE v1.1 | Datacurve | No: a copied cell |
| SWE-Marathon | Abundant AI | No: a copied cell |

Independent: Epoch AI's `benchmark_data.zip` (downloaded 2026-10-14) has Muse Wonder at max effort on
EBR-bench, 0.314 (run `fMDaGtyboCNfTpP9aStwaU`), added as `epoch-ebr`. Not there yet: the LMArena
dataset (revision `cd6db141`, 2026-10-13) and the Terminal-Bench leaderboard (`1d49c52e`, 2026-10-12).

With two results (Wonder) and one (Wonder Full), both are thinly tested: they're listed with `?thin=1`
until a third result arrives. Recheck LMArena, Epoch and Terminal-Bench as they update.
