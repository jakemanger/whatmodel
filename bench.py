#!/usr/bin/env python3
"""whatmodel bench v2: local-first terminal speed measurements. Python 3.9+, no packages."""
import argparse
import getpass
import hashlib
import json
import math
import os
import platform
import re
import shutil
import shlex
import signal
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

VERSION = '2.0.0'
PROMPT = ('Write a practical guide to starting a vegetable garden. Explain soil preparation, '
          'watering, planting easy vegetables and managing pests. Use short clear sections. '
          'Do not use tools, files, browsing, or external information. Aim for 300 words.')
LIMIT = 4 * 1024 * 1024
ISSUES = 'https://github.com/jakemanger/whatmodel/issues/new'


def clean(value):
    return re.sub(r'[\x00-\x1f\x7f-\x9f]', '', str(value))[:160]


def ask(message, default=''):
    answer = input(message + (f' [{default}]' if default else '') + ': ').strip()
    return answer or default


def yes(message):
    return ask(message + ' (y/N)').lower() == 'y'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('Redirect refused; use the final API base URL.')


def endpoint(url):
    u = urllib.parse.urlsplit(url)
    local = u.hostname in ('localhost', '127.0.0.1', '::1')
    if u.scheme not in ('http', 'https') or not u.hostname or u.username or u.password or u.query or u.fragment:
        raise ValueError('Use an HTTP(S) base URL without credentials, query or fragment.')
    if u.scheme == 'http' and not local:
        raise ValueError('Remote APIs require HTTPS.')
    return url.rstrip('/')


def request(base, path, payload=None, key='', timeout=10):
    url = endpoint(base) + path
    headers = {'Content-Type': 'application/json'}
    if key:
        headers['Authorization'] = 'Bearer ' + key
    req = urllib.request.Request(url, data=None if payload is None else json.dumps(payload).encode(), headers=headers)
    return urllib.request.build_opener(NoRedirect()).open(req, timeout=timeout)


def read_json(base, path, payload=None, key='', timeout=10):
    with request(base, path, payload, key, timeout) as response:
        raw = response.read(LIMIT + 1)
        if len(raw) > LIMIT:
            raise ValueError('Response too large')
        return json.loads(raw)


def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0 else None


def rate(count, ns):
    return round(count / (ns / 1e9), 3) if number(count) is not None and number(ns) and ns > 0 else None


def hardware():
    # Intentionally do not call hostname, collect serials, or enumerate network interfaces.
    result = {'os': platform.system() if platform.system() in ('Darwin','Linux','Windows') else 'Other',
              'arch': platform.machine() if platform.machine() in ('arm64','aarch64','x86_64','AMD64') else 'Other'}
    try:
        if platform.system() == 'Darwin':
            ram = int(subprocess.check_output(['sysctl','-n','hw.memsize'],timeout=3))
        else:
            ram = os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES')
        result['ram_gb'] = round(ram / 2**30)
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    return result


def discover():
    targets, installed = [], []
    for name in ('ollama','llama-bench','llama-server','lms','mlx_lm.generate','vllm','codex','claude','gemini','aider','opencode'):
        if shutil.which(name):
            installed.append(name)
    # Only conventional loopback ports are probed; no config, credentials or disk model scans.
    for label, base, kind in [('Ollama','http://127.0.0.1:11434','ollama'),
                              ('llama.cpp','http://127.0.0.1:8080/v1','chat'),
                              ('LM Studio','http://127.0.0.1:1234/v1','chat'),
                              ('vLLM / compatible','http://127.0.0.1:8000/v1','chat')]:
        try:
            data = read_json(base, '/api/tags' if kind == 'ollama' else '/models', timeout=1)
            models = data.get('models' if kind == 'ollama' else 'data', [])
            for model in models[:500]:
                name = model.get('name' if kind == 'ollama' else 'id')
                if isinstance(name, str) and name:
                    targets.append({'kind':kind,'label':f'{label} / {clean(name)}','model':name,'base':base,'key':''})
        except Exception:
            pass
    for name in ('codex','claude'):
        if name in installed:
            targets.append({'kind':name,'label':name+' agent / configured default','model':'default'})
    return targets, installed


