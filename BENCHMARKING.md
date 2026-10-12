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

1. **Look.** It finds this machine's chip and memory, llama.cpp, MLX (Apple silicon), Ollama, LM Studio,
   local llama.cpp / LM Studio / vLLM / Jan servers, and the Claude Code, Codex and Gemini CLIs. It offers to
   start Ollama or LM Studio's server just for the session. It reads no project files or credentials.
2. **Pick.** A tick list of whatmodel.sh models this machine can run, from the published model list
   ([pages/bench-models.json](pages/bench-models.json), also at `/data/bench-models.json`):
   - models already on this machine, matched to their whatmodel.sh model and quantisation (ticked);
   - well-tested models that fit its memory, one per maker (downloaded first if you tick them);
   - your subscriptions: Claude Code's Opus, Sonnet and Haiku, and Codex's or Gemini's configured model.
   Press `/` (or type a name in plain mode) to search every whatmodel.sh model and add it.
3. **Plan.** Before anything runs it lists, for each test, the exact command, any runtime it installs
   (with the official install command), any download and its size, the prompts and token caps, and the
   most a Claude test can use. Start with Enter; Ctrl-C stops at any time and keeps finished results.
4. **Run.** Installs and downloads happen first, then every test runs one call at a time.

Nothing is installed, downloaded or run until you start the plan. A failed call is reported and retried
once, never with extra paid requests.

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

## Upload

Every result already knows its whatmodel.sh model, runtime and quantisation, so nothing is typed. The
script shows what will be uploaded (model, runtime, quantisation and speed, plus chip, RAM, OS and runtime
versions) and asks once; Enter uploads. It never sends file paths, host names, prompts, answers or keys.
Models that aren't on whatmodel.sh yet are left out and listed.

Uploading opens a prefilled GitHub issue: read it and press Submit in the browser. The report is also saved
to `~/.whatmodel/` (readable only by you). If you skip the upload, the script prints a command to send that
saved report later:

```sh
python3 bench.py --upload ~/.whatmodel/bench-YYYYMMDD-HHMMSS.json
curl -fsSL https://whatmodel.sh/bench.sh | sh -s -- --upload ~/.whatmodel/bench-YYYYMMDD-HHMMSS.json
```

Submitted measurements use CC0 1.0 and require maintainer review.

## Local validation

```sh
npm run test:bench
sh -n bench.sh
```

Tests use a loopback fixture and mocked agents, not paid provider calls. After changing `bench.py`,
update the SHA-256 in `bench.sh`; the test checks that they agree. Deploy both files together.
