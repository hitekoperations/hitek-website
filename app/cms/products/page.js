'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiBox,
  FiPrinter,
  FiMonitor,
  FiTrendingUp,
  FiRefreshCw,
  FiSearch,
  FiAlertTriangle,
  FiArrowLeft,
  FiUploadCloud,
  FiTrash2,
  FiEdit2,
  FiX,
  FiCheck,
} from 'react-icons/fi';

const parseNumeric = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isNaN(value) ? fallback : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const extractImageArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value.imageUrls)) return value.imageUrls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.image_urls)) return value.image_urls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.images)) return value.images.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (Array.isArray(value.imageurls)) return value.imageurls.filter((url) => typeof url === 'string' && url.trim() !== '');
  if (typeof value.image === 'string' && value.image.trim() !== '') return [value.image.trim()];
  return [];
};

const sanitizeProduct = (item, type) => {
  if (!item) return null;
  const resolvedType = type || item.type || 'laptop';
  const images = extractImageArray(item);
    const image = images[0] || item.image || (resolvedType === 'printer' || resolvedType === 'scanner' ? '/printer-category.png' : '/laptop-category.jpg');
  const price = parseNumeric(item.price, 0);
  return {
    ...item,
    id: item.id?.toString?.() ?? item.id,
    type: resolvedType,
    name:
      item.name ||
      (resolvedType === 'printer'
        ? [item.brand, item.series].filter(Boolean).join(' ')
        : [item.brand, item.model || item.series].filter(Boolean).join(' ')) ||
      'Untitled Product',
    brand: item.brand || 'Unknown',
    description:
      item.description ||
      (resolvedType === 'printer'
        ? [item.resolution, item.copyfeature, item.scanfeature, item.duplex].filter(Boolean).join(' • ')
        : resolvedType === 'scanner'
          ? [item.resolution, item.color_scan, item.duplex, item.wireless].filter(Boolean).join(' • ')
          : item.processor || item.graphics || 'No description provided.'),
    price,
    priceLabel: price > 0 ? `PKR ${price.toLocaleString('en-PK')}` : 'Price on request',
    image,
    images,
    category: resolvedType === 'printer' ? 'Printers' : resolvedType === 'scanner' ? 'Scanners' : 'Laptops',
    stock: parseNumeric(item.stock, 10),
    rating: parseNumeric(item.rating, 4.7),
    reviews: parseNumeric(item.reviews, 0),
    featured: ['true', 't', '1', true, 1].includes(item?.featured),
  };
};

const renderProductImage = (src, alt) => {
  if (src?.startsWith?.('http')) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-28 w-full object-contain transition-transform duration-300 group-hover:scale-105"
      />
    );
  }
  return (
    <img
      src={src || '/laptop-category.jpg'}
      alt={alt}
      className="h-28 w-full object-contain transition-transform duration-300 group-hover:scale-105"
    />
  );
};

const GENERAL_FIELD_CONFIG = {
  laptop: [
    { id: 'name', label: 'Product Name', type: 'text', placeholder: 'MacBook Air 15"' },
    { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Apple' },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'MacBook Air' },
    { id: 'series', label: 'Series', type: 'text', placeholder: 'M3' },
    { id: 'sku', label: 'SKU / Identifier', type: 'text', placeholder: 'LPT-0001' },
    { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '250000' },
    { id: 'stock', label: 'Stock Quantity', type: 'number', placeholder: '25' },
  ],
  printer: [
    { id: 'name', label: 'Product Name', type: 'text', placeholder: 'HP LaserJet Pro' },
    { id: 'brand', label: 'Brand', type: 'text', placeholder: 'HP' },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'LaserJet Pro' },
    { id: 'series', label: 'Series', type: 'text', placeholder: 'M404dn' },
    { id: 'sku', label: 'SKU / Identifier', type: 'text', placeholder: 'PRT-0001' },
    { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '120000' },
    { id: 'stock', label: 'Stock Quantity', type: 'number', placeholder: '15' },
  ],
  scanner: [
    { id: 'name', label: 'Product Name', type: 'text', placeholder: 'HP ScanJet Pro' },
    { id: 'brand', label: 'Brand', type: 'text', placeholder: 'HP' },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'ScanJet Pro' },
    { id: 'series', label: 'Series', type: 'text', placeholder: '2500' },
    { id: 'sku', label: 'SKU / Identifier', type: 'text', placeholder: 'SCN-0001' },
    { id: 'price', label: 'Price (PKR)', type: 'text', placeholder: '50000' },
    { id: 'stock', label: 'Stock Quantity', type: 'number', placeholder: '10' },
  ],
};