def choose(items, title='Select tests'):
    if not items:
        return []
    try:
        import curses
    except ImportError:
        curses = None
    if not curses or os.environ.get('TERM') in (None, 'dumb'):
        for i, item in enumerate(items):
            print(f'  {i+1}. {clean(item["label"])}')
        picked = ask(title + ': numbers separated by spaces (blank cancels)')
        return [item for i,item in enumerate(items) if str(i+1) in picked.split()]
    def screen(win):
        chosen, query, cursor = set(), '', 0
        try:
            curses.curs_set(0)
        except curses.error:
            pass
        win.keypad(True)
        while True:
            visible = [i for i,x in enumerate(items) if query.lower() in x['label'].lower()]
            cursor = max(0,min(cursor,len(visible)-1))
            h,w = win.getmaxyx()
            win.erase()
            def line(y,text,attr=0):
                if 0 <= y < h-1:
                    try:
                        win.addnstr(y,0,text,max(1,w-1),attr)
                    except curses.error:
                        pass
            line(0,'whatmodel bench — '+title,curses.A_BOLD)
            line(1,'Type to search · ↑/↓ move · Space tick · Enter confirm · Esc cancel')
            line(2,f'Search: {query}    Selected: {len(chosen)}')
            capacity=max(1,h-5); start=max(0,cursor-capacity+1)
            for row,i in enumerate(visible[start:start+capacity],4):
                line(row,('[x] ' if i in chosen else '[ ] ')+clean(items[i]['label']),curses.A_REVERSE if i==visible[cursor] else 0)
            win.refresh()
            key=win.get_wch()
            if key in ('\n','\r',curses.KEY_ENTER):
                return [items[i] for i in sorted(chosen)]
            if key == '\x1b':
                return []
            if key == curses.KEY_UP: cursor-=1
            elif key == curses.KEY_DOWN: cursor=min(cursor+1,len(visible)-1)
            elif key == ' ' and visible:
                i=visible[cursor]
                chosen.remove(i) if i in chosen else chosen.add(i)
            elif key in ('\b','\x7f',curses.KEY_BACKSPACE): query=query[:-1];cursor=0
            elif isinstance(key,str) and key.isprintable(): query+=key;cursor=0
    return curses.wrapper(screen)


def add_api():
    base=endpoint(ask('API base URL, including /v1 if needed'))
    print('The base URL and key stay local. This request lists models at the endpoint you chose.')
    key=getpass.getpass('API key (hidden; blank for none): ')
    data=read_json(base,'/models',key=key)
    return [{'kind':'chat','label':'Custom API / '+clean(m['id']),'model':m['id'],'base':base,'key':key}
            for m in data.get('data',[])[:500] if isinstance(m.get('id'),str)]


def run_process(args, cwd, timeout=240):
    # Never shell=True. The child receives no project input. Raw output uses temporary files.
    with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
        proc=subprocess.Popen(args,cwd=cwd,stdin=subprocess.DEVNULL,stdout=stdout,stderr=stderr,start_new_session=True)
        try:
            code=proc.wait(timeout=timeout)
        except BaseException:
            os.killpg(proc.pid,signal.SIGTERM)
            try: proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid,signal.SIGKILL);proc.wait()
            raise
        if code:
            raise RuntimeError('Runner failed; raw logs are intentionally not included in reports.')
        stdout.seek(0); data=stdout.read(LIMIT+1)
        if len(data)>LIMIT: raise ValueError('Runner output too large')
        return data.decode('utf-8','replace')


