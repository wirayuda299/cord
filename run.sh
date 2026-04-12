#!/bin/bash

echo "🚀 Starting all services..."

# Kill all child processes on Ctrl+C
trap "echo '⛔ Stopping all services...'; kill 0" SIGINT SIGTERM

# start podman
podman start discord redis
# Start Go services
cd backend && gow run cmd/api/main.go &
cd backend && gow run cmd/worker/main.go &

# Start client (adjust to your package manager)
cd client && pnpm run dev &

wait
