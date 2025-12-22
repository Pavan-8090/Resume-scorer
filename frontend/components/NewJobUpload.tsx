import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

export default function NewJobUpload({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
    multiple: true,
    onDrop: (acceptedFiles) => {
      setResumeFiles([...resumeFiles, ...acceptedFiles]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();

      if (!title) {
        setError('Job title is required');
        setLoading(false);
        return;
      }

      if (!jobDescription && !jobDescriptionFile) {
        setError('Job description is required');
        setLoading(false);
        return;
      }

      if (resumeFiles.length === 0) {
        setError('At least one resume is required');
        setLoading(false);
        return;
      }

      // Create job post first
      let jobDescriptionText = jobDescription;
      if (jobDescriptionFile) {
        // Read file content (simplified - in production, handle PDF/DOCX parsing)
        jobDescriptionText = await readFileAsText(jobDescriptionFile);
      }

      const jobResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs`,
        { title, jobDescription: jobDescriptionText }
      );

      const jobId = jobResponse.data._id || jobResponse.data.id;

      // Upload resumes for analysis
      const analysisFormData = new FormData();
      resumeFiles.forEach((file) => {
        analysisFormData.append('resumes', file);
      });

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}/analyze`,
        analysisFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 180000, // 3 minutes for analysis
        }
      );

      router.push(`/results/${jobId}`);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating job post');
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-navy-700 mb-2">
            Job Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="e.g., Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Job Description
          </label>
          <div className="space-y-2">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Or upload a PDF/DOCX file below..."
            />
            <div
              {...getJobDescRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition"
            >
              <input {...getJobDescInputProps()} />
              <p className="text-sm text-navy-600 text-center">
                {jobDescriptionFile
                  ? jobDescriptionFile.name
                  : 'Drop job description file here (PDF/DOCX)'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Candidate Resumes
          </label>
          <div
            {...getResumeRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-primary-500 transition"
          >
            <input {...getResumeInputProps()} />
            <p className="text-sm text-navy-600 text-center">
              Drop resume files here (PDF/DOCX) or click to browse
            </p>
            {resumeFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {resumeFiles.map((file, idx) => (
                  <div key={idx} className="text-sm text-navy-700 bg-gray-50 p-2 rounded">
                    {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy-900 hover:bg-navy-800 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  );
}
