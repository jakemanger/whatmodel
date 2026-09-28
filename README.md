# whatmodel

The open data, scoring code and bench script behind [whatmodel.sh](https://whatmodel.sh), which ranks
the AI models you can run on your hardware: LLMs, image, video, text-to-speech and speech-to-text.

```sh
curl "whatmodel.sh/?ram=32&gpu=apple"
```

The same leaderboard runs from this repo:

```sh
npm install
npm run board -- "ram=32&gpu=apple"
npm run board -- image "ram=64&gpu=card&vram=24"
npm run board -- "ram=16&gpu=apple&format=json"
```

## What's in here

| Path | Contents |
|---|---|
| `data/` | Models, benchmark results, prices, measured speeds and hardware. Every number links to its source. |
| `data/extracts/` | Share-alike source extracts, published separately as their licences require |
| `lib/` | The engine: scores (`score.ts`), memory fit and ranking (`fit.ts`), terminal output (`format.ts`), charts (`chart.ts`) |
| `bench.sh` | The benchmark script whatmodel.sh serves at `whatmodel.sh/bench.sh` |
| `scripts/` | Checks, import, export and measurement scripts |
| `licenses/` | Full licence notices for every source |
| `docs/` | Source audit, validation and coverage reports |

An interactive version of the database can be found at [whatmodel.sh](https://whatmodel.sh).

## How scores work

Each category's score comes from a one-factor latent model fitted to the benchmark results, within sets
of models that share enough benchmarks to be compared. It lives in `lib/score.ts` and is explained at
[whatmodel.sh/method](https://whatmodel.sh/method). 50 is an average model, and ± is the uncertainty.
`npm run check` reports how well the fit predicts results it hasn't seen.

Sponsors never change rankings or scores. Sponsored spots on whatmodel.sh are always labelled, and you
can check the ranking against the code here.

## Use the data

- Read the JSON in `data/` directly, or run `npm run export` to write cleaned snapshots and a SHA-256
  manifest to `dist/data/`. They're the same files whatmodel.sh serves at
  [whatmodel.sh/data/manifest.json](https://whatmodel.sh/data/manifest.json).
- The data is licensed [CC BY-SA 4.0](DATA-LICENSE.md): credit whatmodel.sh and share adaptations under
  the same licence. Each source's own licence also applies. `data/sources.json` lists them and
  `licenses/` has the full notices.

## The bench script

`bench.sh` times the models already installed in your local ollama. It downloads and installs nothing
and needs no sudo. Apart from fetching a one-time code from whatmodel.sh, it only talks to your local
ollama, and nothing about your results is sent until you choose to submit them. Read it before you run
it:

```sh
curl -fsSL whatmodel.sh/bench.sh -o bench.sh && less bench.sh && sh bench.sh
```

Submitted results are released under CC0 1.0 and reviewed before they're added.

## Contributing

Corrections and new results are welcome, and you don't need to write code. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Licences

Code: [MIT](LICENSE). Data: [CC BY-SA 4.0](DATA-LICENSE.md). Bench results: CC0 1.0.
Copyright 2026 Merlinsbeard Pty Ltd.
