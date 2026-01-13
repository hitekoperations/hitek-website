'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiSend, FiClock, FiMessageSquare } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { openSans } from '../Cx/Font/font';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Here you would typically send the form data to your backend API
      // For now, we'll simulate a submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to send message. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${openSans.className}`}>
      <Navbar />
      
      <main className="grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#00aeef] hover:text-[#0099d9] mb-4 transition"
            >
              <FiArrowLeft />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
            <p className="text-gray-600">We'd love to hear from you. Get in touch with us!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                
                {/* Phone */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#00aeef]/10 p-3 rounded-lg">
                    <FiPhone className="text-[#00aeef] text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <a href="tel:+922132430225" className="text-gray-600 hover:text-[#00aeef] transition">
                      +92 21 32430225
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#00aeef]/10 p-3 rounded-lg">
                    <FiMail className="text-[#00aeef] text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href="mailto:info@hitechcomputers.com" className="text-gray-600 hover:text-[#00aeef] transition">
                      info@hitechcomputers.com
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#00aeef]/10 p-3 rounded-lg">
                    <FiMapPin className="text-[#00aeef] text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                    <p className="text-gray-600">
                      Hi-Tek Computers, Head Office,<br />
                      Uni Center, Office No. 316, 3rd Floor,<br />
                      I. I. Chundrigar Road,<br />
                      Karachi - Pakistan
                    </p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#00aeef]/10 p-3 rounded-lg">
                    <FiClock className="text-[#00aeef] text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Saturday: 9:00 AM - 7:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>

                {/* Social Media */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
                  <div className="flex items-center gap-3">
                    <a
                      href="#"
                      className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition"
                      aria-label="Facebook"
                    >
                      <FaFacebook className="text-white" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition"
                      aria-label="Instagram"
                    >
                      <FaInstagram className="text-white" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition"
                      aria-label="TikTok"
                    >
                      <FaTiktok className="text-white" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition"
                      aria-label="Twitter"
                    >
                      <FaXTwitter className="text-white" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedin className="text-white" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FiMessageSquare className="text-2xl text-[#00aeef]" />
                  <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">
                      Thank you for your message! We'll get back to you as soon as possible.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                        placeholder="Your full name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                        placeholder="+92-XXX-XXXXXXX"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900"
                        placeholder="What is this regarding?"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent text-gray-900 resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-[#00aeef] hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUsPage;

