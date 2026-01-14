'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { CiSearch } from 'react-icons/ci';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiHeart, CiShoppingCart } from 'react-icons/ci';
import { FaRegEye } from 'react-icons/fa6';
import { FiArrowRight } from 'react-icons/fi';
import { openSans } from '../Cx/Font/font';
import ProductModal from '../Cx/Components/ProductModal';
import { useCart } from '../Cx/Providers/CartProvider';
import { useImagePreloader } from '../Cx/hooks/useImagePreloader';

export const ProductsPage = ({ searchParams: initialSearchParams = {}, restrictToType = null, pageTitle = 'All Products', showCategoryFilter = true } = {}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const PRICE_MIN = 0;
  const PRICE_MAX = 500000;
  const defaultCategory =
    restrictToType === 'laptop'
      ? 'Laptops'
      : restrictToType === 'printer'
        ? 'Printers'
        : restrictToType === 'scanner'
          ? 'Scanners'
          : null;
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

  const [priceRange, setPriceRange] = useState({ min: PRICE_MIN, max: PRICE_MAX });
  const resolveBrandParam = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value[0] ? value[0].toString().trim() : '';
    }
    return value.toString().trim();
  };

  const brandFromUrl = searchParams?.get('brand') || '';
  const brandFromProps = resolveBrandParam(initialSearchParams?.brand);
  const brandParam = brandFromUrl || brandFromProps;
  
  const searchFromUrl = searchParams?.get('search') || '';
  const searchFromProps = initialSearchParams?.search || '';
  const searchParam = searchFromUrl || searchFromProps;
  
  const categoryFromUrl = searchParams?.get('category') || '';
  const categoryFromProps = initialSearchParams?.category || '';
  const categoryParam = categoryFromUrl || categoryFromProps;

  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [activeFilters, setActiveFilters] = useState(['Core i7']);
  const [sortBy, setSortBy] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState(brandParam ? [brandParam] : []);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const ITEMS_PER_PAGE = 30;

  const brandFromUrlRef = useRef(Boolean(brandParam));

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { addToCart } = useCart();

  const FEATURED_BANNER_PRODUCT_ID = '12';

  useEffect(() => {
    if (brandParam) {
      let targetCategory;
      if (restrictToType === 'printer') {
        targetCategory = 'Printers';
      } else if (restrictToType === 'scanner') {
        targetCategory = 'Scanners';
      } else {
        targetCategory = 'Laptops';
      }
      brandFromUrlRef.current = true;
      setSelectedBrands([brandParam]);
      setSelectedCategory((prev) => (prev === targetCategory ? prev : targetCategory));
      setSortBy((prev) => (prev ? prev : 'Price: Low to High'));
      setSelectedPriceRange((prev) => (prev === 'all' ? prev : 'all'));
      setCurrentPage(1);
    } else if (brandFromUrlRef.current) {
      brandFromUrlRef.current = false;
      setSelectedBrands([]);
    }
  }, [brandParam, restrictToType]);

  useEffect(() => {
    if (searchParam) {
      setSearchTerm(searchParam);
      setCurrentPage(1);
    }
  }, [searchParam]);

  useEffect(() => {
    if (categoryParam) {
      const normalizedCategory = categoryParam.toLowerCase().trim();
      if (normalizedCategory === 'laptop' || normalizedCategory === 'laptops') {
        setSelectedCategory('Laptops');
      } else if (normalizedCategory === 'printer' || normalizedCategory === 'printers') {
        setSelectedCategory('Printers');
      } else if (normalizedCategory === 'scanner' || normalizedCategory === 'scanners') {
        setSelectedCategory('Scanners');
      }
    }
  }, [categoryParam]);

  const clampPrice = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return PRICE_MIN;
    return Math.min(Math.max(numeric, PRICE_MIN), PRICE_MAX);
  };

  const parsePriceRangeOption = (value) => {
    if (!value) return null;
    const normalized = value.toString().trim().toLowerCase();
    if (normalized === 'all' || normalized === 'custom') {
      return null;
    }
    const parts = normalized.split('-');
    if (parts.length !== 2) return null;
    const min = clampPrice(Number(parts[0]));
    const max = clampPrice(Number(parts[1]));
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return {
      min: Math.min(min, max),
      max: Math.max(min, max),
    };
  };

  const setCustomPriceRange = (changes) => {
    setSelectedPriceRange('custom');
    setPriceRange((prev) => {
      const draft = {
        min: clampPrice(changes.min !== undefined ? changes.min : prev.min),
        max: clampPrice(changes.max !== undefined ? changes.max : prev.max),
      };

      if (draft.min > draft.max) {
        if (changes.min !== undefined && changes.max === undefined) {
          draft.max = draft.min;
        } else if (changes.max !== undefined && changes.min === undefined) {
          draft.min = draft.max;
        } else {
          const baseline = clampPrice(Math.min(draft.min, draft.max));
          draft.min = baseline;
          draft.max = baseline;
        }
      }

      return draft;
    });
    setCurrentPage(1);
  };

  const parseNumeric = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const num = Number(cleaned);
    return Number.isNaN(num) ? fallback : num;
  };

  const extractImageArray = (item) => {
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
    return [];
  };

  const normalizeProduct = (item, type) => {
    if (!item) return null;
    const placeholder = type === 'printer' ? '/printer-category.png' : '/laptop-category.jpg';
    const rawImages = extractImageArray(item);
    const primaryImage = rawImages[0] || item.image || placeholder;
    const imageArray = rawImages.length ? rawImages : [primaryImage];
    const hasId = item.id !== null && item.id !== undefined;
    const rawId = hasId ? item.id.toString() : '';
    const computedName = (item.name ||
      [item.brand, item.series, item.model].filter(Boolean).join(' ').trim() ||
      (type === 'printer' ? 'Printer' : 'Laptop')).trim();
    const rawDescription =
      typeof item.description === 'string' ? item.description.trim() : '';
    const computedDescription =
      rawDescription ||
      (type === 'printer'
        ? [item.resolution, item.copyfeature, item.scanfeature, item.duplex]
            .filter(Boolean)
            .join(' • ')
        : item.processor || item.graphics || '') ||
      computedName;
    const parsedPrice = parseNumeric(item.price);
    const hasPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;

    return {
      ...item,
      id: rawId,
      sourceId: item.id,
      type,
      category: type === 'printer' ? 'Printers' : type === 'scanner' ? 'Scanners' : 'Laptops',
      brand: typeof item.brand === 'string' ? item.brand.trim() : '',
      cartId: hasId ? `${type}-${rawId}` : undefined,
      price: hasPrice ? parsedPrice : 0,
      hasPrice,
      rating: parseNumeric(item.rating, 4.5),
      reviews: parseNumeric(item.reviews, 0),
      name: computedName,
      description: computedDescription,
      image: primaryImage,
      imageUrls: imageArray,
      image_urls: imageArray,
      images: imageArray,
      featured: ['true', 't', '1', true, 1].includes(item?.featured),
    };
  };

  const resolveSortParam = (value) => {
    if (!value) return '';
    const normalized = value.toString().trim().toLowerCase();
    if (
      normalized === 'price: low to high' ||
      normalized === 'price low to high' ||
      normalized === 'price - low to high' ||
      normalized === 'price_low_to_high'
    ) {
      return 'price_asc';
    }
    if (
      normalized === 'price: high to low' ||
      normalized === 'price high to low' ||
      normalized === 'price - high to low' ||
      normalized === 'price_high_to_low'
    ) {
      return 'price_desc';
    }
    return '';
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      setFetchError('');

      try {
        const sortParam = resolveSortParam(sortBy);
        const url = new URL('https://hitek-server-uu0f.onrender.com/api/products');
        if (sortParam) {
          url.searchParams.set('sort', sortParam);
        }
        if (restrictToType) {
          url.searchParams.set('category', restrictToType);
        }
        if (brandParam) {
          url.searchParams.set('brand', brandParam);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        const payload = await response.json();
        if (!isMounted) return;

        const normalized = (Array.isArray(payload) ? payload : [])
          .map((item) => {
            let inferredType = item?.type;
            if (!inferredType && typeof item?.category === 'string') {
              const categoryLower = item.category.toLowerCase();
              if (categoryLower.includes('printer')) {
                inferredType = 'printer';
              } else if (categoryLower.includes('scanner')) {
                inferredType = 'scanner';
              } else {
                inferredType = 'laptop';
              }
            }
            return normalizeProduct(item, inferredType || 'laptop');
          })
          .filter(Boolean);

        setProducts(normalized);
        setCurrentPage(1);
        setFetchError('');
      } catch (error) {
        if (!isMounted) return;
        console.error('products fetch error:', error);
        setProducts([]);
        setCurrentPage(1);
        setFetchError(error.message || 'Failed to load products. Please try again.');
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [sortBy, restrictToType, brandParam]);

  useEffect(() => {
    if (restrictToType === 'laptop') {
      setSelectedCategory('Laptops');
    } else if (restrictToType === 'printer') {
      setSelectedCategory('Printers');
    }
  }, [restrictToType]);

  useEffect(() => {
    if (!selectedPriceRange || selectedPriceRange === 'custom') {
      return;
    }

    if (selectedPriceRange === 'all') {
      setPriceRange((prev) => {
        if (prev.min === PRICE_MIN && prev.max === PRICE_MAX) {
          return prev;
        }
        return { min: PRICE_MIN, max: PRICE_MAX };
      });
      setCurrentPage(1);
      return;
    }

    const parsed = parsePriceRangeOption(selectedPriceRange);
    if (parsed) {
      setPriceRange((prev) => {
        if (prev.min === parsed.min && prev.max === parsed.max) {
          return prev;
        }
        return parsed;
      });
      setCurrentPage(1);
    }
  }, [selectedPriceRange]);

  useEffect(() => {
    setActiveFilters((prev) => {
      const categoryFilters = ['Laptops', 'Printers'];
      const withoutCategories = prev.filter((filter) => !categoryFilters.includes(filter));
      if (!selectedCategory) return withoutCategories;
      return [selectedCategory, ...withoutCategories];
    });
  }, [selectedCategory]);

  const normalizedBrandSelections = useMemo(
    () => selectedBrands.map((brand) => brand.trim().toLowerCase()),
    [selectedBrands],
  );

  const filteredProducts = useMemo(() => {
    if (!products.length) return [];

    const effectiveCategory =
      restrictToType === 'laptop'
        ? 'Laptops'
        : restrictToType === 'printer'
          ? 'Printers'
          : selectedCategory;

    const isAllCategory =
      !effectiveCategory ||
      effectiveCategory === 'All Products' ||
      effectiveCategory === 'All Laptops';
    const limitToLaptops =
      effectiveCategory === 'Laptops' || effectiveCategory === 'All Laptops';
    const limitToPrinters = effectiveCategory === 'Printers';
    const isRecognizedCategory = isAllCategory || limitToLaptops || limitToPrinters;

    const applyPriceFilter = Boolean(selectedPriceRange) && selectedPriceRange !== 'all';
    const applyBrandFilter = normalizedBrandSelections.length > 0;
    const applySearchFilter = Boolean(searchTerm && searchTerm.trim());
    const minPrice = clampPrice(priceRange?.min ?? PRICE_MIN);
    const maxPriceCandidate = clampPrice(priceRange?.max ?? PRICE_MAX);
    const maxPrice = Math.max(minPrice, maxPriceCandidate);

    const normalizedSearchTerm = applySearchFilter ? searchTerm.trim().toLowerCase() : '';

    return products.filter((product) => {
      const matchesCategory =
        isAllCategory ||
        (limitToLaptops && product.category === 'Laptops') ||
        (limitToPrinters && product.category === 'Printers') ||
        !isRecognizedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (applySearchFilter) {
        const searchableFields = [
          product.name || '',
          product.brand || '',
          product.model || '',
          product.series || '',
          product.description || '',
          product.sku || '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableFields.includes(normalizedSearchTerm)) {
          return false;
        }
      }

      if (applyBrandFilter) {
        const productBrand = typeof product.brand === 'string' ? product.brand.trim().toLowerCase() : '';
        if (!productBrand || !normalizedBrandSelections.includes(productBrand)) {
          return false;
        }
      }

      if (!applyPriceFilter) {
        return true;
      }

      const numericPrice = Number(product.price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return false;
      }

      return numericPrice >= minPrice && numericPrice <= maxPrice;
    });
  }, [products, selectedCategory, selectedPriceRange, priceRange, normalizedBrandSelections, searchTerm]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  }, [filteredProducts.length]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const featuredBannerProduct = useMemo(() => {
    if (!Array.isArray(products) || !products.length) return null;
    return (
      products.find((product) => {
        const source = product?.sourceId ?? product?.id;
        if (source === null || source === undefined) return false;
        return source.toString() === FEATURED_BANNER_PRODUCT_ID;
      }) || null
    );
  }, [products]);

  const handleBannerAddToCart = useCallback(() => {
    if (!featuredBannerProduct) return;
    addToCart({
      id: featuredBannerProduct.cartId || featuredBannerProduct.id,
      name: featuredBannerProduct.name,
      price: featuredBannerProduct.price,
      image: featuredBannerProduct.image,
      type: featuredBannerProduct.type,
    });
  }, [addToCart, featuredBannerProduct]);

  const formatCurrency = (value) =>
    (Number(value) || 0).toLocaleString('en-PK');

  const formatNumber = (value) =>
    (Number(value) || 0).toLocaleString('en-US');

  const categories = useMemo(() => {
    if (!showCategoryFilter) {
      return [];
    }
    if (restrictToType === 'laptop') {
      return ['Laptops'];
    }
    if (restrictToType === 'printer') {
      return ['Printers'];
    }
    return [
      'All Products',
      'Laptops',
      'Desktop PCs',
      'Printers',
      'Scanners',
      'LED Monitors',
      'Printer Toners',
      'Printer Cartridges',
      'Refurbished Laptops',
      'Refurbished Desktop PCs',
      'Computer Accessories',
    ];
  }, [restrictToType, showCategoryFilter]);

  const priceRanges = [
    { label: 'All Price', value: 'all' },
    { label: 'Under PKR 50,000', value: '0-50000' },
    { label: 'PKR 50,000 to PKR 100,000', value: '50000-100000' },
    { label: 'PKR 100,000 to PKR 150,000', value: '100000-150000' },
    { label: 'PKR 150,000 to PKR 200,000', value: '150000-200000' },
    { label: 'PKR 200,000 to PKR 300,000', value: '200000-300000' },
    { label: 'PKR 300,000 to PKR 400,000', value: '300000-400000' }
  ];

  const brands = ['HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Samsung', 'Apple', 'Microsoft'];

  const popularTags = [
    'Game', 'Laptop', 'Intel', 'Asus Laptops', 'Macbook', 'SSD', 
    'Graphics Card', 'Processor', 'Slim', 'Ryzen', 'AMD', 'Microsoft', 'Samsung'
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="text-gray-300">☆</span>);
    }
    return stars;
  };

  const removeFilter = (filter) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const handleBrandToggle = useCallback((brand) => {
    brandFromUrlRef.current = false;
    const trimmed = brand.trim();
    setSelectedBrands((prev) => {
      const exists = prev.includes(trimmed);
      if (exists) {
        return prev.filter((item) => item !== trimmed);
      }
      return [...prev, trimmed];
    });
    setCurrentPage(1);
  }, []);

  const renderProductImage = (src, alt, className, size = { width: 160, height: 160 }) => {
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

  const ProductCard = ({ product, onPreview, onAddToCart }) => {
    const productType = (product.type || 'laptop').toLowerCase();
    const productId = product.id ? encodeURIComponent(product.id) : '';
    const productHref = productId ? `/product/${productId}?type=${encodeURIComponent(productType)}` : '#';
    const productDescription = product.description || 'Specifications coming soon.';
    const hasPrice = product.hasPrice || (Number.isFinite(product.price) && product.price > 0);
    const images = Array.isArray(product.imageUrls) && product.imageUrls.length
      ? product.imageUrls
      : [product.image || (productType === 'printer' ? '/printer-category.png' : '/laptop-category.jpg')];
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
        href={productHref}
        className="relative bg-white border border-gray-300 rounded-sm overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer flex flex-col"
      >
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
          {renderProductImage(
            images[activeImage],
            `${product.name} preview ${activeImage + 1}`,
            'object-contain transition-opacity duration-200 max-h-full max-w-full',
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
            <span className="text-gray-600 text-xs ml-1">({formatNumber(product.reviews)})</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">{productDescription}</p>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-base font-bold text-blue-500">
              {hasPrice ? `Rs. ${formatCurrency(product.price)}` : 'Price on request'}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${openSans.className}`}>
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 bg-white">
        {/* Breadcrumbs */}
        <div className="bg-gray-100 border-b border-gray-200 py-4 md:py-5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center px-2 md:px-4 gap-2 text-xs md:text-sm text-gray-600">
              <Link href="/" className="hover:text-[#00aeef] transition">Home</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{pageTitle}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Filters */}
            <div className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-4 h-fit">
              {/* Category */}
              {showCategoryFilter && categories.length > 0 && (
                <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">CATEGORY</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef]"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">PRICE RANGE</h3>
                <div className="space-y-4">
                  {/* Price Range Slider */}
                  <div className="px-2">
                    <div className="relative h-8">
                      <div className="absolute w-full h-2 bg-gray-200 rounded-sm top-3"></div>
                      <div
                        className="absolute h-2 bg-[#00aeef] rounded-sm top-3"
                        style={{
                          left: `${(priceRange.min / PRICE_MAX) * 100}%`,
                          width: `${((priceRange.max - priceRange.min) / PRICE_MAX) * 100}%`
                        }}
                      ></div>
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step="10000"
                        value={priceRange.min}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (Number.isFinite(val)) {
                            setCustomPriceRange({ min: val });
                          }
                        }}
                        className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-20"
                      />
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step="10000"
                        value={priceRange.max}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (Number.isFinite(val)) {
                            setCustomPriceRange({ max: val });
                          }
                        }}
                        className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-30"
                      />
                      <div 
                        className="absolute top-2 w-4 h-4 bg-[#00aeef] rounded-full border-2 border-white shadow pointer-events-none"
                        style={{ left: `calc(${(priceRange.min / PRICE_MAX) * 100}% - 8px)` }}
                      ></div>
                      <div 
                        className="absolute top-2 w-4 h-4 bg-[#00aeef] rounded-full border-2 border-white shadow pointer-events-none"
                        style={{ left: `calc(${(priceRange.max / PRICE_MAX) * 100}% - 8px)` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                      <span>PKR {(priceRange.min / 1000).toFixed(0)}K</span>
                      <span>PKR {(priceRange.max / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCustomPriceRange({ min: Number.isFinite(val) ? val : PRICE_MIN });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Min price"
                    />
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCustomPriceRange({ max: Number.isFinite(val) ? val : PRICE_MAX });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Max price"
                    />
                  </div>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          value={range.value}
                          checked={selectedPriceRange === range.value}
                          onChange={(e) => setSelectedPriceRange(e.target.value)}
                          className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef]"
                        />
                        <span className="text-sm text-gray-700">{range.label}</span>
                      </label>
                    ))}
                    
                  </div>
                </div>
              </div>

              {/* Popular Brands */}
              <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">POPULAR BRANDS</h3>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                          checked={selectedBrands.includes(brand.trim())}
                          onChange={() => handleBrandToggle(brand)}
                          className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef] rounded"
                      />
                      <span className="text-sm text-gray-700">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Featured Laptop Banner */}
              <div className="bg-white rounded-sm p-4 mb-14 border border-gray-300 shadow-lg">
                {featuredBannerProduct ? (
                  <>
                    <div className="mb-3 flex items-center justify-center">
                      {renderProductImage(
                        featuredBannerProduct.image,
                        featuredBannerProduct.name,
                        'w-full h-auto object-contain max-h-48',
                        { width: 220, height: 180 },
                      )}
                    </div>
                    <div className="text-center mb-3">
                      <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">
                        Featured Pick
                      </p>
                      <p className="text-lg font-bold text-black mb-1 line-clamp-2">
                        {featuredBannerProduct.name}
                      </p>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {featuredBannerProduct.description}
                      </p>
                      <div className="bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 inline-block mb-3 rounded">
                        ONLY FOR: PKR {formatCurrency(featuredBannerProduct.price)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={handleBannerAddToCart}
                        className="w-full bg-[#00aeef] hover:bg-[#0099d9] text-white px-4 py-2 rounded-sm font-semibold transition flex items-center justify-center gap-2"
                      >
                        <CiShoppingCart className="text-lg" />
                        Add to Cart
                      </button>
                      <Link
                        href={
                          featuredBannerProduct.id
                            ? `/product/${encodeURIComponent(featuredBannerProduct.id)}?type=${encodeURIComponent(featuredBannerProduct.type || 'laptop')}`
                            : '/all-products'
                        }
                        className="w-full border-2 border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white px-4 py-2 rounded-sm font-semibold transition flex items-center justify-center gap-2"
                      >
                        View Details
                        <FiArrowRight />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
                      Featured Pick
                    </p>
                    <p className="text-lg font-semibold text-gray-700">
                      Loading featured product...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Main Content */}
            <div className="flex-1 flex flex-col w-full">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden mb-4 w-full bg-[#00aeef] text-white px-4 py-3 rounded-sm font-semibold flex items-center justify-center gap-2"
              >
                <span>Filters</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {/* Mobile Filter Modal */}
              {mobileFiltersOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileFiltersOpen(false)}>
                  <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                      <button
                        onClick={() => setMobileFiltersOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FaTimes className="text-xl" />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Category */}
                      {showCategoryFilter && categories.length > 0 && (
                        <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                          <h3 className="text-sm font-bold text-gray-900 mb-3">CATEGORY</h3>
                          <div className="space-y-2">
                            {categories.map((category) => (
                              <label key={category} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="category-mobile"
                                  value={category}
                                  checked={selectedCategory === category}
                                  onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setMobileFiltersOpen(false);
                                  }}
                                  className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef]"
                                />
                                <span className="text-sm text-gray-700">{category}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Range */}
                      <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">PRICE RANGE</h3>
                        <div className="space-y-4">
                          <div className="px-2">
                            <div className="relative h-8">
                              <div className="absolute w-full h-2 bg-gray-200 rounded-sm top-3"></div>
                              <div
                                className="absolute h-2 bg-[#00aeef] rounded-sm top-3"
                                style={{
                                  left: `${(priceRange.min / PRICE_MAX) * 100}%`,
                                  width: `${((priceRange.max - priceRange.min) / PRICE_MAX) * 100}%`
                                }}
                              ></div>
                              <input
                                type="range"
                                min={PRICE_MIN}
                                max={PRICE_MAX}
                                step="10000"
                                value={priceRange.min}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (Number.isFinite(val)) {
                                    setCustomPriceRange({ min: val });
                                  }
                                }}
                                className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-20"
                              />
                              <input
                                type="range"
                                min={PRICE_MIN}
                                max={PRICE_MAX}
                                step="10000"
                                value={priceRange.max}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (Number.isFinite(val)) {
                                    setCustomPriceRange({ max: val });
                                  }
                                }}
                                className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-30"
                              />
                              <div 
                                className="absolute top-2 w-4 h-4 bg-[#00aeef] rounded-full border-2 border-white shadow pointer-events-none"
                                style={{ left: `calc(${(priceRange.min / PRICE_MAX) * 100}% - 8px)` }}
                              ></div>
                              <div 
                                className="absolute top-2 w-4 h-4 bg-[#00aeef] rounded-full border-2 border-white shadow pointer-events-none"
                                style={{ left: `calc(${(priceRange.max / PRICE_MAX) * 100}% - 8px)` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                              <span>PKR {(priceRange.min / 1000).toFixed(0)}K</span>
                              <span>PKR {(priceRange.max / 1000).toFixed(0)}K</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={priceRange.min}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCustomPriceRange({ min: Number.isFinite(val) ? val : PRICE_MIN });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="Min price"
                            />
                            <input
                              type="number"
                              value={priceRange.max}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCustomPriceRange({ max: Number.isFinite(val) ? val : PRICE_MAX });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="Max price"
                            />
                          </div>
                          <div className="space-y-2">
                            {priceRanges.map((range) => (
                              <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="priceRange-mobile"
                                  value={range.value}
                                  checked={selectedPriceRange === range.value}
                                  onChange={(e) => {
                                    setSelectedPriceRange(e.target.value);
                                    setMobileFiltersOpen(false);
                                  }}
                                  className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef]"
                                />
                                <span className="text-sm text-gray-700">{range.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Popular Brands */}
                      <div className="bg-white rounded-sm border border-gray-200 shadow-lg p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">POPULAR BRANDS</h3>
                        <div className="space-y-2">
                          {brands.map((brand) => (
                            <label key={brand} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand.trim())}
                                onChange={() => handleBrandToggle(brand)}
                                className="w-4 h-4 text-[#00aeef] focus:ring-[#00aeef] rounded"
                              />
                              <span className="text-sm text-gray-700">{brand}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filters Bar */}
              <div className="bg-white rounded-sm p-4 mb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full md:max-w-md">
                    <div className="flex rounded overflow-hidden border border-gray-300">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for anything..."
                        className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 bg-white focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const params = new URLSearchParams(window.location.search);
                            if (searchTerm.trim()) {
                              params.set('search', searchTerm.trim());
                            } else {
                              params.delete('search');
                            }
                            router.push(`/all-products?${params.toString()}`);
                          }
                        }}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            const params = new URLSearchParams(window.location.search);
                            params.delete('search');
                            router.push(`/all-products?${params.toString()}`);
                          }}
                          className="bg-white text-gray-700 px-3 hover:bg-gray-100 transition"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams(window.location.search);
                          if (searchTerm.trim()) {
                            params.set('search', searchTerm.trim());
                          } else {
                            params.delete('search');
                          }
                          router.push(`/all-products?${params.toString()}`);
                        }}
                        className="bg-white text-gray-700 px-4 hover:bg-gray-100 transition"
                      >
                        <CiSearch className="text-xl" />
                      </button>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-sm text-gray-700 whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 md:flex-none px-3 md:px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                    >
                      <option value="">Select sorting option</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                    </select>
                    
                  </div>
                </div>

                {/* Active Filters
                {activeFilters.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-700 font-medium">Active Filters:</span>
                    {activeFilters.map((filter) => (
                      <span
                        key={filter}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {filter}
                        <button
                          onClick={() => removeFilter(filter)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                )} */}

                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-600">
                  {loadingProducts
                    ? 'Loading results...'
                    : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'result' : 'results'} found.`}
                </div>
              </div>

            

              {/* Product Grid */}
              <div className="pl-0 md:pl-4 mb-6">
                {loadingProducts ? (
                  <div className="py-12 text-sm text-gray-600 text-center">Loading products...</div>
                ) : fetchError ? (
                  <div className="py-12 text-sm text-red-600 text-center">{fetchError}</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-sm text-gray-600 text-center">No products available yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.cartId || `${product.type}-${product.id}`}
                        product={product}
                        onPreview={(item) => {
                          setPreviewProduct(item);
                          setPreviewOpen(true);
                        }}
                        onAddToCart={(item) => {
                          if (!item) return;
                          addToCart({
                            id: item.cartId || item.id,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            type: item.type,
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 md:gap-2 mt-auto pt-6 md:pt-8 overflow-x-auto pb-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 md:px-3 py-2 md:py-3 rounded-full border-blue-400 border-2 text-blue-400 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <FaChevronLeft className="text-xs md:text-sm" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition text-xs md:text-base shrink-0 ${
                        currentPage === page
                          ? 'bg-[#00aeef] text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {String(page).padStart(2, '0')}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 md:px-3 py-2 md:py-3 border-2 border-blue-400 text-blue-400 rounded-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <FaChevronRight className="text-xs md:text-sm" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ProductModal
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewProduct(null);
        }}
        product={previewProduct}
      />
    </div>
  );
}

export default async function AllProductsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const normalized =
    resolvedParams && typeof resolvedParams.entries === 'function'
      ? Object.fromEntries(resolvedParams.entries())
      : Object.fromEntries(
          Object.entries(resolvedParams ?? {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value,
          ]),
        );

  return <ProductsPage searchParams={normalized} />;
}
