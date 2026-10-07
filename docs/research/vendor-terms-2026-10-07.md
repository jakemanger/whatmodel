# Vendor-published benchmark scores: terms review

Reviewed 2026-10-07. Covers Anthropic, OpenAI and Google (including Google DeepMind). Machine-readable rows are in
[vendor-terms-2026-10-07.json](vendor-terms-2026-10-07.json).

**This is not legal advice.** It summarises what each vendor's published terms say and how they would apply to our own
use. If the extension below matters commercially, have a lawyer read it, ideally one familiar with Australian and
US law (Merlinsbeard Pty Ltd is Australian, and the vendors are US companies).

## Short answer

- **(a) Already usable under the current policy.** Some vendor-reported scores are published under an open licence:
  - Google Cloud's *Developer's guide to Gemini 3.x Flash* pages (CC BY 4.0 footer, with a text benchmark table).
  - Google's Gemma model cards on ai.google.dev (CC BY 4.0).
  - The arXiv copies of OpenAI's GPT-5, o1 and GPT-4o system cards (CC BY 4.0).
  - The arXiv copies of Google's Gemini 1.5 and 2.5 reports (CC BY 4.0).
  - openai/simple-evals (MIT, frozen since July 2025).

  None of these covers the current frontier flagships: Claude Opus 5.5, GPT-6 Astra and Gemini 4 Argon.
- **(b) Usable only if the owner extends the first-party-facts exception.** This covers every current flagship
  source: Anthropic's announcement pages and system cards, OpenAI's announcement pages and deploymentsafety system
  cards, and Google's blog.google posts, deepmind.google model pages, model cards and evaluation PDFs. All of them are
  all rights reserved. None of the governing terms contains a clause against quoting an individual figure by hand.
- **(c) Not usable.** Automated extraction from Anthropic and OpenAI is expressly forbidden. Google forbids automated
  access that goes against robots.txt, which currently allows these pages. No vendor has a clause that forbids
  hand-quoting a single number with attribution.
- The developer-docs model pages of Anthropic and OpenAI publish **no benchmark numbers**, only specifications,
  prices and qualitative ratings. Google's Gemini API model pages also have none, but the Google Cloud developer
  guides do.

## Method

I fetched each page and read the terms in full, quoting from the fetched text. openai.com returned HTTP 403 to direct
fetches, so the OpenAI policy and announcement pages were read from Internet Archive captures taken 4–29 days ago
(dates in the fetch log). deploymentsafety.openai.com and developers.openai.com were fetched directly. PDFs were
downloaded and searched in full for "copyright", "©", "licence/license", "all rights", "reproduc", "Creative Commons"
and "terms of". GitHub licences were read through the GitHub API.

## Anthropic

### Where the numbers are

| Type | URL | Scores? |
|---|---|---|
| Announcement | https://www.anthropic.com/claude-opus-5-5 (Sept 22, 2026) | Yes. Text table, e.g. "Terminal-Bench 4.0", "66.4%", plus footnotes. It also includes GPT-6 Astra figures "as reported by OpenAI". |
| System card (PDF) | https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf (230 pp.), index at https://www.anthropic.com/system-cards | Yes. Capability tables in §8, e.g. SWE-bench Pro 89.9 and Terminal-Bench 4.0 66.4. |
| Docs model page | https://platform.claude.com/docs/en/models/opus-5-5/overview, https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5 | No. IDs, context, prices and latency only. |
| GitHub | https://github.com/anthropics/political-neutrality-eval (CC BY 4.0), https://github.com/anthropics/model-cards (no licence) | No frontier capability scores. The first has methodology and grader-agreement statistics. The second holds τ²-bench prompt and policy files for Opus 4.5 only. |

### Governing terms

The page footers link only to "Terms of service: Commercial" and "Terms of service: Consumer", next to "© 2026
Anthropic PBC". Anthropic has no separate website terms. **The system card PDF contains no licence or copyright
statement.** Its title page reads only "System Card: Claude Opus 5.5 / September 22, 2026 / anthropic.com".

