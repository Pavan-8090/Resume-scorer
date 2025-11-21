import io
import os
import json
from typing import Dict, List
import fitz  # PyMuPDF
import docx2txt
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
from huggingface_hub import HfApi, snapshot_download
from dotenv import load_dotenv
import requests

load_dotenv()

# Try to import OpenAI
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("WARNING: OpenAI not installed. Install with: pip install openai")

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

def is_valid_skill(skill: str) -> bool:
    """Check if a string is a valid skill (not phone number, email, etc.)"""
    import re
    skill_lower = skill.lower().strip()
    
    # Filter out phone numbers (patterns like (501) 650-8445, 501-650-8445, etc.)
    phone_pattern = r'[\d\s\-\(\)]{10,}'
    if re.search(phone_pattern, skill):
        return False
    
    # Filter out emails
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    if re.search(email_pattern, skill):
        return False
    
    # Filter out URLs
    url_pattern = r'https?://|www\.'
    if re.search(url_pattern, skill_lower):
        return False
    
    # Filter out pure numbers or very short strings
    if len(skill_lower) < 2 or skill_lower.isdigit():
        return False
    
    # Filter out common non-skill words
    non_skills = ['com', 'www', 'http', 'https', 'email', 'phone', 'address', 'summary']
    if skill_lower in non_skills:
        return False
    
    return True

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
            skill_title = skill.title()
            if is_valid_skill(skill_title):
                matched.append(skill_title)
    
    return matched[:10]

