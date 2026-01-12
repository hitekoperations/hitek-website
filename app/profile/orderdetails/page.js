'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FiArrowLeft,
  FiTruck,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiAlertCircle,
  FiShoppingBag,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  FaRegUser,
  FaClipboardList,
  FaTruck,
  FaShoppingCart,
  FaRegHeart,
  FaAddressCard,
  FaHistory,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import Navbar from '../../Cx/Layout/Navbar';
import Footer from '../../Cx/Layout/Footer';
import { openSans } from '../../Cx/Font/font';

const STATUS_STEPS = [
  { id: 'placed', label: 'Order Placed', icon: FiShoppingBag },
  { id: 'processing', label: 'Packaging', icon: FiPackage },
  { id: 'in_transit', label: 'On The Road', icon: FiTruck },
  { id: 'delivered', label: 'Delivered', icon: FiCheckCircle },
];

const activityIconMap = {
  placed: FiCheckCircle,
  processing: FiPackage,
  in_transit: FiTruck,
  delivered: FiCheckCircle,
};

const navigationItems = [
  { label: 'Dashboard', icon: <FaRegUser />, href: '/profile' },
  { label: 'Order History', icon: <FaClipboardList />, href: '/profile' },
  { label: 'Track Order', icon: <FaTruck />, href: '/profile' },
  { label: 'Shopping Cart', icon: <FaShoppingCart />, href: '/profile' },
  { label: 'Wishlist', icon: <FaRegHeart />, href: '/profile' },
  { label: 'Cards & Address', icon: <FaAddressCard />, href: '/profile' },
  { label: 'Browsing History', icon: <FaHistory />, href: '/profile' },
  { label: 'Setting', icon: <FaCog />, href: '/profile' },
  { label: 'Log out', icon: <FaSignOutAlt /> },
];

const normalizeStatus = (status) => {
  if (!status) return 'placed';
  const normalized = status.toString().toLowerCase();
  if (normalized.includes('deliver')) return 'delivered';
  if (normalized.includes('road') || normalized.includes('transit') || normalized.includes('ship')) {
    return 'in_transit';
  }
  if (normalized.includes('pack') || normalized.includes('process')) return 'processing';
  return 'placed';
};

const normalizeAddress = (address, fallbackName = '') => {
  if (!address) {
    return {
      name: fallbackName,
      lines: [],
      phone: '',
      email: '',
    };
  }

  if (typeof address === 'string') {
    const lines = address
      .split(/\r?\n|,/)
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      name: fallbackName,
      lines,
      phone: '',
      email: '',
    };
  }

  const cityLine = [address.city, address.state, address.postal_code]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');

  const lines = [address.line1, address.line2, cityLine, address.country]
    .filter((line) => typeof line === 'string' && line.trim())
    .map((line) => line.trim());

  return {
    name: address.name || fallbackName,
    lines,
    phone: address.phone || '',
    email: address.email || '',
  };
};

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return `PKR ${numeric.toLocaleString('en-PK')}`;
};

const formatDate = (value, withTime = true) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: withTime ? 'short' : undefined,
  });
};

const sanitizeOrder = (raw) => {
  if (!raw) return null;
  const status = normalizeStatus(raw.status || raw.order_status);
  const activity =
    Array.isArray(raw.activity) && raw.activity.length
      ? raw.activity
      : [
          {
            id: 'placed',
            timestamp: raw.created_at,
            label: 'Your order has been placed successfully. Thank you for shopping with us!',
            completed: true,
          },
          {
            id: 'processing',
            timestamp: raw.created_at,
            label: 'Our warehouse team is packaging your order carefully.',
            completed: status !== 'placed',
          },
          {
            id: 'in_transit',
            timestamp: raw.expected_delivery,
            label: 'Your order is on the road. Sit tight—your package is almost there!',
            completed: status === 'in_transit' || status === 'delivered',
          },
          {
            id: 'delivered',
            timestamp: raw.expected_delivery,
            label: 'Your order has been delivered successfully. We hope you enjoy your purchase.',
            completed: status === 'delivered',
          },
        ];

  const resolvedItems = Array.isArray(raw.order_items)
    ? raw.order_items.map((item) => {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
        const safePrice = Number.isFinite(price) ? price : 0;
        const metadata = item.metadata || {};
        const fallbackImage =
          (metadata?.category || item.category || '').toLowerCase().includes('printer')
            ? '/printer-category.png'
            : '/laptop-category.jpg';

        return {
          ...item,
          name: item.name || item.product_name || metadata.name || 'Product',
          description: item.description || metadata.description || '',
          price: safePrice,
          quantity: safeQuantity,
          subtotal: safePrice * safeQuantity,
          image: item.image || metadata.image || fallbackImage,
        };
      })
    : [];

  return {
    id: raw.id,
    orderNumber: raw.order_number || raw.id,
    items: resolvedItems,
    total: raw.total || raw.totalamount || 0,
    subtotal: raw.subtotal || 0,
    tax: raw.tax || 0,
    shippingCost: raw.shipping || 0,
    status,
    expectedDelivery: raw.expected_delivery || raw.expectedDelivery || null,
    placedAt: raw.created_at || raw.createdAt || null,
    activity,
    billing: normalizeAddress(raw.billing_address || raw.billingAddress || raw.billing, raw.customer_name || raw.user?.name || ''),
    shipping: normalizeAddress(raw.shipping_address || raw.shippingAddress || raw.shipping, raw.customer_name || raw.user?.name || ''),
    notes: raw.notes || raw.order_notes || 'No special instructions provided.',
    customer: raw.user || {
      name: raw.customer_name || 'Customer',
      email: raw.user_email || raw.email || '',
      phone: raw.user_phone || raw.phone || '',
    },
  };
};

const generateActivity = (order) => {
  if (!order) return [];
  if (Array.isArray(order.activity) && order.activity.length) return order.activity;

  const steps = [
    {
      id: 'placed',
      label: 'Your order was placed.',
      timestamp: order.placedAt,
    },
    {
      id: 'processing',
      label: 'Your order is being prepared for packaging.',
      timestamp: order.placedAt,
    },
    {
      id: 'in_transit',
      label: 'Your order is on the road.',
      timestamp: order.expectedDelivery,
    },
    {
      id: 'delivered',
      label: 'Your order was delivered successfully.',
      timestamp: order.expectedDelivery,
    },
  ];

  const statusIndex = STATUS_STEPS.findIndex((item) => item.id === order.status);
  return steps.map((step, index) => ({
    ...step,
    completed: index <= statusIndex,
  }));
};

const OrderDetailsPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('No order selected.');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
      const response = await fetch(`https://hitek-server.onrender.com/api/orders/${orderId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Order not found.');
          }
          throw new Error('Failed to load order details.');
        }
        const data = await response.json();
        setOrder(sanitizeOrder(data));
      } catch (err) {
        console.error('Order details fetch error:', err);
        setError(err.message || 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const timeline = useMemo(() => {
    if (!order) return STATUS_STEPS.map((step) => ({ ...step, completed: false, current: false }));
    const statusIndex = STATUS_STEPS.findIndex((item) => item.id === order.status);
    return STATUS_STEPS.map((step, index) => ({
      ...step,
      completed: statusIndex >= 0 ? index <= statusIndex : false,
      current: statusIndex >= 0 ? index === statusIndex : index === 0,
    }));
  }, [order]);

  const progressPercent = useMemo(() => {
    if (!order || !timeline.length) return 0;
    const activeIndex = timeline.findIndex((step) => step.current);
    const completedIndex = activeIndex >= 0 ? activeIndex : timeline.findIndex((step) => step.completed);
    if (completedIndex <= 0) return completedIndex === 0 ? 12 : 0;
    const denominator = Math.max(1, timeline.length - 1);
    return Math.min(100, (completedIndex / denominator) * 100);
  }, [order, timeline]);

  const activityLog = useMemo(() => generateActivity(order), [order]);

  const productCountLabel = order ? String(order.items.length || 0).padStart(2, '0') : '00';

  const activeNavLabel = 'Order History';

  const handleNavItemClick = (item, routerInstance) => {
    if (item.label === 'Log out') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('user');
        window.location.href = '/';
      }
      return;
    }

    if (item.href) {
      routerInstance.push(item.href);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            <FiArrowLeft className="text-base" />
            Order Details
          </button>
          <Link
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition"
          >
            Leave a Rating <span className="text-lg leading-none">+</span>
          </Link>
        </div>

        {loading && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-12 text-center text-gray-500">
            <FiRefreshCw className="mx-auto text-2xl animate-spin mb-3" />
            Loading order details...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-3xl shadow-sm p-12 text-center text-red-500">
            <FiAlertCircle className="mx-auto text-2xl mb-3" />
            {error}
          </div>
        )}

        {!loading && !error && !order && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-12 text-center text-gray-500">
            Order details are unavailable right now. Please try again later.
          </div>
        )}

        {!loading && !error && order && (
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 sm:px-10 py-8 space-y-10">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    Order #{order.orderNumber}
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    {order.items.length} Product{order.items.length === 1 ? '' : 's'} • Order placed on{' '}
                    <span className="font-semibold text-gray-900">{formatDate(order.placedAt)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total amount
                  </p>
                  <p className="text-3xl font-bold text-blue-500 mt-2">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600">
                    Order expected arrival{' '}
                    <span className="font-semibold text-gray-900">
                      {formatDate(order.expectedDelivery, false)}
                    </span>
                  </p>
                  <div className="mt-6 px-2">
                    <div className="relative h-1 bg-blue-100 rounded-full">
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-6 grid grid-cols-4 gap-4">
                      {timeline.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <div key={step.id} className="flex flex-col items-center gap-3 text-center">
                            <span
                              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                                step.completed
                                  ? 'border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-200'
                                  : 'border-blue-100 bg-white text-blue-200'
                              }`}
                            >
                              <Icon className="text-lg" />
                            </span>
                            <span
                              className={`text-xs font-semibold uppercase tracking-wide ${
                                step.completed ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Activity</h2>
                  <div className="space-y-3">
                    {activityLog.map((entry, index) => {
                      const Icon = activityIconMap[entry.id] || FiClock;
                      const isComplete = entry.completed;
                      return (
                        <div
                          key={entry.id || index}
                          className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <span
                            className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full border ${
                              isComplete
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-500'
                                : 'border-gray-200 bg-white text-gray-400'
                            }`}
                          >
                            <Icon className="text-lg" />
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{entry.label}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(entry.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Product ({productCountLabel})
                    </h2>
                    <p className="text-sm text-gray-500">
                      Review the products included in this order.
                    </p>
                  </div>
                  <div className="overflow-hidden border border-gray-200 rounded-2xl">
                    <table className="min-w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold">Products</th>
                          <th className="px-5 py-3 text-left font-semibold">Price</th>
                          <th className="px-5 py-3 text-left font-semibold">Quantity</th>
                          <th className="px-5 py-3 text-right font-semibold">Sub-total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {order.items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 max-w-md">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700">
                              x{item.quantity}
                            </td>
                            <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 w-full md:w-72 ml-auto space-y-1 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(order.subtotal || order.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tax</span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(order.tax)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(order.shippingCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2 text-base font-semibold text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Billing Address
                    </h3>
                    <div className="text-sm text-gray-700 leading-6 space-y-1">
                      {order.billing?.name && (
                        <p className="font-semibold text-gray-900">{order.billing.name}</p>
                      )}
                      {Array.isArray(order.billing?.lines) && order.billing.lines.length > 0 ? (
                        order.billing.lines.map((line, index) => <p key={index}>{line}</p>)
                      ) : (
                        <p className="text-gray-500">No billing address provided.</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      {(order.billing?.phone || order.customer?.phone) && (
                        <p className="flex items-center gap-2">
                          <FiPhone /> {order.billing?.phone || order.customer?.phone}
                        </p>
                      )}
                      {(order.billing?.email || order.customer?.email) && (
                        <p className="flex items-center gap-2">
                          <FiMail /> {order.billing?.email || order.customer?.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Shipping Address
                    </h3>
                    <div className="text-sm text-gray-700 leading-6 space-y-1">
                      {order.shipping?.name && (
                        <p className="font-semibold text-gray-900">{order.shipping.name}</p>
                      )}
                      {Array.isArray(order.shipping?.lines) && order.shipping.lines.length > 0 ? (
                        order.shipping.lines.map((line, index) => <p key={index}>{line}</p>)
                      ) : (
                        <p className="text-gray-500">No shipping address provided.</p>
                      )}
                    </div>
                    {order.shipping?.phone && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="flex items-center gap-2">
                          <FiPhone /> {order.shipping.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Order Notes
                    </h3>
                    <p className="text-sm text-gray-700 leading-6">
                      {order.notes ||
                        'No special instructions provided for this order. Add a note next time to tell us about delivery preferences or gift messages.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderDetailsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">
          <div className="flex flex-col items-center gap-3">
            <FiRefreshCw className="text-2xl animate-spin" />
            <p className="text-sm font-semibold">Loading order details…</p>
          </div>
        </div>
      }
    >
      <OrderDetailsPageContent />
    </Suspense>
  );
};

export default OrderDetailsPage;

