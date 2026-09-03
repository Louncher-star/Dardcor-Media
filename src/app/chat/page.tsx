'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { StatusDrawer } from '@/components/status/StatusDrawer';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { getCurrentUser, clearAuthCookie } from '@/lib/services/authService';
import { fetchUserChats, subscribeToLocalSync } from '@/lib/services/chatService';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import { usePresence } from '@/lib/hooks/usePresence';

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

      // Jika belum login atau sesi tidak valid, alihkan ke login
      if (!currentUser) {
        clearAuthCookie();
        setLoading(false);
        router.replace('/login');
        return;
      }

      setUser(currentUser);

      // Ambil obrolan riil milik pengguna ini
      try {
        const userChats = await fetchUserChats(currentUser.id);
        setChats(userChats);
      } catch (e) {
        console.error('Error fetching user chats:', e);
        setChats([]);
      }

      // Langganan sinkronisasi multi-tab
      unsubscribeSync = subscribeToLocalSync(async (event) => {
        if (event.type === 'CHATS_UPDATED') {
          const payload = event.payload as { userId: string };
          if (payload.userId === currentUser.id) {
            const updated = await fetchUserChats(currentUser.id);
            setChats(updated);
          }
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
