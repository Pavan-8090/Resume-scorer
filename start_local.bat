@echo off
echo ========================================
echo Starting ResumeChecker Locally
echo ========================================
echo.

echo Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend_python && python main.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Servers Starting...
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul




