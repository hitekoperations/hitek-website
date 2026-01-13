'use client';

import React, { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import { openSans } from '../Font/font';
import { supabase } from '../../lib/supabase';

const LoginPopup = ({ isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      try {
        let response;
        try {
          response = await fetch('https://hitek-server-uu0f.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.trim(),
              password: password,
            }),
          });
        } catch (fetchError) {
          // Network error - backend server not reachable
          if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch')) {
            console.error('Backend server not reachable:', fetchError);
            setError('Backend server is not running. Please start the server with: npm run server');
            setLoading(false);
            return;
          }
          throw fetchError;
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse response:', jsonError);
          setError('Invalid response from server. Please check if the server is running correctly.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          // Show the specific error from backend
          const errorMessage = data.error || 'Backend authentication failed';
          console.error('Backend login error:', errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }

        // Backend login successful
        setSuccess(true);
        setError('');
        
        // Store user data in localStorage or context
        if (data.user || data.userData) {
          localStorage.setItem('user', JSON.stringify(data.user || data.userData));
          localStorage.setItem('session', JSON.stringify(data.session));
        }

        // Close popup after successful login
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setEmail('');
          setPassword('');
          window.location.reload();
        }, 1000);
        return;
      } catch (backendError) {
        // If backend is not available (connection error), show helpful message
        if (backendError.name === 'TypeError' || backendError.message.includes('fetch')) {
          console.error('Backend server not reachable:', backendError);
          setError('Backend server is not running. Please start the server with: npm run server');
          setLoading(false);
          return;
        }
        
        // If backend is not available, try Supabase Auth
        console.log('Backend login failed, trying Supabase Auth...', backendError);
        
        if (!supabase) {
          setError('Authentication service is not available. Please check your configuration.');
          setLoading(false);
          return;
        }

        // Fallback to Supabase Auth
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (signInError) {
          setError(signInError.message || 'Invalid email or password');
          setLoading(false);
          return;
        }

        if (authData.user) {
          setSuccess(true);
          setError('');
          
          // Fetch user data from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (userError && userError.code !== 'PGRST116') {
            console.error('Error fetching user data:', userError);
          }

          // Store user data
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          if (authData.session) {
            localStorage.setItem('session', JSON.stringify(authData.session));
          }

          // Close popup after successful login
          setTimeout(() => {
            onClose();
            setSuccess(false);
            setEmail('');
            setPassword('');
            window.location.reload();
          }, 1000);
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }

    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email');
      } else {
        setError('');
        alert('Password reset email sent! Please check your inbox.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`absolute top-full right-0 mt-2 w-96 bg-white rounded-sm shadow-2xl z-50 border border-gray-200 ${openSans.className}`}
      onMouseEnter={(e) => {
        e.stopPropagation();
        // Keep popup open when hovering over it
      }}
      onMouseLeave={(e) => {
        // Only close if not moving to parent or bridge
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onClose();
        }
      }}
    >
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
          Sign in to your account
        </h3>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-sm">
            <p className="text-sm text-green-600">Login successful! Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border text-black border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <a
                href="#"
                className="text-sm text-[#00aeef] hover:underline"
                onClick={handleForgotPassword}
              >
                Forgot Password
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-10 text-black border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? (
                  <FaRegEyeSlash className="text-lg" />
                ) : (
                  <FaRegEye className="text-lg" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-sm font-bold flex items-center justify-center gap-2 transition mb-4"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
            {!loading && <FiArrowRight />}
          </button>
        </form>

        {/* Create Account Section */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">Don't have account</p>
          <button
            onClick={() => {
              window.location.href = '/accounts/signup';
            }}
            className="w-full border-2 border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white py-3 rounded-sm font-bold transition"
            disabled={loading}
          >
            CREATE ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