const LAPTOP_SPEC_FIELDS = [
  { id: 'processor', label: 'Processor', sourceKey: 'processor', placeholder: 'Apple M3 Chip, 8 Core CPU, 16 Core Neural Engine' },
  { id: 'graphics', label: 'Graphics', sourceKey: 'graphics', placeholder: 'Apple M3 10-core GPU' },
  { id: 'display', label: 'Display', sourceKey: 'display', placeholder: '15.3-Inch (2880 x 1864), Liquid Retina display, 500 nits' },
  { id: 'memory', label: 'Memory', sourceKey: 'memory', placeholder: '8GB RAM' },
  { id: 'storage', label: 'Storage', sourceKey: 'storage', placeholder: '256GB SSD' },
  { id: 'adapter', label: 'Adapter', sourceKey: 'adapter', placeholder: 'Apple adapter included' },
  { id: 'wifi', label: 'Wi-Fi', sourceKey: 'wifi', placeholder: 'Wi-Fi 6E' },
  { id: 'bluetooth', label: 'Bluetooth', sourceKey: 'bluetooth', placeholder: 'Bluetooth 5.3' },
  { id: 'camera', label: 'Camera', sourceKey: 'camera', placeholder: 'Front Facing Camera 1080p' },
  { id: 'ports', label: 'Ports', sourceKey: 'port', placeholder: '2 x Thunderbolt' },
  { id: 'operatingSystem', label: 'Operating System', sourceKey: 'os', placeholder: 'macOS Sonoma 14' },
  { id: 'microphone', label: 'Microphone', sourceKey: 'mic', placeholder: 'Built-In HD' },
  { id: 'battery', label: 'Battery', sourceKey: 'battery', placeholder: 'Up to 8 hours' },
  { id: 'warranty', label: 'Warranty', sourceKey: 'warranty', placeholder: '1 year limited warranty' },
];

const PRINTER_SPEC_FIELDS = [
  { id: 'memory', label: 'Memory', sourceKey: 'memory', placeholder: '128 MB SDRAM, 32 MB flash' },
  { id: 'paperInput', label: 'Paper Input', sourceKey: 'paperinput', placeholder: '60 sheet input tray' },
  { id: 'paperOutput', label: 'Paper Output', sourceKey: 'paperoutput', placeholder: '25-sheet output tray' },
  { id: 'paperTypes', label: 'Paper Types', sourceKey: 'papertypes', placeholder: 'Plain paper, Photo paper' },
  { id: 'dimensions', label: 'Dimensions', sourceKey: 'dimensions', placeholder: '425.2 x 304.1 x 149.1 mm' },
  { id: 'weight', label: 'Weight', sourceKey: 'weight', placeholder: '3.42 kg' },
  { id: 'power', label: 'Power', sourceKey: 'power', placeholder: '220 to 240 VAC (± 10%), 50/60 Hz (± 3Hz)' },
  { id: 'warranty', label: 'Warranty', sourceKey: 'warranty', placeholder: '1 year limited warranty' },
  { id: 'resolution', label: 'Resolution', sourceKey: 'resolution', placeholder: 'Up to 1200 DPI' },
  { id: 'duplex', label: 'Duplex', sourceKey: 'duplex', placeholder: 'Yes / No' },
  { id: 'copyFeature', label: 'Copy Feature', sourceKey: 'copyfeature', placeholder: 'Yes / No' },
  { id: 'scanFeature', label: 'Scan Feature', sourceKey: 'scanfeature', placeholder: 'Yes / No' },
  { id: 'wireless', label: 'Wireless', sourceKey: 'wireless', placeholder: 'Yes / No' },
];

