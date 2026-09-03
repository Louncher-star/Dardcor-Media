'use client';

import { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek apakah sudah terinstall sebagai standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] bg-[#1a1528]/95 backdrop-blur-md border border-purple-500/40 rounded-2xl p-4 shadow-2xl shadow-purple-950/80 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-900/40">
          <Sparkles size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <span>Install Dardcor Media</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7c3aed]/30 text-[#c084fc] font-normal">
              PWA
            </span>
          </h4>
          <p className="text-xs text-purple-200/70 mt-1 leading-relaxed">
            Pasang di HP atau desktop Anda untuk pengalaman obrolan cepat layaknya aplikasi native.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <Download size={14} />
              <span>Install Sekarang</span>
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1.5 text-xs text-purple-300/70 hover:text-white transition"
            >
              Nanti Saja
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 text-purple-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
