# Docker Deployment Guide

## Prerequisites
- Docker Desktop installed (for local testing)
- Docker and Docker Compose installed on VPS (for production)
- Environment variables configured

## Quick Start (Local Testing)

1. **Create `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your actual values:
   ```env
   PERPLEXITY_API_KEY=your_perplexity_key
   PERPLEXITY_MODEL=sonar-deep-research
   HF_TOKEN=your_actual_token
   OPENAI_API_KEY=your_actual_key
   ALLOWED_ORIGINS=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. **Build and start containers**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

## Production Deployment on Ubuntu VPS

### 1. Install Docker on Ubuntu VPS

```bash
# Update system
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Upload Project to VPS

```bash
# On your local machine
scp -r ResumeChecker user@your-vps-ip:/home/user/

# Or use git
git clone your-repo-url
cd ResumeChecker
```

### 3. Configure Environment Variables

```bash
cd /home/user/ResumeChecker
cp .env.example .env
nano .env  # Edit with your actual values
```

**Important production values:**
```env
PERPLEXITY_API_KEY=your_perplexity_key
PERPLEXITY_MODEL=sonar-deep-research
HF_TOKEN=your_huggingface_token
OPENAI_API_KEY=your_openai_key
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 4. Build and Deploy

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Setup Nginx Reverse Proxy (Optional but Recommended)

Create `/etc/nginx/sites-available/resumescore`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/resumescore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

## Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Update and Redeploy
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Remove Everything
```bash
docker-compose down -v  # Removes volumes too
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose logs backend

# Check if port is in use
sudo netstat -tulpn | grep 5000
```

### Frontend build fails
```bash
# Check Node.js version
docker-compose run frontend node --version

# Rebuild without cache
docker-compose build --no-cache frontend
```

### Permission issues
```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix Docker permissions
sudo chmod 666 /var/run/docker.sock
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

## Production Checklist

- [ ] Environment variables set in `.env`
- [ ] Docker and Docker Compose installed
- [ ] Containers running: `docker-compose ps`
- [ ] Backend health check: `curl http://localhost:5000/health`
- [ ] Frontend accessible: `curl http://localhost:3000`
- [ ] Nginx configured (if using)
- [ ] SSL certificates installed (if using)
- [ ] Firewall ports open (5000, 3000, 80, 443)
- [ ] Auto-restart on reboot configured

## Auto-start on Reboot

Create systemd service `/etc/systemd/system/resumescore.service`:

```ini
[Unit]
Description=ResumeChecker Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/user/ResumeChecker
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable resumescore
sudo systemctl start resumescore
```


