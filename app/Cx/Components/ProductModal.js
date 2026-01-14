'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { FaTimes, FaStar, FaShoppingCart, FaFacebook, FaTwitter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiHeart } from 'react-icons/ci';
import { FaCopy, FaPinterest } from 'react-icons/fa6';
import { openSans } from '../Font/font';
import { useCart } from '../Providers/CartProvider';
import { useImagePreloader } from '../hooks/useImagePreloader';

const DEFAULT_MEMORY_OPTIONS = ['8GB Unified Memory', '16GB Unified Memory', '24GB Unified Memory'];
const DEFAULT_DISPLAY_OPTIONS = ['13-inch Retina Display', '14-inch Liquid Retina XDR', '16-inch Liquid Retina XDR'];
const DEFAULT_STORAGE_OPTIONS = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'];

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isNaN(value) ? fallback : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const formatPrice = (value) => {
  const numeric = toNumber(value, 0);
  return `PKR ${numeric.toLocaleString('en-PK')}`;
};

const extractImageArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value.imageUrls) && value.imageUrls.length) {
    return value.imageUrls.filter((url) => typeof url === 'string' && url.trim() !== '');
  }
  if (Array.isArray(value.image_urls) && value.image_urls.length) {
    return value.image_urls.filter((url) => typeof url === 'string' && url.trim() !== '');
  }
  if (Array.isArray(value.images) && value.images.length) {
    return value.images.filter((url) => typeof url === 'string' && url.trim() !== '');
  }
  if (Array.isArray(value.imageurls) && value.imageurls.length) {
    return value.imageurls.filter((url) => typeof url === 'string' && url.trim() !== '');
  }
  if (typeof value.image === 'string' && value.image.trim() !== '') {
    return [value.image.trim()];
  }
  return [];
};

const resolveProductType = (value) => {
  const rawType =
    value?.type ||
    (typeof value?.category === 'string' ? value.category : undefined);
  if (typeof rawType === 'string') {
    const normalized = rawType.toLowerCase();
    if (normalized.includes('printer')) return 'printer';
    if (normalized.includes('laptop')) return 'laptop';
  }
  return 'laptop';
};

const sanitizeProduct = (input) => {
  if (!input) return null;
  const type = resolveProductType(input);
  const images = extractImageArray(input);
  const hasId = input.id !== null && input.id !== undefined;
  const rawId = hasId ? input.id.toString() : '';
  const computedName =
    input.name ||
    (type === 'printer'
      ? [input.brand, input.series].filter(Boolean).join(' ').trim()
      : [input.brand, input.model || input.series].filter(Boolean).join(' ').trim());
  const finalName = computedName && computedName.trim()
    ? computedName.trim()
    : type === 'printer'
      ? 'Printer'
      : 'Product';
  const normalizedDescription =
    typeof input.description === 'string' ? input.description.trim() : '';
  const description =
    normalizedDescription ||
    (type === 'printer'
      ? [input.resolution, input.copyfeature, input.scanfeature, input.duplex]
          .filter(Boolean)
          .join(' • ')
      : input.processor || input.graphics || finalName);
  const cartId = input.cartId || (type && rawId ? `${type}-${rawId}` : rawId);
  const category = input.category || (type === 'printer' ? 'Printers' : 'Laptops');
  const primaryImage =
    images[0] ||
    input.image ||
    (type === 'printer' ? '/printer-category.png' : '/big-laptop.png');

  const numericPrice = toNumber(input.price, 0);
  return {
    ...input,
    id: rawId || input.id,
    type,
    category,
    cartId,
    name: finalName,
    description,
    price: numericPrice,
    hasPrice: Number.isFinite(numericPrice) && numericPrice > 0,
    rating: toNumber(input.rating, 4.5),
    reviews: toNumber(input.reviews, 0),
    image: primaryImage,
    imageUrls: images.length ? images : [primaryImage],
    image_urls: images.length ? images : [primaryImage],
    images: images.length ? images : [primaryImage],
    featured: ['true', 't', '1', true, 1].includes(input?.featured),
  };
};

const sanitizeSpecValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
};

