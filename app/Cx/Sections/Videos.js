'use client';

import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { openSans } from '../Font/font';

const Videos = () => {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -330, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 330, behavior: 'smooth' });
    }
  };

  const videos = [
    '7572677007847230741',
    '7572677590457044244',
    '7572676001344261397',
    '7572675173229415700',
    '7572665292359322900',
    '7572610466745290004',
  ];

  return (
    <div className={`w-full py-8 lg:py-12 bg-gray-50 ${openSans.className}`}>
      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Like, Follow and Share</h2>
        
        <div className="relative px-12">
          {/* Left Arrow Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full p-3 shadow-lg transition"
            aria-label="Scroll left"
          >
            <FaChevronLeft className="text-xl" />
          </button>

          {/* Video Carousel */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {videos.map((videoId) => (
              <div
                key={videoId}
                className="relative shrink-0 w-[306px] h-[433px] rounded-lg overflow-hidden bg-black"
              >
                <iframe
                  src={`https://www.tiktok.com/embed/v3/${videoId}`}
                  title={`TikTok video ${videoId}`}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  scrolling="no"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full p-3 shadow-lg transition"
            aria-label="Scroll right"
          >
            <FaChevronRight className="text-xl" />
          </button>
        </div>

        {/* Hide scrollbar for webkit browsers */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Videos;

