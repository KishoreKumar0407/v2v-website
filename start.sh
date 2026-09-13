#!/bin/bash
export PORT=3001
nohup node index.cjs > /tmp/backend.log 2>&1 &
echo "Backend PID: $!"
nohup npx vite --port 5173 > /tmp/vite.log 2>&1 &
echo "Vite PID: $!"
sleep 5
echo "=== BACKEND ==="
cat /tmp/backend.log
echo "=== VITE ==="
cat /tmp/vite.log
echo "=== ALL DONE ==="
