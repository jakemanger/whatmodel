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

VERSION = '3.2.0'
PROMPT = ('Write a practical guide to starting a vegetable garden. Explain soil preparation, '
          'watering, planting easy vegetables and managing pests. Use short clear sections. '
          'Do not use tools, files, browsing, or external information. Aim for 300 words.')
# Agent CLIs answer a shorter request, so each measured call stays small on your subscription.
AGENT_PROMPT = ('Without using any tools, files or browsing, write about 120 words of practical '
                'advice on starting a small vegetable garden. Plain text only.')
LIMIT = 4 * 1024 * 1024
ISSUES = 'https://github.com/jakemanger/whatmodel/issues/new'
CATALOGUE_URL = 'https://whatmodel.sh/data/bench-models.json'
CALL_TIMEOUT = 180
# Per-tool caps for subscription and API tools: a run stops early once either is reached.
AGENT_TOKEN_CAP = 4000
# A random pause before every call, so tests can't fall into step with periodic background work
# (backups, indexing, sync). Drawn from the run's seed, so the whole schedule can be replayed. The
# first second of each pause measures how busy other programs keep the CPU while ours are idle.
PAUSE_S = (1.0, 3.0)
BUSY_WARN = 0.25  # other programs using more than a quarter of the CPU makes speeds unreliable
CLAUDE_USD_PER_CALL = 0.10
# llama.cpp moved its default server port to 9931 in October 2026; 8080 is older builds and MLX-LM.
LOCAL_PORTS = [('llama.cpp server', 9931), ('llama.cpp / MLX-LM', 8080), ('LM Studio', 1234), ('vLLM / SGLang', 8000),
               ('SGLang', 30000), ('Jan', 1337), ('Jan', 6767)]
# Official install commands. The script runs one only after showing it and getting a yes.
INSTALL = {
    'Ollama': 'curl -fsSL https://ollama.com/install.sh | sh',
    'llama.cpp': 'curl -LsSf https://llama.app/install.sh | sh',
    'MLX': 'uv tool install mlx-lm',
    'Claude Code': 'curl -fsSL https://claude.ai/install.sh | bash',
    'Codex CLI': 'npm install -g @openai/codex',
    'Gemini CLI': 'npm install -g @google/gemini-cli',
    'Kimi Code': 'curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash',
}
UV_INSTALL = 'curl -LsSf https://astral.sh/uv/install.sh | sh'
DOWNLOAD_PAGES = {'Ollama': 'https://ollama.com/download', 'LM Studio': 'https://lmstudio.ai/download'}
# One small model per runtime (Qwen3 0.6B), offered when a runtime has nothing to test yet.
TEST_GGUF = ('unsloth/Qwen3-0.6B-GGUF', '50968a4468ef4233ed78cd7c3de230dd1d61a56b', 'Qwen3-0.6B-Q4_K_M.gguf', 396705472)
TEST_OLLAMA = ('qwen3:0.6b', 0.52)
TEST_MLX = ('mlx-community/Qwen3-0.6B-4bit', 0.35)
PLAIN = False
for _d in (Path.home() / '.local/bin', Path.home() / '.lmstudio/bin', Path.home() / '.cargo/bin'):
    if _d.is_dir() and str(_d) not in os.environ.get('PATH', '').split(os.pathsep):
        os.environ['PATH'] = os.environ.get('PATH', '') + os.pathsep + str(_d)  # this process only


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
    files, seen = [], set()
    for d in gguf_dirs():
        for path in sorted(d.rglob('*.gguf'))[:400]:
            name = path.name.lower()
            if 'mmproj' in name or re.search(r'-0000[2-9]-of-|-000[1-9]\d-of-', name) or not path.is_file():
                continue
            if (name, path.stat().st_size) in seen:
                continue  # the same file in another app's folder
            seen.add((name, path.stat().st_size)); files.append(path)
    if bench:
        version = output([*bench, '--version'])
        for path in files[:200]:
            p.targets.append(target('llama-bench', 'local', f'llama.cpp · {clean(path.name, 70)}', path=str(path), bench=bench, quant=quant_of_file(path.name),
                                    model=path.stem, size=path.stat().st_size, detail=gib(path.stat().st_size),
                                    engine_version=clean(version.splitlines()[0] if version else '', 40) or None))
    if not p.extra['installed']:
        p.detail = 'not installed'
    elif not bench:
        p.state, p.detail = 'note', f'installed · llama-bench missing · {len(files)} GGUF files found'
    else:
        p.detail = f'{len(p.targets)} GGUF file{"s" if len(p.targets) != 1 else ""} in your model caches' if p.targets else 'installed · no GGUF files in the usual caches'


def apple_silicon():
    return platform.system() == 'Darwin' and platform.machine() == 'arm64'


def hub_dirs():
    home, hf_home = Path.home(), os.environ.get('HF_HOME')
    dirs = [os.environ.get('HF_HUB_CACHE'), hf_home and Path(hf_home) / 'hub', home / '.cache/huggingface/hub']
    return [Path(d) for d in dirs if d and Path(d).is_dir()]


