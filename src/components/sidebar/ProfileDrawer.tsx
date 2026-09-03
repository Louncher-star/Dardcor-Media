'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Edit2, Camera } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Avatar } from '@/components/ui/Avatar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, updateProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [about, setAbout] = useState(user?.about || 'Ada! Menggunakan Dardcor Media.');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    updateProfile({ display_name: displayName.trim() });
    setIsEditingName(false);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);
    }
    setIsSaving(false);
  };

  const handleSaveAbout = async () => {
    if (!about.trim()) return;
    setIsSaving(true);
    updateProfile({ about: about.trim() });
    setIsEditingAbout(false);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ about: about.trim() })
        .eq('id', user.id);
    }
    setIsSaving(false);
  };

  return (
    <div className="absolute inset-0 bg-[var(--wa-bg-sidebar)] z-40 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="h-28 bg-gradient-to-r from-[#6d28d9] to-[#4f46e5] text-white p-4 flex flex-col justify-between shrink-0 select-none shadow-md">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition"
          >
            <ArrowLeft size={22} />
          </button>
          <span className="font-semibold text-lg">Profil Anda</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--wa-header-bg)]/40 border-b border-[var(--wa-border)]">
          <div className="relative group cursor-pointer">
            <Avatar src={user.avatar_url} name={user.display_name} size="xl" className="w-36 h-36 ring-4 ring-purple-500/20 shadow-xl" />
            <div className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
              <Camera size={26} />
              <span className="text-[10px] font-semibold uppercase mt-1">Ubah Foto</span>
            </div>
          </div>
        </div>

        {/* Display Name Section */}
        <div className="p-4 border-b border-[var(--wa-border)] bg-[var(--wa-bg-sidebar)]">
          <span className="text-xs font-semibold text-[#c084fc] uppercase tracking-wider block mb-2">
            Nama Tampilan
          </span>
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-[var(--wa-header-bg)] border-b-2 border-[#8b5cf6] text-sm text-[var(--wa-text-primary)] focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 rounded-full"
                >
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-[var(--wa-text-primary)]">
                  {user.display_name}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 text-[var(--wa-text-secondary)] hover:text-[#c084fc] transition"
                >
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
          <p className="text-[11px] text-[var(--wa-text-secondary)] mt-2">
            Nama ini akan terlihat oleh semua kontak dan pengguna di Dardcor Media.
          </p>
        </div>

        {/* Username Section */}
        <div className="p-4 border-b border-[var(--wa-border)] bg-[var(--wa-bg-sidebar)]">
          <span className="text-xs font-semibold text-[#c084fc] uppercase tracking-wider block mb-1">
            Username
          </span>
          <span className="text-sm text-[var(--wa-text-primary)] font-mono">
            @{user.username}
          </span>
          <p className="text-[11px] text-[var(--wa-text-secondary)] mt-1">
            Teman dapat menemukan Anda dengan mudah menggunakan username ini.
          </p>
        </div>

        {/* About Section */}
        <div className="p-4 border-b border-[var(--wa-border)] bg-[var(--wa-bg-sidebar)]">
          <span className="text-xs font-semibold text-[#c084fc] uppercase tracking-wider block mb-2">
            Info / Bio
          </span>
          <div className="flex items-center justify-between">
            {isEditingAbout ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="flex-1 px-2 py-1 bg-[var(--wa-header-bg)] border-b-2 border-[#8b5cf6] text-sm text-[var(--wa-text-primary)] focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveAbout}
                  className="p-1.5 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 rounded-full"
                >
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-[var(--wa-text-primary)]">{user.about}</span>
                <button
                  onClick={() => setIsEditingAbout(true)}
                  className="p-1.5 text-[var(--wa-text-secondary)] hover:text-[#c084fc] transition"
                >
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
