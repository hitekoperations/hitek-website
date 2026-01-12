'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight, FaRegEye } from 'react-icons/fa';
import { CiShoppingCart, CiHeart } from 'react-icons/ci';
import { openSans } from '../Font/font';
import { useCart } from '../Providers/CartProvider';

const LED = () => {
  const scrollContainerRef = useRef(null);
  const { addToCart } = useCart();

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -250, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 250, behavior: 'smooth' });
    }
  };

  const products = [
    {
      name: 'DELL 22" LED P2217H',
      price: '25,000',
      rating: 4,
      reviews: 816,
      image: '/monitor-category.png'
    },
    {
      name: 'DELL LED SE2222H NEW',
      price: '22,000',
      oldPrice: '30,000',
      rating: 3.5,
      reviews: 877,
      image: '/monitor-category.png',
      label: { text: '25% OFF', color: 'bg-yellow-400 text-black' }
    },
    {
      name: 'VIEWSONIC LED 24" VA2436 SERIES FULL HD LED',
      price: '25,000',
      rating: 3.5,
      reviews: 816,
      image: '/monitor-category.png'
    },
    {
      name: 'SAMSUNG LED PC50A9000 FULL UHD',
      price: '25,000',
      rating: 3.5,
      reviews: 816,
      image: '/monitor-category.png'
    },
    {
      name: 'DELL LED SE2222H NEW',
      price: '22,000',
      oldPrice: '30,000',
      rating: 3.5,
      reviews: 877,
      image: '/monitor-category.png',
      label: { text: '25% OFF', color: 'bg-yellow-400 text-black' }
    },
    {
      name: 'DELL 22" LED P2217H',
      price: '25,000',
      rating: 4,
      reviews: 816,
      image: '/monitor-category.png'
    },
    {
      name: 'VIEWSONIC LED 24" VA2436 SERIES FULL HD LED',
      price: '25,000',
      rating: 3.5,
      reviews: 816,
      image: '/monitor-category.png'
    }
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i}>★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half">☆</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="text-gray-300">☆</span>);
    }
    return stars;
  };

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">LED Monitors</h2>
        </div>

        <div className="relative px-12">
          {/* Left Arrow Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full p-3 shadow-lg transition"
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
            {products.map((product, index) => (
              <div
                key={index}
                className="relative bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer flex flex-col shrink-0 w-[234px] h-[320px]"
              >
                {product.label && (
                  <div className={`absolute top-2 left-2 ${product.label.color} text-xs font-bold px-2 py-1 rounded z-10`}>
                    {product.label.text}
                  </div>
                )}

                {/* Hover icons */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="bg-white rounded-full p-2 hover:bg-gray-100">
                    <CiHeart className="text-lg" />
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      addToCart({
                        id: `led-${index}`,
                        name: product.name,
                        price: Number(String(product.price).replace(/[^0-9.-]/g, '')) || 0,
                        image: product.image,
                        type: 'led',
                      });
                    }}
                    className="bg-white rounded-full p-2 hover:bg-gray-100"
                  >
                    <CiShoppingCart className="text-lg" />
                  </button>
                  <div className="bg-white rounded-full p-2 hover:bg-gray-100">
                    <FaRegEye className="text-lg" />
                  </div>
                </div>

                <div className="w-full h-40 flex items-center justify-center p-4 bg-white">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1 text-yellow-400 mb-2 text-sm">
                    {renderStars(product.rating)}
                    <span className="text-gray-600 text-xs ml-1">({product.reviews})</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="text-base font-bold text-gray-900">Rs. {product.price}</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">Rs. {product.oldPrice}</span>
                    )}
                  </div>
                </div>
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

export default LED;

