'use client';

import React from 'react';
import { openSans } from '../Font/font';
const Testimonials = () => {
  const testimonials = [
    {
      review: "Maine Hi-Tek se ek printer khareeda hai aur print quality ne mujhe kaafi impress kiya hai. Setup bilkul straightforward tha, aur after-sales service exceptional rahi. Support team se Saad bahut hi helpful the. Product quality aur customer care dono ke liye main Hi-Tek ko highly recommend karta hoon.",
      name: "Shazaib Faraz",
      rating: 5
    },
    {
      review: "Maine recently apne gaming setup ke liye Hi-Tek se ek LED monitor purchase kiya hai, aur main isse lekar kaafi zyada satisfied hoon. Colors kaafi vibrant hain aur response time excellent hai. Isne meri gaming experience ko kaafi enhance kar diya hai. Quality products aur service ke liye main Hi-Tek ko highly recommend karta hoon.",
      name: "Ali Murad",
      rating: 5
    },
    {
      review: "Maine Hi-Tek se ek naya laptop purchase kiya hai. Laptop fast aur reliable hai, aur screen bhi kaafi achchi hai. Main Hitek ko highly recommend karta hoon jo ek quality laptop aur Service dhoondh raha hai.",
      name: "Ahad Ayaz",
      rating: 5
    },
    {
      review: "I've been a loyal customer of Hi-Tek for years and they never disappoint. Their products are top-notch and their customer service is outstanding. Always my go-to for all my tech needs!",
      name: "Le Thomas",
      rating: 5
    },
    {
      review: "Great experience shopping at Hi-Tek. The staff is knowledgeable and helped me find the perfect laptop for my needs. Fast delivery and excellent packaging. Highly recommended!",
      name: "Mike Johnson",
      rating: 5
    }
  ];

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<span key={i}>★</span>);
    }
    return stars;
  };

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">What Our Customers Say</h2>
        
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="shrink-0 w-[400px] bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
                <div className="flex text-yellow-400 mb-4 text-xl">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {testimonial.review}
                </p>
                <p className="text-gray-900 font-semibold">
                  - {testimonial.name}
                </p>
              </div>
            ))}
          </div>
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

export default Testimonials;

