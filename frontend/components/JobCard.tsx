import Link from 'next/link';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    resumeCount: number;
  };
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition">
      <h3 className="text-xl font-semibold text-navy-900 mb-2">{job.title}</h3>
      <p className="text-sm text-navy-600 mb-4">
        {job.resumeCount} resume{job.resumeCount !== 1 ? 's' : ''} analyzed
      </p>
      <Link
        href={`/results/${job.id}`}
        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
      >
        View Results →
      </Link>
    </div>
  );
}
