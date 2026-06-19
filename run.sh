#!/usr/bin/env bash

set -Eeuo pipefail

# ─────────────────────────────────────────────
#  Colors & Styles
# ─────────────────────────────────────────────
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"

BLACK="\033[30m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"
WHITE="\033[37m"

BG_BLUE="\033[44m"
BG_MAGENTA="\033[45m"
BG_CYAN="\033[46m"

# ─────────────────────────────────────────────
#  State
# ─────────────────────────────────────────────
PIDS=()
SPINNER_PID=""
LOG_DIR="/tmp/cord-logs"
mkdir -p "$LOG_DIR"

# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────
print_banner() {
    echo ""
    echo -e "${BOLD}${MAGENTA}  ██████╗ ██████╗ ██████╗ ██████╗ ${RESET}"
    echo -e "${BOLD}${MAGENTA} ██╔════╝██╔═══██╗██╔══██╗██╔══██╗${RESET}"
    echo -e "${BOLD}${CYAN} ██║     ██║   ██║██████╔╝██║  ██║${RESET}"
    echo -e "${BOLD}${CYAN} ██║     ██║   ██║██╔══██╗██║  ██║${RESET}"
    echo -e "${BOLD}${BLUE} ╚██████╗╚██████╔╝██║  ██║██████╔╝${RESET}"
    echo -e "${BOLD}${BLUE}  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ${RESET}"
    echo ""
    echo -e "  ${DIM}${WHITE}Dev environment launcher${RESET}"
    echo ""
}

print_divider() {
    echo -e "${DIM}${BLUE}  ────────────────────────────────────────────────────${RESET}"
}

log_step() {
    echo -e "  ${BOLD}${CYAN}→${RESET}  $1"
}

log_ok() {
    echo -e "  ${GREEN}✔${RESET}  $1"
}

log_warn() {
    echo -e "  ${YELLOW}⚠${RESET}  $1"
}

log_error() {
    echo -e "  ${RED}✖${RESET}  $1"
}

log_section() {
    echo ""
    echo -e "  ${BOLD}${BG_BLUE}${WHITE}  $1  ${RESET}"
    echo ""
}

