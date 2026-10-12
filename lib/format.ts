// Plain-text leaderboard for curl and agents, plus labels shared with the web page.

import { CATEGORIES } from "./categories.ts";
import { terminalCell, terminalColumns, terminalWrap } from "./terminal-layout.ts";
import { hasScore, usable, type Row, type RowSpeed } from "./fit.ts";
import type { Category, Specs } from "./types.ts";

export const sponsor: { text: string; url: string } | null = null;

export const DISCLOSURE =
  "Scores, speeds, prices and memory figures are estimates from the public sources linked on each model's page. " +
  "They can be incomplete, out of date or wrong. Review any command before you run it.";

// One command per OS: reads RAM and graphics card memory (nvidia-smi, or AMD's sysfs file on Linux) and sends the
// raw numbers; the server converts units (see ramGb). Nothing is downloaded or executed.
// `curl.exe` sidesteps Windows PowerShell's `curl` alias.
const SMI = "nvidia-smi -i 0 --query-gpu=memory.total --format=csv,noheader,nounits";
export const detect = (host: string, path = "/") => ({
  mac: `curl "${host}${path}?mac=$(sysctl -n hw.memsize)"`,
  linux: `curl "${host}${path}?ram=$(awk '/MemT/{print $2}' /proc/meminfo)&vram=$(${SMI} 2>/dev/null || cat /sys/class/drm/card*/device/mem_info_vram_total 2>/dev/null | sort -n | tail -1)"`,
  windows: `curl.exe "${host}${path}?ram=$((gcim Win32_ComputerSystem).TotalPhysicalMemory)&vram=$(${SMI} 2>$null)"`,
});
export type OS = keyof ReturnType<typeof detect>;

// Same, but also sends the chip / GPU name so speeds can come from measurements on that exact hardware.
const SMI_NAME = "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader";
// These default to max=0: what that machine can run locally.
export const detectExact = (host: string, path = "/") => ({
  mac: `curl -G ${host}${path} -d max=0 --data-urlencode "mac=$(sysctl -n hw.memsize machdep.cpu.brand_string)"`,
  linux: `curl -G ${host}${path} -d max=0 --data-urlencode "ram=$(awk '/MemT/{print $2}' /proc/meminfo)" --data-urlencode "nv=$(${SMI_NAME} 2>/dev/null)"`,
  windows: `curl.exe -G ${host}${path} -d max=0 --data-urlencode "ram=$((gcim Win32_ComputerSystem).TotalPhysicalMemory)" --data-urlencode "nv=$(${SMI_NAME} 2>$null)"`,
});

// The curl command for a set of picks, keeping only params the API understands.
export function curlFor(host: string, path: string, q: URLSearchParams) {
  const keep = new URLSearchParams();
  for (const k of ["mac", "ram", "gpu", "vram", "hw", "max", "sort", "dir", "all", "retired", "thin", "set", "score", "chart", "n", "width", "help"]) {
    const v = q.get(k);
    if (v) keep.set(k, v);
  }
  return keep.size ? `curl "${host}${path}?${keep}"` : `curl ${host}${path === "/" ? "" : path}`;
}

const money = (p: number) => (p >= 1 ? p.toFixed(2) : p >= 0.1 ? p.toFixed(2) : p >= 0.01 ? p.toFixed(3) : p.toFixed(4));
export const price = (p: number | null, cat: Category = "llm") => (p === null ? "" : `$${money(p)}/${CATEGORIES[cat].priceUnit}`);

// Local rows name the selected download; the score describes the published model evaluation.
export const displayName = (r: Row) => (r.quant ? `${r.name} · ${r.quant}` : r.name);

export function whereLabel(r: Row) {
  if (r.where === "local") return "local";
  if (r.where === "local-slow") return "local (slow)";
  if (r.where === "api") return `api ${r.price === null ? "price unknown" : price(r.price, r.category)}${r.also_local ? " +local" : ""}`;
  if (r.where === "retired") return "comparison only";
  if (r.where === "preview") return "limited preview";
  const why = [r.need_gb !== null && `needs ${r.need_gb}GB`, r.over_budget && (r.price === null ? "price unknown" : price(r.price, r.category))].filter(Boolean);
  return `✗ ${why.join(" or ")}`;
}

