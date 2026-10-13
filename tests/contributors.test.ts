import assert from 'node:assert/strict';
import test from 'node:test';
import { addContribution, commentArgs, contributorsMarkdown, isKind, isLogin } from '../lib/contributors.ts';
import { contributors } from '../lib/data.ts';

test('every listed contributor has a GitHub username, known kinds and issue numbers, once', () => {
  for (const c of contributors) {
    assert.ok(isLogin(c.github), c.github);
    assert.ok(c.for.length && c.for.every(isKind), `${c.github}: ${c.for}`);
    assert.ok((c.refs ?? []).every((n) => Number.isInteger(n) && n > 0), `${c.github}: ${c.refs}`);
  }
  assert.equal(new Set(contributors.map((c) => c.github.toLowerCase())).size, contributors.length);
});

test('adding someone again extends their entry instead of listing them twice', () => {
  let list = addContribution([], 'sto0ka', 'bench', [8]);
  list = addContribution(list, 'someone', 'docs');
  list = addContribution(list, 'STO0KA', 'data', [12, 8]);
  assert.deepEqual(list, [{ github: 'sto0ka', for: ['bench', 'data'], refs: [8, 12] }, { github: 'someone', for: ['docs'] }]);
});

test('the README thanks each contributor with a link to their profile and issues', () => {
  const md = contributorsMarkdown([{ github: 'sto0ka', for: ['bench'], refs: [8] }]);
  assert.match(md, /\[@sto0ka\]\(https:\/\/github\.com\/sto0ka\): bench results \(\[#8\]\(https:\/\/github\.com\/jakemanger\/whatmodel\/issues\/8\)\)/);
  assert.equal(contributorsMarkdown([]), '');
  assert.ok(!isLogin('-sto0ka') && !isLogin('a--b') && !isLogin('a'.repeat(40)) && isLogin('a-b1'));
});

test('a /contributor comment thanks the author, or whoever and whatever it names', () => {
  const bench = { number: 8, author: 'sto0ka', title: 'Bench results: AMD Ryzen 7 H 255, 15 GB RAM (2 tests)', pr: false };
  assert.deepEqual(commentArgs('/contributor', bench), ['sto0ka', 'bench', '8']);
  assert.deepEqual(commentArgs('/contributor docs\nthanks!', { ...bench, title: 'Typo' }), ['sto0ka', 'docs', '8']);
  assert.deepEqual(commentArgs('/contributor @someone', { ...bench, title: 'Fix the export', pr: true }), ['@someone', 'code', '8']);
  assert.deepEqual(commentArgs('/contributor', { ...bench, title: 'Wrong price for GPT-5' }), ['sto0ka', 'data', '8']);
  assert.throws(() => commentArgs('/contributor', { ...bench, author: 'github-actions[bot]' }), /name the person/);
  assert.throws(() => commentArgs('/contributor please', bench), /optionally followed by/);
  assert.throws(() => commentArgs('/contributor toString', bench), /optionally followed by/);
});
