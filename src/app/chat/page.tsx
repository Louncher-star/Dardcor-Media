'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { StatusDrawer } from '@/components/status/StatusDrawer';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { getCurrentUser, clearAuthCookie, saveRegisteredUserToCloud } from '@/lib/services/authService';
import {
  fetchBlockedUserIds,
  fetchStarredMessageIds,
  fetchUserChats,
  subscribeToLocalSync,
} from '@/lib/services/chatService';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import { usePresence } from '@/lib/hooks/usePresence';
import { AppNavigationSidebar } from '@/components/layout/AppNavigationSidebar';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { IncomingCallModal } from '@/components/chat/IncomingCallModal';
import { CallModal } from '@/components/chat/CallModal';
import {
  subscribeToIncomingCalls,
  answerCallSession,
  rejectCallSession,
  endCallSession,
} from '@/lib/services/callService';
import { CallSession } from '@/types';
import { CircleDashed, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DardcorChatApp() {
  const router = useRouter();
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const { chats, setChats, setStarredMessageIds, setBlockedUserIds, activeChatId } = useChatStore();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeAcceptedCall, setActiveAcceptedCall] = useState<CallSession | null>(null);

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

      // Muat pesan berbintang milik pengguna
      const starred = await fetchStarredMessageIds(currentUser.id);
      setStarredMessageIds(starred);

      const blocked = await fetchBlockedUserIds(currentUser.id);
      setBlockedUserIds(blocked);

      // Dengarkan panggilan masuk secara Realtime
      const unsubscribeCalls = subscribeToIncomingCalls(currentUser.id, (call) => {
        setIncomingCall(call);
      });

      // Dengarkan event sinkronisasi antar-tab
      unsubscribeSync = subscribeToLocalSync(async (event) => {
        if (event.type === 'CHATS_UPDATED') {
          const freshChats = await fetchUserChats(currentUser.id);
          setChats(freshChats);
        }
      });

      setLoading(false);

      return () => {
        if (unsubscribeCalls) unsubscribeCalls();
      };
    };

    let cleanupCalls: (() => void) | undefined;
    initUserAndChats().then((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanupCalls = cleanup;
      }
    });

    return () => {
      if (unsubscribeSync) unsubscribeSync();
      if (cleanupCalls) cleanupCalls();
    };
  }, [router, setUser, setLoading, setChats, setStarredMessageIds, setBlockedUserIds]);

  const handleAcceptIncomingCall = async (call: CallSession) => {
    await answerCallSession(call.id);
    setIncomingCall(null);
    setActiveAcceptedCall(call);
  };

  const handleRejectIncomingCall = async (call: CallSession) => {
    await rejectCallSession(call.id);
    setIncomingCall(null);
  };

  if (isLoading || !user) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0f0d19] text-white select-none">
        <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-purple-900/50" />
        <span className="text-sm tracking-widest text-[#a78bfa] font-bold">DARDCOR MEDIA</span>
        <span className="text-xs text-[#a78bfa]/70 mt-1">Memuat obrolan & profil...</span>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-[var(--wa-bg-app)] relative selection:bg-[#7c3aed] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 w-full h-full flex overflow-hidden relative">
        {/* Navigation rail desktop */}
        <AppNavigationSidebar
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenStatus={() => setIsStatusOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Sidebar Container: on mobile, hidden if activeChatId is set */}
        <div
          className={`h-full ${
            activeChatId ? 'hidden md:flex' : 'flex w-full md:w-auto'
          }`}
        >
          <Sidebar
            onOpenSettings={() => setIsSettingsOpen(true)}
            isProfileOpen={isProfileOpen}
            onProfileOpenChange={setIsProfileOpen}
          />
        </div>

        {/* Chat Area: on mobile, hidden if activeChatId is null */}
        <div
          className={`h-full flex-1 ${
            !activeChatId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ChatArea key={activeChatId || 'no-chat'} />
        </div>

        {/* Status Drawer */}
        {isStatusOpen && (
          <StatusDrawer isOpen onClose={() => setIsStatusOpen(false)} />
        )}

        {isSettingsOpen && (
          <SettingsDrawer isOpen onClose={() => setIsSettingsOpen(false)} />
        )}

        {/* Modal Panggilan Masuk */}
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />

        {/* Modal Panggilan Aktif Setelah Diterima */}
        {activeAcceptedCall && (
          <CallModal
            isOpen={true}
            callType={activeAcceptedCall.call_type}
            contact={activeAcceptedCall.caller || null}
            chatName={
              activeAcceptedCall.caller?.display_name ||
              activeAcceptedCall.caller?.username ||
              'Panggilan Suara / Video'
            }
            onClose={() => {
              endCallSession(activeAcceptedCall.id);
              setActiveAcceptedCall(null);
            }}
          />
        )}
      </div>

      {/* Tab bawah mobile ala WhatsApp Android */}
      <nav
        className={cn(
          'md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--wa-bg-sidebar)] border-t border-[var(--wa-border)]',
          activeChatId ? 'hidden' : 'flex'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <button
          type="button"
          aria-current="page"
          className="flex-1 h-[60px] flex flex-col items-center justify-center gap-0.5"
        >
          <span className="relative w-16 h-7 rounded-full flex items-center justify-center bg-[var(--wa-rail-active)] text-[var(--wa-teal)]">
            <MessageSquare size={21} />
            {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
              <span className="absolute top-0 right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--wa-badge)] text-white text-[9px] font-bold flex items-center justify-center">
                {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 99
                  ? '99+'
                  : chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
              </span>
            )}
          </span>
          <span className="text-[11px] font-semibold text-[var(--wa-teal)]">Obrolan</span>
        </button>

        <button
          type="button"
          onClick={() => setIsStatusOpen(true)}
          className="flex-1 h-[60px] flex flex-col items-center justify-center gap-0.5"
        >
          <span className="w-16 h-7 rounded-full flex items-center justify-center text-[var(--wa-text-secondary)]">
            <CircleDashed size={21} />
          </span>
          <span className="text-[11px] text-[var(--wa-text-secondary)]">Status</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="flex-1 h-[60px] flex flex-col items-center justify-center gap-0.5"
        >
          <span className="w-16 h-7 rounded-full flex items-center justify-center text-[var(--wa-text-secondary)]">
            <Settings size={21} />
          </span>
          <span className="text-[11px] text-[var(--wa-text-secondary)]">Pengaturan</span>
        </button>
      </nav>
    </div>
  );
}
