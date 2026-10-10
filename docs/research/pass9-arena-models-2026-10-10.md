# Pass 9: LMArena entries not in the catalogue (2026-10-10)

The candidates are in `pass9-arena-models-2026-10-10.json`. `data/` was not edited.

## Source and method

- **Dataset:** `lmarena-ai/leaderboard-dataset` (CC BY 4.0, ledger `lmarena-dataset`). I used main revision `088c607919d1d0d3385409070657f4623e414872`, which was still main on 2026-10-10.
- **Downloads:** the `latest` split of all 22 configs, plus the `full` split of the 11 configs we import. File sha256 values match the HF LFS oids.
- **How existing rows map configs to benchmarks:**

  | Config | Benchmark |
  |---|---|
  | text_style_control | lmarena-text |
  | vision_style_control | lmarena-vision |
  | webdev | lmarena-webdev |
  | document_style_control | lmarena-document |
  | search_style_control | lmarena-search |
  | text_to_image | lmarena-image |
  | image_edit | lmarena-image-edit |
  | text_to_video | lmarena-video |
  | image_to_video | lmarena-video-i2v |
  | video_edit | lmarena-video-edit |
  | agent | arena-agent-ips-202610 |

- **Row conventions:**
  - Category `overall`, split `latest`.
  - One row per catalogue model per benchmark, at the highest effort Arena lists.
  - The exact Arena label goes in `note`.
  - Elo is rounded to 1 decimal. Agent IPS is kept at full precision.
- **Configs not imported:**
  - The non-style-controlled twins (`text`, `vision`, `search`, `document`) contain exactly the same names as their style-controlled versions.
  - `*_factuality` and the `agent_*` signal configs have no benchmark ids.
- **Drift between snapshots:** for the 413 text entries present in both 46919c46 (used by the existing rows) and 088c6079, ratings moved by a median of 0.06 points. Agent IPS moved by a median of 0.003. The new rows therefore sit on the same scale as the existing ones.

## Coverage found

The 11 imported configs hold 1,091 overall entries. 971 of them are already recorded under their exact label. Earlier passes had already mapped the legacy snapshots the brief expected to find, including gpt-4-0314/0613, Claude 3, Gemini 1.5 -001, Llama 2, Mixtral, Yi, Qwen1.5, Vicuna, PaLM 2, RWKV and WizardLM.

That leaves 120 entry × config pairs, from 71 distinct names. Most are lower-effort, default-mode, harness, resolution or hosting variants of catalogued models whose highest-effort entry is already recorded. `checked` gives one line per name with its outcome.

Only two recorded rows cite an entry that has since dropped out of `latest`: grok-imagine-image-2 `(low)`. It is listed in held_for_owner.

## Proposed (12 rows, 3 models)

**New models**

| id | Type | Arena entries → rows |
|---|---|---|
| `mistral-large-4` | Full API entry (Mistral docs: list price $1.36/$4.18, 1M context, 1.05T/52B, public preview v26.10; weights "Coming soon") | text 1429.3, webdev 1541.3, agent −0.0656 |
| `gpt-4o-search-preview` | Full API entry (OpenAI docs: $2.5/$10, 128K; single snapshot 2025-03-11) | search `api-gpt-4o-search` 1081.0 |
| `nvila-15b` | Comparison-only (CC BY-NC weights, no copy-paste command) | vision `nvila-internal-15b-v1` 985.4 |

**Catalogued models that had no Arena row for these benchmarks**

| Model | New rows |
|---|---|
| `mimo-v2-flash` | text 1386.3, webdev 1292.5 (`(thinking)` entries) |
| `llama-13b` | text 975.0 |
| `dbrx-instruct` | text 1195.5 (`dbrx-instruct-preview`) |
| `claude-haiku-5-5` | webdev 1586.9 (`claude-haiku-5.5-high`, 978 votes) |
| `mimo-v2-6-pro` | agent 0.0352 |
| `mimo-v2-6-flash` | agent 0.0035 |

For the old labels, the identity mapping relies on Arena's own leaderboard table in the `lmarena-ai/arena-leaderboard` Space @6f2eeeb (`leaderboard_table_20250804.csv`). It gives display names and links for these keys:

- `llama-13b` → LLaMA-13B, arXiv 2302.13971
- `dbrx-instruct-preview` → DBRX-Instruct-Preview, Databricks' DBRX post
- `nvila-internal-15b-v1` → NVILA-15B, Efficient-Large-Model/NVILA-15B
- `step1x-edit` → Step1X-Edit, stepfun-ai/Step1X-Edit

**Ledger changes (`add_match` only)**

- `lmarena-dataset`: the 088c6079 paths for text_style_control, webdev, agent, search_style_control and vision_style_control.
- `first-party-mistral`: `docs.mistral.ai/models/mistral-large-4`.
- `first-party-openai`: `developers.openai.com/api/docs/models/gpt-4o-search-preview`.

**Validation, in a scratch copy of the repo**

- `apply-pass2.mjs`: 3 ledger merges and 12 results.
- `npm run import`: +3 models, +12 results.
- `node scripts/check.ts --validate-only`: passes.
- `npm test`: 45 of 45 pass.
- `score-coverage`: all three new models land on the main LLM scale.

## Gaps (identity not pinnable)

| Entry | Why not mapped |
|---|---|
| `grok-4.20-beta1` | Grok app beta from Feb 2026; no API id |
| `gemini-advanced-0514` | Consumer app |
| `diffbot-small-xl` | Four unversioned Diffbot-Small-XL repos could match |
| `gpt-5.3-codex (codex-harness)` | Two different entries share this exact label |
| `grok-imagine-image-quality (20260519)` | Not verified as an xAI API model or setting |
| `grok-imagine-video-1.5-agent` | Agentic product mode, not an API model |

## Held for owner

These rows are ready but not included:

- `step1x-edit` → `step1x-edit-v1-0` (image-edit 998.3). The entry dates from Arena's first image-edit publish, when only v1.0 existed, but the same repo has held v1.1 since July 2025.
- `minimax-m2.1-preview` → `minimax-m2-1` (text 1384.6, webdev 1384.4). The entry is labelled preview, though it first appears after M2.1's public release.

Corrections to existing rows:

- Three DeepSeek V4 preview rows use the non-thinking entries. The highest-effort `-high-preview` values (renamed from `-thinking` on 2026-08-02) are pro text 1454.8, pro webdev 1463.8 and flash text 1438.6.
- The grok-imagine-image-2 `(low)` entry is gone from `latest`.

Mapping and listing choices to confirm:

- Mistral Large 4: sale vs list price, the `availability` flag, and switching weights on when they are released.
- `api-gpt-4o-search` → `gpt-4o-search-preview`: Arena does not say which search_context_size the entry uses.
- NVILA: Arena's key says "internal".
- DBRX: the "Preview" label (included in results).
