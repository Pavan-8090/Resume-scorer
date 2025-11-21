import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useDropzone } from 'react-dropzone';
import BackendStatus from './BackendStatus';

export default function ResumeAnalyzer() {
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const router = useRouter();

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
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setResumeFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAnalysis(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      if (!jobDescription && !jobDescriptionFile) {
        setError('Job description is required');
        setLoading(false);
        return;
      }

      if (!resumeFile) {
        setError('Resume file is required');
        setLoading(false);
        return;
      }

      // Test backend connection
      try {
        await axios.get(`${apiUrl}/health`, { timeout: 10000 });
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

      // Upload resume for analysis
      const analysisFormData = new FormData();
      analysisFormData.append('resumes', resumeFile);

      const analysisResponse = await axios.post(
        `${apiUrl}/api/jobs/${jobId}/analyze`,
        analysisFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 180000, // 3 minutes for analysis
        }
      );

      if (analysisResponse.data.analyses && analysisResponse.data.analyses.length > 0) {
        setAnalysis(analysisResponse.data.analyses[0]);
      }
    } catch (err: any) {
      console.error('Error details:', err);
      let errorMessage = 'Error analyzing resume. ';
      
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        errorMessage += `Backend server not running. Please start it with: cd backend_python && python main.py`;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.message) {
        errorMessage += err.message;
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sticky top-8">
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
                    className="mt-3 border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200 group"
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
                  <label className="block text-sm font-semibold text-navy-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Resume File
                  </label>
                  <div
                    {...getResumeRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200 group"
                  >
                    <input {...getResumeInputProps()} />
                    <div className="flex flex-col items-center text-center">
                      {resumeFile ? (
                        <>
                          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-navy-900 mb-1 truncate max-w-full">{resumeFile.name}</p>
                          <p className="text-xs text-gray-500">Click to change file</p>
                          <div className="mt-3 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 font-medium">✓ File Ready</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-navy-900 mb-1">Drop Resume Here</p>
                          <p className="text-xs text-gray-500 mb-2">or click to browse</p>
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
                  disabled={loading || !resumeFile || (!jobDescription && !jobDescriptionFile)}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Analyze Resume</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {analysis ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Analysis Results</h2>
                    <p className="text-gray-500">Candidate: <span className="font-semibold text-navy-700">{analysis.candidateName}</span></p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Score Card - Enhanced */}
                <div className={`relative overflow-hidden rounded-2xl p-8 mb-8 border-2 ${
                  analysis.matchScore >= 80 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  analysis.matchScore >= 60 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 
                  'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
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
                        <div className={`text-6xl font-bold ${
                          analysis.matchScore >= 80 ? 'text-green-600' :
                          analysis.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analysis.matchScore}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Match Percentage</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="w-full bg-white/60 rounded-full h-4 shadow-inner">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ${
                            analysis.matchScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            analysis.matchScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 
                            'bg-gradient-to-r from-red-500 to-rose-500'
                          } shadow-lg`}
                          style={{ width: `${analysis.matchScore}%` }}
                        />
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
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium transition-colors border border-gray-200"
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
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100">
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
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg font-semibold shadow-md"
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
                          <li key={idx} className="text-sm text-navy-700 flex items-start bg-white/60 rounded-lg p-3">
                            <span className="text-green-600 mr-3 font-bold text-lg">✓</span>
                            <span className="flex-1">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Areas to Improve - Show required/missing skills */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-100">
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
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm rounded-lg font-semibold shadow-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Weaknesses List */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Improvement Areas</p>
                      <ul className="space-y-3">
                        {analysis.weaknesses.map((weakness: string, idx: number) => (
                          <li key={idx} className="text-sm text-navy-700 flex items-start bg-white/60 rounded-lg p-3">
                            <span className="text-amber-600 mr-3 font-bold text-lg">⚠</span>
                            <span className="flex-1">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Improvement Suggestions - Show only if score < 100% */}
                {analysis.matchScore < 100 && analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0 && (
                  <div className="mt-8 p-8 bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-primary-200 shadow-lg relative overflow-hidden">
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
                          <div key={idx} className="flex items-start p-4 bg-white rounded-xl border-2 border-primary-100 hover:border-primary-300 hover:shadow-md transition-all group">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-4 mt-0.5 shadow-md group-hover:scale-110 transition-transform">
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
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
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

