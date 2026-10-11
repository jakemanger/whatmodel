#!/usr/bin/env python3
"""whatmodel bench v3: find the models and AI tools on this machine, pick what to test, and
measure their speed with tiny, capped prompts. Python 3.9+, standard library only."""
import argparse
import hashlib
import json
import math
import os
import platform
import random
import re
import shutil
import signal
import statistics
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

VERSION = '3.0.0'
PROMPT = ('Write a practical guide to starting a vegetable garden. Explain soil preparation, '
          'watering, planting easy vegetables and managing pests. Use short clear sections. '
          'Do not use tools, files, browsing, or external information. Aim for 300 words.')
# Agent CLIs answer a shorter request, so each measured call stays small on your subscription.
AGENT_PROMPT = ('Without using any tools, files or browsing, write about 120 words of practical '
                'advice on starting a small vegetable garden. Plain text only.')
LIMIT = 4 * 1024 * 1024
ISSUES = 'https://github.com/jakemanger/whatmodel/issues/new'
CATALOGUE_URL = 'https://whatmodel.sh/data/models.json'
CALL_TIMEOUT = 180
# Per-tool caps for subscription and API tools: a run stops early once either is reached.
AGENT_TOKEN_CAP = 4000
CLAUDE_USD_PER_CALL = 0.10
# llama.cpp moved its default server port to 9931 in October 2026; 8080 is older builds and MLX-LM.
LOCAL_PORTS = [('llama.cpp server', 9931), ('llama.cpp / MLX-LM', 8080), ('LM Studio', 1234), ('vLLM / SGLang', 8000),
               ('SGLang', 30000), ('Jan', 1337), ('Jan', 6767)]
INSTALL = {
    'Ollama': 'curl -fsSL https://ollama.com/install.sh | sh',
    'llama.cpp': 'curl -LsSf https://llama.app/install.sh | sh',
    'Claude Code': 'curl -fsSL https://claude.ai/install.sh | bash',
    'Codex CLI': 'npm install -g @openai/codex',
    'Gemini CLI': 'npm install -g @google/gemini-cli',
    'Kimi Code': 'curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash',
}
PLAIN = False


# ---------------------------------------------------------------- terminal helpers

def clean(value, limit=160):
    return re.sub(r'[\x00-\x1f\x7f-\x9f]', '', str(value))[:limit]


def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0 else None


def rate(count, ns):
    return round(count / (ns / 1e9), 2) if number(count) is not None and number(ns) and ns > 0 else None


COLOR = sys.stdout.isatty() and not os.environ.get('NO_COLOR')
ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')


def c(code, text):
    return f'\x1b[{code}m{text}\x1b[0m' if COLOR else text


def dim(t): return c('2', t)
def bold(t): return c('1', t)
def green(t): return c('32', t)
def yellow(t): return c('33', t)
def red(t): return c('31', t)
def cyan(t): return c('36', t)


def visible(text):
    return len(ANSI.sub('', text))


def fit(text, width):
    """Truncate to the terminal width without cutting an escape sequence (wrapping breaks redraws)."""
    if visible(text) <= width:
        return text
    out, n, i = [], 0, 0
    while i < len(text) and n < width - 1:
        m = ANSI.match(text, i)
        if m:
            out.append(m.group()); i = m.end(); continue
        out.append(text[i]); n += 1; i += 1
    return ''.join(out) + '…' + ('\x1b[0m' if COLOR else '')


SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'


def spinner():
    return cyan(SPIN[int(time.monotonic() * 10) % len(SPIN)])


class Live:
    """Redraws a block of lines in place, like docker pull. Falls back to printing changes."""
    def __init__(self, render):
        self.render, self.lines, self.lock = render, 0, threading.Lock()
        self.live = sys.stdout.isatty() and not PLAIN
        self.stop, self.last = threading.Event(), []
        self.thread = threading.Thread(target=self.loop, daemon=True)

    def __enter__(self):
        if self.live:
            sys.stdout.write('\x1b[?25l')
        self.thread.start()
        return self

    def __exit__(self, *exc):
        self.stop.set(); self.thread.join(); self.draw()
        if self.live:
            sys.stdout.write('\x1b[?25h'); sys.stdout.flush()

    def loop(self):
        while not self.stop.wait(0.1):
            self.draw()

    def draw(self):
        with self.lock:
            rows = self.render()
            if not self.live:
                # Print each row once it settles; rows still spinning would print every frame.
                for r in rows:
                    plain = ANSI.sub('', r)
                    if plain not in self.last and not any(ch in plain for ch in SPIN) and 'looking…' not in plain:
                        print(plain, flush=True); self.last.append(plain)
                return
            width = max(20, shutil.get_terminal_size((100, 24)).columns)
            buf = [f'\x1b[{self.lines}F'] if self.lines else []
            buf += ['\x1b[2K' + fit(r, width) + '\n' for r in rows]
            extra = self.lines - len(rows)
            if extra > 0:
                buf += ['\x1b[2K\n'] * extra + [f'\x1b[{extra}F']
            sys.stdout.write(''.join(buf)); sys.stdout.flush()
            self.lines = len(rows)


def ask(message, default=''):
    answer = input(message + (f' [{default}]' if default else '') + ': ').strip()
    return answer or default


def yes(message, default=False):
    answer = ask(message + (' (Y/n)' if default else ' (y/N)')).lower()
    return default if not answer else answer.startswith('y')


def read_key():
    """One key press from a raw terminal: 'up', 'down', 'space', 'enter', 'esc' or a character."""
    import termios
    import tty
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = os.read(fd, 1)
        if ch == b'\x1b':
            seq = os.read(fd, 2) if select_ready(fd) else b''
            return {b'[A': 'up', b'[B': 'down'}.get(seq, 'esc')
        if ch in (b'\r', b'\n'): return 'enter'
        if ch == b' ': return 'space'
        if ch == b'\x03': raise KeyboardInterrupt
        return ch.decode('utf-8', 'ignore')
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def select_ready(fd):
    import select
    return bool(select.select([fd], [], [], 0.05)[0])


# ---------------------------------------------------------------- HTTP and processes

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
    headers = {'Content-Type': 'application/json'}
    if key:
        headers['Authorization'] = 'Bearer ' + key
    req = urllib.request.Request(endpoint(base) + path, data=None if payload is None else json.dumps(payload).encode(), headers=headers)
    return urllib.request.build_opener(NoRedirect()).open(req, timeout=timeout)


def read_json(base, path, payload=None, key='', timeout=10):
    with request(base, path, payload, key, timeout) as response:
        raw = response.read(LIMIT + 1)
        if len(raw) > LIMIT:
            raise ValueError('Response too large')
        return json.loads(raw)


def output(args, timeout=5, stderr=False):
    """A short command's stdout (plus stderr if asked), or '' if it isn't there or fails. Never shell=True."""
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=timeout, stdin=subprocess.DEVNULL)
        return (r.stdout + (r.stderr if stderr else '')).strip()
    except (OSError, subprocess.SubprocessError):
        return ''


def run_process(args, cwd, timeout=CALL_TIMEOUT):
    """Run a tool in an empty folder with no input, killing its whole process group on timeout or Ctrl-C."""
    with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
        proc = subprocess.Popen(args, cwd=cwd, stdin=subprocess.DEVNULL, stdout=out, stderr=err, start_new_session=True)
        try:
            code = proc.wait(timeout=timeout)
        except BaseException:
            try:
                os.killpg(proc.pid, signal.SIGTERM); proc.wait(timeout=3)
            except (OSError, subprocess.TimeoutExpired):
                try: os.killpg(proc.pid, signal.SIGKILL)
                except OSError: pass
                proc.wait()
            raise
        out.seek(0); data = out.read(LIMIT + 1)
        if len(data) > LIMIT:
            raise ValueError('Tool output too large')
        return code, data.decode('utf-8', 'replace')


# ---------------------------------------------------------------- discovery

def hardware():
    # Model names only: no hostname, serial numbers, user names or network details.
    info = {'os': platform.system() if platform.system() in ('Darwin', 'Linux', 'Windows') else 'Other',
            'arch': platform.machine() if platform.machine() in ('arm64', 'aarch64', 'x86_64', 'AMD64') else 'Other'}
    try:
        if info['os'] == 'Darwin':
            info['ram_gb'] = round(int(output(['sysctl', '-n', 'hw.memsize'])) / 2**30)
            info['chip'] = clean(output(['sysctl', '-n', 'machdep.cpu.brand_string']), 60) or None
            cores = re.search(r'Total Number of Cores:\s*(\d+)', output(['system_profiler', 'SPDisplaysDataType'], 15))
            if cores: info['gpu_cores'] = int(cores.group(1))
        elif info['os'] == 'Linux':
            info['ram_gb'] = round(os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES') / 2**30)
            cpu = re.search(r'model name\s*:\s*(.+)', Path('/proc/cpuinfo').read_text(errors='ignore'))
            if cpu: info['chip'] = clean(cpu.group(1), 60)
        gpus = output(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader,nounits'])
        if gpus:
            name, mem = gpus.splitlines()[0].rsplit(',', 1)
            info['gpu'] = clean(name.strip(), 60); info['vram_gb'] = round(int(mem) / 1024)
            info['gpus'] = len(gpus.splitlines())
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    return {k: v for k, v in info.items() if v not in (None, '')}


def describe_hardware(h):
    bits = [h.get('chip') or h.get('arch'), f"{h['ram_gb']} GB RAM" if h.get('ram_gb') else None,
            f"{h['gpu_cores']} GPU cores" if h.get('gpu_cores') else None,
            f"{h['gpu']} {h.get('vram_gb', '?')} GB" if h.get('gpu') else None]
    return ' · '.join(b for b in bits if b)


def gib(n):
    return f'{n / 2**30:.1f} GB' if number(n) else ''


class Probe:
    """One discovery check shown as a row: waiting → running (spinner) → found / missing / note."""
    def __init__(self, key, label, fn):
        self.key, self.label, self.fn = key, label, fn
        self.state, self.detail, self.targets, self.extra = 'running', '', [], {}

    def run(self):
        try:
            self.fn(self)
            if self.state == 'running':
                self.state = 'found' if self.targets else 'missing'
        except Exception as e:  # a failed probe must never stop discovery
            self.state, self.detail = 'note', 'check failed: ' + clean(type(e).__name__)

    def row(self):
        mark = {'running': spinner(), 'found': green('✓'), 'missing': dim('–'), 'note': yellow('!')}[self.state]
        text = self.detail or ('looking…' if self.state == 'running' else '')
        return f'  {mark} {self.label:<16} {dim(text) if self.state == "missing" else text}'


def target(kind, group, label, **extra):
    return {'kind': kind, 'group': group, 'label': label, **extra}


def probe_hardware(p):
    p.extra['hardware'] = h = hardware()
    p.detail, p.state = describe_hardware(h), 'found'


def probe_ollama(p):
    p.extra['installed'] = bool(shutil.which('ollama'))
    try:
        models = read_json('http://127.0.0.1:11434', '/api/tags', timeout=1.5).get('models', [])
    except Exception:
        models = None
    if models is None:
        p.state = 'note' if p.extra['installed'] else 'missing'
        p.detail = 'installed · not running (can be started for this session)' if p.extra['installed'] else 'not installed'
        return
    version = ''
    try:
        version = read_json('http://127.0.0.1:11434', '/api/version', timeout=1.5).get('version', '')
    except Exception:
        pass
    for m in models[:500]:
        name = m.get('name')
        if not isinstance(name, str) or not name:
            continue
        d = m.get('details') or {}
        p.targets.append(target('ollama', 'local', f'Ollama · {clean(name, 60)}', model=name, base='http://127.0.0.1:11434',
                                size=number(m.get('size')), quant=clean(d.get('quantization_level', ''), 20) or None,
                                params=clean(d.get('parameter_size', ''), 12) or None, engine_version=clean(version, 40) or None,
                                digest=m.get('digest') if re.fullmatch(r'[a-f0-9]{64}', str(m.get('digest', ''))) else None,
                                detail=' · '.join(x for x in (d.get('parameter_size'), d.get('quantization_level'), gib(m.get('size'))) if x)))
    p.detail = f'{len(p.targets)} model{"s" if len(p.targets) != 1 else ""} · v{version}' if p.targets else 'running · no models pulled'


def gguf_dirs():
    home = Path.home()
    hf_home = os.environ.get('HF_HOME')
    # Current llama.cpp saves `-hf` downloads in the Hugging Face cache.
    dirs = [os.environ.get('LLAMA_CACHE'), home / 'Library/Caches/llama.cpp', home / '.cache/llama.cpp',
            home / '.lmstudio/models', home / '.cache/lm-studio/models',
            os.environ.get('HF_HUB_CACHE'), hf_home and Path(hf_home) / 'hub', home / '.cache/huggingface/hub']
    seen, out = set(), []
    for d in dirs:
        if d and Path(d).is_dir() and Path(d).resolve() not in seen:
            seen.add(Path(d).resolve()); out.append(Path(d))
    return out


def bench_command():
    # llama.app installs ship one `llama` command with a `bench` subcommand instead of llama-bench.
    if shutil.which('llama-bench'): return ['llama-bench']
    if shutil.which('llama') and output(['llama', 'bench', '--help'], stderr=True): return ['llama', 'bench']
    return None


def probe_llamacpp(p):
    bench = bench_command()
    p.extra['installed'] = bool(bench or shutil.which('llama-server') or shutil.which('llama'))
    files = []
    for d in gguf_dirs():
        for path in sorted(d.rglob('*.gguf'))[:400]:
            name = path.name.lower()
            if 'mmproj' in name or re.search(r'-0000[2-9]-of-|-000[1-9]\d-of-', name) or not path.is_file():
                continue
            files.append(path)
    if bench:
        version = output([*bench, '--version'])
        for path in files[:200]:
            p.targets.append(target('llama-bench', 'local', f'llama.cpp · {clean(path.name, 70)}', path=str(path), bench=bench,
                                    model=path.stem, size=path.stat().st_size, detail=gib(path.stat().st_size),
                                    engine_version=clean(version.splitlines()[0] if version else '', 40) or None))
    if not p.extra['installed']:
        p.detail = 'not installed'
    elif not bench:
        p.state, p.detail = 'note', f'installed · llama-bench missing · {len(files)} GGUF files found'
    else:
        p.detail = f'{len(p.targets)} GGUF file{"s" if len(p.targets) != 1 else ""} in your model caches' if p.targets else 'installed · no GGUF files in the usual caches'


def probe_servers(p):
    for label, port in LOCAL_PORTS:
        base = f'http://127.0.0.1:{port}/v1'
        try:
            models = read_json(base, '/models', timeout=1).get('data', [])
        except Exception:
            continue
        for m in models[:200]:
            mid = m.get('id')
            if isinstance(mid, str) and mid:
                p.targets.append(target('openai', 'local', f'{label} :{port} · {clean(mid, 60)}', model=mid, base=base, server=label))
    p.detail = (f'{len(p.targets)} model{"s" if len(p.targets) != 1 else ""} served on this machine' if p.targets
                else 'no local servers on the usual ports')


def codex_config():
    try:
        text = (Path.home() / '.codex/config.toml').read_text()
    except OSError:
        return {}
    top = text.split('\n[', 1)[0]  # top-level keys only, before any [table]
    out = {}
    for key in ('model', 'model_reasoning_effort'):
        m = re.search(rf'^\s*{key}\s*=\s*"([^"]+)"', top, re.M)
        if m: out[key] = clean(m.group(1), 40)
    return out


def probe_claude(p):
    if not shutil.which('claude'):
        p.detail = 'not installed'; return
    version = output(['claude', '--version']).split(' ')[0]
    api = any(os.environ.get(k) for k in ('ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX'))
    group = 'api' if api else 'subscription'
    p.targets.append(target('claude', group, 'Claude Code · your default model', engine_version=clean(version, 40),
                            detail='API key in your environment: bills your account' if api else 'your Claude subscription · capped'))
    p.detail = f'v{version} · ' + ('API key billing' if api else 'subscription login')


def probe_codex(p):
    if not shutil.which('codex'):
        p.detail = 'not installed'; return
    version = output(['codex', '--version']).split(' ')[-1]
    status = output(['codex', 'login', 'status'], 10, stderr=True)
    cfg = codex_config()
    model = cfg.get('model', 'default model')
    if 'ChatGPT' in status:
        group, how = 'subscription', 'ChatGPT login'
    elif 'API key' in status:
        group, how = 'api', 'API key billing'
    else:
        p.state, p.detail = 'note', f'v{version} · not signed in (run: codex login)'; return
    p.targets.append(target('codex', group, f'Codex · {model}', model=model, engine_version=clean(version, 40),
                            detail=('your ChatGPT plan · low reasoning effort · capped' if group == 'subscription' else 'API key: bills your account')))
    p.detail = f'v{version} · {how} · {model}'


def probe_gemini(p):
    if not shutil.which('gemini'):
        p.detail = 'not installed'; return
    version = output(['gemini', '--version'])
    api = any(os.environ.get(k) for k in ('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_USE_VERTEXAI'))
    try:
        settings = json.loads((Path.home() / '.gemini/settings.json').read_text())
    except (OSError, ValueError):
        settings = {}
    auth = ((settings.get('security') or {}).get('auth') or {}).get('selectedType') or settings.get('selectedAuthType')
    if not api and not auth:
        p.state, p.detail = 'note', f'v{version} · not signed in (run gemini once to sign in)'; return
    group = 'api' if api or auth == 'gemini-api-key' else 'subscription'
    p.targets.append(target('gemini', group, 'Gemini CLI · your default model (experimental)', engine_version=clean(version, 40),
                            detail='your Google sign-in · capped' if group == 'subscription' else 'API key: bills your account'))
    p.detail = f'v{version} · ' + ('API key billing' if group == 'api' else 'Google sign-in')


# Other coding agents with a documented headless JSON mode. Their billing depends on how each is
# configured, so they start unticked and are labelled as possibly costing money.
HARNESSES = {
    'qwen': ('Qwen Code', lambda prompt: ['qwen', prompt, '-o', 'json', '--approval-mode', 'plan']),
    'opencode': ('opencode', lambda prompt: ['opencode', 'run', '--format', 'json', prompt]),
    'goose': ('goose', lambda prompt: ['goose', 'run', '-t', prompt, '--no-session', '--quiet', '--output-format', 'json', '--max-turns', '1']),
}


def probe_others(p):
    for name, (label, _) in HARNESSES.items():
        if shutil.which(name):
            version = output([name, '--version'])
            p.targets.append(target('harness', 'api', f'{label} · its configured model (experimental)', tool=name,
                                    engine_version=clean(version.splitlines()[0] if version else '', 40) or None,
                                    detail='uses whatever account it is set up with; may cost money'))
    unsupported = [name for name in ('kimi', 'cursor-agent', 'aider', 'lms', 'mlx_lm.generate') if shutil.which(name)]
    bits = [f'{len(p.targets)} more agent{"s" if len(p.targets) != 1 else ""} (experimental)'] if p.targets else []
    if unsupported: bits.append('found ' + ', '.join(unsupported) + ' · not supported yet')
    if bits:
        p.state, p.detail = ('found' if p.targets else 'note'), ' · '.join(bits)
    else:
        p.detail = 'none of Qwen Code, opencode, goose, Kimi Code, Cursor, aider, LM Studio, MLX'


PROBES = [('hardware', 'This machine', probe_hardware), ('ollama', 'Ollama', probe_ollama),
          ('llamacpp', 'llama.cpp', probe_llamacpp), ('servers', 'Local servers', probe_servers),
          ('claude', 'Claude Code', probe_claude), ('codex', 'Codex CLI', probe_codex),
          ('gemini', 'Gemini CLI', probe_gemini), ('others', 'Other tools', probe_others)]


def discover():
    probes = [Probe(k, label, fn) for k, label, fn in PROBES]
    threads = [threading.Thread(target=x.run, daemon=True) for x in probes]
    with Live(lambda: [bold('Looking for models and AI tools on this machine')] + [x.row() for x in probes]):
        for t in threads: t.start()
        for t in threads: t.join(40)
    return {x.key: x for x in probes}


def start_ollama():
    """Start `ollama serve` for this session only; the caller stops it afterwards."""
    proc = subprocess.Popen(['ollama', 'serve'], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    for _ in range(50):
        try:
            read_json('http://127.0.0.1:11434', '/api/version', timeout=0.5); return proc
        except Exception:
            time.sleep(0.2)
    stop_process(proc)
    return None


def stop_process(proc):
    if proc and proc.poll() is None:
        try:
            os.killpg(proc.pid, signal.SIGTERM); proc.wait(timeout=5)
        except (OSError, subprocess.TimeoutExpired):
            try: os.killpg(proc.pid, signal.SIGKILL)
            except OSError: pass


def recommendations(found):
    missing = []
    if not found['ollama'].extra.get('installed'): missing.append(('Ollama', 'easiest way to run local models; then: ollama pull llama3.2:3b'))
    if not found['llamacpp'].extra.get('installed'): missing.append(('llama.cpp', 'fastest local engine; then: llama serve -hf ggml-org/Qwen3.5-0.8B-GGUF:Q8_0'))
    if not shutil.which('claude'): missing.append(('Claude Code', 'uses your Claude subscription'))
    if not shutil.which('codex'): missing.append(('Codex CLI', 'uses your ChatGPT plan'))
    if not shutil.which('gemini'): missing.append(('Gemini CLI', 'free with a Google account'))
    if not shutil.which('kimi'): missing.append(('Kimi Code', 'coding agent; no headless mode yet, so it can be found but not timed'))
    return missing


# ---------------------------------------------------------------- catalogue mapping

def load_catalogue():
    local = Path(__file__).resolve().parent / 'data' / 'models.json'
    try:
        if local.is_file():
            return json.loads(local.read_text())
        with urllib.request.urlopen(CATALOGUE_URL, timeout=5) as r:
            return json.loads(r.read(64 * 1024 * 1024))
    except Exception:
        return []


def norm(s):
    return re.sub(r'[^a-z0-9]+', '', str(s).lower())


def suggest_id(t, catalogue, model_name=None):
    """Best guess at the public catalogue id for what was measured; the user confirms it."""
    ids = {m.get('id') for m in catalogue}
    if t['kind'] == 'ollama':
        tag = t['model'] if ':' in t['model'] else t['model'] + ':latest'
        for m in catalogue:
            for v in (m.get('local') or {}).get('variants', []):
                cmd = v.get('cmd', '')
                if cmd.startswith('ollama run ') and cmd.split()[2] in (t['model'], tag, tag.replace(':latest', '')):
                    return m['id']
    if t['kind'] == 'llama-bench':
        name = norm(Path(t['path']).name)
        best = None
        for m in catalogue:
            for v in (m.get('local') or {}).get('variants', []):
                hf = re.search(r'-hf\s+([\w.-]+)/([\w.-]+?)(?::([\w.-]+))?(\s|$)', v.get('cmd', ''))
                if hf and norm(hf.group(2).replace('-GGUF', '')) in name and (not hf.group(3) or norm(hf.group(3)) in name):
                    best = best or m['id']
        if best:
            return best
    if model_name:
        guess = re.sub(r'[^a-z0-9]+', '-', model_name.lower()).strip('-')
        if guess in ids:
            return guess
    return None


# ---------------------------------------------------------------- selection

def choose(targets):
    groups = [('local', 'Local models · free, runs on this machine'),
              ('subscription', 'Your subscriptions · no extra cost, tiny capped prompts'),
              ('api', 'Billed to an API key · off by default')]
    rows = []
    for g, title in groups:
        items = [t for t in targets if t['group'] == g]
        if items:
            rows.append(('header', title))
            rows += [('item', t) for t in items]
    picked = set()
    local = [t for t in targets if t['group'] == 'local']
    for t in sorted(local, key=lambda t: t.get('size') or 0)[:3]:
        picked.add(id(t))  # the three smallest local models start ticked
    for t in targets:
        if t['group'] == 'subscription':
            picked.add(id(t))
    items = [r for r in rows if r[0] == 'item']
    if not items:
        return []
    if PLAIN or not sys.stdin.isatty() or os.name == 'nt':
        for i, (_, t) in enumerate(items, 1):
            print(f'  {i:>2}. {t["label"]}  {dim(t.get("detail", ""))}')
        default = ' '.join(str(i) for i, (_, t) in enumerate(items, 1) if id(t) in picked)
        chosen = ask('Numbers to run, separated by spaces', default).split()
        return [t for i, (_, t) in enumerate(items, 1) if str(i) in chosen]
    cursor = next(i for i, r in enumerate(rows) if r[0] == 'item')

    def render():
        height = max(8, shutil.get_terminal_size((100, 24)).lines - 6)
        start = max(0, min(cursor - height // 2, len(rows) - height))
        out = [bold('Pick what to test') + dim('   ↑/↓ move · space tick · a all · n none · enter start · q quit')]
        for i, r in enumerate(rows[start:start + height], start):
            if r[0] == 'header':
                out.append('  ' + yellow(r[1]))
                continue
            t = r[1]
            box = green('[x]') if id(t) in picked else '[ ]'
            line = f'{box} {t["label"]}  {dim(t.get("detail", ""))}'
            out.append(('› ' if i == cursor else '  ') + (c('7', ANSI.sub('', line)) if i == cursor and COLOR else line))
        out.append(dim(f'  {sum(id(t) in picked for _, t in items)} selected'))
        return out

    live = Live(render)
    live.live = True
    sys.stdout.write('\x1b[?25l')
    try:
        while True:
            live.draw()
            key = read_key()
            if key in ('up', 'k'):
                cursor = next((i for i in range(cursor - 1, -1, -1) if rows[i][0] == 'item'), cursor)
            elif key in ('down', 'j'):
                cursor = next((i for i in range(cursor + 1, len(rows)) if rows[i][0] == 'item'), cursor)
            elif key == 'space':
                tid = id(rows[cursor][1]); picked.symmetric_difference_update({tid})
            elif key == 'a':
                picked |= {id(t) for _, t in items}
            elif key == 'n':
                picked.clear()
            elif key == 'enter':
                return [t for _, t in items if id(t) in picked]
            elif key in ('q', 'esc'):
                return []
    finally:
        sys.stdout.write('\x1b[?25h'); sys.stdout.flush()


# ---------------------------------------------------------------- runners

def run_ollama(t, tokens, n):
    data = read_json(t['base'], '/api/generate', {'model': t['model'], 'prompt': f'Run {n}. ' + PROMPT, 'stream': False,
                                                   'options': {'temperature': 0, 'seed': n, 'num_predict': tokens}}, timeout=CALL_TIMEOUT)
    if data.get('error') or not data.get('done'):
        raise ValueError('generation did not finish')
    return {'gen_tok_s': rate(data.get('eval_count'), data.get('eval_duration')),
            'prompt_tok_s': rate(data.get('prompt_eval_count'), data.get('prompt_eval_duration')),
            'load_s': round(data.get('load_duration', 0) / 1e9, 3), 'output_tokens': number(data.get('eval_count')),
            'elapsed_s': round(data.get('total_duration', 0) / 1e9, 3) or None}


def run_openai(t, tokens, n):
    start, first, usage, size, finished, chunks = time.monotonic(), None, {}, 0, False, 0
    with request(t['base'], '/chat/completions', {'model': t['model'], 'messages': [{'role': 'user', 'content': f'Run {n}. ' + PROMPT}],
                                                   'max_tokens': tokens, 'temperature': 0, 'stream': True,
                                                   'stream_options': {'include_usage': True}}, t.get('key', ''), timeout=60) as response:
        while True:
            line = response.readline(65537); size += len(line)
            if not line: break
            if size > LIMIT or time.monotonic() - start > CALL_TIMEOUT: raise ValueError('response limit exceeded')
            if not line.startswith(b'data:'): continue
            raw = line[5:].strip()
            if raw == b'[DONE]': finished = True; break
            data = json.loads(raw)
            if data.get('error'): raise ValueError('API error')
            if data.get('usage'): usage = data['usage']
            for choice in data.get('choices', []):
                if choice.get('delta', {}).get('content'):
                    chunks += 1
                    if first is None: first = time.monotonic() - start
                if choice.get('finish_reason'): finished = True
    if not finished or first is None: raise ValueError('incomplete stream')
    elapsed = time.monotonic() - start
    count = number(usage.get('completion_tokens'))
    gen = round(count / (elapsed - first), 2) if count and elapsed > first else None
    return {'ttft_s': round(first, 3), 'elapsed_s': round(elapsed, 3), 'output_tokens': count, 'gen_tok_s': gen}


def run_llama_bench(t, tokens, n):
    with tempfile.TemporaryDirectory(prefix='whatmodel-') as work:
        code, out = run_process([*t.get('bench', ['llama-bench']), '-m', t['path'], '-p', '512', '-n', str(tokens), '-r', '1', '-o', 'json'], work)
    if code: raise RuntimeError('llama-bench failed')
    rows = json.loads(out)
    pp = [r['avg_ts'] for r in rows if r.get('n_prompt', 0) > 0 and not r.get('n_gen')]
    tg = [r['avg_ts'] for r in rows if r.get('n_gen', 0) > 0 and not r.get('n_prompt')]
    if not tg: raise ValueError('no generation measurement')
    return {'gen_tok_s': round(tg[0], 2), 'prompt_tok_s': round(pp[0], 2) if pp else None}


def claude_args(prompt):
    # No tools, MCP servers, hooks, project settings or saved session: just the model answering.
    return ['claude', '-p', prompt, '--output-format', 'json', '--tools', '', '--strict-mcp-config',
            '--mcp-config', '{"mcpServers":{}}', '--settings', '{"disableAllHooks":true}', '--setting-sources', '',
            '--no-session-persistence', '--max-budget-usd', str(CLAUDE_USD_PER_CALL)]


def run_claude(t, tokens, n):
    with tempfile.TemporaryDirectory(prefix='whatmodel-') as work:
        code, out = run_process(claude_args(f'Run {n}. ' + AGENT_PROMPT), work)
    data = json.loads(out)
    if data.get('is_error') or data.get('type') != 'result':
        raise RuntimeError('Claude Code reported an error')
    usage, ms, api_ms, ttft = data.get('usage') or {}, data.get('duration_ms'), data.get('duration_api_ms'), data.get('ttft_ms')
    tokens_out = number(usage.get('output_tokens'))
    gen = round(tokens_out / ((api_ms - ttft) / 1000), 2) if tokens_out and number(api_ms) and number(ttft) and api_ms > ttft else None
    models = list((data.get('modelUsage') or {}).keys())
    return {'elapsed_s': round(ms / 1000, 3) if number(ms) else None, 'ttft_s': round(ttft / 1000, 3) if number(ttft) else None,
            'output_tokens': tokens_out, 'gen_tok_s': gen, 'cost_usd': number(data.get('total_cost_usd')),
            '_model': clean(models[0], 60) if models else None}


def run_codex(t, tokens, n):
    start = time.monotonic()
    with tempfile.TemporaryDirectory(prefix='whatmodel-') as work:
        code, out = run_process(['codex', 'exec', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only', '--json',
                                 '-c', 'model_reasoning_effort="low"', f'Run {n}. ' + AGENT_PROMPT], work)
    elapsed = time.monotonic() - start
    usage, done = {}, False
    for line in out.splitlines():
        try: e = json.loads(line)
        except ValueError: continue
        if e.get('type') == 'turn.completed':
            done, usage = True, e.get('usage') or {}
        if e.get('type') in ('turn.failed', 'error'):
            raise RuntimeError('Codex reported an error')
    if code or not done: raise RuntimeError('Codex did not finish')
    out_tokens = number(usage.get('output_tokens'))
    reasoning = number(usage.get('reasoning_output_tokens')) or 0
    return {'elapsed_s': round(elapsed, 3), 'output_tokens': out_tokens, 'reasoning_tokens': reasoning,
            'e2e_tok_s': round(((out_tokens or 0) + reasoning) / elapsed, 2) if out_tokens else None}


def run_gemini(t, tokens, n):
    start = time.monotonic()
    with tempfile.TemporaryDirectory(prefix='whatmodel-') as work:
        code, out = run_process(['gemini', '-p', f'Run {n}. ' + AGENT_PROMPT, '-o', 'json', '--approval-mode', 'plan'], work)
    elapsed = time.monotonic() - start
    data = json.loads(out[out.find('{'):]) if '{' in out else {}
    if code or data.get('error') or 'response' not in data:
        raise RuntimeError('Gemini CLI reported an error')
    models = (data.get('stats') or {}).get('models') or {}
    out_tokens = sum(number((m.get('tokens') or {}).get('candidates')) or 0 for m in models.values()) or None
    return {'elapsed_s': round(elapsed, 3), 'output_tokens': out_tokens,
            'e2e_tok_s': round(out_tokens / elapsed, 2) if out_tokens else None,
            '_model': clean(next(iter(models)), 60) if models else None}


def most_tokens(text):
    """The largest output-token count anywhere in a tool's JSON or JSON-lines output (counts are often cumulative)."""
    best = None
    def walk(o):
        nonlocal best
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ('output_tokens', 'completion_tokens', 'outputTokens', 'candidates', 'candidatesTokenCount') and number(v):
                    best = max(best or 0, v)
                walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    for chunk in [text] + text.splitlines():
        try: walk(json.loads(chunk))
        except ValueError: pass
    return best


def run_harness(t, tokens, n):
    start = time.monotonic()
    with tempfile.TemporaryDirectory(prefix='whatmodel-') as work:
        code, out = run_process(HARNESSES[t['tool']][1](f'Run {n}. ' + AGENT_PROMPT), work)
    elapsed = time.monotonic() - start
    if code or not out.strip(): raise RuntimeError('the tool reported an error')
    count = most_tokens(out)
    return {'elapsed_s': round(elapsed, 3), 'output_tokens': count, 'e2e_tok_s': round(count / elapsed, 2) if count else None}


RUNNERS = {'ollama': run_ollama, 'openai': run_openai, 'llama-bench': run_llama_bench,
           'claude': run_claude, 'codex': run_codex, 'gemini': run_gemini, 'harness': run_harness}
ENGINES = {'ollama': 'ollama', 'openai': 'openai-compatible', 'llama-bench': 'llama.cpp',
           'claude': 'claude-code', 'codex': 'codex-cli', 'gemini': 'gemini-cli', 'harness': 'agent-cli'}


# ---------------------------------------------------------------- scheduling and the live run

def schedule(targets, runs, warmups, seed):
    """Warm-ups first, then rounds in a shuffled order, so slow drift (heat, other apps) spreads evenly."""
    rng = random.Random(seed)
    order = [(t, 0) for t in rng.sample(targets, len(targets)) for _ in range(warmups)]
    for n in range(1, runs + 1):
        order += [(t, n) for t in rng.sample(targets, len(targets))]
    return order


def headline(t, samples):
    key = 'gen_tok_s' if any(s.get('gen_tok_s') for s in samples) else 'e2e_tok_s'
    vals = [s[key] for s in samples if s.get(key)]
    if not vals: return ''
    label = 'tok/s' if key == 'gen_tok_s' else 'tok/s end-to-end'
    return f'{statistics.median(vals):.1f} {label}'


class Run:
    def __init__(self, t, runs, warmups):
        self.t, self.runs, self.warmups = t, runs, warmups
        self.state, self.samples, self.errors, self.done = 'queued', [], 0, 0
        self.used_tokens, self.used_usd, self.started, self.note = 0, 0.0, None, ''

    def row(self):
        bar_n = self.runs + self.warmups
        bar = green('▇' * self.done) + dim('░' * max(0, bar_n - self.done))
        mark = {'queued': dim('○'), 'running': spinner(), 'done': green('✓'), 'failed': red('✗'), 'skipped': yellow('–')}[self.state]
        info = headline(self.t, self.samples)
        if self.state == 'running':
            info = f'{self.note} {int(time.monotonic() - self.started)}s' + (f' · {info}' if info else '')
        elif self.state in ('failed', 'skipped'):
            info = self.note
        use = ''
        if self.t['group'] != 'local' and (self.used_tokens or self.used_usd):
            use = dim(f' · used {self.used_tokens:,} tok' + (f' ≈ ${self.used_usd:.2f}' if self.used_usd else ''))
        return f'  {mark} {self.t["label"]:<44.44} {bar} {info}{use}'


def run_all(targets, runs, warmups, tokens, seed):
    jobs = {id(t): Run(t, runs, warmups) for t in targets}
    order = schedule(targets, runs, warmups, seed)
    began = time.monotonic()
    current = {'i': 0}

    def render():
        done = current['i']
        total = len(order)
        width = 28
        filled = int(width * done / total) if total else width
        eta = ''
        if 0 < done < total:
            eta = f' · about {int((time.monotonic() - began) / done * (total - done))}s left'
        head = bold('Running') + dim(f'  one at a time, order shuffled (seed {seed}) · Ctrl-C stops and keeps finished results')
        foot = f'  {green("▇" * filled)}{dim("░" * (width - filled))} {done}/{total} calls · {int(time.monotonic() - began)}s{eta}'
        return [head] + [jobs[id(t)].row() for t in targets] + [foot]

    with Live(render):
        try:
            for i, (t, n) in enumerate(order):
                current['i'] = i
                job = jobs[id(t)]
                if job.state in ('failed', 'skipped'):
                    continue
                if t['group'] != 'local' and job.used_tokens >= AGENT_TOKEN_CAP:
                    job.state, job.note = 'skipped', f'stopped at the {AGENT_TOKEN_CAP:,}-token cap'
                    continue
                job.state, job.started = 'running', time.monotonic()
                job.note = 'warm-up' if n == 0 else f'run {n}/{runs}'
                for attempt in range(2):  # one retry for a transient failure
                    try:
                        sample = RUNNERS[t['kind']](t, tokens, n)
                        break
                    except KeyboardInterrupt:
                        raise
                    except Exception as e:
                        sample = None
                        job.note = f'retrying after {clean(type(e).__name__, 30)}'
                if sample is None:
                    job.state, job.note = 'failed', 'failed twice; see --help for troubleshooting'
                    continue
                job.used_tokens += (sample.get('output_tokens') or 0) + (sample.get('reasoning_tokens') or 0)
                job.used_usd += sample.get('cost_usd') or 0
                if sample.get('_model'):
                    t['measured_model'] = sample['_model']
                if n > 0:
                    job.samples.append({k: v for k, v in sample.items() if not k.startswith('_')})
                job.done += 1
                job.state = 'done' if job.done >= runs + warmups else 'queued'
            current['i'] = len(order)
        except KeyboardInterrupt:
            for job in jobs.values():
                if job.state in ('running', 'queued'):
                    job.state, job.note = ('done', 'stopped early') if job.samples else ('skipped', 'stopped')
    return [jobs[id(t)] for t in targets]


# ---------------------------------------------------------------- results and sharing

def fmt(v, unit='', digits=1):
    return '' if v is None else f'{v:.{digits}f}{unit}'


def summary(jobs):
    w = max(24, min(46, shutil.get_terminal_size((100, 24)).columns - 62))
    print('\n' + bold('Results') + dim('  medians of the measured runs (warm-ups excluded)'))
    print(dim(f'  {"model / tool":<{w}} {"tok/s":>9} {"prefill":>9} {"1st token":>10} {"total":>8}  used'))
    for job in jobs:
        s = job.samples
        if not s:
            print(f'  {job.t["label"]:<{w}.{w}} {red(job.note or "no measurements")}'); continue
        med = lambda k: statistics.median([x[k] for x in s if x.get(k) is not None]) if any(x.get(k) is not None for x in s) else None
        tok = med('gen_tok_s') or med('e2e_tok_s')
        use = '' if job.t['group'] == 'local' else f'{job.used_tokens:,} tok' + (f' ≈ ${job.used_usd:.2f}' if job.used_usd else '')
        print(f'  {job.t["label"]:<{w}.{w}} {fmt(tok):>9} {fmt(med("prompt_tok_s")):>9} {fmt(med("ttft_s"), "s", 2):>10} {fmt(med("elapsed_s"), "s"):>8}  {dim(use)}')
    subs = [j for j in jobs if j.t['group'] != 'local' and (j.used_tokens or j.used_usd)]
    if subs:
        print(dim('\n  Subscription use: vendors don’t publish exact plan limits, so we can’t show a share of your plan.'))
        print(dim('  Each tool answered a few ~120-word prompts, like a few short chat messages.'))


def public_report(jobs, tokens, runs, warmups, seed, hw, ids):
    rows = []
    allowed = ('elapsed_s', 'output_tokens', 'reasoning_tokens', 'gen_tok_s', 'prompt_tok_s', 'load_s', 'ttft_s', 'e2e_tok_s', 'cost_usd')
    for job in jobs:
        public_id = ids.get(id(job.t))
        if not public_id or not job.samples:
            continue
        if not re.fullmatch(r'[a-z0-9][a-z0-9.-]{0,79}', public_id):
            raise ValueError('Invalid public model id')
        t = job.t
        row = {'model': public_id, 'engine': ENGINES[t['kind']], 'engine_version': t.get('engine_version'),
               'samples': [{k: v for k, v in x.items() if k in allowed and (v is None or number(v) is not None)} for x in job.samples]}
        if t['kind'] == 'ollama':
            row.update({k: t.get(k) for k in ('quant', 'params', 'digest')})
        if t['kind'] == 'llama-bench':
            row['file'] = clean(Path(t['path']).name, 120)  # the GGUF's published file name, not its path
        if t['kind'] == 'codex':
            row['settings'] = 'model_reasoning_effort=low'
        if t['kind'] == 'harness':
            row['engine'] = t['tool']
        rows.append({k: v for k, v in row.items() if v is not None})
    hardware_public = {k: hw[k] for k in ('os', 'arch', 'chip', 'ram_gb', 'gpu', 'vram_gb', 'gpus', 'gpu_cores') if k in hw}
    return {'schema': 'whatmodel-bench-v3', 'script_version': VERSION,
            'protocol': {'prompt_sha256': hashlib.sha256(PROMPT.encode()).hexdigest(),
                         'agent_prompt_sha256': hashlib.sha256(AGENT_PROMPT.encode()).hexdigest(),
                         'max_output_tokens': tokens, 'runs': runs, 'warmups': warmups, 'order_seed': seed,
                         'note': 'one call at a time; shuffled rounds; warm-ups discarded; one retry per failed call'},
            'hardware': hardware_public, 'results': rows}


def share(jobs, tokens, runs, warmups, seed, hw):
    measured = [j for j in jobs if j.samples]
    if not measured:
        print('No successful measurements, so there is nothing to share.'); return
    if not yes('\nShare these speeds with whatmodel.sh? You will review the exact report first'):
        print('Nothing shared.'); return
    catalogue = load_catalogue()
    ids = {}
    print(dim('Public model ids come from the whatmodel catalogue. Blank leaves a result out.'))
    for job in measured:
        guess = suggest_id(job.t, catalogue, job.t.get('measured_model') or job.t.get('model'))
        while True:
            answer = ask(f'  id for {job.t["label"]}', guess or '')
            if not answer or re.fullmatch(r'[a-z0-9][a-z0-9.-]{0,79}', answer): break
            print('  Use a catalogue id like llama-3-2-3b, not a path or private name.')
        if answer: ids[id(job.t)] = answer
    report = public_report(jobs, tokens, runs, warmups, seed, hw, ids)
    if not report['results']:
        print('No results kept. Nothing shared.'); return
    print('\n' + bold('Exact public report') + dim(' (no keys, file paths, host names or generated text):\n'))
    print(json.dumps(report, indent=2))
    fd, path = tempfile.mkstemp(prefix='whatmodel-results-', suffix='.json')
    with os.fdopen(fd, 'w') as f: json.dump(report, f, indent=2)
    print(dim('\nSaved a copy for you: ' + path))
    if not yes('Open a GitHub issue draft with this report, released under CC0 1.0'):
        print('Kept local only.'); return
    body = '### Benchmark results\n\n```json\n' + json.dumps(report, separators=(',', ':')) + '\n```\n\nI reviewed this report and release these measurements under CC0 1.0.\n'
    url = ISSUES + '?' + urllib.parse.urlencode({'title': 'Benchmark measurements', 'body': body})
    if len(url) > 7500:
        url = ISSUES + '?' + urllib.parse.urlencode({'title': 'Benchmark measurements', 'body': 'Report attached (saved JSON). I release these measurements under CC0 1.0.'})
        print('The report is too long for a link; attach the saved JSON to the issue.')
    print('Read the draft in your browser and click Submit if you are happy. Nothing is sent from here.')
    if not webbrowser.open(url): print('Open this link:\n' + url)


# ---------------------------------------------------------------- demo mode (no models needed)

def demo_runner(kind, speed):
    def run(t, tokens, n):
        time.sleep(random.uniform(0.4, 1.2))
        if random.random() < 0.08: raise TimeoutError('demo hiccup')
        if kind == 'local':
            return {'gen_tok_s': round(random.gauss(speed, speed * 0.04), 1), 'prompt_tok_s': round(speed * 9, 1), 'output_tokens': tokens}
        return {'elapsed_s': round(random.uniform(4, 9), 2), 'ttft_s': round(random.uniform(0.8, 2), 2),
                'gen_tok_s': round(random.gauss(speed, 3), 1), 'output_tokens': 160, 'cost_usd': 0.02 if kind == 'claude' else None}
    return run


def demo_targets():
    ts = [target('demo-a', 'local', 'Ollama · llama3.2:3b (demo)', detail='3.2B · Q4_K_M · 2.0 GB', size=2e9),
          target('demo-b', 'local', 'llama.cpp · Qwen3.5-0.8B-Q8_0.gguf (demo)', detail='0.8 GB', size=8e8),
          target('demo-c', 'subscription', 'Claude Code · your default model (demo)', detail='your Claude subscription · capped'),
          target('demo-d', 'subscription', 'Codex · gpt-6-astra (demo)', detail='your ChatGPT plan · low effort · capped')]
    for t, (kind, speed) in zip(ts, [('local', 48), ('local', 140), ('claude', 70), ('codex', 55)]):
        RUNNERS[t['kind']] = demo_runner(kind, speed); ENGINES[t['kind']] = 'demo'
    return ts


# ---------------------------------------------------------------- main

def main():
    global PLAIN
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', action='version', version=VERSION)
    parser.add_argument('--list', action='store_true', help='only show what was found, then exit')
    parser.add_argument('--plain', action='store_true', help='print line by line instead of redrawing the screen')
    parser.add_argument('--demo', action='store_true', help='try the interface with simulated models (no calls are made)')
    parser.add_argument('--runs', type=int, default=3, help='measured runs per selection, 1-5 (default 3)')
    parser.add_argument('--tokens', type=int, default=256, help='output tokens per local model call, 32-1024 (default 256)')
    args = parser.parse_args()
    PLAIN = args.plain
    # A closed terminal or kill stops runs like Ctrl-C, so the cleanup below (stopping Ollama) still happens.
    def stop(signum, frame):
        raise KeyboardInterrupt
    for sig in (signal.SIGTERM, getattr(signal, 'SIGHUP', None)):
        if sig: signal.signal(sig, stop)
    if not 1 <= args.runs <= 5 or not 32 <= args.tokens <= 1024:
        parser.error('--runs must be 1-5 and --tokens 32-1024')
    if not args.list and not sys.stdin.isatty():
        print('Run this from an interactive terminal (or use --list).'); return 1

    print(bold('\nwhatmodel bench') + dim(f' v{VERSION} · speed tests for the models and AI tools on this machine\n'))
    started = None
    try:
        if args.demo:
            found, targets, hw = None, demo_targets(), {'os': 'Darwin', 'arch': 'arm64', 'chip': 'Demo chip', 'ram_gb': 32}
            print(dim('Demo mode: simulated models, nothing is called.\n'))
        else:
            found = discover()
            hw = found['hardware'].extra.get('hardware', {})
            if found['ollama'].state == 'note' and found['ollama'].extra.get('installed') and not args.list:
                if yes('\nOllama is installed but not running. Start it just for this session'):
                    started = start_ollama()
                    if started:
                        found['ollama'] = Probe('ollama', 'Ollama', probe_ollama); found['ollama'].run()
                        print('  ' + found['ollama'].row())
                    else:
                        print(yellow('  Could not start Ollama; continuing without it.'))
            targets = [t for p in found.values() for t in p.targets]
            missing = recommendations(found)
            if missing:
                print('\n' + bold('Worth trying') + dim('  (install them yourself; this script never installs anything)'))
                for name, why in missing:
                    print(f'  {name:<12} {cyan(INSTALL[name])}  {dim(why)}')
            if args.list:
                print()
                for t in targets: print(f'  {t["group"]:<12} {t["label"]}  {dim(t.get("detail", ""))}')
                return 0
            if not targets:
                print('\nNothing to test yet. Install one of the tools above, then run this again.'); return 0
        print()
        selected = choose(targets)
        if not selected:
            print('Nothing selected.'); return 0
        warmups = 1
        calls = len(selected) * (args.runs + warmups)
        print('\n' + bold('Plan'))
        print(f'  {len(selected)} selection{"s" if len(selected) != 1 else ""} × ({args.runs} measured + {warmups} warm-up) = {calls} calls, one at a time, shuffled')
        for t in selected:
            note = {'local': f'up to {args.tokens} output tokens per call · free',
                    'subscription': f'~120-word answers · stops at {AGENT_TOKEN_CAP:,} tokens' + (f' or ${CLAUDE_USD_PER_CALL:.2f} equivalent per call' if t['kind'] == 'claude' else ''),
                    'api': 'bills your API account'}[t['group']]
            print(f'  {t["label"]:<46.46} {dim(note)}')
        if any(t['group'] == 'api' for t in selected):
            print(yellow('  Some selections bill an API key. Untick them unless you mean to pay for this.'))
        if not args.demo and not yes('Start', default=True):
            print('Cancelled.'); return 0
        seed = random.randrange(1, 10**6)
        print()
        jobs = run_all(selected, args.runs, warmups, args.tokens, seed)
        summary(jobs)
        if not args.demo:
            share(jobs, args.tokens, args.runs, warmups, seed, hw)
        return 0
    finally:
        stop_process(started)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (KeyboardInterrupt, EOFError):
        sys.stdout.write('\x1b[?25h' if sys.stdout.isatty() else '')
        print('\nCancelled. Nothing was shared.'); sys.exit(130)
