// Thanks someone in the README: adds them to data/contributors.json and rewrites README.md.
//   npm run contributor -- sto0ka bench 8        @sto0ka's bench results in issue #8
//   npm run contributor -- someone data 12 15    data fixes in #12 and #15
// Kinds: bench, data, code, docs, bugs, ideas. Running it again for someone adds to their entry.
// With --comment it reads a /contributor comment from the environment (COMMENT, ISSUE, AUTHOR,
// TITLE, PR) and prints the reply, for the "thank a contributor" workflow.
import { readFileSync, writeFileSync } from "node:fs";
import { KINDS, REPO_URL, addContribution, commentArgs, isKind, isLogin, type Contributor } from "../lib/contributors.ts";

const root = new URL("../", import.meta.url);
const file = new URL("data/contributors.json", root);
function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}
const usage = `Usage: npm run contributor -- <GitHub username> <${Object.keys(KINDS).join("|")}> [issue or PR numbers]`;

const fromComment = process.argv[2] === "--comment";
const env = process.env;
let args = process.argv.slice(2);
if (fromComment) {
  try {
    args = commentArgs(env.COMMENT ?? "", { number: Number(env.ISSUE), author: env.AUTHOR ?? "", title: env.TITLE ?? "", pr: env.PR === "true" });
  } catch (e) {
    fail((e as Error).message);
  }
}
const [who, kind, ...rest] = args;
if (!who || !kind) fail(usage);
const name = who.replace(/^@/, "");
if (!isLogin(name)) fail(`Not a GitHub username: ${who}`);
if (!isKind(kind)) fail(`Unknown kind "${kind}". ${usage}`);
const refs = rest.map((r) => Number(r.replace(/^#/, "")));
if (refs.some((n) => !Number.isInteger(n) || n <= 0)) fail(`Issue and PR numbers must be whole numbers: ${rest.join(" ")}`);

// GitHub's spelling of the name, so the link and avatar work. Offline, the name as typed.
let github = name;
try {
  const auth: Record<string, string> = env.GH_TOKEN ? { authorization: `Bearer ${env.GH_TOKEN}` } : {};
  const res = await fetch(`https://api.github.com/users/${name}`, { headers: { accept: "application/vnd.github+json", ...auth }, signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) fail(`There's no GitHub user called ${name}.`);
  if (res.ok) github = ((await res.json()) as { login: string }).login;
  else console.warn(`GitHub answered ${res.status}, so ${name} is used as typed.`);
} catch {
  console.warn(`Couldn't reach GitHub, so ${name} is used as typed.`);
}

const before = readFileSync(file, "utf8");
const list = JSON.parse(before) as Contributor[];
const next = addContribution(list, github, kind, refs);
const after = `[\n${next.map((c) => `  ${JSON.stringify(c)}`).join(",\n")}\n]\n`;
const entry = next.find((c) => c.github === github)!;
const what = entry.for.map((k) => KINDS[k]).join(", ");
if (after === before) {
  console.log(fromComment ? `${github} is already in the [contributors list](${REPO_URL}#contributors) for this.` : `@${github} is already listed for that.`);
  process.exit(0);
}
writeFileSync(file, after);

// Imported after the write, so the README is built from the new list.
const { readmePage } = await import("../lib/markdown.ts");
writeFileSync(new URL("README.md", root), readmePage(readFileSync(new URL("scripts/readme-about.md", root), "utf8")));
console.log(fromComment
  ? `Thanks @${github}! You're in the [contributors list](${REPO_URL}#contributors) for ${what}.`
  : `${list.length === next.length ? "Updated" : "Added"} @${github}: ${what}${entry.refs ? ` (#${entry.refs.join(", #")})` : ""}. Wrote data/contributors.json and README.md.`);
