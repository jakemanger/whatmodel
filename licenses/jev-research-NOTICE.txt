# Notice

This is an **independent, unaffiliated** evaluation. We have no relationship
with TypeSafe AI; "Jev" and "TypeSafe" are trademarks of their owner; the
model string measured is the service-reported `jev-1.13.0`.

## Protocol caveats that travel with every number here

* **Direct answering only.** Jev answered one-shot: no chain of thought, no
  tools, no retries, failures counted. Published frontier comparison numbers
  generally use reasoning-enabled, few-shot protocols. Comparisons are
  positioning, not matched races.
* **Pinned version, no changelog.** All calls used the service-reported
  `jev-1.13.0` during September 2026. The vendor publishes no per-version
  behavioral notes; another day's `jev-1.13.0` could differ.
* **0.01 quantization.** Every returned probability landed on a 0.01 grid;
  sub-quantum differences are noise and are never interpreted.
* **Behavioral evidence only.** No weights, gradients, or serving internals
  were accessed or reconstructed. Architecture statements are inferences from
  API-visible signals: answers, probability vectors, token counts, timing
  headers, billing usage.
* **Latency is proxy-reported upstream service time**
  (`x-envoy-upstream-service-time`: includes upstream processing and the
  Envoy-to-upstream network hop, does not certify exclusion of application
  queueing/preprocessing/serialization). Latency slopes are contaminated by
  multi-tenant batching and are not convertible to parameter counts.
* **Probability calibration is dataset-dependent** (near-calibrated on
  MMLU-Pro, overconfident on HLE) and displayed probabilities are rounded to
  two decimals (vector sums 0.99/1.00).
* **Self-reports are learned text.** The model's identity answers are a brand
  prior, not provenance; the tokenizer evidence contradicts the self-report.
* **MATH-500 / ARC-AGI-2 results are protocol conversions** (multiple-choice,
  per-cell re-encodings) measuring knowledge, not generation.
* **Talk-to-Jev outputs are collaborative**: token-level generation is steered
  by a local scorer model, and option position demonstrably moves Jev's
  choices; character- and vocabulary-menu results are the model's own and
  degenerate. Neither is "the model writing".

Raw per-request logs containing third-party licensed prompt text are held
privately; the freeze hashes in `runs_benchmark*/freeze/` pin them exactly.
