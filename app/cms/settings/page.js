'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiUsers,
  FiRefreshCw,
  FiArrowLeft,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiAlertTriangle,
  FiShield,
  FiMail,
  FiUser,
} from 'react-icons/fi';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Full access to all CMS features' },
  { value: 'inventory_manager', label: 'Inventory Manager', description: 'Access to inventory and products pages' },
  { value: 'order_manager', label: 'Order Manager', description: 'Access to orders page only' },
];

const CmsSettingsPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'inventory_manager',
  });
  const [saving, setSaving] = useState(false);

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
      
      // Only admin users can access settings page (user management)
      if (parsedUser.role !== 'admin') {
        router.replace('/cms/dashboard');
        return;
      }
      
      fetchUsers();
    } catch (err) {
      console.error('Failed to parse CMS user', err);
      router.replace('/cms/auth/login');
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('https://hitek-server-uu0f.onrender.com/api/cms/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check response status
      if (!response.ok) {
        let errorMessage = 'Failed to load users';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse response
      let data;
      try {
        data = await response.json();
        console.log('CMS users response:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        console.warn('Unexpected response format:', data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch CMS users:', err);
      // Check if it's a network error
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to load users. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'inventory_manager',
    });
    setEditingUser(null);
    setError('');
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      password: '', // Don't pre-fill password
      role: user.role || 'inventory_manager',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`https://hitek-server-uu0f.onrender.com/api/cms/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate
      if (!formData.username) {
        setError('Username is required');
        setSaving(false);
        return;
      }

      if (showCreateModal && !formData.password) {
        setError('Password is required');
        setSaving(false);
        return;
      }

      if (formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setSaving(false);
        return;
      }

      const url = showEditModal
        ? `https://hitek-server-uu0f.onrender.com/api/cms/users/${editingUser.id}`
        : 'https://hitek-server-uu0f.onrender.com/api/cms/users';

      const method = showEditModal ? 'PUT' : 'POST';

      const body = { ...formData };
      // Don't send empty password on edit
      if (showEditModal && !body.password) {
        delete body.password;
      }
      // Remove full_name if it exists (column doesn't exist in database)
      delete body.full_name;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      // Success
      resetForm();
      setShowCreateModal(false);
      setShowEditModal(false);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return roleOption ? roleOption.label : role || 'Staff';
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-[#ef4444] to-[#f97316]',
      inventory_manager: 'from-[#22c55e] to-[#10b981]',
      order_manager: 'from-[#a855f7] to-[#6366f1]',
      staff: 'from-[#64748b] to-[#475569]',
    };
    return colors[role] || colors.staff;
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,29,149,0.25),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
              <FiUsers className="text-[#38bdf8]" /> User Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">CMS User Accounts</h1>
            <p className="mt-1 text-sm text-slate-300">
              Create, update, and manage CMS user accounts for your team members.
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
              onClick={fetchUsers}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/15 transition"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#6366f1]/30"
            >
              <FiPlus />
              Add User
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 text-red-100 p-4 flex gap-3 items-start">
            <FiAlertTriangle className="mt-1 text-xl shrink-0" />
            <div>
              <p className="text-sm font-semibold">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Users List */}
        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl shadow-2xl p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-200">
              <FiRefreshCw className="animate-spin text-2xl" />
              <p className="text-sm">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FiUsers className="text-4xl mx-auto mb-4 opacity-50" />
              <p className="text-sm font-semibold">No users found</p>
              <p className="text-xs mt-1">Click "Add User" to create your first CMS user</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center text-white">
                        <FiUser className="text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-sm font-semibold text-white">
                            {user.full_name || user.email || user.username || user.user_name || 'Unnamed User'}
                          </p>
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-semibold bg-linear-to-r ${getRoleColor(
                              user.role,
                            )} text-white`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-white/70">
                          {user.username && (
                            <span className="flex items-center gap-1">
                              <FiUser className="text-xs" />
                              {user.username}
                            </span>
                          )}
                          {user.accesspages && Array.isArray(user.accesspages) && (
                            <span className="text-white/50">
                              Access: {user.accesspages.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-white/10 transition text-white"
                        title="Edit user"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition text-red-300"
                        title="Delete user"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                className="relative w-full max-w-md bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border border-white/20 rounded-3xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border-b border-white/10 p-6 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {showEditModal ? 'Edit User' : 'Create New User'}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      {showEditModal ? 'Update user information' : 'Add a new CMS user account'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition text-white"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="rounded-lg border border-red-400/30 bg-red-500/10 text-red-100 p-3 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-white/60 mb-2">
                      Username <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60 transition"
                      placeholder="username"
                      required
                    />
                  </div>

                  

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-white/60 mb-2">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60 transition"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value} className="bg-[#1e1b4b]">
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-white/50 mt-1">
                      {ROLE_OPTIONS.find((r) => r.value === formData.role)?.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-white/60 mb-2">
                      Password {showEditModal && '(leave empty to keep current)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60 transition"
                      placeholder={showEditModal ? 'Enter new password' : 'Enter password'}
                      required={!showEditModal}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-3 rounded-lg border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-3 rounded-lg bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-white text-sm font-semibold transition shadow-lg shadow-[#6366f1]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <FiRefreshCw className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave />
                          {showEditModal ? 'Update User' : 'Create User'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CmsSettingsPage;
