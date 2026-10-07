# OpenAI vendor-reported scores: seed file

2026-10-07. Data: [vendor-scores-openai-2026-10-07.json](vendor-scores-openai-2026-10-07.json). Rules: rule (b)
(vendor-reported, approved today) and rule (a) (arXiv CC BY 4.0 copies), as set out in
[vendor-terms-2026-10-07.md](vendor-terms-2026-10-07.md). Nothing in `data/` was changed.

## Counts

| Part | Count |
|---|---|
| `results` | 133 rows across 23 models: 119 from rule (b) and 14 from rule (a). 52 rows are for the priority models: GPT-6 Astra 9, Sol 4, Luna 3, 6.1 Sol 2; GPT-5.6 Sol 12, Terra 11, Luna 11. |
| `ledger` | 3 proposed entries: `first-party-openai-scores`, `paper-2601.03267v2` (GPT-5 card) and `paper-2412.16720v2` (o1 card). |
| `unmatched` | 206 figures whose benchmark has no exact catalogue match, each with a proposed definition. |
| `skipped` | 24 groups, each with its reason. |

## Method

- **Pages.** Each page was fetched once and rendered to text, and each figure was typed in by hand. A self-check then
  confirmed that every typed value appears on its page.
- **openai.com.** openai.com returns HTTP 403, so its posts were read from Internet Archive captures. The capture
  timestamps are in `meta.pages_fetched` and in each note.
- **Direct fetches.** deploymentsafety.openai.com, developers.openai.com and arxiv.org were fetched directly.
- **Pages read:**
  - Announcement posts: GPT-6 Astra; GPT-6 Sol and Luna; GPT-6.1 Sol; GPT-5.6; GPT-5.5; GPT-5.4; GPT-5.4 mini and
    nano; GPT-5.3-Codex.
  - System cards: GPT-6 Astra (with its GPT-6 Sol/Luna appendix), GPT-6.1 Sol addendum, GPT-5.6.
  - Docs: the GPT-6 Astra model page, which has no scores.
  - arXiv, all three verified as CC BY 4.0 on their abs pages: 2601.03267v2, 2412.16720v2 and 2410.21276v1. The
    GPT-4o card (2410.21276v1) had nothing that matched the catalogue.
- **Duplicates.** None of the rows duplicates a row in `data/results.json` (same model, bench and source). When the
  same OpenAI figure appears on several pages, it is recorded once, from the page about that model.

## Decisions to review

1. **Possible third-party runs.** Several OpenAI cells equal independent values already in our data:
   - FrontierMath: GPT-5.5 Tiers 1–3 v2 85.3% and Tier 4 72.5%, GPT-6 Astra Tier 4 97.6%, and GPT-5.6 Sol Tiers 1–3
     89%. These match Epoch's values.
   - Terminal-Bench 4.0: GPT-5.6 Sol 37.3% matches the maintainer-run leaderboard.

   The pages say that OpenAI ran its own evaluations and credit no one else, so these rows are kept and each note
   carries a caution. Drop them if you treat them as the same runs.
2. **GPQA Diamond is unmatched.** No OpenAI page says whether tools were used for GPQA, so all GPQA figures are under
   `unmatched` (11 figures). They are the most likely candidates for `gpqa-diamond` if you can confirm no tools.
3. **Agents' Last Exam.** Rows go to `agents-last-exam-unspecified`, because OpenAI states neither the metric nor
   the harness. GPT-5.6 Sol is skipped because its own post gives 52.7% in the table and 53.6 in the text.
4. **SWE-Bench Pro.** Rows labelled "(Public)" go to `swe-bench-pro`. The GPT-5.6 post's unlabelled row goes to
   `swe-bench-pro-split-unspecified`.
5. **AutomationBench 1.0.6 is unmatched.** The catalogue's `automationbench-v1-0-6` includes the PR #13 fix, which
   GitHub shows is still unmerged.
6. **ExploitGym and SEC-Bench Pro are unmatched.** OpenAI's runs change the time cap (2 h, 6 h or none) and the
   grader, so they differ from the catalogue's pass@1 entries.
7. **HealthBench and HealthBench Hard.** Rows use the standard score that the system cards print in parentheses,
   not the length-adjusted headline.
8. **τ²-bench Telecom.** Only the GPT-5.5 post's "original prompts, GPT-4.1 user" values go to `tau2-telecom`. The
   98.9% that the GPT-5.4 post gives for GPT-5.4 conflicts with that post's 92.8%, so it and its sibling values are
   unmatched.
9. **FrontierMath.** FrontierMath without a version label (GPT-5.5 and GPT-5.4 posts) is unmatched. Its values are
   far below the same models' v2 results, so it must be an earlier problem set.
10. **MMMLU.** The 5 `mmmlu` rows are derived as the mean of 14 per-language accuracies from the GPT-5 and o1 cards,
    and are flagged `derived`.
11. **o1 identity.** The o1 card's o1 column is not the 2024-12-17 API model, by the card's own statement, so it is
    skipped.

## Before import

- **Ledger first.** Add the three `ledger` entries to `data/sources.json`, then run
  `npm run import -- docs/research/vendor-scores-openai-2026-10-07.json`. The import ignores the extra keys.
- **Trailing slashes.** Source URLs drop openai.com's trailing slash. With `exact: true`, `lib/sources.ts` cannot
  match a URL that ends in `/`.
- **Icon.** The import needs `icons/openai.com.png` (`npm run icons`) and a display name in `lib/sources.ts`.
- **Licence copies.** The two arXiv entries have no `license_url`. Add copies under `licenses/` as the other arXiv
  entries do.
- **Trial run.** In a scratch copy of the repo, with the ledger added and a placeholder icon, the import added 133
  rows, `check --validate-only` passed and `npm test` passed (42/42). A full `npm run check` also passed. The LLM
  top 5 was unchanged: gpt-6-astra 84, claude-opus-5-5 83, gpt-6-1-sol 82, claude-fable-5-1 81, claude-sonnet-5-5
  80. Leave-one-out r went from 0.652 to 0.660, and the accuracy median error stayed at 3.4 points.

## Not covered

GPT-5.5 Instant, GPT-5.2 Chat, GPT Transcribe and the GPT Image models. GPT-6.1 Sol has only system-card HealthBench
rows, because its post gives benchmark results only as charts and relative deltas.
