'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Camera,
  Check,
  Info,
  LogOut,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { clearAuthCookie, logoutUser } from '@/lib/services/authService';
import { uploadAvatar } from '@/lib/utils/mediaUtils';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { isSoundEnabled, setSoundEnabled } from '@/lib/utils/soundUtils';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const router = useRouter();
  const { user, updateProfile, setUser } = useAuthStore();
  const { theme, toggleTheme } = useChatStore();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [saved, setSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const saveProfile = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    const updates = {
      display_name: displayName.trim(),
      about: about.trim() || 'Ada! Menggunakan Dardcor Media.',
    };
    updateProfile(updates);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pilih berkas gambar untuk foto profil.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file, user.id);
      updateProfile({ avatar_url: url });
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      }
    } catch (err) {
      console.error('Gagal mengunggah foto profil:', err);
      alert('Gagal mengunggah foto profil. Coba lagi.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSoundToggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    clearAuthCookie();
    onClose();
    router.replace('/login');
  };

  return (
    <div className="fixed inset-0 z-[130] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative w-full md:max-w-[420px] h-full bg-[var(--wa-bg-sidebar)] flex flex-col shadow-2xl panel-slide-in">
        <header className="h-16 px-4 flex items-center gap-3 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-bold text-[var(--wa-text-primary)]">Pengaturan</h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="p-6 border-b border-[var(--wa-border)] flex flex-col items-center bg-[var(--wa-header-bg)]/40">
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative group rounded-full"
              title="Ubah foto profil"
            >
              <Avatar
                src={user.avatar_url}
                name={user.display_name || user.username}
                size="xl"
                className="ring-4 ring-purple-500/20"
              />
              <span className="absolute inset-0 rounded-full bg-black/55 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                {isUploadingAvatar ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera size={22} />
                    <span className="text-[10px] font-semibold mt-1">Ubah</span>
                  </>
                )}
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <h3 className="mt-3 text-lg font-bold text-[var(--wa-text-primary)]">
              {user.display_name}
            </h3>
            <p className="text-xs text-[var(--wa-text-secondary)]">@{user.username}</p>
          </section>

          <section className="p-4 border-b border-[var(--wa-border)] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c084fc]">Profil</h4>

            <label className="block">
              <span className="text-[11px] font-semibold text-[var(--wa-text-secondary)]">
                Nama tampilan
              </span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--wa-header-bg)] border border-[var(--wa-border)] text-sm text-[var(--wa-text-primary)] focus:outline-none focus:border-[#8b5cf6]"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold text-[var(--wa-text-secondary)]">Info</span>
              <input
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={120}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--wa-header-bg)] border border-[var(--wa-border)] text-sm text-[var(--wa-text-primary)] focus:outline-none focus:border-[#8b5cf6]"
              />
            </label>

            <button
              onClick={saveProfile}
              disabled={isSaving || !displayName.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <Check size={16} /> Tersimpan
                </>
              ) : isSaving ? (
                'Menyimpan...'
              ) : (
                'Simpan profil'
              )}
            </button>
          </section>

          <section className="p-4 border-b border-[var(--wa-border)] space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c084fc] mb-2">
              Preferensi
            </h4>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--wa-hover)] transition text-left"
            >
              <span className="w-9 h-9 rounded-lg bg-[var(--wa-header-bg)] flex items-center justify-center text-[var(--wa-text-primary)]">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-[var(--wa-text-primary)]">
                  Tema {theme === 'dark' ? 'terang' : 'gelap'}
                </span>
                <span className="block text-[11px] text-[var(--wa-text-secondary)]">
                  Ganti tampilan antarmuka
                </span>
              </span>
            </button>

            <button
              onClick={handleSoundToggle}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--wa-hover)] transition text-left"
            >
              <span className="w-9 h-9 rounded-lg bg-[var(--wa-header-bg)] flex items-center justify-center text-[var(--wa-text-primary)]">
                {soundOn ? <Bell size={18} /> : <BellOff size={18} />}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-[var(--wa-text-primary)]">
                  Suara notifikasi {soundOn ? 'aktif' : 'nonaktif'}
                </span>
                <span className="block text-[11px] text-[var(--wa-text-secondary)]">
                  Bunyi saat pesan masuk dan terkirim
                </span>
              </span>
              <span
                className={`w-10 h-6 rounded-full transition relative shrink-0 ${
                  soundOn ? 'bg-[#8b5cf6]' : 'bg-[var(--wa-border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    soundOn ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          </section>

          <section className="p-4 border-b border-[var(--wa-border)] space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c084fc] mb-2">Akun</h4>

            <div className="flex items-center gap-3 p-3 rounded-xl">
              <span className="w-9 h-9 rounded-lg bg-[var(--wa-header-bg)] flex items-center justify-center text-[var(--wa-text-primary)]">
                <User size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-[var(--wa-text-primary)]">
                  @{user.username}
                </span>
                <span className="block text-[11px] text-[var(--wa-text-secondary)]">
                  {user.phone_number || 'Nomor telepon belum diatur'}
                </span>
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition text-left"
            >
              <span className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <LogOut size={18} />
              </span>
              <span className="text-sm font-medium">Keluar akun</span>
            </button>
          </section>

          <section className="p-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--wa-header-bg)]">
              <Info size={17} className="text-purple-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[var(--wa-text-primary)]">
                  Dardcor Media
                </p>
                <p className="text-[11px] text-[var(--wa-text-secondary)] mt-0.5 leading-relaxed">
                  Aplikasi pesan instan real-time. Terpasang sebagai PWA di perangkat yang
                  mendukung untuk pengalaman layar penuh.
                </p>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
