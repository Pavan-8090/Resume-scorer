
# Docker Cloud Deployment Guide (Beginner Friendly)

This guide will help you deploy your ResumeChecker app to any cloud server using Docker, even if you have no Docker experience.

---

## 1. Prerequisites

- A cloud server (AWS EC2, DigitalOcean, Azure VM, etc.)
- Docker Hub account (https://hub.docker.com/)
- Docker and Docker Compose installed on your server

---

## 2. Prepare Your Environment

1. **Create a `.env` file** in your project root with your API keys:

   ```env
   PERPLEXITY_API_KEY=your-perplexity-api-key
   OPENAI_API_KEY=your-openai-api-key
   HF_TOKEN=your-huggingface-token
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

2. **Log in to Docker Hub** on your local machine:
   ```bash
   docker login
   ```

---

## 3. Build and Push Docker Images

From your project root, run:

```bash
# Build backend image
docker build -t yourusername/resumescore-backend:latest -f backend_python/Dockerfile backend_python

# Build frontend image
docker build -t yourusername/resumescore-frontend:latest -f frontend/Dockerfile frontend

# Push images to Docker Hub
docker push yourusername/resumescore-backend:latest
docker push yourusername/resumescore-frontend:latest
```
Replace `yourusername` with your Docker Hub username.

---

## 4. Update docker-compose.yml for Cloud

Edit `docker-compose.yml` to use your images:

```yaml
services:
  backend:
    image: yourusername/resumescore-backend:latest
    # ...rest unchanged
  frontend:
    image: yourusername/resumescore-frontend:latest
    # ...rest unchanged
```
Remove the `build:` sections and use `image:` as above.

---

## 5. Deploy on Your Cloud Server

1. **Copy your `.env` and `docker-compose.yml` to the server.**
2. **On the server, run:**
   ```bash
   sudo docker-compose up -d
   ```

---

## 6. Access Your Application

- Frontend: `http://<your-server-ip>:3000`
- Backend: `http://<your-server-ip>:5000`

---

## 7. Useful Docker Commands

- Check running containers:
  ```bash
  docker ps
  docker-compose ps
  ```
- View logs:
  ```bash
  docker-compose logs -f
  docker-compose logs -f backend
  docker-compose logs -f frontend
  ```
- Stop all services:
  ```bash
  docker-compose down
  ```
- Remove all containers and volumes:
  ```bash
  docker-compose down -v
  ```

---

## 8. Troubleshooting

- If you change code, rebuild and push images again, then run `docker-compose up -d` on the server.
- Health check: `curl http://<your-server-ip>:5000/health`
- Make sure your cloud firewall allows ports 3000 and 5000.

---

**Need help? Ask for step-by-step help for any part!**
