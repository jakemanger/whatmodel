import { MODEL_FIELDS, currentValue, editableFields } from '../lib/contribution-fields.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMS, formFor, formYaml, BY, type Kind } from '../scripts/contrib/forms.ts';
import { review } from '../scripts/contrib/review.ts';
import { fakeNet, privateAddress, checkUrl, htmlText } from '../scripts/contrib/net.ts';
import { toScore } from '../scripts/contrib/values.ts';
import { preserve } from '../scripts/contrib/jsonfmt.ts';
import { inScope } from '../scripts/contrib/domains.ts';
import type { Repo } from '../scripts/contrib/repo.ts';
import { readFileSync } from 'node:fs';

const repo: Repo = { models: [{ id: 'test-model', name: 'Test model', provider: 'Maker', open_weights: true, category: 'llm', model_repo: 'https://github.com/maker/model' }], results: [], benchmarks: [{ id: 'test-bench', name: 'Test bench', kind: 'acc', url: 'https://example.org/bench' }], icons: [], sources: [{ id: 'study', name: 'Study', match: ['example.org/results'], exact: true, verdict: 'allowed', license: 'CC BY 4.0', kind: 'paper', terms_url: 'https://example.org/terms', checked: '2026-10-05' }] };
const issue = (kind: Kind, fields: Record<string,string>) => ({ labels: [kind], body: formFor(kind).fields.map((f) => `### ${f.label}\n\n${fields[f.id] ?? '_No response_'}\n`).join('\n') });
const paper = () => issue('paper-results', { source: 'https://example.org/results', model:'test-model', benchmark:'test-bench', score:'48.3%', by:BY[0] });

test('all six form types generate explicit review-only proposals', async () => {
  const inputs = [paper(), issue('update-model',{model:'test-model',context:'128',source:'https://github.com/maker/model'}),
    issue('update-model',{model:'test-model',params:'8',source:'https://github.com/maker/model'}),
    issue('new-provider',{model:'test-model',kind:'Local runtime or download',link:'https://github.com/maker/model',platforms:'- [X] Apple Silicon',command:'do-not-execute',quant:'q4',size:'5GB'}),
    issue('missing-model',{model:'New model',links:'https://github.com/maker/new',category:'Text (LLM)',maker:'Maker',weights:'Yes'}),
    issue('new-benchmark',{proposal:'A new benchmark',name:'New test',link:'https://example.org/new',licence:'CC BY',category:'Text (LLM)',scale:'Accuracy or percentage (higher is better)',measures:'Accuracy on held-out questions'})];
  const before = JSON.stringify(repo);
  for (const input of inputs) {
    const r = await review(input, repo); assert.equal(r.status,'needs-review',JSON.stringify(r.problems)); assert.equal(r.changes.length,1);
  }
  assert.equal(JSON.stringify(repo),before);
});
test('score proposals require an approved actual-data licence; duplicates and conflicts are handled', async () => {
  const input = paper(); const r = await review(input,repo,fakeNet({'https://example.org/results':'Test model: 48.3%'}));
  assert.equal((r.changes[0].after as {score:number}).score,0.483); assert.ok(r.evidence[0].sha256);
  const unapproved = await review(input,{...repo,sources:[]}); assert.equal(unapproved.changes.length,0); assert.equal(unapproved.sourceProposals[0].verdict,'unclear');
  const vendor = await review(input,{...repo,sources:[{...repo.sources[0],license:'first-party publication'}]}); assert.equal(vendor.changes.length,0);
  const existing = {...repo,results:[r.changes[0].after as Repo['results'][number]]}; assert.equal((await review(input,existing)).status,'no-change');
  assert.equal((await review({...input,body:input.body.replace('48.3%','49%')},existing)).status,'invalid');
});
test('malformed, unknown, duplicate and oversized input produces no partial changes', async () => {
  const p=paper();
  for(const body of [p.body.replace('48.3%','48.3'),'x'.repeat(20001)]) {
    const r=await review({...p,body},repo);assert.equal(r.status,'invalid');assert.equal(r.changes.length,0);
  }
  const r=await review(issue('update-model',{model:'test-model',params:'8\nparams: 9B',source:'https://example.org'}),repo);assert.equal(r.status,'invalid');
});
test('error ratios retain values above 100%; raw scales are explicit', () => {
  assert.equal(toScore('1.2',{id:'wer',name:'WER',url:'https://example.org/bench',kind:'err'}).score,1.2);
  assert.equal(toScore('120%',{id:'wer',name:'WER',url:'https://example.org/bench',kind:'err'}).score,1.2);
  assert.equal(toScore('4',{id:'mos',name:'MOS',url:'https://example.org/bench',kind:'acc',raw_scale_min:1,raw_scale_max:5}).score,0.75);
  assert.ok(toScore('4',{id:'mos',name:'MOS',url:'https://example.org/bench',kind:'acc'}).error);
});
test('local and mapped addresses, credential URLs and lookalike owners are rejected', () => {
  for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','192.168.1.1','::1','::ffff:127.0.0.1','::ffff:7f00:1','fc00::1','2002:7f00:1::'])assert.equal(privateAddress(ip),true,ip);
  assert.equal(privateAddress('8.8.8.8'),false);
  assert.throws(()=>checkUrl('https://user:pass@example.org'));
  assert.throws(()=>checkUrl('file:///etc/passwd'));
  assert.equal(inScope('https://maker.co.uk.evil.org',[{scope:'maker.co.uk',why:'official'}]),undefined);
  assert.equal(inScope('https://other.co.uk',[{scope:'maker.co.uk',why:'official'}]),undefined);
  assert.ok(inScope('https://docs.maker.co.uk',[{scope:'maker.co.uk',why:'official'}]));
  assert.doesNotThrow(()=>htmlText('&#999999999999;'));
});
test('formatting preserves unrelated JSON spellings and generated forms match', () => {
  const input='[\n  {"id":"a","n":35.0},\n  {"id":"b","n":2}\n]\n';
  const output=preserve(input,[{id:'a',n:35},{id:'b',n:3}]);assert.ok(output.includes('35.0'));assert.deepEqual(JSON.parse(output),[{id:'a',n:35},{id:'b',n:3}]);
  for(const f of FORMS)assert.equal(readFileSync(new URL(`../.github/ISSUE_TEMPLATE/${f.kind}.yml`,import.meta.url),'utf8'),formYaml(f));
});

