# Pass 8: new image and video models (2026-10-09)

Candidates are in `pass8-visual-models-2026-10-09.json`. Nothing in `data/` was edited. Two sub-passes (A: open-weights releases, B: closed/API models in recent papers) were cut short by a usage limit. Their partial outputs are merged here, and the parent re-checked every proposed cell against its source.

## Models proposed (10)

| id | category | why it scores (runs with 2 or more catalogue models) |
|---|---|---|
| nano-banana-2-1 | image | LMArena text_to_image 1327.8 and image_edit 1428.1 (entry `gemini-nano-banana-2.1`, the exact Gemini API id; GA 2026-10-06; $0.0336 per 1K image) |
| chatgpt-image-latest | image | LMArena image_edit 1388.6 (`chatgpt-image-latest-high-fidelity (20251216)`; OpenAI API model released with gpt-image-1.5; $0.034 medium 1024²) |
| omnigen-v1 | image | OmniContext average (OmniGen2 report, lab) and EdiVal-O turn 3 (independent); MIT, local command and 9 GB from the official docs |
| uno | image | OmniContext average and ImagenWorld TIG human (both independent); LoRA on FLUX.1-dev; weights CC BY-NC 4.0 |
| step1x-edit-v1-0 | image | EdiVal-O turn 3 (date column 25.04.25) and the GEdit-Bench-EN G_O (GPT-4.1) table in StepFun's Apache-2.0 GitHub README, with the v1.1 cell as the sibling |
| cosmos3-super | video | Four NVIDIA-run tables in the Cosmos 3 report (PAIBench-G T2V/I2V, Cosmos HUE T2V/I2V), alongside 7–9 catalogue models |
| kandinsky-6-0-pro, kandinsky-6-0-lite | video | VABench T2AV Visual QA from the Kandinsky 6.0 report, with an LTX-2.5 cell; the VABench paper's own run of 5 catalogue models forms a second run |
| wan-3-0-prime, runway-aleph-2 | video | WROP human Bradley–Terry Elo (existing ledger paper), where these rows had been withheld only because the models were not catalogued |

## Rows by source (52 results)

- **LMArena dataset (pinned to revision 088c6079):** 3 rows.
  - Ledger `add_match` covers the new text_to_image and image_edit URLs. These files are byte-identical to the 2026-10-07 and 2026-10-06 update commits. The video files are unchanged since 46919c46.
  - Every row in the latest five visual configs was checked. Apart from the new models above, every unmapped entry is a resolution or setting variant, or is held (see below).
- **OmniGen2 report Table 4:** 2 rows (1 lab, 1 independent).
- **EdiVal Table 3:** 2 rows. **ImagenWorld Table 3:** 1 row.
- **New ledger entry `visual-step1x-edit-readme`** (Apache-2.0 GitHub README @4cca05d): 2 rows (lab).
- **Cosmos 3 report:** 32 rows (8 lab, 24 independent) on 4 new benchmark ids.
- **New ledger entries for VABench v2 (CC BY) and the Kandinsky 6.0 report (CC BY):** 8 rows on the new benchmark id `vabench-t2av-visual-qa`.
- **WROP:** 2 rows.

## Held for the owner

- **Step1X-Edit Arena row:** `step1x-edit` in image_edit, 998.3. The entry has no version number. It was listed before v1.1 existed, and its rating stayed flat across the v1.1 release, so it is probably v1.0. The row is ready to merge.
- **Grok Imagine image entries:**
  - `grok-imagine-image-2.0 (20260801)` and `(canvas)`: the existing `(low)` label is gone from the latest files, and the new labels can't be tied to an API setting.
  - `grok-imagine-image-quality (20260519)`: xAI documents the alias `-20260403`, not `20260519`.
- **Optional refresh:** 73 existing LMArena image rows can be moved to the same revision (changes of 0.1–4.7 Elo). They are listed under `refresh_candidates` and replace the existing rows rather than adding to them.
- **Duplicate GEdit measurement:** Step1X-Edit v1.1's 6.97 is already stored under `gedit-bench-overall-lang-unspecified`. The README now states the split and judge (EN full set, GPT-4.1), so those rows could be re-labelled as `gedit-bench-en-overall`.
- **Correlated Cosmos benchmarks:** PAIBench-G and Cosmos HUE score the same generated videos; consider keeping one per task. The Kandinsky 6.0 Pro repo is gated (automatic approval).

## Gaps

- **grok-imagine-video-1.5-lite:** new xAI API model with no allowed results.
- **Kandinsky 2.0 / 1.0:** unchanged. A Kandinsky 2.0 row would leave the FID benchmark at 2 models, and Kandinsky 1.0 has no checkpoint.
- **Uncatalogued comparators:** Cosmos-Predict2.5, MAGI-1, Wan-VACE.
- **Leads not imported:**
  - PAWBench: has Cosmos 3 Super I2V, but its metrics are diagnostics.
  - AdSpark-Bench: has Pixverse V6, Kling 3.0 Omni, SkyReels-V3 and Vidu Q3, but no overall score.
  - arXiv 2610.11112: non-exclusive licence, so not usable.
