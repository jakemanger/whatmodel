See how fast AI models run on your computer, and add your results to whatmodel.sh.

## Run it

```sh
curl -fsSL https://whatmodel.sh/bench.sh | sh
```

Needs macOS or Linux (WSL works) with Python 3.9+. Want to read the script before it runs?

```sh
curl -fsSL https://whatmodel.sh/bench.sh -o bench.sh && less bench.sh && sh bench.sh
```

## What happens

1. It looks at your machine and the AI tools you already have.
2. You tick what to test: models you have, models that fit your memory, and your subscriptions. Press `/` to search.
3. It shows exactly what it will run, download and use, then waits for you.
4. Tests run one at a time, in a random order. Ctrl-C stops at any time.
5. Press Enter to upload your results, or upload them later with the command it prints.

Just looking? Try it with pretend models:

```sh
curl -fsSL https://whatmodel.sh/bench.sh | sh -s -- --demo
```

## What's shared

Model names, speeds, runtime versions, and your chip, RAM and OS. Never file paths, prompts, answers, keys or your computer's name. Results go to GitHub as an issue you can read first: directly through the GitHub CLI if you're signed in to it, otherwise as a draft in your browser that you submit yourself. They're released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/) and checked before they appear.

---

[Launcher](https://whatmodel.sh/bench.sh) · [Python source](https://whatmodel.sh/bench.py) · [Technical details](https://github.com/jakemanger/whatmodel/blob/main/BENCHMARKING.md#technical-details) · [Other ways to contribute](https://whatmodel.sh/contribute)
