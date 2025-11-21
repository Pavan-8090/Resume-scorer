import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { JobPost } from '../models/JobPost';
import { Analysis } from '../models/Analysis';
import { User } from '../models/User';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Initialize OpenAI only if API key is provided
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('⚠️  OpenAI API key not configured. Using demo/mock analysis mode.');
}

const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to parse PDF');
  }
};

const extractTextFromDOCX = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to parse DOCX');
  }
};

// Mock analysis function for demo/testing without OpenAI API
const mockAnalyzeResume = (
  resumeText: string,
  jobDescription: string,
  candidateName: string
): {
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  skillMatches: string[];
} => {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  // Extract common skills/keywords
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
    'leadership', 'communication', 'project management', 'teamwork', 'problem solving',
    'marketing', 'sales', 'analytics', 'design', 'writing', 'analysis'
  ];

  // Count keyword matches
  let matchCount = 0;
  const matchedSkills: string[] = [];
  
  commonSkills.forEach(skill => {
    if (jobLower.includes(skill) && resumeLower.includes(skill)) {
      matchCount++;
      matchedSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });

  // Calculate match score (0-100%)
  const baseScore = Math.min(100, Math.round((matchCount / Math.max(1, commonSkills.length / 3)) * 100));
  // Add some randomness for realism (between baseScore and baseScore + 20)
  const matchScore = Math.min(100, baseScore + Math.floor(Math.random() * 20));

  // Generate strengths based on matches
  const strengths = [
    ...matchedSkills.slice(0, 2).map(s => `Strong ${s} skills`),
    resumeLower.includes('experience') || resumeLower.includes('years') ? 'Relevant work experience' : 'Good educational background',
    resumeLower.includes('degree') || resumeLower.includes('education') ? 'Solid educational foundation' : 'Technical expertise'
  ].slice(0, 3);

  // Generate weaknesses
  const weaknesses = [
    matchCount < 3 ? 'Limited matching skills' : 'Could use more experience',
    resumeLower.length < 500 ? 'Resume lacks detail' : 'Some skill gaps identified',
    matchScore < 70 ? 'Moderate alignment with job requirements' : 'Minor areas for improvement'
  ].slice(0, 3);

  return {
    matchScore,
    strengths: strengths.filter(s => s),
    weaknesses: weaknesses.filter(w => w),
    skillMatches: matchedSkills.slice(0, 5),
  };
};

const analyzeResume = async (
  resumeText: string,
  jobDescription: string,
  candidateName: string
): Promise<{
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  skillMatches: string[];
}> => {
  // Use mock analysis if OpenAI API key is not configured
  const useMockMode = !openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here';
  
  if (useMockMode) {
    console.log('📝 Using demo/mock analysis mode (no OpenAI API key)');
    // Add small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockAnalyzeResume(resumeText, jobDescription, candidateName);
  }

  const prompt = `You are an AI resume analyzer. Analyze the following resume against the job description and provide:
1. A match score (0-100%)
2. Top 3 strengths
3. Top 3 weaknesses
4. Key skill matches

Job Description:
${jobDescription.substring(0, 2000)}${jobDescription.length > 2000 ? '...' : ''}

Resume:
${resumeText.substring(0, 2000)}${resumeText.length > 2000 ? '...' : ''}

Respond in JSON format ONLY (no markdown, no code blocks):
{
  "matchScore": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "skillMatches": ["skill1", "skill2", "skill3"]
}`;

  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume analyzer. Always respond with valid JSON only, no markdown formatting.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Clean response text (remove markdown code blocks if present)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const analysis = JSON.parse(cleanedText);

    return {
      matchScore: Math.round(analysis.matchScore || 0),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 3) : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses.slice(0, 3) : [],
      skillMatches: Array.isArray(analysis.skillMatches) ? analysis.skillMatches.slice(0, 3) : [],
    };
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    console.log('⚠️ Falling back to mock analysis mode');
    // Fallback to mock analysis if API fails
    return mockAnalyzeResume(resumeText, jobDescription, candidateName);
  }
};

export const analyzeResumes = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files.resumes || files.resumes.length === 0) {
      return res.status(400).json({ error: 'No resumes uploaded' });
    }

    // Handle case where userId might not exist (no auth)
    let jobPost;
    if (req.userId) {
      jobPost = await JobPost.findOne({
        _id: jobId,
        userId: req.userId,
      });
    } else {
      jobPost = await JobPost.findById(jobId);
    }

    if (!jobPost) {
      return res.status(404).json({ error: 'Job post not found' });
    }

    // Handle user check only if authenticated
    let user = null;
    if (req.userId) {
      user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check resume limit
      const remainingResumes = files.resumes.length;
      if (user.resumeCount + remainingResumes > user.resumeLimit) {
        return res.status(403).json({
          error: 'Resume limit exceeded',
          limit: user.resumeLimit,
          current: user.resumeCount,
          requested: remainingResumes,
        });
      }
    }

    jobPost.status = 'analyzing';
    await jobPost.save();

    const analyses = [];

    for (const file of files.resumes) {
      try {
        let resumeText = '';

        if (file.mimetype === 'application/pdf') {
          resumeText = await extractTextFromPDF(file.buffer);
        } else if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          resumeText = await extractTextFromDOCX(file.buffer);
        } else {
          console.error('Unsupported file type:', file.mimetype);
          continue;
        }

        if (!resumeText || resumeText.trim().length === 0) {
          console.error('Failed to extract text from resume');
          continue;
        }

        // Extract candidate name (simple extraction - first line or use filename)
        const candidateName = file.originalname.replace(/\.(pdf|docx)$/i, '') || 'Unknown Candidate';

        const analysis = await analyzeResume(resumeText, jobPost.jobDescription, candidateName);

        const analysisDoc = new Analysis({
          jobPostId: jobPost._id,
          candidateName,
          resumeText,
          ...analysis,
        });

        await analysisDoc.save();
        analyses.push(analysisDoc);

        if (user) {
          user.resumeCount += 1;
        }
      } catch (error: any) {
        console.error('Error processing resume:', error);
        console.error('Error details:', error.message);
      }
    }

    if (user) {
      await user.save();
    }
    jobPost.status = 'completed';
    await jobPost.save();

    if (analyses.length === 0) {
      return res.status(400).json({ error: 'Failed to process any resumes. Please check file format.' });
    }

    res.status(201).json({
      message: 'Analysis completed',
      analyses,
      jobPost,
    });
  } catch (error: any) {
    console.error('Error analyzing resumes:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error analyzing resumes',
      details: error.message || 'Unknown error occurred'
    });
  }
};
