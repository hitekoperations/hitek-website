'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { openSans } from '../Font/font';

const Categories = () => {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -225, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 225, behavior: 'smooth' });
    }
  };

  const categories = [
    { name: 'Laptops', image: '/laptop-category.jpg', alt: 'Laptops' },
    { name: 'Printers', image: '/printer-category.png', alt: 'Printers' },
    { name: 'Headphones', image: '/headphone-category.png', alt: 'Headphones' },
    { name: 'Keyboard & Mouse', image: '/mnk-category.png', alt: 'Keyboard & Mouse' },
    { name: 'Toners', image: '/toner-category.jpg', alt: 'Toners' },
    { name: 'LEDs', image: '/monitor-category.png', alt: 'LEDs' }
  ];

  return (
    <div className={`w-full py-6 lg:py-8 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Categories</h2>
        
        <div className="relative px-16">
          {/* Left Arrow Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#00aeef] hover:bg-[#00688f] text-white rounded-full p-3 shadow-lg transition"
            aria-label="Scroll left"
          >
            <FaChevronLeft className="text-xl" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category, index) => (
              <div
                key={index}
                className="shrink-0 w-[205px] h-[236px] bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="w-full h-[148px] mt-4 flex items-center justify-center">
                  <Image
                    src={category.image}
                    alt={category.alt}
                    width={148}
                    height={148}
                    className="object-contain"
                  />
                </div>
                <div className="p-4 text-center flex items-center justify-center ">
                  <h3 className="text-base font-semibold text-gray-900">{category.name}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#00aeef] hover:bg-[#00688f] text-white rounded-full p-3 shadow-lg transition"
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

export default Categories;

