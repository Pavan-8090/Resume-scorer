# Code Simplification Plan

## What to KEEP (Essential for Resume Analysis)

### Core Functions:
1. `extract_resume_text()` - Extract text from PDF/DOCX/TXT
2. `analyze_resume_file()` - Main entry point
3. `analyze_with_perplexity()` - Perplexity API analysis
4. `analyze_with_openai()` - OpenAI fallback
5. `analyze_with_huggingface()` - HF fallback
6. `analyze_with_semantic_similarity()` - Final fallback
7. `get_skill_comparison()` - Skill matching
8. `calculate_modern_match_score()` - Score calculation
9. `calculate_semantic_similarity()` - Semantic similarity
10. `extract_job_required_skills()` - Extract skills from job
11. `extract_resume_skills()` - Extract skills from resume
12. `extract_matched_skills()` - Find matched skills
13. `generate_weaknesses()` - Generate weaknesses
14. `generate_strengths()` - Generate strengths
15. `is_valid_skill()` - Validate skill names
16. `parse_resume_with_pyresparser()` - Parse resume for name

### Helper Functions:
- `get_embedder()` - Get SentenceTransformer model
- `calculate_keyword_match()` - Fallback keyword matching

## What to REMOVE (Unnecessary Complexity)

1. ❌ `upload_model_to_hf()` - Model upload (not used)
2. ❌ `check_ats_compatibility()` - Advanced ATS analysis
3. ❌ `analyze_action_verbs()` - Action verb analysis
4. ❌ `analyze_keyword_density()` - Keyword density
5. ❌ `extract_quantifiable_achievements()` - Achievement extraction
6. ❌ `analyze_resume_length_structure()` - Length analysis
7. ❌ `rewrite_resume()` - Resume rewriting (unless used)
8. ❌ `get_comprehensive_skills_database()` - Complex skill DB
9. ❌ All advanced validation functions
10. ❌ Complex section validation (simplify)

## Result
- Current: ~2680 lines
- Target: ~800-1000 lines (60% reduction)
- Focus: Pure resume analysis only








