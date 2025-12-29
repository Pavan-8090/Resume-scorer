# Cloud Deployment with Docker Images

This guide explains how to build Docker images for your ResumeChecker project and deploy them on any cloud server.

---

## 1. Prerequisites
- Cloud server (AWS EC2, DigitalOcean, Azure VM, etc.)
- Docker and Docker Compose installed on your server
- Docker Hub account (https://hub.docker.com/)
- Your API keys and .env file ready

---

## 2. Build Docker Images Locally

From your project root, run:

```bash
# Backend image
cd backend_python

docker build -t yourusername/resumescore-backend:latest .

# Frontend image
cd ../frontend

docker build -t yourusername/resumescore-frontend:latest .
```
Replace `yourusername` with your Docker Hub username.

---

## 3. Push Images to Docker Hub

```bash
docker push yourusername/resumescore-backend:latest
docker push yourusername/resumescore-frontend:latest
```

---

## 4. Prepare Your Cloud Server

1. Copy your `.env` and `docker-compose.yml` to the server.
2. Edit `docker-compose.yml` to use your images:

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

## 5. Deploy on the Cloud Server

SSH into your server and run:

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
