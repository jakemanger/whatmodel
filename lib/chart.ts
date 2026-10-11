// Character-grid scatter plots of the leaderboard (score against price, memory, context or
// release date). One engine draws both the terminal version (ANSI, ?chart=1) and the page's
// interactive version, which re-renders the grid with a crosshair and a tooltip box on hover.

export type Group = "open" | "closed";
export type Point = { id: string; label: string; x: number; y: number; group?: Group };
export type Kind = "axis" | "grid" | "open" | "closed" | "front" | "label" | "hot" | "cross" | "tip" | "tipdim" | "faded";
export type Cell = { ch: string; k: Kind };
export type Better = "low" | "high" | "time";
// A visible range: x in plotted units (log10 of the value on a log axis), y in score points.
export type Domain = { x0: number; x1: number; y0: number; y1: number };
export type Chart = { rows: Cell[][]; pos: Map<string, { r: number; c: number }>; frontier: Point[]; gutter: number; full: Domain; view: Domain; plotW: number; height: number };

type Opts = {
  xTick: (v: number) => string;
  log: boolean;
  better: Better;
  width?: number;
  height?: number;
  labels?: boolean; // omit model labels in compact previews
  labelLimit?: number; // keep previews readable
  hot?: string | null; // hovered point: gets a crosshair
  tip?: string[] | null; // tooltip lines for the hovered point, drawn as a box
  marked?: Set<string>; // search matches: labelled, everything else faded
  view?: Domain | null; // zoomed range; the full range when absent. Characters keep their size.
  labelAll?: boolean; // label every visible point when few are visible (a zoomed view)
};

// Models nothing else beats: cheaper (or smaller) and better, larger context and better, or best so far.
export function frontier(points: Point[], better: Better): Point[] {
  const out: Point[] = [];
  const sorted = [...points].sort((a, b) => (better === "high" ? b.x - a.x : a.x - b.x) || b.y - a.y);
  for (const p of sorted) if (!out.length || p.y > out[out.length - 1].y) out.push(p);
  return out;
}

