#!/bin/bash

# SafeRoute Stop Script

echo "🛑 Stopping SafeRoute servers..."

if [ -f ".pids" ]; then
    PIDS=$(cat .pids)
    kill $PIDS 2>/dev/null
    rm -f .pids
    echo "✅ Servers stopped"
else
    echo "⚠️  No running servers found (or .pids file missing)"
    echo "Trying to kill processes manually..."
    
    # Kill backend
    pkill -f "uvicorn app.main:app" 2>/dev/null
    # Kill frontend
    pkill -f "vite" 2>/dev/null
    
    echo "✅ Done"
fi


