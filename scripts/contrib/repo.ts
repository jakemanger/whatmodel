// The parts of data/ the contribution bot reads, loaded from any checkout (or built in tests).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MakerIcon } from "../../lib/icons.ts";
import type { Source } from "../../lib/sources.ts";
import type { Benchmark, Model, Result } from "../../lib/types.ts";

export type Repo = { models: Model[]; results: Result[]; benchmarks: Benchmark[]; sources: Source[]; icons: MakerIcon[] };

export function loadRepo(dir: string): Repo {
  const load = <T>(f: string): T => JSON.parse(readFileSync(join(dir, "data", f), "utf8"));
  return { models: load("models.json"), results: load("results.json"), benchmarks: load("benchmarks.json"), sources: load("sources.json"), icons: load("icons.json") };
}
