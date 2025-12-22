import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SkillComparison {
  jobRequiredSkills: string[];
  resumeSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  matchPercentage: number;
  skillScores?: Array<{
    skill: string;
    score: number;
    status: string;
    color: string;
  }>;
}

interface Analysis {
  _id: string;
  candidateName: string;
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  skillMatches: string[];
  skillComparison?: SkillComparison;
}

export default function Results() {
  const router = useRouter();
  const { jobId } = router.query;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    if (!jobId) return;
    fetchResults();
  }, [jobId]);

  const fetchResults = async () => {
    try {
      const [analysesResponse, jobResponse] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}/analyses`
        ).catch(() => ({ data: [] })),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}`,
          { headers }
        ).catch(() => ({ data: { jobDescription: '' } })),
      ]);

      const analyses = analysesResponse.data || [];
      const analysisData = analyses[0] || null;
      
      // Debug: Log the analysis data to see what we're getting
      console.log('Analysis data received:', analysisData);
      console.log('Has skillComparison?', !!analysisData?.skillComparison);
      
      setAnalysis(analysisData); // Get first (and only) analysis
      setJobDescription(jobResponse.data?.jobDescription || '');
    } catch (error) {
      console.error('Error fetching results:', error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = (score: number) => {
    if (score >= 80) return { text: 'Strong Match - Move Forward', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-900', scoreColor: 'text-green-600', icon: '✓' };
    if (score >= 60) return { text: 'Moderate Match - Consider', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-900', scoreColor: 'text-yellow-600', icon: '⚠' };
    return { text: 'Weak Match - Review Carefully', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-900', scoreColor: 'text-red-600', icon: '✗' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-navy-600">Analyzing resume...</div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-soft p-8 text-center text-navy-600">
            No analysis found. Please check the resume again.
          </div>
        </main>
      </div>
    );
  }

  const recommendation = getRecommendation(analysis.matchScore);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recommendation Banner */}
        <div className={`${recommendation.bgColor} border-2 ${recommendation.borderColor} rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`text-4xl ${recommendation.scoreColor}`}>
                {recommendation.icon}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${recommendation.textColor}`}>
                  {recommendation.text}
                </h2>
                <p className={`${recommendation.textColor.replace('900', '700')} mt-1`}>
                  Candidate: {analysis.candidateName} • Match Score: <span className="font-bold">{analysis.matchScore}%</span>
                </p>
              </div>
            </div>
            <div className={`text-6xl font-bold ${recommendation.scoreColor}`}>
              {analysis.matchScore}%
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
          <div className="mb-2 flex justify-between text-sm text-navy-600">
            <span>Match Quality</span>
            <span>{analysis.matchScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                analysis.matchScore >= 80 ? 'bg-green-500' :
                analysis.matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${analysis.matchScore}%` }}
            />
          </div>
        </div>

        {/* Skill Comparison Charts */}
        {analysis.skillComparison?.skillScores && analysis.skillComparison.skillScores.length > 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
            <h3 className="text-xl font-semibold text-navy-900 mb-6">Skills Analysis</h3>
            <p className="text-sm text-navy-600 mb-6">
              Skills comparison showing match quality: <span className="text-green-600 font-semibold">Green (Matched)</span> → 
              <span className="text-yellow-600 font-semibold"> Yellow (Extra)</span> → 
              <span className="text-orange-600 font-semibold"> Orange (Missing)</span> → 
              <span className="text-red-600 font-semibold"> Red (Critical Missing)</span>
            </p>
            
            <ResponsiveContainer width="100%" height={Math.max(400, analysis.skillComparison.skillScores.length * 50)}>
              <BarChart
                data={analysis.skillComparison.skillScores}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Match Score (%)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="skill" 
                  type="category" 
                  width={180}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'Match Score']}
                  labelFormatter={(label) => `Skill: ${label}`}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {analysis.skillComparison.skillScores.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : analysis.skillComparison ? (
          <>
            {/* Matched Skills Chart */}
            {analysis.skillComparison.matchedSkills.length > 0 && (
              <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
                <h3 className="text-xl font-semibold text-navy-900 mb-4">
                  ✅ Matched Skills ({analysis.skillComparison.matchedSkills.length})
                </h3>
                <p className="text-sm text-navy-600 mb-4">
                  Skills found in both job description and resume ({analysis.skillComparison.matchPercentage.toFixed(1)}% match rate)
                </p>
                <ResponsiveContainer width="100%" height={Math.max(300, analysis.skillComparison.matchedSkills.length * 40)}>
                  <BarChart
                    data={analysis.skillComparison.matchedSkills.map((skill, idx) => ({
                      name: skill,
                      value: 100,
                      index: idx
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {analysis.skillComparison.matchedSkills.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill="#10B981" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Missing Skills Chart */}
            {analysis.skillComparison.missingSkills.length > 0 && (
              <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
                <h3 className="text-xl font-semibold text-navy-900 mb-4">
                  ⚠️ Missing Skills ({analysis.skillComparison.missingSkills.length})
                </h3>
                <p className="text-sm text-navy-600 mb-4">
                  Skills required by job but not found in resume
                </p>
                <ResponsiveContainer width="100%" height={Math.max(300, analysis.skillComparison.missingSkills.length * 40)}>
                  <BarChart
                    data={analysis.skillComparison.missingSkills.map((skill, idx) => ({
                      name: skill,
                      value: 100,
                      index: idx
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {analysis.skillComparison.missingSkills.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill="#EF4444" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Combined Skills Comparison Chart */}
            <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
              <h3 className="text-xl font-semibold text-navy-900 mb-6">All Skills Comparison</h3>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700 mb-1">Matched</div>
                  <div className="text-2xl font-bold text-green-700">
                    {analysis.skillComparison.matchedSkills.length}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-700 mb-1">Missing</div>
                  <div className="text-2xl font-bold text-red-700">
                    {analysis.skillComparison.missingSkills.length}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-1">Extra Skills</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {analysis.skillComparison.extraSkills.length}
                  </div>
                </div>
              </div>

              {/* Combined Bar Chart */}
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    {
                      category: 'Matched Skills',
                      count: analysis.skillComparison.matchedSkills.length,
                      skills: analysis.skillComparison.matchedSkills.join(', ')
                    },
                    {
                      category: 'Missing Skills',
                      count: analysis.skillComparison.missingSkills.length,
                      skills: analysis.skillComparison.missingSkills.join(', ')
                    },
                    {
                      category: 'Extra Skills',
                      count: analysis.skillComparison.extraSkills.length,
                      skills: analysis.skillComparison.extraSkills.join(', ')
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} skills`,
                      name === 'count' && props.payload.skills ? `\n${props.payload.skills}` : ''
                    ]}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                    <Cell fill="#3B82F6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          // Fallback: Show basic skill matches if skillComparison is not available
          analysis.skillMatches && analysis.skillMatches.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
              <h3 className="text-xl font-semibold text-navy-900 mb-4">
                🛠️ Matched Skills ({analysis.skillMatches.length})
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {analysis.skillMatches.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-green-100 text-green-800 text-sm rounded-full font-medium border border-green-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Note:</strong> Detailed skill comparison charts are being generated. Please refresh the page or check the browser console for details.
              </div>
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Check Another Resume
          </button>
          {analysis.matchScore >= 60 && (
            <button
              onClick={() => {
                // In a real app, this would trigger next steps like scheduling interview
                alert('Candidate marked for next steps!');
              }}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Move Forward →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}