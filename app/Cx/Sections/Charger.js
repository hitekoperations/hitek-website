'use client';

import React from 'react';
import Image from 'next/image';
import { FaPlay } from 'react-icons/fa';
import { openSans } from '../Font/font';
import Link from 'next/link';

const Charger = () => {
  return (
    <div className={`w-full pb-8 ${openSans.className}`}>
      <div className=" mx-auto">
        <div className="relative overflow-hidden group cursor-pointer h-[440px]">
          <Image 
            src="/Banner-001.png" 
            alt="Charger Banner" 
            width={1400}
            height={500}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-8 lg:p-12">
            <div className="max-w-lg">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Your trusted and reliable retail shop
              </h2>
              <p className="text-gray-200 mb-6 leading-relaxed">
              At Hi-Tek Computers we’ve got you covered with reliable laptops, printers, LEDs, desktop PCs, refurbished gear, and essential mobile and PC accessories designed to power your life.
              </p>
              
              {/* Play Button */}
              <Link href={"https://www.youtube.com/@HiTek_Computers"}><button className="flex items-center cursor-pointer justify-center w-16 h-16 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full transition transform hover:scale-110">
                <FaPlay className="text-xl ml-1" />
              </button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charger;

