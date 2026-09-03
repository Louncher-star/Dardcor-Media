'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User, AtSign, ArrowRight, Camera, Check } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Avatar } from '@/components/ui/Avatar';
import { Profile } from '@/types';
import {
  setAuthCookie,
  saveRegisteredUser,
  setStoredCurrentUser,
  getRegisteredUsers,
} from '@/lib/services/authService';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
];

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [about, setAbout] = useState('Ada! Menggunakan Dardcor Media.');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Username minimal 3 karakter (hanya huruf, angka, dan garis bawah).');
      setIsLoading(false);
      return;
    }

    // Default ID berupa valid UUID untuk PostgreSQL
    let assignedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Date.now();

    // 1. Jika Supabase dikonfigurasi
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();

        // Cek apakah username sudah dipakai
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          setErrorMessage(`Username @${cleanUsername} sudah dipakai. Silakan gunakan username lain.`);
          setIsLoading(false);
          return;
        }

        // Daftar ke Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              username: cleanUsername,
              avatar_url: selectedAvatar,
              about: about.trim() || 'Ada! Menggunakan Dardcor Media.',
            },
          },
        });

        if (error) {
          console.warn('Supabase auth.signUp note:', error.message);
          // Jika error adalah Database error trigger atau rate limit, lanjutkan menyimpan profil ke tabel database
          if (
            !error.message?.includes('Database error') &&
            !error.message?.includes('saving new user') &&
            !error.message?.includes('rate limit') &&
            !error.message?.includes('already registered')
          ) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
          }
        }

        if (data?.user?.id) {
          assignedId = data.user.id;
        }

        // Coba login untuk session token
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
      } catch (err) {
        console.error('Supabase registration error:', err);
      }
    }

    // 2. Siapkan Objek Profil Riil
    const newProfile: Profile = {
      id: assignedId,
      username: cleanUsername,
      display_name: displayName.trim(),
      avatar_url: selectedAvatar,
      about: about.trim() || 'Ada! Menggunakan Dardcor Media.',
      is_online: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Simpan data profil realtime ke database Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('profiles').upsert({
          id: newProfile.id,
          username: newProfile.username,
          display_name: newProfile.display_name,
          avatar_url: newProfile.avatar_url,
          about: newProfile.about,
          is_online: true,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Error inserting to profiles table:', e);
      }
    }

    // Simpan ke sesi lokal
    saveRegisteredUser({ ...newProfile, email: cleanEmail, password });
    setStoredCurrentUser(newProfile);
    setAuthCookie(newProfile.id);
    setUser(newProfile);

    setIsLoading(false);
    router.push('/chat');
    router.refresh();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Avatar Picker */}
        <div className="flex flex-col items-center justify-center pb-2">
          <div className="relative mb-2">
            <Avatar src={selectedAvatar} name={displayName || 'User'} size="xl" />
            <div className="absolute bottom-0 right-0 p-1.5 bg-[#7c3aed] text-white rounded-full shadow-md">
              <Camera size={14} />
            </div>
          </div>
          <p className="text-xs text-purple-300/80 mb-2">Pilih Foto Profil Anda</p>
          <div className="flex gap-2">
            {AVATAR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAvatar(preset)}
                className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition ${
                  selectedAvatar === preset ? 'border-[#8b5cf6] scale-110 shadow-md shadow-purple-500/40' : 'border-transparent opacity-70'
                }`}
              >
                <img src={preset} alt="preset" className="w-full h-full object-cover" />
                {selectedAvatar === preset && (
                  <div className="absolute inset-0 bg-[#7c3aed]/50 flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1 uppercase tracking-wider">
            Nama Tampilan
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
              <User size={18} />
            </div>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Contoh: Syahrul Ramadhan"
              className="w-full pl-10 pr-4 py-2.5 bg-[#120f1f] border border-purple-500/25 rounded-xl text-white placeholder:text-purple-300/40 text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1 uppercase tracking-wider">
            Username Unik (untuk pencarian teman)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
              <AtSign size={18} />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="syahrul"
              className="w-full pl-10 pr-4 py-2.5 bg-[#120f1f] border border-purple-500/25 rounded-xl text-white placeholder:text-purple-300/40 text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1 uppercase tracking-wider">
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
              placeholder="syahrul@email.com"
              className="w-full pl-10 pr-4 py-2.5 bg-[#120f1f] border border-purple-500/25 rounded-xl text-white placeholder:text-purple-300/40 text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1 uppercase tracking-wider">
            Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Daftar Akun Baru</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-purple-300/70 space-y-3">
        <div>
          Sudah memiliki akun?{' '}
          <Link href="/login" className="text-[#a78bfa] font-semibold hover:underline">
            Masuk di sini
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
