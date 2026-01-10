#!/bin/bash

# 1. Get the folder where this file lives
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🚀 Starting SetJetter GoWild..."

# 2. Start the Backend in the background
echo "--- Starting Backend ---"
cd backend
source venv/bin/activate
python3 app.py &
BACKEND_PID=$! # Save the Process ID so we can kill it later

# 3. Give the backend a second to wake up
sleep 2

# 4. Start the Frontend
echo "--- Starting Frontend ---"
cd ..
export NODE_OPTIONS=--openssl-legacy-provider
npm start

# 5. Cleanup: When you close the window, kill the backend too
kill $BACKEND_PID