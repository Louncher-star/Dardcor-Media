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
  X 
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { Avatar } from '@/components/ui/Avatar';
import { logoutUser, clearAuthCookie } from '@/lib/services/authService';

interface AppNavigationSidebarProps {
  drawerOnly?: boolean;
}

export function AppNavigationSidebar({ drawerOnly = false }: AppNavigationSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { chats, isMobileSidebarOpen, setMobileSidebarOpen } = useChatStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ambil preferensi sidebar dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dardcor_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {}
  }, []);

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
    clearAuthCookie();
    router.replace('/login');
  };

  // Hitung total pesan yang belum dibaca untuk badge
  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <>
      {/* ================= DESKTOP NAVIGATION SIDEBAR (>= md) ================= */}
      {!drawerOnly && (
        <aside
          className={`hidden md:flex flex-col bg-[#100c1e] border-r border-purple-500/20 transition-all duration-300 z-30 shrink-0 select-none ${
            isCollapsed ? 'w-18 p-2.5 items-center' : 'w-56 lg:w-60 p-4'
          }`}
        >
        {/* Brand Header & Toggle Button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6 w-full`}>
          {!isCollapsed && (
            <Link href="/" className="flex flex-col min-w-0 group">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent truncate">
                Dardcor Media
              </span>
              <span className="text-[9px] text-[#c084fc] font-semibold tracking-widest uppercase">
                Feed & Chat
              </span>
            </Link>
          )}

          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-xl bg-white/5 hover:bg-purple-600/30 text-purple-300 hover:text-white transition flex items-center justify-center ${
              isCollapsed ? 'w-10 h-10' : ''
            }`}
            title={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 space-y-1.5 w-full">
          {/* TikTok Media Feed */}
          <Link
            href="/media"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
              isCollapsed ? 'justify-center px-2' : ''
            } ${
              pathname === '/media'
                ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-900/40'
                : 'text-purple-200/70 hover:text-white hover:bg-white/5'
            }`}
            title="TikTok Media Feed"
          >
            <Film size={18} className="shrink-0" />
            {!isCollapsed && <span>Media Feed</span>}
          </Link>

          {/* Chat Obrolan */}
          <Link
            href="/chat"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
              isCollapsed ? 'justify-center px-2' : ''
            } ${
              pathname === '/chat'
                ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-900/40'
                : 'text-purple-200/70 hover:text-white hover:bg-white/5'
            }`}
            title="Chat Obrolan"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="shrink-0" />
              {!isCollapsed && <span>Chat Obrolan</span>}
            </div>
            {!isCollapsed && totalUnread > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-500 text-white shadow">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Link>
        </nav>

        {/* Footer Profile & Logout */}
        <div className="pt-3 border-t border-purple-500/20 space-y-2.5 w-full">
          {/* User Card */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-[#181329] border border-purple-500/20 ${
              isCollapsed ? 'justify-center p-1.5' : ''
            }`}
            title={`@${user?.username || 'user'}`}
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
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-600/30 transition ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Keluar Akun"
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>Keluar Akun</span>}
          </button>
        </div>
      </aside>
      )}

      {/* ================= NAVIGATION DRAWER ================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer panel */}
          <div className="relative w-72 max-w-[82vw] h-full bg-[#100c1e] border-r border-purple-500/30 p-4 flex flex-col justify-between shadow-2xl z-10 select-none animate-in slide-in-from-left duration-200">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-500/20">
                <Link
                  href="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex flex-col min-w-0"
                >
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                    Dardcor Media
                  </span>
                  <span className="text-[9px] text-[#c084fc] font-semibold tracking-widest uppercase">
                    Feed & Chat
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
                  href="/media"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition ${
                    pathname === '/media'
                      ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-lg shadow-purple-900/40'
                      : 'text-purple-200/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Film size={18} className="shrink-0" />
                  <span>TikTok Media Feed</span>
                </Link>

                <Link
                  href="/chat"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-sm transition ${
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
              </nav>
            </div>

            {/* Mobile Footer Profile & Logout */}
            <div className="pt-4 border-t border-purple-500/20 space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181329] border border-purple-500/20">
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

              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-600/15 hover:bg-rose-600/30 transition border border-rose-500/20"
              >
                <LogOut size={16} />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
