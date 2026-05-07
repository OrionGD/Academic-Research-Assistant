@echo off
setlocal enabledelayedexpansion

REM ScholarAI - Advanced Research Analysis System
REM Startup Script (Windows)

set VERSION=1.2.0
set LOG_PREFIX=[ScholarAI]

echo.
echo    ***************************************************
echo    *  ScholarAI - Advanced Research Analysis System  *
echo    *  System Version: %VERSION%                     *
echo    *  Diagnostic Startup Protocol Initialized         *
echo    ***************************************************
echo.

REM --- STEP 1: ENVIRONMENT DIAGNOSTICS ---
echo %LOG_PREFIX% [1/4] Running Environment Diagnostics...

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %LOG_PREFIX% ERROR: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo %LOG_PREFIX% Found Node.js: %NODE_VERSION%

REM Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo %LOG_PREFIX% ERROR: Python is not installed or not in PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo %LOG_PREFIX% Found %PYTHON_VERSION%

REM --- STEP 2: BACKEND INITIALIZATION ---
echo.
echo %LOG_PREFIX% [2/4] Initializing Backend Services...

if not exist "backend\.env" (
    echo %LOG_PREFIX% WARNING: backend/.env not found. System may fail to connect to AI providers.
) else (
    echo %LOG_PREFIX% Backend environment configuration detected.
)

if not exist "backend\ScholarAI\Scripts\activate.bat" (
    echo %LOG_PREFIX% ERROR: Virtual environment 'ScholarAI' not found in /backend.
    echo %LOG_PREFIX% Please run 'python -m venv ScholarAI' and install requirements.
    pause
    exit /b 1
)

cd backend
echo %LOG_PREFIX% Activating Virtual Environment...
call ScholarAI\Scripts\activate.bat

echo %LOG_PREFIX% Starting Uvicorn Server (Port 2022)...
start "ScholarAI Backend" cmd /k "title ScholarAI_Backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 2022"

echo %LOG_PREFIX% Waiting for backend synchronization (10s)...
timeout /t 10 /nobreak > nul

REM --- STEP 3: FRONTEND INITIALIZATION ---
echo.
echo %LOG_PREFIX% [3/4] Initializing Frontend Interface...

cd ..\frontend
if not exist ".env" (
    echo %LOG_PREFIX% WARNING: frontend/.env not found.
)

if not exist "node_modules" (
    echo %LOG_PREFIX% ERROR: node_modules not found in /frontend.
    echo %LOG_PREFIX% Please run 'npm install' in the frontend directory.
    pause
    exit /b 1
)

echo %LOG_PREFIX% Starting Vite Development Server...
start "ScholarAI Frontend" cmd /k "title ScholarAI_Frontend && npm run dev"

REM --- STEP 4: SYSTEM READINESS ---
echo.
echo %LOG_PREFIX% [4/4] Finalizing System Readiness...
echo %LOG_PREFIX% Verifying storage directories...

if not exist "uploads" mkdir uploads
if not exist "..\backend\uploads" mkdir ..\backend\uploads
echo %LOG_PREFIX% Data storage verified.

echo.
echo    ===================================================
echo    SYSTEM ONLINE: http://localhost:3033
echo    ---------------------------------------------------
echo    Backend Service: http://localhost:2022
echo    API References:  http://localhost:2022/docs
echo    Health Monitor:  http://localhost:2022/health
echo    ===================================================
echo.
echo %LOG_PREFIX% Press any key to terminate the startup script monitoring.
echo %LOG_PREFIX% Note: Backend and Frontend terminals will remain open.

pause > nul
