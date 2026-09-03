'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { StatusDrawer } from '@/components/status/StatusDrawer';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { getCurrentUser, clearAuthCookie, saveRegisteredUserToCloud } from '@/lib/services/authService';
import { fetchUserChats, subscribeToLocalSync } from '@/lib/services/chatService';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import { usePresence } from '@/lib/hooks/usePresence';
import { AppNavigationSidebar } from '@/components/layout/AppNavigationSidebar';

export default function DardcorChatApp() {
  const router = useRouter();
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const { setChats, setMessages, activeChatId } = useChatStore();

  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Inisialisasi Realtime dan Presence terpusat
  useRealtimeChat(activeChatId);
  usePresence(activeChatId);

  useEffect(() => {
    let unsubscribeSync: (() => void) | undefined;

    const initUserAndChats = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        clearAuthCookie();
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Sinkronkan akun pengguna ke cloud database Supabase
      saveRegisteredUserToCloud(currentUser);

      // Ambil daftar chat pengguna dari Supabase Cloud / local
      const loadedChats = await fetchUserChats(currentUser.id);
      setChats(loadedChats);

      // Dengarkan event sinkronisasi antar-tab
      unsubscribeSync = subscribeToLocalSync(async (event) => {
        if (event.type === 'CHATS_UPDATED') {
          const freshChats = await fetchUserChats(currentUser.id);
          setChats(freshChats);
        }
      });

      setLoading(false);
    };

    initUserAndChats();

    return () => {
      if (unsubscribeSync) unsubscribeSync();
    };
  }, [router, setUser, setLoading, setChats, setMessages]);

  if (isLoading || !user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0d19] text-white select-none">
        <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-purple-900/50" />
        <span className="text-sm tracking-widest text-[#a78bfa] font-bold">DARDCOR MEDIA</span>
        <span className="text-xs text-[#a78bfa]/70 mt-1">Memuat obrolan & profil...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--wa-bg-app)] relative selection:bg-[#7c3aed] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 w-full h-full flex overflow-hidden relative">
        {/* Unified Navigation Sidebar on Desktop (Shared with /media) */}
        <AppNavigationSidebar />

        {/* Sidebar Container: on mobile, hidden if activeChatId is set */}
        <div
          className={`h-full ${
            activeChatId ? 'hidden md:flex' : 'flex w-full md:w-auto'
          }`}
        >
          <Sidebar onOpenStatus={() => setIsStatusOpen(true)} />
        </div>

        {/* Chat Area: on mobile, hidden if activeChatId is null */}
        <div
          className={`h-full flex-1 ${
            !activeChatId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ChatArea />
        </div>

        {/* Status Drawer */}
        <StatusDrawer
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
        />
      </div>
    </div>
  );
}
