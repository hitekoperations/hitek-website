'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import Navbar from '../../Cx/Layout/Navbar';
import Footer from '../../Cx/Layout/Footer';
import { openSans } from '../../Cx/Font/font';

const SignInPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [shippingData, setShippingData] = useState({
    phone: '',
    shipment_address: '',
    province: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const googleSuccess = urlParams.get('google_success');
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      setError(decodeURIComponent(error));
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (googleSuccess === '1' && token) {
      try {
        // Decode user data from token (base64 URL-safe)
        // Convert URL-safe base64 back to standard base64
        let base64 = decodeURIComponent(token).replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
          base64 += '=';
        }
        const decodedToken = atob(base64);
        const userData = JSON.parse(decodedToken);
        
        if (userData.user && userData.session) {
          // Store user data
          localStorage.setItem('user', JSON.stringify(userData.user));
          localStorage.setItem('session', JSON.stringify(userData.session));
          
          setSuccess(true);
          setError('');
          
          // Hide signup/signin forms and OTP form
          setActiveTab('signup'); // Set to signup to hide signin form
          setShowOTPForm(false);
          
          // Check if user needs to complete shipping details
          const hasShipping = userData.user.phone || userData.user.shipment_address;
          
          if (!hasShipping) {
            // Show shipping form and hide signup form immediately
            setUserId(userData.user.id);
            setShowShippingForm(true);
            setShowOTPForm(false);
            setActiveTab('signup'); // Hide signin tab
            setSuccess(false);
          } else {
            // Redirect to home
            setTimeout(() => {
              router.push('/');
            }, 1500);
          }
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Failed to process Google OAuth token:', err);
        setError('Failed to process Google login. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleShippingInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Try backend API login
      try {
        const response = await fetch('https://hitek-server-uu0f.onrender.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        });

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

        // Store user data
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
        // If backend is not available, show error
        if (backendError.name === 'TypeError' || backendError.message.includes('fetch')) {
          console.error('Backend server not reachable:', backendError);
          setError('Backend server is not running. Please start the server with: npm run server');
          setLoading(false);
          return;
        }
        throw backendError;
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      // Send OTP
      let response;
      try {
        response = await fetch('https://hitek-server-uu0f.onrender.com/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email.trim(),
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
        const errorMessage = data.error || 'Failed to send OTP';
        console.error('Send OTP error:', errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // OTP sent successfully
      setOtpSent(true);
      setShowOTPForm(true);
      setSuccess(true);
      setError('');
      setLoading(false);

      // In development, show OTP in console
      if (data.otp) {
        console.log('🔐 OTP Code (Development):', data.otp);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Send OTP error:', err);
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setVerifyingOTP(true);

    try {
      if (!otpCode || otpCode.length !== 6) {
        setError('Please enter a valid 6-digit OTP code');
        setVerifyingOTP(false);
        return;
      }

      // Verify OTP
      let response;
      try {
        response = await fetch('https://hitek-server-uu0f.onrender.com/api/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            otp: otpCode.trim(),
          }),
        });
      } catch (fetchError) {
        if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch')) {
          console.error('Backend server not reachable:', fetchError);
          setError('Backend server is not running. Please start the server with: npm run server');
          setVerifyingOTP(false);
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
        setVerifyingOTP(false);
        return;
      }

      if (!response.ok) {
        const errorMessage = data.error || 'Invalid OTP';
        console.error('Verify OTP error:', errorMessage);
        setError(errorMessage);
        setVerifyingOTP(false);
        return;
      }

      // OTP verified successfully
      setEmailVerified(true);
      setSuccess(true);
      setError('');
      setVerifyingOTP(false);

      // Proceed with registration
      await handleCompleteRegistration();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Verify OTP error:', err);
      setVerifyingOTP(false);
    }
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      // Call backend API for registration
      let response;
      try {
        response = await fetch('https://hitek-server-uu0f.onrender.com/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            skipOTP: true, // Skip OTP verification
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
        const errorMessage = data.error || 'Registration failed';
        console.error('Backend registration error:', errorMessage);
        
        // If requires verification, reset OTP form
        if (data.requiresVerification) {
          setEmailVerified(false);
          setOtpSent(false);
          setOtpCode('');
          setShowOTPForm(true);
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Registration successful - show shipping form
      setSuccess(true);
      setError('');
      setLoading(false);
      setShowOTPForm(false);

      // Store user data and ID
      if (data.user) {
        setUserId(data.user.id);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('session', JSON.stringify(data.session));
      }

      // Show shipping details form after a short delay
      setTimeout(() => {
        setShowShippingForm(true);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtpCode('');
    setOtpSent(false);
    setEmailVerified(false);
    await handleSendOTP({ preventDefault: () => {} });
  };

  const handleSkipOTP = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Skip OTP and directly register
    setEmailVerified(true);
    await handleCompleteRegistration();
  };

  const handleShippingDetails = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!shippingData.phone || !shippingData.shipment_address || !shippingData.province || !shippingData.city || !shippingData.address) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Call backend API to update user with shipping details
      let response;
      try {
        response = await fetch(`https://hitek-server-uu0f.onrender.com/api/users/${userId}/shipping`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shippingData),
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
        const errorMessage = data.error || 'Failed to save shipping details';
        console.error('Shipping details error:', errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Update successful
      setSuccess(true);
      setError('');

      // Update user data in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...shippingData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Redirect to home page
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Shipping details error:', err);
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'https://hitek-server-uu0f.onrender.com/api/auth/google';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Sticky Breadcrumb */}
      <div className={`sticky top-0 z-40 bg-gray-100 border-b border-gray-200 shadow-sm ${openSans.className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <a href="/" className="hover:text-[#00aeef] transition">
              Home
            </a>
            <span className='text-blue-500'>›</span>
            <span className="text-blue-500">Sign In</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`grow bg-gray-50 py-16 ${openSans.className}`}>
        <div className="container mx-auto px-4">
          {/* Sign In / Sign Up Card */}
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Tabs */}
            {!showShippingForm && (
              <div className="flex border-b">
                <button
                  onClick={() => {
                    setActiveTab('signin');
                    setError('');
                  }}
                  className={`flex-1 py-4 text-center font-semibold transition ${
                    activeTab === 'signin'
                      ? 'text-[#00aeef] border-b-2 border-[#00aeef]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setActiveTab('signup');
                    setError('');
                  }}
                  className={`flex-1 py-4 text-center font-semibold transition ${
                    activeTab === 'signup'
                      ? 'text-[#00aeef] border-b-2 border-[#00aeef]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Form Content */}
            <div className="p-8">
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
                    {showShippingForm 
                      ? 'Shipping details saved successfully! Redirecting...'
                      : activeTab === 'signin' 
                        ? 'Login successful! Redirecting...' 
                        : showOTPForm
                          ? emailVerified
                            ? 'Email verified! Creating your account...'
                            : 'Verification code sent! Please check your email.'
                          : 'Registration successful! Please provide your shipping details.'}
                  </p>
                </div>
              )}

              {/* Sign In Form */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn}>
                  {/* Email Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <a
                        href="#"
                        className="text-sm text-[#00aeef] hover:underline"
                        onClick={() => {
                          router.push('/accounts/forgot-password');
                        }}
                      >
                        Forget Password?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
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

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition mb-4"
                  >
                    {loading ? 'SIGNING IN...' : 'SIGN IN'}
                    {!loading && <FiArrowRight />}
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>

                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full border-2 cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <FcGoogle className="text-2xl" />
                    Login with Google
                  </button>
                </form>
              )}

              {/* Sign Up Form */}
              {activeTab === 'signup' && !showShippingForm && !showOTPForm && (
                <form onSubmit={handleSendOTP}>
                  {/* First Name Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Last Name Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
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

                  {/* Confirm Password Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Send OTP Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition mb-3"
                  >
                    {loading ? 'SENDING VERIFICATION CODE...' : 'SEND VERIFICATION CODE'}
                    {!loading && <FiArrowRight />}
                  </button>

                  {/* Skip OTP Button */}
                  <button
                    type="button"
                    onClick={handleSkipOTP}
                    disabled={loading}
                    className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition mb-4"
                  >
                    {loading ? 'CREATING ACCOUNT...' : 'Skip OTP & Create Account'}
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>

                  {/* Google Sign Up */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <FcGoogle className="text-2xl" />
                    Sign up with Google
                  </button>
                </form>
              )}

              {/* OTP Verification Form */}
              {showOTPForm && !showShippingForm && (
                <form onSubmit={handleVerifyOTP}>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      We've sent a 6-digit verification code to <strong>{formData.email}</strong>. 
                      Please enter the code below to verify your email address.
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(value);
                        setError('');
                      }}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900 text-center text-2xl tracking-widest"
                      disabled={verifyingOTP || emailVerified}
                      required
                      maxLength={6}
                    />
                  </div>

                  {/* Resend OTP */}
                  {!emailVerified && (
                    <div className="mb-6 text-center">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-sm text-[#00aeef] hover:underline disabled:text-gray-400"
                      >
                        Didn't receive the code? Resend
                      </button>
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={verifyingOTP || emailVerified || otpCode.length !== 6}
                    className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition mb-4"
                  >
                    {verifyingOTP ? 'VERIFYING...' : emailVerified ? 'VERIFIED ✓' : 'VERIFY EMAIL'}
                    {!verifyingOTP && !emailVerified && <FiArrowRight />}
                  </button>
                </form>
              )}

              {/* Shipping Details Form */}
              {showShippingForm && (
                <form onSubmit={handleShippingDetails}>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Shipping Information</h2>
                    <p className="text-sm text-gray-600 mb-4">Please provide your shipping details to complete your registration.</p>
                  </div>

                  {/* Phone Number Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingData.phone}
                      onChange={handleShippingInputChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Shipment Address Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipment Address
                    </label>
                    <input
                      type="text"
                      name="shipment_address"
                      value={shippingData.shipment_address}
                      onChange={handleShippingInputChange}
                      placeholder="Enter your shipment address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Province Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={shippingData.province}
                      onChange={handleShippingInputChange}
                      placeholder="Enter your province"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* City Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingData.city}
                      onChange={handleShippingInputChange}
                      placeholder="Enter your city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Address Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={shippingData.address}
                      onChange={handleShippingInputChange}
                      placeholder="Enter your address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold flex items-center justify-center gap-2 transition"
                  >
                    {loading ? 'SAVING...' : 'SAVE SHIPPING DETAILS'}
                    {!loading && <FiArrowRight />}
                  </button>
                </form>
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

export default SignInPage;

