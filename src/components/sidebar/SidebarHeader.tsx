'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Archive,
  LogIn,
  LogOut,
  MessageSquarePlus,
  MoreVertical,
  Moon,
  Settings,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { logoutUser } from '@/lib/services/authService';

interface SidebarHeaderProps {
  onOpenProfile: () => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenArchived: () => void;
  onOpenSettings: () => void;
}

export function SidebarHeader({
  onOpenProfile,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenArchived,
  onOpenSettings,
}: SidebarHeaderProps) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { theme, toggleTheme, setActiveChatId, setChats } = useChatStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isGuest = !user || user.id === 'usr_current_01';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setActiveChatId(null);
    setChats([]);
    router.push('/login');
    router.refresh();
  };

  const itemClass =
    'w-full px-3 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition text-sm';

  return (
    <header className="h-[59px] px-4 bg-[var(--wa-header-bg)] flex items-center justify-between shrink-0 select-none">
      <h1 className="text-[20px] md:text-[22px] font-semibold text-[var(--wa-text-primary)] tracking-tight truncate">
        <span className="hidden md:inline">Obrolan</span>
        <span className="md:hidden">Dardcor Media</span>
      </h1>

      <div className="flex items-center gap-0.5 text-[var(--wa-text-secondary)]">
        <button
          onClick={onOpenNewChat}
          title="Obrolan baru"
          aria-label="Obrolan baru"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition active:scale-95"
        >
          <MessageSquarePlus size={21} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu"
            aria-label="Menu"
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition active:scale-95"
          >
            <MoreVertical size={21} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-[210px] bg-[var(--wa-bg-sidebar)] rounded-md shadow-2xl border border-[var(--wa-border)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenNewGroup();
                }}
                className={itemClass}
              >
                <Users size={17} />
                <span>Grup baru</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenArchived();
                }}
                className={itemClass}
              >
                <Archive size={17} />
                <span>Obrolan diarsipkan</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenProfile();
                }}
                className={itemClass}
              >
                <User size={17} />
                <span>Profil saya</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSettings();
                }}
                className={itemClass}
              >
                <Settings size={17} />
                <span>Pengaturan</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className={itemClass}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                <span>Tema {theme === 'dark' ? 'terang' : 'gelap'}</span>
              </button>

              <div className="my-1.5 border-t border-[var(--wa-border)]" />

              {isGuest ? (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[#8b5cf6] font-medium transition text-sm"
                >
                  <LogIn size={17} />
                  <span>Masuk / daftar akun</span>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-rose-500 transition text-sm"
                >
                  <LogOut size={17} />
                  <span>Keluar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
