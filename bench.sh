#!/bin/sh
# whatmodel.sh bench: how fast do the models you already have run on this machine?
#
#   curl -fsSL whatmodel.sh/bench.sh | sh
#   read it first:  curl -fsSL whatmodel.sh/bench.sh -o bench.sh && less bench.sh && sh bench.sh
#
# It reads your CPU/GPU name, RAM, OS version and ollama version, lists the models already
# installed in your local ollama, and times the ones you pick on a fixed prompt. Nothing is
# downloaded or installed, it needs no sudo, and it only talks to your local ollama.
#
# Before timing, it asks whatmodel.sh's database (hosted by Supabase) for a random one-time code.
# That request carries nothing about your machine, though like any web request it shows your IP
# address. The code lets the site check that a submitted result came from a real run.
#
# At the end it prints a link to whatmodel.sh/bench. The results ride in the link's #fragment,
# which browsers never send to a server: the page shows them, and nothing is uploaded unless
# you press submit there.
set -eu

SITE=${WHATMODEL_SITE:-https://whatmodel.sh}
# Public by design: this key can only ask for a one-time code or submit a result.
DB=https://bphtbupywucfbwjncoqb.supabase.co/rest/v1/rpc
DB_KEY=sb_publishable_10R_ZENqtvIKgveIKJUyEw_q18CtwCQ
RUNS=3
TOKENS=256

h=${OLLAMA_HOST:-127.0.0.1:11434}
h=${h#http://}; h=${h#https://}; h=${h%/}
case $h in *:*) ;; *) h=$h:11434 ;; esac
case $h in 0.0.0.0:*) h=127.0.0.1:${h#*:} ;; esac
API=http://$h

die() { printf 'whatmodel bench: %s\n' "$*" >&2; exit 1; }
get() { curl -fsS --max-time 10 "$API$1"; }
post() { curl -fsS --max-time 900 -H 'Content-Type: application/json' -d "$2" "$API$1"; }
num() { sed -n "s/.*\"$1\":\([0-9][0-9.]*\).*/\1/p"; }
str() { sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p"; }
# One line per model object in an ollama list response.
split() { awk '{ gsub(/\{"name":/, "\n&"); print }' | grep '^{"name":' || true; }
# Only plain characters reach the report, so it can't carry markup or break the JSON.
safe() { tr -cd "$1" | cut -c1-80; }
jstr() { if [ -n "$1" ]; then printf '"%s"' "$1"; else printf null; fi; }
jnum() { if [ -n "$1" ]; then printf '%s' "$1"; else printf null; fi; }
# Answers come from the terminal, since stdin is this script when it's piped in. No terminal: take the default.
ask() {
  if { : </dev/tty; } 2>/dev/null; then printf '%s' "$1" >/dev/tty; read -r REPLY </dev/tty || REPLY=; else printf '%s%s\n' "$1" "$2"; REPLY=; fi
  [ -n "$REPLY" ] || REPLY=$2
}

command -v curl >/dev/null 2>&1 || die "needs curl"

os=$(uname -s); cores=; gpus=; vram=; gpu=
case $os in
  Darwin)
    osname=macos; osver=$(sw_vers -productVersion 2>/dev/null || true)
    cpu=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || true); gpu=$cpu; gpus=1
    ram=$(sysctl -n hw.memsize | awk '{ printf "%d", $1 / 1073741824 + 0.5 }')
    cores=$(system_profiler SPDisplaysDataType 2>/dev/null | awk -F': ' '/Total Number of Cores/ { print $2; exit }') ;;
  Linux)
    osname=linux; osver=$(uname -r)
    cpu=$(awk -F': ' '/^model name/ { print $2; exit }' /proc/cpuinfo)
    ram=$(awk '/^MemTotal/ { printf "%d", $2 / 1048576 + 0.5 }' /proc/meminfo)
    if command -v nvidia-smi >/dev/null 2>&1; then
      line=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null | head -1)
      gpu=${line%%,*}; vram=$(printf '%s' "${line##*,}" | awk '{ printf "%d", $1 / 1024 + 0.5 }')
      gpus=$(nvidia-smi -L 2>/dev/null | grep -c '^GPU' || true)
    fi ;;
  *) die "only macOS and Linux (including WSL) are supported for now" ;;
