# Cloud Deployment Guide for ResumeChecker

This guide will help you deploy ResumeChecker to a cloud server using Docker.

---

## Prerequisites
- A cloud server (AWS EC2, DigitalOcean, Azure VM, etc.)
- Docker and Docker Compose installed on your server
- Your API keys and .env file ready

---

## 1. Prepare Your Environment

1. **Copy your project files** to the cloud server (use scp, rsync, or upload via your provider's dashboard).
2. **Create a `.env` file** in the project root with all required API keys and variables:
   ```env
   PERPLEXITY_API_KEY=your-perplexity-api-key
   OPENAI_API_KEY=your-openai-api-key
   HF_TOKEN=your-huggingface-token
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   HF_MODEL_ID=all-MiniLM-L6-v2
   OPENAI_MODEL=gpt-4
   USE_AI_ONLY=true
   ```

---

## 2. Build and Run with Docker Compose

1. **Log in to your server** via SSH.
2. **Navigate to your project directory:**
   ```bash
   cd /path/to/ResumeChecker
   ```
3. **Build and start the containers:**
   ```bash
   docker compose up -d --build
   ```
4. **Check that everything is running:**
   ```bash
   docker compose ps
   ```
   Both backend and frontend should show as "Up".

---

## 3. Access the Application
- Open your browser and go to `http://<your-server-ip>:3000` for the frontend.
- Backend API will be at `http://<your-server-ip>:5000`.

---

## 4. Updating the App
- To update, pull new code, rebuild, and restart:
   ```bash
   git pull
   docker compose up -d --build
   ```

---

## 5. Troubleshooting
- Use `docker compose logs` to view logs for any service.
- Make sure your .env file is present and correct.
- Ensure required ports (3000, 5000) are open in your cloud firewall.

---

## 6. Stopping the App
- To stop all containers:
   ```bash
   docker compose down
   ```

---

For more details, see DOCKER_DEPLOY.md or your cloud provider's documentation.
