# ResumeScore - Setup Instructions

## Backend Setup (Python)

1. **Navigate to backend directory:**
```bash
cd backend_python
```

2. **Create virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Download spaCy model:**
```bash
python -m spacy download en_core_web_sm
```

6. **Run the backend:**
```bash
python main.py
```

The backend will start on `http://localhost:5000`

## Frontend Setup (Next.js)

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the frontend:**
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## Technologies Used

- **Backend:** FastAPI (Python)
- **Frontend:** Next.js + React + TypeScript
- **Resume Parsing:** PyResparser, PyMuPDF, docx2txt
- **NLP/Skill Extraction:** spaCy
- **Text Comparison:** SentenceTransformer (all-MiniLM-L6-v2)
- **Database:** MongoDB Atlas (or SQLite for local dev)

## Features

✅ Resume parsing (PDF/DOCX)  
✅ Skill extraction using spaCy  
✅ Semantic similarity matching using SentenceTransformer  
✅ Match score calculation (0-100%)  
✅ Top key skills matched  
✅ Most skilled tools identification  
✅ Strengths and weaknesses analysis  
✅ Premium UI with navbar (Home, About, Services)  
✅ Modular code structure  

## Notes

- No OpenAI API key required
- Uses free, open-source models
- Results displayed in real-time on the right side
- Responsive design for all devices

