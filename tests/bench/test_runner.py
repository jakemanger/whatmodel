import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('bench', ROOT / 'bench.py')
bench = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench)


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
                load_duration=500_000_000)).encode())
        else:
            for chunk in [
                {'choices':[{'delta':{'content':'PRIVATE OUTPUT'}}]},
                {'choices':[{'delta':{},'finish_reason':'stop'}]},
                {'choices':[],'usage':{'completion_tokens':8}},
            ]:
                self.wfile.write(('data: '+json.dumps(chunk)+'\n\n').encode())
            self.wfile.write(b'data: [DONE]\n\n')


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
        r=bench.run_one(dict(kind='ollama',base=self.base,model='m'),32,1)
        self.assertEqual(r['generation_tok_s'],20)
        self.assertEqual(r['prompt_tok_s'],30)
        self.assertEqual(r['load_s'],0.5)
        self.assertNotIn('PRIVATE',json.dumps(r))
        self.assertEqual(Handler.requests[-1][1]['options']['num_predict'],32)

    def test_stream_metrics_are_e2e_not_decode(self):
        r=bench.run_one(dict(kind='chat',base=self.base,model='m',key=''),32,2)
        self.assertEqual(r['output_tokens'],8)
        self.assertGreater(r['end_to_end_tok_s'],0)
        self.assertNotIn('generation_tok_s',r)
        self.assertNotIn('PRIVATE',json.dumps(r))

    def test_public_report_is_allowlisted_and_distinguishes_protocols(self):
        raw=[dict(public_id='public-model',kind='llama-bench',path='/private/user',
                  key='SECRET',samples=[dict(elapsed_s=1,generation_tok_s=12,output='SECRET',ttft_s=float('nan'))])]
        r=bench.public_report(raw,32,dict(os='username',arch='/private/path',ram_gb=16,hostname='SECRET'))
        self.assertNotIn('SECRET',json.dumps(r))
        self.assertNotIn('/private',json.dumps(r))
        self.assertEqual(r['hardware']['os'],'Other')
        self.assertEqual(r['results'][0]['protocol'],'synthetic-pp512-tg')
        self.assertNotIn('ttft_s',r['results'][0]['samples'][0])
        raw[0]['public_id']='https://private.example'
        with self.assertRaises(ValueError): bench.public_report(raw,32,{})

    def test_urls_and_launcher_hash(self):
        for url in ['http://remote.example/v1','https://user:secret@example.com','file:///tmp/file','https://example.org?key=secret']:
            with self.assertRaises(ValueError): bench.endpoint(url)
        self.assertEqual(bench.endpoint(self.base),self.base)
        with self.assertRaises(ValueError): bench.NoRedirect().redirect_request(None,None,None,None,None,None)
        digest=hashlib.sha256((ROOT/'bench.py').read_bytes()).hexdigest()
        self.assertIn("expected = '"+digest+"'",(ROOT/'bench.sh').read_text())

    def test_issue_size_and_agent_restrictions(self):
        self.assertIsNotNone(bench.issue_url({'results':[]}))
        self.assertIsNone(bench.issue_url({'results':['x'*8000]}))
        args=bench.agent_args('claude',bench.PROMPT)
        self.assertEqual(args[args.index('--tools')+1],'')
        self.assertIn('--strict-mcp-config',args)
        self.assertIn('--ignore-user-config',bench.agent_args('codex',bench.PROMPT))

    def test_declining_plan_runs_nothing(self):
        target=dict(kind='ollama',label='model',model='m',base=self.base)
        with patch.object(bench.sys,'argv',['bench']), patch.object(bench.sys.stdin,'isatty',return_value=True), \
             patch.object(bench,'discover',return_value=([target],[])), patch.object(bench,'choose',return_value=[target]), \
             patch.object(bench,'ask',side_effect=['','1','32']), patch.object(bench,'yes',return_value=False), \
             patch.object(bench,'timed') as run, patch.object(bench.webbrowser,'open') as browser, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(bench.main(),0)
            run.assert_not_called()
            browser.assert_not_called()

    def test_cancel_stops_remaining_targets(self):
        target=dict(kind='ollama',label='model',model='m',base=self.base)
        with patch.object(bench.sys,'argv',['bench']), patch.object(bench.sys.stdin,'isatty',return_value=True), \
             patch.object(bench,'discover',return_value=([target,target],[])), patch.object(bench,'choose',return_value=[target,target]), \
             patch.object(bench,'ask',side_effect=['','3','32']), patch.object(bench,'yes',return_value=True), \
             patch.object(bench,'timed',side_effect=KeyboardInterrupt) as run, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(bench.main(),0)
            self.assertEqual(run.call_count,1)

    def test_reviewed_report_can_stay_local_without_opening_browser(self):
        import tempfile
        target=dict(kind='ollama',label='private alias',model='m',base=self.base)
        measured=dict(kind='ollama',label='private alias',samples=[dict(elapsed_s=1)])
        with tempfile.TemporaryDirectory() as directory:
            destination=Path(directory)/'report.json'
            def create(**kwargs):
                return os.open(destination,os.O_CREAT|os.O_WRONLY,0o600),str(destination)
            with patch.object(bench.sys,'argv',['bench']), patch.object(bench.sys.stdin,'isatty',return_value=True), \
                 patch.object(bench,'discover',return_value=([target],[])), patch.object(bench,'choose',side_effect=[[target],[measured]]), \
                 patch.object(bench,'ask',side_effect=['','1','32','public-model']), patch.object(bench,'yes',side_effect=[True,False]), \
                 patch.object(bench,'timed',return_value={'elapsed_s':1}), patch.object(bench,'hardware',return_value={}), \
                 patch.object(bench.tempfile,'mkstemp',side_effect=create), patch.object(bench.webbrowser,'open') as browser, \
                 contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(bench.main(),0)
                browser.assert_not_called()
            self.assertNotIn('private alias',destination.read_text())
            self.assertEqual(destination.stat().st_mode & 0o777,0o600)

    def test_subprocess_failure_does_not_disclose_stderr(self):
        import sys, tempfile
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(RuntimeError) as e:
                bench.run_process([sys.executable,'-c','import sys;sys.stderr.write("SECRET");sys.exit(1)'],directory)
            self.assertNotIn('SECRET',str(e.exception))


if __name__=='__main__':
    unittest.main()
