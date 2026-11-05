#!/usr/bin/env bash
#
# bioscope.sh - Professional runner for the Bioscope project.
#
# Usage:
#   ./bioscope.sh <command> [options]
#
# Commands:
#   dev            Run Next.js dev server (pnpm dev)
#   build          Build production bundle (pnpm build)
#   start          Start production server (pnpm start)
#   socket-dev     Run socket server in watch mode
#   socket-build   Build socket server
#   socket-start   Start socket server
#   lint           Lint codebase
#   lint-fix       Lint and auto-fix
#   format         Format codebase
#   type-check     TypeScript type check
#   test           Run tests in watch mode
#   test-run       Run tests once
#   db-generate    Prisma generate
#   db-push        Prisma db push
#   db-migrate     Prisma migrate dev
#   db-studio      Prisma studio
#   db-seed        Seed database
#   e2e            Run Playwright e2e tests
#   clean          Remove .next build cache
#
# tmux options:
#   --tmux, -t            Run the command inside a tmux session
#   --session, -s NAME    tmux session name (default: bioscope)
#   --attach              Attach to session after creating (default true)
#   --no-attach           Do not attach after creating
#   --kill                Kill the named tmux session and exit
#   --attach-only         Attach to an existing session and exit
#   --help, -h            Show this help
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SESSION="bioscope"
TMUX_MODE=0
ATTACH=1
KILL=0
ATTACH_ONLY=0
COMMAND=""

# ---------- argument parsing ----------
args=("$@")
i=0
while [ $i -lt ${#args[@]} ]; do
  a="${args[$i]}"
  case "$a" in
    --tmux|-t) TMUX_MODE=1 ;;
    --session|-s)
      i=$((i+1)); SESSION="${args[$i]:-bioscope}" ;;
    --session=*) SESSION="${a#*=}" ;;
    --attach) ATTACH=1 ;;
    --no-attach) ATTACH=0 ;;
    --kill) KILL=1 ;;
    --attach-only) ATTACH_ONLY=1 ;;
    --help|-h) COMMAND="help" ;;
    dev|build|start|socket-dev|socket-build|socket-start|lint|lint-fix|format|type-check|test|test-run|db-generate|db-push|db-migrate|db-studio|db-seed|e2e|clean|help)
      if [ -z "$COMMAND" ]; then COMMAND="$a"; else echo "Unexpected argument: $a" >&2; exit 2; fi ;;
    *)
      echo "Unknown option/argument: $a" >&2; exit 2 ;;
  esac
  i=$((i+1))
done

[ -z "$COMMAND" ] && COMMAND="help"

# ---------- helpers ----------
log() { printf '\033[1;34m[bioscope]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[bioscope]\033[0m %s\n' "$*" >&2; }

run_pnpm() {
  if ! command -v pnpm >/dev/null 2>&1; then
    err "pnpm not found. Install pnpm first."
    exit 1
  fi
  pnpm "$@"
}

cmd_to_pnpm() {
  case "$1" in
    dev) echo "dev" ;;
    build) echo "build" ;;
    start) echo "start" ;;
    socket-dev) echo "socket:dev" ;;
    socket-build) echo "socket:build" ;;
    socket-start) echo "socket:start" ;;
    lint) echo "lint" ;;
    lint-fix) echo "lint:fix" ;;
    format) echo "format" ;;
    type-check) echo "type-check" ;;
    test) echo "test" ;;
    test-run) echo "test:run" ;;
    db-generate) echo "db:generate" ;;
    db-push) echo "db:push" ;;
    db-migrate) echo "db:migrate" ;;
    db-studio) echo "db:studio" ;;
    db-seed) echo "db:seed" ;;
    e2e) echo "e2e" ;;
    *) echo "" ;;
  esac
}

# ---------- tmux handling ----------
if [ "$KILL" -eq 1 ]; then
  if tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux kill-session -t "$SESSION"
    log "Killed tmux session '$SESSION'."
  else
    log "No tmux session named '$SESSION' running."
  fi
  exit 0
fi

if [ "$ATTACH_ONLY" -eq 1 ]; then
  if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    err "No tmux session named '$SESSION' to attach."
    exit 1
  fi
  exec tmux attach-session -t "$SESSION"
fi

if [ "$COMMAND" = "help" ]; then
  sed -n '1,80p' "$0" | grep -E '^# ' | sed 's/^# //'
  exit 0
fi

# ---------- clean ----------
if [ "$COMMAND" = "clean" ]; then
  log "Removing .next build cache..."
  rm -rf .next
  log "Done."
  exit 0
fi

PNPM_SCRIPT="$(cmd_to_pnpm "$COMMAND")"
if [ -z "$PNPM_SCRIPT" ]; then
  err "Unknown command: $COMMAND"
  exit 2
fi

# ---------- tmux mode ----------
if [ "$TMUX_MODE" -eq 1 ]; then
  if ! command -v tmux >/dev/null 2>&1; then
    err "tmux is not installed. Run: sudo apt-get install -y tmux"
    exit 1
  fi

  if tmux has-session -t "$SESSION" 2>/dev/null; then
    log "tmux session '$SESSION' already exists; reusing."
  else
    log "Creating tmux session '$SESSION' running: pnpm $PNPM_SCRIPT"
    tmux new-session -d -s "$SESSION" -c "$ROOT_DIR" "pnpm $PNPM_SCRIPT; echo; echo '[bioscope] process exited. Press Enter to close.'; read"
  fi

  if [ "$ATTACH" -eq 1 ]; then
    log "Attaching to tmux session '$SESSION' (detach with Ctrl+b then d)."
    exec tmux attach-session -t "$SESSION"
  else
    log "Session '$SESSION' created in background. Attach later with: ./bioscope.sh --attach-only -s $SESSION"
  fi
  exit 0
fi

# ---------- direct run ----------
log "Running: pnpm $PNPM_SCRIPT"
run_pnpm "$PNPM_SCRIPT"
