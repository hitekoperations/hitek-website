'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiShoppingCart,
  FiTruck,
  FiClock,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiArrowLeft,
  FiAlertTriangle,
  FiPackage,
  FiX,
} from 'react-icons/fi';

const STATUS_COLORS = {
  pending: 'from-[#f97316]/70 to-[#fb7185]/60',
  processing: 'from-[#38bdf8]/70 to-[#6366f1]/60',
  completed: 'from-[#22c55e]/70 to-[#16a34a]/60',
  cancelled: 'from-[#ef4444]/70 to-[#f97316]/60',
};

const STATUS_BADGE_BG = {
  pending: 'from-[#f97316] to-[#fb7185]',
  processing: 'from-[#38bdf8] to-[#6366f1]',
  completed: 'from-[#22c55e] to-[#16a34a]',
  cancelled: 'from-[#ef4444] to-[#f97316]',
};

const STATUS_BADGE_SHADOW = {
  pending: 'shadow-[#fb7185]/40',
  processing: 'shadow-[#6366f1]/40',
  completed: 'shadow-[#16a34a]/40',
  cancelled: 'shadow-[#f97316]/40',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return `PKR ${numeric.toLocaleString('en-PK')}`;
};

const parseAddressLike = (value) => {
  if (!value) return null;

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // ignore JSON parse error; treat as plain string
    }
  }

  return null;
};

const normalizeStatus = (status) => {
  if (!status) return 'pending';
  const normalized = status.toString().toLowerCase();
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('complete')) return 'completed';
  if (normalized.includes('process')) return 'processing';
  return 'pending';
};

const extractCustomerName = (order) => {
  if (!order) return 'Guest User';

  const shippingAddress = parseAddressLike(order.shipping_address);
  const billingAddress = parseAddressLike(order.billing_address);

  const addressName =
    shippingAddress?.name ||
    billingAddress?.name ||
    (Array.isArray(order.order_items) &&
      order.order_items.length > 0 &&
      parseAddressLike(order.order_items[0]?.shipping)?.name);
  if (addressName && addressName.trim()) {
    return addressName.trim();
  }

  const orderName =
    order.customer_name ||
    [order.first_name, order.last_name].filter(Boolean).join(' ') ||
    order.user_name ||
    order.user_email;
  if (orderName && orderName.trim()) return orderName.trim();

  const userName =
    order.user?.full_name ||
    [order.user?.first_name, order.user?.last_name].filter(Boolean).join(' ') ||
    order.user?.name ||
    order.user?.email;
  if (userName && userName.trim()) return userName.trim();

  return 'Guest User';
};

const extractEmail = (order) => {
  if (!order) return 'Not provided';

  const shippingAddress = parseAddressLike(order.shipping_address);
  const billingAddress = parseAddressLike(order.billing_address);

  const addressEmail = shippingAddress?.email || billingAddress?.email;
  if (addressEmail && addressEmail.trim()) {
    return addressEmail.trim();
  }

  const email = order.user_email || order.email || order.user?.email;
  return email || 'Not provided';
};

const sanitizeOrder = (order) => {
  if (!order) return null;
  const status = normalizeStatus(order.status || order.state || order.order_status);

  return {
    id: order.id?.toString?.() ?? order.id,
    orderNumber: order.order_number || order.id || `ORDER-${order.id}`,
    customerName: extractCustomerName(order),
    email: extractEmail(order),
    total: Number(order.totalamount ?? order.total_amount ?? order.total) || 0,
    itemCount: Number(order.itemcount ?? order.items?.length ?? 1) || 1,
    createdAt: order.created_at || order.createdat || order.createdAt || null,
    status,
    raw: order,
  };
};

const normalizeAddress = (address) => {
  if (!address) {
    return {
      lines: [],
      phone: '',
      email: '',
      name: '',
    };
  }

  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeAddress(parsed);
      }
    } catch (error) {
      // ignore parse error; fallback to splitting
    }

    const lines = address
      .split(/\r?\n|,/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      lines,
      phone: '',
      email: '',
      name: '',
    };
  }

  const cityLine = [address.city, address.state, address.postal_code]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');

  const lines = [
    address.line1,
    address.line2,
    cityLine,
    address.country,
  ]
    .filter((line) => typeof line === 'string' && line.trim())
    .map((line) => line.trim());

  return {
    lines,
    phone: typeof address.phone === 'string' ? address.phone : '',
    email: typeof address.email === 'string' ? address.email : '',
    name: typeof address.name === 'string' ? address.name : '',
  };
};

