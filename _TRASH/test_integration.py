#!/usr/bin/env python3
"""
Test script to verify Perplexity API integration
Tests resume analysis with a sample resume and job description
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend_python to path
backend_dir = Path(__file__).parent / "backend_python"
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import analysis function
from resume_analyzer import analyze_resume_file

async def test_resume_analysis():
    """Test resume analysis with sample files"""
    
    print("=" * 60)
    print("RESUMECHECKER INTEGRATION TEST")
    print("=" * 60)
    print()
    
    # Check environment variables
    print("Checking environment variables...")
    perplexity_key = os.getenv("PERPLEXITY_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    hf_token = os.getenv("HF_TOKEN")
    
    print(f"  PERPLEXITY_API_KEY: {'✓ Set' if perplexity_key else '✗ Not set'}")
    print(f"  OPENAI_API_KEY: {'✓ Set' if openai_key else '✗ Not set'}")
    print(f"  HF_TOKEN: {'✓ Set' if hf_token else '✗ Not set'}")
    print()
    
    if not perplexity_key and not openai_key and not hf_token:
        print("⚠ WARNING: No AI API keys found. Test will use SentenceTransformer fallback.")
        print()
    
    # Read test files (from project root)
    project_root = Path(__file__).parent
    print("Loading test files...")
    try:
        resume_path = project_root / "test_resume.txt"
        job_desc_path = project_root / "test_job_description.txt"
        
        with open(resume_path, "r", encoding="utf-8") as f:
            resume_text = f.read()
        
        with open(job_desc_path, "r", encoding="utf-8") as f:
            job_description = f.read()
        
        print("  ✓ Resume loaded")
        print("  ✓ Job description loaded")
        print()
    except FileNotFoundError as e:
        print(f"  ✗ Error: {e}")
        print("  Please ensure test_resume.txt and test_job_description.txt exist")
        return False
    
    # Convert resume text to bytes (simulate file)
    resume_bytes = resume_text.encode('utf-8')
    
    print("Starting resume analysis...")
    print("-" * 60)
    print()
    
    try:
        # Run analysis
        result = await analyze_resume_file(
            file_content=resume_bytes,
            file_name="test_resume.txt",
            job_description=job_description
        )
        
        print()
        print("=" * 60)
        print("ANALYSIS RESULTS")
        print("=" * 60)
        print()
        
        # Display key results
        print(f"Candidate Name: {result.get('candidateName', 'N/A')}")
        print(f"Match Score: {result.get('matchScore', 0)}%")
        print()
        
        # Strengths
        strengths = result.get('strengths', [])
        if strengths:
            print("Strengths:")
            for i, strength in enumerate(strengths[:3], 1):
                print(f"  {i}. {strength}")
            print()
        
        # Weaknesses
        weaknesses = result.get('weaknesses', [])
        if weaknesses:
            print("Weaknesses:")
            for i, weakness in enumerate(weaknesses[:3], 1):
                print(f"  {i}. {weakness}")
            print()
        
        # Skill Matches
        skill_matches = result.get('skillMatches', [])
        if skill_matches:
            print(f"Matched Skills ({len(skill_matches)}):")
            for skill in skill_matches[:5]:
                print(f"  • {skill}")
            print()
        
        # Skill Comparison
        skill_comparison = result.get('skillComparison', {})
        if skill_comparison:
            matched = skill_comparison.get('matchedSkills', [])
            missing = skill_comparison.get('missingSkills', [])
            print(f"Skill Analysis:")
            print(f"  Matched: {len(matched)} skills")
            print(f"  Missing: {len(missing)} skills")
            if missing:
                print(f"  Missing Skills: {', '.join(missing[:5])}")
            print()
        
        # Check if all required fields are present
        required_fields = ['candidateName', 'matchScore', 'strengths', 'weaknesses', 'skillMatches', 'skillComparison']
        missing_fields = [field for field in required_fields if field not in result]
        
        if missing_fields:
            print(f"⚠ WARNING: Missing fields: {', '.join(missing_fields)}")
        else:
            print("✓ All required fields present")
        print()
        
        # Success
        print("=" * 60)
        print("✓ TEST PASSED - Integration working correctly!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print()
        print("=" * 60)
        print("✗ TEST FAILED")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print()
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_resume_analysis())
    sys.exit(0 if success else 1)

