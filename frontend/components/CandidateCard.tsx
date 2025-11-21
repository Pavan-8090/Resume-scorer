interface CandidateCardProps {
  analysis: {
    candidateName: string;
    matchScore: number;
    strengths: string[];
    weaknesses: string[];
    skillMatches: string[];
  };
}

export default function CandidateCard({ analysis }: CandidateCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-navy-900">{analysis.candidateName}</h3>
        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(analysis.matchScore)}`}>
          {analysis.matchScore}%
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${analysis.matchScore}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-navy-700 mb-2">Top Strengths</h4>
          <ul className="space-y-1">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-navy-600 flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-navy-700 mb-2">Key Weaknesses</h4>
          <ul className="space-y-1">
            {analysis.weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-sm text-navy-600 flex items-start">
                <span className="text-red-500 mr-2">⚠</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {analysis.skillMatches.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-navy-700 mb-2">Matched Skills</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.skillMatches.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
