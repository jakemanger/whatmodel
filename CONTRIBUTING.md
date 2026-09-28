# Contributing

Data fixes are the most useful help: a missing model, a wrong price, a new benchmark result, a measured
speed. You don't need to write code for any of them.

## Report something

Open an issue with the **Wrong number** or **Missing model** form. Include a source link for every
number.

## Change the data yourself

1. Edit the files in `data/`. [UPDATING.md](UPDATING.md) explains each file and field. It's the same
   routine the update agent follows, and [SEED.md](SEED.md) shows the import format if you're adding
   several things at once (`npm run import -- seed.json`).
2. Run the checks:
   ```sh
   npm install
   npm run check      # validates the data and reports leave-one-out prediction error
   npm test
   ```
3. See what changed on the leaderboard: `npm run board -- "ram=32&gpu=apple"`.
4. Open a pull request. The template asks for a source link per number.

Every pull request is reviewed before it's merged. CI runs the same checks. You don't need to update
`README.md` or `pages/`: they're regenerated from the data after each merge (`npm run pages` if you want to
preview them).

## Which sources are allowed

Numbers must come from a source marked `"allowed"` in `data/sources.json`:

- **Openly licensed results** (CC BY, CC BY-SA, CC0, MIT, Apache-2.0) that cover the actual data.
- **A vendor's own facts** for its own service, such as its list price or context window, recorded with
  the link and the date you saw it. This never covers benchmark scores.

Leaderboard aggregators and comparison sites can't be used, even when their numbers are public. That
includes Artificial Analysis, OpenRouter's pages and API data, and the arena.ai website. To propose a new
source, open an issue with a link to its licence or terms.

## Code and features

Bug fixes are welcome as pull requests. For new features or changes to how scores are calculated, start
a discussion first so we can agree on the approach before you build it.

## Licensing your contribution

By opening a pull request you agree that your data changes are licensed under
[CC BY-SA 4.0](DATA-LICENSE.md) and your code changes under the [MIT licence](LICENSE). Bench results are
released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
