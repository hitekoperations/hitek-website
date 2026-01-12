'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaRegUser, FaClipboardList, FaTruck, FaShoppingCart, FaRegHeart, FaAddressCard, FaHistory, FaCog, FaSignOutAlt, FaEllipsisH } from 'react-icons/fa';
import { FiChevronRight, FiMapPin, FiPhone, FiMail, FiEdit2, FiMinus, FiPlus, FiTrash2, FiCheckCircle, FiTruck as FiTruckIcon, FiPackage, FiShoppingBag, FiClock, FiRefreshCw, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { openSans } from '../Cx/Font/font';
import { useCart } from '../Cx/Providers/CartProvider';

const ORDER_DETAIL_STEPS = [
  { id: 'placed', label: 'Order Placed', icon: FiShoppingBag },
  { id: 'processing', label: 'Packaging', icon: FiPackage },
  { id: 'in_transit', label: 'On The Road', icon: FiTruckIcon },
  { id: 'delivered', label: 'Delivered', icon: FiCheckCircle },
];

const ORDER_STATUS_FLOW = [
  { step: 'delivered', badge: 'Completed', tokens: ['completed', 'delivered'] },
  {
    step: 'in_transit',
    badge: 'Completed',
    tokens: ['in_transit', 'on_the_road', 'on the road', 'road', 'transit', 'ship', 'shipped', 'out_for_delivery'],
  },
  { step: 'processing', badge: 'Processing', tokens: ['processing', 'processed', 'pack', 'packaging', 'packed', 'in_progress'] },
  { step: 'placed', badge: 'In Progress', tokens: ['placed', 'pending', 'initiated', 'created', 'order_placed'] },
];

const STEP_STATUS_LABELS = {
  placed: 'In Progress',
  processing: 'Processing',
  in_transit: 'Completed',
  delivered: 'Completed',
};

const ORDER_ACTIVITY_TEXT = {
  placed: 'Your order has been placed successfully. Thank you for shopping with us!',
  processing: 'Our warehouse team is packaging your order carefully.',
  in_transit: 'Your order is on the way to you.',
  delivered: 'Your order has been delivered successfully.',
};

const ACTIVITY_BADGE_STYLES = {
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-600',
  Processing: 'border-amber-200 bg-amber-50 text-amber-600',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-600',
};

const PROVIDER_GRADIENT_MAP = {
  VISA: 'from-[#0b1a4a] to-[#1e3a8a]',
  MASTERCARD: 'from-[#b91c1c] to-[#f97316]',
  EASYPAISA: 'from-[#373444] to-[#31b864]',
  NAYAPAY: 'from-[#f97316] to-[#fb923c]',
  SADAPAY: 'from-[#0f766e] to-[#f97316]',
};

const formatCardMask = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';
  const masked = digits
    .split('')
    .map((char, index) => (index < digits.length - 4 ? '*' : char))
    .join('');
  return masked.replace(/(.{4})/g, '$1 ').trim();
};

const formatCardInput = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiryInput = (value) => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const getOrderStatusMeta = (status) => {
  const normalized = status ? status.toString().toLowerCase() : '';
  for (const entry of ORDER_STATUS_FLOW) {
    if (entry.tokens.some((token) => normalized.includes(token))) {
      return entry;
    }
  }
  return ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.length - 1];
};

const normalizeOrderDetailStatus = (status) => {
  return getOrderStatusMeta(status).step;
};

const normalizeOrderDetailAddress = (address, fallbackName = '') => {
  if (!address) {
    return {
      name: fallbackName,
      lines: [],
      phone: '',
      email: '',
    };
  }

  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeOrderDetailAddress(parsed, fallbackName);
      }
    } catch (error) {
      // ignore JSON parse error and fallback to splitting
    }
    const lines = address
      .split(/\r?\n|,/)
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      name: fallbackName,
      lines,
      phone: '',
      email: '',
    };
  }

  const cityLine = [address.city, address.state, address.postal_code]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');

  const lines = [address.line1, address.line2, cityLine, address.country]
    .filter((line) => typeof line === 'string' && line.trim())
    .map((line) => line.trim());

  return {
    name: address.name || fallbackName,
    lines,
    phone: address.phone || '',
    email: address.email || '',
  };
};

const parseAmount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const sanitizeOrderDetailData = (raw) => {
  if (!raw) return null;
  const statusMeta = getOrderStatusMeta(raw.status || raw.order_status);
  const status = statusMeta.step;
  const items = Array.isArray(raw.order_items)
    ? raw.order_items.map((item) => {
        let metadata = item.metadata || {};
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (error) {
            metadata = {};
          }
        }
        const fallbackImage = (metadata?.category || item.category || '').toLowerCase().includes('printer')
          ? '/printer-category.png'
          : '/laptop-category.jpg';
        const quantity = parseAmount(item.quantity || 1) || 1;
        const price = parseAmount(item.price || 0);
        return {
          id: item.id,
          name: item.name || item.product_name || metadata.name || 'Product',
          description: item.description || metadata.description || '',
          price,
          quantity,
          subtotal: price * quantity,
          image: item.image || metadata.image || fallbackImage,
        };
      })
    : [];

  return {
    rawStatus: raw.status || raw.order_status || '',
    statusBadge: statusMeta.badge,
    id: raw.id,
    number: raw.order_number || raw.id,
    status,
    placedAt: raw.created_at || raw.createdAt || null,
    expectedDelivery: raw.expected_delivery || raw.expectedDelivery || null,
    subtotal: parseAmount(raw.subtotal || raw.total || 0),
    tax: parseAmount(raw.tax),
    shippingCost: parseAmount(raw.shipping),
    total: parseAmount(raw.total || raw.totalamount || 0),
    notes: raw.notes || raw.order_notes || '',
    items,
    billing: normalizeOrderDetailAddress(
      raw.billing_address || raw.billingAddress || raw.billing,
      raw.customer_name || raw.user?.name || ''
    ),
    shipping: normalizeOrderDetailAddress(
      raw.shipping_address || raw.shippingAddress || raw.shipping,
      raw.customer_name || raw.user?.name || ''
    ),
    customer: raw.user || {
      name: raw.customer_name || '',
      email: raw.user_email || raw.email || '',
      phone: raw.user_phone || raw.phone || '',
    },
  };
};

const buildOrderDetailTimeline = (status) => {
  const normalized = normalizeOrderDetailStatus(status);
  const activeIndex = ORDER_DETAIL_STEPS.findIndex((step) => step.id === normalized);
  return ORDER_DETAIL_STEPS.map((step, index) => ({
    ...step,
    completed: activeIndex >= 0 ? index <= activeIndex : index === 0,
    current: activeIndex >= 0 ? index === activeIndex : index === 0,
  }));
};

const buildOrderDetailActivity = (order) => {
  if (!order) return [];
  const timeline = buildOrderDetailTimeline(order.status);
  const activeIndex = timeline.findIndex((step) => step.current);
  return timeline.map((step, index) => ({
    id: step.id,
    label: ORDER_ACTIVITY_TEXT[step.id] || step.label,
    timestamp: index === 0 ? order.placedAt : order.expectedDelivery,
    completed: index <= activeIndex,
    current: index === activeIndex,
    statusBadge: STEP_STATUS_LABELS[step.id] || 'In Progress',
  }));
};

const orderActivityIconMap = {
  placed: FiCheckCircle,
  processing: FiPackage,
  in_transit: FiTruckIcon,
  delivered: FiCheckCircle,
};

