'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleDashed, MessageSquarePlus, MoreVertical, Moon, Sun, LogOut, Users, User, LogIn, Film, Menu } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { logoutUser } from '@/lib/services/authService';

interface SidebarHeaderProps {
  onOpenProfile: () => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenStatus: () => void;
}

export function SidebarHeader({
  onOpenProfile,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenStatus,
}: SidebarHeaderProps) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { theme, toggleTheme, setActiveChatId, setChats, setMobileSidebarOpen } = useChatStore();

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

  return (
    <header className="h-16 px-4 bg-[var(--wa-header-bg)] flex items-center justify-between border-b border-[var(--wa-border)] shrink-0 select-none backdrop-blur-md">
      {/* ================= DESKTOP HEADER (>= md): Authentic Clean "Obrolan" Title (No Duplicate Profile) ================= */}
      <div className="hidden md:flex items-center gap-3">
        <h1 className="text-xl font-black text-[var(--wa-text-primary)] tracking-tight">
          Obrolan
        </h1>
        {isGuest && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Demo
          </span>
        )}
      </div>

      {/* ================= MOBILE HEADER (< md): Mobile App Branding & User Avatar ================= */}
      <div className="flex md:hidden items-center gap-2.5">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 -ml-1 rounded-xl text-purple-300 hover:text-white hover:bg-white/5 active:scale-95 transition"
          title="Buka Menu Navigasi"
        >
          <Menu size={22} />
        </button>

        <div className="cursor-pointer active:scale-95 transition" onClick={onOpenProfile} title="Lihat Profil">
          <Avatar
            src={user?.avatar_url}
            name={user?.display_name || user?.username || 'Saya'}
            size="sm"
          />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm bg-gradient-to-r from-purple-300 via-purple-100 to-indigo-200 bg-clip-text text-transparent truncate">
              Dardcor Media
            </span>
            {isGuest && (
              <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Demo
              </span>
            )}
          </div>
          <span className="text-[10px] text-[var(--wa-text-secondary)] truncate max-w-[120px]">
            {user?.display_name || `@${user?.username}`}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-[var(--wa-text-secondary)]">
        {/* On Mobile Only: Jump to TikTok Feed Button */}
        <Link
          href="/media"
          title="Buka TikTok Media Feed"
          className="md:hidden p-2 rounded-full hover:bg-[var(--wa-hover)] text-[#25F4EE] hover:text-[#25F4EE] transition active:scale-95"
        >
          <Film size={20} />
        </Link>

        {/* Status / Cerita */}
        <button
          onClick={onOpenStatus}
          title="Status / Cerita"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[#c084fc] transition active:scale-95"
        >
          <CircleDashed size={20} />
        </button>

        {/* New Chat */}
        <button
          onClick={onOpenNewChat}
          title="Mulai Obrolan Baru"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[#c084fc] transition active:scale-95"
        >
          <MessageSquarePlus size={20} />
        </button>

        {/* Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu Pilihan"
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[#c084fc] transition active:scale-95"
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white dark:bg-[#1f1a33] rounded-2xl shadow-2xl border border-[var(--wa-border)] py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
              <Link
                href="/media"
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
              >
                <Film size={16} className="text-[#25F4EE]" />
                <span>Media Feed TikTok</span>
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenNewGroup();
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
              >
                <Users size={16} />
                <span>Grup Baru</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
              >
                <User size={16} />
                <span>Profil Saya</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>Tema: {theme === 'dark' ? 'Terang' : 'Gelap'}</span>
              </button>

              <hr className="my-1.5 border-[var(--wa-border)]" />

              {isGuest ? (
                <Link
                  href="/login"
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-purple-500/10 text-left text-[#a78bfa] font-medium transition"
                >
                  <LogIn size={16} />
                  <span>Masuk / Daftar Akun</span>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 text-left text-red-400 transition"
                >
                  <LogOut size={16} />
                  <span>Keluar Akun</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