test('CLI emits separate proposals and refuses to overwrite an existing output', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const root = mkdtempSync(join(tmpdir(), 'contrib-test-'));
  try {
    mkdirSync(join(root,'data'));
    for (const [key,value] of Object.entries(repo)) writeFileSync(join(root,'data',key+'.json'),JSON.stringify(value));
    const input=join(root,'issue.json'), output=join(root,'review');
    writeFileSync(input,JSON.stringify(paper()));
    const args=[new URL('../scripts/contrib/cli.ts',import.meta.url).pathname,'--repo',root,'--issue',input,'--out',output];
    const run=spawnSync(process.execPath,args,{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    assert.equal(JSON.parse(readFileSync(join(output,'proposed-data/results.json'),'utf8'))[0].score,0.483);
    assert.deepEqual(JSON.parse(readFileSync(join(root,'data/results.json'),'utf8')),[]);
    assert.match(readFileSync(join(output,'baseline-sha256.json'),'utf8'),/[a-f0-9]{64}/);
    assert.equal(spawnSync(process.execPath,args,{encoding:'utf8'}).status,2);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('duplicate sections and conflicting form labels are rejected', async () => {
  const p=paper();
  assert.equal((await review({...p,body:p.body+'\n### '+formFor('paper-results').fields[0].label+'\n\nhttps://other.org'},repo)).status,'invalid');
  assert.equal((await review({...p,labels:['paper-results','update-model']},repo)).status,'invalid');
});
test('benchmark correction retains digits in exact benchmark ids', async () => {
  const r={...repo,benchmarks:[{...repo.benchmarks[0],id:'aime-2025'}],results:[{model:'test-model',bench:'aime-2025',score:0.4,source:'https://example.org/results',by:'lab' as const}]};
  const result=await review(issue('wrong-number',{model:'test-model',benchmark:'aime-2025',score:'50%',source:'https://example.org/results'}),r);
  assert.equal(result.status,'needs-review');
  assert.equal((result.changes[0].after as {score:number}).score,0.5);
});

test('short reports retain missing facts for review, without guessing', async () => {
  for (const input of [
    issue('paper-results',{model:'test-model',benchmark:'test-bench',score:'48.3%',source:'https://example.org/results'}),
    issue('missing-model',{model:'Another model',links:'https://example.org/model'}),
    issue('new-provider',{model:'test-model',link:'https://example.org/run'}),
    issue('new-benchmark',{name:'A source',link:'https://example.org/results'}),
  ]) {
    const r=await review(input,repo); assert.equal(r.status,'needs-review'); assert.equal(r.changes.length,0); assert.ok(r.submission);
  }
});
test('one form proposes multiple fields, keeps blanks, rejects stale snapshots and requires a reference', async () => {
  const snapshot=editableFields(repo.models[0]).map(k=>MODEL_FIELDS[k]+': '+currentValue(repo.models[0],k)).join('\n');
  const fields={model:'test-model',before:snapshot,name:'New name',params:'8',context:'128',maker:'',source:'https://example.org'};
  assert.equal((await review(issue('update-model',{...fields,before:'stale'}),repo)).status,'invalid');
  assert.equal((await review(issue('update-model',{...fields,source:''}),repo)).status,'invalid');
  const result=await review(issue('update-model',fields),repo);
  assert.equal(result.changes.length,1,JSON.stringify(result.problems));
  const after=result.changes[0].after as Repo['models'][number];
  assert.equal(after.name,'New name');assert.equal(after.params_b,8);assert.equal(after.context_k,128);assert.equal(after.provider,'Maker');
  assert.equal((await review(issue('update-model',{model:'test-model',source:'https://example.org'}),repo)).status,'invalid');
});
