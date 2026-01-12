'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { CiHome } from 'react-icons/ci';
import Navbar from './Cx/Layout/Navbar';
import Footer from './Cx/Layout/Footer';
import { openSans } from './Cx/Font/font';

const NotFoundPage = () => {
  const router = useRouter();

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${openSans.className}`}>
      {/* Navbar */}
      <Navbar />

      {/* Sticky Breadcrumb */}
      <div className={`sticky top-0 z-40 bg-gray-100 border-b border-gray-200 shadow-sm ${openSans.className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#00aeef] transition">
              Home
            </Link>
            <span className="text-gray-900">›</span>
            <span className="text-blue-500">404-Error</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="grow flex items-center justify-center py-8 px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Robot Illustration */}
          <div className="relative mb-4 flex justify-center">
            <div className="relative">
              {/* Background Gears */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Large Left Gear */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/4 w-20 h-20 opacity-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4"/>
                      <circle cx="50" cy="50" r="8" fill="currentColor"/>
                      <circle cx="50" cy="20" r="6" fill="currentColor"/>
                      <circle cx="50" cy="80" r="6" fill="currentColor"/>
                      <circle cx="20" cy="50" r="6" fill="currentColor"/>
                      <circle cx="80" cy="50" r="6" fill="currentColor"/>
                      <path d="M 50 20 L 50 50 M 50 50 L 50 80 M 20 50 L 50 50 M 50 50 L 80 50" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  {/* Large Right Gear */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-20 h-20 opacity-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4"/>
                      <circle cx="50" cy="50" r="8" fill="currentColor"/>
                      <circle cx="50" cy="20" r="6" fill="currentColor"/>
                      <circle cx="50" cy="80" r="6" fill="currentColor"/>
                      <circle cx="20" cy="50" r="6" fill="currentColor"/>
                      <circle cx="80" cy="50" r="6" fill="currentColor"/>
                      <path d="M 50 20 L 50 50 M 50 50 L 50 80 M 20 50 L 50 50 M 50 50 L 80 50" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  {/* Smaller Gears */}
                  <div className="absolute left-1/4 top-1/4 w-10 h-10 opacity-15">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-blue-300">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <circle cx="50" cy="50" r="6" fill="currentColor"/>
                      <circle cx="50" cy="25" r="4" fill="currentColor"/>
                      <circle cx="50" cy="75" r="4" fill="currentColor"/>
                      <circle cx="25" cy="50" r="4" fill="currentColor"/>
                      <circle cx="75" cy="50" r="4" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="absolute right-1/4 bottom-1/4 w-12 h-12 opacity-15">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-blue-300">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <circle cx="50" cy="50" r="6" fill="currentColor"/>
                      <circle cx="50" cy="25" r="4" fill="currentColor"/>
                      <circle cx="50" cy="75" r="4" fill="currentColor"/>
                      <circle cx="25" cy="50" r="4" fill="currentColor"/>
                      <circle cx="75" cy="50" r="4" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Robot Image */}
              <div className="relative z-10">
                <Image
                  src="/404.png"
                  alt="404 Error Robot"
                  width={250}
                  height={250}
                  className="mx-auto"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            404, Page not found
          </h1>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-6 max-w-xl mx-auto">
            Something went wrong. It's look that your requested could not be found. It's look like the link is broken or the page is removed.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {/* GO BACK Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-[#00aeef] hover:bg-[#0099d9] text-white font-bold py-2 px-6 rounded-md transition text-sm"
            >
              <FiArrowLeft className="text-lg" />
              GO BACK
            </button>

            {/* GO TO HOME Button */}
            <Link
              href="/"
              className="flex items-center gap-2 bg-white border-2 border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white font-bold py-2 px-6 rounded-md transition text-sm"
            >
              <CiHome className="text-lg" />
              GO TO HOME
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NotFoundPage;

