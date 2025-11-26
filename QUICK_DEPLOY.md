# ⚡ Quick Deployment Guide

## 🚀 Fastest Way: Railway (5 minutes)

1. **Go to**: [railway.app](https://railway.app) → Sign up/Login
2. **Click**: "New Project" → "Deploy from GitHub repo"
3. **Select**: Your repo `Pavan-8090/Resume-scorer`
4. **Set Root Directory**: `backend_python`
5. **Add Environment Variables**:
   ```
   ALLOWED_ORIGINS = https://your-frontend.vercel.app,http://localhost:3000
   OPENAI_API_KEY = your_key (optional)
   HF_TOKEN = your_token (optional)
   ```
6. **Deploy!** ✅

Your backend URL will be: `https://your-app.railway.app`

---

## 🔗 Update Frontend

In Vercel (or your frontend hosting), add environment variable:

```
NEXT_PUBLIC_API_URL = https://your-app.railway.app
```

---

## ✅ Test

Visit: `https://your-app.railway.app/health`

Should return: `{"status":"ok"}`

---

## 📚 Full Guide

See `DEPLOYMENT.md` for detailed instructions for:
- Railway
- Render
- Fly.io
- Heroku
- PythonAnywhere
- DigitalOcean


