'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiTag,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiArrowLeft,
  FiPlus,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiCopy,
} from 'react-icons/fi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hitek-server-uu0f.onrender.com';

const CmsVouchersPage = () => {
  const router = useRouter();
  const [cmsUser, setCmsUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, valid, availed
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'price',
    value: '',
    code: '',
    description: '',
    expires_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

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
      
      if (!Array.isArray(parsedUser.accesspages)) {
        parsedUser.accesspages = [];
      }
      
      if (parsedUser.role !== 'admin') {
        const accessPages = parsedUser.accesspages || [];
        if (!accessPages.includes('vouchers')) {
          router.replace('/cms/auth/login');
          return;
        }
      }
      
      setCmsUser(parsedUser);
    } catch (err) {
      console.error('Failed to parse CMS user', err);
      router.replace('/cms/auth/login');
    }
  }, [router]);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/vouchers`);

      if (!response.ok) {
        throw new Error('Failed to load vouchers');
      }

      const data = await response.json();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('CMS vouchers fetch error:', err);
      setError(err.message || 'Failed to load vouchers.');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const storedUser = window.localStorage.getItem('cmsUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      const headers = {
        'Content-Type': 'application/json',
      };

      if (parsedUser) {
        headers['X-CMS-User-Id'] = parsedUser.id?.toString() || '';
        headers['X-CMS-User-Name'] = parsedUser.name || parsedUser.username || '';
        headers['X-CMS-User-Role'] = parsedUser.role || '';
      }

      const payload = {
        type: formData.type,
        value: parseFloat(formData.value),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        expires_at: formData.expires_at || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/api/vouchers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create voucher');
      }

      setSubmitSuccess('Voucher created successfully!');
      setFormData({
        type: 'price',
        value: '',
        code: '',
        description: '',
        expires_at: '',
      });
      setTimeout(() => {
        setShowForm(false);
        fetchVouchers();
      }, 1500);
    } catch (err) {
      console.error('Create voucher error:', err);
      setSubmitError(err.message || 'Failed to create voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Are you sure you want to delete voucher "${code}"?`)) {
      return;
    }

    try {
      const storedUser = window.localStorage.getItem('cmsUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      const headers = {
        'Content-Type': 'application/json',
      };

      if (parsedUser) {
        headers['X-CMS-User-Id'] = parsedUser.id?.toString() || '';
        headers['X-CMS-User-Name'] = parsedUser.name || parsedUser.username || '';
        headers['X-CMS-User-Role'] = parsedUser.role || '';
      }

      const response = await fetch(`${API_BASE_URL}/api/vouchers/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete voucher');
      }

      fetchVouchers();
    } catch (err) {
      console.error('Delete voucher error:', err);
      alert(err.message || 'Failed to delete voucher');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch = voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.description && voucher.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'valid') {
      return matchesSearch && !voucher.is_availed;
    }
    if (filter === 'availed') {
      return matchesSearch && voucher.is_availed;
    }
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
              <FiTag className="text-[#38bdf8]" /> Vouchers
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Voucher Management</h1>
            <p className="mt-1 text-sm text-slate-300">
              Generate and manage discount vouchers for your customers. Create price-based or percentage-based vouchers.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white rounded-lg hover:from-[#0ea5e9] hover:to-[#4f46e5] transition-all shadow-lg shadow-[#38bdf8]/20"
            >
              <FiPlus className="w-4 h-4" />
              {showForm ? 'Cancel' : 'Generate Voucher'}
            </button>
          </div>
        </header>

        {showForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Generate New Voucher</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Voucher Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, value: '' })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                    required
                  >
                    <option value="price">Price-based (e.g., RS500 off)</option>
                    <option value="percentage">Percentage-based (e.g., 10% off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {formData.type === 'price' ? 'Discount Amount (PKR) *' : 'Discount Percentage (1-100) *'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    min={formData.type === 'percentage' ? 1 : 0.01}
                    max={formData.type === 'percentage' ? 100 : undefined}
                    step={formData.type === 'percentage' ? 1 : 0.01}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                    placeholder={formData.type === 'price' ? '500' : '10'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Voucher Code (optional - auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                    placeholder="Leave empty for auto-generation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expiration Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                  placeholder="Add any notes or description for this voucher"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
                  {submitSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white rounded-lg hover:from-[#0ea5e9] hover:to-[#4f46e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Voucher'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      type: 'price',
                      value: '',
                      code: '',
                      description: '',
                      expires_at: '',
                    });
                    setSubmitError('');
                    setSubmitSuccess('');
                  }}
                  className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code or description..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('valid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'valid'
                    ? 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Valid
              </button>
              <button
                onClick={() => setFilter('availed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'availed'
                    ? 'bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Availed
              </button>
              <button
                onClick={fetchVouchers}
                disabled={loading}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading vouchers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <FiAlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FiTag className="w-8 h-8 mx-auto mb-2" />
              <p>No vouchers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Code</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Value</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Expires</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Availed At</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((voucher) => {
                    const isExpired = voucher.expires_at && new Date(voucher.expires_at) < new Date();
                    const status = voucher.is_availed ? 'Availed' : isExpired ? 'Expired' : 'Valid';
                    const statusColor = voucher.is_availed
                      ? 'from-[#ef4444] to-[#f97316]'
                      : isExpired
                      ? 'from-[#6b7280] to-[#4b5563]'
                      : 'from-[#22c55e] to-[#16a34a]';

                    return (
                      <tr
                        key={voucher.id}
                        className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-white">{voucher.code}</span>
                            <button
                              onClick={() => copyToClipboard(voucher.code)}
                              className="text-slate-400 hover:text-[#38bdf8] transition-colors"
                              title="Copy code"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 capitalize">{voucher.type}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">
                            {voucher.type === 'price'
                              ? `PKR ${parseFloat(voucher.value).toLocaleString('en-PK')}`
                              : `${parseFloat(voucher.value)}%`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusColor} text-white`}
                          >
                            {voucher.is_availed ? (
                              <FiCheckCircle className="w-3 h-3" />
                            ) : (
                              <FiAlertCircle className="w-3 h-3" />
                            )}
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-sm">{formatDate(voucher.created_at)}</td>
                        <td className="py-3 px-4 text-slate-400 text-sm">
                          {voucher.expires_at ? formatDate(voucher.expires_at) : 'No expiration'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-sm">
                          {voucher.availed_at ? formatDateTime(voucher.availed_at) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {!voucher.is_availed && (
                            <button
                              onClick={() => handleDelete(voucher.id, voucher.code)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete voucher"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CmsVouchersPage;
