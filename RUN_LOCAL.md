# Run Project Locally

## Quick Start

### 1. Backend (Python FastAPI)
```bash
cd backend_python
python main.py
```
**Runs on:** http://localhost:5000

### 2. Frontend (Next.js)
```bash
cd frontend
npm run dev
```
**Runs on:** http://localhost:3000

## URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **API Docs**: http://localhost:5000/docs

## Prerequisites

1. **Python 3.11+** installed
2. **Node.js 18+** installed
3. **Environment variables** set in `backend_python/.env`

## Environment Setup

Make sure `backend_python/.env` has:
```env
PERPLEXITY_API_KEY=your_key
# or
OPENAI_API_KEY=your_key
# or
HF_TOKEN=your_token
```

