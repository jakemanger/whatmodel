#!/bin/sh
# curl -fsSL https://whatmodel.sh/bench.sh | sh
# For macOS and Linux (on Windows, run it inside WSL). Needs curl and Python 3.9+, and offers to set Python up
# with uv when it's missing. Installs or downloads nothing unless you say yes, and never submits automatically.
set -eu
case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN* | Windows*)
    echo 'On Windows, run whatmodel bench inside WSL: run "wsl --install" in PowerShell, restart, then run this command in the Ubuntu app.' >&2
    exit 1 ;;
esac
if ! { : </dev/tty; } 2>/dev/null; then echo 'Run this command from an interactive terminal.' >&2; exit 1; fi
command -v curl >/dev/null 2>&1 || { echo 'whatmodel bench needs curl. Install it with your package manager (for example sudo apt install curl), then run this again.' >&2; exit 1; }

# A Python 3.9 or newer. On a Mac without Apple's command line tools, /usr/bin/python3 is only a placeholder
# that opens an install dialog, so it's skipped.
usable() {
  if [ "$1" = /usr/bin/python3 ] && [ "$(uname -s)" = Darwin ] && ! xcode-select -p >/dev/null 2>&1; then return 1; fi
  "$1" -c 'import sys; sys.exit(sys.version_info < (3, 9))' </dev/null >/dev/null 2>&1
}
find_uv() {
  command -v uv 2>/dev/null && return
  for u in ${XDG_BIN_HOME:+"$XDG_BIN_HOME/uv"} "$HOME/.local/bin/uv" "$HOME/.cargo/bin/uv"; do
    if [ -x "$u" ]; then echo "$u"; return; fi
  done
  return 1
}
uv_python() { UV_PYTHON_PREFERENCE=only-managed "$1" python find '>=3.9' </dev/null 2>/dev/null; }
py=
for c in python3 python; do
  p=$(command -v "$c" 2>/dev/null) || continue
  if usable "$p"; then py=$p; break; fi
done
if [ -z "$py" ]; then
  uv=$(find_uv) || uv=
  if [ -n "$uv" ]; then py=$(uv_python "$uv") || py=; fi
fi
if [ -z "$py" ]; then
  echo "whatmodel bench needs Python 3.9 or newer, and this machine doesn't have it."
  echo "It can set one up for you with uv, Astral's Python installer: about 40 MB, all in your home folder, no admin password."
  echo
  [ -n "$uv" ] || echo '  curl -LsSf https://astral.sh/uv/install.sh | sh'
  echo '  uv python install 3.12'
  echo
  printf 'Run that now? [y/N] '
  read -r answer </dev/tty || answer=
  case "$answer" in
    [Yy]*) ;;
    *) echo 'Nothing was installed. Install Python 3.9 or newer (python.org, Homebrew or your package manager), then run this again.'; exit 1 ;;
  esac
  if [ -z "$uv" ]; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    uv=$(find_uv) || { echo 'uv did not install, so Python could not be set up.' >&2; exit 1; }
  fi
  "$uv" python install 3.12 </dev/null
  py=$(uv_python "$uv") || { echo 'Python did not install.' >&2; exit 1; }
  printf '\nPython is ready. Starting the bench.\n'
fi

bench_tmp=$(mktemp -d)
trap 'rm -rf "$bench_tmp"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
curl -fsSL --proto '=https' --proto-redir '=https' --max-time 60 https://whatmodel.sh/bench.py -o "$bench_tmp/bench.py"
"$py" - "$bench_tmp/bench.py" <<'PY'
import hashlib,sys
expected = '126e2ac1c8dfc03e6d3eb1250e678aff601aa68e51110657d70d9c86e48345e3'
if hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest() != expected:
    sys.exit('Benchmark download did not match this launcher. Please download a fresh bench.sh and retry.')
PY
"$py" "$bench_tmp/bench.py" "$@" </dev/tty
