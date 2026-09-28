// npm run icons — downloads a favicon for every source host in data/results.json into
// icons/<host>.png. Run after adding results from a new source; check.ts enforces it.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Result } from "../lib/types.ts";

const results: Result[] = JSON.parse(readFileSync(new URL("../data/results.json", import.meta.url), "utf8"));
const hosts = [...new Set(results.map((r) => new URL(r.source).hostname.replace(/^www\./, "")))];

for (const host of hosts) {
  const file = new URL(`../icons/${host}.png`, import.meta.url);
  if (existsSync(file)) continue;
  const res = await fetch(`https://www.google.com/s2/favicons?domain=${host}&sz=64`);
  if (!res.ok) {
    console.error(`${host}: ${res.status}`);
    continue;
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`${host}: saved`);
}
