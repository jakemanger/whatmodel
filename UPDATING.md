# Update routine

This is the prompt for the scheduled agent that keeps `data/` current. Prepare updates locally. Ask the owner before a push, PR, or workflow run.

## Job

You collect raw facts: benchmark results, prices, run commands and measured speeds. You never assign
scores or rankings. The score is computed from `data/results.json` by `lib/score.ts`, one fit per category.

Categories: `llm` (default), `image`, `video`, `tts`, `stt`. Benchmarks and their category are in
`data/benchmarks.json`.

Task membership is explicitly reviewed in `data/tasks.json`. Assign a new benchmark only to tasks
its actual input/output protocol measures; do not infer task capability from model names. Task
rankings fit only those measurements and retain disconnected comparison sets. Signed linear
metrics retain raw units (`kind: "linear"` with a documented fixed `latent_scale`), never a
fabricated accuracy or Elo conversion. Lower-is-better distances keep their raw units with
`direction: "lower"`; do not store FID as a percentage or relabel it as a word-error rate. Run `npm run score-coverage` to audit every model's status.

1. Read `data/models.json`, `data/results.json`, `data/benchmarks.json` and `data/speeds.json`.
2. Search for anything new since the latest `date` in results.json:
   - Independent evals, ONLY from sources marked "allowed" in `data/sources.json` (the licence ledger),
     e.g. the LMArena leaderboard dataset on Hugging Face (CC BY 4.0) for text / image / video Elo
   - Lab announcements and model cards
   - New open-weights releases: huggingface.co trending, ollama.com/library
   - Measured local speeds: llama.cpp discussions and scoreboards, model cards, reputable benchmarks
3. Write what you find to a seed file with `{ models, results, speeds }`, in the format described in
   `SEED.md`. Then `npm run import -- seed.json`. It skips duplicates and
   anything pointing at unknown models or benchmarks, and says so.
   - New models need `category` (unless llm) and exact identity evidence. Add a verified API link or local
     command when available; comparison-only models may have neither. Never invent a run option to make
     a model appear on the board. An announced limited preview may use `availability: "preview"`
     with a reviewed `availability_source` URL: it appears on the default board as "limited preview",
     but cannot satisfy a local-only or price filter without a verified run route. Remove the preview
     designation when broad access is verified. Prices may be unknown. Omitted variant `gb` can be estimated from
     `params_b` and precision, and must be labelled as an estimate.
   - Speeds: `{ model, quant, hardware, kind, offload, value, unit, engine, settings, source }`. Name the
     hardware as it appears in `data/hardware.json` so it can be matched to users' machines.
   - A model from a provider that has no logo yet needs one. See [Maker icons](#maker-icons).
4. Set `data/meta.json` `updated` to the current UTC time. If a result comes from a site not used
   before, run `npm run icons` to fetch its favicon, and add a display name in `lib/sources.ts`.
5. Run `npm run check`. It must pass. Look at each category's top 5 and leave-one-out error, and say in
   the PR if either moved a lot. Do not enable speed calibration merely because more reference measurements
   were added: exact model, download, hardware, engine and workload matching must first be established.
6. Ask before triggering GitHub Actions through a push or PR. After approval, open a PR titled `data: <what changed>` that lists each added model, result and speed with its source.

## Rules

- **Licensing first.** Only take numbers from sources in `data/sources.json` with verdict "allowed".
  To add a source: read its terms or licence, and only if it permits commercial reuse (an open licence
  such as CC BY, CC BY-SA, MIT or Apache-2.0 covering the actual data or document)
  propose a ledger entry in the PR with the exact clause quoted. If the terms are missing or unclear,
  don't use it: say so in the PR so the owner can ask for permission. `npm run check` fails on any number
  from an unlisted or disallowed source.
- **Vendor-reported scores** (owner rule, 2026-10-07; review in `docs/research/vendor-terms-2026-10-07.md`):
  a score a model's own maker publishes for its own model, in its announcement, system or model card or
  docs, may be recorded without an open licence. Record it by hand, one figure at a time, with the exact
  page URL, date and printed settings. Only use benchmarks already in `data/benchmarks.json`. Never take other
  labs' rows or cells the vendor credits to a third party, and never script it or copy tables, charts or text.
  Mark rows `by: "lab"`, use a `first-party` ledger entry with licence "Factual vendor-reported score (not licensed
  content)", prefer an openly licensed copy when one exists, and remove the rows if the vendor objects.
- **Never** use artificialanalysis.ai (personal, non-commercial use only), and never scrape a site whose
  terms forbid it. Prefer official datasets and APIs, and credit sources as their licence asks.

- Never guess or recall a number. If you can't find it on a page, leave it out.
- Scores are fractions (0.873, not 87.3), except Elo benchmarks, which are the rating number.
  Error rates (WER) are fractions too.
- Use the model's highest reasoning setting available through its API, and put the setting in `note`.
- When independent and lab numbers both exist, record both.
- A verified result is useful even if it is the model's only measurement. Add its precisely defined benchmark;
  the scoring code reads each result against the other models in the same evaluator's run, so it withholds
  runs with one model and benchmarks with fewer than three models across runs. Do not discard genuine evidence to meet
  a coverage target, or manufacture extra independent tests from correlated subtasks.
