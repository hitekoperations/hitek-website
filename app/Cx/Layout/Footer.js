'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin } from 'react-icons/fa';
import { CiPhone } from 'react-icons/ci';
import { FaXTwitter } from 'react-icons/fa6';
import { openSans } from '../Font/font';

const Footer = () => {
  return (
    <footer className={`bg-black text-white ${openSans.className}`}>
      <div className=" mx-auto py-4">
        <hr className='w-full border-gray-300 border-2 mb-8'/>
        <div className="grid grid-cols-1 px-20 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/navbar-logo.png"
                alt="Hi-Tek Computers Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
            <p className="text-gray-300">Your Trusted IT Partner.</p>
            
            <div className="flex items-start gap-3">
              <CiPhone className="text-xl mt-1" />
              <div>
                <p className="text-gray-300 font-medium">Contact Us</p>
                <p className="text-white">+92-333-2673177</p>
              </div>
            </div>
            
            <div className="mt-6">
              <Image
                src="/google-reviews.png"
                alt="Google Reviews"
                width={100}
                height={40}
                className="object-contain mb-2"
              />
            </div>
          </div>

          {/* Information Links */}
          <div>
            <h3 className="text-blue-500 font-bold text-lg mb-4">Information</h3>
            <ul className="space-y-2">
              <li><Link href="/policies#privacy-policy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">About us</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Secure payment</Link></li>
              <li><Link href="/contact-us" className="hover:text-blue-400 transition">Contact us</Link></li>
              <li><Link href="/policies#terms-conditions" className="hover:text-blue-400 transition">Terms & Conditions</Link></li>
              <li><Link href="/policies#refund-policy" className="hover:text-blue-400 transition">Refund & Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="text-blue-500 font-bold text-lg mb-4">Important Links</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-blue-400 transition">Delivery</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Sitemap</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Stores</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Best sales</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Login</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">My account</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-blue-500 font-bold text-lg mb-4">News Letter</h3>
            <p className="text-gray-300 text-sm mb-4">
              You may unsubscribe at any moment. For that purpose, please find our contact info in the legal notice.
            </p>
            <div className="flex gap-2 mb-6 min-w-0">
              <input
                type="email"
                placeholder="Your email address..."
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
              />
              <button className="bg-[#00aeef] hover:bg-[#0099d9] text-white px-6 py-2 rounded-lg font-medium transition shrink-0">
                Subscribe
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition">
                <FaFacebook className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition">
                <FaInstagram className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition">
                <FaTiktok className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition">
                <FaXTwitter className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#00aeef] hover:bg-[#0099d9] rounded-full flex items-center justify-center transition">
                <FaLinkedin className="text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 px-20 text-sm">© Hi-Tek Computers 2025. All right reserved</p>
          
          <div className="flex items-center pr-20 gap-4">
            <div className="flex items-center gap-3">
              <Image src="/easypaisa.png" alt="EasyPaisa" width={20} height={20} className="object-contain" />
              <Image src="/sadapay.png" alt="SadaPay" width={20} height={20} className="object-contain" />
              <Image src="/nayapay.png" alt="NayaPay" width={20} height={20} className="object-contain" />
              <Image src="/mastercard.png" alt="Mastercard" width={20} height={20} className="object-contain" />
              <Image src="/visa.png" alt="Visa" width={30} height={30} className="object-contain" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

