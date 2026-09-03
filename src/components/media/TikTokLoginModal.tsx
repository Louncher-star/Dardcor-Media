'use client';

import { useState } from 'react';
import { X, Mail, UserCheck, AtSign } from 'lucide-react';
import { useTikTokAuthStore } from '@/lib/store/useTikTokAuthStore';

interface TikTokLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TikTokLoginModal({ isOpen, onClose }: TikTokLoginModalProps) {
  const { loginWithTikTok, isLoading } = useTikTokAuthStore();
  const [activeTab, setActiveTab] = useState<'username' | 'gmail'>('username');
  const [usernameInput, setUsernameInput] = useState('');
  const [gmailInput, setGmailInput] = useState('');
  const [customHandleInput, setCustomHandleInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    let success = false;
    if (activeTab === 'username') {
      if (!usernameInput.trim()) return;
      success = await loginWithTikTok(usernameInput.trim(), false);
    } else {
      if (!gmailInput.trim()) return;
      success = await loginWithTikTok(gmailInput.trim(), true, customHandleInput.trim());
    }

    if (success) {
      setUsernameInput('');
      setGmailInput('');
      setCustomHandleInput('');
      onClose();
    } else {
      setErrorMsg(
        activeTab === 'username'
          ? 'Akun TikTok tidak ditemukan. Pastikan username sudah terdaftar di TikTok.'
          : 'Gagal menghubungkan akun Google. Pastikan username TikTok yang ditautkan sudah benar.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#181818] border border-white/10 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            setErrorMsg('');
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
        >
          <X size={20} />
        </button>

        {/* Title & Icon TikTok */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center mx-auto mb-2 font-black text-2xl shadow-lg shadow-[#FE2C55]/20">
            TT
          </div>
          <h2 className="text-2xl font-black text-white">Masuk ke Akun TikTok</h2>
          <p className="text-xs text-white/50 mt-1">
            Loginkan akun real TikTok Anda ke dalam sistem Dardcor Media
          </p>
        </div>

        {/* 2 Tabs Sesuai TikTok Asli: Username & Google / Gmail (Kreator Trending sudah dihapus total) */}
        <div className="flex border-b border-white/10 mb-5 text-xs font-bold">
          <button
            onClick={() => {
              setErrorMsg('');
              setActiveTab('username');
            }}
            className={`flex-1 pb-3 border-b-2 transition ${
              activeTab === 'username'
                ? 'border-[#FE2C55] text-[#FE2C55]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Username TikTok
          </button>
          <button
            onClick={() => {
              setErrorMsg('');
              setActiveTab('gmail');
            }}
            className={`flex-1 pb-3 border-b-2 transition ${
              activeTab === 'gmail'
                ? 'border-[#FE2C55] text-[#FE2C55]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Google / Gmail
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Username TikTok */}
        {activeTab === 'username' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">
                Username TikTok Real Anda
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="contoh: @dardcor"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/20 focus:border-[#FE2C55] rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/40 focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1.5">
                Sistem akan melakukan live scraping profil, video, dan statistik akun TikTok real Anda.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !usernameInput.trim()}
              className="w-full py-2.5 rounded-xl bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-[#FE2C55]/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Scrape & Masuk Akun TikTok</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Google / Gmail */}
        {activeTab === 'gmail' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">
                Alamat Gmail Anda
              </label>
              <input
                type="email"
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                placeholder="contoh: dardcor@gmail.com"
                required
                autoFocus
                className="w-full bg-white/5 border border-white/20 focus:border-[#FE2C55] rounded-xl py-2 px-3.5 text-xs text-white placeholder-white/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">
                Username TikTok Akun Anda
              </label>
              <input
                type="text"
                value={customHandleInput}
                onChange={(e) => setCustomHandleInput(e.target.value)}
                placeholder="contoh: @dardcor (default: otomatis sesuai akun)"
                className="w-full bg-white/5 border border-white/20 focus:border-[#FE2C55] rounded-xl py-2 px-3.5 text-xs text-white placeholder-white/40 focus:outline-none transition"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Data real akun TikTok Anda (foto, bio, video, suka) akan langsung disinkronkan.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !gmailInput.trim()}
              className="w-full py-2.5 mt-2 rounded-xl bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-[#FE2C55]/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Mail size={16} />
                  <span>Lanjutkan dengan Google / Gmail</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-[10px] text-white/40 leading-relaxed border-t border-white/10 pt-3">
          Sistem autentikasi TikTok terhubung langsung dengan scraping live dan database Supabase.
        </div>
      </div>
    </div>
  );
}
