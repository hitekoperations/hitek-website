'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { FaStar, FaShoppingCart, FaFacebook, FaTwitter, FaChevronLeft, FaChevronRight, FaGift, FaTruck, FaHeadset } from 'react-icons/fa';
import { CiHeart, CiCreditCard1 } from 'react-icons/ci';
import { FaCopy, FaPinterest } from 'react-icons/fa6';
import { MdMoneyOff, MdAttachMoney } from 'react-icons/md';
import Navbar from '../../Cx/Layout/Navbar';
import Footer from '../../Cx/Layout/Footer';
import { openSans } from '../../Cx/Font/font';
import { useCart } from '../../Cx/Providers/CartProvider';

const DEFAULT_MEMORY_OPTIONS = ['8GB Unified Memory', '16GB Unified Memory', '24GB Unified Memory'];
const DEFAULT_DISPLAY_OPTIONS = ['13-inch Retina Display', '14-inch Liquid Retina XDR', '16-inch Liquid Retina XDR'];
const DEFAULT_STORAGE_OPTIONS = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'];

const sanitizeSpecValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
};

const ProductPage = () => {
  const params = useParams();
  const productId = params?.id;
  const searchParams = useSearchParams();
  const requestedType = searchParams?.get('type');
  const requestedTypeLower = typeof requestedType === 'string' ? requestedType.toLowerCase() : '';
  const initialType =
    requestedTypeLower === 'printer'
      ? 'printer'
      : requestedTypeLower === 'scanner'
        ? 'scanner'
        : 'laptop';
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('space-gray');
  const [selectedMemory, setSelectedMemory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addMessage, setAddMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { addToCart } = useCart();
  const thumbnailScrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('description');

  const parseNumeric = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const num = Number(cleaned);
    return Number.isNaN(num) ? fallback : num;
  };

  const extractImageArray = (item, type = 'laptop') => {
    if (!item) return [];
    const candidates = [
      item.imageUrls,
      item.image_urls,
      item.images,
      item.imageurls,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate
          .map((url) => (typeof url === 'string' ? url.trim() : ''))
          .filter((url) => url);
      }
    }
    if (typeof item.image === 'string' && item.image.trim()) {
      return [item.image.trim()];
    }
    const placeholder = type === 'printer' ? '/printer-category.png' : '/big-laptop.png';
    return [placeholder];
  };

  const resolveProductType = (data, fallback = initialType) => {
    const rawType =
      data?.type ||
      (typeof data?.category === 'string' ? data.category : undefined);
    if (typeof rawType === 'string') {
      const normalized = rawType.toLowerCase();
      if (normalized.includes('printer')) return 'printer';
      if (normalized.includes('scanner')) return 'scanner';
      if (normalized.includes('laptop')) return 'laptop';
    }
    return fallback;
  };

  const renderProductImage = (src, alt, className, size, fallback) => {
    if (src?.startsWith?.('http')) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={
            size
              ? { width: size.width, height: size.height, maxWidth: '100%', maxHeight: '100%' }
              : { maxWidth: '100%', maxHeight: '100%' }
          }
        />
      );
    }
    const width = size?.width || 600;
    const height = size?.height || 500;
    return (
      <Image
        src={src || fallback}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      setError('');

      try {
        let endpointType = initialType;
        const buildUrl = (type) => {
          if (type === 'printer') return `https://hitek-server-uu0f.onrender.com/api/printers/${productId}`;
          if (type === 'scanner') return `https://hitek-server-uu0f.onrender.com/api/scanners/${productId}`;
          return `https://hitek-server-uu0f.onrender.com/api/laptops/${productId}`;
        };

        const url = buildUrl(endpointType);
        console.log('🔍 Fetching product from:', url);
        console.log('📡 Server being used: hitek-server-uu0f.onrender.com');
        
        let response = await fetch(url);

        if (response.status === 404) {
          // Try fallback types
          const fallbackTypes = endpointType === 'printer' 
            ? ['scanner', 'laptop']
            : endpointType === 'scanner'
              ? ['printer', 'laptop']
              : ['printer', 'scanner'];
          
          for (const fallbackType of fallbackTypes) {
            const fallbackResponse = await fetch(buildUrl(fallbackType));
            if (fallbackResponse.ok) {
              response = fallbackResponse;
              endpointType = fallbackType;
              break;
            }
          }
        }

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found.');
          }
          throw new Error('Failed to load product details. Please try again.');
        }

        const data = await response.json();
        const resolvedType = resolveProductType(data, endpointType);
        const imageArray = extractImageArray(data, resolvedType);
        const placeholder = resolvedType === 'printer' ? '/printer-category.png' : resolvedType === 'scanner' ? '/printer-category.png' : '/big-laptop.png';
        const images = imageArray.length ? imageArray : [placeholder];
        const rawId =
          data.id !== null && data.id !== undefined && data.id.toString
            ? data.id.toString()
            : data.id;
        const computedName =
          (data.name ||
            (resolvedType === 'printer'
              ? [data.brand, data.series].filter(Boolean).join(' ').trim()
              : [data.brand, data.model || data.series].filter(Boolean).join(' ').trim())) || '';
        const finalName = computedName.trim()
          ? computedName.trim()
          : resolvedType === 'printer'
            ? 'Printer'
            : 'Product';
        const normalizedDescription =
          typeof data.description === 'string' ? data.description.trim() : '';
        const computedDescription =
          normalizedDescription ||
          (resolvedType === 'printer'
            ? [data.resolution, data.copyfeature, data.scanfeature, data.duplex]
                .filter(Boolean)
                .join(' • ')
            : data.processor || data.graphics || '') ||
          finalName;

        const normalized = {
          ...data,
          id: rawId,
          type: resolvedType,
          category: data.category || (resolvedType === 'printer' ? 'Printers' : resolvedType === 'scanner' ? 'Scanners' : 'Laptops'),
          cartId: rawId ? `${resolvedType}-${rawId}` : undefined,
          name: finalName,
          description: computedDescription,
          price: parseNumeric(data.price, 0),
          hasPrice: parseNumeric(data.price, 0) > 0,
          rating: parseNumeric(data.rating, 4.7) || 4.7,
          reviews: parseNumeric(data.reviews, 0),
          brand: data.brand || 'Unknown',
          model: data.model || data.series || `SKU-${data.id}`,
          image: images[0] || placeholder,
          imageUrls: images,
          image_urls: images,
          images,
        };
        setProduct(normalized);
        console.log('✅ Product loaded successfully from: hitek-server-uu0f.onrender.com');
        if (normalized.type === 'printer' || normalized.type === 'scanner') {
          setSelectedMemory('');
          setSelectedSize('');
          setSelectedStorage('');
        } else {
          const memoryValue = sanitizeSpecValue(normalized.memory);
          const displayValue = sanitizeSpecValue(normalized.display);
          const storageValue = sanitizeSpecValue(normalized.storage);
          setSelectedMemory(memoryValue || DEFAULT_MEMORY_OPTIONS[0]);
          setSelectedSize(displayValue || DEFAULT_DISPLAY_OPTIONS[0]);
          setSelectedStorage(storageValue || DEFAULT_STORAGE_OPTIONS[0]);
        }

        // Fetch related products
        try {
          const relatedEndpoint = resolvedType === 'printer' 
            ? 'https://hitek-server-uu0f.onrender.com/api/printers'
            : 'https://hitek-server-uu0f.onrender.com/api/laptops';
          const relatedResponse = await fetch(relatedEndpoint);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            const relatedArray = Array.isArray(relatedData) ? relatedData : [];
            // Filter out current product and limit to 12
            const filtered = relatedArray
              .filter((item) => {
                const itemId = item.id?.toString() || '';
                const currentId = normalized.id?.toString() || '';
                return itemId !== currentId;
              })
              .slice(0, 12)
              .map((item) => {
                const itemId = item.id?.toString() || '';
                const itemType = resolvedType;
                const itemImages = extractImageArray(item, itemType);
                const itemPlaceholder = itemType === 'printer' ? '/printer-category.png' : '/big-laptop.png';
                const itemImage = itemImages.length ? itemImages[0] : itemPlaceholder;
                const itemName = item.name || 
                  (itemType === 'printer' 
                    ? [item.brand, item.series].filter(Boolean).join(' ').trim()
                    : [item.brand, item.model || item.series].filter(Boolean).join(' ').trim()) || 
                  'Product';
                const itemPrice = parseNumeric(item.price, 0);
                const itemDescription = itemType === 'printer'
                  ? [item.resolution, item.copyfeature, item.scanfeature, item.duplex].filter(Boolean).join(' • ') || ''
                  : [item.processor, item.memory, item.storage].filter(Boolean).join(' • ') || '';
                return {
                  id: itemId,
                  type: itemType,
                  name: itemName,
                  price: itemPrice,
                  image: itemImage,
                  description: itemDescription,
                  brand: item.brand || '',
                  model: item.model || item.series || '',
                };
              });
            setRelatedProducts(filtered);
          }
        } catch (err) {
          console.error('Error fetching related products:', err);
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(err.message || 'Failed to load product details.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, initialType]);

  const images = React.useMemo(() => {
    if (!product) return [];
    return extractImageArray(product, product.type || initialType);
  }, [product, initialType]);

  // Distribute related products into 4 columns (3 products per column)
  const distributedRelatedProducts = useMemo(() => {
    const columns = [[], [], [], []];
    relatedProducts.forEach((product, index) => {
      columns[index % 4].push(product);
    });
    return columns;
  }, [relatedProducts]);

  useEffect(() => {
    if (selectedImage > 0 && selectedImage >= images.length) {
      setSelectedImage(0);
    }
  }, [images.length, selectedImage]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-[#00aeef] fill-current" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-[#00aeef] fill-current opacity-50" />);
    }
    
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FaStar key={i} className="text-gray-300" />);
    }
    
    return stars;
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

  const isPrinter = (product?.type || initialType) === 'printer';
  const isScanner = (product?.type || initialType) === 'scanner';
  const isLaptop = !isPrinter && !isScanner;

  const memoryOptions = useMemo(() => {
    if (!product || isPrinter || isScanner) return [];
    const value = sanitizeSpecValue(product.memory);
    if (value) return [value];
    return DEFAULT_MEMORY_OPTIONS;
  }, [product, isPrinter]);

  const displayOptions = useMemo(() => {
    if (!product || isPrinter || isScanner) return [];
    const value = sanitizeSpecValue(product.display);
    if (value) return [value];
    return DEFAULT_DISPLAY_OPTIONS;
  }, [product, isPrinter]);

  const storageOptions = useMemo(() => {
    if (!product || isPrinter || isScanner) return [];
    const value = sanitizeSpecValue(product.storage);
    if (value) return [value];
    return DEFAULT_STORAGE_OPTIONS;
  }, [product, isPrinter]);

  const effectiveMemory = selectedMemory || memoryOptions[0] || '';
  const effectiveDisplay = selectedSize || displayOptions[0] || '';
  const effectiveStorage = selectedStorage || storageOptions[0] || '';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${openSans.className}`}>
        <div className="text-gray-600">Loading product details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col ${openSans.className}`}>
        <Navbar />
        <div className="grow flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900">Product Unavailable</h1>
            <p className="text-gray-600">{error}</p>
            <Link
              href="/all-products"
              className="inline-flex items-center justify-center rounded-xs bg-[#00aeef] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0099d9] transition"
            >
              Back to Products
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PK').format(price);
  };

  const productTitle = product.name || 'Product';
  const productBrand = product.brand || 'Unknown';
  const productModel = product.model || `SKU-${product.id}`;
  const availability = 'In Stock';
  const rating = product.rating || 4.7;
  const reviews = product.reviews || 125;
  const categoryLabel =
    product.category ||
    (product.type === 'printer' ? 'Printers' : product.type === 'scanner' ? 'Scanners' : 'Laptops');

  const handleAddToCart = () => {
    if (!product) return;
    const cartId = product.cartId || (product.type ? `${product.type}-${product.id}` : product.id);
    const imageSrc =
      product.image ||
      (product.type === 'printer' || product.type === 'scanner' ? '/printer-category.png' : '/laptop-category.jpg');
    addToCart(
      {
        id: cartId,
        productId: product.id,
        type: product.type,
        category: product.category,
        name: product.name,
        price: product.price,
        image: imageSrc,
        brand: product.brand,
        model: product.model,
      },
      quantity,
    );
    setAddMessage('Product added to cart.');
    setTimeout(() => setAddMessage(''), 2500);
  };


  const productType = product.type || initialType;
  const specList = (
    productType === 'printer'
      ? [
          { label: 'Brand', value: product.brand },
          { label: 'Series', value: product.series },
          { label: 'Memory', value: product.memory },
          { label: 'Paper Input', value: product.paperinput },
          { label: 'Paper Output', value: product.paperoutput },
          { label: 'Paper Types', value: product.papertypes },
          { label: 'Dimensions', value: product.dimensions },
          { label: 'Weight', value: product.weight },
          { label: 'Power', value: product.power },
          { label: 'Duplex', value: product.duplex },
          { label: 'Resolution', value: product.resolution },
          { label: 'Copy Feature', value: product.copyfeature },
          { label: 'Scan Feature', value: product.scanfeature },
          { label: 'Wireless', value: product.wireless },
        ]
      : productType === 'scanner'
        ? [
            { label: 'Brand', value: product.brand },
            { label: 'Series', value: product.series },
            { label: 'Model', value: product.model },
            { label: 'Memory', value: product.memory },
            { label: 'Paper Types', value: product.paper_types },
            { label: 'Paper Size', value: product.paper_size },
            { label: 'Dimensions', value: product.dimensions },
            { label: 'Weight', value: product.weight },
            { label: 'Power', value: product.power },
            { label: 'Duplex', value: product.duplex },
            { label: 'Resolution', value: product.resolution },
            { label: 'Color Scan', value: product.color_scan },
            { label: 'Wireless', value: product.wireless },
          ]
        : [
            { label: 'Processor', value: product.processor },
            { label: 'Graphics', value: product.graphics },
            { label: 'Display', value: product.display },
            { label: 'Memory', value: product.memory },
            { label: 'Storage', value: product.storage },
            { label: 'Adapter', value: product.adapter },
            { label: 'Wi-Fi', value: product.wifi },
            { label: 'Bluetooth', value: product.bluetooth },
            { label: 'Camera', value: product.camera },
            { label: 'Ports', value: product.port },
            { label: 'Operating System', value: product.os },
            { label: 'Microphone', value: product.mic },
            { label: 'Battery', value: product.battery },
          ]
  ).filter((spec) => spec.value);

  return (
    <div className={`min-h-screen flex flex-col bg-white ${openSans.className}`}>
      {/* Navbar */}
      <Navbar />

      {/* Sticky Breadcrumb */}
      <div className={`sticky top-0 z-40 bg-gray-100 border-b border-gray-200 shadow-sm ${openSans.className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#00aeef] transition">
              Home
            </Link>
            <span className="text-gray-900">›</span>
            <Link href="/all-products" className="text-gray-600 hover:text-[#00aeef] transition">
              {categoryLabel}
            </Link>
            <span className="text-gray-900">›</span>
            <span className="text-blue-500">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div className="mb-4 relative bg-white border border-gray-300 rounded-sm overflow-hidden flex items-center justify-center h-[340px] sm:h-[400px] lg:h-[460px]">
              {renderProductImage(
                images[selectedImage] || product.image,
                product.name,
                'h-full w-auto max-h-full max-w-full object-contain',
                { width: 600, height: 500 },
                product.type === 'printer' || product.type === 'scanner' ? '/printer-category.png' : '/big-laptop.png',
              )}
            </div>

            {/* Thumbnail Carousel */}
            <div className="relative flex items-center gap-2">
              {/* Left Arrow */}
              <button
                onClick={scrollThumbnailsLeft}
                className="shrink-0 w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full flex items-center justify-center transition z-10"
                aria-label="Scroll thumbnails left"
              >
                <FaChevronLeft className="text-sm" />
              </button>

              {/* Thumbnail Container */}
              <div 
                ref={thumbnailScrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`shrink-0 border-2 rounded-sm overflow-hidden transition ${
                      selectedImage === index ? 'border-[#00aeef]' : 'border-gray-200'
                    }`}
                  >
                    {renderProductImage(
                      img,
                      `Thumbnail ${index + 1}`,
                      'w-20 h-20 object-contain',
                      { width: 80, height: 80 },
                      product.type === 'printer' || product.type === 'scanner' ? '/printer-category.png' : '/big-laptop.png',
                    )}
                  </button>
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={scrollThumbnailsRight}
                className="shrink-0 w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full flex items-center justify-center transition z-10"
                aria-label="Scroll thumbnails right"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4">
            {/* Rating and Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {renderStars(rating)}
                </div>
                <span className="text-sm text-black font-bold">{rating} Star Rating</span>
                <span className="text-sm text-gray-600">({formatPrice(reviews)} User feedback)</span>
              </div>
              <h1 className="text-xl text-gray-900 mb-4">
                {productTitle}
              </h1>
            </div>

            {/* SKU and Brand */}
            <div className='flex flex-col sm:flex-row justify-between gap-4'>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Sku: <span className="font-bold text-black">{productModel}</span></p>
                <p>Brand: <span className="font-bold text-black">{productBrand}</span></p>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-gray-600 font-medium">Availability: <span className="font-bold text-green-500">{availability}</span></p>
                <p className="text-gray-600">Category: <span className="font-bold text-black">{categoryLabel}</span></p>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-[#00aeef]">
                {product.price > 0 ? `PKR ${formatPrice(product.price)}` : 'Price on request'}
              </span>
            </div>

            {isLaptop && (
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
            )}

            {isLaptop && (
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
            )}

            {/* Quantity Selector */}
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-12 border border-gray-300 rounded-sm hover:bg-gray-100 flex items-center justify-center text-gray-700"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity.toString().padStart(2, '0')}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-12 text-center border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef] text-gray-900"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-12 border border-gray-300 rounded-sm hover:bg-gray-100 flex items-center justify-center text-gray-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 flex-wrap'>
              <button
                onClick={handleAddToCart}
                className="flex-1 min-w-[160px] bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-sm font-bold py-3 flex items-center justify-center gap-2 transition"
              >
                <FaShoppingCart />
                ADD TO CART
              </button>
              <button className="flex-1 min-w-[160px] bg-white border-2 border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white rounded-sm font-bold py-3 transition">
                BUY NOW
              </button>
              {addMessage && (
                <div className="basis-full text-sm font-medium text-green-600 mt-2">
                  {addMessage}
                </div>
              )}
            </div>

            {/* Add to Wishlist and Share Product */}
            <div className='flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200'>
              <button className='text-sm font-medium text-gray-700 hover:text-[#00aeef] transition flex items-center gap-2'>
                <CiHeart className="text-lg" />
                Add to Wishlist
              </button>
              <div className='flex items-center gap-2'>
                <p className="text-sm font-medium text-gray-700">Share product:</p>
                <div className="flex items-center gap-3">
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Copy link">
                    <FaCopy className="text-xl" />
                  </button>
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Share on Facebook">
                    <FaFacebook className="text-xl" />
                  </button>
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Share on Twitter">
                    <FaTwitter className="text-xl" />
                  </button>
                  <button className="text-gray-600 hover:text-[#00aeef] transition" title="Share on Pinterest">
                    <FaPinterest className="text-xl" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-12 max-w-7xl mx-auto px-4">
          {/* Wrapper with border */}
          <div className="border border-gray-200 rounded-sm bg-white">
            {/* Tabs */}
            <div className="flex justify-center border-b border-gray-200">
              <div className="flex flex-wrap">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'additional', label: 'Additional Information' },
                  { id: 'specs', label: 'Specification' },
                  { id: 'reviews', label: 'Review' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? 'text-gray-900 border-b-2 border-[#00aeef]'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'description' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 pr-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                    <div className="text-sm text-gray-600 space-y-3">
                      {product.description ? (
                        product.description.split('\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                      ) : (
                        <p>
                          Detailed description for this product will be available soon.
                          Please review the specifications for more information about
                          performance and features.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-3 px-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Feature</h3>
                    <div className="space-y-4 text-sm text-gray-700">
                      <div className="flex items-center gap-3">
                        <FaGift className="text-2xl text-[#00aeef]" />
                        <span>Free 1 Year Warranty</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaTruck className="text-2xl text-[#00aeef]" />
                        <span>Free Shipping &amp; Fast Delivery</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MdAttachMoney className="text-2xl text-[#00aeef]" />
                        <span>100% Money-back guarantee</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaHeadset className="text-2xl text-[#00aeef]" />
                        <span>24/7 Customer support</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CiCreditCard1 className="text-2xl text-[#00aeef]" />
                        <span>Secure payment method</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-3 border-l border-gray-200 pl-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Shipping Information
                    </h3>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>Courier: 2-4 days, free shipping</p>
                      <p>Local Shipping: up to one week</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'additional' && (
                <div className="space-y-4 text-sm text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-900">Brand</p>
                      <p>{productBrand}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Model</p>
                      <p>{productModel}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Availability</p>
                      <p>{availability}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Category</p>
                      <p>{categoryLabel}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-4 text-sm text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Specification
                  </h3>
                  {specList.length === 0 ? (
                    <p>Specifications will be available soon.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {specList.map((spec) => (
                        <div key={spec.label}>
                          <p className="font-bold text-gray-900">{spec.label}</p>
                          <p>{spec.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4 text-sm text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                  <p>Reviews will be available soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-16 max-w-7xl mx-auto px-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">RELATED PRODUCTS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {distributedRelatedProducts.map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-3">
                {column.map((relatedProduct) => {
                  const productType = (relatedProduct.type || 'laptop').toLowerCase();
                  const relatedProductId = relatedProduct.id ? encodeURIComponent(relatedProduct.id) : '';
                  const relatedProductHref = relatedProductId ? `/product/${relatedProductId}?type=${encodeURIComponent(productType)}` : '#';
                  return (
                    <Link 
                      key={relatedProduct.id} 
                      href={relatedProductHref}
                      className="flex gap-3 p-3 border border-gray-200 rounded-sm hover:shadow-md transition bg-white"
                    >
                      <Image 
                        src={relatedProduct.image || (productType === 'printer' ? '/printer-category.png' : '/laptop-category.jpg')} 
                        alt={relatedProduct.name} 
                        width={80} 
                        height={80} 
                        className="object-contain" 
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{relatedProduct.name}</p>
                        {relatedProduct.description && (
                          <p className="text-xs text-gray-600 mb-2">{relatedProduct.description}</p>
                        )}
                        <p className="text-sm font-bold text-[#00aeef]">
                          {relatedProduct.price > 0 ? `PKR ${formatPrice(relatedProduct.price)}` : 'Price on request'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
            {relatedProducts.length === 0 && (
              <p className="text-sm text-gray-500 col-span-full">No related products available.</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Hide scrollbar for webkit browsers */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ProductPage;
