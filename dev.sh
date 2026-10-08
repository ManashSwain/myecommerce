#!/usr/bin/env bash
#
# Start the server, client and admin together in one terminal.
#
#   ./dev.sh            # start all three
#   ./dev.sh server     # start only the server
#   ./dev.sh client     # start only the client
#   ./dev.sh admin      # start only the admin
#
# Press Ctrl+C once to stop everything.
#
# This is a fallback that requires NO extra installs. If you prefer, you can
# instead use the root package.json (`npm install && npm run dev`) which uses
# `concurrently` and gives the same experience.

set -euo pipefail

# Always run from the folder this script lives in, so `npm --prefix` paths
# resolve correctly no matter where the script is invoked from.
cd "$(dirname "$0")"

# Make sure each app has its dependencies installed.
for dir in server client admin; do
  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing dependencies for $dir..."
    npm --prefix "$dir" install
  fi
done

# Track background PIDs so Ctrl+C can clean them all up.
pids=()
cleanup() {
  echo ""
  echo "Shutting down..."
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

start_server() {
  echo "Starting server (http://localhost:3000)..."
  npm --prefix server run dev &
  pids+=($!)
}

start_client() {
  echo "Starting client (Vite)..."
  npm --prefix client run dev &
  pids+=($!)
}

start_admin() {
  echo "Starting admin (Vite)..."
  npm --prefix admin run dev &
  pids+=($!)
}

target="${1:-all}"
case "$target" in
  all)
    start_server
    start_client
    start_admin
    ;;
  server) start_server ;;
  client) start_client ;;
  admin) start_admin ;;
  *)
    echo "Unknown target: $target"
    echo "Usage: ./dev.sh [all|server|client|admin]"
    exit 1
    ;;
esac

# Wait for all background jobs (until Ctrl+C).
wait
