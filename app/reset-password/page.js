'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { openSans } from '../Cx/Font/font';
import { supabase } from '../lib/supabase';

const ResetPasswordPage = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Extract hash parameters from URL
    const hash = window.location.hash.substring(1); // Remove the #
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');

    // Check if this is a recovery token
    if (type !== 'recovery' || !accessToken) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      setCheckingToken(false);
      return;
    }

    // Decode JWT to get email (basic decode without verification)
    try {
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      const userEmail = decoded.email;

      if (userEmail) {
        setEmail(userEmail);
        setTokenValid(true);
      } else {
        setError('Unable to extract email from reset token. Please request a new password reset link.');
      }
    } catch (err) {
      console.error('Error decoding token:', err);
      setError('Invalid reset token. Please request a new password reset link.');
    } finally {
      setCheckingToken(false);
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, update password using Supabase Auth (if available)
      if (supabase) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          // Set the session with the recovery token
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (!sessionError && sessionData.session) {
            // Update password using Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
              password: password.trim(),
            });

            if (!updateError) {
              setSuccess(true);
              setError('');
              // Redirect to login after 2 seconds
              setTimeout(() => {
                router.push('/accounts/signin');
              }, 2000);
              setLoading(false);
              return;
            } else {
              console.error('Supabase password update error:', updateError);
            }
          } else {
            console.error('Supabase session error:', sessionError);
          }
        }
      }

      // Fallback to backend API
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hitek-server-uu0f.onrender.com';
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        setError('Server returned an invalid response. Please try again.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess(true);
        setError('');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/accounts/signin');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className={`min-h-screen flex flex-col ${openSans.className}`}>
        <Navbar />
        <main className="grow bg-gray-50 py-16 flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600">Verifying reset token...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={`min-h-screen flex flex-col ${openSans.className}`}>
        <Navbar />
        <div className={`sticky top-0 z-40 bg-gray-100 border-b border-gray-200 shadow-sm ${openSans.className}`}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-[#00aeef] transition">
                Home
              </Link>
              <span className="text-gray-900">›</span>
              <span className="text-blue-500">Reset Password</span>
            </div>
          </div>
        </div>
        <main className="grow bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                  Invalid Reset Link
                </h1>
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <div>
                    <Link href="/accounts/forgot-password" className="text-[#00aeef] hover:underline">
                      Request a new password reset link
                    </Link>
                  </div>
                  <div>
                    Already have account?{' '}
                    <Link href="/accounts/signin" className="text-[#00aeef] hover:underline">
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${openSans.className}`}>
      {/* Navbar */}
      <Navbar />

      {/* Sticky Breadcrumb */}
      <div className={`sticky top-0 z-40 bg-gray-100 border-b border-gray-200 shadow-sm ${openSans.className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#00aeef] transition">
              Home
            </Link>
            <span className="text-gray-900">›</span>
            <Link href="/accounts/signin" className="text-gray-600 hover:text-[#00aeef] transition">
              Sign-In
            </Link>
            <span className="text-gray-900">›</span>
            <Link href="/accounts/forgot-password" className="text-gray-600 hover:text-[#00aeef] transition">
              Forgot-Password
            </Link>
            <span className="text-gray-900">›</span>
            <span className="text-blue-500">Reset Password</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`grow bg-gray-50 py-16 ${openSans.className}`}>
        <div className="container mx-auto px-4">
          {/* Reset Password Card */}
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Reset Password
              </h1>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-6">
                Enter your new password below. Make sure it's at least 8 characters long.
              </p>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">
                    Password reset successfully! Redirecting to sign in...
                  </p>
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleResetPassword}>
                {/* Email Field (Read-only) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Password Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="8+ characters"
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      required
                      minLength={8}
                      disabled={loading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      disabled={loading || success}
                    >
                      {showPassword ? (
                        <FaRegEyeSlash className="text-lg" />
                      ) : (
                        <FaRegEye className="text-lg" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      required
                      disabled={loading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      disabled={loading || success}
                    >
                      {showConfirmPassword ? (
                        <FaRegEyeSlash className="text-lg" />
                      ) : (
                        <FaRegEye className="text-lg" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Reset Password Button */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition mb-6"
                >
                  {loading ? (
                    'RESETTING...'
                  ) : success ? (
                    'PASSWORD RESET'
                  ) : (
                    <>
                      RESET PASSWORD
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </form>

              {/* Navigation Links */}
              <div className="space-y-2 text-sm">
                <div>
                  Already have account?{' '}
                  <Link href="/accounts/signin" className="text-[#00aeef] hover:underline">
                    Sign In
                  </Link>
                </div>
                <div>
                  Don't have account?{' '}
                  <Link href="/accounts/signup" className="text-[#00aeef] hover:underline">
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