esac
cpu=$(printf '%s' "$cpu" | safe 'A-Za-z0-9 ._()@+-')
gpu=$(printf '%s' "$gpu" | safe 'A-Za-z0-9 ._()@+-')
osver=$(printf '%s' "$osver" | safe 'A-Za-z0-9._+-')
cores=$(printf '%s' "$cores" | safe '0-9')

ver=$(get /api/version 2>/dev/null | str version | safe 'A-Za-z0-9._+-') || true
[ -n "$ver" ] || die "can't reach ollama at $API. Start ollama (the app, or 'ollama serve') and run this again. Only ollama is supported so far."

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT INT TERM
# Skip embedding-only models: they can't generate text.
get /api/tags | split | awk '!/"capabilities":/ || /"completion"/' > "$tmp/tags"
n=$(wc -l < "$tmp/tags" | tr -d ' ')
[ "$n" -gt 0 ] || die "ollama has no text models installed. Pull one (e.g. 'ollama pull qwen3:8b') and run this again."

printf '\nwhatmodel bench · %s · %s GB RAM%s · ollama %s\n\n' "$gpu" "$ram" "${vram:+ · $vram GB VRAM}" "$ver"
i=0
while IFS= read -r l; do
  i=$((i + 1))
  size=$(printf '%s' "$l" | num size | awk '{ printf "%.1f", $1 / 1e9 }')
  printf '  %2d) %-32s %-8s %6s GB\n' "$i" "$(printf '%s' "$l" | str name)" "$(printf '%s' "$l" | str quantization_level)" "$size"
done < "$tmp/tags"
printf '\nEach model takes about a minute. Close other heavy apps for steadier numbers.\n'
ask "benchmark which? numbers separated by spaces, or a for all [a]: " a
case $REPLY in q|Q) exit 0 ;; a|A|all) pick=$(seq 1 "$n") ;; *) pick=$REPLY ;; esac

PROMPT='Write a detailed, practical guide of about 600 words for someone setting up their first home vegetable garden. Cover choosing a sunny site, testing and improving the soil, raised beds versus planting in the ground, which easy crops to start with, spacing, watering on a schedule, mulching, companion planting, dealing with common pests without harsh chemicals, and keeping simple records through the season. Use short sections with plain headings. Background notes: the gardener has a small backyard, about four hours of free time each week, a modest budget, clay soil that drains slowly, a mild climate with a dry summer, curious children who want to help, a compost bin that has never been used, and neighbours who grow tomatoes, beans and pumpkins with mixed success.'

nonce=$(curl -fsS --max-time 10 -X POST -H "apikey: $DB_KEY" -H 'Content-Type: application/json' -d '{}' "$DB/bench_nonce" 2>/dev/null \
  | tr -d '"' | safe 'a-f0-9-') || nonce=
[ -n "$nonce" ] || printf "\n(couldn't get a one-time code from whatmodel.sh, so you'll be able to view these results but not submit them)\n"

rows=
for k in $pick; do
  l=$(sed -n "${k}p" "$tmp/tags" 2>/dev/null) || l=
  [ -n "$l" ] || { printf '  skipping %s: not in the list\n' "$k"; continue; }
  m=$(printf '%s' "$l" | str name | safe 'A-Za-z0-9._:/-')
  digest=$(printf '%s' "$l" | str digest | safe 'a-f0-9')
  quant=$(printf '%s' "$l" | str quantization_level | safe 'A-Za-z0-9_.-')
  params=$(printf '%s' "$l" | str parameter_size | safe 'A-Za-z0-9.')
  bytes=$(printf '%s' "$l" | num size)
  printf '\n  %s: loading…' "$m"
  warm=$(post /api/generate "{\"model\":\"$m\",\"prompt\":\"hi\",\"stream\":false,\"options\":{\"num_predict\":1}}" 2>/dev/null) \
    || { printf ' failed (ollama could not load it)\n'; continue; }
  load=$(printf '%s' "$warm" | num load_duration | awk '{ printf "%.1f", $1 / 1e9 }')
  p=$(get /api/ps | split | grep -F "{\"name\":\"$m\"" || true)
  gpct=$(printf '%s' "$p" | awk -v v="$(printf '%s' "$p" | num size_vram)" -v s="$(printf '%s' "$p" | num size)" \
    'END { if (s > 0 && v != "") printf "%d", 100 * v / s + 0.5 }')
  ctx=$(printf '%s' "$p" | num context_length)
  pts=; pps=; gts=; tgs=; mss=; j=1
  while [ "$j" -le "$RUNS" ]; do
    printf '\r  %s: run %d/%d…   ' "$m" "$j" "$RUNS"
    # "Run N." up front keeps ollama from reusing the previous run's prompt cache.
    r=$(post /api/generate "{\"model\":\"$m\",\"prompt\":\"Run $j. $PROMPT\",\"stream\":false,\"options\":{\"temperature\":0,\"seed\":$j,\"num_predict\":$TOKENS}}") || break
    pc=$(printf '%s' "$r" | num prompt_eval_count); pd=$(printf '%s' "$r" | num prompt_eval_duration)
    ec=$(printf '%s' "$r" | num eval_count); ed=$(printf '%s' "$r" | num eval_duration)
    td=$(printf '%s' "$r" | num total_duration | awk '{ printf "%d", $1 / 1e6 }')
    pts="$pts${pts:+,}$(jnum "$pc")"; gts="$gts${gts:+,}$(jnum "$ec")"; mss="$mss${mss:+,}$(jnum "$td")"
    pps="$pps${pps:+,}$(awk -v c="${pc:-0}" -v d="${pd:-0}" 'BEGIN { if (c > 0 && d > 0) printf "%.1f", c / (d / 1e9); else printf "null" }')"
    tgs="$tgs${tgs:+,}$(awk -v c="${ec:-0}" -v d="${ed:-0}" 'BEGIN { if (c > 0 && d > 0) printf "%.2f", c / (d / 1e9); else printf "null" }')"
    j=$((j + 1))
  done
  [ -n "$tgs" ] || { printf '\r  %s: failed during the run\n' "$m"; continue; }
  mid() { printf '%s\n' "$1" | tr ',' '\n' | grep -v null | sort -n | awk '{ a[NR] = $1 } END { if (NR) print a[int((NR + 1) / 2)] }'; }
  printf '\r  %-32s %-8s %s%% GPU   prompt %s tok/s   generate %s tok/s\n' "$m" "$quant" "${gpct:-?}" "$(mid "$pps")" "$(mid "$tgs")"
  row="{\"model\":$(jstr "$m"),\"digest\":$(jstr "$digest"),\"quant\":$(jstr "$quant"),\"params\":$(jstr "$params"),\"bytes\":$(jnum "$bytes"),\"gpu_pct\":$(jnum "$gpct"),\"ctx\":$(jnum "$ctx"),\"load_s\":$(jnum "$load"),\"prompt_tokens\":[$pts],\"pp\":[$pps],\"gen_tokens\":[$gts],\"tg\":[$tgs],\"ms\":[$mss]}"
  rows="$rows${rows:+,}$row"
  # Free the memory before the next model loads.
  post /api/generate "{\"model\":\"$m\",\"keep_alive\":0}" >/dev/null 2>&1 || true
done
[ -n "$rows" ] || die "no model finished, so there is nothing to report"

json="{\"v\":1,\"at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"nonce\":$(jstr "$nonce"),\"os\":\"$osname\",\"os_version\":$(jstr "$osver"),\"cpu\":$(jstr "$cpu"),\"gpu\":$(jstr "$gpu"),\"gpu_cores\":$(jnum "$cores"),\"gpus\":$(jnum "$gpus"),\"ram_gb\":$(jnum "$ram"),\"vram_gb\":$(jnum "$vram"),\"engine\":\"ollama\",\"engine_version\":$(jstr "$ver"),\"tokens\":$TOKENS,\"runs\":[$rows]}"
code=$(printf '%s' "$json" | base64 | tr -d '\n=' | tr '+/' '-_')
url="$SITE/bench#r=$code"

printf '\nNothing has been sent anywhere. To review these results and choose whether to submit them, open:\n\n  %s\n\n' "$url"
opener=
case $os in
  Darwin) opener=open ;;
  *) [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && command -v xdg-open >/dev/null 2>&1 && opener=xdg-open ;;
esac
if [ -n "$opener" ] && [ -z "${SSH_CONNECTION:-}" ]; then
  ask "open it in your browser now? [Y/n] " y
  case $REPLY in n|N|no) ;; *) "$opener" "$url" >/dev/null 2>&1 || true ;; esac
else
  printf 'No browser here? Copy the link, or paste it into the box at %s/bench\n' "$SITE"
fi
