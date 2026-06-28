#!/usr/bin/env bash
# ┌─────────────────────────────────────────────┐
# │  Czat bez Cenzury · clean redeploy           │
# │  ubija aktywne zapytania, stawia świeży stack │
# └─────────────────────────────────────────────┘
set -euo pipefail
cd "$(dirname "$0")"

# ── paleta ───────────────────────────────────────
if [ -t 1 ]; then
  R=$'\033[0m'; DIM=$'\033[2m'; B=$'\033[1m'
  CY=$'\033[38;5;51m'; PU=$'\033[38;5;141m'; GR=$'\033[38;5;120m'; RD=$'\033[38;5;203m'; GY=$'\033[38;5;240m'
else
  R= ; DIM= ; B= ; CY= ; PU= ; GR= ; RD= ; GY=
fi
LOG="$(mktemp)"
SVC=(ollama backend frontend)

rule() { printf "${GY}  ─────────────────────────────────────────────${R}\n"; }

# spinner + krok z pomiarem czasu
step() {
  local label="$1"; shift
  local frames='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏' i=0
  local start; start=$(date +%s.%N)
  ( "$@" >>"$LOG" 2>&1 ) & local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    i=$(( (i + 1) % ${#frames} ))
    printf "\r  ${CY}${frames:$i:1}${R}  ${DIM}%s${R}   " "$label"
    sleep 0.08
  done
  if wait "$pid"; then
    local dur; dur=$(awk "BEGIN{printf \"%.1f\", $(date +%s.%N)-$start}")
    printf "\r  ${GR}▰${R}  %-30s ${GY}%5ss${R}\n" "$label" "$dur"
  else
    printf "\r  ${RD}▰${R}  %-30s ${RD}błąd${R}\n" "$label"
    echo; printf "  ${RD}%s${R}\n" "ostatnie linie logu:"; tail -n 12 "$LOG" | sed "s/^/  ${GY}│ ${R}/"
    rm -f "$LOG"; exit 1
  fi
}

clear 2>/dev/null || true
echo
printf "  ${B}${PU}◆ CZAT BEZ CENZURY${R}  ${GY}// clean redeploy${R}\n"
rule

step "wygaszanie sesji + teardown"  docker compose down --remove-orphans
step "rekompilacja obrazów"         docker compose build
step "rozruch czystego stacku"      docker compose up -d
# czekamy aż backend zamelduje połączenie z modelem
step "zestawianie łącza z modelem"  bash -c 'for i in $(seq 1 40); do curl -sf localhost:3001/api/health >/dev/null && exit 0; sleep 1; done; exit 1'

rule
UP=$(docker compose ps --status running -q 2>/dev/null | wc -l | tr -d ' ')
TOTAL=${#SVC[@]}
printf "  ${GR}● online${R}   ${DIM}%s/%s kontenerów${R}   ${GY}↻ %s${R}\n" "$UP" "$TOTAL" "$(date '+%H:%M:%S')"
printf "  ${PU}→${R} ${DIM}https://chat.prosinski.eu${R}\n"
echo
rm -f "$LOG"
