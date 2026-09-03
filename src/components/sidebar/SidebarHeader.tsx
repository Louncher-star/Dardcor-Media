'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleDashed, MessageSquarePlus, MoreVertical, Moon, Sun, LogOut, Users, User } from 'lucide-react';
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
          <span className="font-bold text-sm bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
            Dardcor Media
          </span>
          <span className="text-[11px] text-[var(--wa-text-secondary)] truncate max-w-[130px]">
            {user?.display_name || `@${user?.username}`}
          </span>
        </div>
      </div>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-1 text-[var(--wa-text-secondary)]">
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

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 text-left text-red-400 transition"
              >
                <LogOut size={16} />
                <span>Keluar Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
