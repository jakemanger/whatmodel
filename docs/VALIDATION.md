# Local verification

Verified 25 September 2026. No GitHub workflow, push or deployment was triggered.

- `npm test`: 8 tests passed, including source scope boundaries, unknown-price budgets, exact evaluator separation, disconnected comparisons and unbounded edit-error ratios.
- `npm run check`: exit 0. 2,001 raw results validated; every measurement resolves to a reviewed source. Missing calibrated scores are explicit coverage warnings, not ignored data-integrity errors.
- `npx next typegen` and `npx tsc --noEmit`: passed.
- `npm run lint`: passed with no warnings.
- `npm run build`: optimized production build passed, including static raw-result and scored model pages.
- Local production HTTP checks: all five HTML categories and their CLI/JSON forms; every comparison selector; local-only price filter; all five sort modes; finite-budget unknown-price exclusion; representative scored and raw-only model pages; legal pages, sitemap, icons and unknown-model 404.
- All 14 public JSON files match the published SHA-256 manifest; 2,001 results are downloadable. Local private paths and operator financial-confirmation details are absent from the exports.
- Browser checks: source/licence table wraps within the page; separate TTS comparison selection works; MOS displays as 3.43 / 5; sortable headings preserve their arrows on one line; local-only results and source links render correctly.
- Model, benchmark and source IDs are unique. Current benchmark source URLs contain no Artificial Analysis records.

`check-final.log`, `test-final.log` and `smoke-final.log` retain detailed output. The smoke check makes local HTTP requests only; it does not execute model commands, invoke paid model APIs or test deployment billing controls.

Held-out validation is descriptive, not proof of calibrated uncertainty or comprehensive quality. LLM correlation is 0.909 (n=1,298); video 0.749 (n=83); STT 0.528 (n=78). The main TTS set is weaker at 0.388 (n=39). Other sets with one evaluation series do not have enough overlap for a meaningful held-out comparison. Different units are reported separately, and validation skips a held-out comparison if removing it disconnects its model and benchmark.