# Spinner: runs in background, call stop_spinner to kill it
start_spinner() {
    local msg="$1"
    local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    (
        local i=0
        while true; do
            printf "\r  ${CYAN}${frames[$i]}${RESET}  ${DIM}%s${RESET}" "$msg"
            i=$(( (i + 1) % ${#frames[@]} ))
            sleep 0.08
        done
    ) &
    SPINNER_PID=$!
}

stop_spinner() {
    if [[ -n "$SPINNER_PID" ]] && kill -0 "$SPINNER_PID" 2>/dev/null; then
        kill "$SPINNER_PID" 2>/dev/null || true
        wait "$SPINNER_PID" 2>/dev/null || true
        SPINNER_PID=""
    fi
    printf "\r\033[2K"  # clear the spinner line
}

# ─────────────────────────────────────────────
#  Cleanup
# ─────────────────────────────────────────────
cleanup() {
    stop_spinner
    echo ""
    print_divider
    echo -e "  ${BOLD}${RED}⛔  Shutting down all services...${RESET}"
    print_divider

    for pid in "${PIDS[@]:-}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    start_spinner "Stopping containers..."
    podman stop postgres redis >/dev/null 2>&1 || true
    stop_spinner
    log_ok "Containers stopped"

    echo ""
    echo -e "  ${DIM}Goodbye! 👋${RESET}"
    echo ""
    exit 0
}

trap cleanup SIGINT SIGTERM

# ─────────────────────────────────────────────
#  Port cleaner
# ─────────────────────────────────────────────
kill_port() {
    local port="$1"
    local pids
    pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)

    if [[ -n "$pids" ]]; then
        log_warn "Port ${BOLD}$port${RESET}${YELLOW} already in use — freeing it..."
        echo "$pids" | xargs -r kill -9
        log_ok "Port $port freed"
    fi
}

# ─────────────────────────────────────────────
#  Service launcher
# ─────────────────────────────────────────────
start_service() {
    local name="$1"
    local dir="$2"
    local logfile="$3"
    shift 3

    (
        cd "$dir"
        "$@" >> "$logfile" 2>&1
    ) &

    PIDS+=("$!")
    log_ok "${BOLD}$name${RESET} started ${DIM}(PID $! → $logfile)${RESET}"
}

# ─────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────
clear
print_banner
print_divider

# --- Ports ---
log_section "🧹 Cleaning Ports"
kill_port 5173
kill_port 3000
kill_port 8080
kill_port 8000

# --- Containers ---
log_section "🐳 Containers"

start_spinner "Restarting postgres & redis..."
podman stop postgres redis >/dev/null 2>&1 || true
podman start postgres redis >/dev/null 2>&1
stop_spinner
log_ok "postgres started"
log_ok "redis started"

# --- Services ---
log_section "⚙️  Services"

# Ensure typical Go installation bin paths are in PATH
export PATH="$PATH:$HOME/go/bin:/usr/local/go/bin"

# Determine Go runner (use gow if available, fallback to go)
if command -v gow >/dev/null 2>&1; then
    GO_RUNNER="gow"
    log_ok "Using ${BOLD}gow${RESET} for hot-reloading backend services"
else
    log_warn "${BOLD}gow${RESET} not found. Running with standard ${BOLD}go${RESET} (no auto-reload)."
    log_step "To enable auto-reload, run: ${CYAN}go install github.com/mitranim/gow@latest${RESET}"
    GO_RUNNER="go"
fi

start_service "Backend API    " "backend" "$LOG_DIR/backend-api.log"    $GO_RUNNER run cmd/api/main.go
start_service "Backend Worker " "backend" "$LOG_DIR/backend-worker.log" $GO_RUNNER run cmd/worker/main.go
start_service "Frontend Client" "client"  "$LOG_DIR/frontend.log"        pnpm run dev

# --- ngrok ---
log_section "🌐 ngrok Tunnel"

log_step "Launching ngrok on port ${BOLD}8080${RESET}..."

podman run --net=host -d \
    -e NGROK_AUTHTOKEN=29KCw1McLRinJcMWuWiIbUJA5hF_2FHVdoSVXap5Cgd66cBPn \
    --name ngrok_tunnel \
    --rm \
    ngrok/ngrok:latest http --url=enough-foal-definitely.ngrok-free.app 3000 \
    >/dev/null 2>&1 || true

start_spinner "Waiting for ngrok tunnel to be ready..."

NGROK_URL=""
for i in $(seq 1 30); do
    sleep 1
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
        | grep -o '"public_url":"https://[^"]*"' \
        | head -1 \
        | sed 's/"public_url":"//;s/"//g') || true

    if [[ -n "$NGROK_URL" ]]; then
        break
    fi
done

stop_spinner

if [[ -n "$NGROK_URL" ]]; then
    log_ok "Tunnel is live!"
else
    log_warn "Could not fetch ngrok URL. Check ${CYAN}http://localhost:4040${RESET}${YELLOW} manually."
    NGROK_URL="http://localhost:4040  (check manually)"
fi

# ─────────────────────────────────────────────
#  Summary Dashboard
# ─────────────────────────────────────────────
echo ""
print_divider
echo ""
echo -e "  ${BOLD}${WHITE}📋  Service Dashboard${RESET}"
echo ""
echo -e "  ${DIM}Service            URL${RESET}"
echo -e "  ${DIM}─────────────────────────────────────────────────────${RESET}"
echo -e "  ${GREEN}●${RESET} Frontend         ${CYAN}http://localhost:3000${RESET}"
echo -e "  ${GREEN}●${RESET} Backend API      ${CYAN}http://localhost:8080${RESET}"
echo -e "  ${GREEN}●${RESET} ngrok Inspector  ${CYAN}http://localhost:4040${RESET}"
echo ""
echo -e "  ${BOLD}${MAGENTA}🔗  Clerk Webhook URL (register this in Clerk Dashboard)${RESET}"
echo -e "  ${BOLD}${YELLOW}  ${NGROK_URL}/api/webhook${RESET}"
echo ""
echo -e "  ${BOLD}${WHITE}📄  Log Files${RESET}"
echo -e "  ${DIM}─────────────────────────────────────────────────────${RESET}"
echo -e "  ${CYAN}Backend API   ${RESET} $LOG_DIR/backend-api.log"
echo -e "  ${CYAN}Backend Worker${RESET} $LOG_DIR/backend-worker.log"
echo -e "  ${CYAN}Frontend      ${RESET} $LOG_DIR/frontend.log"
echo ""
print_divider
echo ""
echo -e "  ${BOLD}${GREEN}▶  Streaming live logs below (Ctrl+C to stop all)${RESET}"
echo ""

# Stream all logs live with colored prefixes
tail -F \
    --pid="$$" \
    -q \
    "$LOG_DIR/backend-api.log" \
    "$LOG_DIR/backend-worker.log" \
    "$LOG_DIR/frontend.log" 2>/dev/null | awk '
    /^./ {
        print "  " $0
    }
' &

wait
