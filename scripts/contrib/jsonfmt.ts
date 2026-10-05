// Writes a changed JSON value back to its file without reformatting what didn't change. Each
// unchanged array element or object property keeps its exact original text (so "35.0" stays
// "35.0" in models.json); changed or new values are written in the file's own style: 2-space
// pretty JSON, or one element per line (benchmarks.json, icons.json). Non-ASCII stays as is.

type Node = { start: number; end: number; kind: "array" | "object" | "scalar"; items?: Node[]; props?: { key: string; value: Node }[] };

// Spans of the JSON text, without building values (JSON.parse does that).
function scan(text: string, at: number, deep: boolean): Node {
  let i = at;
  const ws = () => { while (/\s/.test(text[i] ?? "")) i++; };
  const skipString = () => { i++; while (text[i] !== '"') { if (text[i] === "\\") i++; i++; if (i > text.length) throw new Error("unterminated string"); } i++; };
  const value = (depth: number): Node => {
    ws();
    const start = i, c = text[i];
    if (c === "{" || c === "[") {
      const kind = c === "{" ? "object" : "array";
      const node: Node = { start, end: 0, kind, ...(kind === "array" ? { items: [] } : { props: [] }) };
      i++; ws();
      if (text[i] === (kind === "object" ? "}" : "]")) { i++; node.end = i; return node; }
      for (;;) {
        ws();
        let key = "";
        if (kind === "object") {
          const k = i; skipString(); key = JSON.parse(text.slice(k, i)); ws();
          if (text[i++] !== ":") throw new Error(`expected : at ${i}`);
        }
        const child = deep || depth === 0 ? value(depth + 1) : skipValue();
        if (kind === "object") node.props!.push({ key, value: child }); else node.items!.push(child);
        ws();
        const d = text[i++];
        if (d === ",") continue;
        if (d === (kind === "object" ? "}" : "]")) break;
        throw new Error(`unexpected ${d} at ${i - 1}`);
      }
      node.end = i;
      return node;
    }
    return skipValue();
  };
  const skipValue = (): Node => {
    ws();
    const start = i;
    if (text[i] === '"') { skipString(); return { start, end: i, kind: "scalar" }; }
    if (text[i] === "{" || text[i] === "[") {
      let depth = 0;
      do {
        const c = text[i];
        if (c === '"') { skipString(); continue; }
        if (c === "{" || c === "[") depth++;
        else if (c === "}" || c === "]") depth--;
        i++;
      } while (depth > 0 && i < text.length);
      return { start, end: i, kind: text[start] === "{" ? "object" : "array" };
    }
    while (i < text.length && !/[\s,\]}]/.test(text[i])) i++;
    return { start, end: i, kind: "scalar" };
  };
  return value(0);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const pad = (n: number) => "  ".repeat(n);

// A fresh value in pretty style at a given depth (JSON.stringify's own layout, indented).
const fresh = (v: unknown, depth: number, oneLine: boolean) =>
  oneLine ? JSON.stringify(v) : JSON.stringify(v, null, 2).replace(/\n/g, `\n${pad(depth)}`);

// `text` is the node's original text, `node` its spans (shallow nodes are re-scanned on demand).
function render(text: string, node: Node | undefined, oldValue: unknown, newValue: unknown, depth: number, oneLine: boolean): string {
  if (node && same(oldValue, newValue)) return text.slice(node.start, node.end);
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  if (!node || !oldValue || typeof newValue !== "object" || newValue === null || Array.isArray(oldValue) !== Array.isArray(newValue) || (!Array.isArray(newValue) && !isObj(oldValue)))
    return fresh(newValue, depth, oneLine);
  const full = node.items || node.props ? node : scan(text, node.start, false);
  const inline = oneLine || !text.slice(full.start, full.end).includes("\n");
  const open = (s: string) => (inline ? s : `${s}\n${pad(depth + 1)}`);
  const sep = inline ? "," : `,\n${pad(depth + 1)}`;
  const close = (s: string) => (inline ? s : `\n${pad(depth)}${s}`);
  if (Array.isArray(newValue)) {
    if (!newValue.length) return "[]";
    const old = oldValue as unknown[];
    // Unchanged elements are found by content, so insertions and removals keep the rest intact.
    const pool = new Map<string, number[]>();
    old.forEach((v, i) => { const k = JSON.stringify(v); pool.set(k, [...(pool.get(k) ?? []), i]); });
    const parts = newValue.map((v, i) => {
      const k = JSON.stringify(v), hit = pool.get(k)?.shift();
      if (hit !== undefined) return text.slice(full.items![hit].start, full.items![hit].end);
      const twin = i < old.length && isObj(old[i]) && isObj(v) && (old[i] as { id?: unknown }).id === (v as { id?: unknown }).id ? i : -1;
      return twin >= 0 ? render(text, full.items![twin], old[twin], v, depth + 1, inline) : fresh(v, depth + 1, inline);
    });
    return open("[") + parts.join(sep) + close("]");
  }
  const old = oldValue as Record<string, unknown>, nv = newValue as Record<string, unknown>;
  const keys = Object.keys(nv);
  if (!keys.length) return "{}";
  const spans = new Map(full.props!.map((p) => [p.key, p.value]));
  const parts = keys.map((k) => `${JSON.stringify(k)}${inline ? ":" : ": "}${render(text, spans.get(k), old[k], nv[k], depth + 1, inline)}`);
  return open("{") + parts.join(sep) + close("}");
}

// The new file text for `newValue`, given the file's current text.
export function preserve(original: string, newValue: unknown): string {
  const oldValue = JSON.parse(original);
  const root = scan(original, 0, false);
  const trailing = original.slice(root.end);
  const items = root.items ?? root.props?.map((p) => p.value) ?? [];
  // One-element-per-line files: every element on its own line, nothing nested over lines.
  const oneLine = Array.isArray(oldValue) && items.length > 0 && items.every((n) => !original.slice(n.start, n.end).includes("\n"));
  if (Array.isArray(newValue) && oneLine) {
    const pool = new Map<string, number[]>();
    (oldValue as unknown[]).forEach((v, i) => { const k = JSON.stringify(v); pool.set(k, [...(pool.get(k) ?? []), i]); });
    const lines = newValue.map((v, i) => {
      const hit = pool.get(JSON.stringify(v))?.shift();
      if (hit !== undefined) return original.slice(items[hit].start, items[hit].end);
      const old = (oldValue as unknown[])[i];
      return old && typeof old === "object" && (old as { id?: unknown }).id === (v as { id?: unknown })?.id
        ? render(original, items[i], old, v, 1, true) : JSON.stringify(v);
    });
    return `[\n${lines.map((l) => `  ${l}`).join(",\n")}\n]${trailing}`;
  }
  return render(original, root, oldValue, newValue, 0, false) + trailing;
}
