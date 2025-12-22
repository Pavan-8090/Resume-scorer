import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import BackendStatus from './BackendStatus';

export default function ResumeChecker({ onAnalyze }: { onAnalyze: (jobId: string) => void }) {
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { getRootProps: getJobDescRootProps, getInputProps: getJobDescInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
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

      // Get job description text
      let jobDescriptionText = jobDescription;
      if (jobDescriptionFile) {
        jobDescriptionText = await readFileAsText(jobDescriptionFile);
      }

      // Test backend connection first
      try {
        await axios.get(`${apiUrl}/health`, { timeout: 10000 });
      } catch (healthError) {
        setError(`Cannot connect to backend server. Make sure backend is running on ${apiUrl}`);
        setLoading(false);
        return;
      }

      // Create a temporary job post (or use a generic one)
      const jobResponse = await axios.post(
        `${apiUrl}/api/jobs`,
        { title: 'Resume Check', jobDescription: jobDescriptionText },
        { headers, timeout: 10000 }
      ).catch((err) => {
        console.error('Job creation error:', err);
        if (err.code === 'ECONNREFUSED') {
          throw new Error(`Backend server not running. Please start backend with: cd backend_python && python main.py`);
        }
        throw err;
      });

      const jobId = jobResponse.data._id || jobResponse.data.id;

      if (!jobId || jobId === 'temp') {
        setError('Failed to create job post. Please check backend logs.');
        setLoading(false);
        return;
      }

      // Upload resume for analysis
      const analysisFormData = new FormData();
      analysisFormData.append('resumes', resumeFile);

      await axios.post(
        `${apiUrl}/api/jobs/${jobId}/analyze`,
        analysisFormData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 180000, // 3 minutes for analysis
        }
      );

      onAnalyze(jobId);
    } catch (err: any) {
      console.error('Error details:', err);
      let errorMessage = 'Error analyzing resume. ';
      
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        errorMessage += `Backend server not running. Please start it with: cd backend_python && python main.py`;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
        if (err.response.data.details) {
          errorMessage += ` (${err.response.data.details})`;
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please check: 1) Backend is running, 2) MongoDB is running, 3) File format is correct (PDF/DOCX)';
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

  return (
    <div className="bg-white rounded-xl shadow-soft p-8">
      <BackendStatus />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Job Description
          </label>
          <div className="space-y-2">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              onPaste={async (e) => {
                // Clean up pasted text to remove extra spaces between letters (LinkedIn format)
                e.preventDefault();
                
                // Try to get HTML format first (LinkedIn often pastes HTML)
                let pastedText = '';
                const clipboardItems = e.clipboardData.items;
                
                // Check for HTML format first
                for (let i = 0; i < clipboardItems.length; i++) {
                  const item = clipboardItems[i];
                  if (item.type === 'text/html') {
                    const htmlData = await new Promise<string>((resolve) => {
                      item.getAsString(resolve);
                    });
                    // Extract text from HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlData;
                    pastedText = tempDiv.textContent || tempDiv.innerText || '';
                    break;
                  }
                }
                
                // Fallback to plain text if no HTML found
                if (!pastedText) {
                  pastedText = e.clipboardData.getData('text');
                }
                
                // Handle HTML entities if any
                if (pastedText.includes('&')) {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = pastedText;
                  pastedText = tempDiv.textContent || tempDiv.innerText || pastedText;
                }
                
                // Replace various whitespace characters (non-breaking spaces, etc.) with regular spaces
                pastedText = pastedText
                  .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ') // Replace non-breaking spaces and other unicode spaces
                  .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
                  .replace(/[\t]+/g, ' '); // Replace tabs with spaces
                
                // Remove spaces between single characters iteratively
                let previousText = '';
                let cleanedText = pastedText;
                
                // Iteratively remove spaces between single characters until no more changes
                // This handles cases like "D e s i g n" or "a n d" -> "Design" or "and"
                let iterations = 0;
                while (cleanedText !== previousText && iterations < 50) {
                  previousText = cleanedText;
                  // Remove space between two single alphanumeric characters
                  cleanedText = cleanedText.replace(/([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, '$1$2');
                  iterations++;
                }
                
                // Normalize multiple spaces to single space
                cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
                
                setJobDescription(cleanedText);
              }}
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y font-normal tracking-normal"
              style={{ letterSpacing: 'normal', wordSpacing: 'normal' }}
              placeholder="Paste job description here or upload a PDF/DOCX file..."
            />
            <div
              {...getJobDescRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition"
            >
              <input {...getJobDescInputProps()} />
              <p className="text-sm text-navy-600 text-center">
                {jobDescriptionFile
                  ? `📄 ${jobDescriptionFile.name}`
                  : '📄 Drop job description file here (PDF/DOCX)'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Candidate Resume
          </label>
          <div
            {...getResumeRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-primary-500 transition"
          >
            <input {...getResumeInputProps()} />
            <div className="text-center">
              <p className="text-4xl mb-2">📄</p>
              {resumeFile ? (
                <div>
                  <p className="text-sm font-medium text-navy-700">{resumeFile.name}</p>
                  <p className="text-xs text-navy-500 mt-1">Click to change file</p>
                </div>
              ) : (
                <p className="text-sm text-navy-600">
                  Drop resume file here (PDF/DOCX) or click to browse
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          <strong>💡 Demo Mode:</strong> Analyzing resumes without OpenAI API key. 
          Results are generated using keyword matching for testing purposes.
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
        </button>
      </form>
    </div>
  );
}
