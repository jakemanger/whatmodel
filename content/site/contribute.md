whatmodel.sh is open data. Every score, price, memory figure and run command comes from a public source you can check, and anyone can add to it. Most contributions need no code.

## Benchmark your own machine

Run the [whatmodel bench](/bench) to measure how fast models run on your hardware. It shows exactly what will be shared, then offers to open a prefilled GitHub issue for you to review and submit. Bench results are released under CC0.

## Add results from a research paper

New benchmark numbers usually appear in papers first. We can use a paper's numbers when the paper itself is openly licensed:

- On arXiv, open the paper's abstract page and check the licence link under "Access Paper". **CC BY**, **CC BY-SA** and **CC0** papers can be used. arXiv's default "non-exclusive license to distribute" isn't enough.
- A model card or code repository under **Apache-2.0** or **MIT** also works, when that licence covers the published results.

Then [open an "Add a test result" issue](https://github.com/jakemanger/whatmodel/issues/new?template=paper-results.yml) with the model, benchmark, score and reference link in separate fields. Table/page and evaluation settings are optional notes. Or add the rows to `data/results.json` yourself and open a pull request. [UPDATING.md](https://github.com/jakemanger/whatmodel/blob/main/UPDATING.md) explains each field.

## Add data from the sources we already use

These openly licensed sources supply most of the data and publish new results often. When a model is missing or a number is out of date, the fix is often a newer row from one of them:

- [LMArena leaderboard dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0): text, image and video arena ratings.
- [Epoch AI benchmark data](https://epoch.ai/benchmarks/use-this-data) (CC BY 4.0): language model evaluations.
- [Open ASR Leaderboard](https://github.com/huggingface/open_asr_leaderboard) (Apache-2.0): speech-to-text error rates.
- Official model cards on Hugging Face (Apache-2.0 or MIT): the makers' own evaluations.
- Openly licensed arXiv papers (CC BY or CC BY-SA): most other benchmarks.

The [sources list](/method#sources) shows every source in use and its licence. Leaderboard aggregators and comparison sites can't be used, even when their numbers are public. That includes Artificial Analysis, OpenRouter's pages and API data, and the arena.ai website.

## Fix a number or add a model

On a model page, choose **Update model information**. Both **Current information** and **Updated information** are prefilled. Edit the values in Updated information and add a reference link; leave the current copy unchanged. Use **[correct]** beside a benchmark result to prefill that score's model, test and source. A [missing model](https://github.com/jakemanger/whatmodel/issues/new?template=missing-model.yml) needs only its name and official link. Prices and context windows can come from the provider's own pricing page, with the date you checked it.

## Add or fix a model's icon

Each model shows its maker's logo, taken from the maker's own website or its Hugging Face or GitHub organisation. Icons are recorded in the data repository with the official URL they came from; [UPDATING.md](https://github.com/jakemanger/whatmodel/blob/main/UPDATING.md) explains how to add one.

## Improve these pages or the scoring

Press **edit this page on GitHub** on the About, FAQ or Contribute page to suggest a text change. For changes to how scores are calculated, [start a discussion](https://github.com/jakemanger/whatmodel/discussions) first. The [methodology](/method) describes the current calculation and its limits.

By opening a pull request you agree that data changes are licensed under CC BY-SA 4.0 and code changes under the MIT licence.

## Prefer a pull request?

Choose **Edit data on GitHub** on a model page, find its model id in `data/models.json`, and propose your edit through a fork and pull request. For benchmark results, edit `data/results.json`. Include the reference alongside each changed fact; [the contribution guide](https://github.com/jakemanger/whatmodel/blob/main/CONTRIBUTING.md) covers validation and review.
