## About this repo

whatmodel is an open-source AI leaderboard database. The data, scoring and ranking engine,
and benchmark tools are available here. This README and [pages/](pages) are generated from the
same data and code with `npm run pages`.

An interactive version of the database can be found at [whatmodel.sh](https://whatmodel.sh). Every model has its own page showing
what it's good at, how each test result compares with other models, and how to run it:

<a href="https://whatmodel.sh/model/qwen3-6-27b"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/model-dark.png"><img alt="A whatmodel.sh model page: ranks by task, each test compared with other models, and commands to run it" src="docs/images/model-light.png"></picture></a>

| Path | Contents |
|---|---|
| `data/` | Models, benchmark results, prices, measured speeds and hardware. Every number links to its source. |
| `data/extracts/` | Share-alike source extracts, published separately as their licences require |
| `lib/` | The engine: scores (`score.ts`), memory fit and ranking (`fit.ts`), page data (`views.ts`), terminal output (`format.ts`), markdown pages (`markdown.ts`) |
| `pages/` | The other leaderboards, the method and one page per model, generated |
| `bench.sh`, `bench.py` | Interactive benchmark launcher and runner; see [BENCHMARKING.md](BENCHMARKING.md) |
| `scripts/` | Checks, import, export, page generation and measurement scripts |
| `licenses/` | Full licence notices for every source |
| `docs/` | Source audit, validation and coverage reports |

### From your terminal

```sh
curl "whatmodel.sh/?ram=32&gpu=apple"
curl "whatmodel.sh/image?ram=64&gpu=card&vram=24&format=json"
```

| Parameter | Meaning |
|---|---|
| `ram`, `vram` | GB, or raw bytes / kB / MiB as the OS reports them |
| `gpu` | `apple`, `card` (NVIDIA, AMD or Intel graphics card) or `none` |
| `mac` | bytes, optionally followed by a newline and the chip name; implies Apple Silicon |
| `nv` | `nvidia-smi --query-gpu=name,memory.total --format=csv,noheader` output |
| `hw` | exact chip or card id from `data/hardware.json` |
| `max` | highest price in the category's unit (LLMs: $ per 1M tokens, blended 3:1 in:out); `0` = local only |
| `sort`, `dir` | `score`, `where`, `speed`, `ram` or `context`; `asc` or `desc` |
| `set` | optional model-set filter; omitted = all sets, without changing the overall score scale |
| `score` | `set` uses only the selected set’s evaluations; omitted = overall scores, with uncalibrated scores/ranks reported as null |
| `all=1`, `n=40`, `format=json`, `color=1`, `chart=1` | show models that don't fit, row limit, JSON, ANSI colour, charts |

The same output runs from this repo, with no server:

```sh
npm install
npm run board -- "ram=32&gpu=apple"
npm run board -- image "ram=64&gpu=card&vram=24"
```

### How scores work

Each category's score comes from a one-factor latent model fitted to the benchmark results, within sets
of models that share enough benchmarks to be compared. It lives in `lib/score.ts` and is explained in
[pages/method.md](pages/method.md). 50 is an average model, and ± is the uncertainty. `npm run check`
reports how well the fit predicts results it hasn't seen.

Sponsors never change rankings or scores. Sponsored spots on whatmodel.sh are always labelled, and you
can check the ranking against the code here.

### Use the data

- Read the JSON in `data/` directly, or run `npm run export` to write cleaned snapshots, CSV tables
  (scores, models, results, speeds and bench runs) and a SHA-256 manifest to `dist/data/`. They're the same
  files whatmodel.sh serves at [whatmodel.sh/data/manifest.json](https://whatmodel.sh/data/manifest.json).
- The data is licensed [CC BY-SA 4.0](DATA-LICENSE.md): credit whatmodel.sh and share adaptations under
  the same licence. Each source's own licence also applies. `data/sources.json` lists them and
  `licenses/` has the full notices.

### The bench script

The benchmark runner discovers local models and supported agents, and lets you add compatible APIs
or a GGUF file. Search and select what to test, confirm the plan, then review the measurements.
No models or dependencies are installed. Python 3.9+ and curl are required.

```sh
curl -fsSL https://whatmodel.sh/bench.sh | sh
```

Results stay local until you choose to open a prefilled GitHub issue. Review it and submit it yourself
in the browser. API and agent tests may incur provider charges. See [BENCHMARKING.md](BENCHMARKING.md)
for supported runners, measurement protocols and what the public report contains.

Submitted results are released under CC0 1.0 and reviewed before they're added.

### Contributing

Corrections and new results are welcome, and you don't need to write code. See
[CONTRIBUTING.md](CONTRIBUTING.md).

### Licences

Code: [MIT](LICENSE). Data: [CC BY-SA 4.0](DATA-LICENSE.md). Bench results: CC0 1.0.
Copyright 2026 Merlinsbeard Pty Ltd.
