'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaRegEye } from 'react-icons/fa';
import { CiShoppingCart, CiHeart } from 'react-icons/ci';
import { openSans } from '../Font/font';
import ProductModal from '../Components/ProductModal';
import { useCart } from '../Providers/CartProvider';
import { useImagePreloader } from '../hooks/useImagePreloader';

const Laptop = () => {
  const scrollContainerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const parseNumeric = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number') return Number.isNaN(value) ? fallback : value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('https://hitek-server-uu0f.onrender.com/api/laptops');
        if (!response.ok) {
          throw new Error('Failed to load laptops');
        }
        const data = await response.json();
        const normalized = (Array.isArray(data) ? data : []).map((item) => {
          const rawImageUrls = Array.isArray(item.image_urls)
            ? item.image_urls.filter((url) => typeof url === 'string' && url.trim() !== '')
            : [];
          const primaryImage = rawImageUrls[0] || item.image || '/laptop-category.jpg';
          const imageArray = rawImageUrls.length ? rawImageUrls : [primaryImage];
          const rawId = item.id !== null && item.id !== undefined && item.id.toString
            ? item.id.toString()
            : item.id;

          return {
            ...item,
            id: rawId,
            cartId: rawId ? `laptop-${rawId}` : undefined,
            type: 'laptop',
            category: 'Laptops',
            price: parseNumeric(item.price, 0),
            rating: parseNumeric(item.rating, 4.5),
            reviews: parseNumeric(item.reviews, 120),
            description: item.description || item.title || item.name,
            image: primaryImage,
            imageUrls: imageArray,
            image_urls: imageArray,
            images: imageArray,
            featured: ['true', 't', '1', true, 1].includes(item?.featured),
          };
        });
        setProducts(normalized);
      } catch (err) {
        console.error('Laptops fetch error:', err);
        setError(err.message || 'Failed to load laptops.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const displayProducts = useMemo(() => products.slice(0, 12), [products]);

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

  const handlePreview = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (item) => {
    if (!item) return;
    addToCart({
      id: item.cartId || item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      type: item.type,
    });
  };

  const renderCardImage = (src, alt, className, size = { width: 160, height: 160 }) => {
    if (src?.startsWith('http')) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ width: size.width, height: size.height }}
        />
      );
    }
    return (
      <Image
        src={src || '/laptop-category.jpg'}
        alt={alt}
        width={size.width}
        height={size.height}
        className={className}
      />
    );
  };

  const LaptopCard = ({ product }) => {
    const images = Array.isArray(product.imageUrls) && product.imageUrls.length
      ? product.imageUrls
      : [product.image || '/laptop-category.jpg'];
    useImagePreloader(images);
    const [activeImage, setActiveImage] = useState(0);
    const productType = (product.type || 'laptop').toLowerCase();
    const productId = product.id ? encodeURIComponent(product.id) : '';
    const productHref = productId
      ? `/product/${productId}?type=${encodeURIComponent(productType)}`
      : '/all-products';

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
        key={product.id}
        href={productHref}
        className="relative bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer flex flex-col shrink-0 w-[234px] h-[320px]"
      >
        {product.label && (
          <div className={`absolute top-2 left-2 ${product.label.color} text-white text-xs font-bold px-2 py-1 rounded z-10`}>
            {product.label.text}
          </div>
        )}

        <div
          className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <div className="bg-white rounded-full p-2 hover:bg-gray-100">
            <CiHeart className="text-lg" />
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              handleAddToCart(product);
            }}
            className="bg-white rounded-full p-2 hover:bg-gray-100"
          >
            <CiShoppingCart className="text-lg" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              handlePreview(product);
            }}
            className="bg-white rounded-full p-2 hover:bg-gray-100"
          >
            <FaRegEye className="text-lg" />
          </button>
        </div>

        <div className="relative w-full h-40 flex items-center justify-center p-4 bg-white">
          {renderCardImage(
            images[activeImage],
            `${product.name} preview ${activeImage + 1}`,
            'object-contain max-h-full max-w-full',
            { width: 160, height: 160 },
          )}

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
            <span className="text-gray-600 text-xs ml-1">
              ({Number(product.reviews || 0).toLocaleString('en-PK')})
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-base font-bold text-gray-900">
              PKR {Number(product.price || 0).toLocaleString('en-PK')}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Laptops</h2>
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
            {loading ? (
              <div className="w-full text-sm text-gray-500 p-8 text-center">
                Loading laptops...
              </div>
            ) : error ? (
              <div className="w-full text-sm text-red-500 p-8 text-center">
                {error}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="w-full text-sm text-gray-500 p-8 text-center">
                No laptops available right now.
              </div>
            ) : (
              displayProducts.map((product) => (
                <LaptopCard key={product.id} product={product} />
              ))
            )}
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

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default Laptop;

