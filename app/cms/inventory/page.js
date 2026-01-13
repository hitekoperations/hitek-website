'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiArrowLeft,
  FiAlertTriangle,
  FiTag,
  FiPrinter,
  FiMonitor,
  FiEdit2,
  FiX,
  FiCheckCircle,
} from 'react-icons/fi';

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

const extractImageArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value.imageUrls)) return value.imageUrls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.image_urls)) return value.image_urls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.images)) return value.images.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.imageurls)) return value.imageurls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (typeof value.image === 'string' && value.image.trim() !== '') return [value.image.trim()];
  return [];
};

const sanitizeProduct = (item, type) => {
  if (!item) return null;
  const resolvedType = type || item.type || 'laptop';
  const images = extractImageArray(item);
  const price = parseNumeric(item.price, 0);
  const stock = parseNumeric(item.stock, 0);

  return {
    ...item,
    id: item.id?.toString?.() ?? item.id,
    type: resolvedType,
    name:
      item.name ||
      (resolvedType === 'printer'
        ? [item.brand, item.series].filter(Boolean).join(' ')
        : [item.brand, item.model || item.series].filter(Boolean).join(' ')) ||
      'Untitled Product',
    brand: item.brand || 'Unknown',
    price,
    priceLabel: price > 0 ? `PKR ${price.toLocaleString('en-PK')}` : 'Price on request',
    stock,
    lastUpdated: item.updated_at || item.updatedat || item.updatedAt || null,
    image: images[0] || item.image || (resolvedType === 'printer' || resolvedType === 'scanner' ? '/printer-category.png' : '/laptop-category.jpg'),
    images,
    category: resolvedType === 'printer' ? 'Printers' : resolvedType === 'scanner' ? 'Scanners' : 'Laptops',
  };
};

const CmsInventoryPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState('');
  const [stockSuccess, setStockSuccess] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = window.localStorage.getItem('cmsUser');
    const storedSession = window.localStorage.getItem('cmsSession');

    if (!storedUser || !storedSession) {
      router.replace('/cms/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      
      // Ensure accesspages is an array
      if (!Array.isArray(parsedUser.accesspages)) {
        parsedUser.accesspages = [];
      }
      
      // Admin users always have access, others need inventory in accesspages
      if (parsedUser.role !== 'admin') {
        const accessPages = parsedUser.accesspages || [];
        if (!accessPages.includes('inventory')) {
          router.replace('/cms/auth/login');
          return;
        }
      }
    } catch (err) {
      console.error('Failed to parse CMS user', err);
      router.replace('/cms/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const [laptopsRes, printersRes, scannersRes] = await Promise.all([
          fetch('https://hitek-server-uu0f.onrender.com/api/laptops'),
          fetch('https://hitek-server-uu0f.onrender.com/api/printers'),
          fetch('https://hitek-server-uu0f.onrender.com/api/scanners'),
        ]);

        if (!laptopsRes.ok) throw new Error('Failed to load laptops');
        if (!printersRes.ok) throw new Error('Failed to load printers');
        if (!scannersRes.ok) throw new Error('Failed to load scanners');

        const [laptopsData, printersData, scannersData] = await Promise.all([
          laptopsRes.json(),
          printersRes.json(),
          scannersRes.json(),
        ]);

        const sanitized = [
          ...(Array.isArray(laptopsData) ? laptopsData.map((item) => sanitizeProduct(item, 'laptop')) : []),
          ...(Array.isArray(printersData) ? printersData.map((item) => sanitizeProduct(item, 'printer')) : []),
          ...(Array.isArray(scannersData) ? scannersData.map((item) => sanitizeProduct(item, 'scanner')) : []),
        ].filter(Boolean);

        setProducts(sanitized);
      } catch (err) {
        console.error('CMS inventory fetch error:', err);
        setError(err.message || 'Failed to load inventory.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const openStockModal = (product) => {
    setStockTarget(product);
    setStockValue(
      product && product.stock !== null && product.stock !== undefined
        ? String(product.stock)
        : '',
    );
    setStockError('');
    setStockSuccess('');
    setStockModalOpen(true);
  };

  const closeStockModal = () => {
    if (stockSaving) return;
    setStockModalOpen(false);
    setStockTarget(null);
    setStockValue('');
    setStockError('');
    setStockSuccess('');
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    if (!stockTarget) return;

    const parsedStock = Number(stockValue);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setStockError('Stock must be a zero or positive number.');
      return;
    }

    setStockSaving(true);
    setStockError('');
    setStockSuccess('');

    try {
      let endpoint;
      if (stockTarget.type === 'printer') {
        endpoint = 'printers';
      } else if (stockTarget.type === 'scanner') {
        endpoint = 'scanners';
      } else {
        endpoint = 'laptops';
      }
      const response = await fetch(
        `https://hitek-server-uu0f.onrender.com/api/${endpoint}/${stockTarget.id}/stock`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stock: parsedStock }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update stock.');
      }

      const normalizedPayload = Array.isArray(payload) ? payload[0] : payload;
      let sanitized = sanitizeProduct(normalizedPayload, stockTarget.type);
      if (!sanitized) {
        sanitized = {
          ...stockTarget,
          stock: parsedStock,
          lastUpdated: stockTarget.lastUpdated,
        };
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === sanitized.id && product.type === sanitized.type
            ? { ...product, ...sanitized }
            : product,
        ),
      );

      setStockTarget((prev) => (prev ? { ...prev, ...sanitized } : prev));
      setStockSuccess('Stock updated successfully.');
      setStockValue(String(sanitized.stock ?? parsedStock));

      setTimeout(() => {
        closeStockModal();
      }, 800);
    } catch (err) {
      console.error('Stock update error:', err);
      setStockError(err.message || 'Failed to update stock.');
    } finally {
      setStockSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = filter === 'all' ? true : product.type === filter;
      const matchesSearch = searchTerm
        ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, searchTerm]);

  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.23),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
              <FiPackage className="text-[#38bdf8]" /> Inventory
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Inventory Overview</h1>
            <p className="mt-1 text-sm text-slate-300">
              Review all laptops and printers currently stocking your hi-tech storefront. Manage quantities and pricing
              with ease.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition shadow-lg shadow-black/10"
            >
              <FiArrowLeft />
              Back to dashboard
            </Link>
            <button
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#6366f1]/30"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3">
              <FiSearch className="text-slate-300" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by product or brand..."
                className="bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition inline-flex items-center gap-2 ${
                  filter === 'all'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <FiFilter />
                All
              </button>
              <button
                onClick={() => setFilter('laptop')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition inline-flex items-center gap-2 ${
                  filter === 'laptop'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <FiMonitor />
                Laptops
              </button>
              <button
                onClick={() => setFilter('printer')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition inline-flex items-center gap-2 ${
                  filter === 'printer'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <FiPrinter />
                Printers
              </button>
              <button
                onClick={() => setFilter('scanner')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition inline-flex items-center gap-2 ${
                  filter === 'scanner'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <FiPrinter />
                Scanners
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading && (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-slate-200">
                <FiRefreshCw className="animate-spin text-2xl" />
                <p className="text-sm">Loading inventory...</p>
              </div>
            )}

            {error && !loading && (
              <div className="col-span-full border border-red-400/30 bg-red-500/10 text-red-100 rounded-2xl p-6 flex gap-3 items-start">
                <FiAlertTriangle className="mt-1 text-xl" />
                <div>
                  <p className="text-sm font-semibold">Unable to load inventory</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="col-span-full border border-white/10 bg-white/5 text-white/80 rounded-2xl p-6">
                <p className="text-sm font-semibold">No products match your filters.</p>
                <p className="text-xs mt-1">Try adjusting your search or type selection.</p>
              </div>
            )}

            {!loading &&
              !error &&
              filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-xl transition transform hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-white/5 opacity-50 pointer-events-none" />
                  <div className="relative p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                        {product.type === 'printer' || product.type === 'scanner' ? <FiPrinter /> : <FiMonitor />}
                        {product.category}
                      </span>
                      <span className="text-xs text-white/60">{product.brand}</span>
                    </div>

                    <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-xl p-4 h-36">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-26 w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-white line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span className="inline-flex items-center gap-2">
                          <FiTag />
                          {product.priceLabel}
                        </span>
                        <span>{product.stock} in stock</span>
                      </div>
                    </div>

                    

                    <div className="flex justify-end">
                      <button
                        onClick={() => openStockModal(product)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-xs font-semibold text-white hover:from-[#0ea5e9] hover:to-[#4338ca] transition shadow-lg shadow-[#6366f1]/30"
                      >
                        <FiEdit2 />
                        Update Stock
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>

      {stockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={closeStockModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Update Stock</h2>
                <p className="mt-1 text-xs text-slate-300 leading-snug">
                  {stockTarget?.name || 'Selected product'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStockModal}
                className="text-slate-400 hover:text-white transition disabled:opacity-60"
                disabled={stockSaving}
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleStockSubmit}>
              <div>
                <label
                  className="block text-xs font-semibold text-slate-300 mb-1"
                  htmlFor="stockValue"
                >
                  Stock Count
                </label>
                <input
                  id="stockValue"
                  type="number"
                  min="0"
                  value={stockValue}
                  onChange={(event) => setStockValue(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                  placeholder="Enter stock quantity"
                  disabled={stockSaving}
                />
              </div>

              {stockError && (
                <div className="text-xs text-red-200 bg-red-900/40 border border-red-500/40 rounded-md px-3 py-2">
                  {stockError}
                </div>
              )}

              {stockSuccess && (
                <div className="inline-flex items-center gap-2 text-xs text-emerald-200 bg-emerald-900/40 border border-emerald-500/40 rounded-md px-3 py-2">
                  <FiCheckCircle />
                  {stockSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm font-semibold text-slate-200 hover:bg-white/10 transition disabled:opacity-60"
                  disabled={stockSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-sm font-semibold text-white hover:from-[#0ea5e9] hover:to-[#4338ca] transition disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={stockSaving}
                >
                  {stockSaving && <FiRefreshCw className="animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsInventoryPage;