[Consumer Terms](https://www.anthropic.com/legal/consumer-terms) (Effective October 8, 2025) cover websites:

> These Terms of Service (“Terms”) govern your use of Claude.ai, Claude Pro, and other products and services that we
> may offer for individuals, along with any associated apps, software, and websites (together, our “Services”).

> You may not access or use, or help another person to access or use, our Services in the following ways:
> …
> To crawl, scrape, or otherwise harvest data or information from our Services other than as permitted under these Terms.
> …
> Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to
> access the Services through automated or non-human means, whether through a bot, script, or otherwise.

> We and our Providers retain all of our respective rights, title, and interest, including intellectual property
> rights, in and to the Services. Other than the rights of access and use expressly granted in our Terms, our Terms do
> not grant you any right, title, or interest in or to our Services.

[Commercial Terms](https://www.anthropic.com/legal/commercial-terms) (Effective June 17, 2025) bind us as an API
customer and cover documentation:

> They govern Customer’s use of Anthropic API keys and any other Anthropic offerings that references these Terms, as
> well as all related Anthropic tools, documentation and services (the “Services”).

> D.4. Use Restrictions. Customer may not and must not attempt to (a) access the Services to build a competing product
> or service, including to train competing AI models or resell the Services except as expressly approved by Anthropic;
> (b) reverse engineer or duplicate the Services; or (c) support any third party’s attempt at any of the conduct
> restricted in this sentence.

> Except as expressly stated in these Terms, these Terms do not grant either party any rights to the other’s content or
> intellectual property, by implication or otherwise.

The CC BY repo carries this notice:

> © 2025 Anthropic PBC. Licensed under CC BY 4.0.

### Assessment

- **Announcement page and system cards: (b).** All rights reserved, with no licence. The Consumer Terms forbid crawling,
  scraping, "harvest[ing]" and bot or script access. Nothing forbids a person reading the page and quoting a figure.
  "Harvest" is the only word that could be stretched to cover systematic manual collection. Keep the scope small and
  selective.
- **Docs: nothing to record.**
- **GitHub: (a),** but there are no frontier scores.

## OpenAI

### Where the numbers are

| Type | URL | Scores? |
|---|---|---|
| Announcement | https://openai.com/index/gpt-6-astra/ (published Sept 3, 2026) | Yes. Charts and text, e.g. "Terminal-Bench 4.0 … 57.9%" and "GPQA Diamond … 96.0%". |
| System card | https://deploymentsafety.openai.com/gpt-6-astra (HTML), summary at https://openai.com/index/safety-overview-gpt-6-astra/ | Mostly safety and preparedness evals. Some capability numbers, e.g. MLE-Bench Revised. |
| Docs model page | https://developers.openai.com/api/docs/models/gpt-6-astra | No. Only "Reasoning: Highest", "Speed: Fast", prices and limits. |
| GitHub | https://github.com/openai/simple-evals (MIT). Also openai/mle-bench (MIT), but its leaderboard lists third-party agents. | simple-evals: yes, for o1/o3/o4-mini/GPT-4.x only. The README says: "**July 2025**: `simple-evals` will no longer be updated for new models or benchmark results." |
| arXiv copies | https://arxiv.org/abs/2601.03267 (GPT-5 System Card), https://arxiv.org/abs/2412.16720 (o1), https://arxiv.org/abs/2410.21276 (GPT-4o), https://arxiv.org/abs/2508.10925 (gpt-oss, already in our data) | Yes, for those models. Each abs page links "view license" to http://creativecommons.org/licenses/by/4.0/. |

### Governing terms

The page footers show "OpenAI © 2015–2026", and the deploymentsafety footer links "Terms of Use" to
openai.com/policies/terms-of-use/. The policy index lists no separate website-content terms.

[Terms of Use](https://openai.com/policies/terms-of-use/) (Effective: January 1, 2026):

> These Terms of Use apply to your use of ChatGPT, DALL·E, and OpenAI’s other services for individuals, along with any
> associated software applications and websites (all together, “Services”).

> What you cannot do. You may not use our Services for any illegal, harmful, or abusive activity. For example, you may not:
> …
> Modify, copy, lease, sell or distribute any of our Services.
> …
> Automatically or programmatically extract data or Output (defined below).

The [OpenAI Services Agreement](https://openai.com/policies/services-agreement/) (Effective: January 1, 2026) binds us
as an API customer, and its definition of Services includes websites:

> “Services” means OpenAI’s services for businesses, enterprises, or developers made available for purchase or use in
> Customer’s Account, along with any of OpenAI’s associated software, tools, developer services, documentation, and
> websites, but excluding any Third-Party Service.

> 3.3. Restrictions. Customer will not, and will not permit End Users to: … (f) extract data from the Services other
> than as permitted through the Services;

> 9.1. Reservation of Rights. Except as expressly set forth herein, the Agreement does not grant: (a) OpenAI any IP
> Rights in Customer Content; or (b) Customer any IP Rights in the Services.

The [Sharing & publication policy](https://openai.com/policies/sharing-publication-policy/) covers outputs and research
about the API, not reuse of OpenAI's own published figures.

The simple-evals LICENSE grants:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
> documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
> rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software

### Assessment

- **Announcement page and deploymentsafety system card: (b), and the most restrictive of the three vendors.**
  Programmatic extraction is expressly banned. "Modify, copy … or distribute any of our Services" most naturally means
  cloning or redistributing the service. Read literally, though, it reaches copying the website. A single factual
  figure, re-expressed in our own schema with a link, is the least likely thing to fall under it. Services Agreement
  3.3(f), "extract data … other than as permitted through the Services", is aimed at data or model extraction. It also
  applies to us as a customer, which is a reason to keep collection manual and small.
- **arXiv system cards and simple-evals: (a).**
- **Docs: nothing to record.**

## Google / Google DeepMind

### Where the numbers are

| Type | URL | Scores? |
|---|---|---|
| Announcement (blog) | https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/ (Sep 30, 2026) | Some figures in the text, e.g. "DeepSWE v1.1 (77.9%)" and "a top score of 68%". The rest are chart images (alt "DeepSwe evaluation chart" and others). |
| Model page | https://deepmind.google/models/gemini/ | Yes. Text table for Gemini 4 Argon against other models, e.g. "Terminal-bench 4.0" "57.4%" and "CWE-bench v1" "68.0%". |
| Eval methodology (PDF) | https://storage.googleapis.com/deepmind-media/gemini/gemini_4_argon_model_evaluation.pdf (redirect from deepmind.google/models/evals-methodology/gemini-4-argon) | Yes, with provenance per benchmark. |
| Model card | https://deepmind.google/models/model-cards/gemini-3-8-flash/ and its PDF https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-8-Flash-Model-Card.pdf | Yes. There is **no Gemini 4 Argon model card yet**; the index at https://deepmind.google/models/model-cards/ stops at 3.8 Flash. |
| Docs, Google Cloud | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash, https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-7-flash | **Yes, under CC BY 4.0.** Each has a "What's new" text table, e.g. 3.8 Flash: Terminal-bench 2.1 90.8% and SWE-Bench Pro 61.6%. The 3.6 and 3.5 guides have no table. |
| Docs, Gemini API | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash | No scores (CC BY 4.0 page). |
| Docs, Gemma model card | https://ai.google.dev/gemma/docs/core/model_card_4 | Yes, for the open Gemma 4 models (CC BY 4.0 page). |
| GitHub | https://github.com/google-deepmind/eval_hub (Apache-2.0, "Gemini evaluations") | Eval sets (LiveMath, MRCR v2, Putnam-like) with per-sample grades for older models (Gemini 2.5, o3-mini …). No headline frontier scores. |
| arXiv copies | https://arxiv.org/abs/2507.06261 (Gemini 2.5), https://arxiv.org/abs/2403.05530 (Gemini 1.5) | Yes, for those models. CC BY 4.0. There is no arXiv copy for Gemini 3.x or 4. |

### Governing terms

blog.google and deepmind.google have **no site-specific content terms**. Both footers link "Terms" to
https://policies.google.com/terms. Neither the model-card HTML nor the PDFs carry a licence. The model card's only
terms sentence is about the API: "Our models are available to downstream providers via an application program
interface (API) and subject to relevant terms of use."

[Google Terms of Service](https://policies.google.com/terms) (Effective July 30, 2026; the Australia country version
was served):

> The Google services that are subject to these terms are the products and services listed at
> https://policies.google.com/terms/service-specific, including:
> apps and sites (like Search and Maps)

> using automated means to access content from any of our services in violation of the machine-readable instructions on
> our web pages (for example, robots.txt files that disallow crawling, training, or other activities)

> Some of our services include content that belongs to Google — for example, many of the visual illustrations you see
> in Google Maps. You may use Google’s content as allowed by these terms and any service-specific additional terms, but
> we retain any intellectual property rights that we have in our content. Don’t remove, obscure, or alter any of our
> branding, logos, or legal notices.

> You may not copy, modify, distribute, sell, or lease any part of our services or software.

The last clause sits under "Software in Google services". The robots.txt files fetched today allow these pages:
deepmind.google has `Allow: /`, and blog.google disallows only search URLs.

Docs footer on ai.google.dev and docs.cloud.google.com, verbatim on the Gemini 3.8 Flash guide ("Last updated
2026-10-06 UTC"):

> Except as otherwise noted, the content of this page is licensed under the Creative Commons Attribution 4.0 License,
> and code samples are licensed under the Apache 2.0 License. For details, see the Google Developers Site Policies.

[Google Developers Site Policies](https://developers.google.com/site-policies):

> When you see a page with this notice you are free to use nearly everything on the page in your own creations.

> In some cases, a page may include content consisting of images, audio or video material, or a link to content on a
> different webpage (such as videos or slide decks). This content is not covered by the license, unless specifically noted.

> Google's trademarks and other brand features are not included in this license.

### Assessment

- **Cloud developer guides, Gemma model cards and arXiv reports: (a).** The guide tables are text, so the CC BY grant
  covers them. Images would not be covered.
- **Gemini API model pages: (a),** but there are no scores to record.
- **blog.google, deepmind.google model pages and model cards (HTML and PDF), and the eval PDFs: (b).** Google reserves
  its IP. There is no anti-quoting clause, and automated access is restricted only through robots.txt. Google is the
  most permissive of the three.
- **eval_hub: (a),** but there are no frontier scores.

## Cross-cutting legal notes (not legal advice)

- **Copyright.** A single benchmark score is a fact. In the US, facts are not protected and compilations are protected
  only in their original selection and arrangement (*Feist v. Rural*, 1991). Australia likewise needs human
  authorship for a compilation (*IceTV v Nine*, 2009; *Telstra v Phone Directories*, 2010) and has no separate database
  right. The risk lies in copying a whole table's selection and layout, or the charts and text. It does not lie in
  recording individual cells in our own schema.
- **EU database right (Directive 96/9/EC).** This protects substantial investment in *obtaining, verifying or
  presenting* data. It does not protect investment in *creating* data (CJEU *British Horseracing Board v William Hill*,
  C-203/02). Vendor benchmark scores are arguably created by the vendor's own runs. The right also forbids repeated,
  systematic extraction of insubstantial parts, which is another reason to keep the scope narrow. It protects only makers
  established in the EU.
- **Contract.** For a mere visitor, website terms are browsewrap and enforceability is uncertain. We are probably bound
  more firmly, because the API speed measurements make us a customer under Anthropic's Commercial Terms, OpenAI's
  Services Agreement and Google's API terms. Two of those cover documentation (Anthropic) and websites (OpenAI). That
  is the main reason to forbid scripts or scrapers on vendor pages, even where robots.txt allows them.
- **Trademarks.** Model names may be used to identify the models. Logos are already handled as trademarks in
  `DATA-LICENSE.md`.
- **Our licence.** The dataset is CC BY-SA 4.0 "to the extent copyright or database rights exist in our
  contributions". Category (b) rows would carry no licence from the vendor. Record them like the price facts, with
  `license: "Factual vendor-reported score (not licensed content)"`, so we do not claim to relicense vendor material.

## Recommended rule (narrowest workable)

> **Lab-reported scores (by: "lab").** First use open-licensed vendor sources: an explicit CC BY, BY-SA, CC0, MIT or
> Apache grant on the page, file, repo or arXiv record, under the current policy. As an extension of the first-party
> facts exception, we may also record a vendor's own published score for **its own model** from that vendor's
> announcement, system/model card or docs, if the governing terms have no clause against quoting. Conditions:
>
> 1. **By hand, one figure at a time.** No scripts, crawlers, headless browsers or automated extraction of vendor
>    pages, even where robots.txt allows them.
> 2. **Our selection only.** Record only benchmarks already in our catalogue, re-expressed in our schema. Never copy
>    whole tables, charts, images or prose, or reproduce the vendor's layout.
> 3. **Own model, vendor-computed only.** Skip cells for other labs' models ("as reported by OpenAI"; "sourced from
>    providers' self reported numbers"). Also skip cells the vendor says came from a third party, such as Google's
>    "Vals Index results are sourced from Vals AI". Take those from the third party under its own licence, or not at all.
> 4. **Provenance.** Record the exact URL (the PDF URL for system cards), the observed date, and the
>    setting/harness/effort as printed. Use a `first-party-<vendor>-scores` source entry with
>    `license: "Factual vendor-reported score (not licensed content)"`.
> 5. **Labelled.** Show as "lab-reported" in the data and UI, filterable like today's `by: "lab"` rows. Do not present
>    them as independent measurements.
> 6. **Removal.** Remove a row if the vendor objects. Re-check the terms when a vendor changes them.

### Which sources qualify

| Vendor | Under the current policy (a) | Only under the extension (b) | Never (c) |
|---|---|---|---|
| Anthropic | None with frontier scores. political-neutrality-eval is CC BY but has no scores we use. | anthropic.com announcement pages (e.g. /claude-opus-5-5); system card PDFs (www-cdn.anthropic.com). | Any automated collection (Consumer Terms: crawl/scrape/bot). |
| OpenAI | arXiv GPT-5, o1 and GPT-4o system cards (CC BY 4.0); simple-evals (MIT, already used); gpt-oss card (already used). | openai.com/index announcement pages; deploymentsafety.openai.com system cards. This is the most restrictive wording, so keep it strictly manual and selective. | Any automated collection (Terms of Use: "Automatically or programmatically extract data"). |
| Google | docs.cloud.google.com "Developer's guide to Gemini 3.7/3.8 Flash" tables; ai.google.dev Gemma model cards; arXiv Gemini 1.5/2.5 reports; eval_hub (Apache). | blog.google posts; deepmind.google model pages; model cards (HTML/PDF); evals-methodology PDFs. This covers **Gemini 4 Argon**, which has no CC BY page yet. | Automated access against robots.txt (none at present). Third-party-sourced cells in Google tables. |

### Practical cautions

- **The same figure can differ between vendor pages.** The Gemini 3.8 Flash guide gives 3.7 Flash "Terminal-bench
  2.1" as 81.6%, but the 3.7 Flash guide says 85.1%. Record the page and date, and prefer the page about the model
  itself.
- **Vendor tables mix sources.** Anthropic prints GPT-6 Astra numbers "as reported by OpenAI". Google's Argon PDF says
  "All the results for non-Gemini models are sourced from providers' self reported numbers" and sources several
  Gemini cells from Vals AI and Zapier.
- **Watch for new open-licensed copies.** When a Google Cloud developer guide for Gemini 4 Argon appears, or OpenAI
  posts a GPT-6 card on arXiv, prefer that (a) source over the (b) page.

## Fetch log (2026-10-07)

| Page | How fetched |
|---|---|
| anthropic.com: /claude-opus-5-5, /system-cards, /legal/consumer-terms, /legal/commercial-terms; Opus 5.5 system card PDF | Direct, HTTP 200 |
| platform.claude.com docs (overview, what's new, models overview) | Direct, 200 |
| openai.com /policies/terms-of-use/ | Wayback 2026-10-05 (direct fetch got 403) |
| openai.com /policies/business-terms/, which is the "OpenAI Services Agreement" (canonical /policies/services-agreement/) | Wayback 2026-09-12 |
| openai.com /index/gpt-6-astra/ | Wayback 2026-10-04 |
| openai.com /index/safety-overview-gpt-6-astra/ | Wayback 2026-09-22 |
| openai.com /policies/ | Wayback 2026-10-05 |
| openai.com /policies/sharing-publication-policy/ | Wayback 2026-09-29 |
| deploymentsafety.openai.com/gpt-6-astra; developers.openai.com model pages | Direct, 200 |
| blog.google Argon post; deepmind.google /models/gemini/, /models/model-cards/, /models/model-cards/gemini-3-8-flash/; Argon eval PDF; 3.8 Flash model-card PDF | Direct, 200 |
| policies.google.com/terms; developers.google.com/site-policies; ai.google.dev and docs.cloud.google.com pages | Direct, 200 |
| GitHub: openai/simple-evals, openai/mle-bench, anthropics/political-neutrality-eval, anthropics/model-cards, google-deepmind/eval_hub | `gh api` |
| arXiv abs pages: 2601.03267, 2412.16720, 2410.21276, 2508.10925, 2507.06261, 2403.05530 | Direct, 200 |
