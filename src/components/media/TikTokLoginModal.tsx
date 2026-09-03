'use client';

import { useState } from 'react';
import { X, Mail, AtSign, ArrowRight, UserCheck, Sparkles, Check } from 'lucide-react';
import { useTikTokAuthStore } from '@/lib/store/useTikTokAuthStore';

interface TikTokLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedCreators?: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  }[];
}

export function TikTokLoginModal({ isOpen, onClose, feedCreators = [] }: TikTokLoginModalProps) {
  const { loginWithTikTok, loginWithScrapedCreator, isLoading } = useTikTokAuthStore();
  const [activeTab, setActiveTab] = useState<'username' | 'gmail' | 'creators'>('username');
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setErrorMsg('');
    const isGmail = activeTab === 'gmail';
    const success = await loginWithTikTok(inputValue.trim(), isGmail);
    if (success) {
      setInputValue('');
      onClose();
    } else {
      setErrorMsg('Gagal memproses akun TikTok. Pastikan username sudah benar.');
    }
  };

  const handleSelectScrapedCreator = (c: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  }) => {
    loginWithScrapedCreator(c);
    onClose();
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

        {/* Title */}
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center mx-auto mb-2 font-black text-xl">
            TT
          </div>
          <h2 className="text-2xl font-black text-white">Masuk ke Akun TikTok</h2>
          <p className="text-xs text-white/50 mt-1">
            Loginkan akun real TikTok Anda ke dalam sistem Dardcor Media
          </p>
        </div>

        {/* Tabs: Username TikTok, Gmail, atau Kreator Trending */}
        <div className="flex border-b border-white/10 mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('username')}
            className={`flex-1 pb-2.5 border-b-2 transition ${
              activeTab === 'username'
                ? 'border-[#FE2C55] text-[#FE2C55]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Username TikTok
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex-1 pb-2.5 border-b-2 transition ${
              activeTab === 'gmail'
                ? 'border-[#FE2C55] text-[#FE2C55]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Google / Gmail
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`flex-1 pb-2.5 border-b-2 transition ${
              activeTab === 'creators'
                ? 'border-[#FE2C55] text-[#FE2C55]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Kreator Trending
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {activeTab === 'username' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">
                Username TikTok Real Anda
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="contoh: @fitri.carlina atau username Anda"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/20 focus:border-[#FE2C55] rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/40 focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1.5">
                Sistem akan melakukan scraping data akun TikTok real Anda secara langsung.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
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

        {activeTab === 'gmail' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">
                Alamat Gmail Anda
              </label>
              <input
                type="email"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="namaanda@gmail.com"
                required
                autoFocus
                className="w-full bg-white/5 border border-white/20 focus:border-[#FE2C55] rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/40 focus:outline-none transition"
              />
              <p className="text-[10px] text-white/40 mt-1.5">
                Akun profil TikTok akan disinkronkan dengan alamat Gmail resmi Anda.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-full py-2.5 rounded-xl bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-[#FE2C55]/30 flex items-center justify-center gap-2"
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

        {activeTab === 'creators' && (
          <div className="space-y-3">
            <p className="text-[11px] text-white/50">
              Pilih salah satu kreator TikTok real dari feed live untuk masuk seketika:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {feedCreators.slice(0, 8).map((c) => (
                <div
                  key={c.id || c.unique_id}
                  onClick={() => handleSelectScrapedCreator(c)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={c.avatar}
                      alt={c.nickname}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/20 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                          c.unique_id
                        )}`;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{c.nickname}</div>
                      <div className="text-[10px] text-white/50 truncate">@{c.unique_id}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#FE2C55] px-2 py-1 rounded-lg bg-[#FE2C55]/10">
                    Pilih
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-[10px] text-white/40 leading-relaxed border-t border-white/10 pt-3">
          Sistem autentikasi TikTok ini terhubung langsung dengan scraping live dan database Supabase.
        </div>
      </div>
    </div>
  );
}
