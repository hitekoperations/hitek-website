'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';

const BulkAddProductsPage = () => {
  const router = useRouter();
  const [category, setCategory] = useState('laptop');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(() => Date.now());

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

  const handleFileChange = (event) => {
    setError(null);
    setResult(null);
    const selected = event.target?.files?.[0];
    setFile(selected || null);
    setFileName(selected?.name || '');
  };

  const resetState = () => {
    setFile(null);
    setFileName('');
    setIsSubmitting(false);
    setFileInputKey(Date.now());
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please choose a CSV file before uploading.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setResult(null);

      // Get CMS user info for activity logging
      const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');
      
      const formData = new FormData();
      formData.append('category', category);
      formData.append('file', file);

      const response = await fetch('https://hitek-server-uu0f.onrender.com/api/products/bulk/csv', {
        method: 'POST',
        headers: {
          'X-CMS-User-Id': cmsUser.id || '',
          'X-CMS-User-Name': cmsUser.username || cmsUser.name || '',
          'X-CMS-User-Role': cmsUser.role || '',
        },
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to process file.');
      }

      setResult(payload);
      resetState();
    } catch (err) {
      console.error('Bulk upload error:', err);
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/cms/products"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300"
            >
              <FiArrowLeft className="text-[#38bdf8]" /> Back to Products
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-white">Bulk Add Products</h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Upload a spreadsheet or paste multiple entries to create product listings in one go. This tool supports laptops, printers, and scanners.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl shadow-2xl p-6 sm:p-8 space-y-8">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-white uppercase tracking-wide block mb-3">
                    Product Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60"
                    >
                      <option className="text-slate-900" value="laptop">
                        Laptop CSV
                      </option>
                      <option className="text-slate-900" value="printer">
                        Printer CSV
                      </option>
                      <option className="text-slate-900" value="scanner">
                        Scanner CSV
                      </option>
                    </select>
                    <FiInfo className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#38bdf8]" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white uppercase tracking-wide block mb-3">
                    Upload CSV / Excel
                  </label>
                  <div className="relative flex flex-col items-center justify-center gap-4 border border-dashed border-white/20 rounded-2xl px-6 py-10 bg-white/5 hover:border-[#38bdf8]/60 transition">
                    <FiUpload className="text-3xl text-[#38bdf8]" />
                    <div className="text-center text-sm text-slate-300">
                      Drag & drop a file here, or click to browse.
                    </div>
                    {fileName ? (
                      <div className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-slate-200">
                        {fileName}
                      </div>
                    ) : null}
                    <input
                      key={fileInputKey}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-[#38bdf8] font-semibold uppercase tracking-wide">
                    <FiInfo /> Quick Tips
                  </div>
                  <p>
                    - Headers must match database columns (e.g. <code>name</code>,{' '}
                    <code>price</code>, <code>brand</code>).
                  </p>
                  <p>- Separate multiple image URLs with commas; the first becomes the cover image.</p>
                  <p>- Keep laptops and printers in separate files.</p>
                </div>

                <div className="rounded-2xl border border-[#f97316]/30 bg-[#f97316]/10 p-5 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-amber-300">
                    <FiAlertCircle /> Validation
                  </div>
                  <p>
                    The upload runs detailed validation. You will get a summary of any rows that
                    fail so you can fix them and try again.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-300">
              Need a sample?{' '}
              <Link
                href="/bulk-products-template.csv"
                className="text-[#38bdf8] hover:text-[#60a5fa] font-semibold"
              >
                Download template
              </Link>
            </div>
            <div className="flex gap-3">
              <Link
                href="/cms/products"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/40 hover:from-[#0ea5e9] hover:to-[#4338ca] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing…' : 'Process Upload'}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-400/40 bg-red-950/40 p-6 text-sm text-red-100 space-y-3">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-red-200 text-xs">
              <FiAlertCircle className="text-base" /> Upload failed
            </div>
            <p>{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-950/30 p-6 text-sm text-emerald-100 space-y-4">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-emerald-200 text-xs">
              <FiCheckCircle className="text-base" /> Upload summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.attempted ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Rows in file</div>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.processed ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Validated</div>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.inserted ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Inserted</div>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                <div className="text-[0.95rem] font-semibold text-white">
                  {result?.summary?.failed ?? 0}
                </div>
                <div className="uppercase tracking-wide text-emerald-200/80">Issues</div>
              </div>
            </div>

            {result?.rowValidationErrors?.length ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 space-y-2 text-xs">
                <div className="font-semibold uppercase text-amber-200 tracking-wide">
                  Validation issues
                </div>
                <ul className="space-y-1">
                  {result.rowValidationErrors.map((issue, index) => (
                    <li key={`validation-${index}`} className="text-amber-100/90">
                      Row {issue.row}: {issue.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result?.insertionErrors?.length ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 space-y-2 text-xs">
                <div className="font-semibold uppercase text-red-200 tracking-wide">
                  Insert errors
                </div>
                <ul className="space-y-1">
                  {result.insertionErrors.map((issue, index) => (
                    <li key={`insertion-${index}`} className="text-red-100/90">
                      Row {issue.row}: {issue.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BulkAddProductsPage;
