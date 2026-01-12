'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiUsers,
  FiRefreshCw,
  FiSearch,
  FiArrowLeft,
  FiAlertTriangle,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiX,
  FiPackage,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';

const PAGE_SIZE = 5;

const sanitizeUser = (user) => {
  if (!user) return null;

  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  const fullName = user.full_name || user.fullName || user.name || `${firstName} ${lastName}`.trim();

  return {
    id: user.id?.toString?.() ?? user.id,
    fullName: fullName && fullName.trim() ? fullName.trim() : 'Unnamed User',
    email: user.email || user.user_email || 'Not provided',
    phone: user.phone || user.contact || 'Not provided',
    address: user.address || user.shipping_address || user.billing_address || 'Not provided',
    orders: Number(user.totalorders ?? user.orders ?? 0) || 0,
    status: user.status || 'active',
    createdAt: user.created_at || user.createdAt || null,
    raw: user,
  };
};

const CmsCustomersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 3;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = window.localStorage.getItem('cmsUser');
    const storedSession = window.localStorage.getItem('cmsSession');

    if (!storedUser || !storedSession) {
      router.replace('/cms/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('https://hitek-server.onrender.com/api/users');
        if (!response.ok) throw new Error('Failed to load customers');
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((entry) => sanitizeUser(entry)).filter(Boolean)
          : [];
        setUsers(normalized);
      } catch (err) {
        console.error('CMS customers fetch error:', err);
        setError(err.message || 'Failed to load customers.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(lower) ||
        user.email.toLowerCase().includes(lower) ||
        user.address.toLowerCase().includes(lower)
      );
    });
  }, [users, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setOrdersPage(1);
    setLoadingOrders(true);
    setUserOrders([]);

    try {
      const response = await fetch(`https://hitek-server.onrender.com/api/orders?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      const orders = Array.isArray(data) ? data : [];
      setUserOrders(orders);
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setUserOrders([]);
    setOrdersPage(1);
  };

  const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    return `PKR ${numeric.toLocaleString('en-PK')}`;
  };

  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    const normalized = status.toString().toLowerCase();
    if (normalized.includes('cancel')) return 'cancelled';
    if (normalized.includes('complete')) return 'completed';
    if (normalized.includes('process')) return 'processing';
    return 'pending';
  };

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    const colors = {
      pending: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[normalized] || colors.pending;
  };

  const totalOrdersPages = Math.max(1, Math.ceil(userOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ORDERS_PER_PAGE;
    return userOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [userOrders, ordersPage]);

  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.20),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
              <FiUsers className="text-[#38bdf8]" /> Customers
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Customer Directory</h1>
            <p className="mt-1 text-sm text-slate-300">
              Browse every user registered on your hi-tech storefront. Use search and pagination to manage your customer base.
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
                placeholder="Search by name, email, or address..."
                className="bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-300">
              Showing {paginatedUsers.length} of {filteredUsers.length} customers
            </div>
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-200">
                <FiRefreshCw className="animate-spin text-2xl" />
                <p className="text-sm">Loading customers...</p>
              </div>
            )}

            {error && !loading && (
              <div className="border border-red-400/30 bg-red-500/10 text-red-100 rounded-2xl p-6 flex gap-3 items-start">
                <FiAlertTriangle className="mt-1 text-xl" />
                <div>
                  <p className="text-sm font-semibold">Unable to load customers</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredUsers.length === 0 && (
              <div className="border border-white/10 bg-white/5 text-white/80 rounded-2xl p-6">
                <p className="text-sm font-semibold">No users found.</p>
                <p className="text-xs mt-1">Try adjusting your search query.</p>
              </div>
            )}

            {!loading &&
              !error &&
              paginatedUsers.map((user) => (
                <article
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-xl cursor-pointer hover:border-white/20 hover:bg-white/15 transition"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-white/5 opacity-45 pointer-events-none" />
                  <div className="relative p-6 grid gap-4 md:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center text-white">
                          <FiUser />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{user.fullName}</p>
                          <p className="text-xs text-white/70">User ID: {user.id}</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-xs text-white/70">
                        <div className="flex items-center gap-2">
                          <FiMail />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPhone />
                          <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <FiMapPin />
                          <span className="line-clamp-2">{user.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-3 text-sm text-white/80">
                      <div className="flex items-center justify-between">
                        <span>Total Orders</span>
                        <span className="font-semibold text-white">{user.orders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        <span className="inline-flex px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs uppercase tracking-wide">
                          {user.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Joined</span>
                        <span>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          {filteredUsers.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="text-xs text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border border-white/20 rounded-3xl shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border-b border-white/10 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold text-white">User Details</h2>
                  <p className="text-sm text-slate-300 mt-1">ID: {selectedUser.id}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition text-white"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Information */}
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiUser />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Full Name</p>
                      <p className="text-white font-medium">{selectedUser.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Email</p>
                      <p className="text-white flex items-center gap-2">
                        <FiMail className="text-sm" />
                        {selectedUser.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Phone</p>
                      <p className="text-white flex items-center gap-2">
                        <FiPhone className="text-sm" />
                        {selectedUser.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <span className="inline-flex px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs uppercase tracking-wide text-white">
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-400 mb-1">Address</p>
                      <p className="text-white flex items-start gap-2">
                        <FiMapPin className="text-sm mt-1" />
                        {selectedUser.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Joined</p>
                      <p className="text-white flex items-center gap-2">
                        <FiCalendar className="text-sm" />
                        {selectedUser.createdAt
                          ? new Date(selectedUser.createdAt).toLocaleDateString('en-PK', {
                              dateStyle: 'long',
                            })
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Total Orders</p>
                      <p className="text-white font-semibold text-lg">{selectedUser.orders}</p>
                    </div>
                  </div>
                </section>

                {/* Orders Section */}
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiPackage />
                    Order History ({userOrders.length})
                  </h3>

                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <FiRefreshCw className="animate-spin text-2xl text-slate-400" />
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <FiPackage className="text-4xl mx-auto mb-2 opacity-50" />
                      <p>No orders found for this user</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {paginatedOrders.map((order) => {
                          const status = normalizeStatus(order.status);
                          const total = Number(order.total_amount || order.total || 0);
                          const orderDate = order.created_at
                            ? new Date(order.created_at).toLocaleString('en-PK', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Unknown date';

                          return (
                            <div
                              key={order.id}
                              className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="text-white font-semibold">
                                    Order #{order.id}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                    <FiCalendar className="text-xs" />
                                    {orderDate}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-semibold flex items-center gap-2">
                                    
                                    {formatCurrency(total)}
                                  </p>
                                  <span
                                    className={`inline-flex px-2 py-1 rounded text-xs uppercase mt-1 border ${getStatusColor(
                                      status,
                                    )}`}
                                  >
                                    {status}
                                  </span>
                                </div>
                              </div>

                              {order.order_items && Array.isArray(order.order_items) && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  <p className="text-xs text-slate-400 mb-2">
                                    Items ({order.order_items.length}):
                                  </p>
                                  <div className="space-y-1">
                                    {order.order_items.slice(0, 3).map((item, idx) => (
                                      <p
                                        key={idx}
                                        className="text-sm text-slate-300"
                                      >
                                        • {item.product_name || item.name || 'Unknown Product'} x
                                        {item.quantity || 1}
                                      </p>
                                    ))}
                                    {order.order_items.length > 3 && (
                                      <p className="text-xs text-slate-400">
                                        +{order.order_items.length - 3} more items
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Orders Pagination */}
                      {userOrders.length > ORDERS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
                          <button
                            onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                            disabled={ordersPage === 1}
                            className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-xs text-slate-300">
                            Page {ordersPage} of {totalOrdersPages}
                          </span>
                          <button
                            onClick={() =>
                              setOrdersPage((p) => Math.min(totalOrdersPages, p + 1))
                            }
                            disabled={ordersPage === totalOrdersPages}
                            className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CmsCustomersPage;

