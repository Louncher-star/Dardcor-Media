'use client';

import { useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * PWA Handler: Menjaga fungsi PWA dan instalasi native tetap berjalan
 * tanpa menampilkan popup banner yang mengganggu tampilan UI.
 */
export function PWAInstallPrompt() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Simpan event install prompt di window agar tetap dapat dipanggil secara programmatic jika dibutuhkan
      window.__deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
    };

    const handleAppInstalled = () => {
      window.__deferredPWAInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Tidak menampilkan tampilan popup (pop up UI dihapus sesuai permintaan)
  return null;
}