const SCANNER_SPEC_FIELDS = [
  { id: 'memory', label: 'Memory', sourceKey: 'memory', placeholder: '128 MB' },
  { id: 'paper_types', label: 'Paper Types', sourceKey: 'paper_types', placeholder: 'Plain paper, Photo paper' },
  { id: 'paper_size', label: 'Paper Size', sourceKey: 'paper_size', placeholder: 'A4, Letter' },
  { id: 'duplex', label: 'Duplex', sourceKey: 'duplex', placeholder: 'Yes / No' },
  { id: 'resolution', label: 'Resolution', sourceKey: 'resolution', placeholder: 'Up to 1200 DPI' },
  { id: 'power', label: 'Power', sourceKey: 'power', placeholder: '220 to 240 VAC (± 10%), 50/60 Hz' },
  { id: 'weight', label: 'Weight', sourceKey: 'weight', placeholder: '3.5 kg' },
  { id: 'dimensions', label: 'Dimensions', sourceKey: 'dimensions', placeholder: '425.2 x 304.1 x 149.1 mm' },
  { id: 'color_scan', label: 'Color Scan', sourceKey: 'color_scan', placeholder: 'Yes / No' },
  { id: 'wireless', label: 'Wireless', sourceKey: 'wireless', placeholder: 'Yes / No' },
];

