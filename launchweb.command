#!/bin/bash
set -e

# =========================================================
# SetJet: Local + Mobile (ngrok) Launcher
# - Starts Flask backend on :5001
# - Starts CRA frontend on :3000 (with OpenSSL legacy flag)
# - Starts ONE ngrok tunnel for the frontend (port 3000)
# - Opens the ngrok URL on your Mac (copy/paste to phone)
#
# IMPORTANT ONE-TIME SETUP:
# - package.json contains:  "proxy": "http://127.0.0.1:5001"
# - frontend fetch calls use relative paths like: fetch("/api/login")
# =========================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🚀 Starting SetJet (backend + frontend + ngrok)..."

echo "🧹 Cleaning up old processes..."
lsof -ti :5001 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :4040 | xargs kill -9 2>/dev/null || true
pkill ngrok 2>/dev/null || true

if ! command -v ngrok >/dev/null 2>&1; then
  echo "❌ ngrok is not installed."
  echo "   Install: brew install ngrok/ngrok/ngrok"
  exit 1
fi

NGROK_GLOBAL_CFG="$HOME/Library/Application Support/ngrok/ngrok.yml"
if ! ngrok config check --config "$NGROK_GLOBAL_CFG" >/dev/null 2>&1; then
  echo "❌ ngrok is not configured (authtoken/account)."
  echo "   Run: ngrok config add-authtoken YOUR_TOKEN"
  exit 1
fi

echo "--- Starting Backend (Flask :5001) ---"
cd "$DIR/backend"
mkdir -p logs

if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
else
  echo "❌ backend/venv/bin/activate not found. Create your venv first."
  exit 1
fi

python3 app.py > logs/backend.log 2>&1 &
BACKEND_PID=$!

sleep 1

echo "--- Starting Frontend (CRA :3000) ---"
cd "$DIR"
export NODE_OPTIONS=--openssl-legacy-provider

mkdir -p logs
export DANGEROUSLY_DISABLE_HOST_CHECK=true
export HOST=0.0.0.0
npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to be reachable at http://127.0.0.1:3000 ..."
for i in {1..90}; do
  if curl -s -I http://127.0.0.1:3000 >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend exited unexpectedly. Last 80 lines of logs/frontend.log:"
    tail -n 80 "$DIR/logs/frontend.log" || true
    exit 1
  fi
  sleep 1
done

echo "--- Starting ngrok (frontend only) ---"
NGROK_LOG="$DIR/logs/ngrok.log"
: > "$NGROK_LOG"

ngrok http 3000 --log=stdout > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

echo "⏳ Waiting for ngrok to publish a public URL..."
for i in {1..60}; do
  if ! kill -0 $NGROK_PID 2>/dev/null; then
    echo "❌ ngrok exited unexpectedly. Last 80 lines of logs/ngrok.log:"
    tail -n 80 "$NGROK_LOG" || true
    exit 1
  fi
  if curl -s http://127.0.0.1:4040/api/tunnels | grep -q "public_url"; then
    break
  fi
  sleep 0.5
done

TUNNELS_JSON="$(curl -s http://127.0.0.1:4040/api/tunnels || true)"
if [ -z "$TUNNELS_JSON" ]; then
  echo "❌ Could not reach ngrok API at 127.0.0.1:4040."
  echo "   Last 80 lines of logs/ngrok.log:"
  tail -n 80 "$NGROK_LOG" || true
  exit 1
fi

PUBLIC_URL="$(python3 - <<'PY'
import json,sys
d=json.loads(sys.stdin.read() or "{}")
tunnels=d.get("tunnels",[])
if tunnels:
    print(tunnels[0].get("public_url",""))
PY
<<< "$TUNNELS_JSON")"

if [ -z "$PUBLIC_URL" ]; then
  echo "❌ ngrok started but no public_url found."
  echo "   Open the dashboard: http://127.0.0.1:4040"
  exit 1
fi

echo ""
echo "✅ Frontend Public URL (open this on your phone Safari):"
echo "   $PUBLIC_URL"
echo ""
echo "ℹ️  ngrok dashboard: http://127.0.0.1:4040"
echo "ℹ️  backend log:     $DIR/backend/logs/backend.log"
echo "ℹ️  frontend log:    $DIR/logs/frontend.log"
echo "ℹ️  ngrok log:       $DIR/logs/ngrok.log"
echo ""

open "$PUBLIC_URL" >/dev/null 2>&1 || true

cleanup() {
  echo ""
  echo "🧹 Shutting down..."
  kill $NGROK_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  kill $BACKEND_PID 2>/dev/null || true
}
trap cleanup EXIT

echo "🟢 Running. Leave this window open. (Press Ctrl+C to stop.)"
while true; do sleep 1; done
