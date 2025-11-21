import io
import os
from typing import Dict, List
import fitz  # PyMuPDF
import docx2txt
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
from huggingface_hub import HfApi, snapshot_download
from dotenv import load_dotenv

load_dotenv()

# Try to import PyResparser and spaCy
try:
    from pyresparser import ResumeParser
    PYRESPARSER_AVAILABLE = True
except ImportError:
    PYRESPARSER_AVAILABLE = False
    print("WARNING: PyResparser not available. Install with: pip install pyresparser")

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
        SPACY_AVAILABLE = True
    except OSError:
        print("WARNING: spaCy model not found. Run: python -m spacy download en_core_web_sm")
        SPACY_AVAILABLE = False
except ImportError:
    SPACY_AVAILABLE = False
    print("WARNING: spaCy not available. Install with: pip install spacy")

# Load SentenceTransformer model
_embedder = None
_hf_api = None

def get_hf_api():
    """Get Hugging Face API client"""
    global _hf_api
    if _hf_api is None:
        hf_token = os.getenv("HF_TOKEN")
        if hf_token:
            _hf_api = HfApi(token=hf_token)
            print("SUCCESS: Initialized Hugging Face Hub API")
        else:
            print("WARNING: HF_TOKEN not set. Hugging Face Hub features disabled.")
    return _hf_api

def load_model_from_hf(repo_id: str = None):
    """Load model from Hugging Face Hub or use default"""
    if repo_id:
        try:
            hf_api = get_hf_api()
            if hf_api:
                print(f"Loading model from Hugging Face Hub: {repo_id}")
                # Download model if not cached
                model_path = snapshot_download(
                    repo_id=repo_id,
                    token=os.getenv("HF_TOKEN"),
                    cache_dir=None  # Use default cache
                )
                return SentenceTransformer(model_path)
            else:
                print(f"HF_TOKEN not available, trying to load {repo_id} without auth...")
                return SentenceTransformer(repo_id)
        except Exception as e:
            print(f"Failed to load model from HF Hub {repo_id}: {e}")
            print("Falling back to default model...")
    
    # Default model
    return SentenceTransformer('all-MiniLM-L6-v2')

def get_embedder():
    """Get or initialize the embedding model"""
    global _embedder
    if _embedder is None:
        try:
            # Try to load custom model from HF Hub if specified
            custom_model = os.getenv("HF_MODEL_ID", "all-MiniLM-L6-v2")
            
            if custom_model.startswith("PavanRathodR/") or "/" in custom_model:
                # Custom model from Hugging Face Hub
                _embedder = load_model_from_hf(custom_model)
            else:
                # Default model
                _embedder = SentenceTransformer(custom_model)
            
            print(f"SUCCESS: Loaded SentenceTransformer model: {custom_model}")
        except Exception as e:
            print(f"WARNING: Could not load SentenceTransformer: {e}")
            _embedder = None
    return _embedder

def upload_model_to_hf(folder_path: str, repo_id: str):
    """Upload a trained model to Hugging Face Hub"""
    try:
        hf_api = get_hf_api()
        if not hf_api:
            raise ValueError("HF_TOKEN not set. Cannot upload to Hugging Face Hub.")
        
        if not os.path.exists(folder_path):
            raise ValueError(f"Model folder not found: {folder_path}")
        
        print(f"Uploading model from {folder_path} to {repo_id}...")
        hf_api.upload_folder(
            folder_path=folder_path,
            repo_id=repo_id,
            repo_type="model",
        )
        print(f"SUCCESS: Model uploaded to {repo_id}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to upload model: {e}")
        return False

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using PyMuPDF"""
    try:
        doc = fitz.open(stream=file_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        raise Exception(f"Failed to parse PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX using docx2txt"""
    try:
        text = docx2txt.process(io.BytesIO(file_content))
        return text
    except Exception as e:
        raise Exception(f"Failed to parse DOCX: {str(e)}")

def extract_resume_text(file_content: bytes, file_name: str) -> str:
    """Extract text from resume file"""
    file_ext = file_name.lower().split('.')[-1] if '.' in file_name else ''
    
    if file_ext == 'pdf':
        return extract_text_from_pdf(file_content)
    elif file_ext in ['docx', 'doc']:
        return extract_text_from_docx(file_content)
    else:
        raise ValueError(f"Unsupported file type: {file_ext}")

