# Docker Deployment Guide

## Quick Start

### 1. Build Docker Images

```bash
# Build both backend and frontend images
docker-compose build

# Or build individually
docker-compose build backend
docker-compose build frontend
```

### 2. Set Environment Variables

Create a `.env` file in the root directory:

```env
# Perplexity API (Primary)
PERPLEXITY_API_KEY=your-perplexity-api-key-here
PERPLEXITY_MODEL=sonar-deep-research

# OpenAI API (Fallback)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Hugging Face (Optional Fallback)
HF_TOKEN=your-huggingface-token-here
HF_MODEL_ID=all-MiniLM-L6-v2

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Individual Docker Images

### Build Backend Image

```bash
cd backend_python
docker build -t resumescore-backend:latest .
```

### Build Frontend Image

```bash
cd frontend
docker build -t resumescore-frontend:latest --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 .
```

### Run Backend Container

```bash
docker run -d \
  --name resumescore-backend \
  -p 5000:5000 \
  -e PERPLEXITY_API_KEY=your-key \
  -e OPENAI_API_KEY=your-key \
  resumescore-backend:latest
```

### Run Frontend Container

```bash
docker run -d \
  --name resumescore-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:5000 \
  resumescore-frontend:latest
```

## Production Deployment

For production, use `docker-compose.prod.yml`:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Check Container Status

```bash
docker ps
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild After Code Changes

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Remove All Containers and Volumes

```bash
docker-compose down -v
```

## Image Sizes

- **Backend**: ~2-3 GB (includes ML dependencies)
- **Frontend**: ~200-300 MB

## Health Checks

Both services include health checks:
- Backend: `curl http://localhost:5000/health`
- Frontend: Check if port 3000 is accessible
