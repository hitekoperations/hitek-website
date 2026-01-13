'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiBox,
  FiShoppingCart,
  FiPackage,
  FiUser,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiX,
  FiInfo,
} from 'react-icons/fi';

const CmsRecentActivityPage = () => {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
      
      // Only admin users can access activity page
      if (parsedUser.role !== 'admin') {
        router.replace('/cms/dashboard');
        return;
      }
    } catch (err) {
      console.error('Failed to parse CMS user', err);
      router.replace('/cms/auth/login');
    }

    fetchActivities();
  }, [router]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('https://hitek-server-uu0f.onrender.com/api/cms/activities');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map API data to display format
      const mappedActivities = (data || []).map((activity) => {
        // Determine icon and color based on activity type
        let icon = FiClock;
        let color = 'from-[#6366f1] to-[#8b5cf6]';
        
        switch (activity.type) {
          case 'product_created':
            icon = FiPlus;
            color = 'from-[#22c55e] to-[#10b981]';
            break;
          case 'product_updated':
            icon = FiEdit2;
            color = 'from-[#f97316] to-[#fb7185]';
            break;
          case 'product_deleted':
            icon = FiTrash2;
            color = 'from-[#ef4444] to-[#f97316]';
            break;
          case 'order_fulfilled':
            icon = FiCheckCircle;
            color = 'from-[#0ea5e9] to-[#38bdf8]';
            break;
          case 'order_cancelled':
            icon = FiXCircle;
            color = 'from-[#f97316] to-[#fb7185]';
            break;
          case 'order_updated':
            icon = FiEdit2;
            color = 'from-[#0ea5e9] to-[#38bdf8]';
            break;
          case 'inventory_updated':
            icon = FiPackage;
            color = 'from-[#a855f7] to-[#6366f1]';
            break;
          case 'user_created':
            icon = FiUser;
            color = 'from-[#6366f1] to-[#8b5cf6]';
            break;
          case 'bulk_import':
            icon = FiBox;
            color = 'from-[#10b981] to-[#059669]';
            break;
          default:
            icon = FiClock;
            color = 'from-[#6366f1] to-[#8b5cf6]';
        }
        
        return {
          ...activity,
          icon,
          color,
          user: activity.user_name || activity.user_role || 'System',
        };
      });

      setActivities(mappedActivities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Parse the timestamp - ensure it's treated as UTC/ISO format
      let date;
      if (typeof timestamp === 'string') {
        // If timestamp doesn't have timezone info, assume it's UTC
        if (timestamp.endsWith('Z') || timestamp.includes('+') || timestamp.includes('-', 10)) {
          date = new Date(timestamp);
        } else {
          // If no timezone, append Z to treat as UTC
          date = new Date(timestamp + (timestamp.includes('T') ? 'Z' : ''));
        }
      } else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return 'Invalid date';
      }
      
      const now = new Date();
      
      // Calculate difference in milliseconds
      // Both dates are in UTC internally, so this should be correct
      const diffInMs = now.getTime() - date.getTime();
      
      // Handle negative differences (future dates) - might be timezone issue
      if (diffInMs < 0) {
        // If negative but less than 1 hour, might be timezone offset, treat as "just now"
        if (Math.abs(diffInMs) < 3600000) {
          return 'Just now';
        }
        return 'Just now'; // For safety, treat future dates as "just now"
      }
      
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (err) {
      console.error('Error formatting timestamp:', err, timestamp);
      return 'Unknown';
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,29,149,0.25),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300 hover:text-[#38bdf8] transition mb-4"
            >
              <FiArrowLeft className="text-[#38bdf8]" /> Back to Dashboard
            </Link>
            <br/>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
              <FiClock className="text-[#38bdf8]" /> Activity Log
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Recent Activity</h1>
            <p className="mt-1 text-sm text-slate-300">
              View all recent actions and changes in your CMS system.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={fetchActivities}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/15 transition"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 text-red-100 p-4 flex gap-3 items-start">
            <FiXCircle className="mt-1 text-xl shrink-0" />
            <div>
              <p className="text-sm font-semibold">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Activities List */}
        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl shadow-2xl p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-200">
              <FiRefreshCw className="animate-spin text-2xl" />
              <p className="text-sm">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FiClock className="text-4xl mx-auto mb-4 opacity-50" />
              <p className="text-sm font-semibold">No activities found</p>
              <p className="text-xs mt-1">Activity will appear here as actions are performed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = activity.icon || FiClock;
                return (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setShowModal(true);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-full bg-linear-to-br ${activity.color} flex items-center justify-center text-white shrink-0`}>
                        <Icon className="text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white mb-1">
                          {activity.action || activity.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/70">
                          <span className="flex items-center gap-1">
                            <FiUser className="text-xs" />
                            {activity.user_name || activity.user_role || 'System'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="text-xs" />
                            {formatTimestamp(activity.created_at || activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Detail Modal */}
      {showModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-linear-to-br from-[#1e1b4b] to-[#0f172a] rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-linear-to-r from-[#1e1b4b] to-[#0f172a] border-b border-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full bg-linear-to-br ${selectedActivity.color} flex items-center justify-center text-white`}>
                  {React.createElement(selectedActivity.icon || FiClock, { className: 'text-lg' })}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Activity Details</h2>
                  <p className="text-xs text-slate-400">{selectedActivity.type?.replace(/_/g, ' ').toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedActivity(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Action */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Action</h3>
                <p className="text-white">{selectedActivity.action}</p>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">User</h3>
                  <p className="text-white">{selectedActivity.user_name || selectedActivity.user_role || 'System'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Role</h3>
                  <p className="text-white">{selectedActivity.user_role || 'N/A'}</p>
                </div>
              </div>

              {/* Entity Info */}
              {selectedActivity.entity_name && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Entity</h3>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <p className="text-white font-medium">{selectedActivity.entity_name}</p>
                    {selectedActivity.entity_id && (
                      <p className="text-xs text-slate-400">ID: {selectedActivity.entity_id}</p>
                    )}
                    {selectedActivity.entity_type && (
                      <p className="text-xs text-slate-400">Type: {selectedActivity.entity_type}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Details */}
              {selectedActivity.details && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Details</h3>
                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    {(() => {
                      const details = selectedActivity.details;
                      const type = selectedActivity.type;
                      
                      // Format based on activity type
                      if (type === 'product_updated' && details.changes) {
                        return (
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Fields Updated:</p>
                              <div className="flex flex-wrap gap-2">
                                {details.changes.map((field, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-[#00aeef]/20 text-[#00aeef] rounded text-xs">
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {details.brand && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Brand:</p>
                                <p className="text-white">{details.brand}</p>
                              </div>
                            )}
                            {details.price && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Price:</p>
                                <p className="text-white">PKR {details.price}</p>
                              </div>
                            )}
                            {details.stock !== undefined && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Stock:</p>
                                <p className="text-white">{details.stock} units</p>
                              </div>
                            )}
                            {details.category && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Category:</p>
                                <p className="text-white capitalize">{details.category}</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (type === 'product_created' || type === 'product_updated') {
                        return (
                          <div className="space-y-2">
                            {details.category && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Category:</p>
                                <p className="text-white capitalize">{details.category}</p>
                              </div>
                            )}
                            {details.brand && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Brand:</p>
                                <p className="text-white">{details.brand}</p>
                              </div>
                            )}
                            {details.price && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Price:</p>
                                <p className="text-white">PKR {details.price}</p>
                              </div>
                            )}
                            {details.stock !== undefined && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Stock:</p>
                                <p className="text-white">{details.stock} units</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (type === 'order_fulfilled' || type === 'order_cancelled' || type === 'order_updated') {
                        return (
                          <div className="space-y-2">
                            {details.orderId && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Order ID:</p>
                                <p className="text-white">#{details.orderId}</p>
                              </div>
                            )}
                            {details.previousStatus && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Previous Status:</p>
                                <p className="text-white capitalize">{details.previousStatus}</p>
                              </div>
                            )}
                            {details.newStatus && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">New Status:</p>
                                <p className="text-white capitalize">{details.newStatus}</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (type === 'bulk_import') {
                        return (
                          <div className="space-y-2">
                            {details.count && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Products Imported:</p>
                                <p className="text-white font-semibold">{details.count}</p>
                              </div>
                            )}
                            {details.category && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Category:</p>
                                <p className="text-white capitalize">{details.category}</p>
                              </div>
                            )}
                            {details.attempted && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Total Attempted:</p>
                                <p className="text-white">{details.attempted}</p>
                              </div>
                            )}
                            {details.failed !== undefined && details.failed > 0 && (
                              <div>
                                <p className="text-xs text-slate-400 mb-1">Failed:</p>
                                <p className="text-red-400">{details.failed}</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Fallback to JSON for unknown types
                      return (
                        <pre className="text-sm text-white whitespace-pre-wrap font-sans">
                          {JSON.stringify(details, null, 2)}
                        </pre>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Timestamp</h3>
                <div className="flex items-center gap-2 text-white">
                  <FiClock className="text-slate-400" />
                  <span>{formatTimestamp(selectedActivity.created_at || selectedActivity.timestamp)}</span>
                  <span className="text-slate-400 text-xs ml-2">
                    ({new Date(selectedActivity.created_at || selectedActivity.timestamp).toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsRecentActivityPage;