def mlx_models():
    """MLX models already on disk: Hugging Face cache snapshots and LM Studio's model folders."""
    found, seen = [], set()
    def add(repo, folder):
        cfg = folder / 'config.json'
        weights = list(folder.glob('*.safetensors'))
        if not cfg.is_file() or not weights or repo in seen:
            return
        try:
            quantized = 'quantization' in json.loads(cfg.read_text())
        except (OSError, ValueError):
            return
        if quantized or 'mlx' in repo.lower():
            seen.add(repo)
            bits = (json.loads(cfg.read_text()).get('quantization') or {}).get('bits')
            found.append((repo, folder, sum(w.stat().st_size for w in weights if w.is_file()), f'{bits}bit' if bits else None))
    for hub in hub_dirs():
        for d in sorted(hub.glob('models--*'))[:400]:
            snaps = sorted((d / 'snapshots').glob('*'), key=lambda x: x.stat().st_mtime, reverse=True)
            if snaps: add(d.name[len('models--'):].replace('--', '/', 1), snaps[0])
    lms = Path.home() / '.lmstudio/models'
    if lms.is_dir():
        for d in sorted(lms.glob('*/*'))[:400]: add(f'{d.parent.name}/{d.name}', d)
    return found


def probe_mlx(p):
    if not apple_silicon():
        p.detail = 'Apple silicon Macs only'; return
    p.extra['installed'] = bool(shutil.which('mlx_lm.benchmark'))
    models = mlx_models()
    if p.extra['installed']:
        for repo, folder, size, bits in models[:200]:
            p.targets.append(target('mlx', 'local', f'MLX · {clean(repo, 70)}', path=str(folder), model=repo, size=size, detail=gib(size), quant=bits))
    if not p.extra['installed']:
        p.state, p.detail = ('note', f'mlx-lm not installed · {len(models)} MLX models found') if models else ('missing', 'not installed')
    else:
        p.detail = f'{len(p.targets)} MLX model{"s" if len(p.targets) != 1 else ""} on disk' if p.targets else 'installed · no MLX models on disk yet'


def probe_lmstudio(p):
    p.extra['installed'] = bool(shutil.which('lms'))
    if not p.extra['installed']:
        p.detail = 'not installed'; return
    try:
        read_json('http://127.0.0.1:1234/v1', '/models', timeout=1); running = True
    except Exception:
        running = False
    p.extra['running'] = running
    p.state, p.detail = ('found', 'server running · its models are under Local servers') if running else ('note', 'installed · server not running (can be started for this session)')


def start_lmstudio():
    """Start LM Studio's local server for this session; the caller stops it afterwards."""
    output(['lms', 'server', 'start'], timeout=60, stderr=True)
    for _ in range(50):
        try:
            read_json('http://127.0.0.1:1234/v1', '/models', timeout=0.5); return True
        except Exception:
            time.sleep(0.2)
    return False


def probe_servers(p):
    for label, port in LOCAL_PORTS:
        base = f'http://127.0.0.1:{port}/v1'
        try:
            models = read_json(base, '/models', timeout=1).get('data', [])
        except Exception:
            continue
        for m in models[:200]:
            mid = m.get('id')
            if isinstance(mid, str) and mid and 'embed' not in mid.lower():  # embedding models can't chat
                kind = 'lmstudio' if label == 'LM Studio' else 'openai'
                p.targets.append(target(kind, 'local', f'{label} :{port} · {clean(mid, 60)}', model=mid, base=base, server=label))
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
    for flag, family in (('opus', 'Opus'), ('sonnet', 'Sonnet'), ('haiku', 'Haiku')):  # Claude Code's own model aliases
        p.targets.append(target('claude', group, f'Claude {family} (latest) · Claude Code', model_flag=flag, engine_version=clean(version, 40),
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
    unsupported = [name for name in ('kimi', 'cursor-agent', 'aider') if shutil.which(name)]
    bits = [f'{len(p.targets)} more agent{"s" if len(p.targets) != 1 else ""} (experimental)'] if p.targets else []
    if unsupported: bits.append('found ' + ', '.join(unsupported) + ' · not supported yet')
    if bits:
        p.state, p.detail = ('found' if p.targets else 'note'), ' · '.join(bits)
    else:
        p.detail = 'none of Qwen Code, opencode, goose, Kimi Code, Cursor, aider'


PROBES = [('hardware', 'This machine', probe_hardware), ('ollama', 'Ollama', probe_ollama),
          ('llamacpp', 'llama.cpp', probe_llamacpp), ('mlx', 'MLX', probe_mlx), ('lmstudio', 'LM Studio', probe_lmstudio),
          ('servers', 'Local servers', probe_servers),
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


def has(found, key):
    """Whether a probe found its tool installed (False if that probe didn't run)."""
    return bool(key in found and found[key].extra.get('installed'))


def download(url, dest, size):
    """Download a file with a progress line; keep it only if it has the expected size."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + '.part')
    with urllib.request.urlopen(url, timeout=30) as r, open(part, 'wb') as f:
        got = 0
        while True:
            chunk = r.read(1 << 20)
            if not chunk: break
            f.write(chunk); got += len(chunk)
            sys.stdout.write(f'\r    {got / 1e9:.2f} / {size / 1e9:.2f} GB'); sys.stdout.flush()
    print()
    if part.stat().st_size != size:
        part.unlink(); raise ValueError('download was incomplete')
    part.rename(dest)


# ---------------------------------------------------------------- what to test: whatmodel.sh models this machine can run

RUNTIME = {'gguf': 'llama.cpp', 'mlx': 'MLX', 'ollama': 'Ollama'}


def norm(s):
    return re.sub(r'[^a-z0-9]+', '', str(s).lower())


def base_name(s):
    """A model's name without its file format, quantisation or date: 'Qwen3-0.6B-Q4_K_M' -> 'Qwen3-0.6B'."""
    s = re.sub(r'(?i)\.gguf$', '', s.split('/')[-1])
    return re.sub(r'(?i)([-_.](gguf|mlx|(ud-)?i?q\d\w*|\d+bit|bf16|f16|fp16|f32|mxfp4|dwq|\d{8}))+$', '', s)


def quant_of_file(name):
    found = re.findall(r'(?i)(?:ud-)?i?q\d(?:_[a-z0-9]+)*|bf16|f16|f32|mxfp4', Path(name).stem)
    return found[-1].upper() if found else None


def load_catalogue():
    """whatmodel.sh's model list for the bench: ids, names, scores and their downloads."""
    local = Path(__file__).resolve().parent / 'pages' / 'bench-models.json'
    try:
        if local.is_file():
            return json.loads(local.read_text())
        with urllib.request.urlopen(CATALOGUE_URL, timeout=10) as r:
            return json.loads(r.read(LIMIT * 2))
    except Exception:
        return []


def match_model(t, catalogue):
    """The whatmodel.sh model (and download) a test runs: by its exact file, repo or tag, else by name."""
    kind = t['kind']
    for m in catalogue:
        for v in m.get('variants', []):
            if kind == 'ollama' and v['rt'] == 'ollama' and v['ref'] in (t['model'], t['model'][:-7] if t['model'].endswith(':latest') else t['model']):
                return m, v
            if kind == 'mlx' and v['rt'] == 'mlx' and v['ref'].lower() == t['model'].lower():
                return m, v
            if kind == 'llama-bench' and v['rt'] == 'gguf':
                file, repo = norm(Path(t['path']).name), norm(re.sub(r'(?i)-gguf$', '', v['ref'].split('/')[-1]))
                if repo and repo in file and norm(v['quant']) in file:
                    return m, v
    name = t.get('measured_model') or (Path(t['path']).name if kind == 'llama-bench' else t.get('model')) or ''
    key = norm(base_name(name))
    same = [m for m in catalogue if key and key in (norm(m['id']), norm(m['name']))]
    return (same[0], None) if len(same) == 1 else (None, None)


def search_catalogue(text, catalogue, limit=8):
    """Catalogue models whose name or id contains the typed words, best matches first."""
    words = [norm(w) for w in re.split(r'[\s,/]+', text) if norm(w)]
    scored = []
    for m in catalogue:
        key = norm(m.get('name')) + ' ' + norm(m.get('id'))
        exact = norm(text) in (norm(m.get('id')), norm(m.get('name')))
        if exact or (words and all(w in key for w in words)):
            scored.append((not exact, -(m.get('score') or 0), m))
    return [m for *_, m in sorted(scored, key=lambda x: x[:2])][:limit]


def usable_gb(hw):
    """Memory a model can use: most of a graphics card, or part of RAM (unified memory on a Mac)."""
    if hw.get('vram_gb'): return hw['vram_gb'] * 0.9
    return (hw.get('ram_gb') or 8) * (0.7 if hw.get('os') == 'Darwin' else 0.6)


def install_for(rt):
    """(runtime, official install command) for a runtime this machine lacks, or None."""
    mac, linux = platform.system() == 'Darwin', platform.system() == 'Linux'
    if rt == 'gguf' and (mac or linux): return 'llama.cpp', INSTALL['llama.cpp']
    if rt == 'mlx' and apple_silicon():
        return 'MLX', INSTALL['MLX'] if shutil.which('uv') else f'{UV_INSTALL} && ~/.local/bin/uv tool install mlx-lm'
    if rt == 'ollama' and linux: return 'Ollama', INSTALL['Ollama']
    return None


def ready_runtimes(found):
    ready = set()
    if bench_command(): ready.add('gguf')
    if has(found, 'mlx'): ready.add('mlx')
    if 'ollama' in found and found['ollama'].state == 'found': ready.add('ollama')
    return ready


def gguf_folder():
    return Path(os.environ.get('LLAMA_CACHE') or (Path.home() / ('Library/Caches/llama.cpp' if platform.system() == 'Darwin' else '.cache/llama.cpp')))


def download_target(m, v, found):
    """A test of a catalogue download that isn't on this machine yet: fetched (and its runtime installed) first."""
    ready = ready_runtimes(found)
    label = f'{m["name"]} · {RUNTIME[v["rt"]]} {v["quant"]}'
    prep = []
    if v['rt'] not in ready:
        how = install_for(v['rt'])
        if not how: return None
        prep.append(('install', *how))
    prep.append(('download', v['rt'], v['ref'], v['quant'], v['gb']))
    kind = {'gguf': 'llama-bench', 'mlx': 'mlx', 'ollama': 'ollama'}[v['rt']]
    t = target(kind, 'local', label, model=v['ref'], path=v['ref'] if v['rt'] == 'mlx' else None, size=v['gb'] * 1e9,
               detail=f'{v["gb"]} GB download' + (f' · installs {prep[0][1]} first' if prep[0][0] == 'install' else ''),
               model_id=m['id'], quant=v['quant'], prep=prep, base='http://127.0.0.1:11434')
    return t


def best_variant(m, ready, hw):
    """The download to offer for a model: one that fits, on a runtime you have (llama.cpp first), 4-bit first."""
    fits = [v for v in m.get('variants', []) if v['gb'] <= usable_gb(hw) and not (v['rt'] == 'mlx' and not apple_silicon())]
    order = lambda v: (v['rt'] not in ready, install_for(v['rt']) is None, ['gguf', 'mlx', 'ollama'].index(v['rt']), not re.search(r'(?i)q4|4bit', v['quant']), -v['gb'])
    fits = [v for v in fits if v['rt'] in ready or install_for(v['rt'])]
    return min(fits, key=order) if fits else None


def lmstudio_models():
    """LM Studio's downloaded models: key -> (file name, quantisation), from `lms ls --json`."""
    try:
        rows = json.loads(output(['lms', 'ls', '--json'], timeout=30) or '[]')
    except ValueError:
        return {}
    return {r['modelKey']: (Path(r.get('path', '')).name, ((r.get('quantization') or {}).get('name'))) for r in rows if isinstance(r, dict) and r.get('modelKey')}


def build_choices(found, catalogue, hw):
    """Sections of tests: models already on this machine, models that fit it, and your subscriptions."""
    lms = lmstudio_models() if shutil.which('lms') else {}
    for t in (found['servers'].targets if 'servers' in found else []):
        if t.get('server') == 'LM Studio' and t['model'] in lms:
            t['file'], t['quant'] = lms[t['model']]
            t['measured_model'] = t['file'] or t['model']
    local, unknown = [], []
    for p in found.values():
        for t in p.targets:
            if t['group'] != 'local':
                continue
            m, v = match_model(t, catalogue)
            if m:
                t['quant'] = t.get('quant') or (v or {}).get('quant')
                runtime = {'llama-bench': 'llama.cpp', 'mlx': 'MLX', 'ollama': 'Ollama', 'lmstudio': 'LM Studio'}.get(t['kind'], t.get('server') or t['kind'])
                where = Path(t['path']).name if t['kind'] == 'llama-bench' else t.get('model', '')
                t.update(model_id=m['id'], label=f'{m["name"]} · {runtime}' + (f' {t["quant"]}' if t.get('quant') else ''),
                         detail=' · '.join(x for x in (t.get('detail'), where) if x))
                local.append(t)
            else:
                t['detail'] = (t.get('detail') or '') + ' · not on whatmodel.sh yet, so it can be tested but not uploaded'
                unknown.append(t)
    have = {t['model_id'] for t in local}
    ready = ready_runtimes(found)
    fits, makers = [], set()
    for m in sorted(catalogue, key=lambda m: -(m.get('score') or 0)):  # well-tested models, one per maker
        if m['id'] in have or not m.get('variants') or m.get('n', 0) < 8 or m.get('provider') in makers:
            continue
        v = best_variant(m, ready, hw)
        t = v and download_target(m, v, found)
        if t: fits.append(t); makers.add(m.get('provider'))
        if len(fits) >= 8: break
    agents = [t for p in found.values() for t in p.targets if t['group'] != 'local']
    for t in agents:
        m, _ = match_model(dict(t, kind='agent', measured_model=t.get('model')), catalogue) if t.get('model') else (None, None)
        if m: t['model_id'], t['label'] = m['id'], f'{m["name"]} · {t["label"].split(" · ")[0]}'
    return [('On this machine', local + unknown), ('Fits this machine · downloads first', fits),
            ('Your subscriptions · no extra cost, short capped prompts', [t for t in agents if t['group'] == 'subscription']),
            ('Billed to an API key', [t for t in agents if t['group'] == 'api'])]


def search_add(text, catalogue, found, hw, sections):
    """Add the best download of each model matching the search to an 'Added' section."""
    ready, added = ready_runtimes(found), []
    listed = {t.get('model_id') for _, items in sections for t in items}
    for m in search_catalogue(text, catalogue):
        if m['id'] in listed:
            continue
        v = best_variant(m, ready, hw)
        t = v and download_target(m, v, found)
        if t: added.append(t)
    if added:
        for i, (title, items) in enumerate(sections):
            if title == 'Added from search':
                sections[i] = (title, items + added); break
        else:
            sections.insert(0, ('Added from search', added))
    return added


def choose(sections, catalogue, found, hw):
    """Tick what to test. Models already on this machine start ticked; '/' searches every whatmodel.sh model."""
    picked = {id(t) for title, items in sections if title == 'On this machine' for t in items if t.get('model_id')}
    def rows():
        out = []
        for title, items in sections:
            if items:
                out.append(('header', title)); out += [('item', t) for t in items]
        return out
    if PLAIN or not sys.stdin.isatty() or os.name == 'nt':
        while True:
            items = [r[1] for r in rows() if r[0] == 'item']
            n = 0
            for title, sec in sections:
                if sec: print('  ' + yellow(title))
                for t in sec:
                    n += 1; print(f'  {n:>2}. {t["label"]}  {dim(t.get("detail", ""))}')
            default = ' '.join(str(i) for i, t in enumerate(items, 1) if any(id(t) == p for p in picked))
            answer = ask('Numbers to test, separated by spaces (or type a model name to search whatmodel.sh)', default)
            if answer and not re.fullmatch(r'[\d\s]+', answer):
                added = search_add(answer, catalogue, found, hw, sections)
                print(dim(f'  added {len(added)} match{"es" if len(added) != 1 else ""} at the top (not ticked)') if added else dim('  nothing new that fits this machine matches that'))
                continue
            return [t for i, t in enumerate(items, 1) if str(i) in answer.split()]
    cursor = 0
    def render():
        rs = rows()
        height = max(8, shutil.get_terminal_size((100, 24)).lines - 7)
        start = max(0, min(cursor - height // 2, len(rs) - height))
        out = [bold('Pick what to test') + dim('   ↑/↓ move · space tick · / search all whatmodel.sh models · enter continue · q quit')]
        for i, r in enumerate(rs[start:start + height], start):
            if r[0] == 'header':
                out.append('  ' + yellow(r[1])); continue
            t = r[1]
            line = f'{green("[x]") if id(t) in picked else "[ ]"} {t["label"]}  {dim(t.get("detail", ""))}'
            out.append(('› ' if i == cursor else '  ') + (c('7', ANSI.sub('', line)) if i == cursor and COLOR else line))
        out.append(dim(f'  {len(picked)} selected'))
        return out
    live = Live(render); live.live = True
    rs = rows(); cursor = next((i for i, r in enumerate(rs) if r[0] == 'item'), 0)
    sys.stdout.write('\x1b[?25l')
    try:
        while True:
            live.draw()
            rs = rows()
            key = read_key()
            items_at = [i for i, r in enumerate(rs) if r[0] == 'item']
            if key in ('up', 'k'): cursor = max([i for i in items_at if i < cursor], default=cursor)
            elif key in ('down', 'j'): cursor = min([i for i in items_at if i > cursor], default=cursor)
            elif key == 'space' and cursor in items_at: picked ^= {id(rs[cursor][1])}
            elif key == '/':
                sys.stdout.write('\x1b[?25h'); sys.stdout.flush()
                text = ask('\n  Search whatmodel.sh models (e.g. "qwen 9b", "gemma")')
                if text: search_add(text, catalogue, found, hw, sections)
                live.lines = 0; sys.stdout.write('\x1b[?25l')
                rs = rows(); cursor = next((i for i, r in enumerate(rs) if r[0] == 'item'), 0)
            elif key == 'enter':
                return [r[1] for r in rows() if r[0] == 'item' and id(r[1]) in picked]
            elif key in ('q', 'esc'):
                return []
    finally:
        sys.stdout.write('\x1b[?25h'); sys.stdout.flush()


def command_of(t, tokens):
    """What a test runs, as the user would type it (for the plan)."""
    k = t['kind']
    if k == 'llama-bench':
        path = t.get('path') or str(gguf_folder() / f'<{t["model"]} {t["quant"]}.gguf>')
        return f'{" ".join(t.get("bench") or bench_command() or ["llama-bench"])} -m {path.replace(str(Path.home()), "~")} -p 512 -n {tokens} -r 1 -o json'
    if k == 'mlx': return f'mlx_lm.benchmark --model {str(t["path"]).replace(str(Path.home()), "~")} -p 512 -g {tokens} -n 1'
    if k == 'ollama': return f'POST localhost:11434/api/generate  model {t["model"]}, the gardening prompt, up to {tokens} tokens'
    if k in ('openai', 'lmstudio'): return f'POST {t["base"].replace("http://127.0.0.1", "localhost")}/chat/completions  model {t["model"]}, the gardening prompt, up to {tokens} tokens'
    if k == 'claude': return f'claude -p "{AGENT_PROMPT[:48]}…"' + (f' --model {t["model_flag"]}' if t.get('model_flag') else '') + ' --output-format json --tools ""'
    if k == 'codex': return f'codex exec --sandbox read-only --json "{AGENT_PROMPT[:48]}…"'
    if k == 'gemini': return f'gemini -p "{AGENT_PROMPT[:48]}…" -o json --approval-mode plan'
    if k == 'harness': return f'{t["tool"]} … "{AGENT_PROMPT[:48]}…"'
    return k


def show_plan(selected, runs, warmups, tokens):
    calls = runs + warmups
    print('\n' + bold('Plan') + dim(f'  each test: {warmups} warm-up + {runs} measured, one at a time, shuffled, with random 1-3 s pauses'))
    dl = sum(x[4] for t in selected for x in t.get('prep', []) if x[0] == 'download')
    usd = 0.0
    for t in selected:
        print(f'\n  {bold(t["label"])}')
        for x in t.get('prep', []):
            if x[0] == 'install': print(f'    installs {x[1]} first:  {cyan(x[2])}')
            if x[0] == 'download': print(f'    downloads {x[4]} GB first from ' + (f'huggingface.co/{x[2]}' if x[1] != 'ollama' else f'ollama.com/library/{x[2]}'))
        print(f'    runs {calls}×:  {cyan(command_of(t, tokens))}')
        if t['group'] == 'local':
            print(dim(f'    free · up to {tokens} output tokens per run'))
        else:
            cap = f'stops at {AGENT_TOKEN_CAP:,} tokens in total'
            if t['kind'] == 'claude':
                usd += CLAUDE_USD_PER_CALL * calls; cap += f' or ${CLAUDE_USD_PER_CALL:.2f} per run (at most ${CLAUDE_USD_PER_CALL * calls:.2f} of {"plan usage" if t["group"] == "subscription" else "API spend"})'
            print(dim(f'    {calls} prompts of ~120 words · {cap}' + (' · bills your API account' if t['group'] == 'api' else '')))
    total = [f'{len(selected)} test{"s" if len(selected) != 1 else ""}', f'{len(selected) * calls} runs']
    if dl: total.append(f'{dl:.1f} GB to download')
    if usd: total.append(f'at most ${usd:.2f} of Claude usage')
    print('\n  ' + ' · '.join(total) + dim(' · Ctrl-C stops at any time and keeps finished results'))


def prepare(selected):
    """Install runtimes and download models the plan needs, before anything is timed."""
    for t in list(selected):
        try:
            for x in t.get('prep', []):
                if x[0] == 'install' and not ((x[1] == 'llama.cpp' and bench_command()) or (x[1] == 'MLX' and shutil.which('mlx_lm.benchmark')) or (x[1] == 'Ollama' and shutil.which('ollama'))):
                    print(f'\n  installing {x[1]}:  {cyan(x[2])}')
                    if subprocess.run(['/bin/sh', '-c', x[2]]).returncode: raise RuntimeError(f'{x[1]} did not install')
                if x[0] == 'download':
                    print(f'\n  downloading {t["label"]}')
                    if x[1] == 'gguf':
                        t['path'], t['bench'] = fetch_gguf(x[2], x[3]), bench_command()
                    elif x[1] == 'mlx':
                        subprocess.run(['mlx_lm.generate', '--model', x[2], '--prompt', 'Hi', '--max-tokens', '1'], check=True, stdout=subprocess.DEVNULL)
                    elif x[1] == 'ollama':
                        subprocess.run(['ollama', 'pull', x[2]], check=True)
            t['prep'] = []
        except Exception as e:
            print('  ' + red(f'skipping {t["label"]}: {clean(e, 120)}')); selected.remove(t)
    return selected


def fetch_gguf(repo, quant):
    """Download a GGUF quant (all parts if split) into llama.cpp's cache; returns the first file's path."""
    with urllib.request.urlopen(f'https://huggingface.co/api/models/{repo}/tree/main?recursive=true', timeout=20) as r:
        files = json.loads(r.read(LIMIT))
    want = sorted((f for f in files if f.get('type') == 'file' and f['path'].lower().endswith('.gguf') and 'mmproj' not in f['path'].lower()
                   and norm(quant) in norm(Path(f['path']).name)), key=lambda f: f['path'])
    if not want: raise ValueError(f'{quant} not found in {repo}')
    folder = gguf_folder()
    for f in want:
        dest = folder / Path(f['path']).name
        if not (dest.is_file() and dest.stat().st_size == f.get('size')):
            download(f'https://huggingface.co/{repo}/resolve/main/{f["path"]}', dest, f['size'])
    return str(folder / Path(want[0]['path']).name)


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
                delta = choice.get('delta', {})
                # Reasoning models stream their thinking first; those are generated tokens too.
                if delta.get('content') or delta.get('reasoning_content') or delta.get('reasoning'):
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


def run_mlx(t, tokens, n):
    # mlx_lm.benchmark: synthetic 512-token prompt and `tokens` generated, like llama-bench; it warms up itself.
    with tempfile.TemporaryDirectory(prefix='whatmodel-') as work:
        code, out = run_process(['mlx_lm.benchmark', '--model', t['path'], '-p', '512', '-g', str(tokens), '-n', '1'], work)
    if code: raise RuntimeError('mlx_lm.benchmark failed')
    m = re.search(r'Averages:\s*prompt_tps=([\d.]+),\s*generation_tps=([\d.]+)', out)
    if not m: raise ValueError('no generation measurement')
    return {'gen_tok_s': round(float(m.group(2)), 2), 'prompt_tok_s': round(float(m.group(1)), 2)}


def claude_args(prompt, model=None):
    # No tools, MCP servers, hooks, project settings or saved session: just the model answering.
    return ['claude', '-p', prompt, *(['--model', model] if model else []), '--output-format', 'json', '--tools', '', '--strict-mcp-config',
            '--mcp-config', '{"mcpServers":{}}', '--settings', '{"disableAllHooks":true}', '--setting-sources', '',
            '--no-session-persistence', '--max-budget-usd', str(CLAUDE_USD_PER_CALL)]


def run_claude(t, tokens, n):
    with tempfile.TemporaryDirectory(prefix='whatmodel-') as work:
        code, out = run_process(claude_args(f'Run {n}. ' + AGENT_PROMPT, t.get('model_flag')), work)
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


RUNNERS = {'ollama': run_ollama, 'openai': run_openai, 'lmstudio': run_openai, 'llama-bench': run_llama_bench, 'mlx': run_mlx,
           'claude': run_claude, 'codex': run_codex, 'gemini': run_gemini, 'harness': run_harness}
ENGINES = {'ollama': 'ollama', 'openai': 'openai-compatible', 'lmstudio': 'lm-studio', 'llama-bench': 'llama.cpp', 'mlx': 'mlx-lm',
           'claude': 'claude-code', 'codex': 'codex-cli', 'gemini': 'gemini-cli', 'harness': 'agent-cli'}


# ---------------------------------------------------------------- scheduling and the live run

def schedule(targets, runs, warmups, seed):
    """Warm-ups first, then rounds in a shuffled order, so slow drift (heat, other apps) spreads evenly.
    Each call gets a random pause before it, so nothing lines up with periodic background work."""
    rng = random.Random(seed)
    order = [(t, 0) for t in rng.sample(targets, len(targets)) for _ in range(warmups)]
    for n in range(1, runs + 1):
        order += [(t, n) for t in rng.sample(targets, len(targets))]
    return [(t, n, round(rng.uniform(*PAUSE_S), 2)) for t, n in order]


def cpu_busy(seconds=1.0):
    """Share of the CPU (0-1) in use over `seconds`, measured while no test is running, or None."""
    try:
        if platform.system() == 'Linux':
            def snap():
                v = [int(x) for x in Path('/proc/stat').read_text().splitlines()[0].split()[1:]]
                return sum(v), v[3] + (v[4] if len(v) > 4 else 0)
            t0, i0 = snap(); time.sleep(seconds); t1, i1 = snap()
            return round(1 - (i1 - i0) / max(1, t1 - t0), 3)
        if platform.system() == 'Darwin':
            m = re.findall(r'CPU usage:\s*([\d.]+)% user,\s*([\d.]+)% sys', output(['top', '-l', '2', '-s', str(round(seconds)), '-n', '0'], timeout=seconds + 10))
            return round((float(m[-1][0]) + float(m[-1][1])) / 100, 3) if m else None
    except (OSError, ValueError, IndexError):
        pass
    time.sleep(seconds)
    return None


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
        head = bold('Running') + dim(f'  one at a time, shuffled order and random pauses (seed {seed}) · Ctrl-C stops and keeps finished results')
        foot = f'  {green("▇" * filled)}{dim("░" * (width - filled))} {done}/{total} calls · {int(time.monotonic() - began)}s{eta}'
        return [head] + [jobs[id(t)].row() for t in targets] + [foot]

    with Live(render):
        try:
            for i, (t, n, pause) in enumerate(order):
                current['i'] = i
                job = jobs[id(t)]
                if job.state in ('failed', 'skipped'):
                    continue
                start = time.monotonic()
                busy = cpu_busy(1.0) if pause >= 1 else None
                time.sleep(max(0.0, pause - (time.monotonic() - start)))
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
                    job.samples.append({**{k: v for k, v in sample.items() if not k.startswith('_')}, 'cpu_busy': busy})
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
    busy = [x.get('cpu_busy') for j in jobs for x in j.samples if x.get('cpu_busy') is not None]
    if busy and max(busy) > BUSY_WARN:
        print(yellow(f'\n  Other programs were using up to {max(busy):.0%} of the CPU between tests. Close other apps and run again for steadier numbers.'))
    elif busy:
        print(dim(f'\n  Other programs used at most {max(busy):.0%} of the CPU between tests; order was shuffled with random pauses.'))
    subs = [j for j in jobs if j.t['group'] != 'local' and (j.used_tokens or j.used_usd)]
    if subs:
        print(dim('\n  Subscription use: vendors don’t publish exact plan limits, so we can’t show a share of your plan.'))
        print(dim('  Each tool answered a few ~120-word prompts, like a few short chat messages.'))


def public_report(jobs, tokens, runs, warmups, seed, hw, ids):
    rows = []
    allowed = ('elapsed_s', 'output_tokens', 'reasoning_tokens', 'gen_tok_s', 'prompt_tok_s', 'load_s', 'ttft_s', 'e2e_tok_s', 'cost_usd', 'cpu_busy')
    for job in jobs:
        public_id = ids.get(id(job.t))
        if not public_id or not job.samples:
            continue
        if not re.fullmatch(r'[a-z0-9][a-z0-9.-]{0,79}', public_id):
            raise ValueError('Invalid public model id')
        t = job.t
        row = {'model': public_id, 'engine': ENGINES[t['kind']], 'engine_version': t.get('engine_version'),
               'samples': [{k: v for k, v in x.items() if k in allowed and (v is None or number(v) is not None)} for x in job.samples]}
        if t['group'] == 'local' and t.get('quant'):
            row['quant'] = clean(re.sub(r'[^A-Za-z0-9_.-]', '', str(t['quant'])), 20)  # quantisation changes speed a lot
        if t['kind'] == 'ollama':
            row.update({k: t.get(k) for k in ('params', 'digest')})
        if t['kind'] == 'llama-bench':
            row['file'] = clean(Path(t['path']).name, 120)  # the GGUF's published file name, not its path
        if t['kind'] == 'mlx':
            row['file'] = clean(t['model'].replace('/', '--'), 120)  # the Hugging Face repo, not the local path
        if t['kind'] in ('openai', 'lmstudio') and t.get('file'):
            row['file'] = clean(re.sub(r'[^A-Za-z0-9._+-]', '', t['file']), 120)
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
                         'note': f'one call at a time; shuffled rounds; random {PAUSE_S[0]}-{PAUSE_S[1]} s pauses; warm-ups discarded; one retry per failed call'},
            'hardware': hardware_public, 'results': rows}


REPORTS = Path.home() / '.whatmodel'


def open_upload(report, path):
    """Open a prefilled GitHub issue with the report; the user reads it and presses Submit."""
    body = '### Benchmark results\n\n```json\n' + json.dumps(report, separators=(',', ':')) + '\n```\n\nI reviewed this report and release these measurements under CC0 1.0.\n'
    url = ISSUES + '?' + urllib.parse.urlencode({'title': 'Benchmark measurements', 'body': body})
    if len(url) > 7500:
        url = ISSUES + '?' + urllib.parse.urlencode({'title': 'Benchmark measurements', 'body': 'Report attached. I release these measurements under CC0 1.0.'})
        print(f'The report is too long for a link: attach {path} to the issue.')
    print('Opening GitHub with your results filled in. Read them and press Submit; nothing is sent until you do.')
    if not webbrowser.open(url): print('Open this link:\n' + url)


def upload_later(path):
    return (f'  python3 bench.py --upload {path}\n'
            f'  or: curl -fsSL https://whatmodel.sh/bench.sh | sh -s -- --upload {path}')


def share(jobs, tokens, runs, warmups, seed, hw, catalogue=None):
    measured = [j for j in jobs if j.samples]
    if not measured:
        print('No successful measurements, so there is nothing to upload.'); return
    catalogue = catalogue if catalogue is not None else load_catalogue()
    ids, left_out = {}, []
    for job in measured:
        t = job.t
        model_id = t.get('model_id')
        if not model_id and t.get('measured_model'):  # a subscription tool reports which model answered
            m, _ = match_model(dict(t, kind='agent'), catalogue)
            model_id = m and m['id']
        if model_id: ids[id(t)] = model_id
        else: left_out.append(t['label'])
    report = public_report(jobs, tokens, runs, warmups, seed, hw, ids)
    if not report['results']:
        print('None of these models are on whatmodel.sh yet, so there is nothing to upload.'); return
    names = {m['id']: m['name'] for m in catalogue}
    print('\n' + bold('Upload to whatmodel.sh'))
    for r in report['results']:
        rates = [x.get('gen_tok_s') or x.get('e2e_tok_s') for x in r['samples'] if x.get('gen_tok_s') or x.get('e2e_tok_s')]
        speed = f'{statistics.median(rates):.1f} tok/s' if rates else ''
        print(f'  {names.get(r["model"], r["model"]):<34.34} {r["engine"]:<12} {r.get("quant", ""):<10} {speed}')
    for label in left_out:
        print(dim(f'  left out: {label} (not on whatmodel.sh yet)'))
    print(dim('  Also sent: chip, RAM, OS and runtime versions. Never file paths, host names, prompts or answers.'))
    REPORTS.mkdir(mode=0o700, exist_ok=True)
    path = REPORTS / f'bench-{time.strftime("%Y%m%d-%H%M%S")}.json'
    fd = os.open(path, os.O_CREAT | os.O_WRONLY | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as f: json.dump(report, f, indent=2)
    shown = str(path).replace(str(Path.home()), '~')
    if yes('Upload these results', default=True):
        open_upload(report, shown)
    else:
        print(f'Not uploaded. Your results are saved in {shown}. Upload them any time with:\n' + upload_later(shown))


def upload_saved(path):
    """--upload: open the GitHub draft for a report saved by an earlier run."""
    file = Path(os.path.expanduser(path))
    try:
        report = json.loads(file.read_text())
        assert report.get('schema') == 'whatmodel-bench-v3' and report.get('results')
    except (OSError, ValueError, AssertionError):
        print(f'{path} is not a saved whatmodel bench report.'); return 1
    print(json.dumps(report, indent=2))
    open_upload(report, path)
    return 0


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
    parser.add_argument('--list', action='store_true', help='only show what can be tested, then exit')
    parser.add_argument('--plain', action='store_true', help='print line by line instead of redrawing the screen')
    parser.add_argument('--demo', action='store_true', help='try the interface with simulated models (no calls are made)')
    parser.add_argument('--runs', type=int, default=3, help='measured runs per test, 1-5 (default 3)')
    parser.add_argument('--tokens', type=int, default=256, help='output tokens per local model call, 32-1024 (default 256)')
    parser.add_argument('--upload', metavar='FILE', help='upload results saved by an earlier run')
    args = parser.parse_args()
    PLAIN = args.plain
    if args.upload:
        return upload_saved(args.upload)
    # A closed terminal or kill stops runs like Ctrl-C, so the cleanup below (stopping servers) still happens.
    def stop(signum, frame):
        raise KeyboardInterrupt
    for sig in (signal.SIGTERM, getattr(signal, 'SIGHUP', None)):
        if sig: signal.signal(sig, stop)
    if not 1 <= args.runs <= 5 or not 32 <= args.tokens <= 1024:
        parser.error('--runs must be 1-5 and --tokens 32-1024')
    if not args.list and not sys.stdin.isatty():
        print('Run this from an interactive terminal (or use --list).'); return 1

    print(bold('\nwhatmodel bench') + dim(f' v{VERSION} · speed tests for the models and AI tools on this machine\n'))
    started, lmstudio = None, False
    try:
        if args.demo:
            found, catalogue, hw = {}, [], {'os': 'Darwin', 'arch': 'arm64', 'chip': 'Demo chip', 'ram_gb': 32}
            ts = demo_targets()
            sections = [('On this machine', [t for t in ts if t['group'] == 'local']),
                        ('Your subscriptions · no extra cost, short capped prompts', [t for t in ts if t['group'] != 'local'])]
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
            if 'lmstudio' in found and found['lmstudio'].state == 'note' and not args.list:
                if yes("\nLM Studio is installed but its server isn't running. Start it just for this session"):
                    lmstudio = start_lmstudio()
                    if lmstudio:
                        found['servers'] = Probe('servers', 'Local servers', probe_servers); found['servers'].run()
                        print('  ' + found['servers'].row())
                    else:
                        print(yellow("  Could not start LM Studio's server; open the app once, then try again."))
            catalogue = load_catalogue()
            sections = build_choices(found, catalogue, hw)
            if args.list:
                for title, items in sections:
                    if items: print('\n' + yellow(title))
                    for t in items: print(f'  {t["label"]}  {dim(t.get("detail", ""))}')
                return 0
        print()
        selected = choose(sections, catalogue, found, hw)
        if not selected:
            print('Nothing selected.'); return 0
        warmups = 1
        show_plan(selected, args.runs, warmups, args.tokens)
        if any(t['group'] == 'api' for t in selected):
            print(yellow('  Some tests bill an API key. Untick them unless you mean to pay for this.'))
        if not yes('\nStart', default=True):
            print('Cancelled. Nothing was installed, downloaded or run.'); return 0
        if not args.demo:
            selected = prepare(selected)
            if not selected:
                print('Nothing left to run.'); return 0
        seed = random.randrange(1, 10**6)
        print()
        jobs = run_all(selected, args.runs, warmups, args.tokens, seed)
        summary(jobs)
        if not args.demo:
            share(jobs, args.tokens, args.runs, warmups, seed, hw, catalogue)
        return 0
    finally:
        stop_process(started)
        if lmstudio: output(['lms', 'server', 'stop'], timeout=30)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (KeyboardInterrupt, EOFError):
        sys.stdout.write('\x1b[?25h' if sys.stdout.isatty() else '')
        print('\nCancelled. Nothing was shared.'); sys.exit(130)
