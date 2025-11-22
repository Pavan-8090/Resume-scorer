# ResumeScore Backend Startup Script (PowerShell)
# Ensures backend always runs with auto-restart

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ResumeScore Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend_python
python start_backend.py