def agent_args(kind, prompt):
    if kind=='claude':
        return ['claude','-p',prompt,'--output-format','json','--tools','',
                '--strict-mcp-config','--mcp-config','{"mcpServers":{}}',
                '--settings','{"disableAllHooks":true}','--setting-sources','', '--no-session-persistence']
    return ['codex','exec','--ignore-user-config','--ephemeral','--skip-git-repo-check',
            '--sandbox','read-only','--json','-c','features.shell_tool=false',prompt]


def run_one(target, tokens, repetition):
    prompt=f'Run {repetition}. '+PROMPT
    start=time.monotonic(); kind=target['kind']
    if kind=='ollama':
        data=read_json(target['base'],'/api/generate',{'model':target['model'],'prompt':prompt,'stream':False,
            'options':{'temperature':0,'seed':repetition,'num_predict':tokens}},timeout=240)
        if data.get('error') or not data.get('done'):
            raise ValueError('Generation did not finish')
        return {'elapsed_s':round(time.monotonic()-start,3),'output_tokens':number(data.get('eval_count')),
                'generation_tok_s':rate(data.get('eval_count'),data.get('eval_duration')),
                'prompt_tok_s':rate(data.get('prompt_eval_count'),data.get('prompt_eval_duration')),
                'load_s':round(data.get('load_duration',0)/1e9,3)}
    if kind=='chat':
        first=None; usage={}; size=0; finished=False
        with request(target['base'],'/chat/completions',{'model':target['model'],
                     'messages':[{'role':'user','content':prompt}],'max_tokens':tokens,'stream':True,
                     'stream_options':{'include_usage':True}},target.get('key',''),timeout=60) as response:
            while True:
                line=response.readline(65537);size+=len(line)
                if not line: break
                if size>LIMIT or len(line)>65536 or time.monotonic()-start>240: raise ValueError('Response limit exceeded')
                if not line.startswith(b'data:'): continue
                raw=line[5:].strip()
                if raw==b'[DONE]': finished=True;break
                data=json.loads(raw)
                if data.get('error'): raise ValueError('API error')
                if data.get('usage'): usage=data['usage']
                for choice in data.get('choices',[]):
                    if choice.get('delta',{}).get('content') and first is None: first=time.monotonic()-start
                    if choice.get('finish_reason'): finished=True
        if not finished or first is None: raise ValueError('Incomplete text stream')
        elapsed=time.monotonic()-start;count=number(usage.get('completion_tokens'))
        # E2E tokens/s includes provider queue/prefill; it is not decode-only throughput.
        return {'elapsed_s':round(elapsed,3),'ttft_s':round(first,3),'output_tokens':count,
                'end_to_end_tok_s':round(count/elapsed,3) if count is not None else None}
    with tempfile.TemporaryDirectory(prefix='whatmodel-task-') as work:
        if kind=='llama-bench':
            output=run_process(['llama-bench','-m',target['path'],'-p','512','-n',str(tokens),'-r','1','-o','json'],work)
            rows=json.loads(output)
            pp=[r['avg_ts'] for r in rows if r.get('n_prompt',0)>0 and not r.get('n_gen')]
            tg=[r['avg_ts'] for r in rows if r.get('n_gen',0)>0 and not r.get('n_prompt')]
            if not tg: raise ValueError('No generation measurements')
            return {'elapsed_s':round(time.monotonic()-start,3),'generation_tok_s':number(tg[0]),'prompt_tok_s':number(pp[0]) if pp else None}
        output=run_process(agent_args(kind,prompt),work)
        records=[json.loads(output)] if kind=='claude' else [json.loads(x) for x in output.splitlines() if x.strip()]
        success=any((kind=='claude' and x.get('type')=='result' and not x.get('is_error')) or x.get('type')=='turn.completed' for x in records)
        if not success: raise ValueError('Agent task did not complete')
        return {'elapsed_s':round(time.monotonic()-start,3),'completed':True}


def timed(target, tokens, repetition):
    stop=threading.Event();start=time.monotonic()
    def progress():
        while not stop.wait(1):
            print(f'\r    working… {int(time.monotonic()-start)}s',end='',flush=True)
    worker=threading.Thread(target=progress,daemon=True);worker.start()
    try: return run_one(target,tokens,repetition)
    finally:
        stop.set();worker.join();print()


