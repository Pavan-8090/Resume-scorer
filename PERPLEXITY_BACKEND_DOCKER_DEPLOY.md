# Simple Docker Deployment: Perplexity + Python Backend Only

This guide will help you deploy only the Python backend (using Perplexity for resume analysis) with Docker on any cloud server.

---

## 1. Prerequisites
- Cloud server (AWS, DigitalOcean, Azure, etc.)
- Docker and Docker Compose installed
- Your `.env` file with only Perplexity and backend settings (see below)

---

## 2. Prepare Your .env File

Example .env (place in project root):
```
# Perplexity AI
PERPLEXITY_API_KEY=your-perplexity-api-key
PERPLEXITY_MODEL=sonar-deep-research
PERPLEXITY_API_URL=https://api.perplexity.ai/v1/complete
PORT=5000
```

---

## 3. Build and Push the Backend Docker Image (on your local machine)

1. Log in to Docker Hub:
   ```bash
   docker login
   ```
2. Build backend image:
   ```bash
   docker build -t yourusername/resumescore-backend:latest -f backend_python/Dockerfile backend_python
   ```
3. Push image to Docker Hub:
   ```bash
   docker push yourusername/resumescore-backend:latest
   ```

---

## 4. Create a Minimal docker-compose.yml

Example docker-compose.yml:
```yaml
version: '3.8'
services:
  backend:
    image: yourusername/resumescore-backend:latest
    container_name: resumescore-backend
    ports:
      - "5000:5000"
    env_file:
      - .env
    restart: unless-stopped
```

---

## 5. Deploy on Your Cloud Server

1. Copy your `.env` and `docker-compose.yml` to the server.
2. On the server, run:
   ```bash
   sudo docker-compose up -d
   ```

---

## 6. Access the API
- Backend API: http://your-server-ip:5000

---

That's it! Only the Python backend (using Perplexity) will be running and ready for resume analysis.
