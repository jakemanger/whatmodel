#!/bin/sh
# curl -fsSL https://whatmodel.sh/bench.sh | sh
# Requires Python 3.9+ and curl. No sudo, pip installs, model downloads or auto-submission.
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
expected = 'daf864b70908a8662a160822be409e418444d3a6aa30f7acae3aaca32003ad0b'
if hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest() != expected:
    sys.exit('Benchmark download did not match this launcher. Please download a fresh bench.sh and retry.')
PY
python3 "$bench_tmp/bench.py" "$@" </dev/tty
