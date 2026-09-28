// Writes the whatmodel.sh pages as markdown: README.md (the LLM leaderboard plus
// scripts/readme-about.md), pages/<category>.md, pages/method.md and pages/model/<id>.md.
//   npm run pages              write any that changed
//   npm run pages -- --check   exit 1 if any are out of date
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { renderPages } from "../lib/markdown.ts";

const root = new URL("../", import.meta.url);
const pages = renderPages(readFileSync(new URL("scripts/readme-about.md", root), "utf8"));

const at = (f: string) => new URL(f, root);
const stale = [...pages.keys()].filter((f) => !existsSync(at(f)) || readFileSync(at(f), "utf8") !== pages.get(f));
const modelDir = at("pages/model/");
const orphans = existsSync(modelDir) ? readdirSync(modelDir).filter((f) => !pages.has(`pages/model/${f}`)) : [];

if (process.argv.includes("--check")) {
  if (stale.length || orphans.length) {
    console.error(`${stale.length + orphans.length} pages are out of date: ${[...stale, ...orphans].slice(0, 5).join(", ")}… Run: npm run pages`);
    process.exit(1);
  }
  console.log(`${pages.size} pages up to date.`);
} else {
  for (const f of orphans) rmSync(at(`pages/model/${f}`));
  for (const f of stale) {
    mkdirSync(new URL(".", at(f)), { recursive: true });
    writeFileSync(at(f), pages.get(f)!);
  }
  console.log(`Wrote ${stale.length} of ${pages.size} pages${orphans.length ? `, removed ${orphans.length}` : ""}.`);
}
