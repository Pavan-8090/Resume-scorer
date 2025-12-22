import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import ResumeAnalyzer from '../components/ResumeAnalyzer';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({ analyzed: 0, timeSaved: 0, accuracy: 0 });

  useEffect(() => {
    setIsMounted(true);

    // Animate stats counter
    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const increment = 100 / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= 100) {
          setStats({ analyzed: 10000, timeSaved: 500, accuracy: 95 });
          clearInterval(timer);
        } else {
          setStats({
            analyzed: Math.floor(10000 * (current / 100)),
            timeSaved: Math.floor(500 * (current / 100)),
            accuracy: Math.floor(95 * (current / 100))
          });
        }
      }, duration / steps);
    };

    setTimeout(animateStats, 500);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white pt-20 pb-24 overflow-hidden min-h-[700px] md:min-h-[800px] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          {isMounted && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-30"
              style={{ minHeight: '100%', minWidth: '100%' }}
            >
              <source src="/background-video.mp4" type="video/mp4" />
            </video>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 via-primary-900/20 to-navy-900/90"></div>
          {/* Animated grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/20 border border-primary-400/30 mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-primary-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm font-medium text-primary-200">AI-Powered Resume Analysis</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up">
              Transform Hiring with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-primary-400 mt-2 animate-gradient">
                AI-Powered Insights
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-up-delay">
              Analyze resumes in seconds, not hours. Get instant match scores, skill analysis, and detailed insights 
              powered by advanced AI technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up-delay-2">
              <Link
                href="#analyze"
                className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/50 flex items-center"
              >
                <span>Start Analyzing Now</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#about"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in-delay">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">{stats.analyzed.toLocaleString()}+</div>
                <div className="text-gray-300 text-sm">Resumes Analyzed</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">{stats.timeSaved}+</div>
                <div className="text-gray-300 text-sm">Hours Saved</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">{stats.accuracy}%</div>
                <div className="text-gray-300 text-sm">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Main Analysis Section */}
      <section id="analyze" className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
              Analyze Resumes Instantly
            </h2>
            <p className="text-xl text-navy-600 max-w-2xl mx-auto">
              Upload a job description and resume to get AI-powered match analysis in seconds
            </p>
          </div>
          <ResumeAnalyzer />
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
              Why Choose ResumeScore?
            </h2>
            <p className="text-xl text-navy-600 max-w-3xl mx-auto">
              Built for modern HR teams who value efficiency, accuracy, and intelligent automation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-primary-200">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-3">Lightning Fast</h3>
              <p className="text-navy-600 leading-relaxed">
                Analyze resumes in seconds using advanced AI models. No more waiting hours for manual screening.
              </p>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-3">AI-Powered Accuracy</h3>
              <p className="text-navy-600 leading-relaxed">
                Get precise match scores using semantic similarity and advanced NLP. Trust the AI to find the best candidates.
              </p>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-3">Enterprise Security</h3>
              <p className="text-navy-600 leading-relaxed">
                Your data is encrypted and secure. We follow industry-standard privacy practices and compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20 -ml-48 -mb-48"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-navy-600 max-w-3xl mx-auto">
              Everything you need to streamline your hiring process and find the best candidates
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">Smart Resume Parsing</h3>
                <p className="text-navy-600 leading-relaxed">
                  Automatically extract candidate information, skills, and experience from PDF and DOCX files with AI-powered parsing.
                </p>
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">AI Skill Extraction</h3>
                <p className="text-navy-600 leading-relaxed">
                  Identify and match skills using advanced NLP and AI models. Get comprehensive skill analysis in seconds.
                </p>
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">Semantic Matching</h3>
                <p className="text-navy-600 leading-relaxed">
                  Compare resumes and job descriptions using SentenceTransformer AI for accurate, context-aware matching.
                </p>
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">Detailed Insights</h3>
                <p className="text-navy-600 leading-relaxed">
                  Get comprehensive analysis with strengths, weaknesses, skill matches, and actionable insights for informed decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Modern Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-white/90">Trusted by 10,000+ HR Teams</span>
            </div>

            {/* Modern Heading */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white leading-tight">
              Transform Hiring with AI
            </h2>
            
            {/* Modern Subheading */}
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto font-light">
              Analyze resumes in seconds, not hours
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Join leading HR teams using AI to streamline recruitment and find the perfect candidates faster
            </p>

            {/* Modern CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#analyze"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Analyzing Free
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              
              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stats.analyzed.toLocaleString()}+</div>
                <div className="text-sm text-gray-400">Resumes Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stats.timeSaved}+</div>
                <div className="text-sm text-gray-400">Hours Saved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stats.accuracy}%</div>
                <div className="text-sm text-gray-400">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="ResumeScore Logo"
                    width={40}
                    height={40}
                    className="object-contain drop-shadow-lg"
                    unoptimized
                  />
                </div>
                <span className="text-2xl font-bold text-white">ResumeScore</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                AI-powered resume screening platform for modern HR teams. 
                Analyze resumes in seconds, make better hiring decisions faster.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Product</h4>
              <ul className="space-y-3">
                <li><a href="#analyze" className="hover:text-white transition-colors">Analyze Resume</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 ResumeScore. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}