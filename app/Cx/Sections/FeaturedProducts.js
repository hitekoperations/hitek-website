'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiShoppingCart, CiHeart } from 'react-icons/ci';
import { FaRegEye } from "react-icons/fa6";
import { FiArrowRight } from 'react-icons/fi';
import { openSans } from '../Font/font';
import ProductModal from '../Components/ProductModal';
import { useCart } from '../Providers/CartProvider';
import { useImagePreloader } from '../hooks/useImagePreloader';

const placeholderImage = {
  laptop: '/laptop-category.jpg',
  printer: '/printer-category.png',
};

const renderStars = (rating) => {
  const safeRating = typeof rating === 'number' ? rating : 4.5;
  const stars = [];
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<span key={`full-${i}`}>★</span>);
  }
  if (hasHalfStar) {
    stars.push(<span key="half">☆</span>);
  }
  for (let i = stars.length; i < 5; i++) {
    stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
  }
  return stars;
};

const FeaturedProductCard = ({ product, onPreview, onAddToCart }) => {
  const productType = (product.type || 'laptop').toLowerCase();
  const productId = product.id ? encodeURIComponent(product.id) : '';
  const href = productId
    ? `/product/${productId}?type=${encodeURIComponent(productType)}`
    : '/all-products';
  const images = Array.isArray(product.imageUrls) && product.imageUrls.length
    ? product.imageUrls
    : [product.image || placeholderImage[productType] || placeholderImage.laptop];
  useImagePreloader(images);
  const [activeImage, setActiveImage] = useState(0);

  const handlePrev = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const handleDotSelect = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage(index);
  };

  return (
    <Link
      href={href}
      className="relative bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer flex flex-col"
    >
      {product.label && (
        <div className={`absolute top-2 left-2 ${product.label.color} text-white text-xs font-bold px-2 py-1 rounded z-10`}>
          {product.label.text}
        </div>
      )}

      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-white rounded-full p-2 hover:bg-gray-100">
          <CiHeart className="text-lg" />
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onAddToCart?.(product);
          }}
          className="bg-white rounded-full p-2 hover:bg-gray-100"
        >
          <CiShoppingCart className="text-lg" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onPreview?.(product);
          }}
          className="bg-white rounded-full p-2 hover:bg-gray-100"
        >
          <FaRegEye className="text-lg" />
        </button>
      </div>

      <div className="relative w-full h-40 flex items-center justify-center p-4 bg-white">
        <Image
          src={images[activeImage] || placeholderImage[productType] || placeholderImage.laptop}
          alt={product.name}
          width={160}
          height={160}
          className="object-contain max-h-full max-w-full"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 hover:bg-white"
              aria-label="Previous product image"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 hover:bg-white"
              aria-label="Next product image"
            >
              <FaChevronRight className="text-xs" />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/80 rounded-full px-2 py-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(event) => handleDotSelect(event, index)}
                  className={`w-2 h-2 rounded-full transition ${
                    index === activeImage ? 'bg-[#00aeef]' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-yellow-400 mb-2 text-sm">
          {renderStars(product.rating)}
          <span className="text-gray-600 text-xs ml-1">({product.reviews})</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">{product.desc}</p>
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-gray-900">Rs. {product.price}</span>
          {product.oldPrice && (
            <span className="text-sm text-gray-400 line-through">Rs. {product.oldPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

const API_BASE = 'https://hitek-server-uu0f.onrender.com';

const FeaturedProducts = () => {
  const [activeTab, setActiveTab] = useState('All Product');
  const [laptopData, setLaptopData] = useState([]);
  const [printerData, setPrinterData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();

  const parsePrice = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const digits = value.replace(/[^0-9.-]/g, '');
      const parsed = Number(digits);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [laptopsRes, printersRes] = await Promise.all([
          fetch(`${API_BASE}/api/laptops?limit=8`),
          fetch(`${API_BASE}/api/printers?limit=8`),
        ]);

        if (laptopsRes.ok) {
          const laptopsJson = await laptopsRes.json();
          setLaptopData(Array.isArray(laptopsJson) ? laptopsJson : []);
        }

        if (printersRes.ok) {
          const printersJson = await printersRes.json();
          setPrinterData(Array.isArray(printersJson) ? printersJson : []);
        }
      } catch (error) {
        console.error('Featured products fetch error:', error);
      }
    };

    fetchProducts();
  }, []);

  const normalizeProduct = (item, type) => {
    if (!item) return null;
    const imageArray = Array.isArray(item.image_urls)
      ? item.image_urls.filter((url) => typeof url === 'string' && url.trim())
      : [];
    const image = imageArray[0] || item.image || (type === 'printer' ? '/printer-category.png' : '/laptop-category.jpg');
    const priceValue = parsePrice(item.price);
    const oldPriceValue = parsePrice(item.old_price);
    return {
      id: item.id,
      name: item.name || 'Unnamed Product',
      desc:
        item.description ||
        (type === 'printer'
          ? [item.resolution, item.copyfeature, item.scanfeature, item.duplex].filter(Boolean).join(' • ')
          : item.processor || item.graphics || 'No description available'),
      price: priceValue.toLocaleString('en-PK'),
      oldPrice: oldPriceValue ? oldPriceValue.toLocaleString('en-PK') : null,
      rating: Number(item.rating) || 4.5,
      reviews: Number(item.reviews) || 0,
      image,
      imageUrls: imageArray,
      rawPrice: priceValue,
      type,
    };
  };

  const laptops = useMemo(() => {
    if (!Array.isArray(laptopData)) return [];
    return laptopData
      .map((item) => normalizeProduct(item, 'laptop'))
      .filter(Boolean)
      .slice(0, 8);
  }, [laptopData]);

  const printers = useMemo(() => {
    if (!Array.isArray(printerData)) return [];
    return printerData
      .map((item) => normalizeProduct(item, 'printer'))
      .filter(Boolean)
      .slice(0, 8);
  }, [printerData]);

  const allProducts = useMemo(() => {
    const map = new Map();
    [...laptops, ...printers].forEach((product) => {
      const key = product.id || `${product.name}-${product.type}`;
      if (!map.has(key)) {
        map.set(key, product);
      }
    });
    return Array.from(map.values());
  }, [laptops, printers]);

  const displayProducts = useMemo(() => {
    switch (activeTab) {
      case 'Laptop':
        return laptops.slice(0, 8);
      case 'Printers':
        return printers.slice(0, 8);
      case 'Desktops':
        return allProducts
          .filter((item) => (item.name || '').toLowerCase().includes('desktop'))
          .slice(0, 8);
      case 'LEDs':
        return allProducts
          .filter((item) => (item.name || '').toLowerCase().includes('led'))
          .slice(0, 8);
      default:
        return allProducts.slice(0, 8);
    }
  }, [activeTab, laptops, printers, allProducts]);

  const tabs = ['All Product', 'Printers', 'Laptop', 'Desktops', 'LEDs'];

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Banner */}
          <div className="lg:col-span-1">
            <div className="bg-linear-to-b from-blue-900 to-black rounded-lg overflow-hidden h-full">
              <div className="p-6 text-white">
                <p className="text-xs uppercase tracking-wide mb-2">LAPTOPS & PRINTERS</p>
                <h2 className="text-3xl font-bold mb-2">50% Discount</h2>
                <p className="text-lg mb-4">On All Products</p>
                
                <div className="bg-gray-800 p-3 rounded mb-4">
                  <p className="text-xs text-center">Offers ends in: DD : HH : MM : SS</p>
                </div>
                
                <button className="w-full bg-[#00aeef] hover:bg-[#0099d9] text-white py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                  SHOP NOW
                  <FiArrowRight />
                </button>
              </div>
              
              <div className="mt-4 overflow-hidden flex justify-center items-end h-112">
                <Image
                  src="/stacked-laptops.jpg"
                  alt="Stacked Laptops"
                  width={600}
                  height={600}
                  className="object-contain w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Right Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 ">Featured Products</h2>
              
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex gap-4 flex-wrap">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-0 py-2 transition relative ${
                        activeTab === tab
                          ? 'text-gray-900 font-bold'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00aeef]"></span>
                      )}
                    </button>
                  ))}
                </div>
                
                <a href="/all-products" className="text-[#00aeef] hover:text-[#0099d9] font-medium flex items-center gap-2 ml-auto">
                  Browse All Product
                  <FiArrowRight />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <FeaturedProductCard
                  key={product.id || `${product.name}-${product.type}`}
                  product={product}
                  onPreview={(item) => {
                    setSelectedProduct(item);
                    setIsModalOpen(true);
                  }}
                  onAddToCart={(item) => {
                    if (!item) return;
                    const fallbackId = item.id || `${item.type || 'product'}-${item.name}`;
                    addToCart({
                      id: fallbackId,
                      name: item.name,
                      price: Number(item.rawPrice || 0),
                      image: item.image,
                      type: item.type,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
};

export default FeaturedProducts;

