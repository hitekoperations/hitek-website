'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

const ProductsPageClient = ({
  searchParams = {},
  restrictToType = null,
  pageTitle = 'All Products',
  showCategoryFilter = true,
} = {}) => {
  const PRICE_MIN = 0;
  const PRICE_MAX = 500000;
  const defaultCategory =
    restrictToType === 'laptop'
      ? 'Laptops'
      : restrictToType === 'printer'
        ? 'Printers'
        : null;
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

  const resolveBrandParam = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value[0] ? value[0].toString().trim() : '';
    }
    return value.toString().trim();
  };

  const brandParam = resolveBrandParam(searchParams?.brand);

  const [priceRange, setPriceRange] = useState({ min: PRICE_MIN, max: PRICE_MAX });
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [activeFilters, setActiveFilters] = useState(['Core i7']);
  const [sortBy, setSortBy] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState(brandParam ? [brandParam] : []);
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const { addToCart } = useCart();

  const FEATURED_BANNER_PRODUCT_ID = '12';
  const brandFromUrlRef = useRef(Boolean(brandParam));

  useEffect(() => {
    const targetCategory = restrictToType === 'printer' ? 'Printers' : restrictToType === 'laptop' ? 'Laptops' : null;
    if (targetCategory && selectedCategory !== targetCategory) {
      setSelectedCategory(targetCategory);
    }
  }, [restrictToType, selectedCategory]);

  useEffect(() => {
    const normalizedBrand = resolveBrandParam(searchParams?.brand);

    if (normalizedBrand) {
      const targetCategory = restrictToType === 'printer' ? 'Printers' : 'Laptops';
      brandFromUrlRef.current = true;
      setSelectedBrands([normalizedBrand]);
      setSelectedCategory((prev) => (prev === targetCategory ? prev : targetCategory));
      setSortBy((prev) => (prev ? prev : 'Price: Low to High'));
      setSelectedPriceRange((prev) => (prev === 'all' ? prev : 'all'));
      setCurrentPage(1);
    } else if (brandFromUrlRef.current) {
      brandFromUrlRef.current = false;
      setSelectedBrands([]);
    }
  }, [searchParams, restrictToType]);

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
        const url = new URL('https://hitek-server.onrender.com/api/products');
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
            const inferredType =
              item?.type ||
              (typeof item?.category === 'string' && item.category.toLowerCase().includes('printer')
                ? 'printer'
                : 'laptop');
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
    const minPrice = clampPrice(priceRange?.min ?? PRICE_MIN);
    const maxPriceCandidate = clampPrice(priceRange?.max ?? PRICE_MAX);
    const maxPrice = Math.max(minPrice, maxPriceCandidate);

    return products.filter((product) => {
      const matchesCategory =
        isAllCategory ||
        (limitToLaptops && product.category === 'Laptops') ||
        (limitToPrinters && product.category === 'Printers') ||
        !isRecognizedCategory;

      if (!matchesCategory) {
        return false;
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
  }, [products, selectedCategory, selectedPriceRange, priceRange, normalizedBrandSelections, restrictToType]);

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

  // ... rest of component unchanged

  return (
    // existing JSX...
  );
};

export default ProductsPageClient;

