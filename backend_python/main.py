import os
import sys
import uuid
import traceback
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
from dotenv import load_dotenv
from resume_analyzer import analyze_resume_file

load_dotenv()

app = FastAPI(title="ResumeScore API")

# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,chrome-extension://").split(",")
allowed_origins.append("chrome-extension://*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"chrome-extension://.*",
)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}

# Models
class JobPostCreate(BaseModel):
    title: str
    jobDescription: str

class TextResumeAnalysis(BaseModel):
    resume_text: str
    candidate_name: str = "Unknown Candidate"
    job_description: str

# In-memory storage
jobs_db = {}
analyses_db = {}

@app.post("/api/jobs")
async def create_job_post(job: JobPostCreate):
    job_id = str(uuid.uuid4())
    jobs_db[job_id] = {
        "id": job_id,
        "_id": job_id,
        "title": job.title,
        "jobDescription": job.jobDescription,
        "status": "pending"
    }
    return jobs_db[job_id]

@app.get("/api/jobs/{job_id}")
async def get_job_post(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job post not found")
    return jobs_db[job_id]

@app.get("/api/jobs/{job_id}/analyses")
async def get_analyses(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job post not found")
    analyses = [a for a in analyses_db.values() if a.get("jobPostId") == job_id]
    return analyses

@app.post("/api/jobs/{job_id}/analyze")
async def analyze_resume(job_id: str, resumes: List[UploadFile] = File(...)):
    """Main endpoint for analyzing resumes"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job post not found")
    
    job_description = jobs_db[job_id]["jobDescription"]
    results = []
    errors = []
    
    for resume_file in resumes:
        try:
            file_content = await resume_file.read()
            file_name = resume_file.filename or "unknown"
            
            print(f"Processing resume: {file_name}")
            analysis = await analyze_resume_file(
                file_content=file_content,
                file_name=file_name,
                job_description=job_description
            )
            
            analysis_id = str(uuid.uuid4())
            analysis["_id"] = analysis_id
            analysis["id"] = analysis_id
            analysis["jobPostId"] = job_id
            analyses_db[analysis_id] = analysis
            
            results.append(analysis)
            print(f"Successfully analyzed: {file_name}")
            
        except Exception as e:
            error_msg = f"Error processing {resume_file.filename}: {str(e)}"
            print(f"ERROR: {error_msg}")
            traceback.print_exc()
            errors.append(error_msg)
            continue
    
    if not results:
        error_detail = "Failed to process any resumes. "
        if errors:
            error_detail += f"Errors: {'; '.join(errors[:3])}"
        else:
            error_detail += "Please check: 1) Resume file format (PDF/DOCX), 2) AI service configuration (PERPLEXITY_API_KEY, OPENAI_API_KEY, or HF_TOKEN)"
        raise HTTPException(status_code=400, detail=error_detail)
    
    jobs_db[job_id]["status"] = "completed"
    return {"message": "Analysis completed", "analyses": results, "jobPost": jobs_db[job_id]}

@app.post("/api/resume/analyze-text")
async def analyze_text_resume(analysis: TextResumeAnalysis):
    """Analyze resume from text (for Chrome extension)"""
    try:
        resume_text_bytes = analysis.resume_text.encode('utf-8')
        file_name = f"{analysis.candidate_name.replace(' ', '_')}_resume.txt"
        
        result = await analyze_resume_file(
            file_content=resume_text_bytes,
            file_name=file_name,
            job_description=analysis.job_description
        )
        
        if analysis.candidate_name != "Unknown Candidate":
            result["candidateName"] = analysis.candidate_name
        
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    port = int(os.getenv("PORT", 5000))
    print(f"✅ Starting ResumeScore API on port {port}")
    print(f"🔗 Health: http://localhost:{port}/health")
    print(f"🔗 API: http://localhost:{port}/api")
    print("-" * 60)
    
    try:
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        traceback.print_exc()
        sys.exit(1)