def extract_skills_with_spacy(resume_text: str) -> List[str]:
    """Extract skills using spaCy"""
    if not SPACY_AVAILABLE:
        return []
    
    doc = nlp(resume_text)
    skills = []
    
    # Common skill keywords
    skill_keywords = [
        'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
        'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
        'leadership', 'communication', 'project management', 'teamwork', 'problem solving',
        'marketing', 'sales', 'analytics', 'design', 'writing', 'analysis', 'agile',
        'devops', 'aws', 'docker', 'kubernetes', 'git', 'ci/cd', 'machine learning',
        'data science', 'ai', 'tensorflow', 'pytorch', 'postgresql', 'mongodb'
    ]
    
    resume_lower = resume_text.lower()
    for keyword in skill_keywords:
        if keyword in resume_lower:
            skills.append(keyword.title())
    
    return list(set(skills))[:10]

def parse_resume_with_pyresparser(file_content: bytes, file_name: str) -> Dict:
    """Parse resume using PyResparser"""
    if not PYRESPARSER_AVAILABLE:
        return {}
    
    try:
        # Save file temporarily
        import tempfile
        import os
        
        file_ext = file_name.split('.')[-1] if '.' in file_name else 'pdf'
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}')
        temp_file.write(file_content)
        temp_file.close()
        
        # Parse resume
        data = ResumeParser(temp_file.name).get_extracted_data()
        
        # Clean up
        os.unlink(temp_file.name)
        
        return data
    except Exception as e:
        print(f"PyResparser error: {e}")
        return {}

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity using SentenceTransformer"""
    embedder = get_embedder()
    if embedder is None:
        return calculate_keyword_match(text1, text2)
    
    try:
        # Truncate to avoid token limits
        text1_truncated = text1[:2000] if len(text1) > 2000 else text1
        text2_truncated = text2[:2000] if len(text2) > 2000 else text2
        
        embeddings = embedder.encode([text1_truncated, text2_truncated])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    except Exception as e:
        print(f"Error in semantic similarity: {e}")
        return calculate_keyword_match(text1, text2)

def calculate_keyword_match(resume_text: str, job_description: str) -> float:
    """Fallback keyword matching - improved accuracy"""
    resume_lower = resume_text.lower()
    job_lower = job_description.lower()
    
    common_skills = [
        'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
        'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
        'leadership', 'communication', 'project management', 'teamwork', 'problem solving',
        'marketing', 'sales', 'analytics', 'design', 'writing', 'analysis', 'agile',
        'devops', 'aws', 'docker', 'kubernetes', 'git', 'ci/cd', 'machine learning',
        'data science', 'ai', 'tensorflow', 'pytorch', 'postgresql', 'mongodb', 'redis',
        'elasticsearch', 'kafka', 'rabbitmq', 'nginx', 'apache', 'linux', 'terraform',
        'ansible', 'jenkins', 'github actions', 'graphql', 'rest api', 'microservices'
    ]
    
    # Count matched skills
    matched_skills = [skill for skill in common_skills if skill in job_lower and skill in resume_lower]
    required_skills = [skill for skill in common_skills if skill in job_lower]
    
    if len(required_skills) == 0:
        # No specific skills mentioned, use general text similarity
        resume_words = set(resume_lower.split())
        job_words = set(job_lower.split())
        common_words = resume_words.intersection(job_words)
        if len(job_words) > 0:
            return min(0.7, len(common_words) / len(job_words))
        return 0.5
    
    # Calculate skill match percentage
    skill_match_ratio = len(matched_skills) / len(required_skills) if required_skills else 0
    
    # Base score from skill matching (0-0.8 range)
    base_score = min(0.8, skill_match_ratio * 0.8)
    
    # Add bonus for having extra relevant skills (0-0.2 range)
    extra_skills = [skill for skill in common_skills if skill in resume_lower and skill not in required_skills]
    bonus = min(0.2, len(extra_skills) * 0.02)
    
    final_score = base_score + bonus
    return min(1.0, max(0.0, final_score))

def extract_job_required_skills(job_description: str) -> List[str]:
    """Extract skills mentioned in job description"""
    job_lower = job_description.lower()
    
    skills = [
        'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
        'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
        'leadership', 'communication', 'project management', 'teamwork', 'problem solving',
        'marketing', 'sales', 'analytics', 'design', 'writing', 'analysis', 'agile',
        'devops', 'aws', 'docker', 'kubernetes', 'git', 'ci/cd', 'machine learning',
        'data science', 'ai', 'tensorflow', 'pytorch', 'postgresql', 'mongodb', 'redis',
        'elasticsearch', 'kafka', 'rabbitmq', 'nginx', 'apache', 'linux', 'terraform',
        'ansible', 'jenkins', 'github actions', 'graphql', 'rest api', 'microservices'
    ]
    
    required = []
    for skill in skills:
        if skill in job_lower:
            required.append(skill.title())
    
    return required[:15]  # Return top 15 required skills

def extract_resume_skills(resume_text: str) -> List[str]:
    """Extract skills mentioned in resume"""
    resume_lower = resume_text.lower()
    
    skills = [
        'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
        'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
        'leadership', 'communication', 'project management', 'teamwork', 'problem solving',
        'marketing', 'sales', 'analytics', 'design', 'writing', 'analysis', 'agile',
        'devops', 'aws', 'docker', 'kubernetes', 'git', 'ci/cd', 'machine learning',
        'data science', 'ai', 'tensorflow', 'pytorch', 'postgresql', 'mongodb', 'redis',
        'elasticsearch', 'kafka', 'rabbitmq', 'nginx', 'apache', 'linux', 'terraform',
        'ansible', 'jenkins', 'github actions', 'graphql', 'rest api', 'microservices'
    ]
    
    found = []
    for skill in skills:
        if skill in resume_lower:
            found.append(skill.title())
    
    return found[:15]  # Return top 15 resume skills

def extract_matched_skills(resume_text: str, job_description: str) -> List[str]:
    """Extract skills that match between resume and job description"""
    resume_lower = resume_text.lower()
    job_lower = job_description.lower()
    
    skills = [
        'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
        'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
        'leadership', 'communication', 'project management', 'teamwork', 'problem solving',
        'marketing', 'sales', 'analytics', 'design', 'writing', 'analysis', 'agile',
        'devops', 'aws', 'docker', 'kubernetes', 'git', 'ci/cd', 'machine learning',
        'data science', 'ai', 'tensorflow', 'pytorch', 'postgresql', 'mongodb', 'redis',
        'elasticsearch', 'kafka', 'rabbitmq', 'nginx', 'apache', 'linux', 'terraform',
        'ansible', 'jenkins', 'github actions', 'graphql', 'rest api', 'microservices'
    ]
    
    matched = []
    for skill in skills:
        if skill in job_lower and skill in resume_lower:
            matched.append(skill.title())
    
    return matched[:10]

def get_skill_comparison(resume_text: str, job_description: str) -> Dict:
    """Get detailed skill comparison between job and resume"""
    job_skills = extract_job_required_skills(job_description)
    resume_skills = extract_resume_skills(resume_text)
    matched_skills = extract_matched_skills(resume_text, job_description)
    
    # Calculate match percentage
    match_percentage = (len(matched_skills) / len(job_skills) * 100) if job_skills else 0
    
    # Get missing skills (required but not in resume)
    missing_skills = [s for s in job_skills if s not in matched_skills]
    
    # Get extra skills (in resume but not required)
    extra_skills = [s for s in resume_skills if s not in matched_skills]
    
    # Create skill scores with colors (green > yellow > orange > red)
    # Matched skills = highest (green), Extra skills = good (yellow), Missing skills = low (orange/red)
    skill_scores = []
    
    # Matched skills - Green (100%)
    for skill in matched_skills:
        skill_scores.append({
            "skill": skill,
            "score": 100,
            "status": "matched",
            "color": "#10B981"  # Green
        })
    
    # Extra skills - Yellow (70%)
    for skill in extra_skills[:10]:
        skill_scores.append({
            "skill": skill,
            "score": 70,
            "status": "extra",
            "color": "#F59E0B"  # Yellow/Amber
        })
    
    # Missing skills - Orange (40%) and Red (20%)
    for idx, skill in enumerate(missing_skills[:10]):
        # First half orange, second half red
        if idx < len(missing_skills) // 2:
            skill_scores.append({
                "skill": skill,
                "score": 40,
                "status": "missing",
                "color": "#F97316"  # Orange
            })
        else:
            skill_scores.append({
                "skill": skill,
                "score": 20,
                "status": "missing",
                "color": "#EF4444"  # Red
            })
    
    # Sort by score (highest first)
    skill_scores.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "jobRequiredSkills": job_skills,
        "resumeSkills": resume_skills,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills[:10],
        "extraSkills": extra_skills[:10],
        "matchPercentage": round(match_percentage, 1),
        "skillScores": skill_scores  # New: All skills with scores and colors
    }

def generate_strengths(resume_text: str, match_score: float, matched_skills: List[str], parsed_data: Dict) -> List[str]:
    """Generate strengths"""
    resume_lower = resume_text.lower()
    strengths = []
    
    # Use parsed data if available
    if parsed_data.get('skills'):
        top_skills = parsed_data['skills'][:2]
        strengths.extend([f"Strong {s} skills" for s in top_skills])
    
    if matched_skills:
        if not strengths:
            strengths.append(f"Strong {matched_skills[0]} skills")
        if len(matched_skills) > 1 and len(strengths) < 2:
            strengths.append(f"Proficient in {matched_skills[1]}")
    
    if 'experience' in resume_lower or parsed_data.get('experience'):
        strengths.append("Relevant work experience")
    elif 'degree' in resume_lower or parsed_data.get('degree'):
        strengths.append("Solid educational background")
    
    return strengths[:3] if strengths else ["Technical expertise", "Good foundation", "Potential candidate"]

def generate_weaknesses(resume_text: str, match_score: float, matched_skills: List[str]) -> List[str]:
    """Generate weaknesses"""
    weaknesses = []
    
    if len(matched_skills) < 3:
        weaknesses.append("Limited matching skills")
    else:
        weaknesses.append("Could use more experience")
    
    if len(resume_text) < 500:
        weaknesses.append("Resume lacks detail")
    else:
        weaknesses.append("Some skill gaps identified")
    
    if match_score < 70:
        weaknesses.append("Moderate alignment with job requirements")
    else:
        weaknesses.append("Minor areas for improvement")
    
    return weaknesses[:3]

async def analyze_resume_file(
    file_content: bytes,
    file_name: str,
    job_description: str
) -> Dict:
    """Main analysis function using PyResparser, spaCy, and SentenceTransformer"""
    # Extract text
    resume_text = extract_resume_text(file_content, file_name)
    
    if not resume_text or len(resume_text.strip()) < 50:
        raise ValueError("Could not extract sufficient text from resume")
    
    # Parse resume with PyResparser
    parsed_data = parse_resume_with_pyresparser(file_content, file_name)
    candidate_name = parsed_data.get('name') or file_name.replace('.pdf', '').replace('.docx', '').replace('.doc', '') or "Unknown Candidate"
    
    # Extract skills with spaCy
    resume_skills = extract_skills_with_spacy(resume_text)
    
    # Calculate semantic similarity
    similarity_score = calculate_semantic_similarity(resume_text, job_description)
    
    # Extract matched skills
    matched_skills = extract_matched_skills(resume_text, job_description)
    if not matched_skills and resume_skills:
        # Fallback to resume skills if no matches found
        matched_skills = resume_skills[:5]
    
    # Get detailed skill comparison
    skill_comparison = get_skill_comparison(resume_text, job_description)
    
    # Calculate combined match score: 60% semantic similarity + 40% skill matching
    skill_match_score = skill_comparison.get('matchPercentage', 0) / 100.0
    combined_score = (similarity_score * 0.6) + (skill_match_score * 0.4)
    
    # Ensure score is between 0 and 100
    match_score = int(max(0, min(100, combined_score * 100)))
    
    # Debug logging
    print(f"Match Score Calculation:")
    print(f"  - Semantic similarity: {similarity_score:.2f} ({similarity_score*100:.1f}%)")
    print(f"  - Skill match: {skill_match_score:.2f} ({skill_match_score*100:.1f}%)")
    print(f"  - Combined score: {combined_score:.2f} ({match_score}%)")
    print(f"  - Matched skills: {len(matched_skills)}")
    
    # Generate strengths and weaknesses (keeping for backward compatibility)
    strengths = generate_strengths(resume_text, similarity_score, matched_skills, parsed_data)
    weaknesses = generate_weaknesses(resume_text, similarity_score, matched_skills)
    
    return {
        "candidateName": candidate_name,
        "matchScore": match_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "skillMatches": matched_skills[:5],
        "allSkills": resume_skills[:10] if resume_skills else [],
        "skillComparison": skill_comparison
    }