'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiShield, FiRefreshCw, FiX, FiFileText } from 'react-icons/fi';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { openSans } from '../Cx/Font/font';

const PoliciesPage = () => {
  return (
    <div className={`min-h-screen flex flex-col ${openSans.className}`}>
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#00aeef] hover:text-[#0099d9] mb-4 transition"
            >
              <FiArrowLeft />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Policies & Terms</h1>
            <p className="text-gray-600">Review our policies, terms, and conditions</p>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-8 sticky top-4 z-10">
            <div className="flex flex-wrap gap-4">
              <a href="#refund-policy" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Refund Policy
              </a>
              <a href="#cancellation-policy" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Cancellation Policy
              </a>
              <a href="#privacy-policy" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Privacy Policy
              </a>
              <a href="#terms-conditions" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Terms & Conditions
              </a>
            </div>
          </div>

          <div className="space-y-8">
            {/* Refund Policy */}
            <section id="refund-policy" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiRefreshCw className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Refund Policy</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="text-lg">
                  At Hi-Tek Computers, we want you to be completely satisfied with your purchase. If you are not satisfied with a product you have purchased, we offer a hassle-free refund process.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-[#00aeef] p-4 my-4">
                  <h3 className="font-semibold text-gray-900 mb-2">3-Day Satisfaction Guarantee</h3>
                  <p>
                    If you don't like a product for any reason, you can request a full refund within <strong>3 days</strong> of receiving your order. We will process your refund promptly and return the full purchase amount to your original payment method.
                  </p>
                </div>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Refund Eligibility</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Product must be returned in its original condition with all accessories and packaging</li>
                  <li>Refund request must be made within 3 days of delivery</li>
                  <li>Product must not be damaged, used, or modified</li>
                  <li>All original tags, labels, and documentation must be included</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Refund Process</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact our customer service team within 3 days of delivery</li>
                  <li>Provide your order number and reason for refund</li>
                  <li>We will provide you with a return authorization and shipping instructions</li>
                  <li>Ship the product back to us using the provided instructions</li>
                  <li>Once we receive and inspect the product, we will process your refund within 5-7 business days</li>
                </ol>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Refund Timeline</h3>
                <p>
                  Refunds will be processed to your original payment method within 5-7 business days after we receive the returned product. The time it takes for the refund to appear in your account depends on your bank or payment provider, typically 3-10 business days.
                </p>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section id="cancellation-policy" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiX className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Cancellation Policy</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="text-lg">
                  You have the right to cancel your order before it is shipped. Once an order has been shipped, it cannot be cancelled, but you can still return it under our refund policy.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Order Cancellation</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Orders can be cancelled within 24 hours of placement, provided they haven't been shipped</li>
                  <li>To cancel an order, contact our customer service team with your order number</li>
                  <li>If payment has been processed, a full refund will be issued within 5-7 business days</li>
                  <li>Once an order is in "Processing" or "Shipped" status, it cannot be cancelled</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Custom Orders</h3>
                <p>
                  Custom or personalized orders may have different cancellation terms. Please contact us immediately if you need to cancel a custom order, as these may be subject to additional fees if production has already begun.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">How to Cancel</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact our customer service via phone or email with your order number</li>
                  <li>Provide your order details and reason for cancellation</li>
                  <li>We will confirm the cancellation and process your refund if applicable</li>
                  <li>You will receive a confirmation email once the cancellation is processed</li>
                </ol>
              </div>
            </section>

            {/* Privacy Policy */}
            <section id="privacy-policy" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiShield className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="text-sm text-gray-500 mb-4">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                
                <p className="text-lg">
                  At Hi-Tek Computers, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Information We Collect</h3>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name, email address, phone number, and shipping address</li>
                  <li>Payment information (processed securely through our payment providers)</li>
                  <li>Order history and preferences</li>
                  <li>Account credentials if you create an account</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">How We Use Your Information</h3>
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process and fulfill your orders</li>
                  <li>Communicate with you about your orders and our services</li>
                  <li>Send you marketing communications (with your consent)</li>
                  <li>Improve our website and customer experience</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Information Sharing</h3>
                <p>
                  We do not sell your personal information. We may share your information only with:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Service providers who assist us in operating our website and processing payments</li>
                  <li>Shipping companies to deliver your orders</li>
                  <li>Legal authorities when required by law</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt-out of marketing communications</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Contact Us</h3>
                <p>
                  If you have questions about this Privacy Policy, please contact us at:
                </p>
                <p className="font-medium">
                  Email: info@hitechcomputers.com<br />
                  Phone: +92-333-2673177
                </p>
              </div>
            </section>

            {/* Terms & Conditions */}
            <section id="terms-conditions" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiFileText className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="text-sm text-gray-500 mb-4">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                
                <p className="text-lg">
                  Please read these Terms and Conditions carefully before using our website and making a purchase. By accessing our website and making a purchase, you agree to be bound by these terms.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Acceptance of Terms</h3>
                <p>
                  By accessing and using the Hi-Tek Computers website, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Use of Website</h3>
                <p>You agree to use our website only for lawful purposes and in a way that does not:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Infringe on the rights of others</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Interfere with or disrupt the website or servers</li>
                  <li>Attempt to gain unauthorized access to any part of the website</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Product Information</h3>
                <p>
                  We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or other content on the website is accurate, complete, reliable, current, or error-free. Prices are subject to change without notice.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Orders and Payment</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All orders are subject to product availability</li>
                  <li>We reserve the right to refuse or cancel any order</li>
                  <li>Payment must be received before order processing</li>
                  <li>Prices are in PKR (Pakistani Rupees) unless otherwise stated</li>
                  <li>We accept various payment methods as displayed on our website</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Shipping and Delivery</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Delivery times are estimates and not guaranteed</li>
                  <li>Shipping costs are calculated at checkout</li>
                  <li>Risk of loss and title pass to you upon delivery</li>
                  <li>You are responsible for providing accurate shipping information</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Intellectual Property</h3>
                <p>
                  All content on this website, including text, graphics, logos, images, and software, is the property of Hi-Tek Computers and is protected by copyright and trademark laws.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Limitation of Liability</h3>
                <p>
                  Hi-Tek Computers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the website or purchase of products.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Changes to Terms</h3>
                <p>
                  We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on the website. Your continued use of the website constitutes acceptance of the modified terms.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Contact Information</h3>
                <p>
                  For questions about these Terms and Conditions, please contact us:
                </p>
                <p className="font-medium">
                  Hi-Tek Computers<br />
                  Phone: +92-333-2673177<br />
                  Email: info@hitechcomputers.com
                </p>
              </div>
            </section>
          </div>

          {/* Back to Top */}
          <div className="mt-8 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[#00aeef] hover:text-[#0099d9] transition"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Back to Top
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliciesPage;

