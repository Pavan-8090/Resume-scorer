# Python Backend Setup Instructions

## Prerequisites
- Python 3.9 or higher
- pip

## Installation

1. **Create virtual environment:**
```bash
cd backend_python
python -m venv venv
```

2. **Activate virtual environment:**
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 5000
```

The server will start on http://localhost:5000

## Features

- ✅ No OpenAI API key required
- ✅ Uses HuggingFace models (sentence-transformers, BERT)
- ✅ Semantic similarity for resume matching
- ✅ Keyword fallback if models unavailable
- ✅ PDF and DOCX parsing
- ✅ FastAPI async support

## API Endpoints

- `GET /health` - Health check
- `POST /api/jobs` - Create job post
- `GET /api/jobs/{job_id}` - Get job post
- `POST /api/jobs/{job_id}/analyze` - Analyze resume(s)
- `GET /api/jobs/{job_id}/analyses` - Get analysis results

