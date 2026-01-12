'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PiPackageThin } from "react-icons/pi";
import { CiTrophy } from "react-icons/ci";
import { CiCreditCard1 } from "react-icons/ci";
import { CiHeadphones } from "react-icons/ci";
import { FiArrowRight } from "react-icons/fi";
import { openSans } from '../Font/font';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const allBanners = [
    { 
      src: '/main-banner.png', 
      alt: 'HP Victus Laptop Banner',
      hasOverlay: false 
    },
    { 
      src: '/hero-banner-3.png', 
      alt: 'Hero Banner 3',
      hasOverlay: true,
      overlayType: 'printers' // Print, Copy, Scan Workflow Heroes
    },
    { 
      src: '/hero-banner-2.png', 
      alt: 'Hero Banner 2',
      hasOverlay: true,
      overlayType: 'monitors' // New & Refurbished LCD Monitors
    },
  ];

  // Filter banners based on screen size
  const banners = isMobile ? allBanners.slice(1) : allBanners;
  const maxSlides = banners.length;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset slide to 0 when switching between mobile/desktop
  useEffect(() => {
    setCurrentSlide(0);
  }, [isMobile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % maxSlides);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [maxSlides]);

  return (
    <div className={`w-full ${openSans.className}`}>
      {/* Main Banner Carousel */}
      <div className="w-full relative overflow-hidden">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={`${banner.src}-${index}`} className="w-full shrink-0 relative">
              <div className="relative w-full aspect-[16/9] md:aspect-[16/6] lg:aspect-[1920/600] overflow-hidden">
                <Image 
                  src={banner.src} 
                  alt={banner.alt} 
                  fill
                  className="object-cover object-center"
                  priority={index === 0}
                  sizes="100vw"
                />
              </div>
              
              {/* Overlay for Banner 3 - Printers */}
              {banner.hasOverlay && banner.overlayType === 'printers' && (
                <div className="absolute inset-0 flex items-center justify-start">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 w-full">
                    <div className="max-w-md text-left">
                      <h2 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold mb-1 md:mb-2">
                        Print, Copy, Scan
                      </h2>
                      <h3 className="text-[#00aeef] text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 md:mb-6 whitespace-nowrap">
                        Workflow Heroes
                      </h3>
                      <Link
                        href="/all-products"
                        className="inline-flex items-center gap-2 bg-[#00aeef] hover:bg-[#0099d9] text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 shadow-lg"
                      >
                        SHOP NOW
                        <FiArrowRight className="text-base sm:text-lg" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay for Banner 2 - Monitors */}
              {banner.hasOverlay && banner.overlayType === 'monitors' && (
                <div className="absolute inset-0 flex items-center justify-start">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 w-full">
                    <div className="max-w-md text-left">
                      <h2 className="text-gray-700 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold mb-1 md:mb-2">
                        New & Refurbished
                      </h2>
                      <h3 className="text-[#00aeef] text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black mb-3 md:mb-6">
                        LCD Monitors
                      </h3>
                      <Link
                        href="/all-products"
                        className="inline-flex items-center gap-2 bg-[#00aeef] hover:bg-[#0099d9] text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 shadow-lg"
                      >
                        SHOP NOW
                        <FiArrowRight className="text-base sm:text-lg" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Section */}
      <div className="bg-white py-4 sm:py-6 md:py-8 mt-4 sm:mt-6 md:mt-8 border border-gray-300 rounded-xl sm:rounded-2xl max-w-[95%] sm:max-w-[97%] justify-center items-center mx-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Feature 1 - Faster Delivery */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <PiPackageThin className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">FASTER DELIVERY</h3>
                <p className="text-xs sm:text-sm text-gray-600">Delivery in 24/H</p>
              </div>
            </div>

            {/* Feature 2 - 24 Hours Return */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <CiTrophy className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">24 HOURS RETURN</h3>
                <p className="text-xs sm:text-sm text-gray-600">100% money-back guarantee</p>
              </div>
            </div>

            {/* Feature 3 - Secure Payment */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <CiCreditCard1 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">SECURE PAYMENT</h3>
                <p className="text-xs sm:text-sm text-gray-600">Your money is safe</p>
              </div>
            </div>

            {/* Feature 4 - Support 24/7 */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <CiHeadphones className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">SUPPORT 24/7</h3>
                <p className="text-xs sm:text-sm text-gray-600">Live contact/message</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero