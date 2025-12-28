# Quick Start: Deploy to VPS

## One-Command Deployment

```bash
chmod +x deploy.sh && ./deploy.sh
```

The script will:
- ✅ Check and install Docker if needed
- ✅ Create `.env` from template
- ✅ Build and start containers
- ✅ Setup Nginx (optional)
- ✅ Configure auto-start (optional)

## Manual Steps

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Setup Environment
```bash
cp .env.example .env
nano .env  # Add your HF_TOKEN and domain URLs
```

### 3. Deploy
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verify
```bash
curl http://localhost:5000/health  # Should return {"status":"ok"}
curl http://localhost:3000         # Should return HTML
```

## Environment Variables Required

```env
# Perplexity API (Recommended - Primary)
PERPLEXITY_API_KEY=pplx-your-perplexity-key
PERPLEXITY_MODEL=sonar-deep-research

# Optional fallbacks
HF_TOKEN=your_huggingface_token
OPENAI_API_KEY=your_openai_key

# Domain configuration
ALLOWED_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## Access URLs

- **Frontend**: http://localhost:3000 (or your domain)
- **Backend API**: http://localhost:5000 (or api.your-domain.com)
- **Health Check**: http://localhost:5000/health

## Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart
docker compose -f docker-compose.prod.yml restart

# Stop
docker compose -f docker-compose.prod.yml down

# Update
git pull && docker compose -f docker-compose.prod.yml up -d --build
```

## Next Steps

1. **Setup Nginx** (see `nginx/resumescore.conf`)
2. **Install SSL** with Let's Encrypt
3. **Configure auto-start** (see `systemd/resumescore.service`)

For detailed instructions, see `VPS_DEPLOYMENT.md`.

