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

Model updates use one `field: value` per line, such as `params: 8B`, `context: 128k`, or `released: 2026-01`. Prices are plain numeric USD amounts (`price_in: 0.40`), in the catalogue's category unit. New models require `maker` and `open_weights: yes/no`. Local run proposals require `command`, `quant` and `size`; commands remain inert text. The current catalogue has one primary API slot, so an API proposal may replace it rather than append another provider; the report calls this out.

After approving and applying a diff manually, run `npm run check`, `npm test`, `npm run typecheck`, and `npm run pages`. Regenerate issue forms with `npm run contrib:forms`; edit `forms.ts`, not generated YAML. No GitHub automation is installed by this tool.
