'use client';

import { useState } from 'react';
import { X, Globe, Keyboard, HelpCircle, Shield, Moon, Check } from 'lucide-react';

interface TikTokMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TikTokMoreMenu({ isOpen, onClose }: TikTokMoreMenuProps) {
  const [selectedLang, setSelectedLang] = useState('id');
  const [showShortcuts, setShowShortcuts] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-5 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">Pengaturan & Lainnya</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {showShortcuts ? (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-bold text-white/70">Pintasan Keyboard</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-white/80">Video Selanjutnya</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px]">↓ / J</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-white/80">Video Sebelumnya</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px]">↑ / K</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-white/80">Nyalakan / Bisukan Suara</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px]">M</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-white/80">Sukai Video</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px]">L</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-white/80">Buka Komentar</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px]">C</span>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full py-2 mt-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
            >
              Kembali
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-xs font-semibold">
            {/* Bahasa */}
            <div className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <Globe size={16} className="text-cyan-400" />
                <span>Bahasa (Language)</span>
              </div>
              <span className="text-[11px] text-white/50">Bahasa Indonesia</span>
            </div>

            {/* Pintasan Keyboard */}
            <div
              onClick={() => setShowShortcuts(true)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard size={16} className="text-amber-400" />
                <span>Pintasan Keyboard</span>
              </div>
              <span className="text-[11px] text-[#FE2C55]">Lihat</span>
            </div>

            {/* Pusat Bantuan */}
            <div
              onClick={() => alert('Pusat Bantuan TikTok & Dardcor Media aktif.')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={16} className="text-emerald-400" />
                <span>Pusat Bantuan & Umpan Balik</span>
              </div>
            </div>

            {/* Mode Gelap */}
            <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Moon size={16} className="text-indigo-400" />
                <span>Mode Gelap</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                Aktif
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
