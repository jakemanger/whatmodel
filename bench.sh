#!/bin/sh
# curl -fsSL https://whatmodel.sh/bench.sh | sh
# Requires Python 3.9+ and curl. Installs or downloads nothing unless you say yes, and never submits automatically.
set -eu
command -v python3 >/dev/null 2>&1 || { echo 'whatmodel bench needs Python 3.9+.' >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo 'whatmodel bench needs curl.' >&2; exit 1; }
python3 -c 'import sys; sys.exit(sys.version_info < (3,9))' || { echo 'Python 3.9+ required.' >&2; exit 1; }
if ! { : </dev/tty; } 2>/dev/null; then echo 'Run this command from an interactive terminal.' >&2; exit 1; fi
bench_tmp=$(mktemp -d)
trap 'rm -rf "$bench_tmp"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
curl -fsSL --proto '=https' --proto-redir '=https' --max-time 60 https://whatmodel.sh/bench.py -o "$bench_tmp/bench.py"
python3 - "$bench_tmp/bench.py" <<'PY'
import hashlib,sys
expected = '3186b224068027f32dee4c9b725cb6fc38a731baa9944fb67d368d8103d2de1d'
if hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest() != expected:
    sys.exit('Benchmark download did not match this launcher. Please download a fresh bench.sh and retry.')
PY
python3 "$bench_tmp/bench.py" "$@" </dev/tty
