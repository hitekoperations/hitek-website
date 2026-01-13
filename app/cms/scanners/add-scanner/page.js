'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiPlusCircle,
  FiUploadCloud,
  FiTrash2,
  FiPrinter,
} from 'react-icons/fi';

const GENERAL_FIELD_CONFIG = [
  { id: 'name', label: 'Product Name', type: 'text', placeholder: 'HP ScanJet Pro' },
  { id: 'brand', label: 'Brand', type: 'text', placeholder: 'HP' },
  { id: 'model', label: 'Model', type: 'text', placeholder: 'ScanJet Pro' },
  { id: 'series', label: 'Series', type: 'text', placeholder: '2500' },
  { id: 'sku', label: 'SKU / Identifier', type: 'text', placeholder: 'SCN-0001' },
  { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '50000' },
  { id: 'stock', label: 'Stock Quantity', type: 'number', placeholder: '10' },
];

const scannerSpecs = [
  { id: 'memory', label: 'Memory', placeholder: '128 MB' },
  { id: 'paper_types', label: 'Paper Types', placeholder: 'Plain paper, Photo paper' },
  { id: 'paper_size', label: 'Paper Size', placeholder: 'A4, Letter' },
  { id: 'duplex', label: 'Duplex', placeholder: 'Yes / No' },
  { id: 'resolution', label: 'Resolution', placeholder: 'Up to 1200 DPI' },
  { id: 'power', label: 'Power', placeholder: '220 to 240 VAC (± 10%), 50/60 Hz' },
  { id: 'weight', label: 'Weight', placeholder: '3.5 kg' },
  { id: 'dimensions', label: 'Dimensions', placeholder: '425.2 x 304.1 x 149.1 mm' },
  { id: 'color_scan', label: 'Color Scan', placeholder: 'Yes / No' },
  { id: 'wireless', label: 'Wireless', placeholder: 'Yes / No' },
];

const CmsAddScannerPage = () => {
  const router = useRouter();
  const [details, setDetails] = useState({
    name: '',
    brand: '',
    model: '',
    series: '',
    sku: '',
    price: '',
    stock: '',
    description: '',
  });
  const [specs, setSpecs] = useState({});
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

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
      
      // Admin users always have access, others need products in accesspages
      if (parsedUser.role !== 'admin') {
        const accessPages = parsedUser.accesspages || [];
        if (!accessPages.includes('products')) {
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
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [images]);

  const handleGeneralChange = (event) => {
    const { name, value } = event.target;
    setDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSpecChange = (event) => {
    const { name, value } = event.target;
    setSpecs((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    setImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}`,
      }));
    });
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  const handleReset = () => {
    setDetails({
      name: '',
      brand: '',
      model: '',
      series: '',
      sku: '',
      price: '',
      stock: '',
      description: '',
    });
    setSpecs({});
    setStatus({ type: '', message: '' });
    setImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!details.name.trim()) {
      setStatus({ type: 'error', message: 'Product name is required.' });
      return;
    }

    if (!details.brand.trim()) {
      setStatus({ type: 'error', message: 'Brand is required.' });
      return;
    }

    if (!details.price.trim()) {
      setStatus({ type: 'error', message: 'Please provide a product price.' });
      return;
    }

    if (!images.length) {
      setStatus({ type: 'error', message: 'Upload at least one product image.' });
      return;
    }

    try {
      setSubmitting(true);

      // Get CMS user info for activity logging
      const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');
      
      const formData = new FormData();
      Object.entries(details).forEach(([key, value]) => {
        formData.append(key, value);
      });
      Object.entries(specs).forEach(([key, value]) => {
        formData.append(key, value);
      });
      images.forEach((item) => {
        formData.append('images', item.file);
      });
      
      // Add user info to FormData as fallback for activity logging
      formData.append('cmsUserId', String(cmsUser.id || ''));
      formData.append('cmsUserName', String(cmsUser.username || cmsUser.user_name || ''));
      formData.append('cmsUserRole', String(cmsUser.role || ''));
      
      const response = await fetch('https://hitek-server-uu0f.onrender.com/api/scanners', {
        method: 'POST',
        headers: {
          'X-CMS-User-Id': String(cmsUser.id || ''),
          'X-CMS-User-Name': String(cmsUser.username || cmsUser.user_name || ''),
          'X-CMS-User-Role': String(cmsUser.role || ''),
        },
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save scanner.');
      }

      handleReset();
      setStatus({
        type: 'success',
        message: 'Scanner created successfully and synced to Supabase.',
      });
    } catch (error) {
      console.error('Add scanner error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to create the scanner. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <header className="bg-linear-to-r from-[#111827]/85 via-[#1f2937]/85 to-[#111827]/85 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Catalog</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Add Scanner</h1>
            <p className="text-sm text-slate-300 mt-2">
              Fill in the scanner details and upload multiple product photos before submitting.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/cms/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition shadow-lg shadow-black/10"
            >
              <FiArrowLeft /> Back to products
            </Link>
            <button
              type="button"
              onClick={() => router.push('/cms/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-sm font-semibold text-white rounded-lg shadow-lg shadow-[#6366f1]/40"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-10 bg-white/10 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl px-6 sm:px-10 py-10"
        >
          <section className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <FiPlusCircle className="text-[#38bdf8]" />
                Scanner Details
              </p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Fill in the basic information about the scanner product.
              </p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">Description</span>
                  <textarea
                    name="description"
                    value={details.description}
                    onChange={handleGeneralChange}
                    rows={3}
                    placeholder="High-level marketing copy or key highlights."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60 resize-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GENERAL_FIELD_CONFIG.map((field) => (
                  <label key={field.id} className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                      {field.label}
                    </span>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      value={details[field.id]}
                      onChange={handleGeneralChange}
                      placeholder={field.placeholder}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <FiPrinter className="text-[#38bdf8]" />
                  Scanner Specification Sheet
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Fill in each spec exactly how you would like it to appear on the product page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scannerSpecs.map((field) => (
                <label key={field.id} className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">{field.label}</span>
                  <input
                    name={field.id}
                    value={specs[field.id] || ''}
                    onChange={handleSpecChange}
                    placeholder={field.placeholder}
                    className="bg-transparent border border-white/20 focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-400"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <FiUploadCloud className="text-[#38bdf8]" />
                  Product Images
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Upload multiple angles or lifestyle shots. First image becomes the cover.
                </p>
              </div>
            </div>

            <label
              htmlFor="scanner-images"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-2xl px-6 py-10 bg-white/5 hover:border-[#38bdf8]/60 transition cursor-pointer text-center"
            >
              <FiUploadCloud className="text-3xl text-[#38bdf8]" />
              <div>
                <p className="text-sm font-semibold text-white">Click to upload images</p>
                <p className="text-xs text-slate-300 mt-1">PNG, JPG up to 5MB each. Hold Ctrl/Shift for multi-select.</p>
              </div>
              <input
                id="scanner-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-white/10 border border-white/15 rounded-xl overflow-hidden shadow-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt={item.file.name} className="h-44 w-full object-cover" />
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-white truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-300">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-red-300 hover:text-red-200 transition"
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {status.message && (
            <div
              className={`text-sm px-4 py-3 rounded-lg border ${
                status.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'
                  : 'bg-red-500/10 border-red-400/40 text-red-200'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-sm font-semibold text-white rounded-lg shadow-lg shadow-[#6366f1]/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving scanner…' : 'Save scanner'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CmsAddScannerPage;

