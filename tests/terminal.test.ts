import test from 'node:test';
import assert from 'node:assert/strict';
import { leaderboardResponse } from '../lib/api-response.ts';
import { terminalCell, terminalWidth } from '../lib/terminal-layout.ts';
import { toText } from '../lib/format.ts';
import type { BoardData } from '../lib/board.ts';
import { CATEGORY_IDS } from '../lib/categories.ts';

const models = Array.from({ length: 45 }, (_, i) => ({ id: `model-${i}`, name: i === 0 ? '模型 🧑‍💻 e\u0301 ' + 'Long model name '.repeat(6) : `Model ${i}`, provider: 'Test', open_weights: false, api: { url: 'https://example.com', price_in: 1, price_out: 3 } }));
const data: BoardData = {
  cat: 'llm', updated: '2026-10-12', updatedLabel: '2026-10-12 00:00 UTC', models, hardware: [], speeds: [],
  sets: [{ id: 'overall', label: 'Overall', models: models.map((m) => m.id), scores: models.map((m, i) => ({ id: m.id, g: 90 - i, pm: 2, n: 10 })), benches: 12 }],
  resultModels: models.map((m) => m.id), sources: {},
};
const response = (query = '', board = data) => leaderboardResponse(new Request('https://whatmodel.sh/api?' + query), board, []);
const bounded = (text: string, width: number) => {
  for (const line of text.split('\n')) assert.ok(terminalWidth(line) <= width, `${terminalWidth(line)} > ${width}: ${line}`);
};

test('default text shows ten rows at 80 columns; JSON keeps full details and 40 rows', async () => {
  const text = await response().text();
  bounded(text, 80);
  assert.equal(text.split('\n').filter((line) => /^\s+\d+\s/.test(line)).length, 10);
  assert.doesNotMatch(text, /\x1b|nvidia-smi|GET IT|sysctl/);
  const json = await response('format=json').json();
  assert.equal(json.models.length, 40);
  assert.equal(json.models[0].name, models[0].name);
  assert.equal(json.models[0].cmd, 'https://example.com');
});

test('all categories, colour, help, charts and width options fit their requested terminal', async () => {
  for (const cat of CATEGORY_IDS) for (const width of [40, 60, 80, 100, 120]) {
    const board = { ...data, cat, models: models.map((m) => ({ ...m, category: cat })) };
    for (const extra of ['', '&color=1', '&help=1', '&chart=1']) bounded(await response(`width=${width}${extra}`, board).text(), width);
  }
});

test('wide output adds useful columns and requested row limits work', async () => {
  assert.match(await response('width=120').text(), /SPEED\s+CONTEXT/);
  assert.equal((await response('n=20').text()).split('\n').filter((line) => /^\s+\d+\s/.test(line)).length, 20);
  for (const value of ['0', '-1', 'NaN', 'Infinity', 'bad']) bounded(await response(`width=${value}&n=${value}`).text(), 80);
});

test('graphemes align by terminal cell width without splitting emoji or accents', () => {
  assert.equal(terminalWidth('模型'), 4);
  assert.equal(terminalWidth('e\u0301'), 1);
  assert.equal(terminalWidth('🧑‍💻'), 2);
  assert.equal(terminalWidth(terminalCell('模型 🧑‍💻 e\u0301', 7)), 7);
  assert.equal(terminalCell('🧑‍💻abc', 4), '🧑‍💻a…');
});

test('empty results explain the gap without printing an empty table', () => {
  const text = toText([], null, null, { cat: 'llm', color: false, base: 'https://whatmodel.sh', limit: 10, all: false, benches: 0, updated: '' });
  assert.match(text, /No reviewed rankings/);
  assert.doesNotMatch(text, /MODEL\s+SCORE|NaN|Infinity/);
});
