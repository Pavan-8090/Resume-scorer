import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ResumeAnalyzer from '../components/ResumeAnalyzer';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const token = typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('token=')) : null;
    setIsAuthenticated(!!token);
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white pt-20 pb-16 overflow-hidden min-h-[600px] md:min-h-[700px] flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          {isMounted && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ minHeight: '100%', minWidth: '100%' }}
            >
              <source src="/background-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900/80 via-navy-800/75 to-navy-900/80"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Analyze Resumes in
              <span className="block text-primary-400 mt-2">Single Click</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Save time with AI-powered resume analysis. Compare resumes against job descriptions 
              and get instant match scores with detailed insights.
            </p>
          </div>
        </div>
      </section>

      {/* Main Analysis Section */}
      <section className="py-8">
        <ResumeAnalyzer />
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-navy-900 mb-4">About ResumeScore</h2>
            <p className="text-xl text-navy-600 max-w-3xl mx-auto">
              We help HR Managers, Recruiters, and Hiring Teams save time by automating 
              resume analysis. No more manual screening - get instant insights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Fast Analysis</h3>
              <p className="text-navy-600">
                Analyze resumes in seconds using advanced NLP and AI models.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Accurate Scoring</h3>
              <p className="text-navy-600">
                Get precise match scores using semantic similarity and skill extraction.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Secure & Private</h3>
              <p className="text-navy-600">
                Your data is secure. We use industry-standard encryption and privacy practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-navy-900 mb-4">Our Services</h2>
            <p className="text-xl text-navy-600 max-w-3xl mx-auto">
              Everything you need to streamline your hiring process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Resume Parsing</h3>
              <p className="text-navy-600">
                Extract candidate information, skills, and experience from PDF and DOCX files automatically.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Skill Extraction</h3>
              <p className="text-navy-600">
                Identify and match skills using advanced NLP (spaCy) and AI models.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Semantic Matching</h3>
              <p className="text-navy-600">
                Compare resumes and job descriptions using SentenceTransformer for accurate matching.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Detailed Insights</h3>
              <p className="text-navy-600">
                Get strengths, weaknesses, and skill matches to make informed hiring decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-xl font-bold text-white">ResumeScore</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered resume screening tool for HR Managers and Recruiters. 
                Analyze resumes in seconds, not hours.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ResumeScore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}