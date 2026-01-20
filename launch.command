#!/bin/bash

# 1. Get the folder where this file lives
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🚀 Starting SetJetter GoWild..."

# 1.5 CLEANUP: Kill any old backend processes holding onto port 5001
# The '2>/dev/null' part hides errors if nothing is running (which is good)
echo "🧹 Cleaning up old processes..."
lsof -ti :5001 | xargs kill -9 2>/dev/null || true

# 2. Start the Backend in the background
echo "--- Starting Backend ---"
cd backend
source venv/bin/activate

# Create logs directory if it doesn't exist
mkdir -p logs

# Run app and redirect all output (errors & info) to backend/logs/backend.log
python3 app.py > logs/backend.log 2>&1 &
BACKEND_PID=$!
# Save the Process ID so we can kill it later

# 3. Give the backend a second to wake up
sleep 2

# 4. Start the Frontend
echo "--- Starting Frontend ---"
cd ..
export NODE_OPTIONS=--openssl-legacy-provider
npm start

# 5. Cleanup: When you close the window, kill the backend too
kill $BACKEND_PID