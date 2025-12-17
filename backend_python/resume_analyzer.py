"""
Simple Resume Analyzer - Pure and Clean
Uses Perplexity API for analysis with Python fallback
"""
import os
import json
import re
import io
from typing import Dict, List
from dotenv import load_dotenv

# PDF/DOCX parsing
import fitz  # PyMuPDF
import docx2txt

# AI APIs
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Semantic similarity fallback
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMER_AVAILABLE = False

load_dotenv()

# Global embedder for semantic similarity
_embedder = None

def get_embedder():
    """Get SentenceTransformer model for semantic similarity"""
    global _embedder
    if _embedder is None and SENTENCE_TRANSFORMER_AVAILABLE:
        try:
            _embedder = SentenceTransformer('all-MiniLM-L6-v2')
        except:
            _embedder = None
    return _embedder

# ============================================================================
# TEXT EXTRACTION
# ============================================================================

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF"""
    doc = fitz.open(stream=file_content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX"""
    return docx2txt.process(io.BytesIO(file_content))

def extract_resume_text(file_content: bytes, file_name: str) -> str:
    """Extract text from resume file"""
    ext = file_name.lower().split('.')[-1] if '.' in file_name else ''
    
    if ext == 'txt':
        return file_content.decode('utf-8', errors='ignore')
    elif ext == 'pdf':
        return extract_text_from_pdf(file_content)
    elif ext in ['docx', 'doc']:
        return extract_text_from_docx(file_content)
    else:
        return file_content.decode('utf-8', errors='ignore')

# ============================================================================
# SKILL EXTRACTION (Simple Python-based)
# ============================================================================

def extract_skills(text: str) -> List[str]:
    """Extract skills from text using simple keyword matching"""
    text_lower = text.lower()
    skills = []
    
    # Common skills database
    skill_keywords = {
        'python', 'javascript', 'java', 'typescript', 'react', 'node.js', 'sql',
        'html', 'css', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
        'aws', 'docker', 'kubernetes', 'git', 'mongodb', 'postgresql', 'redis',
        'agile', 'scrum', 'ci/cd', 'terraform', 'ansible', 'jenkins', 'linux',
        'machine learning', 'data science', 'ai', 'tensorflow', 'pytorch',
        'graphql', 'rest api', 'microservices', 'devops', 'azure', 'gcp'
    }
    
    for skill in skill_keywords:
        if skill in text_lower:
            skills.append(skill.title())
    
    return list(set(skills))[:20]

def get_skill_comparison(resume_text: str, job_description: str) -> Dict:
    """Compare skills between resume and job description"""
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)
    
    # Find matched and missing skills
    resume_lower = [s.lower() for s in resume_skills]
    job_lower = [s.lower() for s in job_skills]
    
    matched = [s for s in resume_skills if s.lower() in job_lower]
    missing = [s for s in job_skills if s.lower() not in resume_lower]
    
    match_percentage = (len(matched) / len(job_skills) * 100) if job_skills else 0
    
    return {
        "jobRequiredSkills": job_skills,
        "resumeSkills": resume_skills,
        "matchedSkills": matched,
        "missingSkills": missing,
        "matchPercentage": round(match_percentage, 1)
    }

# ============================================================================
# SEMANTIC SIMILARITY (Python fallback)
# ============================================================================

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity using SentenceTransformer"""
    embedder = get_embedder()
    if embedder is None:
        # Fallback: simple keyword matching
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        common = words1.intersection(words2)
        return len(common) / max(len(words1), len(words2), 1)
    
    try:
        t1 = text1[:2000] if len(text1) > 2000 else text1
        t2 = text2[:2000] if len(text2) > 2000 else text2
        embeddings = embedder.encode([t1, t2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    except:
        return 0.5

# ============================================================================
# SCORE CALCULATION (Simple Python)
# ============================================================================

def calculate_match_score(resume_text: str, job_description: str, skill_comparison: Dict) -> int:
    """Calculate match score (0-100)"""
    matched_skills = skill_comparison.get("matchedSkills", [])
    missing_skills = skill_comparison.get("missingSkills", [])
    job_skills = skill_comparison.get("jobRequiredSkills", [])
    
    # Skill match score (60% weight)
    if job_skills:
        skill_score = (len(matched_skills) / len(job_skills)) * 100
    else:
        skill_score = 50
    
    # Semantic similarity (40% weight)
    semantic_score = calculate_semantic_similarity(resume_text, job_description) * 100
    
    # Weighted combination
    final_score = (skill_score * 0.6) + (semantic_score * 0.4)
    
    # Penalty for missing skills
    if missing_skills:
        penalty = min(20, len(missing_skills) * 2)
        final_score -= penalty
    
    return max(0, min(100, int(final_score)))

# ============================================================================
# PERPLEXITY API ANALYSIS (Primary)
# ============================================================================

async def analyze_with_perplexity(resume_text: str, job_description: str, candidate_name: str) -> Dict:
    """Analyze resume using Perplexity API"""
    if not OPENAI_AVAILABLE:
        raise ValueError("OpenAI library not installed")
    
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise ValueError("PERPLEXITY_API_KEY not set")
    
    model = os.getenv("PERPLEXITY_MODEL", "sonar-deep-research")
    
    client = openai.OpenAI(api_key=api_key, base_url="https://api.perplexity.ai")
    
    prompt = f"""Analyze this resume against the job description. Return JSON only:

Job Description:
{job_description[:2000]}

Resume:
{resume_text[:3000]}

Return JSON:
{{
  "matchScore": <0-100>,
  "candidateName": "{candidate_name}",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "skillMatches": ["skill1", "skill2", "skill3"]
}}"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a resume analyzer. Return valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean JSON
        if response_text.startswith("```"):
            response_text = re.sub(r'```json?\s*', '', response_text).replace("```", "").strip()
        
        # Extract JSON
        json_match = re.search(r'\{.*"matchScore".*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        analysis = json.loads(response_text)
        
        # Get skill comparison
        skill_comparison = get_skill_comparison(resume_text, job_description)
        
        # Recalculate score for accuracy
        calculated_score = calculate_match_score(resume_text, job_description, skill_comparison)
        ai_score = int(analysis.get("matchScore", calculated_score))
        
        # Use average if scores differ significantly
        if abs(ai_score - calculated_score) > 15:
            match_score = int((ai_score * 0.4) + (calculated_score * 0.6))
        else:
            match_score = calculated_score
        
        # Generate weaknesses from missing skills
        missing_skills = skill_comparison.get("missingSkills", [])
        weaknesses = analysis.get("weaknesses", [])
        if missing_skills and not weaknesses:
            weaknesses = [f"Missing: {s}" for s in missing_skills[:5]]
        
        return {
            "candidateName": analysis.get("candidateName", candidate_name),
            "matchScore": match_score,
            "strengths": analysis.get("strengths", [])[:3],
            "weaknesses": weaknesses[:5],
            "skillMatches": analysis.get("skillMatches", skill_comparison.get("matchedSkills", []))[:5],
            "allSkills": skill_comparison.get("resumeSkills", [])[:10],
            "skillComparison": skill_comparison
        }
        
    except json.JSONDecodeError:
        # If JSON parsing fails, use Python analysis
        raise ValueError("Perplexity returned invalid JSON, using Python fallback")
    except Exception as e:
        raise ValueError(f"Perplexity API error: {str(e)}")

# ============================================================================
# PYTHON FALLBACK ANALYSIS (Simple)
# ============================================================================

def analyze_with_python(resume_text: str, job_description: str, candidate_name: str) -> Dict:
    """Simple Python-based analysis (fallback)"""
    skill_comparison = get_skill_comparison(resume_text, job_description)
    match_score = calculate_match_score(resume_text, job_description, skill_comparison)
    
    matched_skills = skill_comparison.get("matchedSkills", [])
    missing_skills = skill_comparison.get("missingSkills", [])
    
    # Generate strengths
    strengths = []
    if matched_skills:
        strengths.append(f"Strong {matched_skills[0]} skills")
        if len(matched_skills) > 1:
            strengths.append(f"Proficient in {matched_skills[1]}")
        if len(matched_skills) > 2:
            strengths.append(f"Experienced with {matched_skills[2]}")
    
    # Generate weaknesses
    weaknesses = [f"Missing: {s}" for s in missing_skills[:5]]
    
    return {
        "candidateName": candidate_name,
        "matchScore": match_score,
        "strengths": strengths[:3] if strengths else ["Relevant experience found"],
        "weaknesses": weaknesses[:5],
        "skillMatches": matched_skills[:5],
        "allSkills": skill_comparison.get("resumeSkills", [])[:10],
        "skillComparison": skill_comparison
    }

# ============================================================================
# MAIN ANALYSIS FUNCTION
# ============================================================================

async def analyze_resume_file(file_content: bytes, file_name: str, job_description: str) -> Dict:
    """Main function: Analyze resume file"""
    # Extract text
    resume_text = extract_resume_text(file_content, file_name)
    
    if not resume_text or len(resume_text.strip()) < 50:
        raise ValueError("Could not extract sufficient text from resume")
    
    # Get candidate name from filename
    candidate_name = file_name.replace('.pdf', '').replace('.docx', '').replace('.doc', '').replace('.txt', '') or "Unknown"
    
    # Try Perplexity API first
    perplexity_key = os.getenv("PERPLEXITY_API_KEY")
    if perplexity_key and perplexity_key != "your-perplexity-api-key-here":
        try:
            print("Using Perplexity API...")
            return await analyze_with_perplexity(resume_text, job_description, candidate_name)
        except Exception as e:
            print(f"Perplexity failed: {e}, using Python fallback...")
    
    # Fallback to Python analysis
    print("Using Python analysis...")
    return analyze_with_python(resume_text, job_description, candidate_name)