const CmsProductsPage = () => {
  const router = useRouter();
  const [cmsUser, setCmsUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editDetails, setEditDetails] = useState({
    name: '',
    brand: '',
    model: '',
    series: '',
    sku: '',
    price: '',
    stock: '',
    description: '',
  featured: false,
  });
  const [editSpecs, setEditSpecs] = useState({});
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editNewImages, setEditNewImages] = useState([]);
  const [editCover, setEditCover] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editMessage, setEditMessage] = useState('');

  const editSubmittingRef = useRef(editSubmitting);

  useEffect(() => {
    editSubmittingRef.current = editSubmitting;
  }, [editSubmitting]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = window.localStorage.getItem('cmsUser');
    const storedSession = window.localStorage.getItem('cmsSession');

    if (!storedUser || !storedSession) {
      router.replace('/cms/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      
      // Ensure accesspages is an array
      if (!Array.isArray(parsedUser.accesspages)) {
        parsedUser.accesspages = [];
      }
      
      // Admin users always have access, others need products in accesspages
      if (parsedUser.role !== 'admin') {
        const accessPages = parsedUser.accesspages || [];
        if (!accessPages.includes('products')) {
          router.replace('/cms/auth/login');
          return;
        }
      }
      
      setCmsUser(parsedUser);
    } catch (err) {
      console.error('Failed to parse CMS user', err);
      router.replace('/cms/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const [laptopsRes, printersRes, scannersRes] = await Promise.all([
          fetch('https://hitek-server.onrender.com/api/laptops'),
          fetch('https://hitek-server.onrender.com/api/printers'),
          fetch('https://hitek-server.onrender.com/api/scanners'),
        ]);

        if (!laptopsRes.ok) throw new Error('Failed to load laptops');
        if (!printersRes.ok) throw new Error('Failed to load printers');
        if (!scannersRes.ok) throw new Error('Failed to load scanners');

        const [laptopsData, printersData, scannersData] = await Promise.all([
          laptopsRes.json(),
          printersRes.json(),
          scannersRes.json(),
        ]);

        const sanitized = [
          ...(Array.isArray(laptopsData) ? laptopsData.map((item) => sanitizeProduct(item, 'laptop')) : []),
          ...(Array.isArray(printersData) ? printersData.map((item) => sanitizeProduct(item, 'printer')) : []),
          ...(Array.isArray(scannersData) ? scannersData.map((item) => sanitizeProduct(item, 'scanner')) : []),
        ].filter(Boolean);

        setProducts(sanitized);
      } catch (err) {
        console.error('CMS products fetch error:', err);
        setError(err.message || 'Failed to load products.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = filter === 'all' ? true : product.type === filter;
      const matchesSearch = searchTerm
        ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, searchTerm]);

  const stats = useMemo(() => {
    const total = products.length;
    const laptops = products.filter((product) => product.type === 'laptop').length;
    const printers = products.filter((product) => product.type === 'printer').length;
    const scanners = products.filter((product) => product.type === 'scanner').length;
    const averagePrice =
      products.length > 0
        ? products.reduce((sum, product) => sum + (Number.isFinite(product.price) ? product.price : 0), 0) /
          products.length
        : 0;

    return {
      total,
      laptops,
      printers,
      scanners,
      averagePrice: Math.round(averagePrice),
    };
  }, [products]);

  const closeEditModal = useCallback(() => {
    if (editSubmittingRef.current) return;
    setEditModalOpen(false);
    setEditTarget(null);
    setEditDetails({
      name: '',
      brand: '',
      model: '',
      series: '',
      sku: '',
      price: '',
      stock: '',
      description: '',
      featured: false,
    });
    setEditSpecs({});
    setEditExistingImages([]);
    setEditNewImages((prev) => {
      prev.forEach((item) => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
    setEditCover(null);
    setEditError('');
    setEditMessage('');
    setEditLoading(false);
    setEditSubmitting(false);
    editSubmittingRef.current = false;
  }, [editSubmittingRef]);

  const openEditModal = useCallback(async (product) => {
    setEditTarget(product);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditError('');
    setEditMessage('');
    setEditExistingImages([]);
    setEditNewImages((prev) => {
      prev.forEach((item) => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
    setEditCover(null);

    try {
      let endpoint;
      if (product.type === 'printer') {
        endpoint = 'printers';
      } else if (product.type === 'scanner') {
        endpoint = 'scanners';
      } else {
        endpoint = 'laptops';
      }
      const response = await fetch(`https://hitek-server.onrender.com/api/${endpoint}/${product.id}`);
      if (!response.ok) {
        throw new Error('Failed to load product details.');
      }

      const data = await response.json();

      setEditDetails({
        name: data.name || '',
        brand: data.brand || '',
        model: data.model || '',
        series: data.series || '',
        sku: data.sku || '',
        price: data.price !== null && data.price !== undefined ? String(data.price) : '',
        stock: data.stock !== null && data.stock !== undefined ? String(data.stock) : '',
        description: typeof data.description === 'string' ? data.description : '',
        featured: ['true', 't', '1', true, 1].includes(data?.featured),
      });

      let specFields;
      if (product.type === 'printer') {
        specFields = PRINTER_SPEC_FIELDS;
      } else if (product.type === 'scanner') {
        specFields = SCANNER_SPEC_FIELDS;
      } else {
        specFields = LAPTOP_SPEC_FIELDS;
      }
      const nextSpecs = specFields.reduce((acc, field) => {
        const rawValue = data[field.sourceKey];
        acc[field.id] = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
        return acc;
      }, {});
      setEditSpecs(nextSpecs);

      const existingImages = extractImageArray(data);
      const normalizedImages = existingImages.length
        ? Array.from(new Set(existingImages))
        : data.image
          ? [data.image]
          : [];
      setEditExistingImages(normalizedImages);

      const coverImage =
        (typeof data.image === 'string' && data.image.trim() && normalizedImages.includes(data.image.trim())
          ? data.image.trim()
          : normalizedImages[0]) || null;
      setEditCover(coverImage ? { kind: 'existing', value: coverImage } : null);
    } catch (err) {
      console.error('Failed to open edit modal:', err);
      setEditError(err.message || 'Failed to load product details.');
    } finally {
      setEditLoading(false);
    }
  }, []);

  const handleEditDetailChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setEditDetails((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleEditSpecChange = useCallback((event) => {
    const { name, value } = event.target;
    setEditSpecs((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleEditNewImageChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;

      let firstNewId = null;
      const newItems = files.map((file, index) => {
        const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
        if (firstNewId === null) firstNewId = id;
        return {
          id,
          file,
          preview: URL.createObjectURL(file),
        };
      });

      setEditNewImages((prev) => [...prev, ...newItems]);

      if (!editCover && newItems.length) {
        setEditCover({ kind: 'new', id: firstNewId });
      }

      event.target.value = '';
    },
    [editCover],
  );

  const handleEditExistingImageRemove = useCallback(
    (url) => {
      setEditExistingImages((prev) => {
        const updated = prev.filter((item) => item !== url);
        if (editCover?.kind === 'existing' && editCover.value === url) {
          if (updated.length) {
            setEditCover({ kind: 'existing', value: updated[0] });
          } else if (editNewImages.length) {
            setEditCover({ kind: 'new', id: editNewImages[0].id });
          } else {
            setEditCover(null);
          }
        }
        return updated;
      });
    },
    [editCover, editNewImages],
  );

  const handleEditNewImageRemove = useCallback(
    (id) => {
      setEditNewImages((prev) => {
        const target = prev.find((item) => item.id === id);
        if (target?.preview) URL.revokeObjectURL(target.preview);
        const updated = prev.filter((item) => item.id !== id);
        if (editCover?.kind === 'new' && editCover.id === id) {
          if (updated.length) {
            setEditCover({ kind: 'new', id: updated[0].id });
          } else if (editExistingImages.length) {
            setEditCover({ kind: 'existing', value: editExistingImages[0] });
          } else {
            setEditCover(null);
          }
        }
        return updated;
      });
    },
    [editCover, editExistingImages],
  );

  const setCoverToExisting = useCallback((url) => {
    setEditCover({ kind: 'existing', value: url });
  }, []);

  const setCoverToNew = useCallback((id) => {
    setEditCover({ kind: 'new', id });
  }, []);

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editTarget) return;

    setEditError('');
    setEditMessage('');

    if (!editDetails.name.trim()) {
      setEditError('Product name is required.');
      return;
    }

    if (!editDetails.brand.trim()) {
      setEditError('Brand is required.');
      return;
    }

    if (!editDetails.price.trim()) {
      setEditError('Price is required.');
      return;
    }

    const totalImages = editExistingImages.length + editNewImages.length;
    if (!totalImages) {
      setEditError('Please retain or upload at least one product image.');
      return;
    }

    try {
      setEditSubmitting(true);
      editSubmittingRef.current = true;

      const formData = new FormData();
      Object.entries(editDetails).forEach(([key, value]) => {
        if (key === 'featured') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, value ?? '');
        }
      });

      formData.append('specs', JSON.stringify(editSpecs));
      formData.append('existingImages', JSON.stringify(editExistingImages));

      if (editCover?.kind === 'existing') {
        formData.append('coverExisting', editCover.value);
      } else if (editCover?.kind === 'new') {
        const newIndex = editNewImages.findIndex((item) => item.id === editCover.id);
        if (newIndex !== -1) {
          formData.append('coverNewIndex', String(newIndex));
        }
      }

      editNewImages.forEach((item) => {
        formData.append('images', item.file);
      });

      // Get CMS user info for activity logging
      const cmsUser = JSON.parse(window.localStorage.getItem('cmsUser') || '{}');
      
      // Add user info to FormData as well (since headers might not work with FormData)
      formData.append('cmsUserId', String(cmsUser.id || ''));
      formData.append('cmsUserName', String(cmsUser.username || cmsUser.user_name || ''));
      formData.append('cmsUserRole', String(cmsUser.role || ''));
      
      let categorySlug;
      if (editTarget.type === 'printer') {
        categorySlug = 'printer';
      } else if (editTarget.type === 'scanner') {
        categorySlug = 'scanner';
      } else {
        categorySlug = 'laptop';
      }
      const response = await fetch(`https://hitek-server.onrender.com/api/products/${categorySlug}/${editTarget.id}`, {
        method: 'PATCH',
        headers: {
          'X-CMS-User-Id': String(cmsUser.id || ''),
          'X-CMS-User-Name': String(cmsUser.username || cmsUser.user_name || ''),
          'X-CMS-User-Role': String(cmsUser.role || ''),
        },
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update product.');
      }

      const updatedRaw = payload.product;
      const sanitized = sanitizeProduct(updatedRaw, editTarget.type);
      setProducts((prev) =>
        prev.map((item) => (item.id === sanitized.id && item.type === sanitized.type ? sanitized : item)),
      );
      setEditMessage('Product updated successfully.');

      setTimeout(() => {
        closeEditModal();
      }, 800);
    } catch (err) {
      console.error('Edit product submit error:', err);
      setEditError(err.message || 'Failed to update product.');
    } finally {
      setEditSubmitting(false);
      editSubmittingRef.current = false;
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)] opacity-80 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-slate-300">
              <FiBox className="text-[#38bdf8]" /> Products
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Product Catalogue</h1>
            <p className="mt-1 text-sm text-slate-300">
              Manage every laptop, printer, and scanner listed on your hi-tech storefront. Update, monitor, and synchronize inventory.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="/cms/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition shadow-lg shadow-black/10"
            >
              <FiArrowLeft />
              Back to dashboard
            </Link>
            <button
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#6366f1]/30"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => window.location.href = '/cms/products/add-product'}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#6366f1]/30"
            >
              Add Product
            </button>
            <button
              onClick={() => window.location.href = '/cms/products/bulk-add-product'}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#0ea5e9]/30"
            >
              Bulk Add
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-white/10 bg-linear-to-br from-[#38bdf8] to-[#6366f1] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-wide text-white/80">Total Products</p>
            <p className="mt-3 text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/70 mt-1">Active listings across all categories</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Laptops</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.laptops}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-linear-to-br from-[#38bdf8]/30 to-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8]">
                <FiMonitor />
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">Devices sourced from Supabase laptops table</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Printers</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.printers}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-linear-to-br from-[#f97316]/30 to-[#fb7185]/10 flex items-center justify-center text-[#fb7185]">
                <FiPrinter />
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">Entries from the Supabase printers table</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Scanners</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.scanners}</p>
              </div>
              <span className="h-11 w-11 rounded-full bg-linear-to-br from-[#10b981]/30 to-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                <FiPrinter />
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">Entries from the Supabase scanners table</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Average Price</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {stats.averagePrice > 0 ? `PKR ${stats.averagePrice.toLocaleString('en-PK')}` : 'n/a'}
                </p>
              </div>
              <span className="h-11 w-11 rounded-full bg-linear-to-br from-[#22c55e]/30 to-[#16a34a]/10 flex items-center justify-center text-[#22c55e]">
                <FiTrendingUp />
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">Median pricing across current catalogue</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3">
              <FiSearch className="text-slate-300" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or brand..."
                className="bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  filter === 'all'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setFilter('laptop')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  filter === 'laptop'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                Laptops
              </button>
              <button
                onClick={() => setFilter('printer')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  filter === 'printer'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                Printers
              </button>
              <button
                onClick={() => setFilter('scanner')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  filter === 'scanner'
                    ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                Scanners
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading && (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-slate-200">
                <FiRefreshCw className="animate-spin text-2xl" />
                <p className="text-sm">Loading product catalogue...</p>
              </div>
            )}

            {error && !loading && (
              <div className="col-span-full border border-red-400/30 bg-red-500/10 text-red-100 rounded-2xl p-6 flex gap-3 items-start">
                <FiAlertTriangle className="mt-1 text-xl" />
                <div>
                  <p className="text-sm font-semibold">Unable to load products</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="col-span-full border border-white/10 bg-white/5 text-white/80 rounded-2xl p-6">
                <p className="text-sm font-semibold">No products match your filters.</p>
                <p className="text-xs mt-1">Try adjusting your search or product type selection.</p>
              </div>
            )}

            {!loading &&
              !error &&
              filteredProducts.map((product) => (
                <article
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditModal(product)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openEditModal(product);
                    }
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-[#38bdf8]/40 hover:bg-white/10 cursor-pointer"
                >
                  {product.featured && (
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/40 px-3 py-1 text-xs font-semibold text-[#38bdf8] backdrop-blur">
                      Featured
                    </span>
                  )}
                  <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-white/5 opacity-60 pointer-events-none" />
                  <div className="relative p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                        {product.type === 'printer' ? <FiPrinter /> : <FiMonitor />}
                        {product.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-xl p-4 h-36">
                      {renderProductImage(product.image, product.name)}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-white line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-white/70 line-clamp-3 min-h-[48px]">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span className="font-semibold text-white">{product.priceLabel}</span>
                      <span>{product.stock} in stock</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/40 border border-white/10 px-3 py-1 text-xs text-white/80">
                    <FiEdit2 />
                    Edit
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={closeEditModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f172a]/95 shadow-[0_40px_120px_rgba(15,23,42,0.6)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0f172a]/95 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/10">
                    {editTarget?.type === 'printer' ? <FiPrinter className="text-[#38bdf8]" /> : <FiMonitor className="text-[#38bdf8]" />}
                  </span>
                  Edit {editTarget?.type === 'printer' ? 'Printer' : 'Laptop'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {editDetails.name || editTarget?.name || 'Untitled product'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  ID #{editTarget?.id} • {editTarget?.category || (editTarget?.type === 'printer' ? 'Printers' : 'Laptops')}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-60"
                disabled={editSubmitting}
              >
                <FiX className="text-lg" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {editLoading ? (
              <div className="px-6 py-16 text-center text-slate-200">
                <FiRefreshCw className="mx-auto mb-4 text-2xl animate-spin" />
                Loading product details...
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="px-6 py-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {(GENERAL_FIELD_CONFIG[editTarget?.type || 'laptop'] || []).map((field) => (
                    <label key={field.id} className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                        {field.label}
                      </span>
                      <input
                        type={field.type}
                        name={field.id}
                        value={editDetails[field.id] ?? ''}
                        onChange={handleEditDetailChange}
                        placeholder={field.placeholder}
                        disabled={editSubmitting}
                        className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60 disabled:opacity-60"
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <label className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                      Description
                    </span>
                    <textarea
                      name="description"
                      value={editDetails.description}
                      onChange={handleEditDetailChange}
                      rows={4}
                      placeholder="High-level marketing copy or key highlights."
                      disabled={editSubmitting}
                      className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60 disabled:opacity-60 resize-none"
                    />
                  </label>
                </div>

                {editTarget?.type !== 'printer' && (
                  <label className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={Boolean(editDetails.featured)}
                      onChange={handleEditDetailChange}
                      disabled={editSubmitting}
                      className="mt-1 h-4 w-4 rounded border-white/40 bg-white/10 text-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/60 disabled:opacity-60"
                    />
                    <span className="text-sm text-slate-200 leading-relaxed">
                      Feature this laptop in the navigation dropdown (maximum of three featured laptops are displayed).
                    </span>
                  </label>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">
                    {editTarget?.type === 'printer' ? 'Printer Specifications' : 'Laptop Specifications'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      let specFields;
                      if (editTarget?.type === 'printer') {
                        specFields = PRINTER_SPEC_FIELDS;
                      } else if (editTarget?.type === 'scanner') {
                        specFields = SCANNER_SPEC_FIELDS;
                      } else {
                        specFields = LAPTOP_SPEC_FIELDS;
                      }
                      return specFields;
                    })().map((field) => (
                      <label key={field.id} className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-4">
                        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                          {field.label}
                        </span>
                        <input
                          name={field.id}
                          value={editSpecs[field.id] ?? ''}
                          onChange={handleEditSpecChange}
                          placeholder={field.placeholder}
                          disabled={editSubmitting}
                          className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/50 disabled:opacity-60"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FiUploadCloud className="text-[#38bdf8]" />
                        Product Images
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Update or upload new images. Select a cover to feature on product cards.
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      Current total: {editExistingImages.length + editNewImages.length} image
                      {editExistingImages.length + editNewImages.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <label
                    htmlFor="edit-product-images"
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-2xl px-6 py-10 bg-white/5 hover:border-[#38bdf8]/60 transition cursor-pointer text-center"
                  >
                    <FiUploadCloud className="text-3xl text-[#38bdf8]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Click to upload images</p>
                      <p className="text-xs text-slate-300 mt-1">PNG, JPG up to 5MB each. Hold Ctrl/Shift for multi-select.</p>
                    </div>
                    <input
                      id="edit-product-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleEditNewImageChange}
                      disabled={editSubmitting}
                    />
                  </label>

                  {editExistingImages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">Current Images</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {editExistingImages.map((url) => {
                          const isCover = editCover?.kind === 'existing' && editCover.value === url;
                          return (
                            <div
                              key={url}
                              className={`relative overflow-hidden rounded-xl border ${
                                isCover ? 'border-[#38bdf8]' : 'border-white/15'
                              } bg-white/5`}
                            >
                              <img src={url} alt="Existing product" className="h-40 w-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex items-center justify-between text-xs text-white">
                                <span className="truncate pr-2">{url.split('/').slice(-1)[0]}</span>
                                {isCover ? (
                                  <span className="inline-flex items-center gap-1 text-[#38bdf8]">
                                    <FiCheck /> Cover
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setCoverToExisting(url)}
                                    className="text-white/80 hover:text-white"
                                    disabled={editSubmitting}
                                  >
                                    Set cover
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEditExistingImageRemove(url)}
                                disabled={editSubmitting}
                                className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                              >
                                <FiTrash2 />
                                <span className="sr-only">Remove image</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {editNewImages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">New Images</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {editNewImages.map((item, index) => {
                          const isCover = editCover?.kind === 'new' && editCover.id === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`relative overflow-hidden rounded-xl border ${
                                isCover ? 'border-[#38bdf8]' : 'border-white/15'
                              } bg-white/5`}
                            >
                              <img src={item.preview} alt={`New upload ${index + 1}`} className="h-40 w-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex items-center justify-between text-xs text-white">
                                <span className="truncate pr-2">{item.file.name}</span>
                                {isCover ? (
                                  <span className="inline-flex items-center gap-1 text-[#38bdf8]">
                                    <FiCheck /> Cover
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setCoverToNew(item.id)}
                                    className="text-white/80 hover:text-white"
                                    disabled={editSubmitting}
                                  >
                                    Set cover
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEditNewImageRemove(item.id)}
                                disabled={editSubmitting}
                                className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                              >
                                <FiTrash2 />
                                <span className="sr-only">Remove image</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {editError && (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {editError}
                  </div>
                )}

                {editMessage && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {editMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={editSubmitting}
                    className="px-5 py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/40 hover:from-[#0ea5e9] hover:to-[#4338ca] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {editSubmitting ? 'Saving changes...' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsProductsPage;

