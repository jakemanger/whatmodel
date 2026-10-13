// People thanked in the README for their contributions (data/contributors.json). Add someone with
// `npm run contributor` (scripts/contributor.ts).

export const REPO_URL = "https://github.com/jakemanger/whatmodel";

// What someone contributed, as the README words it.
export const KINDS = { bench: "bench results", data: "data", code: "code", docs: "docs", bugs: "bug reports", ideas: "ideas" } as const;
export type Kind = keyof typeof KINDS;
// `refs` are issue or pull request numbers in this repo.
export type Contributor = { github: string; for: Kind[]; refs?: number[] };

export const isKind = (s: string): s is Kind => Object.hasOwn(KINDS, s);

// GitHub usernames: letters, digits and single hyphens, not at either end, up to 39 characters.
export const isLogin = (s: string) => /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(s);

// What a "/contributor [@username] [kind]" comment on an issue or pull request asks for, as
// `npm run contributor` arguments: its author unless it names someone, and the kind its title
// suggests unless it names one (bench results issues are bench, pull requests code, other issues data).
export function commentArgs(comment: string, on: { number: number; author: string; title: string; pr: boolean }): string[] {
  const words = comment.trim().split("\n")[0].trim().split(/\s+/).slice(1);
  const named = words.filter((w) => w.startsWith("@"));
  const kinds = words.filter(isKind);
  if (named.length > 1 || kinds.length > 1 || named.length + kinds.length < words.length)
    throw new Error(`Write /contributor, optionally followed by @username and one of: ${Object.keys(KINDS).join(", ")}.`);
  const who = named[0] ?? on.author;
  if (who.endsWith("[bot]")) throw new Error(`A bot opened #${on.number}, so name the person: /contributor @username`);
  return [who, kinds[0] ?? (/^bench results/i.test(on.title) ? "bench" : on.pr ? "code" : "data"), String(on.number)];
}

// The list with this contribution added. Someone new goes last; someone already listed (in any
// letter case) gains the kind and references.
export function addContribution(list: Contributor[], github: string, kind: Kind, refs: number[] = []): Contributor[] {
  const at = list.findIndex((c) => c.github.toLowerCase() === github.toLowerCase());
  const old: Contributor = at >= 0 ? list[at] : { github, for: [] };
  const all = [...new Set([...(old.refs ?? []), ...refs])].sort((a, b) => a - b);
  const entry: Contributor = { github: old.github, for: [...new Set([...old.for, kind])], ...(all.length ? { refs: all } : {}) };
  return at >= 0 ? list.map((c, i) => (i === at ? entry : c)) : [...list, entry];
}

export function contributorsMarkdown(list: Contributor[]): string {
  if (!list.length) return "";
  const line = (c: Contributor) => {
    const refs = (c.refs ?? []).map((n) => `[#${n}](${REPO_URL}/issues/${n})`).join(", ");
    const avatar = `<img src="https://github.com/${c.github}.png?size=40" width="20" height="20" alt="">`;
    return `- ${avatar} [@${c.github}](https://github.com/${c.github}): ${c.for.map((k) => KINDS[k]).join(", ")}${refs ? ` (${refs})` : ""}`;
  };
  return `### Contributors\n\nThanks to everyone who has contributed:\n\n${list.map(line).join("\n")}`;
}
