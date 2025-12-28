# VPS Deployment Guide for ResumeChecker

Complete guide for deploying ResumeChecker on a VPS using Docker.

## Quick Start

1. **Upload project to VPS**
2. **Run deployment script**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Manual Setup

### 1. Prerequisites

- Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- Domain name (optional, for production)

### 2. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 3. Upload Project

**Option A: Using Git**
```bash
git clone <your-repo-url>
cd ResumeChecker
```

**Option B: Using SCP**
```bash
# From local machine
scp -r ResumeChecker user@your-vps-ip:/home/user/
```

### 4. Configure Environment

```bash
cd ResumeChecker

# Create .env file
cp .env.example .env
nano .env
```

**Required environment variables:**
```env
# Perplexity API (Recommended - Primary)
PERPLEXITY_API_KEY=pplx-your-perplexity-key
PERPLEXITY_MODEL=sonar-deep-research

# Optional fallbacks
HF_TOKEN=your_huggingface_token
OPENAI_API_KEY=your_openai_key

# Domain configuration
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

**Get Hugging Face Token:**
1. Go to https://huggingface.co/settings/tokens
2. Create a new token with read permissions
3. Copy and paste into `.env`

### 5. Deploy with Docker

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 6. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Copy configuration template
sudo cp nginx/resumescore.conf /etc/nginx/sites-available/resumescore

# Edit configuration
sudo nano /etc/nginx/sites-available/resumescore
# Replace YOUR_DOMAIN with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/resumescore /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Auto-renewal is set up automatically
# Test renewal: sudo certbot renew --dry-run
```

### 8. Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 9. Auto-start on Reboot

```bash
# Copy systemd service template
sudo cp systemd/resumescore.service /etc/systemd/system/

# Edit service file
sudo nano /etc/systemd/system/resumescore.service
# Update WorkingDirectory and User/Group

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable resumescore
sudo systemctl start resumescore

# Check status
sudo systemctl status resumescore
```

## Verification

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status":"ok"}
   ```

2. **Frontend Access:**
   ```bash
   curl http://localhost:3000
   # Should return HTML
   ```

3. **Check Logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs backend
   docker compose -f docker-compose.prod.yml logs frontend
   ```

## Common Commands

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services
```bash
docker compose -f docker-compose.prod.yml restart
# Or restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Stop Services
```bash
docker compose -f docker-compose.prod.yml down
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

### View Resource Usage
```bash
docker stats
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Check environment variables
docker compose -f docker-compose.prod.yml config
```

### Frontend Build Fails

```bash
# Rebuild without cache
docker compose -f docker-compose.prod.yml build --no-cache frontend

# Check Node version
docker compose -f docker-compose.prod.yml run frontend node --version
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a
docker volume prune

# Check disk usage
df -h
docker system df
```

### Permission Issues

```bash
# Fix file ownership
sudo chown -R $USER:$USER .

# Fix Docker socket permissions (if needed)
sudo chmod 666 /var/run/docker.sock
```

### Nginx 502 Bad Gateway

```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify proxy_pass URLs in Nginx config
sudo nginx -t
```

### Model Download Issues

If SentenceTransformer models fail to download:

```bash
# Check HF_TOKEN in .env
cat .env | grep HF_TOKEN

# Manually download model (inside container)
docker compose -f docker-compose.prod.yml exec backend python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

## Production Checklist

- [ ] Docker and Docker Compose installed
- [ ] `.env` file configured with all required variables
- [ ] Containers running: `docker compose ps`
- [ ] Backend health check passing: `curl http://localhost:5000/health`
- [ ] Frontend accessible: `curl http://localhost:3000`
- [ ] Nginx configured and running: `sudo systemctl status nginx`
- [ ] SSL certificates installed (if using domain)
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Auto-start on reboot configured
- [ ] Logs are being monitored
- [ ] Backups configured (optional but recommended)

## Monitoring

### View Container Stats
```bash
docker stats
```

### Monitor Logs
```bash
# Follow all logs
docker compose -f docker-compose.prod.yml logs -f

# Follow specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Check Service Health
```bash
# Container status
docker compose -f docker-compose.prod.yml ps

# Systemd service status
sudo systemctl status resumescore

# Nginx status
sudo systemctl status nginx
```

## Backup

### Backup Configuration
```bash
# Backup .env file
cp .env .env.backup

# Backup docker-compose files
tar -czf backup-$(date +%Y%m%d).tar.gz .env docker-compose*.yml
```

### Restore
```bash
# Restore .env
cp .env.backup .env

# Restart services
docker compose -f docker-compose.prod.yml restart
```

## Security Recommendations

1. **Use strong passwords** for VPS access
2. **Enable SSH key authentication** and disable password login
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Use firewall** (UFW) to restrict access
5. **Keep Docker updated**: `sudo apt upgrade docker-ce`
6. **Regular backups** of `.env` and configuration files
7. **Monitor logs** for suspicious activity
8. **Use HTTPS** in production (Let's Encrypt)
9. **Limit CORS origins** to your actual domains
10. **Rotate API keys** periodically

## Support

For issues or questions:
1. Check logs: `docker compose logs`
2. Check this guide's troubleshooting section
3. Review Docker and Nginx documentation
4. Check GitHub issues (if applicable)

