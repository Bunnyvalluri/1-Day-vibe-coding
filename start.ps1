Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    STARTING CHURCH EVENT REGISTRATION SYSTEM PORTAL      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Get absolute paths of backend and frontend
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$BackendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend"
$FrontendPath = Join-Path -Path $PSScriptRoot -ChildPath "frontend"

# Start Backend API
Write-Host "1. Launching Backend API Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory $BackendPath -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start Frontend App
Write-Host "2. Launching Frontend Next.js Server (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory $FrontendPath -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "----------------------------------------------------------" -ForegroundColor Gray
Write-Host "✅ Both servers are booting up in separate windows!" -ForegroundColor Green
Write-Host "• Backend API Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "• Frontend Client Portal  : http://localhost:3000" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
