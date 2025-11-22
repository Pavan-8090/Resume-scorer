@echo off
REM ResumeScore Backend Startup Script
REM Ensures backend always runs with auto-restart

echo ========================================
echo ResumeScore Backend Server
echo ========================================
echo.

cd backend_python
python start_backend.py

pause

