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

The model card's scorecard (page 3) lists 14 rows, and its methodology says which party produced each
result. Only Meta's own runs are used, labelled lab-reported. Where a test also appears in another lab's own
report, both labs' runs are recorded on one benchmark:

| Row | Result source per the card | Recorded as |
|---|---|---|
| ProgramBench (≥95% of tests, mini-swe-agent) | Meta | `programbench-almost1`: Wonder 0.500, Full 0.590 |
| HealthBench Pro | Meta | `healthbench-professional` (new): Wonder 0.605, Full 0.623. Anthropic's Claude Opus 5.5 card reports the same test as "HealthBench Professional" (525 physician-authored conversations), length-adjusted: Opus 5.5 0.656, Opus 5 0.598, Fable 5.1 0.621, the exact values Meta's card shows for Claude. |
| OSWorld V2.1 (partial) | Meta | `osworld-2-1` (new): Wonder 0.726, Full 0.784. The authors tagged `osworld-v2.1` on 2026-09-16; Anthropic's Opus 5.5 card used "the September 10, 2026 versions" of the task files (Opus 5.5 0.818, Fable 5.1 0.807, Opus 5 0.740), which Meta's card also treats as V2.1. |
| JobBench (mean reward) | Meta | `jobbench` (new): Wonder 0.705, Full 0.753; the Muse Spark 1.3 methodology calls the same measure the mean rubric score (Spark 1.3 0.649, Spark 1.2 0.616). |
| MemoryBench, Personal Superintelligence Index | Meta | No: internal tests no one else runs |
| Harvey LAB-AA, AutomationBench-AA, Terminal-Bench 4.0, AA Intelligence Index | Artificial Analysis | No |
| Vals Finance Agent V2 | Vals AI | No: a copied cell |
| GDP.pdf | Surge | No: a copied cell |
| DeepSWE v1.1 | Datacurve | No: a copied cell |
| SWE-Marathon | Abundant AI | No: a copied cell |

Independent: Epoch AI's `benchmark_data.zip` (downloaded 2026-10-14) has Muse Wonder at max effort on
EBR-bench, 0.314 (run `fMDaGtyboCNfTpP9aStwaU`), added as `epoch-ebr`. Not there yet: the LMArena
dataset (revision `cd6db141`, 2026-10-13) and the Terminal-Bench leaderboard (`1d49c52e`, 2026-10-12).

## Muse Spark 1.3 methodology (2026-09-02)

The [Muse Spark 1.3 evaluation methodology](https://research.meta.ai/static/muse-spark-1-3-multimodal-evaluation-methodology)
(page 4 scorecard) adds Meta's own runs for Muse Spark 1.3 (max) and 1.2 (xhigh) on tests we track:
`jobbench`, `osworld-2-0808` (Spark 1.3 only: "All results on OSWorld 2.0 were evaluated using version 08.08,
except Muse Spark 1.2, which was evaluated on version 06.24"; Anthropic's Fable 5.1 card used the same
"August 2026 task release": Fable 5.1 0.779, Opus 5 0.754, Fable 5 0.729), `deepsearchqa`,
`automationbench-public-zapier` (the public v3 set: Meta's Opus 5 figure equals Zapier's README),
`terminal-bench-2.1`, and `deepswe-v1-1` (Spark 1.3 only; Meta took Spark 1.2's from Datacurve). Not
recorded: SWE-Atlas Codebase QnA and MRCR v2 at 256K-1M (no matching benchmark here), GDPVal-AA (Artificial
Analysis), the internal Agentic IF Index, and other labs' columns.

With these, Muse Wonder has 5 results and Muse Wonder Full 4, so both are on the main list.
