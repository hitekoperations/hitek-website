'use client';

import React from 'react';
import Image from 'next/image';
import { openSans } from '../Font/font';
import Link from 'next/link';

const Brands = () => {
  return (
    <div className={`w-full py-8 lg:py-12 bg-gray-50 ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* HP OMEN Banner */}
          <Link href="/laptops?brand=HP" className="relative group cursor-pointer overflow-hidden rounded-lg h-64">
            <div className="w-full h-full">
              <Image 
                src="/hp-victus.jpg" 
                alt="HP OMEN Laptops" 
                width={600}
                height={400}
                className="w-full h-full object-cover object-right transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">HP OMEN Laptops Now Available!</h3>
              </div>
            </div>
          </Link>

          {/* HP LaserJet Banner */}
          <Link href="/printers?brand=HP" className="relative group cursor-pointer overflow-hidden rounded-lg h-64">
            <div className="w-full h-full">
              <Image 
                src="/cool-hp.jpg" 
                alt="HP LaserJet Printers & Toner" 
                width={600}
                height={400}
                className="w-full h-full object-cover object-right transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">HP LaserJet Printers & Toner</h3>
              </div>
            </div>
          </Link>

          {/* Lenovo LEGION Banner */}
          <Link href="/laptops?brand=Lenovo" className="relative group cursor-pointer overflow-hidden rounded-lg h-64">
            <div className="w-full h-full">
              <Image 
                src="/lenovo-legion.jpg" 
                alt="Lenovo LEGION Laptops" 
                width={600}
                height={400}
                className="w-full h-full object-cover scale-110 object- transition-transform duration-300 group-hover:scale-120"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">Lenovo LEGION Laptops Now Available!</h3>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Brands