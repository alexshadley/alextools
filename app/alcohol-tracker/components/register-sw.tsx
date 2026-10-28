'use client';

import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/alcohol-tracker/sw.js', { scope: '/alcohol-tracker/' })
      .catch((err) => console.warn('Service worker registration failed', err));
  }, []);
  return null;
}
