# Localhost URLs

## 🌐 Your Application URLs

### Frontend (Main Application)
**http://localhost:3000**

Open this in your browser to use ResumeChecker.

### Backend API
**http://localhost:5000**

**Endpoints:**
- **Health Check:** http://localhost:5000/health
- **API Documentation:** http://localhost:5000/docs (Swagger UI)
- **Create Job:** POST http://localhost:5000/api/jobs
- **Analyze Resume:** POST http://localhost:5000/api/jobs/{job_id}/analyze
- **Get Results:** GET http://localhost:5000/api/jobs/{job_id}/analyses

## 🚀 Quick Start

1. **Open Frontend:** http://localhost:3000
2. **Enter job description**
3. **Upload resume** (PDF or DOCX)
4. **Click "Analyze Resume"**
5. **View results** with match score and analysis

## ✅ Status Check

- Frontend: http://localhost:3000 (should show ResumeChecker homepage)
- Backend: http://localhost:5000/health (should return `{"status":"ok"}`)

## 🔧 If Backend Not Running

Start backend manually:
```bash
cd backend_python
python main.py
```

## 📝 Environment

Make sure `backend_python/.env` has:
```env
PERPLEXITY_API_KEY=your_perplexity_token
```




