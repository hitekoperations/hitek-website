'use client';

import React, { useState } from 'react';
import { openSans } from '../Font/font';
const Map = () => {
  const [activeCity, setActiveCity] = useState('Karachi');

  const cities = ['Karachi', 'Lahore', 'Quetta', 'Peshawar'];

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Store Locations</h2>
        
        {/* City Tabs */}
        <div className="flex justify-center mb-6">
          <div className="w-full md:w-[70%] mx-auto bg-gray-100 flex flex-wrap gap-2 p-2 rounded-lg">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`flex-1 min-w-[calc(50%-0.25rem)] md:min-w-0 py-3 px-2 md:px-0 font-medium transition rounded-md ${
                  activeCity === city
                    ? 'bg-[#00aeef] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="w-full md:w-[70%] mx-auto rounded-lg overflow-hidden shadow-lg">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3620.4089675097575!2d67.00614997449246!3d24.849874878045682665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33e064597032d%3A0xec613d47d59822c3!2sHi-tekcomputers!5e0!3m2!1sen!2s!4v1762201001856!5m2!1sen!2s"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Map;

