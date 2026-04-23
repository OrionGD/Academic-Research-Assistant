#!/bin/bash
# ARAS Platform Startup Script

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ARAS - AI-Powered Academic Business Intelligence Platform     ║"
echo "║  Startup Script                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Please create a .env file with the required configuration."
    echo "See PRODUCTION_README.md for configuration details."
    exit 1
fi

echo "✓ .env file found"
echo ""

# Start Backend
echo "Starting Backend Server..."
echo "================================"
cd backend

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Checking dependencies..."
pip install -r requirements.txt -q

# Run the backend
echo "Starting FastAPI server on port 5000..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Failed to start backend server"
    exit 1
fi

# Start Frontend
echo "Starting Frontend Development Server..."
echo "================================"
cd ../frontend

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    kill $BACKEND_PID
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

# Run the frontend
echo "Starting Vite development server on port 5173..."
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"
echo ""

# Display startup information
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ARAS Platform is Ready!                                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:5173                              ║"
echo "║  Backend:   http://localhost:5000                              ║"
echo "║  API Docs:  http://localhost:5000/docs                         ║"
echo "║  Health:    http://localhost:5000/health                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Press Ctrl+C to stop both servers                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✓ All servers stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
