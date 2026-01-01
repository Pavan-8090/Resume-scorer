# Simple Cloud Deployment with Docker

This guide provides the easiest way to deploy your ResumeChecker project to any cloud server using Docker images.

---

## 1. Prerequisites
- Cloud server (AWS, DigitalOcean, Azure, etc.)
- Docker and Docker Compose installed
- Your `.env` file with API keys

---

## 2. Build and Push Docker Images (on your local machine)

1. Log in to Docker Hub:
   ```bash
   docker login
   ```
2. Build backend image:
   ```bash
   docker build -t yourusername/resumescore-backend:latest -f backend_python/Dockerfile backend_python
   ```
3. Build frontend image:
   ```bash
   docker build -t yourusername/resumescore-frontend:latest -f frontend/Dockerfile frontend
   ```
4. Push images to Docker Hub:
   ```bash
   docker push yourusername/resumescore-backend:latest
   docker push yourusername/resumescore-frontend:latest
   ```

---

## 3. Prepare Your Cloud Server

1. Copy your `.env` and `docker-compose.yml` to the server.
2. Edit `docker-compose.yml` to use your images:
   ```yaml
   services:
     backend:
       image: yourusername/resumescore-backend:latest
     frontend:
       image: yourusername/resumescore-frontend:latest
   ```
   (Remove any `build:` sections.)

---

## 4. Deploy

On your server, run:
```bash
sudo docker-compose up -d
```

---


## 5. Access

After deployment, your website will be accessible from any device using your server's public IP address:

- Frontend: http://<your-server-ip>:3000
- Backend: http://<your-server-ip>:5000

For example, if your server's IP is 123.45.67.89, open these in your browser:

- http://123.45.67.89:3000 (Frontend)
- http://123.45.67.89:5000 (Backend API)

Make sure your cloud firewall allows inbound traffic on ports 3000 and 5000.

---

## 6. Update
If you change code:
- Rebuild and push images again (steps 2-4 above)
- On the server, run:
  ```bash
  sudo docker-compose up -d
  ```

---

That's it! Your app is live with just a few commands.