const ProductModal = ({ isOpen, onClose, product }) => {
  const initialProduct = useMemo(() => sanitizeProduct(product), [product]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('space-gray');
  const [selectedMemory, setSelectedMemory] = useState(
    sanitizeSpecValue(initialProduct?.memory) || DEFAULT_MEMORY_OPTIONS[0],
  );
  const [selectedSize, setSelectedSize] = useState(
    sanitizeSpecValue(initialProduct?.display) || DEFAULT_DISPLAY_OPTIONS[0],
  );
  const [selectedStorage, setSelectedStorage] = useState(
    sanitizeSpecValue(initialProduct?.storage) || DEFAULT_STORAGE_OPTIONS[0],
  );
  const thumbnailScrollRef = useRef(null);
  const { addToCart } = useCart();

  const [productData, setProductData] = useState(initialProduct);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState('');

  const syncSpecSelections = useCallback(
    (source) => {
      if (!source || source.type === 'printer') {
        setSelectedMemory('');
        setSelectedSize('');
        setSelectedStorage('');
        return;
      }

      const nextMemory = sanitizeSpecValue(source.memory);
      const nextDisplay = sanitizeSpecValue(source.display);
      const nextStorage = sanitizeSpecValue(source.storage);

      setSelectedMemory((prev) => nextMemory || prev || DEFAULT_MEMORY_OPTIONS[0]);
      setSelectedSize((prev) => nextDisplay || prev || DEFAULT_DISPLAY_OPTIONS[0]);
      setSelectedStorage((prev) => nextStorage || prev || DEFAULT_STORAGE_OPTIONS[0]);
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(0);
      setQuantity(1);
      setSelectedColor('space-gray');
      const resetProduct = sanitizeProduct(product);
      syncSpecSelections(resetProduct);
      setProductData(resetProduct);
      setProductError('');
      setLoadingProduct(false);
      return;
    }

    const sanitized = sanitizeProduct(product);
    setProductData(sanitized);
    syncSpecSelections(sanitized);

    const resolvedType = sanitized?.type || 'laptop';
    const productIdentifier = product?.id ?? sanitized?.id;
    if (!productIdentifier) return;

    let active = true;
    const loadProduct = async () => {
      try {
        setLoadingProduct(true);
        setProductError('');
        const endpoint = resolvedType === 'printer' ? 'printers' : 'laptops';
        const response = await fetch(`https://hitek-server-uu0f.onrender.com/api/${endpoint}/${productIdentifier}`);
        if (!response.ok) {
          throw new Error('Failed to load product details');
        }
        const data = await response.json();
        if (!active) return;
        const merged = sanitizeProduct({ ...sanitized, ...data, type: resolvedType });
        setProductData(merged);
        syncSpecSelections(merged);
      } catch (error) {
        console.error('Product modal fetch error:', error);
        if (active) {
          setProductError(error.message || 'Failed to refresh product details.');
          setProductData(sanitized);
          syncSpecSelections(sanitized);
        }
      } finally {
        if (active) setLoadingProduct(false);
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [isOpen, product]);

  const productImages = useMemo(() => {
    const source = productData;
    if (!source) return ['/big-laptop.png'];
    const fromSanitized = extractImageArray(source);
    return fromSanitized.length ? fromSanitized : ['/big-laptop.png'];
  }, [productData]);

  useImagePreloader(productImages);

  const renderProductImage = (src, alt, className, size) => {
    if (src?.startsWith('http')) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={size ? { width: size.width, height: size.height } : undefined}
        />
      );
    }
    const width = size?.width || 600;
    const height = size?.height || 500;
    return (
      <Image
        src={src || '/big-laptop.png'}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  };

  const productType = productData?.type || 'laptop';
  const handleAddToCart = () => {
    const cartId = productData.cartId || (productType ? `${productType}-${productData.id}` : productData.id);
    addToCart(
      {
        id: cartId,
        productId: productData.id,
        type: productType,
        category: productData.category,
        name,
        image: productImages[0],
        price: priceValue,
        brand,
        sku,
      },
      quantity,
    );
    onClose();
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-blue-400 fill-current" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FaStar key={i} className="text-gray-300" />);
    }
    return stars;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const scrollThumbnailsLeft = () => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollThumbnailsRight = () => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  const memoryOptions = useMemo(() => {
    if (productType === 'printer') return [];
    const value = sanitizeSpecValue(productData?.memory);
    if (value) return [value];
    return DEFAULT_MEMORY_OPTIONS;
  }, [productType, productData?.memory]);

  const displayOptions = useMemo(() => {
    if (productType === 'printer') return [];
    const value = sanitizeSpecValue(productData?.display);
    if (value) return [value];
    return DEFAULT_DISPLAY_OPTIONS;
  }, [productType, productData?.display]);

  const storageOptions = useMemo(() => {
    if (productType === 'printer') return [];
    const value = sanitizeSpecValue(productData?.storage);
    if (value) return [value];
    return DEFAULT_STORAGE_OPTIONS;
  }, [productType, productData?.storage]);

  const effectiveMemory = selectedMemory || memoryOptions[0] || '';
  const effectiveDisplay = selectedSize || displayOptions[0] || '';
  const effectiveStorage = selectedStorage || storageOptions[0] || '';

  useEffect(() => {
    if (productType === 'printer') {
      return;
    }
    if (!selectedMemory && memoryOptions.length) {
      setSelectedMemory(memoryOptions[0]);
    }
    if (!selectedSize && displayOptions.length) {
      setSelectedSize(displayOptions[0]);
    }
    if (!selectedStorage && storageOptions.length) {
      setSelectedStorage(storageOptions[0]);
    }
  }, [
    productType,
    memoryOptions,
    displayOptions,
    storageOptions,
    selectedMemory,
    selectedSize,
    selectedStorage,
  ]);

  if (!isOpen) {
    return null;
  }

  if (!productData) {
    return null;
  }

  const name = productData.name || (productType === 'printer' ? 'Printer' : 'Product');
  const ratingValue = toNumber(productData.rating, 4.5);
  const reviewsCount = toNumber(productData.reviews, 0);
  const priceValue = toNumber(productData.price, 0);
  const brand = productData.brand || 'Unknown';
  const sku = productData.model || productData.series || `SKU-${productData.id}`;
  const formattedPrice = priceValue > 0 ? formatPrice(priceValue) : 'Price on request';
  const description = productData.description || productData.title || name;
  const specs =
    productType === 'printer'
      ? []
      : [
          { label: 'Processor', value: productData.processor },
          { label: 'Graphics', value: productData.graphics },
          { label: 'Memory', value: productData.memory },
          { label: 'Storage', value: productData.storage },
          { label: 'Display', value: productData.display },
          { label: 'Operating System', value: productData.os },
          { label: 'Adapter', value: productData.adapter },
          { label: 'Wi-Fi', value: productData.wifi },
          { label: 'Bluetooth', value: productData.bluetooth },
          { label: 'Camera', value: productData.camera },
          { label: 'Ports', value: productData.port },
          { label: 'Microphone', value: productData.mic },
          { label: 'Battery', value: productData.battery },
        ].filter((spec) => spec.value);


  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 ${openSans.className}`}
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white rounded-sm max-w-6xl w-full max-h-[96vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6">
            <div className="p-8 grid gap-12 justify-center items-start product-modal-grid">
              <div>
                <div className="mb-4 bg-white border p-6 border-gray-300 rounded-sm overflow-hidden flex items-center justify-center min-h-[400px]">
                  {renderProductImage(productImages[selectedImage], name, 'w-full h-auto object-contain max-w-full max-h-full', {
                    width: 600,
                    height: 500,
                  })}
                </div>

                <div className="relative flex items-center gap-2">
                  <button
                    onClick={scrollThumbnailsLeft}
                    className="shrink-0 w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full flex items-center justify-center transition z-10"
                    aria-label="Scroll thumbnails left"
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>

                  <div
                    ref={thumbnailScrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {productImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`shrink-0 border-2 rounded-sm overflow-hidden transition ${
                          selectedImage === index ? 'border-[#00aeef]' : 'border-gray-200'
                        }`}
                      >
                        {renderProductImage(img, `Thumbnail ${index + 1}`, 'w-20 h-20 object-contain', {
                          width: 80,
                          height: 80,
                        })}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={scrollThumbnailsRight}
                    className="shrink-0 w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full flex items-center justify-center transition z-10"
                    aria-label="Scroll thumbnails right"
                  >
                    <FaChevronRight className="text-sm" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 z-10"
                  aria-label="Close product modal"
                >
                  <FaTimes className="text-2xl" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {renderStars(ratingValue)}
                    </div>
                    <span className="text-sm text-black font-bold">
                      {ratingValue.toFixed(1)} Star Rating
                    </span>
                    <span className="text-sm text-gray-600">
                      ({reviewsCount.toLocaleString('en-PK')} user feedback)
                    </span>
                  </div>
                  <h1 className="text-xl text-gray-900 mb-3 leading-snug">
                    {name}
                  </h1>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3 text-sm text-gray-600">
                  <div className="space-y-1">
                    <p>
                      SKU: <span className="font-semibold text-gray-900">{sku}</span>
                    </p>
                    <p>
                      Brand: <span className="font-semibold text-gray-900">{brand}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    {productData.category && (
                      <p>
                        Category:{' '}
                        <span className="font-semibold text-gray-900">
                          {productData.category}
                        </span>
                      </p>
                    )}
                    {productData.availability && (
                      <p>
                        Availability:{' '}
                        <span className="font-semibold text-green-500">
                          {productData.availability}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[#00aeef]">{formattedPrice}</span>
                  {productData.oldPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(productData.oldPrice)}
                    </span>
                  )}
                </div>

                {productError && (
                  <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                    {productError}
                  </div>
                )}

                {loadingProduct && (
                  <div className="text-sm text-blue-500">Refreshing product details...</div>
                )}

                {productType !== 'printer' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <div className="flex gap-2">
                          {[
                            { id: 'space-gray', label: 'Space Gray' },
                            { id: 'silver', label: 'Silver' },
                          ].map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSelectedColor(option.id)}
                              className={`px-4 py-2 text-sm border rounded-sm transition ${
                                selectedColor === option.id
                                  ? 'border-[#00aeef] text-[#00aeef]'
                                  : 'border-gray-300 text-gray-600 hover:border-[#00aeef]'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Memory
                        </label>
                        <select
                          value={effectiveMemory}
                          onChange={(e) => setSelectedMemory(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          disabled={memoryOptions.length <= 1}
                        >
                          {memoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Size
                        </label>
                        <select
                          value={effectiveDisplay}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          disabled={displayOptions.length <= 1}
                        >
                          {displayOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Storage
                        </label>
                        <select
                          value={effectiveStorage}
                          onChange={(e) => setSelectedStorage(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          disabled={storageOptions.length <= 1}
                        >
                          {storageOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                

                <div className="flex gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-12 border border-gray-300 rounded-sm hover:bg-gray-100 flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-16 h-12 text-center border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-12 border border-gray-300 rounded-sm hover:bg-gray-100 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-[50%] bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-sm font-bold flex items-center justify-center gap-2 transition"
                  >
                    <FaShoppingCart />
                    ADD TO CART
                  </button>
                </div>

                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-700">+ Add to Wishlist</p>
                  <div className="flex gap-2">
                    <p className="text-sm font-medium text-gray-700">Share product:</p>
                    <div className="flex items-center gap-3">
                      <button className="text-gray-600 hover:text-[#00aeef] transition">
                        <FaCopy className="text-xl" />
                      </button>
                      <button className="text-gray-600 hover:text-[#00aeef] transition">
                        <FaFacebook className="text-xl" />
                      </button>
                      <button className="text-gray-600 hover:text-[#00aeef] transition">
                        <FaTwitter className="text-xl" />
                      </button>
                      <button className="text-gray-600 hover:text-[#00aeef] transition">
                        <FaPinterest className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .product-modal-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 1024px) {
          .product-modal-grid {
            grid-template-columns: 45% 55%;
          }
        }
      `}</style>
    </>
  );
};

export default ProductModal;
