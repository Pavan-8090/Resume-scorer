# Perplexity API Integration

## Overview

ResumeChecker now supports **Perplexity API** as the **primary AI analysis engine**, with OpenAI and Hugging Face as fallbacks.

## Why Perplexity?

- **Better Analysis**: `sonar-deep-research` and `sonar-reasoning-pro` models provide superior reasoning for resume evaluation
- **Cost Effective**: Competitive pricing for Tier 0 users
- **Rate Limits**: 
  - `sonar-deep-research`: 5 RPM
  - `sonar-reasoning-pro`: 50 RPM
  - `sonar-reasoning`: 50 RPM
  - `sonar-pro`: 50 RPM
  - `sonar`: 50 RPM

## API Priority Order

The system tries APIs in this order:

1. **Perplexity API** (if `PERPLEXITY_API_KEY` is set) ⭐ **Recommended**
2. OpenAI API (if `OPENAI_API_KEY` is set)
3. Hugging Face Inference API (if `HF_TOKEN` is set)
4. SentenceTransformer (local, always available as fallback)

## Setup

### 1. Get Perplexity API Key

1. Sign up at https://www.perplexity.ai/
2. Go to API settings
3. Generate an API key
4. Copy your key

### 2. Configure Environment

Add to your `.env` file:

```env
# Perplexity API (Recommended - Primary)
PERPLEXITY_API_KEY=pplx-your-api-key-here
PERPLEXITY_MODEL=sonar-deep-research

# Optional fallbacks
OPENAI_API_KEY=your-openai-key
HF_TOKEN=your-huggingface-token
```

### 3. Available Models

| Model | Use Case | RPM | Best For |
|-------|----------|-----|----------|
| `sonar-deep-research` | Deep analysis | 5 | Comprehensive resume evaluation |
| `sonar-reasoning-pro` | Advanced reasoning | 50 | Detailed skill matching |
| `sonar-reasoning` | Standard reasoning | 50 | General analysis |
| `sonar-pro` | Pro tier | 50 | Balanced performance |
| `sonar` | Standard | 50 | Basic analysis |

**Recommended**: Use `sonar-deep-research` for best analysis quality (5 RPM is sufficient for most use cases).

## Usage

### For Resume Analysis

The system automatically uses Perplexity if `PERPLEXITY_API_KEY` is configured:

```python
# Automatically called when analyzing resumes
result = await analyze_resume_file(
    file_content=resume_bytes,
    file_name="resume.pdf",
    job_description=job_desc
)
```

### For Resume Rewriting

Perplexity is also used for AI-powered resume rewriting:

```python
rewritten = await rewrite_resume(
    file_content=resume_bytes,
    file_name="resume.pdf",
    job_description=job_desc
)
```

## Implementation Details

### API Endpoint

Perplexity uses OpenAI-compatible API:
- Base URL: `https://api.perplexity.ai`
- Uses OpenAI Python library with custom `base_url`

### Function: `analyze_with_perplexity()`

Located in `backend_python/resume_analyzer.py`:

```python
async def analyze_with_perplexity(
    resume_text: str,
    job_description: str,
    candidate_name: str,
    parsed_data: Dict = None
) -> Dict
```

**Features:**
- Uses `sonar-deep-research` by default (configurable via `PERPLEXITY_MODEL`)
- Returns comprehensive analysis with match score, strengths, weaknesses, skills
- Combines AI analysis with modern scoring algorithm for accuracy
- Handles JSON response parsing and error handling

### Error Handling

If Perplexity API fails, the system automatically falls back to:
1. OpenAI API
2. Hugging Face API
3. SentenceTransformer (local)

## Rate Limiting

### Tier 0 Limits

- `sonar-deep-research`: **5 requests/minute**
- `sonar-reasoning-pro`: **50 requests/minute**
- Other models: **50 requests/minute**

### Recommendations

- For **production**: Use `sonar-reasoning-pro` (50 RPM) for better throughput
- For **best quality**: Use `sonar-deep-research` (5 RPM) for comprehensive analysis
- Monitor usage to avoid rate limit errors

## Testing

### Test Perplexity Integration

```bash
# Set environment variable
export PERPLEXITY_API_KEY=pplx-your-key
export PERPLEXITY_MODEL=sonar-deep-research

# Run backend
cd backend_python
python main.py

# Test health endpoint
curl http://localhost:5000/health

# Analyze a resume (via API or frontend)
```

### Verify API is Being Used

Check backend logs:
```
Attempting Perplexity API analysis...
Perplexity AI Analysis Complete - Match Score: 85%
```

## Troubleshooting

### API Key Not Working

1. Verify key format: Should start with `pplx-`
2. Check key is active in Perplexity dashboard
3. Ensure key is in `.env` file (not `.env.local`)

### Rate Limit Errors

If you hit rate limits:
1. Switch to `sonar-reasoning-pro` (50 RPM) instead of `sonar-deep-research` (5 RPM)
2. Implement request queuing
3. Add retry logic with exponential backoff

### Fallback Behavior

If Perplexity fails, check logs:
```
Perplexity analysis failed: <error>
Falling back to OpenAI...
```

The system will automatically try other APIs.

## Comparison with Other APIs

| Feature | Perplexity | OpenAI | Hugging Face |
|---------|-----------|--------|--------------|
| **Primary Use** | ✅ Analysis | ✅ Analysis | ⚠️ Fallback |
| **Model Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | 💰💰 | 💰💰💰 | 💰 |
| **Rate Limits** | 5-50 RPM | High | Low |
| **Setup** | Easy | Easy | Medium |

## Migration from OpenAI/Hugging Face

1. **Add Perplexity key** to `.env`:
   ```env
   PERPLEXITY_API_KEY=pplx-your-key
   PERPLEXITY_MODEL=sonar-deep-research
   ```

2. **Keep existing keys** as fallbacks:
   ```env
   OPENAI_API_KEY=your-key  # Fallback
   HF_TOKEN=your-token      # Fallback
   ```

3. **Restart backend** - Perplexity will be used automatically

4. **Monitor logs** to confirm Perplexity is being used

## Best Practices

1. **Use `sonar-deep-research`** for best analysis quality
2. **Keep fallback APIs** configured for reliability
3. **Monitor rate limits** and adjust model if needed
4. **Test thoroughly** before production deployment
5. **Log API usage** for cost tracking

## Support

- Perplexity API Docs: https://docs.perplexity.ai/
- Perplexity Dashboard: https://www.perplexity.ai/settings/api
- Issues: Check backend logs for detailed error messages









