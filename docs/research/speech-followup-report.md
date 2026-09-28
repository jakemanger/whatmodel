Final speech follow-up is READY for independent import: **18 rows, 5 benchmarks, 17 models, 5 source records**. This supplements the already-integrated 98-row speech.json, which is unchanged. Import speech-followup.json once, or import the four parts below; do not import both. If Amharic has already been imported, the other three parts are the remaining 11 rows.

| Part | Rows | Numerical licence | Original-model recovery |
|---|---:|---|---|
| speech-amharic-bysa.json | 7 | CC BY-SA 4.0 | Additional TTS coverage; no missing STT name |
| speech-vibevoice-mos.json | 3 | MIT | VibeVoice 1.5B |
| speech-vapi.json | 7 | CC BY 4.0 | Simba 3.2; Inworld Realtime TTS-2; MiniMax Speech 2.8 Turbo; Eleven Turbo v2.5 |
| speech-granite-punctuation.json | 1 | Apache-2.0 | Granite Speech 4.1 2B, punctuation error only |

The final tranche recovers **five additional original TTS models and one original STT model**. Original coverage after combining the current main data and this follow-up: **18/36 TTS and 22/30 STT**. Granite's single punctuation record and Turbo's single historical rating are deliberately retained despite insufficient overlap for calibrated comparisons. No three-benchmark requirement was applied. All records have honest lab/independent flags; group comparisons by source_id. No chance floor is supplied. No API/pricing/run metadata was copied from the old catalogue.

