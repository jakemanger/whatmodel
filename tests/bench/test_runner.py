import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('bench', ROOT / 'bench.py')
bench = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench)
bench.PAUSE_S = (0, 0)  # no real pauses in tests; the schedule test patches its own range


class Handler(BaseHTTPRequestHandler):
    requests = []
    def log_message(self, *args):
        pass
    def do_POST(self):
        payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        self.requests.append((self.path, payload))
        self.send_response(200)
        self.end_headers()
        if self.path == '/api/generate':
            self.wfile.write(json.dumps(dict(done=True, response='PRIVATE OUTPUT', eval_count=40,
                eval_duration=2_000_000_000, prompt_eval_count=30, prompt_eval_duration=1_000_000_000,
                load_duration=500_000_000, total_duration=3_600_000_000)).encode())
        else:
            for chunk in [
                {'choices':[{'delta':{'content':'PRIVATE OUTPUT'}}]},
                {'choices':[{'delta':{},'finish_reason':'stop'}]},
                {'choices':[],'usage':{'completion_tokens':8}},
            ]:
                self.wfile.write(('data: '+json.dumps(chunk)+'\n\n').encode())
            self.wfile.write(b'data: [DONE]\n\n')


@contextlib.contextmanager
def fake_tool(name, script):
    """Put an executable stand-in for an agent CLI first on PATH."""
    with tempfile.TemporaryDirectory() as d:
        path = Path(d) / name
        path.write_text('#!/bin/sh\n' + script)
        path.chmod(path.stat().st_mode | stat.S_IEXEC)
        with patch.dict(os.environ, {'PATH': d + os.pathsep + os.environ['PATH']}):
            yield


class Probe:
    def __init__(self, targets=(), **extra):
        self.targets, self.extra, self.state = list(targets), extra, 'found'


def found(targets):
    return {'hardware': Probe(hardware={}), 'ollama': Probe(targets, installed=True), 'llamacpp': Probe(installed=True)}


class RunnerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:'+str(cls.server.server_port)
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_ollama_decode_metrics_and_prompt(self):
        r=bench.run_ollama(dict(kind='ollama',base=self.base,model='m'),32,1)
        self.assertEqual(r['gen_tok_s'],20)
        self.assertEqual(r['prompt_tok_s'],30)
        self.assertEqual(r['load_s'],0.5)
        self.assertNotIn('PRIVATE',json.dumps(r))
        self.assertEqual(Handler.requests[-1][1]['options']['num_predict'],32)

    def test_stream_metrics_separate_first_token_from_generation(self):
        r=bench.run_openai(dict(kind='openai',base=self.base,model='m',key=''),32,2)
        self.assertEqual(r['output_tokens'],8)
        self.assertIsNotNone(r['ttft_s'])
        self.assertNotIn('PRIVATE',json.dumps(r))

    def test_claude_runs_without_tools_or_settings_and_is_capped(self):
        args=bench.claude_args(bench.AGENT_PROMPT)
        self.assertEqual(args[args.index('--tools')+1],'')
        self.assertIn('--strict-mcp-config',args)
        self.assertIn('--no-session-persistence',args)
        self.assertEqual(float(args[args.index('--max-budget-usd')+1]),bench.CLAUDE_USD_PER_CALL)
        payload=dict(type='result',is_error=False,duration_ms=4000,duration_api_ms=3500,ttft_ms=1500,total_cost_usd=0.02,
                     usage=dict(output_tokens=200),modelUsage={'claude-opus-5-5':{}},result='PRIVATE OUTPUT')
        with fake_tool('claude',"echo '"+json.dumps(payload)+"'\n"):
            r=bench.run_claude({},32,1)
        self.assertEqual(r['gen_tok_s'],100.0)
        self.assertEqual(r['ttft_s'],1.5)
        self.assertEqual(r['_model'],'claude-opus-5-5')
        self.assertNotIn('PRIVATE',json.dumps(r))

    def test_codex_reads_usage_from_its_event_stream(self):
        lines=[{'type':'thread.started','thread_id':'x'},{'type':'item.completed','item':{'text':'PRIVATE'}},
               {'type':'turn.completed','usage':{'input_tokens':9000,'output_tokens':150,'reasoning_output_tokens':50}}]
        with fake_tool('codex',''.join("echo '"+json.dumps(l)+"'\n" for l in lines)):
            r=bench.run_codex({},32,1)
        self.assertEqual((r['output_tokens'],r['reasoning_tokens']),(150,50))
        self.assertGreater(r['e2e_tok_s'],0)
        self.assertNotIn('PRIVATE',json.dumps(r))

    def test_failed_tools_raise_without_their_output(self):
        with fake_tool('claude','echo SECRET >&2; echo \'{"type":"result","is_error":true,"result":"SECRET"}\'; exit 1\n'):
            with self.assertRaises(RuntimeError) as e:
                bench.run_claude({},32,1)
        self.assertNotIn('SECRET',str(e.exception))
        with fake_tool('codex','echo \'{"type":"turn.failed","error":"SECRET"}\'\n'):
            with self.assertRaises(RuntimeError) as e:
                bench.run_codex({},32,1)
        self.assertNotIn('SECRET',str(e.exception))

    def test_other_agents_report_the_largest_cumulative_token_count(self):
        text='\n'.join(json.dumps(x) for x in [{'usage':{'output_tokens':40}},{'stats':{'tokens':{'output_tokens':120}}}])
        self.assertEqual(bench.most_tokens(text),120)
        self.assertIsNone(bench.most_tokens('not json'))

    def test_schedule_warms_up_first_then_shuffles_each_round_with_random_pauses(self):
        ts=[dict(label=str(i)) for i in range(4)]
        with patch.object(bench,'PAUSE_S',(1.0,3.0)):
            order=bench.schedule(ts,3,1,seed=7)
            self.assertEqual(order,bench.schedule(ts,3,1,seed=7))  # replayable from the seed
        self.assertEqual([n for _,n,_ in order[:4]],[0,0,0,0])
        for r in range(3):
            chunk=order[4+4*r:8+4*r]
            self.assertEqual(sorted(t['label'] for t,_,_ in chunk),['0','1','2','3'])
            self.assertTrue(all(n==r+1 for _,n,_ in chunk))
        pauses=[p for _,_,p in order]
        self.assertTrue(all(1.0<=p<=3.0 for p in pauses) and len(set(pauses))>1)

    def test_results_are_matched_to_catalogue_names_with_confirmation(self):
        catalogue=[dict(id='qwen3-0-6b',name='Qwen3 0.6B'),dict(id='qwen3-8b',name='Qwen3 8B'),dict(id='qwen3-8b-base',name='Qwen3 8B (base)'),
                   dict(id='m',name='MLX one',local=dict(variants=[dict(cmd='mlx_lm.chat --model mlx-community/Qwen3-0.6B-4bit')]))]
        self.assertEqual(bench.suggest_id(dict(kind='openai',model='qwen3-0.6b'),catalogue,'qwen3-0.6b'),'qwen3-0-6b')  # LM Studio's key
        self.assertEqual(bench.suggest_id(dict(kind='mlx',model='mlx-community/Qwen3-0.6B-4bit'),catalogue,'mlx-community/Qwen3-0.6B-4bit'),'m')
        other=[dict(id='qwen3-0-6b',name='Qwen3 0.6B')]  # a different MLX build of the same model is listed
        self.assertEqual(bench.suggest_id(dict(kind='mlx',model='mlx-community/Qwen3-0.6B-4bit'),other,'mlx-community/Qwen3-0.6B-4bit'),'qwen3-0-6b')
        self.assertEqual([m['id'] for m in bench.search_catalogue('qwen3 8b',catalogue)],['qwen3-8b','qwen3-8b-base'])
        out=io.StringIO()
        with contextlib.redirect_stdout(out):
            with patch.object(bench,'ask',side_effect=['']) as asked:
                self.assertEqual(bench.pick_model('x',catalogue,'qwen3-0-6b'),'qwen3-0-6b')
                self.assertIn('Qwen3 0.6B',asked.call_args.args[0])  # the question names the model, not an id
            with patch.object(bench,'ask',side_effect=['-']): self.assertIsNone(bench.pick_model('x',catalogue,'qwen3-0-6b'))
            with patch.object(bench,'ask',side_effect=['qwen3 8b','2','']): self.assertEqual(bench.pick_model('x',catalogue,None),'qwen3-8b-base')
            with patch.object(bench,'ask',side_effect=['']): self.assertIsNone(bench.pick_model('x',catalogue,None))
        self.assertIn('2. Qwen3 8B (base)',out.getvalue())

    def test_installs_run_only_after_a_yes(self):
        missing=[dict(name='llama.cpp',why='',cmd=bench.INSTALL['llama.cpp'],url=None),dict(name='LM Studio',why='',cmd=None,url='https://lmstudio.ai/download')]
        for answer,expected in ((False,[]),(True,[['/bin/sh','-c',bench.INSTALL['llama.cpp']]])):
            with patch.object(bench,'ask',return_value='1 2'), patch.object(bench,'yes',return_value=answer), \
                 patch.object(bench.subprocess,'run') as run, patch.object(bench.webbrowser,'open') as browser, \
                 contextlib.redirect_stdout(io.StringIO()):
                run.return_value.returncode=0
                bench.offer_installs(missing)
                self.assertEqual([c.args[0] for c in run.call_args_list],expected)
                self.assertEqual(browser.call_count,1 if answer else 0)  # a download page opens only after a yes too

    def test_mlx_reads_the_benchmark_averages(self):
        out='Running warmup..\nTrial 1:  prompt_tps=1504.990, generation_tps=214.803, peak_memory=0.484\nAverages: prompt_tps=1647.454, generation_tps=211.096, peak_memory=0.515\n'
        with patch.object(bench,'run_process',return_value=(0,out)) as proc:
            self.assertEqual(bench.run_mlx(dict(path='/m'),64,1),{'gen_tok_s':211.1,'prompt_tok_s':1647.45})
        self.assertEqual(proc.call_args.args[0][:3],['mlx_lm.benchmark','--model','/m'])
        with patch.object(bench,'run_process',return_value=(0,'no numbers')), self.assertRaises(ValueError):
            bench.run_mlx(dict(path='/m'),64,1)

    def test_subscription_tools_stop_at_the_token_cap(self):
        t=dict(kind='fake',group='subscription',label='agent')
        calls=[]
        def runner(target,tokens,n):
            calls.append(n); return {'output_tokens':bench.AGENT_TOKEN_CAP}
        with patch.dict(bench.RUNNERS,{'fake':runner}), contextlib.redirect_stdout(io.StringIO()):
            jobs=bench.run_all([t],3,1,32,seed=1)
        self.assertEqual(calls,[0])
        self.assertEqual(jobs[0].state,'skipped')

    def test_ctrl_c_keeps_finished_results(self):
        t=dict(kind='fake',group='local',label='model')
        n_calls=[]
        def runner(target,tokens,n):
            n_calls.append(n)
            if len(n_calls)==3: raise KeyboardInterrupt
            return {'gen_tok_s':10}
        with patch.dict(bench.RUNNERS,{'fake':runner}), contextlib.redirect_stdout(io.StringIO()):
            jobs=bench.run_all([t],3,1,32,seed=1)
        self.assertEqual(len(jobs[0].samples),1)
        self.assertEqual(jobs[0].note,'stopped early')

    def test_public_report_is_allowlisted(self):
        t=dict(kind='llama-bench',group='local',label='private alias',path='/Users/SECRET/models/Qwen3-8B-Q4_K_M.gguf',key='SECRET')
        job=bench.Run(t,1,1); job.samples=[dict(gen_tok_s=12,output='SECRET',ttft_s=float('nan'),prompt_tok_s=300)]
        r=bench.public_report([job],32,1,1,5,dict(os='Darwin',arch='arm64',ram_gb=16,hostname='SECRET',user='SECRET'),{id(t):'qwen3-8b'})
        text=json.dumps(r)
        self.assertNotIn('SECRET',text)
        self.assertNotIn('private alias',text)
        self.assertEqual(r['results'][0]['file'],'Qwen3-8B-Q4_K_M.gguf')
        self.assertNotIn('ttft_s',r['results'][0]['samples'][0])
        self.assertEqual(r['schema'],'whatmodel-bench-v3')
        with self.assertRaises(ValueError):
            bench.public_report([job],32,1,1,5,{},{id(t):'https://private.example'})

    def test_catalogue_ids_come_from_recorded_commands_and_model_names(self):
        catalogue=[{'id':'qwen-2-5-3b','local':{'variants':[{'cmd':'ollama run qwen2.5:3b'}]}},
                   {'id':'glm-5-3','local':{'variants':[{'cmd':'llama-server -hf unsloth/GLM-5.3-GGUF:UD-Q4_K_XL'}]}},
                   {'id':'claude-opus-5-5'}]
        self.assertEqual(bench.suggest_id(dict(kind='ollama',model='qwen2.5:3b'),catalogue),'qwen-2-5-3b')
        self.assertEqual(bench.suggest_id(dict(kind='llama-bench',path='/x/unsloth_GLM-5.3-GGUF_UD-Q4_K_XL-00001-of-00009.gguf'),catalogue),'glm-5-3')
        self.assertEqual(bench.suggest_id(dict(kind='claude'),catalogue,'claude-opus-5-5'),'claude-opus-5-5')
        self.assertIsNone(bench.suggest_id(dict(kind='ollama',model='unknown:1b'),catalogue))

    def test_urls_and_launcher_hash(self):
        for url in ['http://remote.example/v1','https://user:secret@example.com','file:///tmp/file','https://example.org?key=secret']:
            with self.assertRaises(ValueError): bench.endpoint(url)
        self.assertEqual(bench.endpoint(self.base),self.base)
        with self.assertRaises(ValueError): bench.NoRedirect().redirect_request(None,None,None,None,None,None)
        digest=hashlib.sha256((ROOT/'bench.py').read_bytes()).hexdigest()
        self.assertIn("expected = '"+digest+"'",(ROOT/'bench.sh').read_text())

    def test_declining_the_plan_runs_nothing(self):
        target=dict(kind='ollama',group='local',label='model',model='m',base=self.base)
        with patch.object(bench.sys,'argv',['bench']), patch.object(bench.sys.stdin,'isatty',return_value=True), \
             patch.object(bench,'discover',return_value=found([target])), patch.object(bench,'choose',return_value=[target]), \
             patch.object(bench,'ask',return_value=''), patch.object(bench,'yes',return_value=False), patch.object(bench,'run_all') as run, \
             patch.object(bench,'offer_installs',return_value=False), patch.object(bench,'offer_test_models',return_value=False), \
             patch.object(bench.webbrowser,'open') as browser, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(bench.main(),0)
            run.assert_not_called()
            browser.assert_not_called()

    def test_reviewed_report_can_stay_local_without_opening_browser(self):
        target=dict(kind='ollama',group='local',label='private alias',model='m',base=self.base)
        with tempfile.TemporaryDirectory() as directory:
            destination=Path(directory)/'report.json'
            def create(**kwargs):
                return os.open(destination,os.O_CREAT|os.O_WRONLY,0o600),str(destination)
            with patch.object(bench.sys,'argv',['bench','--runs','1']), patch.object(bench.sys.stdin,'isatty',return_value=True), \
                 patch.object(bench,'discover',return_value=found([target])), patch.object(bench,'choose',return_value=[target]), \
                 patch.object(bench,'ask',side_effect=['public model','']), patch.object(bench,'yes',side_effect=[True,True,False]), \
                 patch.object(bench,'load_catalogue',return_value=[dict(id='public-model',name='Public Model'),dict(id='other',name='Other')]), \
                 patch.object(bench,'offer_installs',return_value=False), patch.object(bench,'offer_test_models',return_value=False), \
                 patch.object(bench.tempfile,'mkstemp',side_effect=create), patch.object(bench.webbrowser,'open') as browser, \
                 contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(bench.main(),0)
                browser.assert_not_called()
            report=destination.read_text()
            self.assertNotIn('private alias',report)
            self.assertIn('public-model',report)
            self.assertEqual(destination.stat().st_mode & 0o777,0o600)


if __name__=='__main__':
    unittest.main()
