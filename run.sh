#!/usr/bin/env bash

set -Eeuo pipefail

PIDS=()

cleanup() {
    echo ""
    echo "⛔ Stopping all services..."

    for pid in "${PIDS[@]:-}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    podman stop postgres redis >/dev/null 2>&1 || true

    exit 0
}

trap cleanup SIGINT SIGTERM

kill_port() {
    local port="$1"

    local pids
    pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)

    if [[ -n "$pids" ]]; then
        echo "⚠️ Port $port is used by PID(s): $pids"
        echo "$pids" | xargs -r kill -9
        echo "✅ Killed process on port $port"
    fi
}

start_service() {
    local name="$1"
    local dir="$2"
    shift 2

    echo "🚀 Starting $name..."

    (
        cd "$dir"
        "$@"
    ) &

    PIDS+=("$!")
}

echo "🧹 Cleaning used ports..."

# Frontend Vite
kill_port 5173

# Common backend ports, adjust kalau backend-mu pakai port lain
kill_port 3000
kill_port 8080
kill_port 8000

echo "🐳 Restarting containers..."

podman stop postgres redis >/dev/null 2>&1 || true
podman start postgres redis

echo "🚀 Starting services..."

start_service "backend API" "backend" go run cmd/api/main.go
start_service "backend worker" "backend" go run cmd/worker/main.go
start_service "frontend client" "client" pnpm run dev

echo ""
echo "✅ All services started."
echo "Press Ctrl+C to stop."
echo ""

wait
