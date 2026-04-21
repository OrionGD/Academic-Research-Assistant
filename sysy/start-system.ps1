$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   ARAS System Standalone Launcher       " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting services in separate windows..." -ForegroundColor Yellow

$scriptPath = $PSScriptRoot

# 1. Start Backend (Node)
Write-Host "-> Launching Backend (Port 5000)..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; npm run dev" -WorkingDirectory "$scriptPath\backend"

# 2. Start ML-Service (Python/FastAPI)
Write-Host "-> Launching ML Service (Port 8000)..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\ml-service'; .\venv\Scripts\activate; python main.py" -WorkingDirectory "$scriptPath\ml-service"

# 3. Start Frontend (Vite)
Write-Host "-> Launching Frontend (Port 5173)..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend'; npm run dev" -WorkingDirectory "$scriptPath\frontend"

Write-Host ""
Write-Host "All services have been launched successfully." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Frontend:   http://localhost:5173"
Write-Host "Backend:    http://localhost:5000"
Write-Host "ML Service: http://localhost:8000"
Write-Host "=========================================" -ForegroundColor Cyan
