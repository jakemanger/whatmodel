// Read-only fetching for source verification. Only http(s) on the default ports, never a private
// or local address, redirects re-checked hop by hop, a timeout and a size cap on every response.
// No credentials are sent. Tests pass a fake Net instead.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

export type Fetched = { ok: boolean; status: number; url: string; type: string; text: string; truncated: boolean };
export type Net = { get(url: string, opts?: { accept?: string; maxBytes?: number }): Promise<Fetched> };

export const UA = "whatmodel-contrib-bot (+https://github.com/jakemanger/whatmodel)";
const MAX_BYTES = 8 << 20;
const TIMEOUT_MS = 20_000;

export function checkUrl(raw: string): URL {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error(`not a URL: ${raw.slice(0, 200)}`); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error(`only http(s) links can be checked: ${u.protocol}`);
  if (u.username || u.password) throw new Error("links with credentials aren't fetched");
  if (u.port && u.port !== "443" && u.port !== "80") throw new Error("links on non-standard ports aren't fetched");
  if (/^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i.test(u.hostname)) throw new Error("local addresses aren't fetched");
  return u;
}

export function privateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    // Accept only ordinary global unicast; reject mapped IPv4, local and tunnel ranges.
    return !/^[23][0-9a-f]{3}:/.test(v) || /^(2001:(db8|0):|2002:)/.test(v);
  }
  if (isIP(ip) !== 4) return true;
  const [a, b, c] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b < 128) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b < 32) || (a === 192 && (b === 168 || b === 0)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113) || a >= 224;
}

export function webNet(): Net {
  return {
    async get(raw, o = {}) {
      let url = checkUrl(raw);
      const max = Math.min(MAX_BYTES, Math.max(1, o.maxBytes ?? MAX_BYTES));
      for (let hop = 0; hop < 6; hop++) {
        const host = url.hostname.replace(/^\[|\]$/g, "");
        const addrs = isIP(host) ? [{ address: host, family: isIP(host) }] : await lookup(host, { all: true });
        if (!addrs.length || addrs.some((a) => privateAddress(a.address))) throw new Error(`${url.hostname} resolves to a non-public address`);
        const addr = addrs[0];
        // Pin the checked DNS answer. A second DNS lookup would permit rebinding.
        const result = await new Promise<Fetched & { redirect?: string }>((resolve, reject) => {
          const request = url.protocol === "https:" ? httpsRequest : httpRequest;
          const req = request(url, {
            family: addr.family,
            lookup: (_host, _options, cb) => cb(null, addr.address, addr.family),
            headers: { "user-agent": UA, accept: o.accept ?? "text/html,application/json,text/plain;q=0.9", "accept-encoding": "identity" },
          }, (res) => {
            const status = res.statusCode ?? 0;
            if (status >= 300 && status < 400 && res.headers.location) {
              resolve({ ok: false, status, url: url.toString(), type: "", text: "", truncated: false, redirect: res.headers.location });
              res.destroy(); return;
            }
            const chunks: Buffer[] = []; let size = 0;
            const finish = (truncated: boolean) => resolve({ ok: status >= 200 && status < 300, status, url: url.toString(), type: String(res.headers["content-type"] ?? ""), text: Buffer.concat(chunks).toString("utf8"), truncated });
            res.on("data", (chunk: Buffer) => {
              const remaining = max - size; chunks.push(chunk.subarray(0, remaining)); size += chunk.length;
              if (size > max) { finish(true); res.destroy(); }
            });
            res.on("end", () => finish(false)); res.on("error", reject);
          });
          const timer = setTimeout(() => req.destroy(new Error("Source request timed out")), TIMEOUT_MS);
          req.on("close", () => clearTimeout(timer)); req.on("error", reject); req.end();
        });
        if (!result.redirect) return result;
        url = checkUrl(new URL(result.redirect, url).toString());
      }
      throw new Error(`too many redirects from ${raw}`);
    },
  };
}

// Responses keyed by URL, for tests and offline runs. Unknown URLs are a 404.
export function fakeNet(routes: Record<string, string | { status?: number; text?: string; type?: string; json?: unknown }>, log: string[] = []): Net {
  return {
    async get(url) {
      checkUrl(url);
      log.push(url);
      const r = routes[url];
      if (r === undefined) return { ok: false, status: 404, url, type: "text/plain", text: "not found", truncated: false };
      const x = typeof r === "string" ? { text: r } : r;
      const text = x.json !== undefined ? JSON.stringify(x.json) : x.text ?? "";
      const status = x.status ?? 200;
      return { ok: status < 400, status, url, type: x.type ?? (x.json !== undefined ? "application/json" : "text/html"), text, truncated: false };
    },
  };
}

// Visible text of an HTML page: scripts and styles dropped, block tags as spaces, inline tags
// (e.g. MathML <mn>48</mn><mo>.</mo><mn>3</mn>) joined, entities decoded.
export function htmlText(html: string): string {
  return html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<annotation[\s\S]*?<\/annotation(-xml)?>/gi, "")
    .replace(/<\/?(td|th|tr|p|div|br|li|table|thead|tbody|h\d|section|caption|figure|figcaption|header|footer|article|ul|ol|dt|dd|pre)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => safeCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => safeCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t\r\f\v]+/g, " ");
}

const safeCodePoint = (n: number) => n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "�";
