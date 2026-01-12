'use client';

import { useEffect, useMemo } from 'react';

const loadedImages = new Set();

const toArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return [input];
};

export const useImagePreloader = (sources) => {
  const preloadKey = useMemo(() => {
    const items = toArray(sources)
      .map((src) => (typeof src === 'string' ? src.trim() : ''))
      .filter(Boolean);
    return items.join('|');
  }, [sources]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const items = toArray(sources)
      .map((src) => (typeof src === 'string' ? src.trim() : ''))
      .filter(Boolean);
    if (!items.length) return;

    const preloaded = [];

    items.forEach((url) => {
      if (loadedImages.has(url)) {
        return;
      }
      const img = new window.Image();
      img.src = url;
      preloaded.push(img);
      loadedImages.add(url);
    });

    return () => {
      preloaded.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [preloadKey, sources]);
};

export default useImagePreloader;


