'use client';

import { useMemo } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { ChatListItem } from './ChatListItem';
import { MessageSquare, Search } from 'lucide-react';

interface ChatListProps {
  onStartNewChat: () => void;
}

export function ChatList({ onStartNewChat }: ChatListProps) {
  const { chats, activeChatId, setActiveChatId, searchQuery, chatFilter } = useChatStore();

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const chatName = chat.is_group
        ? chat.group_name || ''
        : chat.other_participant?.display_name || chat.other_participant?.username || '';

      const lastMsgContent = chat.last_message?.content || '';

      // Search query filter
      const matchesSearch =
        !searchQuery.trim() ||
        chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMsgContent.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (chatFilter === 'unread') {
        return (chat.unread_count || 0) > 0;
      }
      if (chatFilter === 'groups') {
        return chat.is_group;
      }

      return true;
    });
  }, [chats, searchQuery, chatFilter]);

  if (filteredChats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-[var(--wa-text-secondary)]">
        {searchQuery ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[var(--wa-hover)] flex items-center justify-center mb-3">
              <Search size={22} />
            </div>
            <p className="text-sm font-medium text-[var(--wa-text-primary)]">
              Tidak ada obrolan yang cocok
            </p>
            <p className="text-xs mt-1">Coba cari dengan nama atau kata kunci lain.</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3">
              <MessageSquare size={22} />
            </div>
            <p className="text-sm font-medium text-[var(--wa-text-primary)]">
              Belum ada obrolan
            </p>
            <p className="text-xs mt-1 max-w-[200px]">
              Mulai percakapan baru dengan teman atau buat grup obrolan di Dardcor Media.
            </p>
            <button
              onClick={onStartNewChat}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-medium rounded-full transition shadow-md shadow-purple-900/30"
            >
              Mulai Obrolan Baru
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-[var(--wa-border)]/20">
      {filteredChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={activeChatId === chat.id}
          onSelect={() => setActiveChatId(chat.id)}
        />
      ))}
    </div>
  );
}
