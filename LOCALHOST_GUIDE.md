# Localhost Access Guide

## 🚀 Quick Start

### Option 1: Use the Batch Script (Easiest)
```bash
start_local.bat
```
This will start both servers automatically in separate windows.

### Option 2: Manual Start

#### Terminal 1 - Backend Server
```bash
cd backend_python
python main.py
```

#### Terminal 2 - Frontend Server
```bash
cd frontend
npm install  # First time only
npm run dev
```

## 🌐 Localhost URLs

Once both servers are running:

### Frontend (Main Application)
**URL:** http://localhost:3000

This is your main web interface where you can:
- Upload resumes
- Enter job descriptions
- View analysis results
- See match scores and skill comparisons

### Backend API
**URL:** http://localhost:5000

**Endpoints:**
- **Health Check:** http://localhost:5000/health
- **API Docs:** http://localhost:5000/docs (Swagger UI)
- **API Base:** http://localhost:5000/api

### API Endpoints

- `GET /health` - Health check
- `POST /api/jobs` - Create job posting
- `GET /api/jobs/{job_id}` - Get job details
- `POST /api/jobs/{job_id}/analyze` - Analyze resumes
- `GET /api/jobs/{job_id}/analyses` - Get analysis results
- `POST /api/resume/analyze-text` - Analyze resume from text
- `POST /api/resume/rewrite` - Rewrite resume with AI

## ✅ Verify Servers Are Running

### Check Backend
```bash
curl http://localhost:5000/health
```
Should return: `{"status":"ok"}`

### Check Frontend
Open browser: http://localhost:3000
Should see the ResumeChecker homepage

## 🔧 Troubleshooting

### Backend Not Starting?
1. Check Python version: `python --version` (need 3.11+)
2. Install dependencies: `pip install -r backend_python/requirements.txt`
3. Check `.env` file exists in `backend_python/`
4. Check port 5000 is not in use: `netstat -ano | findstr :5000`

### Frontend Not Starting?
1. Install Node.js: `node --version` (need 18+)
2. Install dependencies: `cd frontend && npm install`
3. Check port 3000 is not in use: `netstat -ano | findstr :3000`

### Port Already in Use?
Change ports in:
- Backend: Set `PORT=5001` in `backend_python/.env`
- Frontend: `cd frontend && npm run dev -- -p 3001`

## 📝 Environment Variables

Make sure `backend_python/.env` has at least one:
```env
PERPLEXITY_API_KEY=your_key
# OR
OPENAI_API_KEY=your_key
# OR
HF_TOKEN=your_token
```

## 🎯 First Steps After Starting

1. Open http://localhost:3000 in your browser
2. Enter a job description
3. Upload a resume (PDF or DOCX)
4. Click "Analyze Resume"
5. View the match score and analysis results

## 📊 Example Test

Use the test files we created:
- Resume: `test_resume.txt`
- Job Description: `test_job_description.txt`

Or use the integration test:
```bash
python test_integration.py
```




