# ResumeChecker Docker Deployment Script
Write-Host "🚀 ResumeChecker Docker Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "📋 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if Docker daemon is running
Write-Host ""
Write-Host "📋 Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running." -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and wait for it to fully start." -ForegroundColor Yellow
    Write-Host "   Attempting to start Docker Desktop..." -ForegroundColor Yellow
    
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "   Waiting 45 seconds for Docker to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 45
        
        # Check again
        try {
            docker ps | Out-Null
            Write-Host "✅ Docker daemon is now running" -ForegroundColor Green
        } catch {
            Write-Host "❌ Docker daemon still not ready. Please start Docker Desktop manually." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Docker Desktop not found at expected location." -ForegroundColor Red
        exit 1
    }
}

# Check .env file
Write-Host ""
Write-Host "📋 Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "   Copying .env.example to .env..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file. Please update it with your API keys." -ForegroundColor Green
        Write-Host "   Opening .env file..." -ForegroundColor Yellow
        Start-Process notepad ".env"
        Write-Host "   Press Enter after updating .env file..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host "❌ .env.example not found. Creating basic .env..." -ForegroundColor Red
        @"
PERPLEXITY_API_KEY=your-perplexity-api-key-here
PERPLEXITY_MODEL=sonar-deep-research
OPENAI_API_KEY=your-openai-api-key-here
NEXT_PUBLIC_API_URL=http://localhost:5000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ Created .env file. Please update it with your API keys." -ForegroundColor Green
    }
}

# Stop existing containers
Write-Host ""
Write-Host "📋 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null
Write-Host "✅ Cleaned up" -ForegroundColor Green

# Build images
Write-Host ""
Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
Write-Host "   This may take 5-10 minutes on first build..." -ForegroundColor Yellow
Write-Host ""

# Build backend
Write-Host "📦 Building backend image..." -ForegroundColor Yellow
docker-compose build backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend image built successfully" -ForegroundColor Green

# Build frontend
Write-Host ""
Write-Host "📦 Building frontend image..." -ForegroundColor Yellow
docker-compose build frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend image built successfully" -ForegroundColor Green

# Start containers
Write-Host ""
Write-Host "🚀 Starting containers..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host ""
Write-Host "⏳ Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check health
Write-Host ""
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✅ Backend is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend health check failed (may still be starting)" -ForegroundColor Yellow
}

# Show status
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access your application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Health:   http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop:         docker-compose down" -ForegroundColor White
Write-Host "   Restart:      docker-compose restart" -ForegroundColor White
Write-Host "   Rebuild:      docker-compose build --no-cache" -ForegroundColor White
Write-Host ""


