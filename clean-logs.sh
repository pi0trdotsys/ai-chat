#!/usr/bin/env bash
# ┌─────────────────────────────────────────────────────┐
# │  Czat bez Filtra · czyszczenie logów                  │
# │  usuwa wpisy pasujące do wzorca + odświeża .log       │
# └─────────────────────────────────────────────────────┘
# Użycie:
#   ./clean-logs.sh                 # domyślny wzorzec nieprzyzwoitych pytań
#   ./clean-logs.sh 'wzor1|wzor2'   # własny wzorzec (regex, pole question)
set -euo pipefail
cd "$(dirname "$0")"

LOGDIR="$(pwd)/logs"
JSONL="$LOGDIR/conversations.jsonl"
READABLE="$LOGDIR/conversations.log"

# Domyślny wzorzec - dopasowanie do pola "question" (case-insensitive)
PATTERN="${1:-masturbac|fantazj|dewiacj|analn|tyłk|stringi|piersi|kuzynk|penis|nerk|organ|mięs|samemu sobie|samym sobie|nóż kuchenny|noz kuchenny}"

# jq: render czytelnej wersji jednej rozmowy (musi odpowiadać formatReadable w backendzie)
JQ_READABLE='
  (.ts | sub("T";" ") | sub("\\..*$";"")) as $d
  | ("═" * 60) + "\n"
  + "🕒 " + $d + "   📦 " + .model + "   🌐 " + (.ip // "-") + "\n\n"
  + "❓ " + .question + "\n\n"
  + "💬 " + (if (.answer // "") == "" then "[BŁĄD: " + (.error // "brak") + "]" else .answer end)
  + ( if .stats then "\n\n📊 " + (.stats.promptTok|tostring) + "→" + (.stats.genTok|tostring) + " tok · " + (.stats.tps|tostring) + " tok/s"
        + ( if .footprint then " · " + ((.footprint.responseTimeMs/1000)|round|tostring) + "s" else "" end)
      else "" end )
  + "\n\n"'

# ── paleta ───────────────────────────────────────
if [ -t 1 ]; then
  R=$'\033[0m'; B=$'\033[1m'; DIM=$'\033[2m'
  CY=$'\033[38;5;51m'; PU=$'\033[38;5;141m'; GR=$'\033[38;5;120m'; RD=$'\033[38;5;203m'; GY=$'\033[38;5;240m'
else
  R= ; B= ; DIM= ; CY= ; PU= ; GR= ; RD= ; GY=
fi

die() { printf "  ${RD}✗ %s${R}\n" "$1"; exit 1; }

command -v jq >/dev/null || die "brak jq - zainstaluj: sudo apt install jq"
[ -f "$JSONL" ] || die "nie znaleziono $JSONL"

clear 2>/dev/null || true
echo
printf "  ${B}${PU}◆ CZYSZCZENIE LOGÓW${R}  ${GY}// $JSONL${R}\n"
printf "  ${GY}─────────────────────────────────────────────${R}\n"
printf "  ${DIM}wzorzec:${R} ${CY}%s${R}\n\n" "$PATTERN"

# ── dry-run ──────────────────────────────────────
MATCHES=$(jq -r --arg p "$PATTERN" 'select(.question|test($p;"i")) | "  • " + (.ts|sub("T";" ")|sub("\\..*$";"")) + "  " + .question' "$JSONL" || true)
COUNT=$(jq -c --arg p "$PATTERN" 'select(.question|test($p;"i"))' "$JSONL" | wc -l | tr -d ' ')
TOTAL=$(wc -l < "$JSONL" | tr -d ' ')

if [ "$COUNT" -gt 0 ]; then
  printf "  ${B}Do usunięcia (%s z %s):${R}\n" "$COUNT" "$TOTAL"
  printf "%s\n\n" "$MATCHES"
else
  printf "  ${GR}Brak pasujących wpisów${R} ${DIM}(odświeżę tylko czytelny log)${R}\n\n"
fi

printf "  ${B}Kontynuować?${R} ${DIM}usunie %s wpisów i przebuduje %s [t/N]${R} " "$COUNT" "conversations.log"
read -r ans
[[ "$ans" =~ ^[tTyY]$ ]] || { echo; printf "  ${GY}Anulowano.${R}\n"; exit 0; }

# ── operacja ─────────────────────────────────────
echo
printf "  ${CY}▸${R} zatrzymuję backend…\n"
docker compose stop backend >/dev/null 2>&1 || true

STAMP=$(date +%Y%m%d-%H%M%S)
printf "  ${CY}▸${R} backup → ${DIM}conversations.jsonl.bak.%s${R}\n" "$STAMP"
sudo cp "$JSONL" "$JSONL.bak.$STAMP"

if [ "$COUNT" -gt 0 ]; then
  printf "  ${CY}▸${R} usuwam %s wpisów z JSONL…\n" "$COUNT"
  jq -c --arg p "$PATTERN" 'select(.question|test($p;"i")|not)' "$JSONL" > "/tmp/conv.clean.$$"
  sudo cp "/tmp/conv.clean.$$" "$JSONL" && rm -f "/tmp/conv.clean.$$"
fi

printf "  ${CY}▸${R} przebudowuję czytelny log…\n"
jq -r "$JQ_READABLE" "$JSONL" > "/tmp/conv.readable.$$"
sudo cp "/tmp/conv.readable.$$" "$READABLE" && rm -f "/tmp/conv.readable.$$"

printf "  ${CY}▸${R} uruchamiam backend…\n"
docker compose start backend >/dev/null 2>&1 || true

NEW=$(wc -l < "$JSONL" | tr -d ' ')
printf "  ${GY}─────────────────────────────────────────────${R}\n"
printf "  ${GR}● gotowe${R}   ${DIM}%s → %s wpisów   ·   backup: conversations.jsonl.bak.%s${R}\n\n" "$TOTAL" "$NEW" "$STAMP"
