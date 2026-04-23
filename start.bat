@echo off
REM ARAS Platform Startup Script for Windows

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ARAS - AI-Powered Academic Business Intelligence Platform     ║
echo ║  Startup Script ^(Windows^)                                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found!
    echo Please create a .env file with the required configuration.
    echo See PRODUCTION_README.md for configuration details.
    pause
    exit /b 1
)

echo ✓ .env file found
echo.

REM Start Backend
echo Starting Backend Server...
echo ================================
cd backend

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Checking dependencies...
pip install -r requirements.txt -q

REM Run the backend in a new window
echo Starting FastAPI server on port 5000...
start "ARAS Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 5000"
echo ✓ Backend started in new window
timeout /t 3 /nobreak
echo.

REM Start Frontend
echo Starting Frontend Development Server...
echo ================================
cd ..\frontend

REM Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install
)

REM Run the frontend in a new window
echo Starting Vite development server on port 5173...
start "ARAS Frontend" cmd /k "npm run dev"
echo ✓ Frontend started in new window
echo.

REM Display startup information
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ARAS Platform is Ready!                                       ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  Frontend:  http://localhost:5173                              ║
echo ║  Backend:   http://localhost:5000                              ║
echo ║  API Docs:  http://localhost:5000/docs                         ║
echo ║  Health:    http://localhost:5000/health                       ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  Close the command windows when done                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

pause
