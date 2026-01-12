'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'hi-tech-cart-items';

const normalizeId = (id) => {
  if (id === null || id === undefined) {
    return '';
  }
  return id.toString();
};

const parseNumeric = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const cleaned = value.toString().replace(/[^\d.-]/g, '');
  const num = Number(cleaned);
  return Number.isNaN(num) ? fallback : num;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCartItems(
            parsed.map((item) => ({
              ...item,
              id: normalizeId(item.id),
              quantity: parseNumeric(item.quantity, 1),
              price: parseNumeric(item.price, 0),
            })),
          );
        }
      }
    } catch (error) {
      console.error('Failed to load cart items from storage:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart items to storage:', error);
    }
  }, [cartItems]);

  const showFeedback = useCallback((item) => {
    if (!item) return;
    const message = {
      name: (item.name || 'Product').toString(),
      quantity: parseNumeric(item.quantity, 1),
    };

    setFeedback(message);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 2400);
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    },
    [],
  );

  const addToCart = useCallback((rawItem, quantity = 1) => {
    if (!rawItem) return;
    const normalizedId = normalizeId(rawItem.id);
    if (!normalizedId) return;

    const normalizedItem = {
      ...rawItem,
      id: normalizedId,
      price: parseNumeric(rawItem.price, 0),
      quantity: parseNumeric(quantity, 1),
    };

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === normalizedId);
      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + normalizedItem.quantity,
        };
        return updated;
      }
      return [...prev, normalizedItem];
    });

    showFeedback({ ...normalizedItem, id: normalizedId });
  }, [showFeedback]);

  const updateQuantity = useCallback((id, quantity) => {
    const normalizedId = normalizeId(id);
    const safeQuantity = Math.max(1, parseNumeric(quantity, 1));

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === normalizedId ? { ...item, quantity: safeQuantity } : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    const normalizedId = normalizeId(id);
    setCartItems((prev) => prev.filter((item) => item.id !== normalizedId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartSubtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [cartItems, cartCount, cartSubtotal, addToCart, updateQuantity, removeFromCart, clearCart],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {feedback && (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2">
          <div className="bg-gray-900/95 text-white px-5 py-3 rounded-md shadow-lg border border-white/10">
            <p className="text-sm font-semibold">Added to cart</p>
            <p className="text-xs text-gray-200 mt-1">
              {feedback.quantity} × {feedback.name}
            </p>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

