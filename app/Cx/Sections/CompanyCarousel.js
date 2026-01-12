'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const CompanyCarousel = () => {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const companies = [
    '/canon.png',
    '/hp.png',
    '/lenovo.png',
    '/viewsonic.png',
    '/samsung.png',
    '/asus.png',
    '/lenovo.png',
    '/viewsonic.png'
  ];

  return (
    <div className="w-full py-8 lg:py-12 ">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="relative px-8 py-6">
            {/* Left Arrow Button */}
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 pl-4 -translate-y-1/2 z-10 text-gray-400 hover:text-[#00aeef] transition"
              aria-label="Scroll left"
            >
              <FaChevronLeft className="text-2xl" />
            </button>

            {/* Company Logos */}
            <div
              ref={scrollContainerRef}
              className="flex items-center justify-center gap-8 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {companies.map((logo, index) => (
                <div key={index} className="shrink-0 flex items-center justify-center transition-opacity opacity-100">
                  <Image
                    src={logo}
                    alt={`Company logo ${index + 1}`}
                    width={100}
                    height={50}
                    className="object-contain max-h-10"
                  />
                </div>
              ))}
            </div>

            {/* Right Arrow Button */}
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 pr-4 -translate-y-1/2 z-10 text-gray-400 hover:text-[#00aeef] transition"
              aria-label="Scroll right"
            >
              <FaChevronRight className="text-2xl" />
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
    </div>
  );
};

export default CompanyCarousel;

