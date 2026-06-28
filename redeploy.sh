#!/usr/bin/env bash
# ┌─────────────────────────────────────────────┐
# │  Bez Filtra · clean redeploy                │
# │  ubija aktywne zapytania, stawia świeży stack │
# └─────────────────────────────────────────────┘
set -euo pipefail
cd "$(dirname "$0")"

# ── konfiguracja projektu ────────────────────────
DOMAIN="bezfiltra.beer"
SVC=(ollama backend frontend)

# ── synchronizacja kodu ──────────────────────────
# git pull może podmienić ten skrypt w locie, więc po pobraniu
# re-exec'ujemy świeżą wersję (BF_REEXEC chroni przed pętlą).
if [ "${BF_REEXEC:-}" != 1 ] && [ "${BF_NOPULL:-}" != 1 ]; then
  C=$'\033[38;5;51m'; X=$'\033[38;5;203m'; Z=$'\033[0m'; D=$'\033[2m'
  printf "\n  ${C}⟳${Z}  synchronizacja kodu…\n"
  BR=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)
  if ! git fetch origin "$BR" >/dev/null 2>&1; then
    printf "  ${X}✗${Z}  git fetch nieudany - sprawdź sieć/repozytorium.\n"; exit 1
  fi
  # Lokalne zmiany w śledzonych plikach (np. po ręcznych edycjach na serwerze)
  # chowamy do stash jako backup, a drzewo twardo równamy do origin - deploy
  # zawsze ląduje czysto i nigdy nie blokuje się na konflikcie.
  if ! git diff --quiet || ! git diff --cached --quiet; then
    printf "  ${D}  wykryto lokalne zmiany - chowam do stash (backup)…${Z}\n"
    git stash push -u -m "redeploy-autostash-$(date +%F_%H-%M-%S)" >/dev/null 2>&1 || true
  fi
  git reset --hard "origin/$BR" >/dev/null
  printf "  ${C}⟳${Z}  kod zrównany z origin/${BR}\n"
  exec env BF_REEXEC=1 bash "$0" "$@"
fi

# ── paleta hyper-tech ────────────────────────────
if [ -t 1 ]; then
  R=$'\033[0m'; DIM=$'\033[2m'; B=$'\033[1m'
  CY=$'\033[38;5;51m'; PU=$'\033[38;5;141m'; GR=$'\033[38;5;120m'; RD=$'\033[38;5;203m'; GY=$'\033[38;5;240m'
else
  R=; DIM=; B=; CY=; PU=; GR=; RD=; GY=
fi
LOG="$(mktemp)"

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

# ── tryb konserwacji (markowa strona 503 na czas przebudowy) ──
MAINT_NAME="bf-maintenance"
maint_up() {
  docker compose stop frontend 2>/dev/null || true
  docker rm -f "$MAINT_NAME" 2>/dev/null || true
  docker run -d --name "$MAINT_NAME" -p 5173:80 \
    -v "$(pwd)/maintenance/index.html:/usr/share/nginx/html/index.html:ro" \
    -v "$(pwd)/maintenance/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:alpine
}
maint_down() { docker rm -f "$MAINT_NAME" 2>/dev/null || true; }

# Awaryjne przywrócenie: gdyby coś padło w trakcie, zdejmij stronę konserwacji
# i postaw stack ze starych (działających) obrazów.
trap 'maint_down; docker compose up -d >/dev/null 2>&1 || true' EXIT

clear 2>/dev/null || true
echo
printf "  ${B}${PU}◆ BEZ FILTRA${R}  ${GY}// 14B Engine · bez cenzury${R}\n"
rule

step "tryb konserwacji ON (503)"    maint_up
step "wygaszanie sesji + teardown"  docker compose down --remove-orphans
step "rekompilacja obrazów"         docker compose build
step "tryb konserwacji OFF"         maint_down
step "rozruch czystego stacku"      docker compose up -d
# czekamy aż backend zamelduje połączenie z modelem Qwen 14B
step "zestawianie łącza z modelem"  bash -c 'for i in $(seq 1 40); do curl -sf localhost:3001/api/health >/dev/null && exit 0; sleep 1; done; exit 1'

rule
UP=$(docker compose ps --status running -q 2>/dev/null | wc -l | tr -d ' ')
TOTAL=${#SVC[@]}
printf "  ${GR}● online${R}   ${DIM}%s/%s kontenerów${R}   ${GY}↻ %s${R}\n" "$UP" "$TOTAL" "$(date '+%H:%M:%S')"
printf "  ${PU}→${R} ${DIM}https://%s${R}\n" "$DOMAIN"
echo
rm -f "$LOG"
