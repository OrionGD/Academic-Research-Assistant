@echo off
cd /d "%~dp0"
REM ScholarAI - Advanced Research Analysis System

echo.
echo    ScholarAI - Advanced Research Analysis System     
echo    Startup Script (Windows)                                    
echo.

REM Start Backend
echo Starting Backend Server...
echo ================================
cd backend

call venv\Scripts\activate.bat
start "ScholarAI Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 2022"

REM --- FRONTEND STARTUP ---
echo [2/3] Starting Frontend (Vite)...
cd ..\frontend
start "ScholarAI Frontend" cmd /k "npm run dev"

echo.
echo   ScholarAI Platform is Ready!                                       
echo   ----------------------------------------------------------
echo   Frontend:  http://localhost:3033                              
echo   Backend:   http://localhost:2022                              
echo   API Docs:  http://localhost:2022/docs                         
echo   Health:    http://localhost:2022/health                       
echo.

pause
