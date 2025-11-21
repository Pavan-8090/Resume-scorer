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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Description */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-soft p-6 sticky top-4">
              <h2 className="text-xl font-bold text-navy-900 mb-4">Job Description</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                    placeholder="Paste job description here or upload file..."
                  />
                </div>
                <div
                  {...getJobDescRootProps()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition"
                >
                  <input {...getJobDescInputProps()} />
                  <p className="text-sm text-navy-600 text-center">
                    {jobDescriptionFile
                      ? `📄 ${jobDescriptionFile.name}`
                      : '📄 Drop job description file (PDF/DOCX/DOC)'}
                  </p>
                </div>
                <BackendStatus />
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Resume File
                  </label>
                  <div
                    {...getResumeRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary-500 transition"
                  >
                    <input {...getResumeInputProps()} />
                    <div className="text-center">
                      <p className="text-3xl mb-2">📄</p>
                      {resumeFile ? (
                        <div>
                          <p className="text-sm font-medium text-navy-700">{resumeFile.name}</p>
                          <p className="text-xs text-navy-500 mt-1">Click to change</p>
                        </div>
                      ) : (
                        <p className="text-sm text-navy-600">
                          Drop resume here (PDF/DOCX/DOC)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Analyzing...' : 'Analyze Resume'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {analysis ? (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h2 className="text-2xl font-bold text-navy-900 mb-6">Analysis Results</h2>
                
                {/* Score Card */}
                <div className={`border-2 rounded-xl p-6 mb-6 ${getScoreColor(analysis.matchScore)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Match Score</h3>
                      <p className="text-sm opacity-75">Candidate: {analysis.candidateName}</p>
                    </div>
                    <div className="text-5xl font-bold">{analysis.matchScore}%</div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-white/50 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          analysis.matchScore >= 80 ? 'bg-green-500' :
                          analysis.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${analysis.matchScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Key Skills Matched */}
                {analysis.skillMatches && analysis.skillMatches.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-navy-900 mb-3">Top Key Skills Matched</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skillMatches.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-primary-50 text-primary-700 text-sm rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Skills */}
                {analysis.allSkills && analysis.allSkills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-navy-900 mb-3">Most Skilled Tools</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.allSkills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-navy-900 mb-3">✅ Strengths</h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="text-sm text-navy-700 flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-navy-900 mb-3">⚠️ Weaknesses</h3>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness: string, idx: number) => (
                        <li key={idx} className="text-sm text-navy-700 flex items-start">
                          <span className="text-red-500 mr-2">⚠</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft p-12 text-center">
                <p className="text-navy-600">Upload job description and resume to see analysis results here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

