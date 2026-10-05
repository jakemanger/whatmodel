// npm run icons — fetches the icons the site shows. Only missing files are fetched.
//
// Source favicons: one per source host in data/results.json, into icons/<host>.png. Run after
// adding results from a new source; check.ts enforces it.
//
// Maker logos: one per entry in data/icons.json, fetched from the entry's recorded official `url`
// and normalised to a 64×64 PNG in icons/providers/<id>.png (transparency kept, padded to square).
//   npm run icons -- qwen openai   re-fetch these logos
//   npm run icons -- --refresh     re-fetch every logo
// Normalising needs ImageMagick (`magick`) or macOS `sips`, plus `rsvg-convert` (librsvg) for SVG.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ICONS, ICON_SIZE, pngSize } from "../lib/icons.ts";
import type { Result } from "../lib/types.ts";

// Some sites refuse requests without a browser user agent.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const S = String(ICON_SIZE);
const args = process.argv.slice(2);
const refresh = args.includes("--refresh");
const only = args.filter((a) => !a.startsWith("--"));

if (!only.length) {
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
}


const unknown = only.filter((id) => !ICONS.some((e) => e.id === id));
if (unknown.length) {
  console.error(`not in data/icons.json: ${unknown.join(", ")}`);
  process.exitCode = 1;
}
mkdirSync(new URL("../icons/providers/", import.meta.url), { recursive: true });
for (const e of ICONS) {
  const file = new URL(`../icons/providers/${e.id}.png`, import.meta.url);
  if (only.length ? !only.includes(e.id) : !refresh && existsSync(file)) continue;
  try {
    const res = await fetch(e.url, { headers: { "user-agent": UA, accept: "image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${e.url}`);
    writeFileSync(file, normalise(Buffer.from(await res.arrayBuffer())));
    console.log(`providers/${e.id}: saved from ${e.url}`);
  } catch (err) {
    console.error(`providers/${e.id}: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

function formatOf(b: Buffer) {
  if (b[0] === 0x89 && b.subarray(1, 4).toString() === "PNG") return "png";
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b.subarray(0, 4).toString() === "GIF8") return "gif";
  if (b.readUInt32BE(0) === 0x00000100) return "ico";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "webp";
  if (/<svg[\s>]/i.test(b.subarray(0, 4096).toString("utf8"))) return "svg";
  return undefined;
}

function has(cmd: string) {
  return (spawnSync(cmd, ["--version"]).error as NodeJS.ErrnoException | undefined)?.code !== "ENOENT";
}

function run(cmd: string, argv: string[]) {
  const r = spawnSync(cmd, argv, { encoding: "utf8" });
  if (r.error) throw new Error(`${cmd}: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr.trim()}`);
}

// The largest image in a .ico file.
function largestFrame(b: Buffer) {
  let best = 0, size = -1;
  for (let i = 0; i < b.readUInt16LE(4); i++) {
    const w = b[6 + i * 16] || 256;
    if (w > size) [best, size] = [i, w];
  }
  return best;
}

function normalise(input: Buffer): Buffer {
  const fmt = formatOf(input);
  if (!fmt) throw new Error("not an image (the URL may now serve a web page)");
  const tmp = mkdtempSync(join(tmpdir(), "whatmodel-icon-"));
  try {
    let src = join(tmp, `in.${fmt}`);
    writeFileSync(src, input);
    if (fmt === "svg") {
      if (!has("rsvg-convert")) throw new Error("install librsvg (rsvg-convert) to convert SVG logos");
      run("rsvg-convert", ["-w", "256", "-h", "256", "-a", "-o", join(tmp, "svg.png"), src]);
      src = join(tmp, "svg.png");
    }
    const out = join(tmp, "out.png");
    if (has("magick")) {
      const frame = fmt === "ico" ? `[${largestFrame(input)}]` : fmt === "gif" ? "[0]" : "";
      run("magick", [`${src}${frame}`, "-background", "none", "-resize", `${S}x${S}`, "-gravity", "center", "-extent", `${S}x${S}`, "-strip", `PNG32:${out}`]);
    } else if (process.platform === "darwin" && has("sips")) {
      const png = join(tmp, "png.png");
      run("sips", ["-s", "format", "png", src, "--out", png]);
      run("sips", ["-Z", S, png]);
      run("sips", ["-p", S, S, png, "--out", out]);
    } else throw new Error("install ImageMagick (magick) to normalise logos");
    const result = readFileSync(out);
    const size = pngSize(result);
    if (size?.width !== ICON_SIZE || size.height !== ICON_SIZE) throw new Error(`normalised to ${size?.width}×${size?.height}, expected ${S}×${S}`);
    return result;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
