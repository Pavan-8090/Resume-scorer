import Navbar from '../components/Navbar';
import ResumeAnalyzer from '../components/ResumeAnalyzer';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ResumeAnalyzer />
    </div>
  );
}