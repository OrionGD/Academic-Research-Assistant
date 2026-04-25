@echo off
cd /d "%~dp0"
REM ARAS Platform Startup Script for Windows

echo.
echo    ARAS - AI-Powered Academic Business Intelligence Platform     
echo    Startup Script ^(Windows^)                                    
echo.

REM Start Backend
echo Starting Backend Server...
echo ================================
cd backend

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run the backend in a new window
echo Starting FastAPI server on port 2022...
start "ARAS Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 2022"
echo ✓ Backend started in new window
timeout /t 3 /nobreak
echo.

REM Start Frontend
echo Starting Frontend Development Server...
echo ================================
cd ..\frontend

REM Run the frontend in a new window
echo Starting Vite development server on port 3033...
start "ARAS Frontend" cmd /k "npm run dev"
echo ✓ Frontend started in new window
echo.

REM Display startup information
echo.

echo   ARAS Platform is Ready!                                       
echo   Frontend:  http://localhost:3033                              
echo   Backend:   http://localhost:2022                              
echo   API Docs:  http://localhost:2022/docs                         
echo   Health:    http://localhost:2022/health                       
echo.

pause
