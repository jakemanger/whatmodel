# Benchmark models you can run

Run from a macOS, Linux or WSL terminal with Python 3.9+ and curl:

```sh
curl -fsSL https://whatmodel.sh/bench.sh | sh
```

The launcher downloads the Python runner, verifies its checksum, and reconnects input to your
terminal so menus work when piped to sh. It installs and downloads nothing unless you say yes. To run a checkout directly:

```sh
python3 bench.py
python3 bench.py --list
python3 bench.py --plain
```

## Select and run

The menu finds Ollama models, GGUF files for llama.cpp, MLX models (Apple silicon), and models on standard
local llama.cpp, LM Studio, vLLM and Jan ports. It offers to start Ollama or LM Studio's server for the session.
It detects installed command-line tools without reading project files or credentials.
Add a compatible streaming chat API (base URL including `/v1`) and enter its key at the hidden
prompt, or select an existing GGUF file for `llama-bench`. Endpoints must provide `/models`
and streaming `/chat/completions` with `stream_options.include_usage`; not every provider's
native API supports that contract. A failed call is reported, never retried with extra paid requests.

Type to search, use arrows to move, Space to tick and Enter to confirm. Nothing starts selected.
Choose repetitions and the output limit, review the destinations/commands, and confirm the plan.
Progress and each numeric result appear as it runs. Ctrl-C stops the remaining plan.
Missing tools are listed with their official install commands. Pick any to install: each command is shown
first and runs only after you say yes (desktop apps such as LM Studio open their download page instead).
A runtime with nothing to test is offered one small model (Qwen3 0.6B, under 0.6 GB). Nothing is
installed or downloaded without asking.

Codex and Claude Code can run a fixed text task using existing authentication, an empty temporary
directory and restricted CLI options. Recent CLI versions are required. Other detected agents
are listed but do not have direct adapters. Agent calls can incur charges, include the CLI's normal
system context, and do not have a hard output-token cap. No project content is supplied.

## Read the measurements

- Ollama: runtime-reported generation and prompt tokens/sec, load time and wall time.
- Compatible API: first visible text latency, wall time, and end-to-end tokens/sec when usage is
  returned. End-to-end throughput includes queuing and prompt processing.
- llama-bench (or `llama bench`): synthetic 512-token prompt processing and selected-length generation
  throughput, with one internal repetition per outer run. It does not use the gardening prompt.
- MLX (`mlx_lm.benchmark`): the same synthetic protocol on Apple silicon: a 512-token prompt and the
  selected number of generated tokens, one trial per outer run after its own warm-up.
- Reasoning models count their thinking tokens as generated tokens in tokens/sec.
- Agents: fixed-task completion and elapsed time, not model token throughput or coding quality.

Runs are sequential. The first run is retained; caches and already loaded models are not cleared.
Every text run prefixes the fixed prompt with its repetition number. The report identifies the
protocol and prompt hash. Measurements from different protocols should not be averaged together.
Hardware collection is limited to OS family, architecture and RAM; GPU, exact quantization and
runtime version may need clarification during review before a result enters the catalogue.

## Review and share

Select results to include, supply their public catalogue model ids, and inspect the exact JSON.
Unselected results and blank model ids are omitted. The report is written to an owner-only local
file. Keys, endpoint URLs, hostnames, paths, generated answers and raw errors are not serialized.
Check the public labels yourself: the script cannot know whether a valid-looking model id is private.

After an explicit confirmation it opens a prefilled GitHub issue. Read it and press Submit in the
browser yourself. Opening the draft sends its contents to GitHub; the CLI does not publish it.
Large reports are saved as JSON for manual attachment instead of exceeding browser URL limits.
Submitted measurements use CC0 1.0 and require maintainer review.

## Local validation

```sh
npm run test:bench
sh -n bench.sh
```

Tests use a loopback fixture and mocked agents, not paid provider calls. After changing `bench.py`,
update the SHA-256 in `bench.sh`; the test checks that they agree. Deploy both files together.