def public_report(results, tokens, hardware_info):
    # Construct a new object from a strict allowlist. Never serialize target objects.
    rows=[]
    for result in results:
        if not result.get('public_id'): continue
        samples=[]
        for sample in result['samples']:
            samples.append({k:v for k,v in sample.items() if k in ('elapsed_s','output_tokens','generation_tok_s','prompt_tok_s','load_s','ttft_s','end_to_end_tok_s','completed') and (isinstance(v,bool) if k=='completed' else v is None or number(v) is not None)})
        if not re.fullmatch(r'[a-z0-9][a-z0-9.-]{0,79}',result['public_id']):
            raise ValueError('Invalid public model id')
        kind=result['kind']
        if kind not in ('ollama','chat','llama-bench','codex','claude'):
            raise ValueError('Unknown runner')
        protocol='synthetic-pp512-tg' if kind=='llama-bench' else 'garden-text-v1'
        rows.append({'model':result['public_id'],'runner':kind,'protocol':protocol,'samples':samples})
    return {'schema':'whatmodel-bench-v2','script_version':VERSION,'protocol':'sequential; cache state uncontrolled; first run retained; no quality score',
            'prompt_sha256':hashlib.sha256(PROMPT.encode()).hexdigest(),'max_output_tokens':tokens,
            'hardware':{**{'os':hardware_info.get('os') if hardware_info.get('os') in ('Darwin','Linux','Windows') else 'Other',
                         'arch':hardware_info.get('arch') if hardware_info.get('arch') in ('arm64','aarch64','x86_64','AMD64') else 'Other'},
                        **({'ram_gb':hardware_info['ram_gb']} if number(hardware_info.get('ram_gb')) is not None else {})},'results':rows}