def generate_improvement_suggestions(resume_text: str, job_description: str, match_score: int, skill_comparison: Dict) -> List[str]:
    """Generate actionable suggestions to improve resume match score to 100%"""
    suggestions = []
    resume_lower = resume_text.lower()
    job_lower = job_description.lower()
    
    # Get missing skills
    missing_skills = skill_comparison.get('missingSkills', [])
    job_required_skills = skill_comparison.get('jobRequiredSkills', [])
    resume_skills = skill_comparison.get('resumeSkills', [])
    
    # Calculate how many points each skill might add (rough estimate)
    points_needed = 100 - match_score
    skills_needed = max(1, min(len(missing_skills), points_needed // 10))
    
    # Suggest adding missing skills
    if missing_skills and skills_needed > 0:
        top_missing = missing_skills[:skills_needed]
        for skill in top_missing:
            suggestions.append(f"Add '{skill}' to your resume - this is a key requirement for this position")
    
    # Extract key requirements from job description
    key_phrases = []
    job_sentences = [s.strip() for s in job_lower.split('.') if len(s.strip()) > 30]
    
    # Look for requirement patterns
    requirement_keywords = ['required', 'must have', 'essential', 'necessary', 'should have', 'looking for']
    for sentence in job_sentences[:10]:
        if any(keyword in sentence for keyword in requirement_keywords):
            # Extract skills/technologies mentioned
            tech_keywords = ['python', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 
                           'experience', 'years', 'degree', 'certification', 'knowledge']
            if any(keyword in sentence for keyword in tech_keywords):
                key_phrases.append(sentence[:100])
    
    # Suggest adding experience/qualifications
    if 'years' in job_lower or 'experience' in job_lower:
        # Extract years requirement
        import re
        years_match = re.search(r'(\d+)\+?\s*years?', job_lower)
        if years_match:
            years_req = years_match.group(1)
            if f'{years_req} years' not in resume_lower and f'{years_req}+ years' not in resume_lower:
                suggestions.append(f"Highlight {years_req}+ years of relevant experience if you have it")
    
    # Suggest adding education if mentioned in job
    if ('degree' in job_lower or 'bachelor' in job_lower or 'master' in job_lower) and 'degree' not in resume_lower:
        suggestions.append("Include your educational qualifications if they match the job requirements")
    
    # Suggest adding certifications
    if 'certification' in job_lower or 'certified' in job_lower:
        if 'certification' not in resume_lower and 'certified' not in resume_lower:
            suggestions.append("Add relevant certifications if you have them - this is mentioned in the job requirements")
    
    # Suggest improving skill descriptions
    if len(resume_skills) < len(job_required_skills) * 0.7:
        suggestions.append("Expand your skills section to better match the job requirements")
    
    # Suggest adding relevant projects
    if 'project' in job_lower and 'project' not in resume_lower:
        suggestions.append("Add relevant projects or portfolio items that demonstrate your skills")
    
    # If score is very low, suggest major improvements
    if match_score < 50:
        suggestions.append("Consider gaining experience in the required technologies before applying")
        suggestions.append("Take online courses or certifications to bridge skill gaps")
    
    # Limit to top 5-7 most actionable suggestions
    return suggestions[:7] if suggestions else [
        "Review the job description carefully and add relevant keywords",
        "Highlight your most relevant experience at the top of your resume",
        "Ensure all required skills are mentioned in your resume"
    ]

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
    """Generate strengths - Only based on matched skills from job description"""
    strengths = []
    
    # Only use matched skills that are required in job description and present in resume
    # Filter out any invalid skills (phone numbers, emails, etc.)
    valid_matched_skills = [s for s in matched_skills if is_valid_skill(s)]
    
    if valid_matched_skills:
        if len(valid_matched_skills) >= 1:
            strengths.append(f"Strong {valid_matched_skills[0]} skills")
        if len(valid_matched_skills) >= 2:
            strengths.append(f"Proficient in {valid_matched_skills[1]}")
        if len(valid_matched_skills) >= 3:
            strengths.append(f"Experienced with {valid_matched_skills[2]}")
    
    # Add general strengths only if we have matched skills
    if valid_matched_skills:
        if len(valid_matched_skills) >= 2:
            strengths.append("Multiple required skills present")
    
    return strengths[:3] if strengths else ["Some relevant skills identified"]

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

async def analyze_with_openai(resume_text: str, job_description: str, candidate_name: str) -> Dict:
    """Analyze resume using OpenAI GPT-4 API (Pure AI)"""
    if not OPENAI_AVAILABLE:
        raise ValueError("OpenAI library not installed. Install with: pip install openai")
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY not set. Cannot use OpenAI analysis.")
    
    client = openai.OpenAI(api_key=openai_api_key)
    
    prompt = f"""You are an expert resume analyzer. Analyze the following resume against the job description and provide a comprehensive assessment.

Job Description:
{job_description[:2000]}

Resume:
{resume_text[:3000]}

Provide a detailed analysis in JSON format with the following structure:
{{
  "matchScore": <number 0-100, representing overall match percentage>,
  "candidateName": "{candidate_name}",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "skillMatches": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "allSkills": ["skill1", "skill2", "skill3", ...],
  "skillComparison": {{
    "jobRequiredSkills": ["skill1", "skill2", ...],
    "resumeSkills": ["skill1", "skill2", ...],
    "matchedSkills": ["skill1", "skill2", ...],
    "missingSkills": ["skill1", "skill2", ...],
    "extraSkills": ["skill1", "skill2", ...],
    "matchPercentage": <number>,
    "skillScores": [
      {{"skill": "skill1", "score": 100, "status": "matched", "color": "#10B981"}},
      ...
    ]
  }}
}}

Respond ONLY with valid JSON, no markdown, no code blocks, no explanations."""

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4"),
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional resume analyzer. Always respond with valid JSON only, no markdown formatting, no code blocks."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        response_text = response.choices[0].message.content
        # Clean response
        if response_text.startswith("```"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        analysis = json.loads(response_text)
        
        # Ensure all required fields exist
        match_score = int(analysis.get("matchScore", 0))
        skill_comparison = analysis.get("skillComparison", {})
        
        # Generate improvement suggestions if score < 100%
        improvement_suggestions = analysis.get("improvementSuggestions", [])
        if not improvement_suggestions and match_score < 100:
            improvement_suggestions = generate_improvement_suggestions(
                resume_text, job_description, match_score, skill_comparison
            )
        
        # Filter matched skills to remove phone numbers, emails, etc.
        raw_skill_matches = analysis.get("skillMatches", [])
        filtered_skill_matches = [s for s in raw_skill_matches if is_valid_skill(str(s))][:5]
        
        # If no valid matched skills from AI, use skillComparison matched skills
        if not filtered_skill_matches and skill_comparison.get("matchedSkills"):
            filtered_skill_matches = [s for s in skill_comparison.get("matchedSkills", []) if is_valid_skill(str(s))][:5]
        
        result = {
            "candidateName": analysis.get("candidateName", candidate_name),
            "matchScore": match_score,
            "strengths": analysis.get("strengths", [])[:3],
            "weaknesses": analysis.get("weaknesses", [])[:3],
            "skillMatches": filtered_skill_matches,
            "allSkills": [s for s in analysis.get("allSkills", []) if is_valid_skill(str(s))][:10],
            "improvementSuggestions": improvement_suggestions,
            "skillComparison": skill_comparison
        }
        
        print(f"AI Analysis Complete - Match Score: {result['matchScore']}%")
        return result
        
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        raise

async def analyze_with_huggingface(resume_text: str, job_description: str, candidate_name: str) -> Dict:
    """Analyze resume using Hugging Face Inference API (Pure AI)"""
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        raise ValueError("HF_TOKEN not set. Cannot use Hugging Face Inference API.")
    
    # Use a better model for text generation - try Mistral or use a simpler approach
    # Using a text-to-text model that's more reliable
    model_id = os.getenv("HF_INFERENCE_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")
    api_url = f"https://api-inference.huggingface.co/models/{model_id}"
    
    prompt = f"""<s>[INST] You are an expert resume analyzer. Analyze the resume against the job description and provide a JSON response.

Job Description:
{job_description[:1500]}

Resume:
{resume_text[:2000]}

Provide analysis in this exact JSON format:
{{
  "matchScore": 75,
  "strengths": ["Strong technical skills", "Relevant experience"],
  "weaknesses": ["Missing some required skills"],
  "skillMatches": ["Python", "JavaScript", "React"]
}}

Only return the JSON, no other text. [/INST]"""

    headers = {"Authorization": f"Bearer {hf_token}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 500,
            "temperature": 0.3,
            "return_full_text": False
        }
    }
    
    try:
        print(f"Calling Hugging Face API: {model_id}")
        response = requests.post(api_url, headers=headers, json=payload, timeout=90)
        
        if response.status_code == 503:
            raise ValueError(f"Model {model_id} is loading. Please wait a moment and try again, or use a different model.")
        
        response.raise_for_status()
        result_data = response.json()
        
        # Handle different response formats
        if isinstance(result_data, list) and len(result_data) > 0:
            result_text = result_data[0].get("generated_text", "")
        elif isinstance(result_data, dict):
            result_text = result_data.get("generated_text", "")
        else:
            result_text = str(result_data)
        
        # Try to extract JSON from response
        json_match = re.search(r'\{[^{}]*"matchScore"[^{}]*\}', result_text, re.DOTALL)
        if not json_match:
            # Try broader match
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        
        if json_match:
            try:
                analysis = json.loads(json_match.group())
            except json.JSONDecodeError:
                # If JSON parsing fails, create a basic response
                print(f"Warning: Could not parse JSON from response: {result_text[:200]}")
                raise ValueError("AI response format is invalid. Please try again or configure OpenAI API.")
        else:
            raise ValueError(f"Could not extract JSON from AI response: {result_text[:200]}")
        
        # Ensure all required fields
        match_score = analysis.get("matchScore", 0)
        if isinstance(match_score, str):
            match_score = int(re.search(r'\d+', match_score).group()) if re.search(r'\d+', match_score) else 0
        
        # Get skill comparison for missing skills
        skill_comparison = analysis.get("skillComparison", {})
        if not skill_comparison or not skill_comparison.get("missingSkills"):
            # Generate skill comparison if not provided by AI
            skill_comparison = get_skill_comparison(resume_text, job_description)
        
        # Filter matched skills to remove phone numbers, emails, etc.
        raw_skill_matches = analysis.get("skillMatches", []) if isinstance(analysis.get("skillMatches"), list) else []
        filtered_skill_matches = [s for s in raw_skill_matches if is_valid_skill(str(s))][:5]
        
        # If no valid matched skills from AI, use skillComparison matched skills
        if not filtered_skill_matches and skill_comparison.get("matchedSkills"):
            filtered_skill_matches = [s for s in skill_comparison.get("matchedSkills", []) if is_valid_skill(str(s))][:5]
        
        return {
            "candidateName": candidate_name,
            "matchScore": int(match_score),
            "strengths": analysis.get("strengths", [])[:3] if isinstance(analysis.get("strengths"), list) else [],
            "weaknesses": analysis.get("weaknesses", [])[:3] if isinstance(analysis.get("weaknesses"), list) else [],
            "skillMatches": filtered_skill_matches,
            "allSkills": [s for s in (analysis.get("skillMatches", []) if isinstance(analysis.get("skillMatches"), list) else []) if is_valid_skill(str(s))][:10],
            "skillComparison": skill_comparison
        }
    except requests.exceptions.RequestException as e:
        print(f"Hugging Face API Request Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text[:500]}")
        raise ValueError(f"Hugging Face API error: {str(e)}. Please check your HF_TOKEN or try configuring OpenAI API.")
    except Exception as e:
        print(f"Hugging Face API Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise

async def analyze_with_semantic_similarity(resume_text: str, job_description: str, candidate_name: str) -> Dict:
    """Analyze using AI semantic similarity (SentenceTransformer) - Pure AI approach"""
    print("Using PURE AI semantic similarity analysis (SentenceTransformer)...")
    
    # Calculate semantic similarity using AI embeddings (PURE AI)
    similarity_score = calculate_semantic_similarity(resume_text, job_description)
    match_score = int(similarity_score * 100)
    
    # Use AI embeddings to extract and compare skills (PURE AI)
    embedder = get_embedder()
    if embedder:
        # Extract key phrases/skills using AI embeddings
        # Split text into sentences and find most relevant ones
        resume_sentences = [s.strip() for s in resume_text.split('.') if len(s.strip()) > 20][:20]
        job_sentences = [s.strip() for s in job_description.split('.') if len(s.strip()) > 20][:20]
        
        if resume_sentences and job_sentences:
            # Get embeddings for all sentences
            resume_embeddings = embedder.encode(resume_sentences)
            job_embeddings = embedder.encode(job_sentences)
            
            # Find best matches using cosine similarity
            from sklearn.metrics.pairwise import cosine_similarity
            similarities = cosine_similarity(resume_embeddings, job_embeddings)
            
            # Extract top matching skills/phrases
            matched_indices = []
            for i, row in enumerate(similarities):
                max_sim_idx = row.argmax()
                if row[max_sim_idx] > 0.3:  # Threshold for relevance
                    matched_indices.append((i, max_sim_idx, row[max_sim_idx]))
            
            # Sort by similarity and extract top matches
            matched_indices.sort(key=lambda x: x[2], reverse=True)
            matched_skills = [resume_sentences[idx[0]][:50] for idx in matched_indices[:5]]
            all_skills = resume_sentences[:10]
        else:
            matched_skills = []
            all_skills = []
    else:
        # Fallback if embedder not available
        matched_skills = []
        all_skills = []
    
    # Generate AI-based insights using the similarity score
    strengths = []
    weaknesses = []
    
    if match_score >= 80:
        strengths = ["Excellent match with job requirements", "Strong alignment with role expectations", "Highly qualified candidate"]
        weaknesses = ["Minor areas for improvement"]
    elif match_score >= 60:
        strengths = ["Good match with job requirements", "Relevant experience and skills"]
        weaknesses = ["Some skill gaps identified", "Could benefit from additional experience"]
    else:
        strengths = ["Some relevant experience"]
        weaknesses = ["Significant skill gaps", "Limited alignment with job requirements", "May need additional training"]
    
    # Get skill comparison for suggestions
    skill_comparison = get_skill_comparison(resume_text, job_description)
    
    # Generate improvement suggestions if score < 100%
    improvement_suggestions = []
    if match_score < 100:
        improvement_suggestions = generate_improvement_suggestions(
            resume_text, job_description, match_score, skill_comparison
        )
    
    print(f"PURE AI Analysis Complete - Match Score: {match_score}% (from SentenceTransformer AI model)")
    
    # Generate improvement suggestions if score < 100%
    improvement_suggestions = []
    if match_score < 100:
        improvement_suggestions = generate_improvement_suggestions(
            resume_text, job_description, match_score, skill_comparison
        )
    
    # Filter matched skills to remove phone numbers, emails, etc.
    filtered_matched_skills = [s for s in matched_skills if is_valid_skill(str(s))][:5]
    filtered_all_skills = [s for s in all_skills if is_valid_skill(str(s))][:10]
    
    # If no valid matched skills, use skillComparison matched skills
    if not filtered_matched_skills and skill_comparison.get("matchedSkills"):
        filtered_matched_skills = [s for s in skill_comparison.get("matchedSkills", []) if is_valid_skill(str(s))][:5]
    
    return {
        "candidateName": candidate_name,
        "matchScore": match_score,
        "strengths": strengths[:3],
        "weaknesses": weaknesses[:3],
        "skillMatches": filtered_matched_skills,
        "allSkills": filtered_all_skills,
        "improvementSuggestions": improvement_suggestions,
        "skillComparison": skill_comparison
    }

async def analyze_resume_file(
    file_content: bytes,
    file_name: str,
    job_description: str
) -> Dict:
    """Main analysis function - Uses AI only (OpenAI or Hugging Face)"""
    # Extract text
    resume_text = extract_resume_text(file_content, file_name)
    
    if not resume_text or len(resume_text.strip()) < 50:
        raise ValueError("Could not extract sufficient text from resume")
    
    # Parse resume with PyResparser for candidate name
    parsed_data = parse_resume_with_pyresparser(file_content, file_name)
    candidate_name = parsed_data.get('name') or file_name.replace('.pdf', '').replace('.docx', '').replace('.doc', '') or "Unknown Candidate"
    
    # Try AI analysis - OpenAI first, then Hugging Face, then semantic similarity (AI-based)
    use_ai_only = os.getenv("USE_AI_ONLY", "true").lower() == "true"
    
    if use_ai_only:
        print("Using AI-only analysis mode...")
        
        # Try OpenAI first
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and openai_key != "your-openai-api-key-here":
            try:
                print("Attempting OpenAI analysis...")
                return await analyze_with_openai(resume_text, job_description, candidate_name)
            except Exception as e:
                print(f"OpenAI analysis failed: {e}")
                print("Falling back to Hugging Face...")
        
        # Try Hugging Face Inference API
        hf_token = os.getenv("HF_TOKEN")
        if hf_token:
            try:
                print("Attempting Hugging Face Inference API analysis...")
                return await analyze_with_huggingface(resume_text, job_description, candidate_name)
            except Exception as e:
                print(f"Hugging Face Inference API failed: {e}")
                print("Falling back to AI semantic similarity...")
        
        # Fallback: Use AI semantic similarity (still AI-based, just different approach)
        try:
            print("Using AI semantic similarity analysis (SentenceTransformer)...")
            return await analyze_with_semantic_similarity(resume_text, job_description, candidate_name)
        except Exception as e:
            print(f"Semantic similarity analysis failed: {e}")
            raise ValueError("All AI analysis methods failed. Please check: 1) OPENAI_API_KEY, 2) HF_TOKEN, 3) SentenceTransformer model installation.")
    
    # Fallback to old hybrid method if AI is disabled
    print("Using hybrid analysis (AI + Python)...")
    resume_skills = extract_skills_with_spacy(resume_text)
    similarity_score = calculate_semantic_similarity(resume_text, job_description)
    matched_skills = extract_matched_skills(resume_text, job_description)
    if not matched_skills and resume_skills:
        matched_skills = resume_skills[:5]
    
    skill_comparison = get_skill_comparison(resume_text, job_description)
    skill_match_score = skill_comparison.get('matchPercentage', 0) / 100.0
    combined_score = (similarity_score * 0.6) + (skill_match_score * 0.4)
    match_score = int(max(0, min(100, combined_score * 100)))
    
    strengths = generate_strengths(resume_text, similarity_score, matched_skills, parsed_data)
    weaknesses = generate_weaknesses(resume_text, similarity_score, matched_skills)
    
    # Generate improvement suggestions if score < 100%
    improvement_suggestions = []
    if match_score < 100:
        improvement_suggestions = generate_improvement_suggestions(
            resume_text, job_description, match_score, skill_comparison
        )
    
    # Filter matched skills to remove phone numbers, emails, etc.
    filtered_matched_skills = [s for s in matched_skills if is_valid_skill(str(s))][:5]
    filtered_resume_skills = [s for s in (resume_skills[:10] if resume_skills else []) if is_valid_skill(str(s))]
    
    # If no valid matched skills, use skillComparison matched skills
    if not filtered_matched_skills and skill_comparison.get("matchedSkills"):
        filtered_matched_skills = [s for s in skill_comparison.get("matchedSkills", []) if is_valid_skill(str(s))][:5]
    
    return {
        "candidateName": candidate_name,
        "matchScore": match_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "skillMatches": filtered_matched_skills,
        "allSkills": filtered_resume_skills,
        "improvementSuggestions": improvement_suggestions,
        "skillComparison": skill_comparison
    }