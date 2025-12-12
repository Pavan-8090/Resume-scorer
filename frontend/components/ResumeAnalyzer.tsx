import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useDropzone } from 'react-dropzone';
import BackendStatus from './BackendStatus';

interface SkillComparison {
  jobRequiredSkills?: string[];
  resumeSkills?: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
  extraSkills?: string[];
  matchPercentage?: number;
}

interface Analysis {
  _id?: string;
  id?: string;
  candidateName: string;
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  skillMatches: string[];
  allSkills?: string[];
  skillComparison?: SkillComparison;
  improvementSuggestions?: string[];
  jobPostId?: string;
}

interface RewrittenResume {
  fileName?: string;
  originalResume?: string;
  rewrittenResume?: string;
  originalScore?: number;
  rewrittenScore?: number;
  scoreImprovement?: number;
  docxBase64?: string;
  pdfBase64?: string;
  markdownText?: string;
}

interface LoadingProgress {
  current: number;
  total: number;
  currentFile: string;
}

interface Statistics {
  total: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  highScores: number;
  mediumScores: number;
  lowScores: number;
}

export default function ResumeAnalyzer() {
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({ current: 0, total: 0, currentFile: '' });
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState<number>(0);
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenResume, setRewrittenResume] = useState<RewrittenResume | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'comparison' | 'cards'>('detailed');
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [filterScore, setFilterScore] = useState<number | null>(null);

  const { getRootProps: getJobDescRootProps, getInputProps: getJobDescInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setJobDescriptionFile(acceptedFiles[0]);
      }
    },
  });

  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 50, // Maximum 50 resumes at once
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const currentCount = resumeFiles.length;
        const remainingSlots = 50 - currentCount;
        if (remainingSlots > 0) {
          const filesToAdd = acceptedFiles.slice(0, remainingSlots);
          setResumeFiles(prev => [...prev, ...filesToAdd]);
          if (acceptedFiles.length > remainingSlots) {
            setError(`Only ${remainingSlots} more file(s) can be added. Maximum 50 resumes allowed.`);
            setTimeout(() => setError(''), 5000);
          }
        } else {
          setError('Maximum 50 resumes allowed. Please remove some files first.');
          setTimeout(() => setError(''), 5000);
        }
      }
    },
  });

  const removeResumeFile = (index: number) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAnalyses([]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      if (!jobDescription && !jobDescriptionFile) {
        setError('Job description is required');
        setLoading(false);
        return;
      }

      if (resumeFiles.length === 0) {
        setError('At least one resume file is required');
        setLoading(false);
        return;
      }

      // Test backend connection
      try {
        await axios.get(`${apiUrl}/health`, { timeout: 100000000000 });
      } catch (healthError) {
        setError(`Cannot connect to backend server. Make sure backend is running on ${apiUrl}`);
        setLoading(false);
        return;
      }

      // Get job description text
      let jobDescriptionText = jobDescription;
      if (jobDescriptionFile) {
        jobDescriptionText = await readFileAsText(jobDescriptionFile);
      }

      // Create job post
      const jobResponse = await axios.post(
        `${apiUrl}/api/jobs`,
        { title: 'Resume Analysis', jobDescription: jobDescriptionText },
        { timeout: 10000 }
      );

      const jobId = jobResponse.data._id || jobResponse.data.id;

      // Upload resumes for analysis
      const analysisFormData = new FormData();
      resumeFiles.forEach((file) => {
        analysisFormData.append('resumes', file);
      });

      const analysisResponse = await axios.post(
        `${apiUrl}/api/jobs/${jobId}/analyze`,
        analysisFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: Math.min(180000 * resumeFiles.length, 3600000), // 3 minutes per resume, max 1 hour total
        }
      );

      if (analysisResponse.data.analyses && analysisResponse.data.analyses.length > 0) {
        setAnalyses(analysisResponse.data.analyses);
        setSelectedAnalysisIndex(0);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      let errorMessage = 'Error analyzing resume. ';
      
      if (axiosError.code === 'ECONNREFUSED' || axiosError.message?.includes('Network Error')) {
        errorMessage += 'Backend server not running. Please start it with: cd backend_python && python main.py';
      } else if (axiosError.response?.data) {
        const errorData = axiosError.response.data as { error?: string; detail?: string };
        errorMessage += errorData.error || errorData.detail || 'Unknown error occurred';
      } else if (axiosError.message) {
        errorMessage += axiosError.message;
      } else {
        errorMessage += 'Please check: 1) Backend is running, 2) File format is correct (PDF/DOCX)';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleRewriteResume = async (analysisIndex?: number) => {
    const index = analysisIndex !== undefined ? analysisIndex : selectedAnalysisIndex;
    const currentAnalysis = analyses[index];
    if (!currentAnalysis || resumeFiles.length === 0 || !jobDescription) return;
    
    setRewriting(true);
    setError('');
    setRewrittenResume(null);
    setShowComparison(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Get job description text
      let jobDescriptionText = jobDescription;
      if (jobDescriptionFile) {
        jobDescriptionText = await readFileAsText(jobDescriptionFile);
      }

      // Find the resume file that matches this analysis
      const resumeFile = resumeFiles[index] || resumeFiles[0];

      // Create form data
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('job_description', jobDescriptionText);
      // Pass original score if available
      if (currentAnalysis && currentAnalysis.matchScore) {
        formData.append('original_score', currentAnalysis.matchScore.toString());
      }

      const response = await axios.post(
        `${apiUrl}/api/resume/rewrite`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 180000, // 3 minutes
        }
      );

      setRewrittenResume(response.data);
      setShowComparison(true);
    } catch (err) {
      const axiosError = err as AxiosError;
      let errorMessage = 'Error rewriting resume. ';
      
      if (axiosError.code === 'ECONNREFUSED' || axiosError.message?.includes('Network Error')) {
        errorMessage += 'Backend server not running. Please start it with: cd backend_python && python main.py';
      } else if (axiosError.response?.data) {
        const errorData = axiosError.response.data as { detail?: string; error?: string };
        errorMessage += errorData.detail || errorData.error || 'Unknown error occurred';
      } else if (axiosError.message) {
        errorMessage += axiosError.message;
      } else {
        errorMessage += 'Please check: 1) Backend is running, 2) AI service is configured (OPENAI_API_KEY or HF_TOKEN)';
      }
      
      setError(errorMessage);
    } finally {
      setRewriting(false);
    }
  };

  const downloadResume = (format: 'docx' | 'pdf' | 'txt') => {
    if (!rewrittenResume) return;

    const baseName = rewrittenResume.fileName || 'improved_resume';

    if (format === 'docx') {
      if (!rewrittenResume.docxBase64) {
        setError('DOCX file not available');
        return;
      }
      // Download DOCX
      const docxBase64 = rewrittenResume.docxBase64;
      const byteCharacters = atob(docxBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      if (!rewrittenResume.pdfBase64) {
        setError('PDF file not available');
        return;
      }
      // Download PDF
      const pdfBase64 = rewrittenResume.pdfBase64;
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'txt') {
      if (!rewrittenResume.rewrittenResume) {
        setError('Text content not available');
        return;
      }
      // Download TXT
      const textContent = rewrittenResume.rewrittenResume;
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Download Analysis Summary
  const downloadAnalysisSummary = (analysis: Analysis, index?: number) => {
    if (!analysis) return;
    
    const candidateName = analysis.candidateName || `Candidate ${index !== undefined ? index + 1 : ''}`;
    const summary = `RESUME ANALYSIS SUMMARY
${'='.repeat(50)}

Candidate: ${candidateName}
Match Score: ${analysis.matchScore}%
Analysis Date: ${new Date().toLocaleDateString()}

${'='.repeat(50)}
OVERVIEW
${'='.repeat(50)}

Match Score: ${analysis.matchScore}%
Status: ${analysis.matchScore >= 80 ? 'Excellent Match' : analysis.matchScore >= 60 ? 'Good Match' : 'Needs Improvement'}

${'='.repeat(50)}
TOP MATCHED SKILLS
${'='.repeat(50)}

${(analysis.skillMatches || []).slice(0, 10).map((skill: string, i: number) => `${i + 1}. ${skill}`).join('\n') || 'No matched skills found'}

${'='.repeat(50)}
ALL SKILLS IN RESUME
${'='.repeat(50)}

${(analysis.allSkills || []).join(', ') || 'No skills detected'}

${'='.repeat(50)}
STRENGTHS
${'='.repeat(50)}

${(analysis.strengths || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'No strengths identified'}

${'='.repeat(50)}
AREAS TO IMPROVE
${'='.repeat(50)}

${(analysis.weaknesses || []).map((w: string, i: number) => `${i + 1}. ${w}`).join('\n') || 'No improvement areas identified'}

${analysis.skillComparison?.missingSkills && analysis.skillComparison.missingSkills.length > 0 ? `
${'='.repeat(50)}
MISSING REQUIRED SKILLS
${'='.repeat(50)}

${analysis.skillComparison.missingSkills.slice(0, 10).map((skill: string, i: number) => `${i + 1}. ${skill}`).join('\n')}
` : ''}

${analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0 ? `
${'='.repeat(50)}
IMPROVEMENT SUGGESTIONS
${'='.repeat(50)}

${analysis.improvementSuggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}
` : ''}

${'='.repeat(50)}
END OF SUMMARY
${'='.repeat(50)}
`;

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_summary_${candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download All Analyses Summary
  const downloadAllSummaries = () => {
    if (analyses.length === 0) return;
    
    const sortedAnalyses = getSortedAnalyses();
    let allSummaries = `COMPLETE RESUME ANALYSIS REPORT
${'='.repeat(60)}
Generated: ${new Date().toLocaleString()}
Total Resumes Analyzed: ${analyses.length}
${'='.repeat(60)}

${getStatistics() ? `
OVERALL STATISTICS
${'='.repeat(60)}
Total Resumes: ${getStatistics()?.total}
Average Score: ${getStatistics()?.avgScore}%
Best Match: ${getStatistics()?.maxScore}%
Lowest Score: ${getStatistics()?.minScore}%

Score Distribution:
- High (≥80%): ${getStatistics()?.highScores} resumes
- Medium (60-79%): ${getStatistics()?.mediumScores} resumes
- Low (<60%): ${getStatistics()?.lowScores} resumes

${'='.repeat(60)}

` : ''}`;

    sortedAnalyses.forEach((analysis, index) => {
      allSummaries += `\n\n${'='.repeat(60)}\n`;
      allSummaries += `RESUME #${index + 1} - RANK: ${index + 1}\n`;
      allSummaries += `${'='.repeat(60)}\n\n`;
      
      const candidateName = analysis.candidateName || `Candidate ${index + 1}`;
      allSummaries += `Candidate: ${candidateName}\n`;
      allSummaries += `Match Score: ${analysis.matchScore}%\n`;
      allSummaries += `Status: ${analysis.matchScore >= 80 ? 'Excellent Match' : analysis.matchScore >= 60 ? 'Good Match' : 'Needs Improvement'}\n\n`;
      
      allSummaries += `Top Matched Skills:\n`;
      allSummaries += `${(analysis.skillMatches || []).slice(0, 5).map((s: string, i: number) => `  ${i + 1}. ${s}`).join('\n') || '  None'}\n\n`;
      
      allSummaries += `Key Strengths:\n`;
      allSummaries += `${(analysis.strengths || []).slice(0, 3).map((s: string, i: number) => `  ${i + 1}. ${s}`).join('\n') || '  None'}\n\n`;
      
      allSummaries += `Areas to Improve:\n`;
      allSummaries += `${(analysis.weaknesses || []).slice(0, 3).map((w: string, i: number) => `  ${i + 1}. ${w}`).join('\n') || '  None'}\n`;
    });

    allSummaries += `\n\n${'='.repeat(60)}\nEND OF REPORT\n${'='.repeat(60)}`;

    const blob = new Blob([allSummaries], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_resumes_summary_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Sort and filter analyses
  const getSortedAnalyses = (): Analysis[] => {
    let sorted = [...analyses];
    
    // Sort
    if (sortBy === 'score') {
      sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else {
      sorted.sort((a, b) => {
        const nameA = (a.candidateName || '').toLowerCase();
        const nameB = (b.candidateName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    
    // Filter
    if (filterScore !== null) {
      sorted = sorted.filter(a => (a.matchScore || 0) >= filterScore);
    }
    
    return sorted;
  };

  // Calculate statistics
  const getStatistics = (): Statistics | null => {
    if (analyses.length === 0) return null;
    
    const scores = analyses.map(a => a.matchScore || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const highScores = scores.filter(s => s >= 80).length;
    const mediumScores = scores.filter(s => s >= 60 && s < 80).length;
    const lowScores = scores.filter(s => s < 60).length;
    
    return {
      total: analyses.length,
      avgScore: Math.round(avgScore),
      maxScore,
      minScore,
      highScores,
      mediumScores,
      lowScores,
    };
  };

  // Export to CSV
  const exportToCSV = () => {
    if (analyses.length === 0) return;
    
    const headers = ['Rank', 'Candidate Name', 'Match Score', 'Matched Skills', 'Strengths', 'Weaknesses'];
    const rows = getSortedAnalyses().map((analysis, index) => [
      index + 1,
      analysis.candidateName || 'Unknown',
      `${analysis.matchScore}%`,
      (analysis.skillMatches || []).slice(0, 5).join('; '),
      (analysis.strengths || []).slice(0, 3).join('; '),
      (analysis.weaknesses || []).slice(0, 3).join('; '),
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sticky top-8 transition-all duration-300 hover:shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-navy-900">Resume Analysis</h2>
                    <p className="text-sm text-gray-500">AI-Powered Matching</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Job Description Section */}
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition-all resize-none bg-gray-50 hover:bg-white"
                    placeholder="Paste job description here..."
                  />
                  
                  {/* File Upload for Job Description */}
                  <div
                    {...getJobDescRootProps()}
                    className="mt-3 border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-300 group hover-lift"
                  >
                    <input {...getJobDescInputProps()} />
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      {jobDescriptionFile ? (
                        <div className="w-full">
                          <p className="text-sm font-medium text-navy-900 mb-1 truncate">{jobDescriptionFile.name}</p>
                          <p className="text-xs text-gray-500">Click to change file</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Upload Job Description</p>
                          <p className="text-xs text-gray-500">PDF, DOCX, or DOC</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resume File Section */}
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Resume Files {resumeFiles.length > 0 && `(${resumeFiles.length})`}
                    </div>
                    <span className="text-xs text-gray-500 font-normal">
                      {resumeFiles.length}/50 max
                    </span>
                  </label>
                  <div
                    {...getResumeRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-300 group hover-lift"
                  >
                    <input {...getResumeInputProps()} />
                    <div className="flex flex-col items-center text-center">
                      {resumeFiles.length > 0 ? (
                        <div className="w-full">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">Click to add more files</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {resumeFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center flex-1 min-w-0">
                                  <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <p className="text-sm font-medium text-navy-900 truncate flex-1">{file.name}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeResumeFile(index);
                                  }}
                                  className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-navy-900 mb-1">Drop Resumes Here</p>
                          <p className="text-xs text-gray-500 mb-2">or click to browse (multiple files supported)</p>
                          <div className="flex items-center space-x-2 mt-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">PDF</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">DOCX</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">DOC</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <BackendStatus />
                
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  type="submit"
                  disabled={loading || resumeFiles.length === 0 || (!jobDescription && !jobDescriptionFile)}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-primary-500/30 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 relative overflow-hidden group"
                >
                  {loading && (
                    <div className="absolute inset-0 animate-shimmer"></div>
                  )}
                  {loading ? (
                    <>
                      <div className="spinner w-5 h-5 border-2"></div>
                      <span className="relative z-10">Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="relative z-10">Analyze Resume</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 animate-scale-in">
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-8">
                    <div className="spinner w-16 h-16 border-4 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-primary-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-navy-900 mb-2">Analyzing Resume{resumeFiles.length > 1 ? 's' : ''} with AI</h3>
                  <p className="text-gray-500 text-center max-w-md mb-4">
                    {loadingProgress.total > 0 
                      ? loadingProgress.currentFile 
                      : `Our AI is processing ${resumeFiles.length} resume${resumeFiles.length > 1 ? 's' : ''}, extracting skills, and comparing them with the job description. This may take a moment...`}
                  </p>
                  {loadingProgress.total > 0 && (
                    <div className="mb-4 text-center">
                      <span className="text-sm font-semibold text-primary-600">
                        {loadingProgress.current} of {loadingProgress.total} completed
                      </span>
                    </div>
                  )}
                  <div className="mt-4 w-full max-w-md mx-auto">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                        style={{ 
                          width: loadingProgress.total > 0 
                            ? `${(loadingProgress.current / loadingProgress.total) * 100}%` 
                            : '60%'
                        }}
                      />
                    </div>
                    {loadingProgress.total > 0 && (
                      <div className="mt-2 text-center text-xs text-gray-500">
                        {Math.round((loadingProgress.current / loadingProgress.total) * 100)}% complete
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : analyses.length > 0 ? (
              <div className="space-y-6">
                {/* Statistics Dashboard */}
                {getStatistics() && (
                  <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-primary-200 p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-xl font-bold text-navy-900">Overall Statistics</h3>
                      <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export CSV</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-navy-900">{getStatistics()?.total}</div>
                        <div className="text-xs text-gray-600 mt-1">Total Resumes</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-primary-600">{getStatistics()?.avgScore}%</div>
                        <div className="text-xs text-gray-600 mt-1">Average Score</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">{getStatistics()?.maxScore}%</div>
                        <div className="text-xs text-gray-600 mt-1">Best Match</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-red-600">{getStatistics()?.minScore}%</div>
                        <div className="text-xs text-gray-600 mt-1">Lowest Score</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-center">
                        <div className="text-lg font-bold text-green-700">{getStatistics()?.highScores}</div>
                        <div className="text-xs text-green-600 mt-1">High (≥80%)</div>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 text-center">
                        <div className="text-lg font-bold text-yellow-700">{getStatistics()?.mediumScores}</div>
                        <div className="text-xs text-yellow-600 mt-1">Medium (60-79%)</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-center">
                        <div className="text-lg font-bold text-red-700">{getStatistics()?.lowScores}</div>
                        <div className="text-xs text-red-600 mt-1">Low (&lt;60%)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Mode & Controls */}
                {analyses.length > 1 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-600">View:</span>
                        <button
                          onClick={() => setViewMode('detailed')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'detailed' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Detailed
                        </button>
                        <button
                          onClick={() => setViewMode('comparison')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'comparison' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Comparison
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'cards' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Cards
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="score">Sort by Score</option>
                          <option value="name">Sort by Name</option>
                        </select>
                        <select
                          value={filterScore || ''}
                          onChange={(e) => setFilterScore(e.target.value ? parseInt(e.target.value) : null)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">All Scores</option>
                          <option value="80">80%+</option>
                          <option value="60">60%+</option>
                          <option value="40">40%+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cards View */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getSortedAnalyses().map((analysis, index) => {
                      const originalIndex = analyses.findIndex(a => a === analysis);
                      return (
                        <div
                          key={originalIndex}
                          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer"
                          onClick={() => {
                            setViewMode('detailed');
                            setSelectedAnalysisIndex(originalIndex);
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-navy-900 truncate">
                                {analysis.candidateName || resumeFiles[originalIndex]?.name || `Resume ${originalIndex + 1}`}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">{resumeFiles[originalIndex]?.name}</p>
                            </div>
                            <div className={`text-2xl font-bold ml-2 ${
                              analysis.matchScore >= 80 ? 'text-green-600' :
                              analysis.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {analysis.matchScore}%
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  analysis.matchScore >= 80 ? 'bg-green-500' :
                                  analysis.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${analysis.matchScore}%` }}
                              />
                            </div>
                          </div>
                          {analysis.skillMatches && analysis.skillMatches.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {analysis.skillMatches.slice(0, 3).map((skill: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">Rank: #{index + 1}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comparison View */}
                {viewMode === 'comparison' && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-navy-900">Rank</th>
                          <th className="text-left py-3 px-4 font-semibold text-navy-900">Candidate</th>
                          <th className="text-center py-3 px-4 font-semibold text-navy-900">Score</th>
                          <th className="text-left py-3 px-4 font-semibold text-navy-900">Top Skills</th>
                          <th className="text-left py-3 px-4 font-semibold text-navy-900">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSortedAnalyses().map((analysis, index) => {
                          const originalIndex = analyses.findIndex(a => a === analysis);
                          return (
                            <tr
                              key={originalIndex}
                              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setViewMode('detailed');
                                setSelectedAnalysisIndex(originalIndex);
                              }}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <span className="font-bold text-navy-900">#{index + 1}</span>
                                  {index === 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-semibold">
                                      Best
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium text-navy-900">
                                    {analysis.candidateName || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {resumeFiles[originalIndex]?.name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className={`text-xl font-bold ${
                                  analysis.matchScore >= 80 ? 'text-green-600' :
                                  analysis.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {analysis.matchScore}%
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {(analysis.skillMatches || []).slice(0, 3).map((skill: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  analysis.matchScore >= 80 ? 'bg-green-100 text-green-700' :
                                  analysis.matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {analysis.matchScore >= 80 ? 'Excellent' :
                                   analysis.matchScore >= 60 ? 'Good' : 'Needs Work'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Resume Selection Tabs (for detailed view) */}
                {viewMode === 'detailed' && analyses.length > 1 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
                    <div className="flex items-center space-x-2 overflow-x-auto">
                      <span className="text-sm font-semibold text-gray-600 mr-2 whitespace-nowrap">Select Resume:</span>
                      {getSortedAnalyses().map((analysis, index) => {
                        const originalIndex = analyses.findIndex(a => a === analysis);
                        return (
                          <button
                            key={originalIndex}
                            onClick={() => setSelectedAnalysisIndex(originalIndex)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                              selectedAnalysisIndex === originalIndex
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {analysis.candidateName || resumeFiles[originalIndex]?.name || `Resume ${originalIndex + 1}`}
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                              selectedAnalysisIndex === originalIndex
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {analysis.matchScore}%
                            </span>
                            {index === 0 && (
                              <span className="ml-1 text-xs">🏆</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Analysis Results - Detailed View */}
                {viewMode === 'detailed' && analyses.map((analysis, analysisIndex) => {
                  if (analysisIndex !== selectedAnalysisIndex) return null;
                  return (
                  <div
                    key={analysisIndex}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slide-in-right"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                      <div>
                        <h2 className="text-3xl font-bold text-navy-900 mb-2">Analysis Results</h2>
                        <p className="text-gray-500">Candidate: <span className="font-semibold text-navy-700">{analysis.candidateName}</span></p>
                        {resumeFiles[analysisIndex] && (
                          <p className="text-xs text-gray-400 mt-1">File: {resumeFiles[analysisIndex].name}</p>
                        )}
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                
                {/* Score Card - Enhanced */}
                <div className={`relative overflow-hidden rounded-2xl p-8 mb-8 border-2 transition-all duration-500 hover:scale-[1.01] ${
                  analysis.matchScore >= 80 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg shadow-green-100/50' :
                  analysis.matchScore >= 60 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-lg shadow-yellow-100/50' : 
                  'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-lg shadow-red-100/50'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <div className={`w-full h-full rounded-full ${
                      analysis.matchScore >= 80 ? 'bg-green-500' :
                      analysis.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    } blur-3xl`}></div>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-navy-900 mb-1">Match Score</h3>
                        <p className="text-sm text-gray-600">AI-Powered Analysis</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-6xl font-bold transition-all duration-500 ${
                          analysis.matchScore >= 80 ? 'text-green-600' :
                          analysis.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analysis.matchScore}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Match Percentage</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="w-full bg-white/60 rounded-full h-4 shadow-inner overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                            analysis.matchScore >= 80 ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600' :
                            analysis.matchScore >= 60 ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600' : 
                            'bg-gradient-to-r from-red-500 via-rose-500 to-red-600'
                          } shadow-lg relative overflow-hidden`}
                          style={{ width: `${analysis.matchScore}%` }}
                        >
                          <div className="absolute inset-0 animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>0%</span>
                        <span className="font-semibold">Target: 100%</span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* All Skills from Resume */}
                {analysis.allSkills && analysis.allSkills.length > 0 && (
                  <div className="mb-8">
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-navy-900">All Skills in Resume</h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-13">Complete list of all skills, technologies, and tools detected in the candidate's resume</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.allSkills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-sm hover:scale-105 cursor-default"
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths and Areas to Improve */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Strengths - Show matched skills */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-navy-900">Strengths</h3>
                    </div>
                    
                    {/* Matched Skills - Only show skills that are valid (not phone numbers, emails, etc.) */}
                    {analysis.skillMatches && analysis.skillMatches.length > 0 && (() => {
                      // Filter out phone numbers, emails, and other invalid skills
                      const isValidSkill = (skill: string): boolean => {
                        const skillLower = skill.toLowerCase().trim();
                        // Check for phone number patterns
                        const phonePattern = /[\d\s\-\(\)]{10,}/;
                        if (phonePattern.test(skill)) return false;
                        // Check for email patterns
                        const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/;
                        if (emailPattern.test(skill)) return false;
                        // Check for URLs
                        if (/https?:\/\/|www\./.test(skillLower)) return false;
                        // Check for very short or pure numbers
                        if (skillLower.length < 2 || /^\d+$/.test(skillLower)) return false;
                        // Check for common non-skill words
                        const nonSkills = ['com', 'www', 'http', 'https', 'email', 'phone', 'address', 'summary'];
                        if (nonSkills.includes(skillLower)) return false;
                        return true;
                      };
                      
                      const validSkills = analysis.skillMatches.filter(isValidSkill);
                      
                      return validSkills.length > 0 ? (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Matched Skills & Tools</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {validSkills.map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default"
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {/* Strengths List */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Key Strengths</p>
                      <ul className="space-y-3">
                        {analysis.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-sm text-navy-700 flex items-start bg-white/60 rounded-lg p-3 transition-all duration-300 hover:bg-white/80 hover:shadow-md" style={{ animationDelay: `${idx * 100}ms` }}>
                            <span className="text-green-600 mr-3 font-bold text-lg">✓</span>
                            <span className="flex-1">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Areas to Improve - Show required/missing skills */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-100 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-navy-900">Areas to Improve</h3>
                    </div>
                    
                    {/* Required/Missing Skills */}
                    {analysis.skillComparison?.missingSkills && analysis.skillComparison.missingSkills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Required Skills & Tools Missing</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {analysis.skillComparison.missingSkills.slice(0, 10).map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Weaknesses List - ONLY show missing required skills/tools from job description */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Improvement Areas</p>
                      {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                        <ul className="space-y-3">
                          {analysis.weaknesses.map((weakness: string, idx: number) => (
                            <li key={idx} className="text-sm text-navy-700 flex items-start bg-white/60 rounded-lg p-3 transition-all duration-300 hover:bg-white/80 hover:shadow-md animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                              <span className="text-amber-600 mr-3 font-bold text-lg">⚠</span>
                              <span className="flex-1">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-navy-700 bg-white/60 rounded-lg p-3">
                          <span className="text-green-600 mr-2">✓</span>
                          All required skills and tools from job description are present in your resume!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Improvement Suggestions - Show only if score < 100% */}
                {analysis.matchScore < 100 && analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0 && (
                  <div className="mt-8 p-8 bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-primary-200 shadow-lg relative overflow-hidden animate-fade-in hover:shadow-xl transition-all duration-300">
                    {/* Decorative background */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-20 -ml-16 -mb-16"></div>
                    
                    <div className="relative">
                      <div className="flex items-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-navy-900 mb-1">Reach 100% Match Score</h3>
                          <p className="text-sm text-navy-600">Actionable suggestions to improve your resume</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        {analysis.improvementSuggestions.map((suggestion: string, idx: number) => (
                          <div key={idx} className="flex items-start p-4 bg-white rounded-xl border-2 border-primary-100 hover:border-primary-300 hover:shadow-md hover:scale-[1.01] transition-all duration-300 group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-4 mt-0.5 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                              <span className="text-white font-bold text-sm">{idx + 1}</span>
                            </div>
                            <p className="text-sm text-navy-700 flex-1 leading-relaxed pt-1">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-primary-200">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary-600">{analysis.matchScore}%</div>
                              <div className="text-xs text-gray-600">Current</div>
                            </div>
                            <div className="w-px h-12 bg-gray-300"></div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{100 - analysis.matchScore}%</div>
                              <div className="text-xs text-gray-600">Needed</div>
                            </div>
                            <div className="w-px h-12 bg-gray-300"></div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-navy-900">100%</div>
                              <div className="text-xs text-gray-600">Target</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-navy-700">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="font-semibold">Follow these steps to reach 100%!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rewritten Resume Comparison */}
                {rewrittenResume && showComparison && (
                  <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slide-in-right">
                    {/* Score Improvement Banner */}
                    {(rewrittenResume.originalScore !== null && rewrittenResume.rewrittenScore !== null) && (
                      <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-1">Original Score</div>
                              <div className="text-3xl font-bold text-gray-700">{rewrittenResume.originalScore}%</div>
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-1">Improved Score</div>
                              <div className="text-3xl font-bold text-green-600">{rewrittenResume.rewrittenScore}%</div>
                            </div>
                            {rewrittenResume.scoreImprovement !== null && rewrittenResume.scoreImprovement !== undefined && (
                              <>
                                <div className="text-2xl text-gray-400">→</div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-600 mb-1">Change</div>
                                  <div className={`text-3xl font-bold ${
                                    rewrittenResume.scoreImprovement > 0 ? 'text-green-600' : 
                                    rewrittenResume.scoreImprovement < 0 ? 'text-red-600' : 
                                    'text-gray-600'
                                  }`}>
                                    {rewrittenResume.scoreImprovement > 0 ? '+' : ''}{rewrittenResume.scoreImprovement.toFixed(1)}%
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          {rewrittenResume.scoreImprovement !== null && rewrittenResume.scoreImprovement !== undefined && (
                            <div className={`px-4 py-2 rounded-lg font-semibold ${
                              rewrittenResume.scoreImprovement > 0 ? 'bg-green-500 text-white' : 
                              rewrittenResume.scoreImprovement < 0 ? 'bg-red-500 text-white' : 
                              'bg-gray-400 text-white'
                            }`}>
                              {rewrittenResume.scoreImprovement > 0 ? '🎉 Score Improved!' : 
                               rewrittenResume.scoreImprovement < 0 ? '⚠️ Score Decreased' : 
                               '➡️ Score Unchanged'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <h3 className="text-2xl font-bold text-navy-900 mb-1">Matched Resume</h3>
                        <p className="text-sm text-gray-500">AI-optimized resume tailored to job description</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => downloadResume('pdf')}
                          className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => downloadResume('docx')}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>DOCX</span>
                        </button>
                        <button
                          onClick={() => downloadResume('txt')}
                          className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-xs font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>TXT</span>
                        </button>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison - Full Text */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Original Resume */}
                      <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                        <div className="flex items-center mb-4 pb-3 border-b border-gray-300">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-gray-700">Original Resume</h4>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                            {rewrittenResume.originalResume}
                          </pre>
                        </div>
                      </div>

                      {/* Improved Resume */}
                      <div className="border-2 border-green-300 rounded-xl p-6 bg-green-50">
                        <div className="flex items-center mb-4 pb-3 border-b border-green-300">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-green-700">AI-Improved Resume</h4>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                            {rewrittenResume.rewrittenResume}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Full Improved Resume View */}
                    <div className="border-2 border-primary-200 rounded-xl p-6 bg-gradient-to-br from-primary-50 to-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-navy-900">Complete Improved Resume</h4>
                      </div>
                      <div className="bg-white rounded-lg p-6 max-h-[500px] overflow-y-auto border border-gray-200">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {rewrittenResume.rewrittenResume}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center animate-fade-in">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
                    <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-navy-900 mb-3">Ready to Analyze</h3>
                  <p className="text-gray-600 mb-2">Upload a job description and resume to get started</p>
                  <p className="text-sm text-gray-500">AI-powered analysis will provide instant insights</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