function ticksLog(lo: number, hi: number, n: number) {
  const out: number[] = [];
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++)
    for (const m of hi / lo < 40 ? [1, 2, 5] : [1]) { const v = m * 10 ** e; if (v >= lo && v <= hi) out.push(v); }
  // Zoomed into less than a decade: evenly spaced round values instead.
  return out.length >= 3 ? out : ticksLin(lo, hi, n).filter((v) => v > 0);
}
function ticksLin(lo: number, hi: number, n: number) {
  const raw = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

export function scatter(all: Point[], o: Opts): Chart | null {
  const pts = all.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && (!o.log || p.x > 0));
  if (pts.length < 3) return null;
  const width = o.width ?? 76, height = o.height ?? 18, gutter = 5, plotW = width - gutter - 1;
  const front = frontier(pts, o.better), onFront = new Set(front.map((p) => p.id));

  const X = (v: number) => (o.log ? Math.log10(v) : v);
  let fx0 = Math.min(...pts.map((p) => X(p.x))), fx1 = Math.max(...pts.map((p) => X(p.x)));
  const xpad = (fx1 - fx0) * 0.03 || 0.5; fx0 -= xpad; fx1 += xpad;
  const ys = pts.map((p) => p.y), lo = Math.min(...ys), hi = Math.max(...ys);
  const full: Domain = { x0: fx0, x1: fx1, y0: lo - (hi - lo) * 0.04, y1: hi + (hi - lo) * 0.08 };
  const { x0, x1, y0, y1 } = o.view ?? full;
  const inPlot = (r: number, c: number) => r >= 0 && r < height && c > gutter && c < width;
  const col = (v: number) => gutter + 1 + Math.round(((X(v) - x0) / (x1 - x0)) * (plotW - 1));
  const row = (y: number) => height - 1 - Math.round(((y - y0) / (y1 - y0)) * (height - 1));

  const grid: Cell[][] = Array.from({ length: height + 2 }, () => Array.from({ length: width }, () => ({ ch: " ", k: "grid" as Kind })));
  const put = (r: number, c: number, ch: string, k: Kind) => { if (grid[r]?.[c]) grid[r][c] = { ch, k }; };
  const empty = (r: number, c: number) => grid[r]?.[c] !== undefined && (grid[r][c].ch === " " || grid[r][c].k === "grid");
  const text = (r: number, c: number, s: string, k: Kind) => s.split("").forEach((ch, i) => put(r, c + i, ch, k));

  // Axes, and a faint dotted grid at the ticks.
  const yTicks = ticksLin(y0, y1, Math.max(3, Math.round(height / 5)));
  const yLabel = (t: number) => (y1 - y0 < 8 ? t.toFixed(1) : `${Math.round(t)}`);
  const xTicks = o.log ? ticksLog(10 ** x0, 10 ** x1, Math.max(3, Math.round(plotW / 16))) : ticksLin(x0, x1, Math.max(3, Math.round(plotW / 16)));
  for (let r = 0; r < height; r++) put(r, gutter, "│", "axis");
  for (const t of yTicks) {
    const r = row(t);
    if (r < 0 || r >= height) continue;
    text(r, 0, yLabel(t).padStart(gutter - 1), "axis");
    put(r, gutter, "┤", "axis");
    for (let c = gutter + 2; c < width; c += 2) put(r, c, "·", "grid");
  }
  put(height, gutter, "└", "axis");
  for (let c = gutter + 1; c < width; c++) put(height, c, "─", "axis");
  let lastEnd = -1;
  for (const t of xTicks) {
    const c = col(t), label = o.xTick(t);
    if (c <= gutter || c >= width) continue;
    put(height, c, "┬", "axis");
    for (let r = 1; r < height; r += 2) if (empty(r, c)) put(r, c, "·", "grid");
    const start = Math.min(width - label.length, Math.max(0, c - Math.floor(label.length / 2)));
    if (start > lastEnd + 1) { text(height + 1, start, label, "axis"); lastEnd = start + label.length; }
  }

  // Frontier staircase: horizontal from the lower-scoring point, then up to the higher one.
  const fs = [...front].sort((a, b) => a.x - b.x);
  for (let i = 0; i + 1 < fs.length; i++) {
    const [lo2, hi2] = fs[i].y < fs[i + 1].y ? [fs[i], fs[i + 1]] : [fs[i + 1], fs[i]];
    const r1 = row(lo2.y), r2 = row(hi2.y), c1 = col(lo2.x), c2 = col(hi2.x), dir = c2 > c1 ? 1 : -1;
    const lo3 = Math.max(gutter, Math.min(c1, c2)), hi3 = Math.min(width, Math.max(c1, c2)); // only the visible part of a step
    for (let c = lo3; c <= hi3; c++) if (c !== c1 && c !== c2 && inPlot(r1, c) && empty(r1, c)) put(r1, c, "─", "front");
    if (r1 > r2 && c2 > gutter && c2 < width) {
      if (inPlot(r1, c2) && empty(r1, c2)) put(r1, c2, dir > 0 ? "┘" : "└", "front");
      for (let r = Math.min(r1 - 1, height - 1); r > Math.max(r2, -1); r--) if (empty(r, c2)) put(r, c2, "│", "front");
    }
  }

  // Points: others first, the frontier on top. A search fades everything it doesn't match.
  const pos = new Map<string, { r: number; c: number }>();
  const solid = (p: Point) => (p.group === "closed" ? "◆" : "●");
  const hollow = (p: Point) => (p.group === "closed" ? "◇" : "∘");
  for (const p of [...pts.filter((p) => !onFront.has(p.id)), ...front]) {
    const r = row(p.y), c = col(p.x);
    if (!inPlot(r, c)) continue; // outside the zoomed range
    pos.set(p.id, { r, c });
    const k: Kind = o.marked?.size && !o.marked.has(p.id) ? "faded" : p.group === "closed" ? "closed" : "open";
    put(r, c, onFront.has(p.id) || o.marked?.has(p.id) ? solid(p) : hollow(p), k);
  }

  // Selective labels: search matches, then the frontier from the top down, where they fit.
  const free = (r: number, c0: number, len: number) => {
    if (r < 0 || r >= height || c0 <= gutter + 1 || c0 + len >= width) return false;
    for (let c = c0 - 1; c <= c0 + len; c++) if (!empty(r, c) && grid[r][c].k !== "front") return false;
    return true;
  };
  const done = new Set<string>();
  const everyone = o.labelAll && pos.size <= 30 ? pts.filter((p) => pos.has(p.id) && !onFront.has(p.id)).sort((a, b) => b.y - a.y) : [];
  for (const p of o.labels === false ? [] : [...pts.filter((p) => o.marked?.has(p.id)), ...[...front].sort((a, b) => b.y - a.y), ...everyone]) {
    if (done.size >= (o.labelLimit ?? Infinity)) break;
    if (done.has(p.id) || !pos.has(p.id)) continue;
    const { r, c } = pos.get(p.id)!, s = p.label.length > 26 ? p.label.slice(0, 25) + "…" : p.label;
    const spot = [[r, c + 2], [r - 1, c + 1], [r, c - s.length - 1], [r - 1, c - s.length], [r + 1, c + 2], [r + 1, c - s.length - 1]]
      .find(([rr, cc]) => free(rr, cc, s.length));
    if (spot) { text(spot[0], spot[1], s, "label"); done.add(p.id); }
  }

  // Hover: crosshair to both axes, the values called out on the axes, and a tooltip box.
  const hot = o.hot && pos.has(o.hot) ? pts.find((p) => p.id === o.hot) : undefined;
  if (hot) {
    const { r, c } = pos.get(hot.id)!;
    for (let cc = gutter + 1; cc < c; cc++) if (empty(r, cc) || grid[r][cc].k === "front") put(r, cc, "┄", "cross");
    for (let rr = r + 1; rr < height; rr++) if (empty(rr, c) || grid[rr][c].k === "front") put(rr, c, "┆", "cross");
    text(r, 0, yLabel(hot.y).padStart(gutter - 1), "hot");
    put(r, gutter, "┼", "hot");
    const xv = o.xTick(hot.x), xs = Math.min(width - xv.length, Math.max(0, c - Math.floor(xv.length / 2)));
    for (let cc = Math.max(0, xs - 1); cc < Math.min(width, xs + xv.length + 1); cc++) put(height + 1, cc, " ", "axis");
    text(height + 1, xs, xv, "hot");
    put(height, c, "┴", "hot");
    put(r, c, solid(hot), "hot");
    if (o.tip?.length) {
      const w = Math.max(...o.tip.map((l) => l.length)) + 4, h = o.tip.length + 2;
      let bc = c + 3, br = Math.min(Math.max(0, r - 1), height - h);
      if (bc + w > width) bc = c - w - 2;
      if (bc < gutter + 1) { bc = gutter + 2; br = r + 2 + h <= height ? r + 2 : Math.max(0, r - h - 1); }
      for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
        const edge = i === 0 || i === h - 1, side = j === 0 || j === w - 1;
        const ch = edge && side ? (i === 0 ? (j === 0 ? "┌" : "┐") : j === 0 ? "└" : "┘") : edge ? "─" : side ? "│" : " ";
        put(br + i, bc + j, ch, "tipdim");
      }
      o.tip.forEach((l, i) => text(br + 1 + i, bc + 2, l, i === 0 ? "tip" : "tipdim"));
    }
  }
  return { rows: grid.map(trimRight), pos, frontier: front, gutter, full, view: { x0, x1, y0, y1 }, plotW, height };
}

