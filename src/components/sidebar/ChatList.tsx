'use client';

import { useState, useMemo } from 'react';
import { Archive, Lock, MessageSquare, Search } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { ChatListItem } from './ChatListItem';
import { LockedChatsModal } from '@/components/chat/LockedChatsModal';

interface ChatListProps {
  onStartNewChat: () => void;
  onOpenArchived: () => void;
}

export function ChatList({ onStartNewChat, onOpenArchived }: ChatListProps) {
  const { chats, activeChatId, setActiveChatId, searchQuery, chatFilter } = useChatStore();
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);

  const archivedCount = chats.filter((chat) => chat.is_archived).length;
  const lockedCount = chats.filter((chat) => chat.is_locked).length;

  const filteredChats = useMemo(() => {
    const list = chats.filter((chat) => {
      if (chat.is_archived) return false;
      if (chat.is_locked) return false;

      const chatName = chat.is_group
        ? chat.group_name || ''
        : chat.other_participant?.display_name || chat.other_participant?.username || '';

      const lastMsgContent = chat.last_message?.content || '';

      const matchesSearch =
        !searchQuery.trim() ||
        chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMsgContent.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (chatFilter === 'unread') return (chat.unread_count || 0) > 0;
      if (chatFilter === 'favorites') return Boolean(chat.is_pinned);
      if (chatFilter === 'groups') return chat.is_group;

      return true;
    });

    return list.sort((a, b) => {
      const pinnedDiff = Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned));
      if (pinnedDiff !== 0) return pinnedDiff;
      return (
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
      );
    });
  }, [chats, searchQuery, chatFilter]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tombol Obrolan Terkunci */}
      {lockedCount > 0 && chatFilter === 'all' && !searchQuery && (
        <button
          onClick={() => setIsLockedModalOpen(true)}
          className="w-full min-h-[64px] px-[13px] py-2 flex items-center gap-3 hover:bg-[var(--wa-hover)] transition text-left shrink-0 border-b border-[var(--wa-border)]/30"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/15 text-[#c084fc] flex items-center justify-center shrink-0">
            <Lock size={20} />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span className="block text-[15px] font-medium text-[var(--wa-text-primary)]">
              Obrolan Terkunci
            </span>
            <span className="min-w-[20px] h-5 px-1.5 bg-[#8b5cf6] text-white text-[11px] font-semibold rounded-full flex items-center justify-center tabular-nums">
              {lockedCount}
            </span>
          </div>
        </button>
      )}

      {archivedCount > 0 && chatFilter === 'all' && !searchQuery && (
        <button
          onClick={onOpenArchived}
          className="w-full min-h-[72px] px-[13px] py-2 flex items-center gap-3 hover:bg-[var(--wa-hover)] transition text-left shrink-0"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--wa-header-bg)] text-[var(--wa-teal)] flex items-center justify-center shrink-0">
            <Archive size={20} />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span className="block text-[15px] text-[var(--wa-text-primary)]">Diarsipkan</span>
            {archivedCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-[var(--wa-badge)] text-white text-[11px] font-semibold rounded-full flex items-center justify-center tabular-nums">
                {archivedCount}
              </span>
            )}
          </div>
        </button>
      )}

      {filteredChats.length === 0 ? (
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
                {chatFilter === 'unread'
                  ? 'Tidak ada pesan belum dibaca'
                  : chatFilter === 'groups'
                    ? 'Belum ada grup'
                    : chatFilter === 'favorites'
                      ? 'Belum ada obrolan tersemat'
                      : 'Belum ada obrolan'}
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
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onSelect={() => setActiveChatId(chat.id)}
            />
          ))}
        </div>
      )}

      {/* Modal Kunci Obrolan Rahasia */}
      <LockedChatsModal
        isOpen={isLockedModalOpen}
        onClose={() => setIsLockedModalOpen(false)}
        onSelectChat={(id) => setActiveChatId(id)}
      />
    </div>
  );
}
