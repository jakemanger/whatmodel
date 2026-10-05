# Local contribution reviewer

This tool prepares a review report and proposed data files from the six GitHub issue forms. It does not edit the catalogue, execute submitted commands, create commits, post comments, open PRs, or enable a GitHub workflow.

Save an issue as JSON with a `body` string and `labels` array (label names or GitHub label objects), then run from this repository:

    npm run contrib:review -- --issue /path/to/issue.json --out /path/to/new-review-directory

Add `--fetch` to retrieve the cited source without credentials. Requests reject private addresses, pin the checked DNS answer, recheck redirects, and cap response size and duration. Offline is the default. Add `--repo /path/to/checkout` to review another checkout.

The output contains:
- `report.md` and `report.json`: validation, warnings, source evidence and individual proposed changes.
- `proposed-data/`: complete copies of touched data files, ready to diff against `data/`.
- `baseline-sha256.json`: hashes of the original files. Rerun if the catalogue changes before review.

Existing output directories are refused. Exit code 2 means invalid input or an execution error; 0 does **not** mean the evidence is approved. All proposed changes require a maintainer to check the exact model, source passage, evaluation conditions and licence. Fetching a page or matching text does not verify a claim.

Benchmark proposals require an already allowed source whose licence covers results; vendor-facts scopes cannot approve scores. Unknown sources are recorded as unclear proposals, never added to the source ledger automatically. Corrections cannot silently overwrite conflicting result rows. Accuracy above 1 requires an explicit percent sign, unless the benchmark defines a raw scale. Error ratios can exceed 1.

Model updates use separate field, current-value, correct-value and reference inputs. The website pre-fills field and current value; a stale current value prevents a proposal. Test results use separate model, benchmark, score and reference inputs. No prose or delimiter parsing is needed to extract those values. Missing attribution, unknown model/test ids, incomplete run options and source-only suggestions are retained as structured review reports rather than guessed. API suggestions never replace the existing primary API automatically.

The issue forms ask only for a name/model and official link for missing models, providers and new benchmarks. Additional fields are optional. All submissions and notes are preserved in report.json and report.md. Existing issues using older combined text fields need conversion to the new fields before running this reviewer.


After approving and applying a diff manually, run `npm run check`, `npm test`, `npm run typecheck`, and `npm run pages`. Regenerate issue forms with `npm run contrib:forms`; edit `forms.ts`, not generated YAML. No GitHub automation is installed by this tool.

## Contribution design references

Reviewed the [Open ASR submission checklist](https://github.com/huggingface/open_asr_leaderboard/blob/main/.github/PULL_REQUEST_TEMPLATE.md) and [Every Eval Ever contribution guide](https://github.com/evaleval/every_eval_ever/blob/main/CONTRIBUTING.md). Both use explicit model/measurement fields and reviewable file contributions. These forms keep that separation while asking for only the fields needed for a small correction. Optional evidence can be filled in during review; missing data never becomes a guessed catalogue value.

[GitHub documents prefilling custom text inputs](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue). The site therefore lets contributors choose a field first and passes its name and current value into text inputs, rather than depending on unsupported dynamic dropdown behaviour.
