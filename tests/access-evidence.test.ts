import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueOnly, rank } from '../lib/fit.ts';
import { whereLabel } from '../lib/format.ts';
import { fit, toCells } from '../lib/score.ts';
import type { Model, Result } from '../lib/types.ts';

test('published files and code are accessible without claiming local hardware compatibility', () => {
  const scores = new Map([['test', { id: 'test', g: 50, n: 4, pm: 3 }]]);
  for (const kind of ['weights', 'code', 'gated'] as const) {
    const model: Model = {
      id: 'test', name: 'Test', provider: 'Test', category: 'decision', open_weights: true,
      access: { kind, url: 'https://example.com/files', source: 'https://example.com/evidence', checked: '2026-10-31', note: 'Published files; runtime unverified.' },
    };
    assert.equal(catalogueOnly(model), false);
    const [row] = rank([model], scores, { specs: null });
    assert.equal(row.where, 'setup');
    assert.equal(row.cmd, model.access!.url);
    assert.equal(row.mem_gb, null);
    assert.equal(row.speed, null);
    assert.equal(whereLabel(row), kind === 'gated' ? 'request access' : kind === 'code' ? 'source code' : 'model files');
    for (const max of [0, 1]) assert.equal(rank([model], scores, { specs: null, max })[0].where, 'none');
    assert.equal(rank([model], scores, { specs: { ram: 1024, vram: 1024, gpu: 'card' }, max: null })[0].where, 'none');
    model.api = { url: 'https://example.com/api' };
    assert.equal(rank([model], scores, { specs: null })[0].where, 'api');
  }
});

test('reviewed submissions remain non-independent and retain their measured scores', () => {
  const results: Result[] = ['a', 'b', 'c'].flatMap((model, i) => ['one', 'two'].map((bench) => ({
    model, bench, score: 0.4 + i * 0.2, source: 'https://example.com/run', by: 'submitted' as const,
  })));
  const benches = ['one', 'two'].map((id) => ({ id, name: id, kind: 'acc' as const, chance: 0, url: 'https://example.com/test' }));
  const submitted = fit(toCells(results, benches));
  const maker = fit(toCells(results.map((r) => ({ ...r, by: 'lab' as const })), benches));
  for (const [id, score] of submitted.scores) {
    assert.equal(score.lab, score.n, 'submitted evidence must not silently become independent');
    assert.equal(score.g, maker.scores.get(id)!.g);
  }
  assert.equal(submitted.scores.size, 3);
});