[Amharic numerical grant](https://huggingface.co/datasets/addisai/amharic-tts-benchmark/blob/a60556cd62dd2fbfce83a09c11b088e1e027ce64/README.md#licensing): Addis AI explicitly covers data/*.jsonl, summary.json, scorer, normalization and card with CC BY-SA 4.0. The adaptation is CC BY-SA 4.0 with Addis AI and upstream FLEURS/Waxal/Horn-ASR attribution preserved. The user-authorized main DATA-LICENSE.md publication arrangement applies. No audio was downloaded. All 800 raw transcript rows were independently normalized and edit-counted; all 16 aggregate groups match. Seven primary 87-prompt micro CER results are imported; WER and full-100/slices do not become duplicate ranked results. Numerical/scorer checksums match; the upstream README checksum is stale, so the pinned README is the grant evidence. ElevenLabs CER 1.1165358194308146 is valid (insertions can exceed reference length); preserve the raw value above 1.0. It is an unsupported-Amharic TTS condition, not general STT performance. Exact model/voice identity was checked on the first-party methodology page; its separate MOS, CI and latency values were not copied.

[VibeVoice MIT repository](https://github.com/microsoft/VibeVoice/blob/1541f590c7099820f10ea012f48d2399282df69f/LICENSE) and [own results figure](https://github.com/microsoft/VibeVoice/blob/1541f590c7099820f10ea012f48d2399282df69f/Figures/VibeVoice-TTS-results.jpg): exact printed preference MOS labels are VibeVoice 1.5B 3.43, Gemini 2.5 Pro Preview TTS 3.65, Eleven v3 Alpha 3.37. They are normalized as (MOS-1)/4; raw MOS and the scale remain present. Do not display that transform as recognition accuracy. Preserve Alpha as distinct from production v3. The figure differs slightly from a later paper table; these are the pinned figure values, not mixed versions or estimated bar heights. The original report describes eight long conversational transcripts and 24 annotators. No copied dots.tts/Seed baseline figures were revived. VibeVoice 7B's labelled figure value remains unranked evidence rather than an unnecessary model addition.

[Vapi numerical grant](https://github.com/VapiAI/humanness-index/blob/e2b8f8653ed491a9f6038de98d6ef999c2729743/README.md#licensing): vote data and standings are explicitly CC BY 4.0, with required attribution “The Humanness Index™ by Vapi”. Code/docs are Apache-2.0; audio is separately restricted and absent. The six current [API](https://humannessindex.vapi.ai/api/models) rows use the published elo field, actually Bradley–Terry ratings. These use pairwise events plus prototype aggregate counts represented as anchor games; counts are live while the fit is cached. The 13,508 total votes is a snapshot counter, not a claim that all were in the exact cached fit. No human-normalized score, heuristic uncertainty-as-CI, latency or duplicate win-rate result was added. June 10's committed production export supplies the retired Turbo v2.5 rating 1234.22 (98 votes); it gets a separate source and benchmark from current BT.

Vapi's registry explicitly identifies Simba 3.2 and links TTS-2 to the Realtime TTS-2 launch. MiniMax 2.8 Turbo mapping is attributed to Vapi's explicit note reporting vendor confirmation on July 23; the actual old request alias speech-2.5-turbo-preview remains disclosed. This is not an invented 2.8 request ID or an immutable-backend claim. Vapi's Lightning v3.1 does NOT recover Lightning v3.1 Pro, and Sonic 3.5 does NOT recover Sonic 3.6. Alternative Inworld repo results were two-utterance smoke checks or preview-specific experiments; no redundant weak row imported.

[IBM exact numerical card](https://huggingface.co/ibm-granite/granite-speech-4.1-2b/blob/de575db64086f84fdc79da4932d1076e965bc546/README.md): Apache-2.0 is declared in card metadata and its License section. IBM's own LScln punctuation error is 25.70%; Cap-F1 89.71 is companion metadata only. This is explicitly punctuation, not WER. The full nine-row punctuation table is archived as evidence, but only one raw result is imported. The table does not disclose exact run configuration or sample counts; usage-example settings are not presented as evaluation settings. No chart height or third-party leaderboard number was reused.

Remaining original models below have **no reusable exact-model measured source verified in this bounded audit**. This does not assert that none exists anywhere. A weights licence, another generation's result, an unversioned provider alias, or an AA republication does not close these gaps.

| Category | Original model | Gap |
|---|---|---|
| TTS | Sonic 3.6 (`cartesia-sonic-3-6`) | Vapi has Sonic 3.5/3/2, not 3.6. No exact 3.6 reusable measured result verified. |
| TTS | Gemini 3.8 Flash TTS (`gemini-3-8-flash-tts`) | Licensed evaluations name Gemini 2.5 or 3.1, not 3.8 Flash. |
| TTS | Gemini 3.8 Flash-Lite TTS (`gemini-3-8-flash-lite-tts`) | Licensed evaluations name Gemini 2.5 or 3.1, not 3.8 Flash-Lite. |
| TTS | Qwen-Audio-3.0-TTS-Plus (`qwen-audio-3-0-tts-plus`) | No exact Qwen-Audio-3.0-TTS-Plus numerical result with verified reuse grant found. |
| TTS | Eleven v3 Conversational (`elevenlabs-v3-conversational`) | Production eleven_v3 and Alpha measurements do not establish the Conversational variant. |
| TTS | MiniMax Speech 2.6 HD (`minimax-speech-2-6-hd`) | Speech-02, 2.5 and 2.8 results do not establish 2.6 HD. |
| TTS | Lightning v3.1 Pro (`smallest-lightning-v3-1-pro`) | Vapi explicitly identifies lightning_v3.1, without Pro. No evidence equating it to the original Pro variant. |
| TTS | TTS-1 HD (`openai-tts-1-hd`) | No verified licensed measured row for exact tts-1-hd. OpenAI mini-TTS results are a different model. |
| TTS | TTS-1 (`openai-tts-1`) | No verified licensed measured row for exact tts-1. OpenAI mini-TTS results are a different model. |
| TTS | Octave 2 (`hume-octave-2`) | Emergent names Hume without a version; cannot assign Octave 2. Inworld benchmark adapters supply no qualifying measured Hume result. |
| TTS | Octave TTS (Octave 1) (`hume-octave`) | Emergent names Hume without a version; cannot assign Octave 1. Inworld benchmark adapters supply no qualifying measured Hume result. |
| TTS | Azure HD 2.5 (`azure-hd-2-5`) | Verified Azure neural-voice rows are not HD 2.5. |
| TTS | Polly Generative (`amazon-polly-generative`) | Verified Polly Neural rows do not establish Generative. |
| TTS | OpenAudio S1 Mini (`openaudio-s1-mini`) | S1 measurements do not establish S1-mini; no independent original licensed mini result verified. |
| TTS | Higgs Audio V3 TTS (`higgs-audio-v3-tts`) | Emergent own Higgs Audio v2 measurements do not establish v3. |
| TTS | Magpie TTS Multilingual 357M (`magpie-tts-multilingual-357m`) | No qualified exact original base checkpoint result verified. Georgian adaptations/newer Magpie versions do not recover the original checkpoint. |
| TTS | Maya1 (`maya1`) | No exact reusable own-measured numerical result verified; weights licence alone is insufficient. |
| TTS | Breeze TTS 2 (`breeze-tts-2`) | No exact reusable own-measured numerical result verified; weights licence alone is insufficient. |
| STT | GPT Transcribe (`gpt-transcribe`) | Measured GPT-4o Transcribe/mini versions do not establish later GPT Transcribe. |
| STT | Universal-3.5 Pro (`assemblyai-universal-3-5-pro`) | No exact Universal-3.5 Pro measured numerical result with verified reuse grant found. |
| STT | MAI-Transcribe-2 (`mai-transcribe-2`) | No exact MAI-Transcribe-2 measured numerical result with verified reuse grant found. |
| STT | Gemini 3.5 Transcribe (`gemini-3-5-transcribe`) | Licensed Gemini 2.5 transcription evaluations do not establish 3.5 Transcribe. |
| STT | Grok Voice Transcribe 2.0 (`grok-voice-transcribe-2`) | No exact Grok Voice Transcribe 2.0 numerical result with verified reuse grant found. |
| STT | Solaria-3 (`gladia-solaria-3`) | No exact Solaria-3 numerical result with verified reuse grant found. |
| STT | Soniox v5 Async (`soniox-v5-async`) | Earlier Soniox/unversioned gateway results do not establish v5 Async. |
| STT | Granite Speech 5.0 470M TurboCTC (`granite-speech-5-0-470m-turboctc`) | Reviewed card evaluation figures did not yield a verified standalone exact own-result numerical table in this pass; no graph estimation or relicensing third-party Open ASR results. |

Exact-ID graph handoff: Vapi's current same-voice benchmark legitimately connects the existing Emergent set through MiniMax Speech-02 HD to the Voxtral set through ElevenLabs v3 and Flash v2.5. This bridge does not depend on the post-hoc MiniMax 2.8 identity mapping. Amharic provides the same connection via GPT-4o mini TTS and ElevenLabs v3, with unsupported-Amharic conditions explicitly retained. VibeVoice attaches through Gemini 2.5 Pro Preview TTS. CN-NewsTTS, TTSDS, and Fish/dots remain separate. Exact co-occurrence graph after this tranche: four multi-model TTS components (24, 7, 4, 3 models), plus the historical Turbo singleton. Do not treat that singleton as a cross-set bridge. See speech-followup-bridges.json. Connectivity is not evidence that all evaluation conditions transfer equally.

Validation: 18 unique model/benchmark pairs; every source/model/benchmark reference resolves; all source match URLs and numerical units checked; licences/notices archived and hashed; no chance fields; no invented API/local fields. Amharic recomputation passed for all 800 rows. Original speech.json SHA-256 remains 53e680bebc8054af692106a59ec458564f0c349a1d38375bd07d2370218e9828. The combined evidence manifest covers only archived files; no audio is present.

Rebuild Amharic/Vibe from archived evidence with build_speech_followup.py, Vapi with build_speech_vapi.py, then run finalize_speech_followup.py to assemble and verify the four parts. Granite's one-row extraction is rechecked against its pinned README by the finalizer. These scripts only write under /tmp/whatmodel-expansion. No shared app/data changes, pushes or workflows. Research is closed; main can integrate independently.
