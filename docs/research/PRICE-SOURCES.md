# Price and context expansion — review bundle

`prices.json` is frozen and unapplied. The integration baseline has all 340 model identities and 115 prices. All 54 price patches and 29 context patches match existing models and still-empty fields; applying prices raises coverage to 169/340. The earlier 242-model audit snapshot is retained separately. No shared app/data file was changed.

Each `api_patches` item has an exact model ID, existing-schema `api` fields, separate billing settings, and source evidence. Merge only the `api` object, only when the target price remains absent, and retain the billing notes in the UI. All frozen targets are now present in the restored catalogue. This bundle does not change models or benchmark scores.

`context_patches` distinguishes a model catalogue ceiling from a particular API's maximum input tokens. Do not overwrite a model's existing context with a different provider cap. Legacy LiteLLM `max_tokens` is never used: it can mean output capacity. Context for audio/image/video is not fabricated from seconds, image dimensions, or output-token limits.

Scalar media prices are tied to the listed settings. Image output components exclude separately billed input/text tokens. Provider-published per-minute estimates are labelled as estimates; rounded per-second catalogue rates retain their precision. No token-to-character conversion is used. `native_rate_records` preserves otherwise unrepresentable token tariffs and is not an API scalar patch.

LiteLLM's root licence explicitly grants MIT to content outside `enterprise/`, including the root data file. Its automatic OpenRouter import is namespaced separately. All selected entries exclude that namespace and Artificial Analysis; assumed price splits and past deprecation dates are rejected. Current provider documents corroborate the selected licensed cells but do not themselves acquire an MIT licence.

Google's Gemini pricing page explicitly grants CC BY 4.0. This grant is not assumed for arbitrary Google Cloud marketing/pricing pages. The mutable page is pinned by saved bytes and SHA-256, with its last-updated date; a fake Git revision is not invented.

Cloudflare's repository root says CC BY 4.0 while its Workers-specific policy says CC BY-SA 4.0. Its derived records are isolated in `cloudflare-patches.json` under the stricter CC BY-SA 4.0 treatment, with both full licences retained. The integration-ready public tranche is `public/cloudflare-patches.json`; it carries top-level and per-row licence/attribution fields, with adjacent public full notices. Do not label that tranche MIT.

`NOTICE-prices.txt` contains attribution, source scope, and full notices. `licenses/` contains individual full licence texts. `evidence/` contains source snapshots, selected rows, provider corroboration and baseline hashes. Provider verification snapshots are local audit evidence, not permission to republish those pages. Licence obligations must accompany the derived data when it is adopted.

Run `python3 /tmp/whatmodel-expansion/build_prices.py` and then `python3 /tmp/whatmodel-expansion/validate_prices.py` to reproduce and check the seed from pinned local inputs. The builder reads the existing models.dev checkout and the saved Cloudflare checkout; it performs no network requests, inference calls, repository edits or workflows. `validation.json` reports checks. Recheck the live baseline before integration.

All `billing` product/model/settings/component/exclusion details are also copied into `api.price_note`, because the current UI only reads the `api` object. Do not discard this field during integration.

Bertrande review and candidate records are saved in `bertrande-review.json`. Its data grant is explicit, but the export contains mixed provenance, including OpenRouter. No Bertrande-derived price was added to this frozen 54-patch seed.

After reproducing the builder and validator, run `python3 /tmp/whatmodel-expansion/freeze_prices.py` to regenerate public files, notices and the SHA-256 manifest. `frozen-manifest.json` pins the deliverables. No deployment or publication was performed.
