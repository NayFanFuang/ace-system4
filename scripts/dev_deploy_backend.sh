#!/usr/bin/env bash
# Sync local backend code into the running dev container and restart it.
#
# The backend container has NO host volume mount (see CLAUDE.md), so Python
# edits on the host do not appear inside the container until copied. This
# helper copies the whole app/ tree in one go, restarts, and tails the
# startup logs so schema/seed errors surface immediately.
#
# Usage:
#   scripts/dev_deploy_backend.sh                 # default container name
#   scripts/dev_deploy_backend.sh my-container    # custom container name
#
# Frontend changes do NOT need this — ./frontend is mounted with Vite HMR.
set -euo pipefail

CONTAINER="${1:-ace-system-backend}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker not found on PATH" >&2
  exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "error: container '$CONTAINER' is not running." >&2
  echo "running containers:" >&2
  docker ps --format '  - {{.Names}}' >&2
  exit 1
fi

echo "==> Copying app/ into $CONTAINER:/app/app/ ..."
docker cp app/. "$CONTAINER:/app/app/"

echo "==> Restarting $CONTAINER ..."
docker restart "$CONTAINER" >/dev/null

echo "==> Startup logs (Ctrl-C to stop tailing):"
echo "    PO Collection dashboard lives at  http://localhost:5173/finance/po-tracking"
docker logs -f --tail 40 "$CONTAINER"
