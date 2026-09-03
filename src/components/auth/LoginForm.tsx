'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Profile } from '@/types';
import {
  setAuthCookie,
  getRegisteredUsers,
  setStoredCurrentUser,
} from '@/lib/services/authService';

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Jika Supabase aktif, coba login via Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data.user) {
          let profile: Profile | null = null;

          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (dbProfile) {
            profile = dbProfile as Profile;
          } else {
            // Jika belum ada di tabel profiles, buat langsung
            const meta = data.user.user_metadata || {};
            profile = {
              id: data.user.id,
              username: meta.username || cleanEmail.split('@')[0],
              display_name: meta.display_name || meta.username || 'Pengguna',
              avatar_url:
                meta.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              about: meta.about || 'Ada! Menggunakan Dardcor Media.',
              is_online: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await supabase.from('profiles').upsert(profile);
          }

          setAuthCookie(profile.id);
          setStoredCurrentUser(profile);
          setUser(profile);

          setIsLoading(false);
          router.push('/media');
          router.refresh();
          return;
        }
      } catch (err: unknown) {
        console.error('Supabase login error, checking fallback:', err);
      }
    }

    // 2. Cek terhadap akun terdaftar (Local Session Fallback)
    const users = getRegisteredUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (found) {
      setAuthCookie(found.id);
      setStoredCurrentUser(found);
      setUser(found);
      setIsLoading(false);
      router.push('/media');
      router.refresh();
      return;
    }

    setErrorMessage(
      'Akun tidak ditemukan atau kata sandi salah. Silakan periksa kembali atau daftar akun baru.'
    );
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1.5 uppercase tracking-wider">
            Alamat Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full pl-10 pr-4 py-2.5 bg-[#120f1f] border border-purple-500/25 rounded-xl text-white placeholder:text-purple-300/40 text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1.5 uppercase tracking-wider">
            Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-[#120f1f] border border-purple-500/25 rounded-xl text-white placeholder:text-purple-300/40 text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-purple-400/60 hover:text-purple-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between text-xs text-purple-300/70 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-[#7c3aed] w-3.5 h-3.5"
            />
            <span>Ingat sesi saya</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Masuk ke Dardcor Media</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-purple-300/70 space-y-3">
        <div>
          Belum memiliki akun?{' '}
          <Link href="/register" className="text-[#a78bfa] font-semibold hover:underline">
            Daftar sekarang
          </Link>
        </div>
        <div>
          <Link href="/" className="text-purple-400/60 hover:text-purple-300 transition text-[11px]">
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
