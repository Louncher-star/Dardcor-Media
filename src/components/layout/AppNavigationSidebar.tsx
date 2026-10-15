'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Film, 
  MessageSquare, 
  PanelLeftClose, 
  PanelLeftOpen, 
  LogOut,
  Sun,
  Moon,
  X 
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { Avatar } from '@/components/ui/Avatar';
import { logoutUser, clearAuthCookie } from '@/lib/services/authService';

interface AppNavigationSidebarProps {
  drawerOnly?: boolean;
  defaultCollapsed?: boolean;
  onOpenProfile?: () => void;
}

export function AppNavigationSidebar({
  drawerOnly = false,
  defaultCollapsed = true,
  onOpenProfile,
}: AppNavigationSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { chats, theme, toggleTheme, isMobileSidebarOpen, setMobileSidebarOpen } = useChatStore();

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dardcor_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      } else if (defaultCollapsed) {
        setIsCollapsed(true);
      }
    } catch {}
  }, [defaultCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dardcor_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    clearAuthCookie();
    router.replace('/login');
  };

  // Hitung total pesan yang belum dibaca untuk badge
  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <>
      {/* ================= DESKTOP NAVIGATION RAIL (>= md) ================= */}
      {!drawerOnly && (
        <aside
          className={`hidden md:flex flex-col bg-[#0d0a18] border-r border-purple-500/20 transition-all duration-300 z-30 shrink-0 select-none ${
            isCollapsed ? 'w-16 p-2.5 items-center' : 'w-52 p-3.5'
          }`}
        >
          {/* Top: Brand Logo */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6 w-full`}>
            {isCollapsed ? (
              <Link
                href="/"
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6d28d9] via-[#8b5cf6] to-[#a855f7] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-900/40 hover:scale-105 transition-transform"
                title="Dardcor Media - Beranda"
              >
                D
              </Link>
            ) : (
              <Link href="/" className="flex flex-col min-w-0 group">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent truncate">
                  Dardcor Media
                </span>
                <span className="text-[9px] text-[#c084fc] font-semibold tracking-widest uppercase">
                  Feed & Chat
                </span>
              </Link>
            )}

            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-purple-300 hover:text-white transition flex items-center justify-center"
                title="Kecilkan Menu"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 w-full">
            {/* Chat Obrolan (WhatsApp Clone) */}
            <Link
              href="/chat"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-semibold text-xs transition relative group ${
                isCollapsed ? 'justify-center px-2' : ''
              } ${
                pathname === '/chat'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-900/50'
                  : 'text-purple-200/70 hover:text-white hover:bg-white/5'
              }`}
              title="Chat Obrolan (WhatsApp)"
            >
              <div className="relative">
                <MessageSquare size={20} className="shrink-0" />
                {isCollapsed && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#0d0a18]" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Obrolan</span>
                  {totalUnread > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-500 text-white shadow">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </div>
              )}
            </Link>

            {/* TikTok Media Feed */}
            <Link
              href="/media"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-semibold text-xs transition group ${
                isCollapsed ? 'justify-center px-2' : ''
              } ${
                pathname === '/media'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-900/50'
                  : 'text-purple-200/70 hover:text-white hover:bg-white/5'
              }`}
              title="Media Feed (TikTok)"
            >
              <Film size={20} className="shrink-0 text-[#25F4EE] group-hover:scale-105 transition-transform" />
              {!isCollapsed && <span>TikTok Feed</span>}
            </Link>
          </nav>

          {/* Bottom Actions: Theme Toggle, User Avatar, Logout */}
          <div className="pt-3 border-t border-purple-500/20 space-y-2.5 w-full flex flex-col items-center">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-purple-300 hover:text-white hover:bg-white/5 transition ${
                isCollapsed ? 'justify-center p-2' : ''
              }`}
              title={`Beralih ke Mode ${theme === 'dark' ? 'Terang' : 'Gelap'}`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {!isCollapsed && <span>Mode {theme === 'dark' ? 'Terang' : 'Gelap'}</span>}
            </button>

            {/* User Profile Avatar / Card */}
            <div
              onClick={() => onOpenProfile && onOpenProfile()}
              className={`w-full flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-white/5 cursor-pointer transition ${
                isCollapsed ? 'justify-center' : 'bg-[#181329] border border-purple-500/20 px-2.5 py-2'
              }`}
              title={`Profil: ${user?.display_name || user?.username || 'Saya'}`}
            >
              <Avatar src={user?.avatar_url} name={user?.display_name || user?.username || 'Saya'} size="sm" />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-white truncate">
                    {user?.display_name || user?.username}
                  </span>
                  <span className="text-[10px] text-purple-300/80 truncate">
                    @{user?.username}
                  </span>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-600/30 transition ${
                isCollapsed ? 'justify-center p-2' : 'px-3 py-2'
              }`}
              title="Keluar Akun"
            >
              <LogOut size={16} className="shrink-0" />
              {!isCollapsed && <span>Keluar</span>}
            </button>
          </div>
        </aside>
      )}

      {/* ================= MOBILE NAVIGATION DRAWER (< md) ================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer panel */}
          <div className="relative w-72 max-w-[82vw] h-full bg-[#100c1e] border-r border-purple-500/30 p-4 flex flex-col justify-between shadow-2xl z-10 select-none animate-in slide-in-from-left duration-200">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-500/20">
                <Link
                  href="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d28d9] to-[#a855f7] flex items-center justify-center text-white font-bold text-sm shadow">
                    D
                  </div>
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                    Dardcor Media
                  </span>
                </Link>

                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition"
                  title="Tutup Menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="space-y-2">
                <Link
                  href="/chat"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition ${
                    pathname === '/chat'
                      ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-900/40'
                      : 'text-purple-200/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="shrink-0" />
                    <span>Chat Obrolan</span>
                  </div>
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>

                <Link
                  href="/media"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-semibold text-sm transition ${
                    pathname === '/media'
                      ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-900/40'
                      : 'text-purple-200/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Film size={18} className="shrink-0 text-[#25F4EE]" />
                  <span>TikTok Media Feed</span>
                </Link>
              </nav>
            </div>

            {/* Mobile Footer Profile & Logout */}
            <div className="pt-4 border-t border-purple-500/20 space-y-3">
              <div
                onClick={() => {
                  setMobileSidebarOpen(false);
                  if (onOpenProfile) onOpenProfile();
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#181329] border border-purple-500/20 cursor-pointer hover:bg-white/5 transition"
              >
                <Avatar
                  src={user?.avatar_url}
                  name={user?.display_name || user?.username || 'Saya'}
                  size="md"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.display_name || user?.username}
                  </span>
                  <span className="text-[10px] text-purple-300/80 truncate">
                    @{user?.username}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-purple-200 bg-white/5 hover:bg-white/10 transition border border-purple-500/20"
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  <span>{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
                </button>

                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-600/15 hover:bg-rose-600/30 transition border border-rose-500/20"
                >
                  <LogOut size={15} />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
