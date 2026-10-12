// Width in terminal cells, rather than UTF-16 code units (CJK, emoji, accents).
const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const wide = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u1100-\u115f\u2329\u232a\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff01-\uff60\uffe0-\uffe6\u{20000}-\u{3fffd}]/u;
const parts = (s: string) => [...segments.segment(s)].map(({ segment }) => segment);
const cells = (s: string) => /^[\p{Mark}\p{Control}\p{Format}]+$/u.test(s) ? 0 : wide.test(s) ? 2 : 1;
export const terminalWidth = (s: string) => parts(s.replace(/\u001b\[[\d;]*m/g, '')).reduce((n, c) => n + cells(c), 0);
export const terminalColumns = (value?: string | number | null) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 40 ? Math.min(160, Math.floor(n)) : 80;
};
export function terminalCell(s: string, width: number, right = false) {
  let result = s;
  if (terminalWidth(s) > width) {
    result = '';
    for (const c of parts(s)) {
      if (terminalWidth(result + c) > width - 1) break;
      result += c;
    }
    result += '…';
  }
  const pad = ' '.repeat(Math.max(0, width - terminalWidth(result)));
  return right ? pad + result : result + pad;
}
export function terminalWrap(s: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of s.split(/\s+/).filter(Boolean)) {
    if (line && terminalWidth(line + ' ' + word) > width) { lines.push(line); line = ''; }
    for (const c of parts((line ? ' ' : '') + word)) {
      if (terminalWidth(line + c) > width) { lines.push(line); line = ''; }
      line += c;
    }
  }
  if (line) lines.push(line);
  return lines;
}
