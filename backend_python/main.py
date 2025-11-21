from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv
from resume_analyzer import upload_model_to_hf

load_dotenv()

app = FastAPI(title="ResumeScore API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    for resume_file in resumes:
        try:
            file_content = await resume_file.read()
            file_name = resume_file.filename or "unknown"
            
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
            
        except Exception as e:
            print(f"Error processing {resume_file.filename}: {str(e)}")
            continue
    
    if not results:
        raise HTTPException(status_code=400, detail="Failed to process any resumes")
    
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

if __name__ == "__main__":
    import sys
    import io
    # Fix Windows console encoding for emojis
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    port = int(os.getenv("PORT", 5000))
    print(f"Starting ResumeScore Python backend on port {port}")
    print(f"Health check: http://localhost:{port}/health")
    print(f"API base: http://localhost:{port}/api")
    print(f"Using: PyResparser + spaCy + SentenceTransformer")
    uvicorn.run(app, host="0.0.0.0", port=port)