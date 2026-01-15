'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import Navbar from '../../Cx/Layout/Navbar';
import Footer from '../../Cx/Layout/Footer';
import { openSans } from '../../Cx/Font/font';
import { supabase } from '../../lib/supabase';

const SignInPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      router.push('/');
      return;
    }

    // Check for Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const googleSuccess = urlParams.get('google_success');
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (googleSuccess === '1' && token) {
      try {
        let base64 = decodeURIComponent(token).replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const decodedToken = atob(base64);
        const userData = JSON.parse(decodedToken);
        
        if (userData.user && userData.session) {
          localStorage.setItem('user', JSON.stringify(userData.user));
          localStorage.setItem('session', JSON.stringify(userData.session));
          
          setSuccess(true);
          setError('');
          
          setTimeout(() => {
            router.push('/');
          }, 1500);
          
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Failed to process Google OAuth token:', err);
        setError('Failed to process Google login. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [router]);

  const handleSignIn = async (e) => {
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
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hitek-server-uu0f.onrender.com';
          response = await fetch(`${API_URL}/api/auth/login`, {
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
          const errorMessage = data.error || 'Authentication failed';
          console.error('Backend login error:', errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }

        // Login successful
        setSuccess(true);
        setError('');
        
        if (data.user || data.userData) {
          localStorage.setItem('user', JSON.stringify(data.user || data.userData));
          localStorage.setItem('session', JSON.stringify(data.session));
        }

        // Redirect to home page
        setTimeout(() => {
          router.push('/');
        }, 1000);
        return;
      } catch (backendError) {
        if (backendError.name === 'TypeError' || backendError.message.includes('fetch')) {
          console.error('Backend server not reachable:', backendError);
          setError('Backend server is not running. Please start the server with: npm run server');
          setLoading(false);
          return;
        }
        
        // Fallback to Supabase Auth
        console.log('Backend login failed, trying Supabase Auth...', backendError);
        
        if (!supabase) {
          setError('Authentication service is not available. Please check your configuration.');
          setLoading(false);
          return;
        }

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
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (userError && userError.code !== 'PGRST116') {
            console.error('Error fetching user data:', userError);
          }

          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          if (authData.session) {
            localStorage.setItem('session', JSON.stringify(authData.session));
          }

          setTimeout(() => {
            router.push('/');
          }, 1000);
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hitek-server-uu0f.onrender.com';
    const redirectUri = `${window.location.origin}/accounts/signin`;
    window.location.href = `${API_URL}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

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
            <span className="text-blue-500">Sign In</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`grow bg-gray-50 py-16 ${openSans.className}`}>
        <div className="container mx-auto px-4">
          {/* Sign In Card */}
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Sign In
              </h1>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-6">
                Welcome back! Please sign in to your account.
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
                    Login successful! Redirecting...
                  </p>
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || success}
                className="w-full mb-6 py-3 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium flex items-center justify-center gap-3 transition"
              >
                <FcGoogle className="text-2xl" />
                <span>Sign in with Google</span>
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn}>
                {/* Email Field */}
                <div className="mb-4">
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
                    required
                    disabled={loading || success}
                  />
                </div>

                {/* Password Field */}
                <div className="mb-6">
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
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      required
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

                {/* Forgot Password Link */}
                <div className="mb-6 text-right">
                  <Link
                    href="/accounts/forgot-password"
                    className="text-sm text-[#00aeef] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition mb-6"
                >
                  {loading ? (
                    'SIGNING IN...'
                  ) : success ? (
                    'SIGNED IN'
                  ) : (
                    <>
                      SIGN IN
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </form>

              {/* Navigation Links */}
              <div className="space-y-2 text-sm">
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

export default SignInPage;