const trimRight = (r: Cell[]) => {
  let n = r.length;
  while (n && r[n - 1].ch === " ") n--;
  return r.slice(0, n);
};

// Runs of cells with the same kind, for painting (ANSI here, spans on the page).
export function runs(cells: Cell[]): { k: Kind; s: string }[] {
  const out: { k: Kind; s: string }[] = [];
  for (const c of cells) { const last = out.at(-1); if (last && last.k === c.k) last.s += c.ch; else out.push({ k: c.k, s: c.ch }); }
  return out;
}

const ANSI: Record<Kind, string> = { axis: "2", grid: "2", open: "32", closed: "36", front: "33", label: "0", hot: "1;33", cross: "2", tip: "1", tipdim: "2", faded: "2" };
export function chartToText(title: string, ch: Chart, color: boolean): string[] {
  const paint = (s: string, k: Kind) => (color && s.trim() ? `\x1b[${ANSI[k]}m${s}\x1b[0m` : s);
  return [`  ${title}`, ...ch.rows.map((r) => `  ${runs(r).map((x) => paint(x.s, x.k)).join("")}`)];
}

export const usd = (v: number) => (v >= 100 ? `$${Math.round(v)}` : v >= 1 ? `$${+v.toFixed(2)}` : `$${+v.toPrecision(2)}`);
export const gbLabel = (v: number) => (v >= 1000 ? `${+(v / 1000).toPrecision(2)}TB` : `${+v.toPrecision(2)}GB`);
export const ctxLabel = (v: number) => (v >= 1000 ? `${+(v / 1000).toPrecision(2)}M` : `${Math.round(v)}k`);
export const monthLabel = (v: number) => {
  const y = Math.floor(v + 1e-9), m = Math.min(12, Math.floor((v - y) * 12 + 1e-9) + 1);
  return `${y}-${String(m).padStart(2, "0")}`;
};
export const PRICE_AXIS: Record<string, string> = {
  llm: "USD per 1M tokens, 3 input : 1 output",
  image: "USD per image",
  video: "USD per second of video",
  tts: "USD per 1M characters",
  stt: "USD per audio minute",
};

type RowLike = { id: string; name: string; score: number | null; price: number | null; need_gb: number | null; open_weights: boolean };
const groupOf = (r: RowLike): Group => (r.open_weights ? "open" : "closed");

// Terminal version (?chart=1): what the score costs, and what it needs to run.
export function chartsFor(rows: RowLike[], cat: string, width = 76): { title: string; chart: Chart }[] {
  const priced = rows.flatMap((r) => (r.score !== null && r.price ? [{ id: r.id, label: r.name, x: r.price, y: r.score, group: groupOf(r) }] : []));
  const local = rows.flatMap((r) => (r.score !== null && r.need_gb ? [{ id: r.id, label: r.name, x: r.need_gb, y: r.score, group: groupOf(r) }] : []));
  return [
    { title: `score vs API price (${PRICE_AXIS[cat] ?? "USD"}, log)   ● open weights  ◆ API only  ─┘ best for the price`, chart: scatter(priced, { xTick: usd, log: true, better: "low", width }) },
    { title: "score vs memory to run it (GB, log)   ─┘ best for the memory", chart: scatter(local, { xTick: gbLabel, log: true, better: "low", width }) },
  ].filter((c): c is { title: string; chart: Chart } => c.chart !== null);
}
