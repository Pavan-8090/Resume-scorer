# 🚀 Deployment Guide - Resume Checker Backend

This guide covers deploying the FastAPI backend to various cloud services.

## 📋 Prerequisites

1. **Environment Variables** - Set these in your cloud service:
   - `OPENAI_API_KEY` (optional) - For OpenAI resume rewriting
   - `HF_TOKEN` (optional) - For Hugging Face API
   - `ALLOWED_ORIGINS` - Comma-separated list of frontend URLs (e.g., `https://your-frontend.vercel.app,http://localhost:3000`)
   - `PORT` - Usually set automatically by the platform

2. **Dependencies** - All are listed in `requirements.txt`

---

## 🌐 Deployment Options

### 1. Railway (Recommended - Easiest)

**Steps:**
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository: `Pavan-8090/Resume-scorer`
4. Set root directory to: `backend_python`
5. Railway will auto-detect Python and install dependencies
6. Add environment variables:
   - `OPENAI_API_KEY` (if using OpenAI)
   - `HF_TOKEN` (if using Hugging Face)
   - `ALLOWED_ORIGINS` = `https://your-frontend.vercel.app,http://localhost:3000`
7. Deploy! Railway will provide a URL like: `https://your-app.railway.app`

**Advantages:**
- ✅ Free tier available
- ✅ Auto-deploys on git push
- ✅ Easy environment variable management
- ✅ Automatic HTTPS

---

### 2. Render

**Steps:**
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `resumescore-backend`
   - **Root Directory**: `backend_python`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)
6. Click "Create Web Service"

**Advantages:**
- ✅ Free tier (spins down after inactivity)
- ✅ Auto-deploys on git push
- ✅ Easy setup

---

### 3. Fly.io

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. In `backend_python` directory, run:
   ```bash
   fly launch
   ```
4. Follow prompts:
   - App name: `resumescore-backend`
   - Region: Choose closest to you
   - PostgreSQL: No (we don't need it)
5. Create `fly.toml` (or use generated one):
   ```toml
   app = "resumescore-backend"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0

   [[services]]
     http_checks = []
     internal_port = 8000
     processes = ["app"]
     protocol = "tcp"
     script_checks = []
   ```
6. Set secrets:
   ```bash
   fly secrets set OPENAI_API_KEY=your_key
   fly secrets set HF_TOKEN=your_token
   fly secrets set ALLOWED_ORIGINS="https://your-frontend.vercel.app"
   ```
7. Deploy: `fly deploy`

**Advantages:**
- ✅ Generous free tier
- ✅ Global edge network
- ✅ Fast deployments

---

### 4. Heroku

**Steps:**
1. Install Heroku CLI: [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
2. Login: `heroku login`
3. Create app:
   ```bash
   cd backend_python
   heroku create resumescore-backend
   ```
4. Set environment variables:
   ```bash
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set HF_TOKEN=your_token
   heroku config:set ALLOWED_ORIGINS="https://your-frontend.vercel.app"
   ```
5. Deploy:
   ```bash
   git subtree push --prefix backend_python heroku main
   ```

**Note:** Heroku free tier was discontinued, but paid plans are available.

---

### 5. PythonAnywhere

**Steps:**
1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Go to "Web" tab → "Add a new web app"
3. Choose Python 3.11
4. Upload your code via Git:
   ```bash
   git clone https://github.com/Pavan-8090/Resume-scorer.git
   ```
5. Set working directory to: `Resume-scorer/backend_python`
6. Set WSGI file to: `main.py`
7. Add environment variables in "Web" → "Environment variables"
8. Reload web app

---

### 6. DigitalOcean App Platform

**Steps:**
1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Create new App → Connect GitHub
3. Select repository and branch
4. Configure:
   - **Type**: Web Service
   - **Source Directory**: `backend_python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Run Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

---

## 🔧 Configuration

### Update Frontend to Use Cloud Backend

In your frontend `.env.local` or Vercel environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

Or update `frontend/components/ResumeAnalyzer.tsx`:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

### CORS Configuration

Make sure `ALLOWED_ORIGINS` includes your frontend URL:
```env
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

---

## 📝 Environment Variables Summary

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | No* | OpenAI API key for resume rewriting | `sk-...` |
| `HF_TOKEN` | No* | Hugging Face token for AI features | `hf_...` |
| `ALLOWED_ORIGINS` | Yes | Frontend URLs (comma-separated) | `https://app.vercel.app` |
| `PORT` | Auto | Server port (set by platform) | `8000` |

*At least one AI service (OpenAI or Hugging Face) is required for resume rewriting.

---

## 🧪 Testing Deployment

After deployment, test your backend:

1. **Health Check:**
   ```bash
   curl https://your-backend.railway.app/health
   ```
   Should return: `{"status":"ok"}`

2. **API Test:**
   ```bash
   curl https://your-backend.railway.app/api/jobs
   ```
   Should return: `[]` (empty list)

---

## 🐛 Troubleshooting

### Backend not starting
- Check logs in your cloud service dashboard
- Verify all environment variables are set
- Ensure `requirements.txt` is in `backend_python` directory

### CORS errors
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check frontend is using correct backend URL

### Timeout errors
- Some platforms have request timeouts (e.g., Render: 30s)
- Consider using async processing for long operations

### Memory issues
- Some ML models (sentence-transformers) use significant memory
- Consider upgrading to a plan with more RAM

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## ✅ Quick Start (Railway - Recommended)

1. **Sign up**: [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. **Select repo**: `Pavan-8090/Resume-scorer`
4. **Set root**: `backend_python`
5. **Add env vars**:
   - `ALLOWED_ORIGINS` = `https://your-frontend.vercel.app`
   - `OPENAI_API_KEY` = `your_key` (optional)
   - `HF_TOKEN` = `your_token` (optional)
6. **Deploy!** 🚀

Your backend will be live at: `https://your-app.railway.app`


