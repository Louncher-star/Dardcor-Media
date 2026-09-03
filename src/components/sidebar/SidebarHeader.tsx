'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleDashed, MessageSquarePlus, MoreVertical, Moon, Sun, LogOut, Users, User, LogIn } from 'lucide-react';
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

  return (
    <header className="h-16 px-4 bg-[var(--wa-header-bg)] flex items-center justify-between border-b border-[var(--wa-border)] shrink-0 select-none backdrop-blur-md">
      {/* Left: User Avatar & App Title */}
      <div className="flex items-center gap-3">
        <div className="cursor-pointer" onClick={onOpenProfile} title="Lihat Profil">
          <Avatar
            src={user?.avatar_url}
            name={user?.display_name || user?.username || 'Saya'}
            size="md"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Dardcor Media
            </span>
            {isGuest && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Demo
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--wa-text-secondary)] truncate max-w-[130px]">
            {user?.display_name || `@${user?.username}`}
          </span>
        </div>
      </div>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-1.5 text-[var(--wa-text-secondary)]">
        {isGuest && (
          <Link
            href="/login"
            className="px-3 py-1 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-medium rounded-full shadow-md shadow-purple-900/30 transition flex items-center gap-1"
          >
            <LogIn size={13} />
            <span>Masuk</span>
          </Link>
        )}

        {/* Status / Stories */}
        <button
          onClick={onOpenStatus}
          title="Status / Cerita"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[#c084fc] transition"
        >
          <CircleDashed size={20} />
        </button>

        {/* New Chat */}
        <button
          onClick={onOpenNewChat}
          title="Mulai Obrolan Baru"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[#c084fc] transition"
        >
          <MessageSquarePlus size={20} />
        </button>

        {/* Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu"
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[#c084fc] transition"
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white dark:bg-[#1f1a33] rounded-2xl shadow-2xl border border-[var(--wa-border)] py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
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
