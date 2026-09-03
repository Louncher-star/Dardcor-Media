'use client';

import { useState } from 'react';
import { X, Mail, AtSign, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { useTikTokAuthStore } from '@/lib/store/useTikTokAuthStore';

interface TikTokLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TikTokLoginModal({ isOpen, onClose }: TikTokLoginModalProps) {
  const { loginWithTikTok, isLoading } = useTikTokAuthStore();
  const [loginMethod, setLoginMethod] = useState<'menu' | 'gmail' | 'username'>('menu');
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setErrorMsg('');
    const success = await loginWithTikTok(inputValue.trim(), loginMethod === 'gmail');
    if (success) {
      setInputValue('');
      setLoginMethod('menu');
      onClose();
    } else {
      setErrorMsg('Gagal masuk ke akun TikTok. Periksa input Anda.');
    }
  };

  const handleQuickLogin = async (username: string) => {
    setErrorMsg('');
    const success = await loginWithTikTok(username, false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#181818] border border-white/10 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            setLoginMethod('menu');
            setErrorMsg('');
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white">Masuk ke TikTok</h2>
          <p className="text-xs text-white/50 mt-1">
            Kelola akun Anda, ikuti kreator, sukai video, dan kirim pesan
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {loginMethod === 'menu' ? (
          <div className="space-y-3">
            {/* Option 1: Google / Gmail */}
            <button
              onClick={() => {
                setLoginMethod('gmail');
                setInputValue('');
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                  <Mail size={16} />
                </div>
                <span>Lanjutkan dengan Google / Gmail</span>
              </div>
              <ArrowRight size={15} className="text-white/40 group-hover:text-white transition" />
            </button>

            {/* Option 2: Username / Handle */}
            <button
              onClick={() => {
                setLoginMethod('username');
                setInputValue('');
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <AtSign size={16} />
                </div>
                <span>Gunakan Nama Pengguna TikTok</span>
              </div>
              <ArrowRight size={15} className="text-white/40 group-hover:text-white transition" />
            </button>

            {/* Quick Demo Accounts */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 mb-2">
                <Sparkles size={12} className="text-amber-400" />
                <span>Atau Masuk Cepat Akun Terverifikasi</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { handle: 'thedardcorsociety', name: 'The Dardcor Society' },
                  { handle: 'dardcor_official', name: 'Dardcor Official' },
                ].map((acc) => (
                  <button
                    key={acc.handle}
                    onClick={() => handleQuickLogin(acc.handle)}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-left transition"
                  >
                    <div className="text-xs font-bold text-white truncate">{acc.name}</div>
                    <div className="text-[10px] text-white/50 truncate">@{acc.handle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">
                {loginMethod === 'gmail'
                  ? 'Masukkan Alamat Gmail Anda'
                  : 'Masukkan Username TikTok Anda'}
              </label>
              <div className="relative">
                <input
                  type={loginMethod === 'gmail' ? 'email' : 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    loginMethod === 'gmail'
                      ? 'contoh: namaanda@gmail.com'
                      : 'contoh: @tiktok_creator'
                  }
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/20 focus:border-[#FE2C55] rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/40 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-[#FE2C55]/30 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserCheck size={16} />
                    <span>Masuk Akun</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('menu');
                  setErrorMsg('');
                }}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
              >
                Kembali
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-[11px] text-white/40 leading-relaxed">
          Dengan melanjutkan, Anda menyetujui Ketentuan Layanan TikTok & Privasi Akun Media.
        </div>
      </div>
    </div>
  );
}
