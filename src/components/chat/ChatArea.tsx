'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { EmptyChatState } from './EmptyChatState';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInputBar } from './ChatInputBar';
import { usePresence } from '@/lib/hooks/usePresence';
import { fetchChatMessages, fetchUserChats, subscribeToLocalSync } from '@/lib/services/chatService';

export function ChatArea() {
  const { user } = useAuthStore();
  const { chats, setChats, activeChatId, setActiveChatId, messages, setMessages } = useChatStore();

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Presence hook for typing signal
  const { sendTypingSignal } = usePresence(activeChatId);

  // Fetch messages saat chat aktif berubah
  useEffect(() => {
    if (!activeChatId) return;

    if (!chats.some((c) => c.id === activeChatId) && user) {
      fetchUserChats(user.id).then((fresh) => {
        setChats(fresh);
      });
    }

    const loadMessages = async () => {
      const msgs = await fetchChatMessages(activeChatId);
      setMessages(activeChatId, msgs);
    };

    loadMessages();

    // Dengarkan pembaruan pesan dari tab lain
    const unsubscribe = subscribeToLocalSync((event) => {
      if (event.type === 'MESSAGES_UPDATED') {
        const payload = event.payload as { chatId: string };
        if (payload.chatId === activeChatId) {
          loadMessages();
        }
      }
    });

    return () => unsubscribe();
  }, [activeChatId, setMessages]);

  if (!activeChatId || !activeChat) {
    return (
      <main className="hidden md:flex flex-1 h-full">
        <EmptyChatState />
      </main>
    );
  }

  const currentMessages = messages[activeChatId] || [];

  return (
    <main className="flex-1 h-full flex flex-col bg-[var(--wa-chat-bg)] relative overflow-hidden z-10">
      {/* Header */}
      <ChatHeader
        chat={activeChat}
        onBack={() => setActiveChatId(null)}
      />

      {/* Message Canvas */}
      <MessageList
        messages={currentMessages}
        isGroup={activeChat.is_group}
      />

      {/* Input Bar */}
      <ChatInputBar
        chatId={activeChat.id}
        onSendTyping={sendTypingSignal}
      />
    </main>
  );
}