const sanitizeOrderDetail = (order, fallback) => {
  const base = sanitizeOrder(order || fallback?.raw || fallback);

  const detailSource = order || fallback?.raw || {};

  const items = Array.isArray(detailSource.order_items)
    ? detailSource.order_items.map((item) => ({
        id: item.id?.toString?.() ?? item.id,
        name: item.name || item.product_name || 'Unnamed item',
        quantity: Number(item.quantity || item.qty || 1),
        price: Number(item.price || item.unit_price || 0),
        total: Number(item.price || item.unit_price || 0) * Number(item.quantity || item.qty || 1),
      }))
    : [];

  return {
    ...base,
    items,
    subtotal: Number(detailSource.subtotal ?? detailSource.total_without_tax ?? 0),
    tax: Number(detailSource.tax ?? detailSource.tax_amount ?? 0),
    shippingCost: Number(detailSource.shipping ?? detailSource.shipping_cost ?? 0),
    paymentMethod: detailSource.payment_method || detailSource.paymentmethod || 'Not provided',
    notes: detailSource.order_notes || detailSource.notes || '',
    shippingAddress: normalizeAddress(detailSource.shipping_address),
    billingAddress: normalizeAddress(detailSource.billing_address),
  };
};

const CmsOrdersPage = () => {
  const router = useRouter();
  const [cmsUser, setCmsUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailStatus, setDetailStatus] = useState('pending');
  const [detailError, setDetailError] = useState('');
  const [detailMessage, setDetailMessage] = useState('');
  const [detailSaving, setDetailSaving] = useState(false);

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
      
      // Check if user has access to orders page
      // Ensure accesspages is an array
      if (!Array.isArray(parsedUser.accesspages)) {
        parsedUser.accesspages = [];
      }
      
      // Admin users always have access, others need orders in accesspages
      if (parsedUser.role !== 'admin') {
        const accessPages = parsedUser.accesspages || [];
        if (!accessPages.includes('orders')) {
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
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('https://hitek-server-uu0f.onrender.com/api/orders');
        if (!response.ok) throw new Error('Failed to load orders');
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((order) => sanitizeOrder(order)).filter(Boolean)
          : [];
        setOrders(normalized);
      } catch (err) {
        console.error('CMS orders fetch error:', err);
        setError(err.message || 'Failed to load orders.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter;
      const matchesSearch = searchTerm
        ? order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((order) => order.status === 'pending').length;
    const processing = orders.filter((order) => order.status === 'processing').length;
    const completed = orders.filter((order) => order.status === 'completed').length;
    const revenue = orders.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0);

    return {
      total,
      pending,
      processing,
      completed,
      revenue,
    };
  }, [orders]);

  const closeDetailModal = () => {
    if (detailSaving) return;
    setDetailModalOpen(false);
    setDetailOrder(null);
    setDetailStatus('pending');
    setDetailError('');
    setDetailMessage('');
    setDetailLoading(false);
  };

  const openDetailModal = async (orderSummary) => {
    const summarySanitized = sanitizeOrder(orderSummary);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setDetailMessage('');
    setDetailSaving(false);
    setDetailOrder(sanitizeOrderDetail(orderSummary?.raw, summarySanitized));
    setDetailStatus(summarySanitized?.status || 'pending');

    try {
      const response = await fetch(`https://hitek-server-uu0f.onrender.com/api/orders/${orderSummary.id}`);
      if (!response.ok) {
        throw new Error('Failed to load order details.');
      }
      const data = await response.json();
      const detailed = sanitizeOrderDetail(data, summarySanitized);
      setDetailOrder(detailed);
      setDetailStatus(detailed.status);
    } catch (err) {
      console.error('Order detail fetch error:', err);
      setDetailError(err.message || 'Failed to load order details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDetailStatusChange = (event) => {
    setDetailStatus(event.target.value);
    setDetailMessage('');
    setDetailError('');
  };

  const handleDetailStatusUpdate = async () => {
    if (!detailOrder) return;

    const nextStatus = detailStatus || detailOrder.status;
    if (!nextStatus) return;

    setDetailSaving(true);
    setDetailError('');
    setDetailMessage('');

    try {
      const response = await fetch(`https://hitek-server-uu0f.onrender.com/api/orders/${detailOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update order status.');
      }

      const updated = sanitizeOrderDetail(payload, detailOrder);
      setDetailOrder(updated);
      setDetailStatus(updated.status);
      setDetailMessage('Status updated successfully.');

      setOrders((prev) =>
        prev.map((order) =>
          order.id === updated.id ? { ...order, status: updated.status, raw: { ...(order.raw || {}), status: updated.status } } : order,
        ),
      );
    } catch (err) {
      console.error('Order status update error:', err);
      setDetailError(err.message || 'Failed to update order status.');
    } finally {
      setDetailSaving(false);
    }
  };

  const renderAddressSection = (title, address) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wide">{title}</h4>
      {address?.name && <p className="text-sm font-semibold text-white">{address.name}</p>}
      {address?.lines?.length ? (
        <div className="text-xs text-white/70 space-y-1">
          {address.lines.map((line, index) => (
            <p key={`${title}-line-${index}`}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/60">Not provided</p>
      )}
      {(address?.phone || address?.email) && (
        <div className="text-xs text-white/60 space-y-1">
          {address.phone && <p>Phone: {address.phone}</p>}
          {address.email && <p>Email: {address.email}</p>}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
              <FiShoppingCart className="text-[#38bdf8]" /> Orders
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Order Management</h1>
            <p className="mt-1 text-sm text-slate-300">
              Track pending, processing, and completed orders. Resolve fulfillment tasks and update statuses in real-time.
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

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-white/10 bg-linear-to-br from-[#38bdf8] to-[#6366f1] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-wide text-white/80">Total Orders</p>
            <p className="mt-3 text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/70 mt-1">Orders synced from Supabase</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Pending</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.pending}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-linear-to-br from-[#f97316]/30 to-[#fb7185]/10 flex items-center justify-center text-[#fb7185]">
                <FiClock />
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">Awaiting payment or fulfillment</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Processing</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.processing}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-linear-to-br from-[#38bdf8]/30 to-[#6366f1]/10 flex items-center justify-center text-[#38bdf8]">
                <FiTruck />
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">Orders currently being fulfilled</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Revenue</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {stats.revenue > 0 ? `PKR ${stats.revenue.toLocaleString('en-PK')}` : 'n/a'}
                </p>
              </div>
              <span className="h-11 w-11 rounded-full bg-linear-to-br from-[#22c55e]/30 to-[#16a34a]/10 flex items-center justify-center text-[#22c55e]">
                <FiCheckCircle />
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">Total value of all orders</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3">
              <FiSearch className="text-slate-300" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by order number or customer..."
                className="bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition inline-flex items-center gap-2 ${
                  statusFilter === 'all'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <FiFilter />
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  statusFilter === 'pending'
                    ? 'bg-linear-to-r from-[#f97316] to-[#fb7185] text-white shadow-lg shadow-[#fb7185]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('processing')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  statusFilter === 'processing'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  statusFilter === 'completed'
                    ? 'bg-linear-to-r from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-[#22c55e]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-200">
                <FiRefreshCw className="animate-spin text-2xl" />
                <p className="text-sm">Loading order data...</p>
              </div>
            )}

            {error && !loading && (
              <div className="border border-red-400/30 bg-red-500/10 text-red-100 rounded-2xl p-6 flex gap-3 items-start">
                <FiAlertTriangle className="mt-1 text-xl" />
                <div>
                  <p className="text-sm font-semibold">Unable to load orders</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredOrders.length === 0 && (
              <div className="border border-white/10 bg-white/5 text-white/80 rounded-2xl p-6">
                <p className="text-sm font-semibold">No orders match your filters.</p>
                <p className="text-xs mt-1">Try adjusting your search or status selection.</p>
              </div>
            )}

            {!loading &&
              !error &&
              filteredOrders.map((order) => {
                const gradient = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <article
                    key={order.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetailModal(order)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDetailModal(order);
                      }
                    }}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-xl transition transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60"
                  >
                    <div className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-20 pointer-events-none`} />
                    <div className="relative p-6 grid gap-6 md:grid-cols-[1.5fr_1fr]">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                            <FiPackage />
                            Order #{order.orderNumber}
                          </span>
                          <span className="text-xs text-white/60">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString('en-PK', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : 'Unknown date'}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-white">{order.customerName}</p>
                          <p className="text-xs text-white/70">{order.email}</p>
                        </div>

                        <p className="text-xs text-white/70 max-w-2xl">
                          Order contains {order.itemCount} item{order.itemCount === 1 ? '' : 's'} with a total value of{' '}
                          <span className="font-semibold text-white">{formatCurrency(order.total)}</span>. Use the CMS dashboard to update fulfillment status, track analytics, and manage customer communications.
                        </p>
                      </div>

                      <div className="flex flex-col justify-between gap-4 text-sm text-white/80">
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-linear-to-r ${
                              STATUS_BADGE_BG[order.status] || 'from-[#38bdf8] to-[#6366f1]'
                            } text-white font-semibold uppercase text-xs tracking-wide shadow-md ${
                              STATUS_BADGE_SHADOW[order.status] || 'shadow-[#6366f1]/40'
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Total</span>
                          <span className="font-semibold text-white">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Items</span>
                          <span>{order.itemCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Order ID</span>
                          <span className="text-xs text-white/70">{order.id}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </div>
    </div>
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeDetailModal}
          />
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f172a]/95 shadow-[0_40px_120px_rgba(15,23,42,0.7)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0f172a]/95 px-6 py-5">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
                  <FiShoppingCart className="text-[#38bdf8]" />
                  Order Detail
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Order #{detailOrder?.orderNumber || detailOrder?.id || '—'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Placed on{' '}
                  {detailOrder?.createdAt
                    ? new Date(detailOrder.createdAt).toLocaleString('en-PK', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Unknown date'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-60"
                disabled={detailSaving}
              >
                <FiX className="text-lg" />
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            {detailLoading ? (
              <div className="px-6 py-16 text-center text-slate-200">
                <FiRefreshCw className="mx-auto mb-4 text-2xl animate-spin" />
                Loading order details...
              </div>
            ) : detailOrder ? (
              <div className="px-6 py-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">Status</span>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-linear-to-r ${
                          STATUS_BADGE_BG[detailOrder.status] || 'from-[#38bdf8] to-[#6366f1]'
                        } text-white font-semibold uppercase text-xs tracking-wide shadow-md ${
                          STATUS_BADGE_SHADOW[detailOrder.status] || 'shadow-[#6366f1]/40'
                        }`}
                      >
                        {detailOrder.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-white/80">
                      <div className="space-y-1">
                        <p className="text-white/60 text-xs uppercase tracking-wide">Customer</p>
                        <p className="font-semibold text-white">{detailOrder.customerName}</p>
                        <p className="text-xs text-white/60">{detailOrder.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/60 text-xs uppercase tracking-wide">Financials</p>
                        <p>Subtotal: {formatCurrency(detailOrder.subtotal)}</p>
                        <p>Tax: {formatCurrency(detailOrder.tax)}</p>
                        <p>Shipping: {formatCurrency(detailOrder.shippingCost)}</p>
                        <p className="font-semibold text-white">Total: {formatCurrency(detailOrder.total)}</p>
                      </div>
                    </div>
                    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between text-xs text-white/60 uppercase tracking-wide">
                        <span>Change Status</span>
                        {detailSaving && (
                          <span className="inline-flex items-center gap-1 text-[#38bdf8]">
                            <FiRefreshCw className="animate-spin" /> Saving...
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
                        <select
                          value={detailStatus}
                          onChange={handleDetailStatusChange}
                          disabled={detailSaving}
                          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60 disabled:opacity-60"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} className="text-black">
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleDetailStatusUpdate}
                          disabled={detailSaving}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-sm font-semibold text-white shadow-md shadow-[#6366f1]/40 hover:from-[#0ea5e9] hover:to-[#4338ca] transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Update
                        </button>
                      </div>
                      {detailError && (
                        <p className="text-xs text-red-300 bg-red-500/15 border border-red-400/30 rounded-lg px-3 py-2">
                          {detailError}
                        </p>
                      )}
                      {detailMessage && (
                        <p className="text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 rounded-lg px-3 py-2">
                          {detailMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-white/80">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wide">Payment</h4>
                      <p className="text-sm text-white">{detailOrder.paymentMethod || 'Not provided'}</p>
                      {detailOrder.notes && (
                        <p className="text-xs text-white/60">
                          Notes: <span className="text-white/80">{detailOrder.notes}</span>
                        </p>
                      )}
                    </div>
                    {renderAddressSection('Shipping Address', detailOrder.shippingAddress)}
                    {renderAddressSection('Billing Address', detailOrder.billingAddress)}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Items</h3>
                  {detailOrder.items && detailOrder.items.length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
                      {detailOrder.items.map((item) => (
                        <div key={item.id || `${item.name}-${item.productId}`} className="flex items-center justify-between px-5 py-3 text-sm text-white/80">
                          <div>
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-xs text-white/60">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">{formatCurrency(item.total || item.price)}</p>
                            <p className="text-xs text-white/60">Unit: {formatCurrency(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/60">No order items found.</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeDetailModal}
                    disabled={detailSaving}
                    className="px-5 py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-60"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-16 text-center text-slate-200">
                Failed to load order information.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CmsOrdersPage;