const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    hour: includeTime ? 'numeric' : undefined,
    minute: includeTime ? 'numeric' : undefined,
  });
};

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { cartItems, cartSubtotal, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [cardForm, setCardForm] = useState({
    id: '',
    name: '',
    cardNumber: '',
    cvc: '',
    expiry: '',
    provider: 'VISA',
  });
  const [cardFormMessage, setCardFormMessage] = useState('');
  const [cardFormError, setCardFormError] = useState('');
  const [cardFormSubmitting, setCardFormSubmitting] = useState(false);
  const [cardFormMode, setCardFormMode] = useState('add');
  const [orderHistoryPage, setOrderHistoryPage] = useState(0);
  const [trackOrdersPage, setTrackOrdersPage] = useState(0);
  const ORDER_HISTORY_PAGE_SIZE = 5;
  const TRACK_ORDER_PAGE_SIZE = 5;
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  const [selectedOrderError, setSelectedOrderError] = useState('');
  const [cardMenuOpen, setCardMenuOpen] = useState(null);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    displayName: '',
    username: '',
    fullName: '',
    email: '',
    secondaryEmail: '',
    phone: '',
    country: 'Pakistan',
    city: '',
    zip: '',
  });
  const [accountMessage, setAccountMessage] = useState('');
  const [billingForm, setBillingForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    country: 'Pakistan',
    region: '',
    city: '',
    zip: '',
    email: '',
    phone: '',
  });
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    country: 'Pakistan',
    region: '',
    city: '',
    zip: '',
    email: '',
    phone: '',
  });
  const [billingMessage, setBillingMessage] = useState('');
  const [shippingMessage, setShippingMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    newPassword: false,
    confirm: false,
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem('user');
        if (!stored) {
          setLoadingUser(false);
          return;
        }

        const parsed = JSON.parse(stored);
        const userId = parsed?.id;

        if (!userId) {
          setUserInfo({ ...parsed, cards: [] });
          setLoadingUser(false);
          return;
        }

        const response = await fetch(`https://hitek-server.onrender.com/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to load user profile');
        }
        const data = await response.json();

        let cards = [];
        try {
          const cardsResponse = await fetch(`https://hitek-server.onrender.com/api/users/${userId}/cards`);
          if (!cardsResponse.ok) {
            throw new Error('Failed to load saved cards');
          }
          cards = await cardsResponse.json();
        } catch (cardError) {
          console.error('Card fetch error:', cardError);
          cards = [];
        }

        setUserInfo({ ...data, cards });
      } catch (error) {
        console.error('Profile fetch error:', error);
        setUserError(error.message || 'Failed to load user profile.');
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      if (!userInfo?.id) {
        setOrders([]);
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);
      setOrdersError('');
      try {
        const response = await fetch(`https://hitek-server.onrender.com/api/orders?userId=${userInfo.id}`);
        if (!response.ok) {
          throw new Error('Failed to load orders');
        }
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Orders fetch error:', error);
        setOrdersError(error.message || 'Failed to load orders.');
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [userInfo?.id]);

  const displayName = useMemo(() => {
    if (!userInfo) return 'Guest User';
    const combined = [userInfo.first_name, userInfo.last_name].filter(Boolean).join(' ');
    return combined || userInfo.email || 'Guest User';
  }, [userInfo]);

  const locationText = useMemo(() => {
    if (!userInfo) return 'Karachi, Pakistan';
    const locationParts = [userInfo.city, userInfo.province].filter(Boolean);
    return locationParts.length ? locationParts.join(', ') : 'Karachi, Pakistan';
  }, [userInfo]);

  const billingAddress = useMemo(() => {
    if (!userInfo) return 'Block 7, Gulshan-e-Iqbal, Street 12, House 45, Karachi-75300, Pakistan';
    const parts = [userInfo.shipment_address, userInfo.address, userInfo.city, userInfo.province].filter(Boolean);
    return parts.length ? parts.join(', ') : 'No billing address saved yet.';
  }, [userInfo]);

  const navigationItems = [
    { label: 'Dashboard', icon: <FaRegUser /> },
    { label: 'Order History', icon: <FaClipboardList /> },
    { label: 'Order Details', icon: <FaClipboardList /> },
    { label: 'Track Order', icon: <FaTruck /> },
    { label: 'Shopping Cart', icon: <FaShoppingCart /> },
    { label: 'Wishlist', icon: <FaRegHeart /> },
    { label: 'Cards & Address', icon: <FaAddressCard /> },
    { label: 'Browsing History', icon: <FaHistory /> },
    { label: 'Setting', icon: <FaCog /> },
    { label: 'Log out', icon: <FaSignOutAlt /> },
  ];

  const stats = useMemo(() => {
    if (!userInfo) {
      return [
        { label: 'Total Orders', value: 0, color: 'bg-blue-100 text-blue-600' },
        { label: 'Pending Orders', value: 0, color: 'bg-orange-100 text-orange-600' },
        { label: 'Completed Orders', value: 0, color: 'bg-green-100 text-green-600' },
      ];
    }

    const formatStat = (val) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      const parsed = Number(val);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return [
      {
        label: 'Total Orders',
        value: formatStat(userInfo.totalorders),
        color: 'bg-blue-100 text-blue-600',
      },
      {
        label: 'Pending Orders',
        value: formatStat(userInfo.pending),
        color: 'bg-orange-100 text-orange-600',
      },
      {
        label: 'Completed Orders',
        value: formatStat(userInfo.completed),
        color: 'bg-green-100 text-green-600',
      },
    ];
  }, [userInfo]);

  const formatCurrency = (value) =>
    `PKR ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

  const formattedOrders = useMemo(() => {
    return orders.map((order) => {
      const itemCount = order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      return {
        id: order.id,
        displayId: `#${order.id}`,
        status: order.status?.toUpperCase?.() || 'PENDING',
        date: order.created_at ? new Date(order.created_at).toLocaleString() : '—',
        total: `PKR ${Number(order.total || 0).toLocaleString('en-PK')} (${itemCount} Products)`,
      };
    });
  }, [orders]);

  const recentOrders = useMemo(() => {
    return formattedOrders.slice(0, 7);
  }, [formattedOrders]);

const providerDisplayNameMap = {
  VISA: 'VISA',
  MASTERCARD: 'MasterCard',
  EASYPAISA: 'EasyPaisa',
  NAYAPAY: 'NayaPay',
  SADAPAY: 'SadaPay',
};

const userCards = useMemo(() => {
  if (!userInfo?.cards || !Array.isArray(userInfo.cards) || userInfo.cards.length === 0) {
    return [];
  }

  return userInfo.cards.map((card) => {
    const provider = (card.provider || '').toUpperCase();
    const providerLabel = providerDisplayNameMap[provider] || provider || 'CARD';
    const gradient = PROVIDER_GRADIENT_MAP[provider] || 'from-gray-700 to-gray-900';
    const mask = formatCardMask(card.card_number);
    const holderName = card.name_on_card || displayName || 'Card Holder';

    return {
      id: card.id,
      provider: providerLabel,
      rawProvider: provider,
      mask: mask || card.card_number,
      holder: holderName,
      gradient,
      expiry: card.expiry || '',
      number: card.card_number || '',
      cvc: card.cvc || '',
    };
  });
}, [userInfo?.cards, displayName]);

  const browsingHistory = useMemo(() => {
    const items = [];
    orders.forEach((order) => {
      (order.order_items || []).forEach((item) => {
        items.push({
          title: item.name,
          price: `PKR ${Number(item.price || 0).toLocaleString('en-PK')}`,
          image: item.metadata?.image || '/laptop-category.jpg',
          rating: 4.5,
          reviews: 120,
          badge: null,
        });
      });
    });
    return items.slice(0, 8);
  }, [orders]);

  const itemsPerHistoryPage = 4;
  const totalHistoryPages = Math.max(1, Math.ceil(browsingHistory.length / itemsPerHistoryPage));

  const cartItemsDetailed = useMemo(() => {
    return cartItems.map((item) => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 0) || 1;
      const safePrice = Number.isFinite(price) ? price : 0;
      const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
      return {
        ...item,
        displayName: item.name || item.title || 'Product',
        image: item.image || item.thumbnail || '/laptop-category.jpg',
        price: safePrice,
        quantity: safeQuantity,
        lineTotal: safePrice * safeQuantity,
      };
    });
  }, [cartItems]);

  const cartIsEmpty = cartItemsDetailed.length === 0;
  const formattedCartSubtotal = useMemo(() => formatCurrency(cartSubtotal), [cartSubtotal]);

  const paymentProviders = ['Visa', 'Mastercard', 'Easypaisa', 'Nayapay', 'Sadapay'];

  const userAddresses = useMemo(() => {
    if (!userInfo) return [];
    const addresses = [];

    const shippingLines = [userInfo.shipment_address, userInfo.city, userInfo.province]
      .filter(Boolean)
      .map((line) => line.trim());
    if (shippingLines.length) {
      addresses.push({
        label: 'Shipping Address',
        lines: shippingLines,
        phone: userInfo.phone,
        email: userInfo.email,
      });
    }

    const billingLines = [userInfo.address, userInfo.city, userInfo.province]
      .filter(Boolean)
      .map((line) => line.trim());
    if (billingLines.length) {
      addresses.push({
        label: 'Billing Address',
        lines: billingLines,
        phone: userInfo.phone,
        email: userInfo.email,
      });
    }

    if (addresses.length === 0) {
      addresses.push({
        label: 'No Addresses Found',
        lines: ['Add your address information to manage deliveries easily.'],
        phone: userInfo.phone,
        email: userInfo.email,
      });
    }

    return addresses;
  }, [userInfo]);

  const handleDecreaseQuantity = (id, currentQuantity) => {
    const numericQuantity = Number(currentQuantity);
    const safeCurrent = Number.isFinite(numericQuantity) && numericQuantity > 0 ? numericQuantity : 1;
    const nextQuantity = Math.max(1, safeCurrent - 1);
    updateQuantity(id, nextQuantity);
  };

  const handleIncreaseQuantity = (id, currentQuantity) => {
    const numericQuantity = Number(currentQuantity);
    const safeCurrent = Number.isFinite(numericQuantity) && numericQuantity > 0 ? numericQuantity : 1;
    const nextQuantity = safeCurrent + 1;
    updateQuantity(id, nextQuantity);
  };

  const handleCardFormChange = (event) => {
    const { name, value } = event.target;
    setCardForm((prev) => ({
      ...prev,
      [name]:
        name === 'provider'
          ? value.toUpperCase()
          : name === 'cardNumber'
            ? formatCardInput(value)
            : name === 'expiry'
              ? formatExpiryInput(value)
              : value,
    }));
    setCardFormMessage('');
    setCardFormError('');
  };

const handleCardFormSubmit = async (event) => {
  event.preventDefault();
  if (!userInfo?.id) {
    setCardFormError('Please sign in to save your card.');
    return;
  }

  const payload = {
    name_on_card: cardForm.name.trim(),
    card_number: cardForm.cardNumber.replace(/\s+/g, ''),
    cvc: cardForm.cvc.trim(),
    expiry: cardForm.expiry.trim(),
    provider: cardForm.provider.toUpperCase(),
  };

  if (!payload.name_on_card || !payload.card_number || !payload.cvc || !payload.expiry || !payload.provider) {
    setCardFormError('Please complete all card fields.');
    return;
  }

  setCardFormSubmitting(true);
  setCardFormError('');

  try {
    const method = cardFormMode === 'edit' ? 'PUT' : 'POST';
    const endpoint =
      cardFormMode === 'edit'
        ? `https://hitek-server.onrender.com/api/users/${userInfo.id}/cards/${cardForm.id}`
        : `https://hitek-server.onrender.com/api/users/${userInfo.id}/cards`;

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save card.');
    }

    const savedCard = data.card || data;
    setUserInfo((prev) => {
      if (!prev) return prev;
      const existingCards = Array.isArray(prev.cards) ? prev.cards : [];
      if (cardFormMode === 'edit') {
        return {
          ...prev,
          cards: existingCards.map((item) => (item.id === savedCard.id ? savedCard : item)),
        };
      }
      return {
        ...prev,
        cards: [savedCard, ...existingCards],
      };
    });

    setCardFormMessage(cardFormMode === 'edit' ? 'Card updated successfully.' : 'Card saved successfully.');
    setCardMenuOpen(null);
    closeAddCardModal();
  } catch (error) {
    console.error('Card submit error:', error);
    setCardFormError(error.message || 'Failed to save card.');
  } finally {
    setCardFormSubmitting(false);
  }
};

  const handleViewOrderDetails = async (orderId) => {
    if (!orderId) return;
    setSelectedOrderLoading(true);
    setSelectedOrderError('');
    setActiveTab('Order Details');

    try {
    const response = await fetch(`https://hitek-server.onrender.com/api/orders/${orderId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Unable to find this order.');
        }
        throw new Error('Failed to load order details.');
      }
      const data = await response.json();
      setSelectedOrderDetails(sanitizeOrderDetailData(data));
    } catch (error) {
      console.error('Load order details error:', error);
      setSelectedOrderError(error.message || 'Failed to load order details.');
      setSelectedOrderDetails(null);
    } finally {
      setSelectedOrderLoading(false);
    }
  };

  const handleCardMenuToggle = (cardId) => {
    setCardMenuOpen((prev) => (prev === cardId ? null : cardId));
  };

  const handleCardAction = (action, card) => {
    if (!userInfo?.id) {
      setCardFormError('You need to be signed in to manage cards.');
      setCardMenuOpen(null);
      return;
    }

    if (action === 'Edit Card') {
      setCardForm({
        id: card.id,
        name: card.name_on_card || '',
        cardNumber: formatCardInput(card.card_number),
        cvc: card.cvc || '',
        expiry: formatExpiryInput(card.expiry),
        provider: (card.rawProvider || card.provider || 'VISA').toUpperCase(),
      });
      setCardFormMode('edit');
      setCardFormMessage('');
      setCardFormError('');
      setIsAddCardModalOpen(true);
    } else if (action === 'Delete Card') {
      const confirmDelete =
        typeof window === 'undefined' ? true : window.confirm('Remove this saved card?');
      if (!confirmDelete) {
        setCardMenuOpen(null);
        return;
      }

      const deleteCard = async () => {
        setCardFormSubmitting(true);
        setCardFormMessage('');
        setCardFormError('');
        try {
          const response = await fetch(`https://hitek-server.onrender.com/api/users/${userInfo.id}/cards/${card.id}`, {
            method: 'DELETE',
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(payload.error || 'Failed to delete card.');
          }
          setUserInfo((prev) =>
            prev
              ? {
                  ...prev,
                  cards: (prev.cards || []).filter((item) => item.id !== card.id),
                }
              : prev,
          );
          setCardFormMessage('Card deleted successfully.');
        } catch (error) {
          console.error('Card delete error:', error);
          setCardFormError(error.message || 'Failed to delete card.');
        } finally {
          setCardFormSubmitting(false);
        }
      };

      deleteCard();
    }

    setCardMenuOpen(null);
  };

  const resetCardForm = () => {
    setCardForm({
      id: '',
      name: '',
      cardNumber: '',
      cvc: '',
      expiry: '',
      provider: 'VISA',
    });
    setCardFormMode('add');
    setCardFormError('');
  };

  const closeAddCardModal = () => {
    setIsAddCardModalOpen(false);
    setCardFormSubmitting(false);
    resetCardForm();
  };

  useEffect(() => {
    const totalOrderPages = Math.max(
      1,
      Math.ceil(formattedOrders.length / ORDER_HISTORY_PAGE_SIZE),
    );
    if (orderHistoryPage > totalOrderPages - 1) {
      setOrderHistoryPage(Math.max(0, totalOrderPages - 1));
    }
  }, [formattedOrders.length, orderHistoryPage, ORDER_HISTORY_PAGE_SIZE]);

  useEffect(() => {
    if (activeTab === 'Order History') {
      setOrderHistoryPage(0);
    }
  }, [activeTab]);

  useEffect(() => {
    if (historyPage > totalHistoryPages - 1) {
      setHistoryPage(Math.max(0, totalHistoryPages - 1));
    }
  }, [historyPage, totalHistoryPages]);

  useEffect(() => {
    const totalTrackPages = Math.max(
      1,
      Math.ceil(orders.length / TRACK_ORDER_PAGE_SIZE),
    );
    if (trackOrdersPage > totalTrackPages - 1) {
      setTrackOrdersPage(Math.max(0, totalTrackPages - 1));
    }
  }, [orders.length, trackOrdersPage, TRACK_ORDER_PAGE_SIZE]);

  useEffect(() => {
    if (activeTab === 'Track Order') {
      setTrackOrdersPage(0);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!userInfo) return;
    const fullName = [userInfo.first_name, userInfo.last_name].filter(Boolean).join(' ');
    setAccountForm((prev) => ({
      ...prev,
      displayName: userInfo.display_name || fullName || userInfo.email || '',
      username: userInfo.username || '',
      fullName: fullName || '',
      email: userInfo.email || '',
      secondaryEmail: userInfo.secondary_email || '',
      phone: userInfo.phone || '',
      country: userInfo.country || 'Pakistan',
      city: userInfo.city || '',
      zip: userInfo.zip || userInfo.postal_code || '',
    }));

    setBillingForm((prev) => ({
      ...prev,
      firstName: userInfo.first_name || '',
      lastName: userInfo.last_name || '',
      company: userInfo.company || '',
      address: userInfo.address || userInfo.billing_address || '',
      country: userInfo.country || 'Pakistan',
      region: userInfo.province || '',
      city: userInfo.city || '',
      zip: userInfo.zip || userInfo.postal_code || '',
      email: userInfo.email || '',
      phone: userInfo.phone || '',
    }));

    setShippingForm((prev) => ({
      ...prev,
      firstName: userInfo.first_name || '',
      lastName: userInfo.last_name || '',
      company: userInfo.company || '',
      address: userInfo.shipment_address || userInfo.address || '',
      country: userInfo.country || 'Pakistan',
      region: userInfo.shipping_province || '',
      city: userInfo.shipping_city || userInfo.city || '',
      zip: userInfo.shipping_zip || userInfo.zip || '',
      email: userInfo.email || '',
      phone: userInfo.phone || '',
    }));
  }, [userInfo]);

  const renderOrderHistorySection = ({
    title = 'Recent Order',
    showViewAll = true,
    rows,
    paginate = false,
  } = {}) => {
    const rowsToRender = Array.isArray(rows) ? rows : recentOrders;
    const totalPages = paginate
      ? Math.max(1, Math.ceil(rowsToRender.length / ORDER_HISTORY_PAGE_SIZE))
      : 1;
    const currentPage = paginate
      ? Math.min(orderHistoryPage, totalPages - 1)
      : 0;
    const startIndex = currentPage * ORDER_HISTORY_PAGE_SIZE;
    const visibleRows = paginate
      ? rowsToRender.slice(startIndex, startIndex + ORDER_HISTORY_PAGE_SIZE)
      : rowsToRender.slice(0, ORDER_HISTORY_PAGE_SIZE);

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {showViewAll && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('Order History');
                setOrderHistoryPage(0);
              }}
              className="text-sm text-[#00aeef] font-semibold flex items-center gap-1 hover:underline"
            >
              View All <FiChevronRight />
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : ordersError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-red-500">
                    {ordersError}
                  </td>
                </tr>
              ) : rowsToRender.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500">
                    No orders found yet.
                  </td>
                </tr>
              ) : (
                visibleRows.map((order, index) => {
                  const statusColor =
                    order.status === 'IN PROGRESS'
                      ? 'text-amber-500'
                      : order.status === 'COMPLETED'
                      ? 'text-green-500'
                      : order.status === 'CANCELED'
                      ? 'text-red-500'
                      : 'text-blue-500';
                  return (
                    <tr key={`${order.id}-${startIndex + index}`} className={(startIndex + index) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-3 font-medium text-gray-900">{order.displayId}</td>
                      <td className={`px-6 py-3 font-semibold ${statusColor}`}>{order.status}</td>
                      <td className="px-6 py-3">{order.date}</td>
                      <td className="px-6 py-3 text-gray-900 font-medium">{order.total}</td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => handleViewOrderDetails(order.id)}
                          className="text-[#00aeef] font-semibold flex items-center gap-1 hover:underline disabled:opacity-60"
                          disabled={selectedOrderLoading}
                        >
                          View Details <FiChevronRight className="text-xs" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {paginate && rowsToRender.length > ORDER_HISTORY_PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setOrderHistoryPage(Math.max(0, currentPage - 1))}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <div className="flex items-center gap-2 justify-center">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setOrderHistoryPage(index)}
                  className={`w-8 h-8 rounded-md text-sm font-semibold ${
                    index === currentPage
                      ? 'bg-[#00aeef] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setOrderHistoryPage(Math.min(totalPages - 1, currentPage + 1))
              }
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBrowsingHistorySection = ({
    title = 'Browsing History',
    showViewAll = true,
  } = {}) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
      </div>
      <div className="px-5 py-5">
        {ordersLoading ? (
          <div className="py-10 text-sm text-gray-500 text-center">
            Loading browsing history...
          </div>
        ) : browsingHistory.length === 0 ? (
          <div className="py-10 text-sm text-gray-500 text-center">
            No recently viewed products yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {browsingHistory
                .slice(
                  historyPage * itemsPerHistoryPage,
                  historyPage * itemsPerHistoryPage + itemsPerHistoryPage,
                )
                .map((item, index) => (
                  <div
                    key={`${item.title}-${historyPage * itemsPerHistoryPage + index}`}
                    className="border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-3 hover:shadow-lg transition"
                  >
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-32 object-contain"
                      />
                      {item.badge && (
                        <span
                          className={`absolute top-2 left-2 text-xs font-semibold text-white px-2 py-1 rounded ${item.badge.color}`}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                      {'★★★★★'.split('').map((star, starIndex) => (
                        <span key={starIndex}>
                          {starIndex < Math.round(item.rating) ? '★' : '☆'}
                        </span>
                      ))}
                      <span className="text-gray-500 ml-2">({item.reviews})</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 leading-snug min-h-12">
                      {item.title}
                    </h4>
                    <div className="text-[#00aeef] font-semibold">{item.price}</div>
                  </div>
                ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalHistoryPages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setHistoryPage(index)}
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    index === historyPage ? 'bg-[#00aeef]' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const handleAccountInputChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setAccountMessage('');
  };

  const handleAccountSubmit = (event) => {
    event.preventDefault();
    setAccountMessage('Changes saved locally. Connect backend to persist updates.');
  };

  const handleBillingChange = (event) => {
    const { name, value } = event.target;
    setBillingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setBillingMessage('');
  };

  const handleShippingChange = (event) => {
    const { name, value } = event.target;
    setShippingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setShippingMessage('');
  };

  const handleBillingSubmit = (event) => {
    event.preventDefault();
    setBillingMessage('Billing address saved locally. Connect backend to persist updates.');
  };

  const handleShippingSubmit = (event) => {
    event.preventDefault();
    setShippingMessage('Shipping address saved locally. Connect backend to persist updates.');
  };

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError('');
    setPasswordMessage('');
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirm) {
      setPasswordError('Please fill out all password fields.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordError('');
    setPasswordMessage('Password updated locally. Connect backend to finalize.');
    setPasswordForm({ current: '', newPassword: '', confirm: '' });
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${openSans.className}`}>
      <Navbar />

      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#00aeef] transition">Home</Link>
            <span className="text-gray-500">›</span>
            <span className="text-[#00aeef]">User Profile</span>
          </nav>
        </div>
      </div>

      <main className="grow py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = activeTab === item.label;
                const isLogout = item.label === 'Log out';
                const isOrderDetails = item.label === 'Order Details';
                const isDisabledOrderDetails = isOrderDetails && !selectedOrderDetails && !selectedOrderLoading;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      disabled={isDisabledOrderDetails}
                      onClick={() => {
                        if (isLogout) {
                          if (typeof window !== 'undefined') {
                            window.localStorage.removeItem('user');
                            window.location.href = '/';
                          }
                          return;
                        }
                        if (isOrderDetails) {
                          if (!isDisabledOrderDetails) {
                            setActiveTab('Order Details');
                          }
                          return;
                        }
                        setActiveTab(item.label);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition ${
                        isActive
                          ? 'bg-[#00aeef] text-white shadow'
                          : isLogout
                          ? 'text-red-500 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${isDisabledOrderDetails ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {!isActive && !isLogout && <FiChevronRight className="text-xs text-gray-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Main Content */}
          <section className="flex-1 space-y-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Assalam U Alaykum, {displayName}
              </h1>
              <p className="text-sm text-gray-600">
                From your profile, you can easily check &amp; view your{' '}
                <Link href="#" className="text-[#00aeef] hover:underline">
                  Recent Orders
                </Link>
                , manage your{' '}
                <Link href="#" className="text-[#00aeef] hover:underline">
                  Shipping and Billing Addresses
                </Link>{' '}
                and edit your{' '}
                <Link href="#" className="text-[#00aeef] hover:underline">
                  Password and Account Details
                </Link>
                .
              </p>
            </div>

            {activeTab === 'Dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col gap-4">
                      {loadingUser ? (
                        <div className="text-sm text-gray-500">Loading account information...</div>
                      ) : userError ? (
                        <div className="text-sm text-red-500">{userError}</div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500">
                              {displayName
                                .split(' ')
                                .map((part) => part.charAt(0))
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <h2 className="text-base font-semibold text-gray-900">{displayName}</h2>
                              <p className="text-sm text-gray-500">{locationText}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Email: <span className="text-gray-900">{userInfo?.email || '—'}</span></p>
                            <p>Phone: <span className="text-gray-900">{userInfo?.phone || '—'}</span></p>
                            {userInfo?.created_at && (
                              <p>
                                Member Since:{' '}
                                <span className="text-gray-900">
                                  {new Date(userInfo.created_at).toLocaleDateString()}
                                </span>
                              </p>
                            )}
                          </div>
                          <button className="self-start px-4 py-2 border border-[#00aeef] text-[#00aeef] rounded-md text-sm font-semibold hover:bg-[#00aeef] hover:text-white transition flex items-center gap-2">
                            <FiEdit2 /> Edit Account
                          </button>
                        </>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col gap-4">
                      {loadingUser ? (
                        <div className="text-sm text-gray-500">Loading billing address...</div>
                      ) : userError ? (
                        <div className="text-sm text-red-500">{userError}</div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#00aeef]">
                              <FiMapPin />
                            </div>
                            <div>
                              <h2 className="text-base font-semibold text-gray-900">Billing Address</h2>
                              <p className="text-sm text-gray-500">{displayName}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>{billingAddress}</p>
                            <p>Phone Number: <span className="text-gray-900">{userInfo?.phone || '—'}</span></p>
                            <p>Email: <span className="text-gray-900">{userInfo?.email || '—'}</span></p>
                          </div>
                          <button className="self-start px-4 py-2 border border-[#00aeef] text-[#00aeef] rounded-md text-sm font-semibold hover:bg-[#00aeef] hover:text-white transition flex items-center gap-2">
                            <FiEdit2 /> Edit Address
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-rows-3 gap-4">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className={`rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center px-4 py-5 ${stat.color}`}
                      >
                        <span className="text-xs uppercase tracking-wide">{stat.label}</span>
                        <span className="text-2xl font-bold">{stat.value.toLocaleString('en-PK')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Option</h3>
                    <button
                      onClick={() => {
                        resetCardForm();
                        setCardFormMode('add');
                        setCardFormMessage('');
                        setCardFormError('');
                        setIsAddCardModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#00aeef] hover:text-[#0099d9] transition"
                    >
                      Add Card <FiChevronRight />
                    </button>
                  </div>
                  {!isAddCardModalOpen && cardFormMessage && (
                    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {cardFormMessage}
                    </div>
                  )}
                  {!isAddCardModalOpen && cardFormError && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {cardFormError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userCards.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-xl p-6 text-sm text-gray-500">
                        You haven't saved any cards yet. Add your primary payment method for faster checkout.
                      </div>
                    ) : (
                      userCards.map((card) => (
                        <div
                          key={card.id}
                          className={`relative ${cardMenuOpen === card.id ? 'z-10' : ''} overflow-hidden rounded-xl p-5 shadow-lg bg-linear-to-r ${card.gradient} text-white`}
                          onMouseLeave={() => setCardMenuOpen(null)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-xs uppercase tracking-wide opacity-80">Card Number</div>
                            <button
                              type="button"
                              onClick={() => handleCardMenuToggle(card.id)}
                              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                              aria-label="Card actions"
                            >
                              <FaEllipsisH />
                            </button>
                            {cardMenuOpen === card.id && (
                              <div className="absolute right-4 top-12 bg-white text-gray-700 rounded-md shadow-lg border border-gray-200 w-36 z-10">
                                <button
                                  type="button"
                                  onClick={() => handleCardAction('Edit Card', card)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                  Edit Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCardAction('Delete Card', card)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                  Delete Card
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 text-2xl font-semibold tracking-widest">{card.mask}</div>

                          <div className="mt-6 flex items-center justify-between text-sm">
                            <div>
                              <p className="opacity-80">Name on card</p>
                              <p className="font-semibold text-base">{card.holder}</p>
                            </div>
                            <div className="text-right">
                              <p className="opacity-80 uppercase text-xs">Provider</p>
                              <p className="font-semibold text-base">{card.provider}</p>
                              {card.expiry && (
                                <p className="text-xs opacity-70 mt-1">Exp {card.expiry}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {renderOrderHistorySection({ title: 'Recent Order', showViewAll: true, rows: recentOrders })}

                {renderBrowsingHistorySection()}
              </>
            )}

            {activeTab === 'Order History' && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Review your past purchases and keep track of their status in one place.
                  </p>
                </div>
                {renderOrderHistorySection({
                  title: 'Order History',
                  showViewAll: false,
                  rows: formattedOrders,
                  paginate: true,
                })}
              </>
            )}

            {activeTab === 'Track Order' && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Track Your Orders</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Select any order below to view real-time tracking details, product breakdowns, and delivery updates.
                  </p>
                </div>

                {(() => {
                  const totalTrackPages = Math.max(
                    1,
                    Math.ceil(orders.length / TRACK_ORDER_PAGE_SIZE),
                  );
                  const currentTrackPage = Math.min(trackOrdersPage, totalTrackPages - 1);
                  const startIndex = currentTrackPage * TRACK_ORDER_PAGE_SIZE;
                  const visibleOrders = orders.slice(
                    startIndex,
                    startIndex + TRACK_ORDER_PAGE_SIZE,
                  );

                  return (
                    <>
                      <div className="space-y-4">
                        {ordersLoading ? (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-sm text-gray-500">
                            Fetching your orders...
                          </div>
                        ) : ordersError ? (
                          <div className="bg-white border border-red-200 rounded-lg shadow-sm p-10 text-center text-sm text-red-500">
                            {ordersError}
                          </div>
                        ) : orders.length === 0 ? (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-sm text-gray-500">
                            You haven't placed any orders yet. Once you do, you can track them all here.
                          </div>
                        ) : (
                          visibleOrders.map((order) => {
                            const orderStatus = order.status?.toUpperCase?.() || 'PENDING';
                            const statusColor =
                              orderStatus === 'COMPLETED'
                                ? 'text-green-600 bg-green-50'
                                : orderStatus === 'IN PROGRESS'
                                ? 'text-amber-600 bg-amber-50'
                                : orderStatus === 'CANCELED'
                                ? 'text-red-600 bg-red-50'
                                : 'text-blue-600 bg-blue-50';

                            const itemCount =
                              order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

                            return (
                              <div
                                key={order.id}
                                className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex flex-1 flex-col gap-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                    <p className="text-sm font-semibold text-gray-900">
                                      Order ID:{' '}
                                      <span className="text-gray-700">
                                        #{order.id}
                                      </span>
                                    </p>
                                    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
                                      {orderStatus}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Placed on{' '}
                                    <span className="text-gray-900">
                                      {order.created_at
                                        ? new Date(order.created_at).toLocaleString('en-PK', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                          })
                                        : 'Unknown'}
                                    </span>
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Total:{' '}
                                    <span className="text-gray-900 font-semibold">
                                      PKR {Number(order.total || 0).toLocaleString('en-PK')}
                                    </span>{' '}
                                    • {itemCount} product{itemCount === 1 ? '' : 's'}
                                  </p>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                  {order.expected_delivery && (
                                    <div className="text-xs text-gray-500">
                                      Expected Delivery:{' '}
                                      <span className="text-gray-900 font-medium">
                                        {new Date(order.expected_delivery).toLocaleDateString('en-PK', {
                                          dateStyle: 'medium',
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleViewOrderDetails(order.id)}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#00aeef] text-white hover:bg-[#0099d9] text-sm font-semibold transition disabled:opacity-60"
                                    disabled={selectedOrderLoading}
                                  >
                                    Track Order <FiChevronRight />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {orders.length > TRACK_ORDER_PAGE_SIZE && !ordersLoading && !ordersError && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                          <button
                            type="button"
                            onClick={() => setTrackOrdersPage(Math.max(0, currentTrackPage - 1))}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={currentTrackPage === 0}
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-2 justify-center">
                            {Array.from({ length: totalTrackPages }).map((_, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setTrackOrdersPage(index)}
                                className={`w-8 h-8 rounded-md text-sm font-semibold ${
                                  index === currentTrackPage
                                    ? 'bg-[#00aeef] text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {index + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setTrackOrdersPage(Math.min(totalTrackPages - 1, currentTrackPage + 1))}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={currentTrackPage >= totalTrackPages - 1}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {activeTab === 'Order Details' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Review the current status and breakdown of your selected order.
                  </p>
                </div>

                {selectedOrderLoading && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-sm text-gray-500">
                    <FiRefreshCw className="mx-auto text-2xl animate-spin mb-3" />
                    Loading order details...
                  </div>
                )}

                {!selectedOrderLoading && selectedOrderError && (
                  <div className="bg-white border border-red-200 rounded-lg shadow-sm p-10 text-center text-sm text-red-500">
                    <FiAlertCircle className="mx-auto text-2xl mb-3" />
                    {selectedOrderError}
                  </div>
                )}

                {!selectedOrderLoading && !selectedOrderError && !selectedOrderDetails && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-sm text-gray-500">
                    Select an order from Order History or Track Order to view its details here.
                  </div>
                )}

                {!selectedOrderLoading && !selectedOrderError && selectedOrderDetails && (
                  <>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                          Order #{selectedOrderDetails.number}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          {selectedOrderDetails.items.length} Product{selectedOrderDetails.items.length === 1 ? '' : 's'} • Order placed on{' '}
                          <span className="font-semibold text-gray-900">{formatDate(selectedOrderDetails.placedAt)}</span>
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              ACTIVITY_BADGE_STYLES[selectedOrderDetails.statusBadge] || 'border-blue-200 bg-blue-50 text-blue-600'
                            }`}
                          >
                            {selectedOrderDetails.statusBadge || 'In Progress'}
                          </span>
                          {selectedOrderDetails.rawStatus && (
                            <span className="text-xs text-gray-500 capitalize">
                              Current status: {selectedOrderDetails.rawStatus.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Total amount
                        </p>
                        <p className="text-3xl font-bold text-blue-500 mt-2">
                          {formatCurrency(selectedOrderDetails.total)}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const timeline = buildOrderDetailTimeline(selectedOrderDetails.status);
                      const activeIndex = timeline.findIndex((step) => step.current);
                      const denominator = Math.max(1, timeline.length - 1);
                      const normalizedIndex = activeIndex >= 0 ? activeIndex : 0;
                      const progressPercent = Math.min(100, Math.max(0, (normalizedIndex / denominator) * 100));
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                          
                          <div className="mt-6 px-2">
                            <div className="relative h-1 bg-blue-100 rounded-full">
                              <div
                                className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                              {timeline.map((step, index) => {
                                const Icon = step.icon || FiCheckCircle;
                                return (
                                  <div key={step.id} className="flex flex-col items-center gap-2 text-center">
                                    <span
                                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                                        step.completed
                                          ? 'border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-200'
                                          : 'border-blue-100 bg-white text-blue-200'
                                      }`}
                                    >
                                      <Icon className="text-lg" />
                                    </span>
                                    <span
                                      className={`text-xs font-semibold uppercase tracking-wide ${
                                        step.completed ? 'text-blue-600' : 'text-gray-400'
                                      }`}
                                    >
                                      {step.label}
                                    </span>
                                    <span className="text-[11px] text-gray-400">Step {index + 1}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const activity = buildOrderDetailActivity(selectedOrderDetails);
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-3">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Order Activity</h3>
                          {activity.map((entry, index) => {
                            const Icon = orderActivityIconMap[entry.id] || FiClock;
                            return (
                              <div
                                key={entry.id || index}
                                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                                  entry.completed
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : entry.current
                                      ? 'border-blue-200 bg-blue-50'
                                      : 'border-gray-100 bg-gray-50'
                                }`}
                              >
                                <span
                                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border ${
                                    entry.completed
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-500'
                                      : 'border-gray-200 bg-white text-gray-400'
                                  }`}
                                >
                                  <Icon className="text-sm" />
                                </span>
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                    <p className="text-sm text-gray-800">{entry.label}</p>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                        ACTIVITY_BADGE_STYLES[entry.statusBadge] || 'border-blue-200 bg-blue-50 text-blue-600'
                                      }`}
                                    >
                                      {entry.statusBadge}-
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Product ({selectedOrderDetails.items.length.toString().padStart(2, '0')})
                        </h3>
                        <p className="text-sm text-gray-500">Review every item included in this order.</p>
                      </div>
                      <div className="overflow-hidden border border-gray-200 rounded-xl">
                        <table className="min-w-full text-sm text-gray-700">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-5 py-3 text-left font-semibold">Products</th>
                              <th className="px-5 py-3 text-left font-semibold">Price</th>
                              <th className="px-5 py-3 text-left font-semibold">Quantity</th>
                              <th className="px-5 py-3 text-right font-semibold">Sub-total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {selectedOrderDetails.items.map((item) => (
                              <tr key={item.id || item.name}>
                                <td className="px-5 py-4">
                                  <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                      <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                      {item.description && (
                                        <p className="text-xs text-gray-500 max-w-md">{item.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-700">{formatCurrency(item.price)}</td>
                                <td className="px-5 py-4 text-sm text-gray-700">x{item.quantity}</td>
                                <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                                  {formatCurrency(item.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="w-full md:w-72 ml-auto space-y-1 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(selectedOrderDetails.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tax</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(selectedOrderDetails.tax)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Shipping</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(selectedOrderDetails.shippingCost)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2 text-base font-semibold text-gray-900">
                          <span>Total</span>
                          <span>{formatCurrency(selectedOrderDetails.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Billing Address</h3>
                        <div className="text-sm text-gray-700 leading-6 space-y-1">
                          {selectedOrderDetails.billing.name && (
                            <p className="font-semibold text-gray-900">{selectedOrderDetails.billing.name}</p>
                          )}
                          {selectedOrderDetails.billing.lines.length > 0 ? (
                            selectedOrderDetails.billing.lines.map((line, index) => (
                              <p key={index}>{line}</p>
                            ))
                          ) : (
                            <p className="text-gray-500">No billing address provided.</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {selectedOrderDetails.billing.phone && (
                            <p className="flex items-center gap-2">
                              <FiPhone /> {selectedOrderDetails.billing.phone}
                            </p>
                          )}
                          {selectedOrderDetails.billing.email && (
                            <p className="flex items-center gap-2">
                              <FiMail /> {selectedOrderDetails.billing.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Shipping Address</h3>
                        <div className="text-sm text-gray-700 leading-6 space-y-1">
                          {selectedOrderDetails.shipping.name && (
                            <p className="font-semibold text-gray-900">{selectedOrderDetails.shipping.name}</p>
                          )}
                          {selectedOrderDetails.shipping.lines.length > 0 ? (
                            selectedOrderDetails.shipping.lines.map((line, index) => (
                              <p key={index}>{line}</p>
                            ))
                          ) : (
                            <p className="text-gray-500">No shipping address provided.</p>
                          )}
                        </div>
                        {selectedOrderDetails.shipping.phone && (
                          <div className="text-xs text-gray-500 space-y-1">
                            <p className="flex items-center gap-2">
                              <FiPhone /> {selectedOrderDetails.shipping.phone}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Order Notes</h3>
                        <p className="text-sm text-gray-700 leading-6">
                          {selectedOrderDetails.notes || 'No special instructions were provided for this order.'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'Shopping Cart' && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {cartIsEmpty
                          ? 'Your cart is currently empty. Add products to see them listed here.'
                          : `You have ${cartCount} ${cartCount === 1 ? 'item' : 'items'} ready for checkout.`}
                      </p>
                    </div>
                    {!cartIsEmpty && (
                      <button
                        type="button"
                        onClick={clearCart}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition"
                      >
                        <FiTrash2 /> Clear Cart
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  {cartIsEmpty ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                      Your cart is empty right now. Explore our{' '}
                      <Link href="/all-products" className="text-[#00aeef] font-semibold hover:underline">
                        latest products
                      </Link>{' '}
                      to find something you like.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cartItemsDetailed.map((item) => (
                        <div
                          key={item.id ?? item.displayName}
                          className="flex flex-col md:flex-row gap-4 border border-gray-100 rounded-lg p-4"
                        >
                          <div className="w-full md:w-28 h-28 shrink-0 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.displayName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                              <h4 className="text-base font-semibold text-gray-900">{item.displayName}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 max-w-xl">{item.description}</p>
                              )}
                              <div className="text-sm text-gray-600">
                                Unit Price:{' '}
                                <span className="text-gray-900 font-semibold">{formatCurrency(item.price)}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Line Total:{' '}
                                <span className="text-gray-900 font-semibold">{formatCurrency(item.lineTotal)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="inline-flex items-center border border-gray-200 rounded-md overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseQuantity(item.id, item.quantity)}
                                  className="px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                  disabled={item.quantity <= 1}
                                  aria-label="Decrease quantity"
                                >
                                  <FiMinus />
                                </button>
                                <span className="w-12 text-center text-sm font-semibold text-gray-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleIncreaseQuantity(item.id, item.quantity)}
                                  className="px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                                  aria-label="Increase quantity"
                                >
                                  <FiPlus />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition"
                                aria-label="Remove item"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 pt-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">Subtotal:</span>{' '}
                          {formattedCartSubtotal}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href="/cart"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white text-sm font-semibold transition"
                          >
                            View Full Cart
                          </Link>
                          <Link
                            href="/checkout"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#00aeef] text-white hover:bg-[#0099d9] text-sm font-semibold transition"
                          >
                            Proceed to Checkout
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'Browsing History' && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Browsing History</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Review the products you recently viewed to quickly get back to items of interest.
                  </p>
                </div>
                {renderBrowsingHistorySection({
                  title: 'Recently Viewed Products',
                  showViewAll: false,
                })}
              </>
            )}

            {activeTab === 'Cards & Address' && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Payment Option</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Keep your favourite cards on file for faster and safer checkout.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        resetCardForm();
                        setCardFormMode('add');
                        setCardFormMessage('');
                        setCardFormError('');
                        setIsAddCardModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#00aeef] hover:text-[#0099d9] transition"
                    >
                      Add Card <FiChevronRight />
                    </button>
                  </div>

                  {!isAddCardModalOpen && cardFormMessage && (
                    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {cardFormMessage}
                    </div>
                  )}
                  {!isAddCardModalOpen && cardFormError && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {cardFormError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userCards.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-xl p-6 text-sm text-gray-500">
                        You haven't saved any cards yet. Add your primary payment method for faster checkout.
                      </div>
                    ) : (
                      userCards.map((card) => (
                        <div
                          key={card.id}
                          className={`relative ${cardMenuOpen === card.id ? 'z-10' : ''} overflow-hidden rounded-xl p-5 shadow-lg bg-linear-to-r ${card.gradient} text-white`}
                          onMouseLeave={() => setCardMenuOpen(null)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-xs uppercase tracking-wide opacity-80">Card Number</div>
                            <button
                              type="button"
                              onClick={() => handleCardMenuToggle(card.id)}
                              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                              aria-label="Card actions"
                            >
                              <FaEllipsisH />
                            </button>
                            {cardMenuOpen === card.id && (
                              <div className="absolute right-4 top-12 bg-white text-gray-700 rounded-md shadow-lg border border-gray-200 w-36 z-10">
                                <button
                                  type="button"
                                  onClick={() => handleCardAction('Edit Card', card)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                  Edit Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCardAction('Delete Card', card)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                  Delete Card
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 text-2xl font-semibold tracking-widest">{card.mask}</div>

                          <div className="mt-6 flex items-center justify-between text-sm">
                            <div>
                              <p className="opacity-80">Name on card</p>
                              <p className="font-semibold text-base">{card.holder}</p>
                            </div>
                            <div className="text-right">
                              <p className="opacity-80 uppercase text-xs">Provider</p>
                              <p className="font-semibold text-base">{card.provider}</p>
                              {card.expiry && (
                                <p className="text-xs opacity-70 mt-1">Exp {card.expiry}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                    <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#00aeef] hover:text-[#0099d9] transition">
                      Add Address <FiChevronRight />
                    </button>
                  </div>

                  {loadingUser ? (
                    <div className="text-sm text-gray-500">Loading addresses...</div>
                  ) : userError ? (
                    <div className="text-sm text-red-500">{userError}</div>
                  ) : userAddresses.length === 0 ? (
                    <div className="text-sm text-gray-500">No addresses saved yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userAddresses.map((address, index) => (
                        <div
                          key={`${address.label}-${index}`}
                          className="border border-gray-200 rounded-2xl p-5 flex flex-col gap-3"
                        >
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {address.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{displayName}</p>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {address.lines.map((line, lineIndex) => (
                              <p key={lineIndex}>{line}</p>
                            ))}
                            {address.phone && (
                              <p className="flex items-center gap-2">
                                <FiPhone className="text-gray-400" /> <span>{address.phone}</span>
                              </p>
                            )}
                            {address.email && (
                              <p className="flex items-center gap-2">
                                <FiMail className="text-gray-400" /> <span>{address.email}</span>
                              </p>
                            )}
                          </div>
                          <div className="pt-2">
                            <button className="px-4 py-2 text-xs font-semibold text-[#00aeef] border border-[#00aeef] rounded-md hover:bg-[#00aeef] hover:text-white transition">
                              Edit Address
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isAddCardModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                      className="absolute inset-0 bg-black/40"
                      onClick={closeAddCardModal}
                      aria-hidden="true"
                    />
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900">
                          {cardFormMode === 'edit' ? 'Edit Card' : 'Add New Card'}
                        </h4>
                        <button
                          type="button"
                          onClick={closeAddCardModal}
                          className="text-gray-500 hover:text-gray-700 text-lg"
                          aria-label="Close add card modal"
                        >
                          ×
                        </button>
                      </div>

                      {cardFormError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {cardFormError}
                        </div>
                      )}

                      <form className="space-y-3" onSubmit={handleCardFormSubmit}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cardName">
                            Name on Card
                          </label>
                          <input
                            id="cardName"
                            name="name"
                            type="text"
                            value={cardForm.name}
                            onChange={handleCardFormChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Azlan Khan"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modalCardNumber">
                            Card Number
                          </label>
                          <input
                            id="modalCardNumber"
                            name="cardNumber"
                            type="text"
                            value={cardForm.cardNumber}
                            onChange={handleCardFormChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="XXXX XXXX XXXX XXXX"
                            inputMode="numeric"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modalProvider">
                            Card Provider
                          </label>
                          <select
                            id="modalProvider"
                            name="provider"
                            value={cardForm.provider}
                            onChange={handleCardFormChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef] bg-white"
                            required
                          >
                            <option value="VISA">VISA</option>
                            <option value="MASTERCARD">MasterCard</option>
                            <option value="EASYPAISA">EasyPaisa</option>
                            <option value="NAYAPAY">NayaPay</option>
                            <option value="SADAPAY">SadaPay</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modalExpiry">
                              Expire Date
                            </label>
                            <input
                              id="modalExpiry"
                              name="expiry"
                              type="text"
                              value={cardForm.expiry}
                              onChange={handleCardFormChange}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                              placeholder="MM/YY"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modalCvc">
                              CVC
                            </label>
                            <input
                              id="modalCvc"
                              name="cvc"
                              type="text"
                              value={cardForm.cvc}
                              onChange={handleCardFormChange}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                              placeholder="123"
                              inputMode="numeric"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={cardFormSubmitting}
                          className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#00aeef] text-white font-semibold hover:bg-[#0099d9] transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {cardFormSubmitting
                            ? 'Saving...'
                            : cardFormMode === 'edit'
                              ? 'Save Changes'
                              : 'Add Card'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'Setting' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">Account Setting</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Update your profile information to keep your account details accurate.
                  </p>

                  <form onSubmit={handleAccountSubmit} className="mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-blue-500 to-blue-300 shrink-0">
                        <img
                          src={userInfo?.avatar || ''}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = '';
                          }}
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="displayName">
                            Display name
                          </label>
                          <input
                            id="displayName"
                            name="displayName"
                            type="text"
                            value={accountForm.displayName}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Display name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="username">
                            Username
                          </label>
                          <input
                            id="username"
                            name="username"
                            type="text"
                            value={accountForm.username}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Display name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="fullName">
                            Full Name
                          </label>
                          <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={accountForm.fullName}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="email">
                            Email
                          </label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={accountForm.email}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="example@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="secondaryEmail">
                            Secondary Email
                          </label>
                          <input
                            id="secondaryEmail"
                            name="secondaryEmail"
                            type="email"
                            value={accountForm.secondaryEmail}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="phone">
                            Phone Number
                          </label>
                          <input
                            id="phone"
                            name="phone"
                            type="text"
                            value={accountForm.phone}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="+92-333-123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="country">
                            Country/Region
                          </label>
                          <select
                            id="country"
                            name="country"
                            value={accountForm.country}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          >
                            <option value="Pakistan">Pakistan</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="city">
                            City
                          </label>
                          <input
                            id="city"
                            name="city"
                            type="text"
                            value={accountForm.city}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Karachi"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="zip">
                            Zip Code
                          </label>
                          <input
                            id="zip"
                            name="zip"
                            type="text"
                            value={accountForm.zip}
                            onChange={handleAccountInputChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="75400"
                          />
                        </div>
                      </div>
                    </div>

                    {accountMessage && (
                      <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                        {accountMessage}
                      </div>
                    )}

                    <div>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[#00aeef] text-white font-semibold hover:bg-[#0099d9] transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Billing Address</h3>
                    <form onSubmit={handleBillingSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingFirstName">
                            First Name
                          </label>
                          <input
                            id="billingFirstName"
                            name="firstName"
                            type="text"
                            value={billingForm.firstName}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Azlan"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingLastName">
                            Last Name
                          </label>
                          <input
                            id="billingLastName"
                            name="lastName"
                            type="text"
                            value={billingForm.lastName}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Khan"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingCompany">
                          Company Name (Optional)
                        </label>
                        <input
                          id="billingCompany"
                          name="company"
                          type="text"
                          value={billingForm.company}
                          onChange={handleBillingChange}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          placeholder="Company Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingAddress">
                          Address
                        </label>
                        <input
                          id="billingAddress"
                          name="address"
                          type="text"
                          value={billingForm.address}
                          onChange={handleBillingChange}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          placeholder="Road No. 13/x, House no. 1320/C, Flat No. 5D"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingCountry">
                            Country
                          </label>
                          <select
                            id="billingCountry"
                            name="country"
                            value={billingForm.country}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          >
                            <option value="Pakistan">Pakistan</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingRegion">
                            Region/State
                          </label>
                          <input
                            id="billingRegion"
                            name="region"
                            type="text"
                            value={billingForm.region}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Sindh"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingCity">
                            City
                          </label>
                          <input
                            id="billingCity"
                            name="city"
                            type="text"
                            value={billingForm.city}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Karachi"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingZip">
                            Zip Code
                          </label>
                          <input
                            id="billingZip"
                            name="zip"
                            type="text"
                            value={billingForm.zip}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="74500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingEmail">
                            Email
                          </label>
                          <input
                            id="billingEmail"
                            name="email"
                            type="email"
                            value={billingForm.email}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="azlan12345@gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="billingPhone">
                            Phone Number
                          </label>
                          <input
                            id="billingPhone"
                            name="phone"
                            type="text"
                            value={billingForm.phone}
                            onChange={handleBillingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="+92-333-1234567"
                          />
                        </div>
                      </div>

                      {billingMessage && (
                        <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                          {billingMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#00aeef] text-white text-sm font-semibold hover:bg-[#0099d9] transition"
                      >
                        Save Changes
                      </button>
                    </form>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Shipping Address</h3>
                    <form onSubmit={handleShippingSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingFirstName">
                            First Name
                          </label>
                          <input
                            id="shippingFirstName"
                            name="firstName"
                            type="text"
                            value={shippingForm.firstName}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Azlan"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingLastName">
                            Last Name
                          </label>
                          <input
                            id="shippingLastName"
                            name="lastName"
                            type="text"
                            value={shippingForm.lastName}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Khan"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingCompany">
                          Company Name (Optional)
                        </label>
                        <input
                          id="shippingCompany"
                          name="company"
                          type="text"
                          value={shippingForm.company}
                          onChange={handleShippingChange}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          placeholder="Company Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingAddress">
                          Address
                        </label>
                        <input
                          id="shippingAddress"
                          name="address"
                          type="text"
                          value={shippingForm.address}
                          onChange={handleShippingChange}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          placeholder="Road No. 13/x, House no. 1320/C, Flat No. 5D"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingCountry">
                            Country
                          </label>
                          <select
                            id="shippingCountry"
                            name="country"
                            value={shippingForm.country}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          >
                            <option value="Pakistan">Pakistan</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingRegion">
                            Region/State
                          </label>
                          <input
                            id="shippingRegion"
                            name="region"
                            type="text"
                            value={shippingForm.region}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Select..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingCity">
                            City
                          </label>
                          <input
                            id="shippingCity"
                            name="city"
                            type="text"
                            value={shippingForm.city}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="Karachi"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingZip">
                            Zip Code
                          </label>
                          <input
                            id="shippingZip"
                            name="zip"
                            type="text"
                            value={shippingForm.zip}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="75400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingEmail">
                            Email
                          </label>
                          <input
                            id="shippingEmail"
                            name="email"
                            type="email"
                            value={shippingForm.email}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="azlan12345@gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="shippingPhone">
                            Phone Number
                          </label>
                          <input
                            id="shippingPhone"
                            name="phone"
                            type="text"
                            value={shippingForm.phone}
                            onChange={handleShippingChange}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                            placeholder="+92-333-1234567"
                          />
                        </div>
                      </div>

                      {shippingMessage && (
                        <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                          {shippingMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#00aeef] text-white text-sm font-semibold hover:bg-[#0099d9] transition"
                      >
                        Save Changes
                      </button>
                    </form>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-5">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="currentPassword">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          name="current"
                          type={passwordVisibility.current ? 'text' : 'password'}
                          value={passwordForm.current}
                          onChange={handlePasswordInputChange}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          placeholder="Current password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                          aria-label={passwordVisibility.current ? 'Hide current password' : 'Show current password'}
                        >
                          {passwordVisibility.current ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="newPassword">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={passwordVisibility.newPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={handlePasswordInputChange}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          placeholder="8+ characters"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('newPassword')}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                          aria-label={passwordVisibility.newPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {passwordVisibility.newPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="confirmPassword">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirm"
                          type={passwordVisibility.confirm ? 'text' : 'password'}
                          value={passwordForm.confirm}
                          onChange={handlePasswordInputChange}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                          aria-label={passwordVisibility.confirm ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {passwordVisibility.confirm ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                        {passwordError}
                      </div>
                    )}

                    {passwordMessage && (
                      <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                        {passwordMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[#00aeef] text-white font-semibold hover:bg-[#0099d9] transition"
                    >
                      Change Password
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;


