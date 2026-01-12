'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import { openSans } from '../Font/font';
import { useCart } from '../Providers/CartProvider';

const formatPrice = (price) => `PKR ${price.toLocaleString('en-PK')}`;

const ShoppingCartPopup = ({ isOpen, onClose }) => {
  const { cartItems, cartSubtotal, removeFromCart } = useCart();

  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-full right-0 mt-2 w-96 bg-white rounded-sm shadow-2xl z-50 border border-gray-200 ${openSans.className}`}
      onMouseEnter={(e) => {
        e.stopPropagation();
      }}
      onMouseLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onClose();
        }
      }}
    >
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">
          Shopping Cart ({cartItems.length.toString().padStart(2, '0')})
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            Your cart is empty.
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div key={item.id}>
              <div className="px-4 py-3 flex gap-3 hover:bg-gray-50 transition relative">
                <div className="shrink-0 w-16 h-16 border border-gray-200 rounded overflow-hidden bg-white">
                  <Image
                    src={item.image || '/laptop-category.jpg'}
                    alt={item.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-gray-900 font-medium mb-1 line-clamp-2 pr-6">
                    {item.name}
                  </h4>
                  <div className="flex items-center text-sm text-[#00aeef] font-medium">
                    {item.quantity} × {formatPrice(item.price)}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-red-500 transition"
                  aria-label="Remove item"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
              {index < cartItems.length - 1 && <hr className="border-gray-200" />}
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Sub-Total:</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(cartSubtotal)}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        <Link
          href="/checkout"
          className="w-full bg-[#00aeef] hover:bg-[#0099d9] text-white py-3 rounded-sm font-bold flex items-center justify-center gap-2 transition"
          onClick={onClose}
        >
          CHECKOUT NOW
          <FiArrowRight />
        </Link>
        <Link
          href="/cart"
          className="w-full border-2 border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white py-3 rounded-sm font-bold transition flex items-center justify-center"
          onClick={onClose}
        >
          VIEW CART
        </Link>
      </div>
    </div>
  );
};

export default ShoppingCartPopup;