def issue_url(report):
    body='### Benchmark results\n\n```json\n'+json.dumps(report,separators=(',',':'))+'\n```\n\nI reviewed this report and release these measurements under CC0 1.0.\n'
    url=ISSUES+'?'+urllib.parse.urlencode({'title':'Benchmark measurements','body':body})
    return url if len(url)<7500 else None


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version',action='version',version=VERSION)
    parser.add_argument('--list',action='store_true',help='List detected local options; do not benchmark')
    parser.add_argument('--plain',action='store_true',help='Use numbered menus instead of curses')
    args=parser.parse_args()
    if args.plain: os.environ['TERM']='dumb'
    if not args.list and not sys.stdin.isatty():
        print('An interactive terminal is required. Run through the bench.sh launcher.');return 1
    print('\nwhatmodel bench — discover → select → confirm → measure → review\n')
    targets,installed=discover()
    print('Installed tools: '+(', '.join(installed) or 'none detected'))
    print('Reachable local models: '+str(sum(t['kind'] in ('ollama','chat') for t in targets)))
    if args.list:
        for t in targets: print(clean(t['label']))
        return 0
    print('Other installed agents/runtimes can be tested through a compatible API endpoint. No software or models are installed.')
    while True:
        action=ask('Add [a] API, [g] GGUF file, or [enter] choose tests')
        if not action: break
        try:
            if action=='a': targets.extend(add_api())
            elif action=='g':
                if not shutil.which('llama-bench'): print('Install llama-bench yourself first.');continue
                path=Path(ask('GGUF file path')).expanduser().resolve()
                if not path.is_file() or path.suffix.lower()!='.gguf': print('Choose an existing GGUF file.');continue
                targets.append({'kind':'llama-bench','label':'llama-bench / '+clean(path.name),'path':str(path),'model':path.stem})
        except Exception:
            print('Could not list that endpoint/file. Check the URL, credentials and server; nothing was submitted.')
    selected=choose(targets)
    if not selected: print('No tests selected.');return 0
    runs=ask('Runs per selection (1–5)','3');tokens=ask('Maximum output tokens for model APIs (32–1024)','256')
    if not runs.isdigit() or not 1<=int(runs)<=5 or not tokens.isdigit() or not 32<=int(tokens)<=1024:
        print('Invalid run count or token limit.');return 1
    runs,tokens=int(runs),int(tokens)
    print('\nExact fixed prompt:\n'+PROMPT)
    print(f'\nPlan: {len(selected)} selections × {runs} sequential runs, max {tokens} output tokens per model call.')
    for t in selected:
        print('  '+clean(t['label']))
        print('    '+('POST '+t['base']+('/api/generate' if t['kind']=='ollama' else '/chat/completions') if t['kind'] in ('ollama','chat') else shlex.join(['llama-bench','-m',t['path'],'-p','512','-n',str(tokens),'-r','1','-o','json'] if t['kind']=='llama-bench' else agent_args(t['kind'],'Run 1. '+PROMPT))))
    print('APIs/agents may charge your account. Agent task length is prompt-controlled, not a hard token cap. Ctrl-C cancels.')
    print('Agents use existing login, an empty task directory and restricted invocation; no project files are supplied.')
    print('API tests send the fixed prompt. Agents also send their normal system context through their own CLI. Generated text, keys, URLs and raw errors are excluded from the public report.')
    print('llama-bench uses synthetic tokens; agent elapsed time and API throughput are separate measurements.')
    if not yes('Run this plan'): print('Cancelled.');return 0
    results=[];cancelled=False
    for t in selected:
        samples=[]
        for i in range(1,runs+1):
            print(f'\n{clean(t["label"])} — run {i}/{runs}')
            try:
                sample=timed(t,tokens,i);samples.append(sample)
                print('    '+json.dumps(sample))
            except KeyboardInterrupt:
                print('Stopped; completed measurements can still be reviewed.');cancelled=True;break
            except Exception:
                print('    Failed or timed out. No raw error text will be shared.');break
        if samples: results.append({'kind':t['kind'],'label':t['label'],'samples':samples})
        if cancelled: break
    if not results: print('No successful measurements. Nothing to submit.');return 0
    print('\nChoose which results to share (nothing is selected by default).')
    shared=choose(results,'Results to include')
    for r in shared:
        while True:
            model=ask('Public catalogue model id for '+clean(r['label'])+' (blank omits)')
            if not model or re.fullmatch(r'[a-z0-9][a-z0-9.-]{0,79}',model): break
            print('Use a public model id, not a private alias, username, path or URL.')
        r['public_id']=model
    report=public_report(shared,tokens,hardware())
    if not report['results']: print('No public results selected. Nothing submitted.');return 0
    print('\nEXACT PUBLIC REPORT (no keys, endpoint URLs, hostnames, file paths or generated text):\n')
    print(json.dumps(report,indent=2))
    print('Public model ids above are your labels; check they contain no personal/private information.')
    fd,path=tempfile.mkstemp(prefix='whatmodel-results-',suffix='.json')
    with os.fdopen(fd,'w') as out: json.dump(report,out,indent=2)
    print('Saved locally (owner-only): '+path)
    if not yes('Share this report publicly on GitHub under CC0 1.0'): print('Kept local.');return 0
    url=issue_url(report)
    if not url:
        print('Report is too long for a browser URL. Attach the saved JSON to the issue after reviewing it.')
        url=ISSUES+'?'+urllib.parse.urlencode({'title':'Benchmark measurements','body':'Reviewed benchmark report attached. I release the measurements under CC0 1.0.'})
    print('Please read the GitHub draft, confirm you are happy sharing it, then click Submit new issue. The terminal does not submit it for you.')
    if not webbrowser.open(url): print('Open this link yourself:\n'+url)
    print('Browser draft requested. No issue submission has been confirmed by this script.')
    return 0


if __name__=='__main__':
    try: sys.exit(main())
    except (KeyboardInterrupt,EOFError): print('\nCancelled. No automatic submission.');sys.exit(130)
