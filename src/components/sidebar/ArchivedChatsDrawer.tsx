'use client';

import { ArrowLeft, Archive } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { ChatListItem } from './ChatListItem';

interface ArchivedChatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchivedChatsDrawer({ isOpen, onClose }: ArchivedChatsDrawerProps) {
  const { chats, activeChatId, setActiveChatId } = useChatStore();
  const archivedChats = chats.filter((chat) => chat.is_archived);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[var(--wa-bg-sidebar)] panel-slide-in">
      <header className="h-16 px-4 flex items-center gap-4 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
          title="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-base font-bold text-[var(--wa-text-primary)]">Diarsipkan</h2>
          <p className="text-[11px] text-[var(--wa-text-secondary)]">
            {archivedChats.length} obrolan disimpan
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {archivedChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center text-[var(--wa-text-secondary)]">
            <div className="w-14 h-14 rounded-full bg-[var(--wa-hover)] flex items-center justify-center">
              <Archive size={24} />
            </div>
            <p className="text-sm font-medium text-[var(--wa-text-primary)]">Belum ada obrolan diarsipkan</p>
            <p className="text-xs max-w-[220px]">
              Obrolan yang Anda arsipkan akan muncul di sini dan tetap tersembunyi dari daftar utama.
            </p>
          </div>
        ) : (
          archivedChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onSelect={() => {
                setActiveChatId(chat.id);
                onClose();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
