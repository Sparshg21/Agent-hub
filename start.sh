#!/bin/bash
set -e

echo ""
echo "  ⚡ AgentHub — Starting up..."
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
  echo "  ❌ Python not found. Install from https://python.org"; exit 1
fi
if ! command -v node &>/dev/null; then
  echo "  ❌ Node.js not found. Install from https://nodejs.org"; exit 1
fi

PYTHON=$(command -v python3 || command -v python)

# ── API Key setup ────────────────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
fi

if ! grep -q "sk-ant-" backend/.env 2>/dev/null; then
  echo "  🔑 Enter your Anthropic API key (from https://console.anthropic.com):"
  read -r API_KEY
  # Replace the placeholder line
  sed -i.bak "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$API_KEY|" backend/.env
  rm -f backend/.env.bak
  echo "  ✅ API key saved to backend/.env"
  echo ""
fi

# ── Backend setup ────────────────────────────────────────────────────────────
echo "  📦 Setting up backend..."
cd backend

if [ ! -d venv ]; then
  $PYTHON -m venv venv
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

pip install -q -r requirements.txt

echo "  ✅ Backend ready"

# Start backend in background
uvicorn main:app --port 8000 &
BACKEND_PID=$!
cd ..

# ── Frontend setup ───────────────────────────────────────────────────────────
echo "  📦 Setting up frontend..."
cd frontend

if [ ! -d node_modules ]; then
  npm install --silent
fi

echo "  ✅ Frontend ready"
echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 AgentHub is running!"
echo "  👉 Open: http://localhost:5173"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

# Start frontend (foreground — Ctrl+C stops everything)
trap "kill $BACKEND_PID 2>/dev/null; echo ''; echo '  👋 AgentHub stopped.'; exit 0" INT TERM
npm run dev -- --open

kill $BACKEND_PID 2>/dev/null