// "85 tok/s" measured, "~34 tok/s" scaled or estimated. "×" for realtime factors.
export function speedLabel(s: RowSpeed | null) {
  if (!s) return "";
  const n = s.unit === "x-realtime" ? `${s.value}×` : `${s.value} ${s.unit}`;
  return s.how === "measured" ? n : `~${n}`;
}
export const contextLabel = (k: number | null) => (k === null ? "" : k >= 1000 ? `${Math.round(k / 100) / 10}M` : `${Math.round(k)}k`);

export function speedNote(s: RowSpeed | null) {
  if (!s) return "";
  if (s.how === "measured") return s.on ? `measured on ${s.on}` : "measured API speed";
  if (s.how === "scaled") return `measured on ${s.on}, scaled to your memory bandwidth`;
  if (s.how === "elsewhere") return `measured on ${s.on}; yours may differ`;
  return "estimated from your memory bandwidth (no measurement for this model yet)";
}

export const describeMax = (max: number, cat: Category = "llm") => (max === 0 ? "local only" : `up to ${price(max, cat)}`);

export function describeSpecs(s: Specs) {
  const gpu = s.hw ? s.hw.name : s.gpu === "apple" ? "Apple Silicon" : s.gpu === "card" ? `${s.vram}GB graphics card` : "no GPU";
  const u = usable(s);
  const avail = s.gpu === "none" ? `~${Math.round(u.total)}GB for models (CPU, slow)` : `~${Math.round(u.fast)}GB fast`;
  return `${s.ram ? `${s.ram}GB RAM · ` : ""}${gpu} → ${avail}`;
}

type Opts = { width?: number; task?: string; color: boolean; base: string; limit: number; all: boolean; benches: number; updated: string; cat: Category;
  comparison?: { selected?: string; scoreMode: "overall" | "set"; sets: { id: string; label: string; models: number }[] };
  retiredCount?: number; // scored models with no verified API or download, listed unless ?retired=0
  thin?: boolean; thinCount?: number; // text models with fewer than 3 results, listed only with ?thin=1
};

