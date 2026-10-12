## Technical details

### What it measures

- **Ollama:** its own timings: generation and prompt tokens/sec, load time, time to the first token (load plus prompt reading) and total time.
- **llama.cpp** (`llama-bench` or `llama bench`) **and MLX** (`mlx_lm.benchmark`): a fixed protocol of a 512-token prompt and the chosen number of generated tokens, one trial per run. They time prompt reading (prefill) and generation separately, so there's no first token or total, and they don't use the gardening prompt.
- **LM Studio and other OpenAI-compatible servers:** a streamed chat reply: first-token time, total time and generation speed from the reported token count. They don't report prefill speed.
- **Reasoning models** count their thinking tokens as generated tokens.
- **Agents** (Claude Code, Codex, Gemini CLI): a fixed short task, its time and tokens. That's not model throughput or coding quality.

Every test gets a warm-up that isn't counted, then shuffled rounds with a random 1-3 s pause before each call. The first second of each pause measures how much CPU other programs are using; the summary warns above 25% and reviewers see it on each result. The run's seed is in the report, so the order and pauses can be replayed. Measurements from different protocols shouldn't be averaged together.

### What it installs or downloads

Only what a ticked test needs, after you start the plan: a runtime's official installer (llama.cpp from llama.app, MLX with `uv tool install mlx-lm`, Ollama's Linux script) and the model download shown in the plan. Desktop apps such as LM Studio open their download page instead. The model list comes from [pages/bench-models.json](pages/bench-models.json), published at `/data/bench-models.json` and generated with the rest of the data.

### The report

It records each result's whatmodel.sh model, runtime, version and quantisation, the per-run numbers, and the machine's OS family, architecture, chip, RAM and GPU. It's saved to `~/.whatmodel/` (readable only by you). To upload a saved report later:

```sh
python3 bench.py --upload ~/.whatmodel/bench-YYYYMMDD-HHMMSS.json
```

### Testing changes

```sh
npm run test:bench
sh -n bench.sh
```

Tests use a loopback fixture and mocked tools, never paid calls or the real GitHub. After changing `bench.py`, update the SHA-256 in `bench.sh`; the tests check they agree. Deploy both files together.