- Don't edit or delete existing results unless the source page has changed. If a result is a failed run, not a
  measurement of ability, keep it and set `invalid` to the reason: the source flags the run as failed, it scores
  far below the test's random baseline (wrong format or unparsed answers), or it is structurally impossible
  (e.g. 0% on every function-calling category). Invalid results stay visible on model pages but are kept out of scores. Say so in the PR if it has.
- A model whose API and weights are both gone stays (it anchors the fit) with `api: null` and no variants;
  it's no longer listed.

## Maker icons

Each model row shows its maker's logo. `data/icons.json` holds one entry per logo, one line each:

```json
{"id":"qwen","name":"Qwen","providers":["Alibaba (Qwen)"],"models":{"Alibaba":["qwen*","qwq*"]},"url":"https://cdn-avatars.huggingface.co/…","page":"https://huggingface.co/Qwen","retrieved":"2026-10-05"}
```

- `id`: the file name. The logo is `icons/providers/<id>.png`, a 64×64 PNG that is committed.
- `name`: whose mark it is. Used for alt text and credits.
- `providers`: the exact `provider` values from `data/models.json` that show this logo. A provider can
  appear in only one entry.
- `models` (optional): marks for model families, as `{ provider: [model ids] }`. An id ending in `*`
  is a prefix. A family mark only applies to models from that provider, so a community fine-tune keeps
  its own maker's logo. Keep these few, and only add one when the family has its own official mark.
- `url`: the exact image, as published by its owner. This can be from the maker's own site (an
  apple-touch-icon, web app manifest icon, SVG favicon, favicon or square og:image) or the organisation's
  own Hugging Face or GitHub avatar.
- `page`: the official page that links or shows the image, which proves it belongs to the maker.
- `retrieved`: the date you fetched it, as YYYY-MM-DD.
- `note` (optional): anything unusual, such as why a fallback source was used.

Pick the largest official mark available. An apple-touch-icon, manifest icon, SVG or organisation
avatar is better than a 16px favicon.ico. Never use logo aggregators or favicon services, such as
Clearbit, Google's s2 favicon service, logo.dev, Brandfetch or icon sites. `npm run check` rejects them.
A Wikipedia or Wikimedia upload is only acceptable when the maker has no web presence of its own, and
you must say so in `note`. Skip auto-generated avatars (identicons) and personal photos. The logo
represents the model's maker (its `provider`), not whoever uploaded or quantised the weights.

To add or fix a logo:

1. Add or edit the entry in `data/icons.json`.
2. Run `npm run icons -- <id>`. This downloads `url` and writes `icons/providers/<id>.png`.
   `npm run icons -- --refresh` downloads every logo again. Normalising the image needs ImageMagick
   (`magick`) or macOS `sips`, plus `rsvg-convert` (librsvg) for SVG sources.
3. Look at the PNG, then run `npm run check`. It fails on a broken entry, a missing or wrongly sized
   file, or a file with no entry. It only warns about providers without a logo.
4. Commit both the entry and the PNG.

Logos are trademarks of their owners and are shown only to identify each model's maker.
`icons/providers/` is not covered by the data licence (see [DATA-LICENSE.md](DATA-LICENSE.md)).

## Reviewed-source edition

Read `docs/SOURCE-AUDIT.md` and `data/provenance.json` first. Measure improvement against the original
catalogue as well as total rows. An empty category is not permission to fill it with unverifiable numbers.
A model-weight licence does not automatically license a separate leaderboard or hosted database.
A code licence does not automatically license a live service's ratings. Public access is not permission.

- Cite pinned dataset/model-card files. For Epoch, use only the internal CSV members approved in the
  ledger; external CSVs retain upstream restrictions. Never reintroduce restricted measurements via a mirror.
- Preserve full licence/copyright notices in `licenses/` and credit transformations in the ledger.
- Honour share-alike and conditional commercial grants. Record eligibility checks privately; reassess
  conditional grants if revenue thresholds or ownership/control change.
  Conditional source terms are not removed by this project's compilation licence.
- First-party facts (owner policy, 2026-09-25): a vendor's own published list price, context window or max output
  for its own service may be recorded by hand from its official page, with the link and "observed <date>" in
  `price_note`/`context_note`, under a `first-party-<vendor>` ledger entry (kind `first-party`). This covers a host's
  own price for its own endpoint. It does not cover aggregators (Artificial Analysis, OpenRouter pages or API data,
  price-comparison sites, blogs), and it never covers benchmark scores.
- API speed is measured by us: `node --env-file=.env.local scripts/measure-api.ts` (needs `OPENROUTER_API_KEY`;
  targets in `data/api-targets.json`, pinned to the provider whose price we list). Raw runs go to `data/api-speed.json`.
- Community local speeds come from bench submissions. The maintainer reviews each one with checks kept outside
  this repo before it is merged. Never import an unreviewed submission.
- `api.url` is an outbound link, not evidence. A numeric price needs a separate approved `price_source`.
  Unknown prices are permitted; do not invent zero. Keep the served provider consistent with the price.
- Context needs `context_source`. Label estimated memory; do not imply it covers the maximum context.
- Verify the exact checkpoint, benchmark version, reasoning/tool setting, and table column. Do not merge
  Reasoning and Instruct checkpoints or different LiveCodeBench releases.
- A source's `allowed` verdict is our documented review decision, not a legal guarantee.
- Run `npm run check`, `npm test` and `npm run typecheck`.
