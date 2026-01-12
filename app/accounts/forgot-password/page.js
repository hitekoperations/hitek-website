'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import Navbar from '../../Cx/Layout/Navbar';
import Footer from '../../Cx/Layout/Footer';
import { openSans } from '../../Cx/Font/font';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Simple frontend validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Show reset password form (frontend only - no API call)
    setError('');
    setShowResetForm(true);
    setSuccess(false); // Reset success state for the reset form
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    
    // Simple frontend validation
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

    // Frontend only - just show success message
    setResetSubmitted(true);
    setSuccess(true);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col">
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
            {showResetForm ? (
              <>
                <Link href="/accounts/forgot-password" className="text-gray-600 hover:text-[#00aeef] transition">
                  Forgot-Password
                </Link>
                <span className="text-gray-900">›</span>
                <span className="text-blue-500">Reset Password</span>
              </>
            ) : (
              <span className="text-blue-500">Forgot Password</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`grow bg-gray-50 py-16 ${openSans.className}`}>
        <div className="container mx-auto px-4">
          {/* Forgot Password Card */}
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              {!showResetForm ? (
                <>
                  {/* Title */}
                  <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Forget Password
                  </h1>

                  {/* Description */}
                  <p className="text-sm text-gray-600 text-center mb-6">
                    Enter the email address or mobile phone number associated with your account.
                  </p>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Success Message - Only show briefly before switching to reset form */}
                  {success && !showResetForm && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-600">
                        Password reset code has been sent to your email. Please check your inbox and follow the instructions.
                      </p>
                    </div>
                  )}

                  {/* Email Form */}
                  <form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                        disabled={showResetForm}
                        required
                      />
                    </div>

                    {/* Send Code Button */}
                    <button
                      type="submit"
                      disabled={showResetForm}
                      className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition mb-6"
                    >
                      SEND CODE
                      <FiArrowRight />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Reset Password Title */}
                  <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Reset Password
                  </h1>

                  {/* Description */}
                  <p className="text-sm text-gray-600 text-center mb-6">
                    It's time to update your password! Please change it now to ensure your account's security.
                  </p>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Success Message - Only show after form submission */}
                  {resetSubmitted && success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-600">
                        Password reset successfully!
                      </p>
                    </div>
                  )}

                  {/* Reset Password Form */}
                  <form onSubmit={handleResetPassword}>
                    {/* Password Field */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
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
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
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
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
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
                      disabled={success}
                      className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition mb-6"
                    >
                      {success ? 'PASSWORD RESET' : 'RESET PASSWORD'}
                      {!success && <FiArrowRight />}
                    </button>
                  </form>
                </>
              )}

              {/* Navigation Links - Only show on forgot password form */}
              {!showResetForm && (
                <>
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

                  {/* Help Text */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-600 text-center">
                      You may contact{' '}
                      <a href="#" className="text-[#00aeef] hover:underline">
                        Customer Service
                      </a>
                      {' '}for help restoring access to your account.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;

