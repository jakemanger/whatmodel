Ready and frozen: **cards-final-ready.json — 69 new rows, 8 exact models, 8 sources, 57 benchmark definitions.** No shared app/data edits, pushes or workflows. No further research planned for this pass.

| Model ID | Rows | Evidence/reuse route |
|---|---:|---|
| gemma-3-270m | 6 | Google developer card CC-BY4.0; IT270M only |
| gemma-3n-e2b | 10 | Google developer card CC-BY4.0; E2B IT only |
| ernie-4-5-300b-a47b | 18 | Apache2 publisher GitHub README, own post-trained chart |
| ling-3-0-flash | 15 | MIT-declared pinned publisher HF README, own chart |
| apriel-1-6-15b-thinker | 5 | MIT-declared pinned publisher HF README, internal non-AA tasks |
| lfm2-24b-a2b | 11 | Marco-MoE CC-BY4.0 reportv1, authors’ own Light-Eval baseline |
| exaone-4-0-1-2b | 1 | ACL2026 Thunder-KoNUBench paper, own zero-shot symbol evaluation |
| exaone-4-0-32b | 3 | Same paper plus two vanilla KCL paper tasks, CC-BY4.0 |

All rows can be imported, including sparse/provisional coverage. Existing Gemma IDs are explicitly identified as IT using their current IT local variants and exact IT source columns. No PT, Reasoning/Instruct substitution, borrowed model checkpoint, or AA comparison was used.

**Pinning:** HF/GitHub sources use full commit URLs and reports use fixed arXiv versions or ACL publication identifiers. Google’s canonical CC-BY pages have no public immutable revision URL: each saved page is hashed, and all 16 selected cells plus shot settings match the supplied commit-pinned HF README mirrors. The licence grant comes from the Google document, not from relabelling HF Gemma metadata as CC-BY. ERNIE and Ling embedded images are external publisher assets; their exact downloaded bytes are archived and hashed, not falsely represented as immutable remote URLs. ERNIE’s old embedded yiyan host now returns landing HTML; the identical named chart is served by the publisher’s current ernie host and linked in its current blog. These limitations are embedded per source.

**Scope:** Explicit MIT README declarations cover associated documentation; absence of a second root LICENSE does not nullify a named standard licence. No contrary document exclusion was found. No unrelated code licence is transferred to these cards. Apriel expressly identifies AA Indexv3 tasks as AA-derived and all remaining tasks as internally evaluated. Only Retail/Airline tau2, Multi-IF, SWE Verified and Aider Polyglot were selected. No AA index score, Telecom, IFBench, GPQA, MMLU-Pro, HLE, LCB, SciCode, AIME2025, AA-LCR or Terminal value from Apriel was imported.

EXAONE4.0 rows are the ACL paper authors’ own numerical findings, commercially reusable under the ACL publication CC-BY4.0 policy. This does not change the EXAONE model licence, and it does not license the KCL NC dataset/code. No questions, rubrics, model-generated answers or code are redistributed. Thunder-KoNUBench cloze values conflict across tables; those were omitted. The selected zero-shot symbol scores agree after rounding. No fine-tuned checkpoint, few-shot sweep or aggregate-plus-component inflation is included.

LFM24B’s source is the independent CC-BY Marco-MoE article, not the opaque average in Liquid’s card. Section4.3.1 explicitly names LFM2-24B-A2B and describes the authors’ own runs. Table11 labels its chat role Instruct; this is not a substitution from a differently named checkpoint. Temperature1, top_p1, max8192, mean8responses except GlobalMMLU/MMMLU single response are recorded. The report route has no Liquid revenue condition. The 15 already-integrated Liquid card rows and their eligibility review remain unchanged.

**Remaining blockers (no rows included):**

- **command-a-plus:** Apache HF README has no numerical quality results. Numeric blog results lack an established content-reuse grant; model Apache licensing does not automatically license the linked blog. No exact A+ licensed paper/copy found; Command A and Command A Reasoning cannot stand in.
- **exaone-4-5-33b:** direct documentation uses EXAONE1.2-NC; own report2604.08644v1 uses CC-BY-NC-ND4.0. No revenue-based exception exists in these reviewed terms. No independent licensed exact4.5 evaluation found. Below-US$10m therefore does not resolve this restriction.
- **grok-build-0-1:** no defensible licensed exact-model quality result found. Redirecting Grok Code Fast1 to improved Build0.1 does not establish checkpoint identity.

Detailed source URLs and exact restricted EXAONE licence path are in cards-final-blockers.json. Raw model pages can remain visible without a calibrated score.

**Full licences / notices:**

- cards-final-NOTICE.txt — public attribution and change notices for all eight sources; notices are also embedded per source in JSON.
- cards-final-LICENSE-CC-BY-4.0.txt — complete CC-BY legal text.
- cards-final-LICENSE-Apache-2.0-ERNIE.txt — complete publisher root LICENSE including its copyright notices verbatim. No separate upstream NOTICE exists in the reviewed tree.
- cards-final-LICENSE-MIT.txt — complete SPDX standard MIT text from a pinned revision. Neither pinned Ling nor Apriel repository supplies a separate copyright line/NOTICE; the standard template placeholder is retained verbatim and explicitly identified as a template, not an invented upstream notice. Their publisher attribution is supplied separately.

cards-final-validation.json records exact table checks, 33 visually verified chart labels, four visually verified PDF cells, source/licence hashes, reference/scale checks and zero overlap with176+55. Both previous packages retain their original hashes. cards-final-manifest.json supplies final file hashes.
