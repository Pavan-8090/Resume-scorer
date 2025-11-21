import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = Cookies.get('token');

  const navLinks = [
    { name: 'Home', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'About', href: '#about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Services', href: '#services', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50' 
          : 'bg-white/80 backdrop-blur-md border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section - Premium */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3 group relative">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <div className="relative w-14 h-14 group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Resume Checker Logo"
                      width={56}
                      height={56}
                      className="object-contain drop-shadow-xl"
                      priority
                      unoptimized
                    />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-2xl font-bold bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:via-primary-500 group-hover:to-primary-600 transition-all duration-300">
                    Resume Checker
                  </span>
                  <div className="h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Premium */}
            <div className="hidden lg:flex lg:items-center lg:space-x-2">
              {navLinks.map((link, idx) => {
                const isActive = router.asPath === link.href || (link.href.startsWith('#') && router.asPath.includes(link.href));
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    className={`group relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-navy-700 hover:text-primary-600 hover:bg-primary-50/50'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                      </svg>
                      <span>{link.name}</span>
                    </span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-xl"></div>
                    )}
                  </a>
                );
              })}
            </div>

            {/* CTA Buttons - Premium */}
            <div className="hidden lg:flex lg:items-center lg:space-x-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 text-sm font-semibold text-navy-700 hover:text-primary-600 rounded-xl transition-all duration-300 hover:bg-primary-50/50 flex items-center space-x-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      Cookies.remove('token');
                      router.push('/');
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-navy-900 to-navy-800 hover:from-navy-800 hover:to-navy-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-navy-900/20 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-5 py-2.5 text-sm font-semibold text-navy-700 hover:text-primary-600 rounded-xl transition-all duration-300 hover:bg-primary-50/50 flex items-center space-x-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/login"
                    className="relative px-6 py-2.5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl transition-all duration-500 shadow-lg hover:shadow-xl hover:shadow-primary-500/30 transform hover:scale-105 active:scale-95 flex items-center space-x-2 overflow-hidden group bg-size-200 bg-pos-0 hover:bg-pos-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center space-x-2">
                      <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Get Started</span>
                    </span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button - Premium */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300 group"
                aria-label="Toggle menu"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1.5">
                  <span className={`block h-0.5 w-6 bg-navy-900 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-navy-900 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-navy-900 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - Premium Slide Animation */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 py-6 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 space-y-2">
            {navLinks.map((link, idx) => (
              <a
                key={link.name}
                href={link.href}
                className="flex items-center space-x-3 px-4 py-3 text-base font-semibold text-navy-700 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition-all duration-300 group"
                onClick={() => setIsMenuOpen(false)}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                <span>{link.name}</span>
              </a>
            ))}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 text-base font-semibold text-navy-700 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      Cookies.remove('token');
                      setIsMenuOpen(false);
                      router.push('/');
                    }}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-navy-900 to-navy-800 text-white text-base font-semibold rounded-xl transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center space-x-3 px-4 py-3 text-base font-semibold text-navy-700 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-base font-semibold rounded-xl transition-all duration-300 shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}