export function terminalHelp(base: string, cat: Category, width = 80) {
  const host = base.replace(/^https?:\/\//, "");
  const path = CATEGORIES[cat].path;
  const lines = [
    `whatmodel.sh${path === '/' ? '' : path} · terminal help`, '',
    `curl "${host}${path}?ram=32&gpu=apple&max=0"`, '',
    'ram=32       RAM in GB',
    'gpu=apple    Apple Silicon (or card / none)',
    'vram=24      Graphics card memory in GB',
    'hw=<id>      Exact chip or GPU; see the website hardware picker',
    'max=0        Local models only; max=1 caps API price',
    `             API price unit: USD/${CATEGORIES[cat].priceUnit}`,
    'sort=speed   Sort by score, speed, where, ram or context',
    'dir=asc      Reverse the usual sort order',
    'n=20         Show more rows (default: 10; JSON: 40)',
    'width=120    Wider table with speed and context (default: 80)',
    'all=1        Include models outside your hardware or budget',
    'thin=1       Include models with fewer than 3 results',
    'retired=0    Hide models available for comparison only',
    'set=<id>     Filter to a comparison set; add score=set to rescore',
    'format=json  Full names, commands, links and source attribution',
    'color=1      ANSI colour (off by default)',
    'chart=1      Add text charts', '',
    'Lists: /  /image  /video  /tts  /stt',
    `Sources and scoring: ${host}/method`,
    `Terms: ${host}/terms`, '',
    'curl does not send your terminal size. Set width explicitly, or:',
    `curl "${host}${path}?width=$(tput cols)"`,
  ];
  return '\n' + lines.flatMap((line) => line ? (line.length <= terminalColumns(width) - 2 ? [line] : terminalWrap(line, terminalColumns(width) - 2)).map((s) => '  ' + s) : ['']).join('\n') + '\n';
}

export function toText(rows: Row[], specs: Specs | null, max: number | null, o: Opts) {
  const c = (code: string, s: string) => (o.color ? `\x1b[${code}m${s}\x1b[0m` : s);
  const width = terminalColumns(o.width);
  const host = o.base.replace(/^https?:\/\//, "");
  const path = CATEGORIES[o.cat].path;
  const eligible = rows.filter((r) => o.all || r.where !== "none");
  const shown = eligible.slice(0, o.limit);
  const out: string[] = [''];
  const say = (s: string, code = '') => {
    for (const line of terminalWrap(s, width - 2)) out.push('  ' + (code ? c(code, line) : line));
  };
  say(`whatmodel.sh${path === '/' ? '' : path} · ${CATEGORIES[o.cat].title}`, '1;32');
  say(`Updated ${o.updated} · ${shown.length} of ${eligible.length} models`, '2');
  if (o.task) say(`Task: ${o.task}`);
  if (specs) say(`${describeSpecs(specs)}${max !== null ? ` · ${describeMax(max, o.cat)}` : ''}`);
  else if (max !== null) say(describeMax(max, o.cat));
  if (o.comparison) {
    const set = o.comparison.sets.find((s) => s.id === o.comparison?.selected);
    say(o.comparison.scoreMode === 'set' ? `Scores within ${set?.label ?? 'the selected set'} only.` : set ? `Set: ${set.label} · overall scores` : 'Overall scores; uncalibrated models have no score or rank.');
  }
  out.push('');
  if (!shown.length) say(rows.length ? 'No models match. Try a larger budget or ?all=1.' : 'No reviewed rankings available for this category yet.');
  else {
    // At 80 columns: rank, name, score, availability/price and RAM. Wider
    // terminals get speed and context; narrow ones keep the essential fields.
    const wide = width >= 100;
    const ram = width >= 76;
    const runWidth = width < 60 ? 14 : 23;
    const nameWidth = width - (2 + 3 + 8 + runWidth + 6 + (ram ? 8 : 0) + (wide ? 23 : 0));
    const columns = (rank: string, name: string, score: string, run: string, memory: string, speed: string, context: string) =>
      '  ' + [terminalCell(rank, 3, true), terminalCell(name, nameWidth), terminalCell(score, 8, true), terminalCell(run, runWidth),
        ...(ram ? [terminalCell(memory, 6, true)] : []),
        ...(wide ? [terminalCell(speed, 12, true), terminalCell(context, 7, true)] : [])].join('  ').trimEnd();
    out.push(c('2', columns('#', 'MODEL', 'SCORE', 'RUN / PRICE', 'RAM', 'SPEED', o.cat === 'llm' ? 'CONTEXT' : '')));
    for (const r of shown) {
      const score = hasScore(r) ? `${Math.round(r.score)}±${Math.round(r.pm)}${r.thin ? '*' : ''}${r.maker_only ? '†' : ''}` : '—';
      // Prices share one unit per category, explained once below the table.
      const run = r.where === 'api' ? `api${r.also_local ? '+local' : ''} ${r.price === null ? 'price unknown' : '$' + money(r.price)}` : whereLabel(r);
      const color = r.where === 'local' ? '32' : r.where === 'api' ? '36' : r.where === 'local-slow' ? '33' : '2';
      out.push(c(color, columns(String(r.rank ?? '—'), displayName(r), score, run,
        r.mem_gb === null ? '' : `~${Math.round(r.mem_gb)}GB`, speedLabel(r.speed), o.cat === 'llm' ? contextLabel(r.context_k) : '')));
    }
  }
  out.push('');
  say(`Score ± uncertainty · API $/${CATEGORIES[o.cat].priceUnit} · RAM estimated`, '2');
  if (shown.some((r) => r.thin)) say('* Few benchmark results; ranking is uncertain.', '2');
  if (shown.some((r) => r.maker_only)) say("† Only the maker's own results.", '2');
  if (shown.some((r) => r.score === null)) say('— not yet calibrated. See ?help=1 for comparison sets.', '2');
  if (width >= 100 && shown.some((r) => r.speed && r.speed.how !== 'measured')) say('~speed is estimated or measured on different hardware.', '2');
  if (!specs && max === null) say(`Your machine: curl "${host}${path}?ram=32&gpu=apple&max=0"`);
  say('?help=1 options · ?n=20 more · ?format=json full details', '2');
  say(`Sources: ${host}/method · Lists: /image /video /tts /stt`, '2');
  if (sponsor) say(`Sponsor: ${sponsor.text} — ${sponsor.url}`, '35');
  out.push('');
  return out.join('\n');
}
