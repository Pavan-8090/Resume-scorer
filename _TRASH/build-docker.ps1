# Docker Build Script for ResumeChecker
Write-Host "🐳 Building Docker Images for ResumeChecker..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "   Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "   Waiting 30 seconds for Docker to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

Write-Host ""
Write-Host "Building backend image..." -ForegroundColor Cyan
docker-compose build backend

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend image built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Building frontend image..." -ForegroundColor Cyan
docker-compose build frontend

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend image built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 All Docker images built successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To run the containers:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "To stop containers:" -ForegroundColor Cyan
Write-Host "  docker-compose down" -ForegroundColor White






