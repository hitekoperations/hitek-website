'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';
import { 
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaLinkedin,
  FaYoutube,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa';
import { 
  CiShoppingCart,
  CiHeart,
  CiUser,
  CiHome,
  CiLaptop,
  CiMonitor,
  CiPhone,
  CiSearch,
  CiMenuBurger,
  CiMenuFries,
  CiBoxes
} from 'react-icons/ci';

import { PiDesktopTowerThin } from "react-icons/pi";
import { IoPrintOutline } from "react-icons/io5";
import { PiRecycleLight } from "react-icons/pi";
import { GrRotateRight } from "react-icons/gr";
import { openSans } from '../Font/font';
import ShoppingCartPopup from '../Components/ShoppingCartPopup';
import LoginPopup from '../Components/LoginPopup';
import { useCart } from '../Providers/CartProvider';


const Navbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isAllProductsHovered, setIsAllProductsHovered] = useState(false);
  const [isLaptopsHovered, setIsLaptopsHovered] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPrinterBrand, setSelectedPrinterBrand] = useState('All');
  const [featuredLaptops, setFeaturedLaptops] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState('');
  const [featuredPrinters, setFeaturedPrinters] = useState([]);
  const [printersLoading, setPrintersLoading] = useState(false);
  const [printersError, setPrintersError] = useState('');
  const [featuredBannerProduct, setFeaturedBannerProduct] = useState(null);
  const { cartCount } = useCart();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const parseNumeric = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  const extractPrimaryImage = (item) => {
    if (!item) return '/big-laptop.png';
    const candidates = [
      item.imageUrls,
      item.image_urls,
      item.images,
      item.imageurls,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length) {
        const found = candidate.find((url) => typeof url === 'string' && url.trim() !== '');
        if (found) return found;
      }
    }
    if (typeof item.image === 'string' && item.image.trim()) {
      return item.image.trim();
    }
    return '/big-laptop.png';
  };

  const formatPrice = (value) => {
    const numeric = parseNumeric(value, 0);
    return `PKR ${numeric.toLocaleString('en-PK')}`;
  };

  const normalizeProduct = (item) => {
    if (!item) return null;
    const inferredType = item?.type || (typeof item?.category === 'string' && item.category.toLowerCase().includes('printer') ? 'printer' : 'laptop');
    return {
      id: item.id || item.sourceId || null,
      name: item.name || 'Unnamed Product',
      brand: item.brand || '',
      model: item.model || '',
      price: item.price || 0,
      image: extractPrimaryImage(item),
      type: inferredType,
      category: item.category || (inferredType === 'printer' ? 'Printers' : 'Laptops'),
    };
  };

  const performSearch = async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = new URL('https://hitek-server.onrender.com/api/products');
      // Map category names to API category values
      if (selectedCategory === 'Laptops' || selectedCategory === 'Refurbished Laptops') {
        url.searchParams.set('category', 'laptop');
      } else if (selectedCategory === 'Printers' || selectedCategory === 'Toners' || selectedCategory === 'Cartridges') {
        url.searchParams.set('category', 'printer');
      }
      // Note: LED Monitors, Desktop PCs, Scanners, etc. don't have specific API filters yet
      // They will search all products

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      const products = Array.isArray(data) ? data : [];
      
      const normalizedQuery = query.trim().toLowerCase();
      
      // Filter by category first
      let categoryFiltered = products.map(normalizeProduct).filter(Boolean);
      
      if (selectedCategory !== 'All Categories') {
        // Map category selection to product types/categories
        if (selectedCategory === 'Laptops' || selectedCategory === 'Refurbished Laptops') {
          categoryFiltered = categoryFiltered.filter((product) => 
            product.type === 'laptop' || product.category === 'Laptops'
          );
        } else if (selectedCategory === 'Printers' || selectedCategory === 'Toners' || selectedCategory === 'Cartridges') {
          categoryFiltered = categoryFiltered.filter((product) => 
            product.type === 'printer' || product.category === 'Printers'
          );
        } else {
          // For categories without products (Desktop PCs, LED Monitors, etc.), return empty
          // This prevents showing laptops/printers when searching in categories that don't exist
          categoryFiltered = [];
        }
      }
      
      // Then filter by search query
      const filtered = categoryFiltered
        .filter((product) => {
          const searchableText = [
            product.name,
            product.brand,
            product.model,
            product.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return searchableText.includes(normalizedQuery);
        })
        .slice(0, 8); // Limit to 8 results

      setSearchResults(filtered);
      setIsSearchDropdownOpen(true); // Always show dropdown when there are results or when searching
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setIsSearchDropdownOpen(true); // Still show dropdown to display "No products found"
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search is cleared, close dropdown
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    // Show dropdown immediately when typing (will show loading state)
    setIsSearching(true);
    setIsSearchDropdownOpen(true);

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    // Don't redirect on Enter - just show dropdown if there are results
    if (searchTerm.trim() && searchResults.length > 0) {
      setIsSearchDropdownOpen(true);
    } else if (searchTerm.trim()) {
      // If no results but there's a search term, perform search
      performSearch(searchTerm);
    }
  };

  const handleViewAllResults = () => {
    if (!searchTerm.trim()) return;
    
    const params = new URLSearchParams();
    params.set('search', searchTerm.trim());
    
    if (selectedCategory !== 'All Categories') {
      // Map category names to API category values
      if (selectedCategory === 'Laptops' || selectedCategory === 'Refurbished Laptops') {
        params.set('category', 'laptop');
      } else if (selectedCategory === 'Printers' || selectedCategory === 'Toners' || selectedCategory === 'Cartridges') {
        params.set('category', 'printer');
      }
      // Note: Other categories will search all products
    }
    
    router.push(`/all-products?${params.toString()}`);
    setIsCategoryDropdownOpen(false);
    setIsSearchDropdownOpen(false);
  };

  const handleResultClick = (product) => {
    setIsSearchDropdownOpen(false);
    setSearchTerm('');
    router.push(`/product/${product.id}?type=${product.type}`);
  };

  const categories = [
    'All Categories',
    'Laptops',
    'Printers & Scanners',
    'LED Monitors',
    'Toners',
    'Desktop PCs',
    'Cartridges',
    'Scanners',
    'Refurbished Laptops',
    'Refurbished Desktop PCs',
    'Computer Accessories'
  ];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Trigger search when category changes and search term exists
  useEffect(() => {
    if (searchTerm.trim()) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('user');
      if (!stored) {
        setCurrentUser(null);
        return;
      }
      const parsed = JSON.parse(stored);
      setCurrentUser(parsed);
    } catch (error) {
      console.error('Failed to read user from storage:', error);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const fetchFeaturedLaptops = async () => {
      try {
        setFeaturedLoading(true);
        setFeaturedError('');

        const response = await fetch('https://hitek-server.onrender.com/api/laptops?featured=true&limit=3', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load featured laptops.');
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        const normalized = items
          .filter((item) => item?.featured === true || item?.featured === 'true' || item?.featured === 't')
          .map((item) => {
            const id =
              item?.id !== null && item?.id !== undefined && item?.id?.toString
                ? item.id.toString()
                : item.id;
            const computedName =
              item?.name ||
              [item?.brand, item?.model || item?.series].filter(Boolean).join(' ').trim() ||
              'Laptop';
            return {
              id,
              name: computedName,
              brand: item?.brand || '',
              price: parseNumeric(item?.price, 0),
              image: extractPrimaryImage(item),
            };
          });

        setFeaturedLaptops(normalized);
      } catch (error) {
        console.error('Featured laptops fetch error:', error);
        setFeaturedError(error.message || 'Unable to load featured laptops.');
        setFeaturedLaptops([]);
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchFeaturedLaptops();
  }, []);

  useEffect(() => {
    const fetchFeaturedPrinters = async () => {
      try {
        setPrintersLoading(true);
        setPrintersError('');

        const response = await fetch('https://hitek-server.onrender.com/api/printers?featured=true&limit=3', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load featured printers.');
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        const normalized = items
          .filter((item) => item?.featured === true || item?.featured === 'true' || item?.featured === 't')
          .map((item) => {
            const id =
              item?.id !== null && item?.id !== undefined && item?.id?.toString
                ? item.id.toString()
                : item.id;
            const computedName =
              item?.name ||
              [item?.brand, item?.series].filter(Boolean).join(' ').trim() ||
              'Printer';
            return {
              id,
              name: computedName,
              brand: item?.brand || '',
              price: parseNumeric(item?.price, 0),
              image: extractPrimaryImage(item) || '/printer-category.png',
            };
          });

        setFeaturedPrinters(normalized);
      } catch (error) {
        console.error('Featured printers fetch error:', error);
        setPrintersError(error.message || 'Unable to load featured printers.');
        setFeaturedPrinters([]);
      } finally {
        setPrintersLoading(false);
      }
    };

    fetchFeaturedPrinters();
  }, []);

  useEffect(() => {
    const fetchBannerProduct = async () => {
      try {
        const response = await fetch('https://hitek-server.onrender.com/api/laptops/12', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load featured banner product.');
        }

        const data = await response.json();
        if (!data) {
          setFeaturedBannerProduct(null);
          return;
        }

        const id =
          data?.id !== null && data?.id !== undefined && data?.id?.toString
            ? data.id.toString()
            : data.id;
        const name =
          data?.name ||
          [data?.brand, data?.model || data?.series].filter(Boolean).join(' ').trim() ||
          'Laptop';
        const description =
          typeof data?.description === 'string' && data.description.trim()
            ? data.description.trim()
            : 'Explore powerful performance and sleek design tailored for professionals.';

        setFeaturedBannerProduct({
          id,
          name,
          brand: data?.brand || '',
          description,
          price: parseNumeric(data?.price, 0),
          image: extractPrimaryImage(data),
        });
      } catch (error) {
        console.error('Featured laptop banner fetch error:', error);
        setFeaturedBannerProduct(null);
      }
    };

    fetchBannerProduct();
  }, []);

  const userInitials = useMemo(() => {
    if (!currentUser) return null;
    const nameParts = [currentUser.first_name, currentUser.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!nameParts) {
      return (currentUser.email || 'U').charAt(0).toUpperCase();
    }
    return nameParts
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser]);

  const filteredFeaturedLaptops = useMemo(() => {
    if (!featuredLaptops.length) return [];
    if (selectedBrand === 'All') return featuredLaptops;
    const normalized = selectedBrand.toLowerCase();
    return featuredLaptops.filter((item) =>
      (item.brand || '').toLowerCase().includes(normalized),
    );
  }, [featuredLaptops, selectedBrand]);

  const filteredFeaturedPrinters = useMemo(() => {
    if (!featuredPrinters.length) return [];
    if (selectedPrinterBrand === 'All') return featuredPrinters;
    const normalized = selectedPrinterBrand.toLowerCase();
    return featuredPrinters.filter((item) =>
      (item.brand || '').toLowerCase().includes(normalized),
    );
  }, [featuredPrinters, selectedPrinterBrand]);

  const handleLogout = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('session');
    setCurrentUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="w-full">
      {/* Top Bar - Welcome & Social Media */}
      <div className="bg-[#00aeef] text-white py-2 px-8 hidden md:flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm">Welcome to Hi-Tek Computers.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">Follow us:</span>
          <div className="flex items-center gap-3">
            <Link href="https://www.facebook.com/hitekcomputer" target='_blank'><FaFacebook className="cursor-pointer hover:text-blue-200 transition" /></Link>
            <Link href="https://www.instagram.com/hitek_computers" target='_blank'><FaInstagram className="cursor-pointer hover:text-blue-200 transition" /></Link>
            <Link href="https://www.tiktok.com/@hi_tek_computers" target='_blank'><FaTiktok className="cursor-pointer hover:text-blue-200 transition" /></Link>
            <Link href="https://www.linkedin.com/company/hitek-computers/?viewAsMember=true" target='_blank'><FaLinkedin className="cursor-pointer hover:text-blue-200 transition" /></Link>
            <Link href="https://www.youtube.com/@HiTek_Computers" target='_blank'><FaYoutube className="cursor-pointer hover:text-blue-200 transition" /></Link>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 border border-white/30 rounded cursor-pointer hover:bg-white/10">
            <span className="text-sm">Eng</span>
            <FaChevronDown className="text-xs" />
          </div>
          <div className="flex items-center gap-2 px-2 py-1 border border-white/30 rounded cursor-pointer hover:bg-white/10">
            <span className="text-sm">PKR</span>
            <FaChevronDown className="text-xs" />
          </div>
        </div>
      </div>

      {/* Middle Bar - Logo, Search & Icons */}
      <div className="bg-black text-white py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-row items-center lg:justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/">
            <Image 
              src="/navbar-logo.png" 
              alt="Hi-Tek Computers Logo" 
              width={120} 
              height={60}
              className="object-contain"
            />
            </Link>
          </div>

          {/* Mobile Menu Toggle - Only visible on mobile */}
          <button 
            className="lg:hidden text-2xl text-white shrink-0 ml-auto" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <CiMenuFries /> : <CiMenuBurger />}
          </button>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden lg:flex flex-1">
            <div className="w-full max-w-2xl mx-auto relative z-50">
              <div className="flex rounded overflow-visible relative">
                <div className="relative z-10">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="bg-gray-300 text-gray-700 px-4 py-[14px] flex items-center gap-2 border-r border-gray-400 hover:bg-gray-400 transition whitespace-nowrap"
                  >
                    <span className="text-sm font-medium">{selectedCategory}</span>
                    <FaChevronDown className={`text-xs transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCategoryDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[45]" 
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-[60] min-w-[180px]">
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsCategoryDropdownOpen(false);
                              if (searchTerm.trim()) {
                                performSearch(searchTerm);
                              }
                            }}
                            className={`w-full text-left px-4 text-black py-2 text-sm hover:bg-gray-100 transition ${
                              selectedCategory === category ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 relative z-10">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onFocus={() => {
                      if (searchTerm.trim() && (searchResults.length > 0 || isSearching)) {
                        setIsSearchDropdownOpen(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmit(e);
                      }
                    }}
                    placeholder="Search for anything..." 
                    className="w-full px-4 py-3 text-gray-900 bg-white focus:outline-none"
                  />
                  {isSearchDropdownOpen && searchTerm.trim() && (
                    <>
                      <div 
                        className="fixed inset-0 z-[45]" 
                        onClick={() => setIsSearchDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-xl z-[60] max-h-96 overflow-y-auto w-full">
                        {isSearching ? (
                          <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          <>
                            {searchResults.map((product) => (
                              <button
                                key={`${product.type}-${product.id}`}
                                type="button"
                                onClick={() => handleResultClick(product)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                                  <Image
                                    src={product.image || '/big-laptop.png'}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                  <div className="text-sm text-gray-500 truncate">
                                    {product.brand} {product.model ? `• ${product.model}` : ''}
                                  </div>
                                  <div className="text-sm font-semibold text-[#00aeef] mt-1">
                                    {formatPrice(product.price)}
                                  </div>
                                </div>
                              </button>
                            ))}
                            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                              <button
                                type="button"
                                onClick={handleViewAllResults}
                                className="w-full text-center text-sm text-[#00aeef] hover:underline font-medium"
                              >
                                View all results
                              </button>
                            </div>
                          </>
                        ) : searchTerm.trim() ? (
                          <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            No products found
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={handleViewAllResults}
                  className="bg-white text-gray-700 px-6 py-3 hover:bg-gray-100 transition shrink-0"
                >
                  <CiSearch className="text-xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Icons */}
          <div className="hidden lg:flex items-center gap-6">
            <div 
              className="relative"
              onMouseEnter={() => setIsCartHovered(true)}
              onMouseLeave={() => setIsCartHovered(false)}
            >
              <Link href="/cart">
                <CiShoppingCart className="text-2xl cursor-pointer hover:text-gray-300 transition" />
              </Link>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#00aeef] text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-bold px-1">
                  {cartCount}
                </span>
              )}
              {isCartHovered && (
                <>
                  {/* Invisible bridge to maintain hover across the gap */}
                  <div 
                    className="absolute top-full right-0 w-full h-2 pointer-events-auto z-40"
                    onMouseEnter={() => setIsCartHovered(true)}
                  />
                  <ShoppingCartPopup 
                    isOpen={isCartHovered} 
                    onClose={() => setIsCartHovered(false)}
                  />
                </>
              )}
            </div>
            <CiHeart className="text-2xl cursor-pointer hover:text-gray-300 transition" />
            <div 
              className="relative"
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
            >
              {currentUser ? (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-white/20 transition">
                  {userInitials}
                </div>
              ) : (
                <CiUser className="text-2xl cursor-pointer hover:text-gray-300 transition" />
              )}
              {isProfileHovered && (
                <>
                  <div 
                    className="absolute top-full right-0 w-full h-2 pointer-events-auto z-40"
                    onMouseEnter={() => setIsProfileHovered(true)}
                  />
                  {currentUser ? (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm text-gray-700"
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsProfileHovered(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <LoginPopup 
                      isOpen={isProfileHovered} 
                      onClose={() => setIsProfileHovered(false)} 
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Navigation - Hidden on mobile */}
      <div className="hidden lg:block bg-[#00aeef] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-row items-center justify-between flex-nowrap">
            {/* Desktop Navigation */}
            <div className="flex items-center shrink-0">
              <a href="/" className="flex items-center gap-2 px-4 py-4 bg-transparent hover:bg-[#00688f] transition shrink-0 whitespace-nowrap">
                <CiHome className="text-2xl shrink-0" />
                <span className="text-sm font-medium">Home</span>
              </a>
              <div 
                className="relative shrink-0"
                onMouseEnter={() => setIsAllProductsHovered(true)}
                onMouseLeave={() => {
                  setIsAllProductsHovered(false);
                  setIsLaptopsHovered(false);
                setSelectedBrand('All');
                }}
              >
                <Link 
                  href="/all-products" 
                  className={`flex items-center gap-2 px-4 py-4 transition whitespace-nowrap shrink-0 ${
                    isAllProductsHovered ? 'bg-[#00688f]' : 'hover:bg-[#00688f]'
                  }`}
                >
                  <span className="text-sm">All Products</span>
                  <FaChevronDown className="text-xs shrink-0" />
                </Link>

                {/* All Products Dropdown */}
                {isAllProductsHovered && (
                  <div className="absolute top-full left-0 mt-0 w-56 bg-white border border-gray-200 shadow-lg rounded-sm z-50">
                    <div className="py-2">
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Desktop PCs
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Printers
                      </a>
                      <div 
                        className="relative"
                        onMouseEnter={() => setIsLaptopsHovered(true)}
                        onMouseLeave={() => setIsLaptopsHovered(false)}
                      >
                        <a 
                          href="#" 
                          className={`flex items-center justify-between px-4 py-2 text-sm text-gray-900 transition cursor-pointer ${
                            isLaptopsHovered ? 'bg-gray-100' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span>Laptops</span>
                          <FaChevronRight className="text-xs text-black" />
                        </a>

                        {/* Laptops Nested Dropdown */}
                        {isLaptopsHovered && (
                          <>
                            {/* Invisible bridge to maintain hover across the gap */}
                            <div 
                              className="absolute -top-[80px] left-full w-2 h-[600px] pointer-events-auto z-40"
                              onMouseEnter={() => setIsLaptopsHovered(true)}
                            />
                            <div 
                              className="absolute -top-[80px] left-full ml-2 w-[900px] bg-white border border-gray-200 shadow-lg z-50 p-6"
                              onMouseEnter={() => setIsLaptopsHovered(true)}
                              onMouseLeave={() => setIsLaptopsHovered(false)}
                            >
                            <div className="flex gap-6">
                              {/* Left Side - Brand Filters */}
                              <div className="w-40 shrink-0">
                                <div className="space-y-1">
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('All');
                                      router.replace('/laptops');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'All' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    All
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('HP');
                                      router.replace('/laptops?brand=HP');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'HP' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    HP
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('Dell');
                                      router.replace('/laptops?brand=Dell');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'Dell' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    Dell
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('Lenovo');
                                      router.replace('/laptops?brand=Lenovo');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'Lenovo' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    Lenovo
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('Acer');
                                      router.replace('/laptops?brand=Acer');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'Acer' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    Acer
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('Asus');
                                      router.replace('/laptops?brand=Asus');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'Asus' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    Asus
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('Samsung');
                                      router.replace('/laptops?brand=Samsung');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'Samsung' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    Samsung
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedBrand('Chromebook');
                                      router.replace('/laptops?brand=Chromebook');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                                      selectedBrand === 'Chromebook' ? 'bg-gray-100' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    Chromebook
                                  </button>
                                </div>
                              </div>

                              {/* Middle - Featured Laptops Products */}
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">FEATURED LAPTOPS</h4>
                                <div className="space-y-4">
                                  {featuredLoading ? (
                                    <p className="text-xs text-gray-500">Loading featured laptops...</p>
                                  ) : featuredError ? (
                                    <p className="text-xs text-red-500">{featuredError}</p>
                                  ) : filteredFeaturedLaptops.length ? (
                                    filteredFeaturedLaptops.map((product, index) => (
                                      <Link
                                        key={product.id || `featured-${index}`}
                                        href={product.id ? `/product/${product.id}?type=laptop` : '/all-products'}
                                        className="flex gap-4 items-center border-b last:border-b-0 border-gray-200 pb-4 hover:bg-gray-50 p-2 -m-2 rounded transition cursor-pointer"
                                      >
                                        <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                                          <Image
                                            src={product.image || '/big-laptop.png'}
                                            alt={product.name}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <h5 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                            {product.name}
                                          </h5>
                                          {product.brand ? (
                                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                                              {product.brand}
                                            </p>
                                          ) : null}
                                          <p className="text-sm font-bold text-[#00aeef]">
                                            {formatPrice(product.price)}
                                          </p>
                                        </div>
                                      </Link>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      No featured laptops selected yet. Mark a laptop as featured in the CMS to show it here.
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right Side - Promotional Banner */}
                    <div className="w-64 shrink-0">
                      {featuredBannerProduct ? (
                        <div className="bg-gray-300 rounded-lg p-6 text-black h-full flex flex-col">
                          <div className="mb-4">
                            <Image
                              src={featuredBannerProduct.image || '/big-laptop.png'}
                              alt={featuredBannerProduct.name}
                              width={200}
                              height={150}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                          <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 inline-block mb-3">
                            Featured Pick
                          </div>
                          <h3 className="text-xl font-bold mb-2 line-clamp-2">{featuredBannerProduct.name}</h3>
                          <p className="text-sm text-gray-700 mb-4 flex-1 line-clamp-3">
                            {featuredBannerProduct.description}
                          </p>
                          <div className="mb-4">
                            <p className="text-sm">
                              <span className="text-gray-700">Price: </span>
                              <span className="font-bold bg-white text-black px-2 py-1 rounded">
                                {formatPrice(featuredBannerProduct.price)}
                              </span>
                            </p>
                          </div>
                          <Link
                            href={`/product/${featuredBannerProduct.id}?type=laptop`}
                            className="bg-[#00aeef] hover:bg-[#0099d9] text-white px-6 py-2 rounded-sm font-bold flex items-center justify-center gap-2 transition w-full"
                          >
                            View Laptop
                            <FiArrowRight />
                          </Link>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-lg p-6 text-gray-600 text-sm">
                          Loading featured laptop...
                        </div>
                      )}
                    </div>
                            </div>
                          </div>
                          </>
                        )}
                      </div>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Scanners
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Printer Toners
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Printer Cartridges
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        LED Monitors
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Refurbished PCs
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Refurbished Laptops
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition cursor-pointer">
                        Accessories
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative group shrink-0">
                <button className="flex items-center gap-2 px-4 py-4 hover:bg-[#00688f] transition shrink-0 whitespace-nowrap">
                  <CiLaptop className="text-2xl shrink-0" />
                  <span className="text-sm">Laptops</span>
                  <FaChevronDown className="text-xs shrink-0" />
                </button>
                <div className="absolute left-0 top-full w-[520px] bg-white text-black shadow-2xl rounded-b-md py-6 px-6 hidden group-hover:block z-40">
                  <div className="flex gap-6">
                    <div className="w-40 shrink-0">
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedBrand('All');
                            router.replace('/laptops');
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                            selectedBrand === 'All' ? 'bg-gray-100' : 'hover:bg-gray-100'
                          }`}
                        >
                          All
                        </button>
                        {['HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Samsung', 'Chromebook'].map((brand) => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedBrand(brand);
                              router.replace(`/laptops?brand=${encodeURIComponent(brand)}`);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                              selectedBrand === brand ? 'bg-gray-100' : 'hover:bg-gray-100'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-4">FEATURED LAPTOPS</h4>
                      <div className="space-y-4">
                        {featuredLoading ? (
                          <p className="text-xs text-gray-500">Loading featured laptops...</p>
                        ) : featuredError ? (
                          <p className="text-xs text-red-500">{featuredError}</p>
                        ) : filteredFeaturedLaptops.length ? (
                          filteredFeaturedLaptops.map((product, index) => (
                            <Link
                              key={product.id || `featured-${index}`}
                              href={product.id ? `/product/${product.id}?type=laptop` : '/all-products'}
                              className="flex gap-4 items-center border-b last:border-b-0 border-gray-200 pb-4 hover:bg-gray-50 p-2 -m-2 rounded transition cursor-pointer"
                            >
                              <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                                <Image
                                  src={product.image || '/big-laptop.png'}
                                  alt={product.name}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                  {product.name}
                                </h5>
                                {product.brand ? (
                                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                                    {product.brand}
                                  </p>
                                ) : null}
                                <p className="text-sm font-bold text-[#00aeef]">
                                  {formatPrice(product.price)}
                                </p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">
                            No featured laptops selected yet. Mark a laptop as featured in the CMS to show it here.
                          </p>
                        )}
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
              <a href="#" className="flex items-center gap-2 px-4 py-4 hover:bg-[#00688f] transition shrink-0 whitespace-nowrap">
                <PiDesktopTowerThin className="text-2xl shrink-0" />
                <span className="text-sm">Desktop PCs</span>
                <FaChevronDown className="text-xs shrink-0" />
              </a>
              <div className="relative group shrink-0">
                <button className="flex items-center gap-2 px-4 py-4 hover:bg-[#00688f] transition shrink-0 whitespace-nowrap">
                  <IoPrintOutline className="text-2xl shrink-0" />
                  <span className="text-sm">Printers & Toners</span>
                  <FaChevronDown className="text-xs shrink-0" />
                </button>
                <div className="absolute left-0 top-full w-[520px] bg-white text-black shadow-2xl rounded-b-md py-6 px-6 hidden group-hover:block z-40">
                  <div className="flex gap-6">
                    <div className="w-40 shrink-0">
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedPrinterBrand('All');
                            router.replace('/printers');
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                            selectedPrinterBrand === 'All' ? 'bg-gray-100' : 'hover:bg-gray-100'
                          }`}
                        >
                          All
                        </button>
                        {['HP', 'Epson', 'Canon', 'Brother', 'Ricoh', 'Xerox'].map((brand) => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedPrinterBrand(brand);
                              router.replace(`/printers?brand=${encodeURIComponent(brand)}`);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm text-black transition cursor-pointer ${
                              selectedPrinterBrand === brand ? 'bg-gray-100' : 'hover:bg-gray-100'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-4">FEATURED PRINTERS</h4>
                      <div className="space-y-4">
                        {printersLoading ? (
                          <p className="text-xs text-gray-500">Loading featured printers...</p>
                        ) : printersError ? (
                          <p className="text-xs text-red-500">{printersError}</p>
                        ) : filteredFeaturedPrinters.length ? (
                          filteredFeaturedPrinters.map((product, index) => (
                            <Link
                              key={product.id || `printer-featured-${index}`}
                              href={product.id ? `/product/${product.id}?type=printer` : '/all-products'}
                              className="flex gap-4 items-center border-b last:border-b-0 border-gray-200 pb-4 hover:bg-gray-50 p-2 -m-2 rounded transition cursor-pointer"
                            >
                              <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                                <Image
                                  src={product.image || '/printer-category.png'}
                                  alt={product.name}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                  {product.name}
                                </h5>
                                {product.brand ? (
                                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                                    {product.brand}
                                  </p>
                                ) : null}
                                <p className="text-sm font-bold text-[#00aeef]">
                                  {formatPrice(product.price)}
                                </p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">
                            No featured printers yet. Mark a printer as featured in the CMS to show it here.
                          </p>
                        )}
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
              <a href="#" className="flex items-center gap-2 px-4 py-4 hover:bg-[#00688f] transition shrink-0 whitespace-nowrap">
                <CiMonitor className="text-2xl shrink-0" />
                <span className="text-sm">LED Monitors</span>
                <FaChevronDown className="text-xs shrink-0" />
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-4 hover:bg-[#00688f] transition shrink-0 whitespace-nowrap">
                <GrRotateRight className="text-2xl shrink-0" />
                <span className="text-sm">Refurbished</span>
                <FaChevronDown className="text-xs shrink-0" />
              </a>
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-2 px-6 py-4 border-l border-[#00aeef] shrink-0 whitespace-nowrap">
              <CiPhone className="shrink-0" />
              <span className="font-medium">+92-213-2410225</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div 
          className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Menu Header */}
          <div className="bg-black text-white p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 z-10">
            <Image 
              src="/navbar-logo.png" 
              alt="Hi-Tek Computers Logo" 
              width={100} 
              height={50}
              className="object-contain"
            />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-2xl hover:text-gray-300 transition"
            >
              <CiMenuFries />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex flex-col">
            {/* Search Bar in Mobile Menu */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative z-50">
                <div className="flex rounded overflow-visible relative">
                  <div className="relative z-10">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="bg-gray-300 text-gray-700 px-3 py-2 text-xs flex items-center gap-2 border-r border-gray-400 hover:bg-gray-400 transition whitespace-nowrap"
                    >
                      <span className="text-xs font-medium">{selectedCategory}</span>
                      <FaChevronDown className={`text-xs transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCategoryDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[45]" 
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-[60] min-w-[180px]">
                          {categories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category);
                                setIsCategoryDropdownOpen(false);
                                if (searchTerm.trim()) {
                                  performSearch(searchTerm);
                                }
                              }}
                              className={`w-full text-left px-4 text-black py-2 text-sm hover:bg-gray-100 transition ${
                                selectedCategory === category ? 'bg-gray-100 font-medium' : ''
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 relative z-10">
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      onFocus={() => {
                        if (searchTerm.trim() && (searchResults.length > 0 || isSearching)) {
                          setIsSearchDropdownOpen(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchSubmit(e);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      placeholder="Search..." 
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none"
                    />
                    {isSearchDropdownOpen && searchTerm.trim() && (
                      <>
                        <div 
                          className="fixed inset-0 z-[45]" 
                          onClick={() => setIsSearchDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-xl z-[60] max-h-96 overflow-y-auto w-full">
                          {isSearching ? (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            <>
                              {searchResults.map((product) => (
                                <button
                                  key={`${product.type}-${product.id}`}
                                  type="button"
                                  onClick={() => {
                                    handleResultClick(product);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                                    <Image
                                      src={product.image || '/big-laptop.png'}
                                      alt={product.name}
                                      width={48}
                                      height={48}
                                      className="object-contain"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate text-sm">{product.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {product.brand} {product.model ? `• ${product.model}` : ''}
                                    </div>
                                    <div className="text-xs font-semibold text-[#00aeef] mt-1">
                                      {formatPrice(product.price)}
                                    </div>
                                  </div>
                                </button>
                              ))}
                              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleViewAllResults();
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="w-full text-center text-sm text-[#00aeef] hover:underline font-medium"
                                >
                                  View all results
                                </button>
                              </div>
                            </>
                          ) : searchTerm.trim() ? (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              No products found
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      handleViewAllResults();
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-white text-gray-700 px-3 py-2 hover:bg-gray-100 transition shrink-0"
                  >
                    <CiSearch className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            {/* User Account Section */}
            <div className="p-4 border-b border-gray-200">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00aeef] flex items-center justify-center text-sm font-semibold text-white">
                    {userInitials}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{currentUser.name || currentUser.email || 'User'}</div>
                    <div className="text-xs text-gray-500">Account</div>
                  </div>
                  <Link 
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm text-[#00aeef]"
                  >
                    View Profile
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsProfileHovered(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded transition"
                >
                  <CiUser className="text-2xl text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Login / Sign Up</span>
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-200 grid grid-cols-3 gap-2">
              <Link 
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded transition text-center"
              >
                <div className="relative">
                  <CiShoppingCart className="text-2xl text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#00aeef] text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-bold px-1">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-700">Cart</span>
              </Link>
              <button className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded transition text-center">
                <CiHeart className="text-2xl text-gray-700" />
                <span className="text-xs text-gray-700">Wishlist</span>
              </button>
              <div className="flex flex-col items-center gap-2 p-3">
                <CiPhone className="text-2xl text-gray-700" />
                <span className="text-xs text-gray-700">Call</span>
                <a href="tel:+922132410225" className="text-xs text-[#00aeef] font-medium">+92-213-2410225</a>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col">
              <a 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <CiHome className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Home</span>
              </a>
              <Link 
                href="/all-products" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <CiBoxes className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">All Products</span>
                <FaChevronRight className="ml-auto text-gray-400" />
              </Link>
              <a 
                href="/laptops" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <CiLaptop className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Laptops</span>
                <FaChevronRight className="ml-auto text-gray-400" />
              </a>
              <a 
                href="#" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <PiDesktopTowerThin className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Desktop PCs</span>
                <FaChevronRight className="ml-auto text-gray-400" />
              </a>
              <a 
                href="/printers" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <IoPrintOutline className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Printers & Toners</span>
                <FaChevronRight className="ml-auto text-gray-400" />
              </a>
              <a 
                href="/led-monitors" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <CiMonitor className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">LED Monitors</span>
                <FaChevronRight className="ml-auto text-gray-400" />
              </a>
              <a 
                href="#" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <GrRotateRight className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Refurbished</span>
                <FaChevronRight className="ml-auto text-gray-400" />
              </a>
            </div>

            {/* Logout Button if logged in */}
            {currentUser && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;