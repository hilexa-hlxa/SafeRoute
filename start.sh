#!/bin/bash

# SafeRoute Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting SafeRoute..."

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cat > backend/.env << EOF
DATABASE_URL=sqlite+aiosqlite:///./saferoute.db
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
    echo "✅ Backend .env created"
fi

# Check if frontend .env exists
if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend .env file..."
    echo "VITE_API_URL=http://localhost:8000" > frontend/.env
    echo "✅ Frontend .env created"
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Run migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Start backend in background
echo "🚀 Starting backend on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "🚀 Starting frontend on http://localhost:5173"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..

echo ""
echo "✅ SafeRoute is starting!"
echo ""
echo "📍 Backend:  http://localhost:8000"
echo "📍 Frontend: http://localhost:5173"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or run: ./stop.sh"
echo ""
echo "🌐 Open Safari and go to: http://localhost:5173"
echo ""

# Save PIDs to file
echo "$BACKEND_PID $FRONTEND_PID" > .pids

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .pids; exit" INT TERM

wait


