'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { StatusDrawer } from '@/components/status/StatusDrawer';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { getCurrentUser } from '@/lib/services/authService';
import { fetchUserChats, subscribeToLocalSync } from '@/lib/services/chatService';
import { DEMO_CURRENT_USER, DEMO_CHATS, DEMO_MESSAGES } from '@/lib/utils/demoData';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import { usePresence } from '@/lib/hooks/usePresence';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export default function HomePage() {
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const { setChats, setMessages, activeChatId } = useChatStore();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  // Inisialisasi Realtime dan Presence terpusat
  useRealtimeChat(activeChatId);
  usePresence(activeChatId);

  const isGuest = !user || user.id === 'usr_current_01';

  useEffect(() => {
    let unsubscribeSync: (() => void) | undefined;

    const initApp = async () => {
      setLoading(true);

      const currentUser = await getCurrentUser();

      if (currentUser) {
        // Pengguna Riil yang Sudah Login
        setUser(currentUser);
        try {
          const userChats = await fetchUserChats(currentUser.id);
          setChats(userChats);
        } catch (e) {
          console.error('Error fetching chats:', e);
          setChats([]);
        }

        // Sinkronisasi realtime multi-tab
        unsubscribeSync = subscribeToLocalSync(async (event) => {
          if (event.type === 'CHATS_UPDATED') {
            const payload = event.payload as { userId: string };
            if (payload.userId === currentUser.id) {
              const updated = await fetchUserChats(currentUser.id);
              setChats(updated);
            }
          }
        });
      } else {
        // Mode Demo Interaktif untuk Pengunjung (Landing Demo)
        setUser(DEMO_CURRENT_USER);
        setChats(DEMO_CHATS);
        Object.entries(DEMO_MESSAGES).forEach(([cId, msgs]) => {
          setMessages(cId, msgs);
        });
      }

      setLoading(false);
    };

    initApp();

    return () => {
      if (unsubscribeSync) unsubscribeSync();
    };
  }, [setUser, setLoading, setChats, setMessages]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0d19] text-white select-none">
        <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-purple-900/50" />
        <span className="text-sm tracking-widest text-[#a78bfa] font-bold">DARDCOR MEDIA</span>
        <span className="text-xs text-[#a78bfa]/70 mt-1">Menyiapkan antarmuka obrolan...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--wa-bg-app)] relative selection:bg-[#7c3aed] selection:text-white">
      {/* Top Interactive Demo Banner for Guests */}
      {isGuest && showDemoBanner && (
        <div className="bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#4338ca] text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-lg z-30 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-bold tracking-wide shrink-0">Demo Interaktif Dardcor Media</span>
            <span className="hidden sm:inline text-purple-200/90 truncate">
              • Anda sedang mencoba antarmuka web. Masuk atau daftar akun untuk menyimpan obrolan nyata Anda.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <Link
              href="/login"
              className="px-3.5 py-1 bg-white text-[#6d28d9] hover:bg-purple-50 font-bold rounded-full text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <span>Masuk / Daftar Akun</span>
              <ArrowRight size={13} />
            </Link>
            <button
              onClick={() => setShowDemoBanner(false)}
              className="p-1 hover:bg-white/10 rounded-full text-purple-200 transition"
              title="Tutup Banner"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Interface Container */}
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
