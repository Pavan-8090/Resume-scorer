import os
import sys
from pathlib import Path

# Fix Python path to prevent conflicts with 'frontend' directory
# PyMuPDF's fitz module conflicts with project's frontend directory
backend_dir = Path(__file__).parent.absolute()
parent_dir = backend_dir.parent

# Change to backend directory first
os.chdir(backend_dir)

# Remove parent directory from sys.path if present to avoid frontend import conflict
if str(parent_dir) in sys.path:
    sys.path.remove(str(parent_dir))

# Ensure backend_python is in the path
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from dotenv import load_dotenv
from resume_analyzer import upload_model_to_hf

load_dotenv()

app = FastAPI(title="ResumeScore API")

# CORS middleware - Support both local and production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,chrome-extension://").split(",")
# Add Chrome extension origin pattern
allowed_origins.append("chrome-extension://*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"chrome-extension://.*",  # Allow all Chrome extensions
)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}

# Models
class JobPostCreate(BaseModel):
    title: str
    jobDescription: str

class ModelUploadRequest(BaseModel):
    folder_path: str
    repo_id: str

# In-memory storage (use MongoDB in production)
jobs_db = {}
analyses_db = {}

@app.post("/api/jobs")
async def create_job_post(job: JobPostCreate):
    import uuid
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
async def analyze_resume(
    job_id: str,
    resumes: List[UploadFile] = File(...)
):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job post not found")
    
    job_post = jobs_db[job_id]
    job_description = job_post["jobDescription"]
    
    from resume_analyzer import analyze_resume_file
    
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
            
            import uuid
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
            print(f"Exception type: {type(e).__name__}")
            import traceback
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

@app.post("/api/models/upload")
async def upload_model(request: ModelUploadRequest):
    """Upload a trained model to Hugging Face Hub"""
    try:
        success = upload_model_to_hf(request.folder_path, request.repo_id)
        if success:
            return {"message": f"Model uploaded successfully to {request.repo_id}", "status": "success"}
        else:
            raise HTTPException(status_code=500, detail="Failed to upload model")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/rewrite")
async def rewrite_resume_endpoint(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    original_score: Optional[float] = Form(None)
):
    """Rewrite resume to match job description using AI"""
    try:
        file_content = await resume.read()
        file_name = resume.filename or "resume.pdf"
        
        from resume_analyzer import rewrite_resume
        
        result = await rewrite_resume(
            file_content=file_content,
            file_name=file_name,
            job_description=job_description
        )
        
        # Add original score if provided
        if original_score is not None:
            result["originalScore"] = original_score
            if result.get("rewrittenScore"):
                result["scoreImprovement"] = result["rewrittenScore"] - original_score
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to rewrite resume: {str(e)}")

class TextResumeAnalysis(BaseModel):
    resume_text: str
    candidate_name: Optional[str] = "Unknown Candidate"
    job_description: str

@app.post("/api/resume/analyze-text")
async def analyze_text_resume(analysis: TextResumeAnalysis):
    """Analyze resume from text (for Chrome extension)"""
    try:
        from resume_analyzer import analyze_resume_file
        
        # Convert text to bytes (simulate file)
        resume_text_bytes = analysis.resume_text.encode('utf-8')
        file_name = f"{analysis.candidate_name.replace(' ', '_')}_resume.txt"
        
        # Use existing analysis function
        result = await analyze_resume_file(
            file_content=resume_text_bytes,
            file_name=file_name,
            job_description=analysis.job_description
        )
        
        # Override candidate name if provided
        if analysis.candidate_name and analysis.candidate_name != "Unknown Candidate":
            result["candidateName"] = analysis.candidate_name
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

if __name__ == "__main__":
    import sys
    import io
    # Fix Windows console encoding for emojis
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    port = int(os.getenv("PORT", 5000))
    print(f"✅ Starting ResumeScore Python backend on port {port}")
    print(f"🔗 Health check: http://localhost:{port}/health")
    print(f"🔗 API base: http://localhost:{port}/api")
    print(f"🤖 Using: PyResparser + spaCy + SentenceTransformer")
    print(f"🔄 Server will auto-restart on errors")
    print("-" * 60)
    
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=port,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)